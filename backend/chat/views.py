from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, ConversationCreateSerializer, MessageSerializer
)


@extend_schema(
    parameters=[
        OpenApiParameter('id', int, OpenApiParameter.PATH, description='ID da conversa')
    ]
)
class ConversationViewSet(viewsets.ModelViewSet):
    """ViewSet para conversas"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['conversation_type']
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Conversation.objects.none()
        # Usuário vê apenas conversas das quais participa
        return Conversation.objects.filter(participants=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ConversationCreateSerializer
        return ConversationSerializer
    
    def perform_create(self, serializer):
        conversation = serializer.save()
        # Adicionar o usuário atual aos participantes se não estiver
        if self.request.user not in conversation.participants.all():
            conversation.participants.add(self.request.user)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Listar mensagens de uma conversa"""
        conversation = self.get_object()
        messages = conversation.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """Enviar uma mensagem na conversa"""
        conversation = self.get_object()
        
        # Verificar se o usuário é participante
        if request.user not in conversation.participants.all():
            return Response(
                {"error": "Você não é participante desta conversa."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        content = request.data.get('content')
        if not content:
            return Response(
                {"error": "Conteúdo da mensagem é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content
        )
        
        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_all_read(self, request, pk=None):
        """Marcar todas as mensagens como lidas"""
        conversation = self.get_object()
        
        # Marcar como lidas todas as mensagens que não são do usuário atual
        messages = conversation.messages.filter(is_read=False).exclude(sender=request.user)
        for message in messages:
            message.mark_as_read()
        
        return Response({"message": f"{messages.count()} mensagens marcadas como lidas."})


@extend_schema(
    parameters=[
        OpenApiParameter('id', int, OpenApiParameter.PATH, description='ID da mensagem')
    ]
)
class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para mensagens (apenas leitura direta)"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Message.objects.none()
        # Usuário vê apenas mensagens de conversas das quais participa
        user_conversations = Conversation.objects.filter(participants=self.request.user)
        return Message.objects.filter(conversation__in=user_conversations)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Marcar uma mensagem como lida"""
        message = self.get_object()
        
        # Não pode marcar próprias mensagens como lidas
        if message.sender == request.user:
            return Response(
                {"error": "Você não pode marcar suas próprias mensagens como lidas."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message.mark_as_read()
        serializer = self.get_serializer(message)
        return Response(serializer.data)
