from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Message
from .serializers import MessageSerializer
import json

channel_layer = get_channel_layer()


@receiver(post_save, sender=Message)
def send_message_via_websocket(sender, instance, created, **kwargs):
    """Envia mensagem via WebSocket quando uma nova mensagem é criada"""
    if not created:
        return  # Só enviar quando mensagem é criada, não quando atualizada
    
    if not channel_layer:
        return  # Se não há channel_layer configurado, pular
    
    try:
        # Serializar mensagem
        serializer = MessageSerializer(instance)
        message_data = serializer.data
        
        # Nome do grupo da conversa
        group_name = f'chat_{instance.conversation.id}'
        
        # Enviar para todos os participantes da conversa
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'new_message',
                'message': message_data,
                'conversation_id': str(instance.conversation.id)
            }
        )
    except Exception as e:
        # Logar erro mas não quebrar o fluxo
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f'Erro ao enviar mensagem via WebSocket: {e}', exc_info=True)
