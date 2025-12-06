from typing import List, Dict, Any
from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    """Serializer para mensagens"""
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'sender_name', 'sender_username',
            'content', 'timestamp', 'is_read', 'read_at'
        ]
        read_only_fields = ['id', 'sender', 'timestamp', 'is_read', 'read_at']


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer para conversas"""
    participants_details = serializers.SerializerMethodField()
    last_message = MessageSerializer(source='get_last_message', read_only=True)
    unread_count = serializers.SerializerMethodField()
    conversation_type_display = serializers.CharField(source='get_conversation_type_display', read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'participants_details', 'conversation_type',
            'conversation_type_display', 'last_message', 'unread_count',
            'created_at', 'updated_at'
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


class ConversationCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de conversas"""
    
    class Meta:
        model = Conversation
        fields = ['conversation_type', 'participants']



