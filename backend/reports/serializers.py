from rest_framework import serializers


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer para resposta de estatísticas do dashboard"""
    orders_today = serializers.IntegerField()
    orders_awaiting = serializers.IntegerField()
    orders_in_production = serializers.IntegerField()
    orders_ready = serializers.IntegerField()
    orders_completed_today = serializers.IntegerField()
    revenue_today = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_clients = serializers.IntegerField()
    orders_by_status = serializers.DictField(child=serializers.IntegerField())


class SalesByDaySerializer(serializers.Serializer):
    """Serializer para vendas por dia"""
    date = serializers.DateField()
    orders = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=10, decimal_places=2)


class SalesReportSerializer(serializers.Serializer):
    """Serializer para relatório de vendas"""
    period_days = serializers.IntegerField()
    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField()
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_order_value = serializers.DecimalField(max_digits=10, decimal_places=2)
    sales_by_day = SalesByDaySerializer(many=True)


class TopProductSerializer(serializers.Serializer):
    """Serializer para produto mais vendido"""
    product__name = serializers.CharField()
    product__id = serializers.IntegerField()
    quantity_sold = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=10, decimal_places=2)


class ProductPerformanceSerializer(serializers.Serializer):
    """Serializer para relatório de performance de produtos"""
    top_products = TopProductSerializer(many=True)
    custom_cupcakes_sold = serializers.IntegerField()
    total_products = serializers.IntegerField()
    products_out_of_stock = serializers.IntegerField()


class OperatorSerializer(serializers.Serializer):
    """Serializer para informações de operador"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    username = serializers.CharField()
    email = serializers.EmailField()


class OperatorPerformanceSerializer(serializers.Serializer):
    """Serializer para relatório de performance de operadores"""
    total_operators = serializers.IntegerField()
    operators = OperatorSerializer(many=True)


class TopCustomerSerializer(serializers.Serializer):
    """Serializer para cliente mais ativo"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    username = serializers.CharField()
    order_count = serializers.IntegerField()
    total_spent = serializers.DecimalField(max_digits=10, decimal_places=2)


class CustomerStatsSerializer(serializers.Serializer):
    """Serializer para estatísticas de clientes"""
    total_customers = serializers.IntegerField()
    customers_with_orders = serializers.IntegerField()
    top_customers = TopCustomerSerializer(many=True)
