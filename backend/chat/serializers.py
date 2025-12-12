from typing import List, Dict, Any
from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    """Serializer para mensagens"""
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'sender_name', 'sender_username', 'sender_role',
            'content', 'timestamp', 'is_read', 'read_at'
        ]
        read_only_fields = ['id', 'sender', 'timestamp', 'is_read', 'read_at']


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer para conversas"""
    participants_details = serializers.SerializerMethodField()
    last_message = MessageSerializer(source='get_last_message', read_only=True)
    unread_count = serializers.SerializerMethodField()
    conversation_type_display = serializers.CharField(source='get_conversation_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    order_details = serializers.SerializerMethodField()
    assigned_operator_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'participants_details', 'conversation_type',
            'conversation_type_display', 'last_message', 'unread_count',
            'order', 'order_details', 'assigned_operator', 'assigned_operator_details',
            'status', 'status_display', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_participants_details(self, obj: Conversation) -> List[Dict[str, Any]]:
        return [
            {
                'id': p.id,
                'username': p.username,
                'full_name': p.get_full_name(),
                'role': p.role
            }
            for p in obj.participants.all()
        ]
    
    def get_unread_count(self, obj: Conversation) -> int:
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0
    
    def get_order_details(self, obj: Conversation) -> Dict[str, Any] | None:
        """Retorna detalhes do pedido relacionado"""
        if not obj.order:
            return None
        return {
            'id': obj.order.id,
            'status': obj.order.status,
            'status_display': obj.order.get_status_display(),
            'total': str(obj.order.total),
            'user_name': obj.order.user.get_full_name() or obj.order.user.username
        }
    
    def get_assigned_operator_details(self, obj: Conversation) -> Dict[str, Any] | None:
        """Retorna detalhes do operador atribuído"""
        if not obj.assigned_operator:
            return None
        return {
            'id': obj.assigned_operator.id,
            'username': obj.assigned_operator.username,
            'full_name': obj.assigned_operator.get_full_name(),
            'role': obj.assigned_operator.role
        }


class ConversationCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de conversas"""
    
    class Meta:
        model = Conversation
        fields = ['conversation_type', 'participants', 'order']


class ConversationCreateFromOrderSerializer(serializers.Serializer):
    """Serializer para criar conversa a partir de um pedido"""
    order_id = serializers.IntegerField()
    
    def validate_order_id(self, value):
        """Valida se o pedido existe"""
        from orders.models import Order
        try:
            order = Order.objects.get(id=value)
        except Order.DoesNotExist:
            raise serializers.ValidationError("Pedido não encontrado.")
        return value



