from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from orders.models import Order
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer, ConversationCreateSerializer, MessageSerializer,
    ConversationCreateFromOrderSerializer
)

User = get_user_model()
channel_layer = get_channel_layer()


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
        
        user = self.request.user
        user_role = getattr(user, 'role', None)
        
        # Clientes: apenas conversas onde são participantes (CLIENT_ESTABLISHMENT com seus pedidos)
        if user_role == 'CLIENT':
            return Conversation.objects.filter(participants=user)
        
        # Operadores: todas as conversas relacionadas a pedidos (CLIENT_ESTABLISHMENT) + conversas com administradores (OPERATOR_ADMIN)
        elif user_role == 'OPERATOR':
            return Conversation.objects.filter(
                participants=user
            ).filter(
                conversation_type__in=[
                    Conversation.ConversationType.CLIENT_ESTABLISHMENT,
                    Conversation.ConversationType.OPERATOR_ADMIN
                ]
            )
        
        # Administradores: todas as conversas
        elif user_role == 'ADMIN' or user.is_staff:
            return Conversation.objects.all()
        
        # Fallback: apenas conversas onde são participantes
        return Conversation.objects.filter(participants=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ConversationCreateSerializer
        elif self.action == 'create_from_order':
            return ConversationCreateFromOrderSerializer
        return ConversationSerializer
    
    def perform_create(self, serializer):
        user = self.request.user
        user_role = getattr(user, 'role', None)
        
        # Validar que operadores só podem criar conversas CLIENT_ESTABLISHMENT com pedido ou OPERATOR_ADMIN
        if user_role == 'OPERATOR':
            conversation_type = serializer.validated_data.get('conversation_type')
            order = serializer.validated_data.get('order')
            
            if conversation_type == Conversation.ConversationType.CLIENT_ESTABLISHMENT and not order:
                raise serializers.ValidationError(
                    "Operadores devem fornecer um pedido ao criar conversas Cliente-Estabelecimento."
                )
        
        conversation = serializer.save()
        # Adicionar o usuário atual aos participantes se não estiver
        if user not in conversation.participants.all():
            conversation.participants.add(user)
    
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
        
        serializer = MessageSerializer(message, context={'request': request})
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
    
    @action(detail=False, methods=['post'])
    def create_from_order(self, request):
        """Criar conversa a partir de um pedido (pode ser chamado por cliente ou operador)"""
        serializer = ConversationCreateFromOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order_id = serializer.validated_data['order_id']
        
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {"error": "Pedido não encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        user = request.user
        user_role = getattr(user, 'role', None)
        
        # Verificar se já existe conversa para este pedido
        existing_conversation = Conversation.objects.filter(
            order=order,
            conversation_type=Conversation.ConversationType.CLIENT_ESTABLISHMENT
        ).first()
        
        if existing_conversation:
            # Se já existe, adicionar usuário aos participantes se não estiver
            if user not in existing_conversation.participants.all():
                existing_conversation.participants.add(user)
            serializer_response = ConversationSerializer(
                existing_conversation,
                context={'request': request}
            )
            return Response(serializer_response.data)
        
        # Criar nova conversa
        conversation = Conversation.objects.create(
            conversation_type=Conversation.ConversationType.CLIENT_ESTABLISHMENT,
            order=order,
            status=Conversation.ConversationStatus.OPEN
        )
        
        # Adicionar cliente do pedido e usuário atual aos participantes
        conversation.participants.add(order.user)
        if user != order.user:
            conversation.participants.add(user)
        
        # Se o usuário é operador, atribuir automaticamente
        if user_role == 'OPERATOR':
            conversation.assigned_operator = user
            conversation.save()
        
        serializer_response = ConversationSerializer(
            conversation,
            context={'request': request}
        )
        return Response(serializer_response.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def assign_operator(self, request, pk=None):
        """Atribuir operador a uma conversa"""
        conversation = self.get_object()
        user = request.user
        user_role = getattr(user, 'role', None)
        
        # Apenas administradores podem atribuir operadores
        if user_role != 'ADMIN' and not user.is_staff:
            return Response(
                {"error": "Apenas administradores podem atribuir operadores."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        operator_id = request.data.get('operator_id')
        if not operator_id:
            return Response(
                {"error": "operator_id é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            operator = User.objects.get(id=operator_id, role='OPERATOR')
        except User.DoesNotExist:
            return Response(
                {"error": "Operador não encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        conversation.assigned_operator = operator
        # Adicionar operador aos participantes se não estiver
        if operator not in conversation.participants.all():
            conversation.participants.add(operator)
        conversation.save()
        
        # Notificar via WebSocket
        if channel_layer:
            try:
                group_name = f'chat_{conversation.id}'
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        'type': 'operator_assigned',
                        'conversation_id': str(conversation.id),
                        'operator_id': str(operator.id),
                        'operator_name': operator.get_full_name() or operator.username
                    }
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Erro ao notificar atribuição de operador via WebSocket: {e}', exc_info=True)
        
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def call_admin(self, request, pk=None):
        """Operador chama administrador (cria/abre conversa OPERATOR_ADMIN)"""
        conversation = self.get_object()
        user = request.user
        user_role = getattr(user, 'role', None)
        
        # Apenas operadores podem chamar administrador
        if user_role != 'OPERATOR':
            return Response(
                {"error": "Apenas operadores podem chamar administrador."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Buscar um administrador
        admin = User.objects.filter(role='ADMIN').first()
        if not admin:
            admin = User.objects.filter(is_staff=True).first()
        
        if not admin:
            return Response(
                {"error": "Nenhum administrador encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar se já existe conversa OPERATOR_ADMIN entre este operador e admin
        existing_conversation = Conversation.objects.filter(
            conversation_type=Conversation.ConversationType.OPERATOR_ADMIN,
            participants=user
        ).filter(participants=admin).first()
        
        if existing_conversation:
            serializer = ConversationSerializer(
                existing_conversation,
                context={'request': request}
            )
            return Response(serializer.data)
        
        # Criar nova conversa OPERATOR_ADMIN
        new_conversation = Conversation.objects.create(
            conversation_type=Conversation.ConversationType.OPERATOR_ADMIN,
            status=Conversation.ConversationStatus.OPEN
        )
        new_conversation.participants.add(user, admin)
        
        # Notificar via WebSocket
        if channel_layer:
            try:
                group_name = f'chat_{new_conversation.id}'
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        'type': 'admin_called',
                        'conversation_id': str(new_conversation.id),
                        'operator_id': str(user.id),
                        'operator_name': user.get_full_name() or user.username
                    }
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Erro ao notificar chamada de admin via WebSocket: {e}', exc_info=True)
        
        serializer = ConversationSerializer(
            new_conversation,
            context={'request': request}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_resolved(self, request, pk=None):
        """Marcar conversa como resolvida"""
        conversation = self.get_object()
        user = request.user
        user_role = getattr(user, 'role', None)
        
        # Apenas operadores e administradores podem marcar como resolvida
        if user_role not in ['OPERATOR', 'ADMIN'] and not user.is_staff:
            return Response(
                {"error": "Apenas operadores e administradores podem marcar conversa como resolvida."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        conversation.status = Conversation.ConversationStatus.RESOLVED
        conversation.save()
        
        # Notificar via WebSocket
        if channel_layer:
            try:
                group_name = f'chat_{conversation.id}'
                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {
                        'type': 'conversation_status_changed',
                        'conversation_id': str(conversation.id),
                        'status': conversation.status
                    }
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Erro ao notificar mudança de status via WebSocket: {e}', exc_info=True)
        
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data)


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
