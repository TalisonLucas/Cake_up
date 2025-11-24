from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
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
    
    def get_queryset(self):
        # Usuários veem apenas seus pedidos
        # Operadores e admins veem todos
        user = self.request.user
        if user.is_staff or user.role in ['OPERATOR', 'ADMIN']:
            return Order.objects.all()
        return Order.objects.filter(user=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrderUpdateSerializer
        return OrderSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancelar um pedido (apenas se alterável)"""
        order = self.get_object()
        
        if not order.can_alter():
            return Response(
                {"error": "Este pedido não pode mais ser cancelado."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = OrderStatus.CANCELADO if hasattr(OrderStatus, 'CANCELADO') else OrderStatus.AGUARDANDO_CONFIRMACAO
        order.save()
        
        return Response({"message": "Pedido cancelado com sucesso."})
    
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
