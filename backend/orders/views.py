from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.utils import timezone
from .models import Order, OrderStatus
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderUpdateSerializer,
    ValidateDeliveryCodeSerializer
)


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet para pedidos"""
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['created_at', 'total']
    ordering = ['-created_at']
    
    def _cancel_expired_orders(self, queryset):
        """Cancela automaticamente pedidos que passaram do prazo de 5 minutos"""
        now = timezone.now()
        expired_orders = queryset.filter(
            status=OrderStatus.AGUARDANDO_CONFIRMACAO,
            alterable_until__lt=now
        )
        
        if expired_orders.exists():
            expired_orders.update(status=OrderStatus.CANCELADO)
        
        return queryset
    
    def get_queryset(self):
        # Usuários veem apenas seus pedidos
        # Operadores e admins veem todos
        user = self.request.user
        if user.is_staff or user.role in ['OPERATOR', 'ADMIN']:
            queryset = Order.objects.all()
        else:
            queryset = Order.objects.filter(user=user)
        
        # Cancela automaticamente pedidos expirados antes de retornar
        self._cancel_expired_orders(queryset)
        
        return queryset
    
    def get_object(self):
        """Sobrescreve para cancelar pedido expirado antes de retornar"""
        obj = super().get_object()
        
        # Verifica se o pedido expirado e cancela automaticamente
        if (
            obj.status == OrderStatus.AGUARDANDO_CONFIRMACAO
            and obj.alterable_until
            and timezone.now() >= obj.alterable_until
        ):
            obj.status = OrderStatus.CANCELADO
            obj.save(update_fields=['status'])
        
        return obj
    
    def get_serializer_class(self):
        # Usamos OrderCreateSerializer apenas para validação da entrada;
        # para respostas, sempre retornamos OrderSerializer.
        if self.action in ['update', 'partial_update']:
            return OrderUpdateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        """Cria pedido usando OrderCreateSerializer para entrada e OrderSerializer para saída."""
        create_serializer = OrderCreateSerializer(data=request.data)
        create_serializer.is_valid(raise_exception=True)
        order = create_serializer.save(user=request.user)
        
        read_serializer = OrderSerializer(order, context=self.get_serializer_context())
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancelar um pedido
        
        Regras:
        - Pedidos em AGUARDANDO_CONFIRMACAO (dentro do prazo): qualquer usuário pode cancelar
        - Pedidos em ACEITO ou superior: apenas ADMIN pode cancelar
        """
        order = self.get_object()  # Já cancela automaticamente se expirado
        user = request.user
        
        # Se já foi cancelado, informar
        if order.status == OrderStatus.CANCELADO:
            # Verifica se foi cancelado automaticamente (passou do prazo)
            if order.alterable_until and timezone.now() >= order.alterable_until:
                return Response(
                    {
                        "error": (
                            "Este pedido foi cancelado automaticamente, pois não foi "
                            "aceito pelo operador dentro de 5 minutos."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"error": "Este pedido já foi cancelado."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Se o pedido está em AGUARDANDO_CONFIRMACAO e ainda pode ser alterado
        # (dentro do prazo de 5 minutos), qualquer um pode cancelar
        if order.status == OrderStatus.AGUARDANDO_CONFIRMACAO and order.can_alter():
            order.status = OrderStatus.CANCELADO
            order.save(update_fields=['status'])
            return Response({"message": "Pedido cancelado com sucesso."})
        
        # Se o pedido já foi aceito ou está em status superior,
        # apenas ADMIN pode cancelar
        if order.status != OrderStatus.AGUARDANDO_CONFIRMACAO:
            # Verificar se é admin
            if not (user.is_staff or user.role == 'ADMIN'):
                return Response(
                    {
                        "error": (
                            "Apenas administradores podem cancelar pedidos que já foram aceitos. "
                            "Entre em contato com um administrador."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Admin pode cancelar qualquer pedido (exceto já cancelado ou pago)
            if order.status == OrderStatus.PAGO:
                return Response(
                    {"error": "Não é possível cancelar um pedido que já foi pago."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            order.status = OrderStatus.CANCELADO
            order.save(update_fields=['status'])
            return Response({"message": "Pedido cancelado com sucesso pelo administrador."})
        
        # Se chegou aqui, o pedido está em AGUARDANDO_CONFIRMACAO mas passou do prazo
        # (já foi cancelado automaticamente pelo get_object)
        return Response(
            {"error": "Este pedido não pode mais ser cancelado."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Atualizar status do pedido (apenas operadores/admins)"""
        user = request.user
        if not (user.is_staff or user.role in ['OPERATOR', 'ADMIN']):
            return Response(
                {"error": "Você não tem permissão para atualizar o status."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        order = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in OrderStatus.values:
            return Response(
                {"error": "Status inválido."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = new_status
        order.save()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def validate_delivery_code(self, request, pk=None):
        """Validar código de entrega"""
        order = self.get_object()
        
        if not hasattr(order, 'delivery_code'):
            return Response(
                {"error": "Este pedido não possui código de entrega."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ValidateDeliveryCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        code = serializer.validated_data['code']
        delivery_code = order.delivery_code
        
        if delivery_code.validate_code(code):
            return Response({"message": "Código validado com sucesso! Pagamento confirmado."})
        else:
            remaining_attempts = 3 - delivery_code.attempts
            if remaining_attempts > 0:
                return Response(
                    {
                        "error": "Código inválido.",
                        "remaining_attempts": remaining_attempts
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {"error": "Número máximo de tentativas excedido."},
                    status=status.HTTP_400_BAD_REQUEST
                )
