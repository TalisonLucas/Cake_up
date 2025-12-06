from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging
from .models import Order, DeliveryCode, OrderStatus
from .serializers import OrderSerializer

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Order)
def track_status_change(sender, instance, **kwargs):
    """Rastreia mudança de status antes de salvar"""
    if instance.pk:
        try:
            old_instance = Order.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except Order.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Order)
def create_delivery_code_on_status_change(sender, instance, created, **kwargs):
    """
    Criar código de entrega quando o pedido for marcado como LIBERADO
    e enviar notificações WebSocket quando status mudar
    """
    # Criar código de entrega se necessário
    if not created and instance.status == OrderStatus.LIBERADO:
        # Verificar se já existe um código de entrega
        if not hasattr(instance, 'delivery_code') or not instance.delivery_code:
            try:
                DeliveryCode.objects.create(order=instance)
            except Exception as e:
                logger.error(f'Erro ao criar delivery_code: {e}', exc_info=True)
    
    # Enviar notificação WebSocket se status mudou OU se é um novo pedido
    old_status = getattr(instance, '_old_status', None)
    
    # Disparar notificação se:
    # 1. É um novo pedido (created=True)
    # 2. OU o status mudou (old_status != instance.status)
    should_notify = created or (old_status is not None and old_status != instance.status)
    
    if should_notify:
        try:
            send_order_status_notification(instance, created)
        except Exception as e:
            # Log do erro mas não quebra o fluxo
            logger.error(f'Erro ao enviar notificação WebSocket: {e}', exc_info=True)


def send_order_status_notification(order, is_new=False):
    """Envia notificação WebSocket sobre mudança de status do pedido"""
    channel_layer = get_channel_layer()
    if not channel_layer:
        logger.warning('Channel layer não configurado. WebSocket não funcionará.')
        return
    
    try:
        # Recarregar o pedido do banco para garantir que temos os dados mais recentes
        order.refresh_from_db()
        
        # Serializar pedido completo usando o serializer (já inclui todos os campos necessários)
        serializer = OrderSerializer(order)
        order_data = serializer.data
        
        # Adicionar campos adicionais que o frontend espera
        # Enviar status no formato do backend (não mapeado) - o frontend vai mapear
        formatted_order = {
            **order_data,  # Incluir todos os dados do serializer
            'id': str(order.id),  # Garantir que é string
            'number': f'#CKP{str(order.id).zfill(10)}',  # Adicionar número formatado
            'status': order.status,  # Status no formato backend (AGUARDANDO_CONFIRMACAO, etc.)
            'user': str(order.user.id),  # Garantir que user é string
        }
        
        message_type = 'order_created' if is_new else 'order_status_update'
        message_text = 'Novo pedido criado' if is_new else f'Status do pedido atualizado para {order.get_status_display()}'
        
        # Para novos pedidos: enviar apenas para operadores/admins (orders_global)
        # Cliente não precisa receber notificação de seu próprio pedido criado
        if is_new:
            # Notificar apenas operadores e admins
            async_to_sync(channel_layer.group_send)(
                'orders_global',
                {
                    'type': message_type,
                    'order': formatted_order,
                    'message': message_text
                }
            )
            logger.info(f'Notificação WebSocket enviada: {message_type} para pedido {order.id} (apenas operadores/admins)')
        else:
            # Para mudanças de status: notificar cliente E operadores/admins
            # Notificar o dono do pedido
            async_to_sync(channel_layer.group_send)(
                f'user_{order.user.id}',
                {
                    'type': message_type,
                    'order': formatted_order,
                    'message': message_text
                }
            )
            
            # Notificar operadores e admins (grupo global)
            async_to_sync(channel_layer.group_send)(
                'orders_global',
                {
                    'type': message_type,
                    'order': formatted_order,
                    'message': message_text
                }
            )
            
            logger.info(f'Notificação WebSocket enviada: {message_type} para pedido {order.id} (cliente e operadores/admins)')
        
    except Exception as e:
        logger.error(f'Erro ao enviar notificação WebSocket para pedido {order.id}: {e}', exc_info=True)


