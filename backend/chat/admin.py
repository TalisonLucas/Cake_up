from django.contrib import admin
from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    """Inline para mensagens"""
    model = Message
    extra = 0
    readonly_fields = ['sender', 'content', 'timestamp', 'is_read', 'read_at']
    can_delete = False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    """Admin para conversas"""
    list_display = ['id', 'conversation_type', 'get_participants', 'created_at', 'updated_at']
    list_filter = ['conversation_type', 'created_at']
    search_fields = ['participants__username', 'participants__email']
    ordering = ['-updated_at']
    inlines = [MessageInline]
    
    def get_participants(self, obj):
        return ', '.join([p.username for p in obj.participants.all()])
    get_participants.short_description = 'Participantes'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Admin para mensagens"""
    list_display = ['id', 'conversation', 'sender', 'content_preview', 'timestamp', 'is_read']
    list_filter = ['is_read', 'timestamp']
    search_fields = ['sender__username', 'content']
    ordering = ['-timestamp']
    readonly_fields = ['timestamp', 'read_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Conteúdo'
