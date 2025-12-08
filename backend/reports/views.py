from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from config.permissions import IsOperatorOrAdmin
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from orders.models import Order, OrderStatus, OrderItem
from products.models import Product, CupcakeComponent
from accounts.models import CustomUser
from .serializers import (
    DashboardStatsSerializer, SalesReportSerializer, ProductPerformanceSerializer,
    OperatorPerformanceSerializer, CustomerStatsSerializer
)


class DashboardStatsView(GenericAPIView):
    """Estatísticas do dashboard"""
    permission_classes = [IsOperatorOrAdmin]
    serializer_class = DashboardStatsSerializer
    
    def get(self, request):
        today = timezone.now().date()
        
        # Pedidos de hoje
        today_orders = Order.objects.filter(created_at__date=today)
        
        # Estatísticas gerais
        stats = {
            'orders_today': today_orders.count(),
            'orders_awaiting': Order.objects.filter(status=OrderStatus.AGUARDANDO_CONFIRMACAO).count(),
            'orders_in_production': Order.objects.filter(status=OrderStatus.EM_PRODUCAO).count(),
            'orders_ready': Order.objects.filter(status=OrderStatus.LIBERADO).count(),
            'orders_completed_today': today_orders.filter(status=OrderStatus.PAGO).count(),
            'revenue_today': float(today_orders.filter(status=OrderStatus.PAGO).aggregate(
                total=Sum('total')
            )['total'] or 0),
            'total_clients': CustomUser.objects.filter(role='CLIENT').count(),
        }
        
        # Status breakdown
        stats['orders_by_status'] = {
            status[0]: Order.objects.filter(status=status[0]).count()
            for status in OrderStatus.choices
        }
        
        return Response(stats)


class SalesReportView(GenericAPIView):
    """Relatório de vendas"""
    permission_classes = [IsOperatorOrAdmin]
    serializer_class = SalesReportSerializer
    
    def get(self, request):
        # Parâmetros de filtro
        period = request.query_params.get('period', '7')  # dias
        try:
            days = int(period)
        except ValueError:
            days = 7
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Pedidos no período
        orders = Order.objects.filter(created_at__gte=start_date, status=OrderStatus.PAGO)
        
        # Estatísticas
        report = {
            'period_days': days,
            'start_date': start_date,
            'end_date': timezone.now(),
            'total_orders': orders.count(),
            'total_revenue': orders.aggregate(total=Sum('total'))['total'] or 0,
            'average_order_value': orders.aggregate(avg=Avg('total'))['avg'] or 0,
        }
        
        # Vendas por dia
        sales_by_day = []
        for i in range(days):
            date = (timezone.now() - timedelta(days=i)).date()
            day_orders = orders.filter(created_at__date=date)
            sales_by_day.append({
                'date': date,
                'orders': day_orders.count(),
                'revenue': day_orders.aggregate(total=Sum('total'))['total'] or 0
            })
        
        report['sales_by_day'] = sales_by_day
        
        return Response(report)


class ProductPerformanceView(GenericAPIView):
    """Relatório de performance de produtos"""
    permission_classes = [IsOperatorOrAdmin]
    serializer_class = ProductPerformanceSerializer
    
    def get(self, request):
        # Produtos mais vendidos
        top_products = OrderItem.objects.filter(
            order__status=OrderStatus.PAGO,
            product_type='PRODUCT'
        ).values(
            'product__name', 'product__id'
        ).annotate(
            quantity_sold=Sum('quantity'),
            revenue=Sum('subtotal')
        ).order_by('-quantity_sold')[:10]
        
        # Componentes de cupcake mais usados
        custom_cupcakes = OrderItem.objects.filter(
            order__status=OrderStatus.PAGO,
            product_type='CUSTOM_CUPCAKE'
        ).count()
        
        report = {
            'top_products': list(top_products),
            'custom_cupcakes_sold': custom_cupcakes,
            'total_products': Product.objects.count(),
            'products_out_of_stock': Product.objects.filter(stock=0).count(),
        }
        
        return Response(report)


class OperatorPerformanceView(GenericAPIView):
    """Relatório de performance de operadores"""
    permission_classes = [IsAdminUser]  # Apenas admins
    serializer_class = OperatorPerformanceSerializer
    
    def get(self, request):
        # Performance dos operadores
        operators = CustomUser.objects.filter(role='OPERATOR')
        
        operator_stats = []
        for operator in operators:
            # Aqui você pode adicionar lógica para rastrear ações dos operadores
            # Por exemplo, pedidos atualizados por eles, mensagens respondidas, etc.
            operator_stats.append({
                'id': operator.id,
                'name': operator.get_full_name(),
                'username': operator.username,
                'email': operator.email,
                # Adicione mais métricas conforme necessário
            })
        
        report = {
            'total_operators': operators.count(),
            'operators': operator_stats,
        }
        
        return Response(report)


class CustomerStatsView(GenericAPIView):
    """Estatísticas de clientes"""
    permission_classes = [IsOperatorOrAdmin]
    serializer_class = CustomerStatsSerializer
    
    def get(self, request):
        # Clientes mais ativos
        top_customers = CustomUser.objects.filter(
            role='CLIENT'
        ).annotate(
            order_count=Count('orders'),
            total_spent=Sum('orders__total', filter=Q(orders__status=OrderStatus.PAGO))
        ).order_by('-total_spent')[:10]
        
        report = {
            'total_customers': CustomUser.objects.filter(role='CLIENT').count(),
            'customers_with_orders': CustomUser.objects.filter(
                role='CLIENT',
                orders__isnull=False
            ).distinct().count(),
            'top_customers': [
                {
                    'id': customer.id,
                    'name': customer.get_full_name(),
                    'username': customer.username,
                    'order_count': customer.order_count,
                    'total_spent': customer.total_spent or 0
                }
                for customer in top_customers
            ]
        }
        
        return Response(report)
