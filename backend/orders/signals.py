from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Order, DeliveryCode, OrderStatus
from .serializers import OrderSerializer


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
        if not hasattr(instance, 'delivery_code'):
            DeliveryCode.objects.create(order=instance)
    
    # Enviar notificação WebSocket se status mudou
    old_status = getattr(instance, '_old_status', None)
    if old_status is not None and old_status != instance.status:
        send_order_status_notification(instance, created)


def map_backend_status_to_frontend(backend_status):
    """Mapeia status do backend para o formato do frontend"""
    status_map = {
        'AGUARDANDO_CONFIRMACAO': 'aguardando',
        'ACEITO': 'aceito',
        'EM_PRODUCAO': 'producao',
        'LIBERADO': 'liberado',
        'PAGO': 'pago',
        'CANCELADO': 'cancelado',
    }
    return status_map.get(backend_status, 'aguardando')


def send_order_status_notification(order, is_new=False):
    """Envia notificação WebSocket sobre mudança de status do pedido"""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    
    # Serializar pedido completo usando o serializer
    serializer = OrderSerializer(order)
    order_data = serializer.data
    
    # Formatar dados do pedido no formato esperado pelo frontend (compatível com mapOrderFromBackend)
    formatted_order = {
        'id': str(order.id),
        'number': f'#CKP{str(order.id).zfill(10)}',
        'status': map_backend_status_to_frontend(order.status),
        'total': float(order.total),
        'delivery_street': order.delivery_street,
        'delivery_number': order.delivery_number,
        'delivery_city': order.delivery_city,
        'delivery_state': order.delivery_state,
        'delivery_zipcode': order.delivery_zipcode or '',
        'delivery_neighborhood': order.delivery_neighborhood,
        'delivery_complement': order.delivery_complement or '',
        'observations': order.observations or '',
        'created_at': order.created_at.isoformat(),
        'updated_at': order.updated_at.isoformat(),
        'alterable_until': order.alterable_until.isoformat() if order.alterable_until else None,
        'user': str(order.user.id),
        'user_name': order.user.get_full_name() or order.user.username,
        'delivery_code': {
            'code': order.delivery_code.code,
            'generated_at': order.delivery_code.generated_at.isoformat(),
            'expires_at': order.delivery_code.expires_at.isoformat(),
            'attempts': order.delivery_code.attempts,
            'validated': order.delivery_code.validated,
            'validated_at': order.delivery_code.validated_at.isoformat() if order.delivery_code.validated_at else None,
        } if hasattr(order, 'delivery_code') and order.delivery_code else None,
        'items': order_data.get('items', []),  # Usar items serializados do serializer
    }
    
    message_type = 'order_created' if is_new else 'order_status_update'
    message_text = 'Novo pedido criado' if is_new else f'Status do pedido atualizado para {order.get_status_display()}'
    
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


