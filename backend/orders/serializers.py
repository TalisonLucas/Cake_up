from rest_framework import serializers
from .models import Order, OrderItem, DeliveryCode
from products.serializers import ProductSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer para itens do pedido"""
    product_details = ProductSerializer(source='product', read_only=True)
    product_type_display = serializers.CharField(source='get_product_type_display', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_type', 'product_type_display', 'product', 'product_details',
            'custom_cupcake_data', 'quantity', 'unit_price', 'subtotal', 'created_at'
        ]
        read_only_fields = ['id', 'subtotal', 'created_at']


class DeliveryCodeSerializer(serializers.ModelSerializer):
    """Serializer para código de entrega"""
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = DeliveryCode
        fields = [
            'code', 'generated_at', 'expires_at', 'attempts',
            'validated', 'validated_at', 'is_valid'
        ]
        read_only_fields = ['code', 'generated_at', 'expires_at', 'attempts', 'validated', 'validated_at']


class OrderSerializer(serializers.ModelSerializer):
    """Serializer para pedidos"""
    items = OrderItemSerializer(many=True, read_only=True)
    delivery_code = DeliveryCodeSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    can_alter = serializers.BooleanField(read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'user_name', 'status', 'status_display', 'total',
            'delivery_street', 'delivery_number', 'delivery_complement',
            'delivery_neighborhood', 'delivery_city', 'delivery_state', 'delivery_zipcode',
            'observations', 'created_at', 'confirmed_at', 'alterable_until',
            'paid_at', 'updated_at', 'can_alter', 'items', 'delivery_code'
        ]
        read_only_fields = [
            'id', 'user', 'total', 'created_at', 'confirmed_at',
            'alterable_until', 'paid_at', 'updated_at'
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de pedidos"""
    items = OrderItemSerializer(many=True)
    
    class Meta:
        model = Order
        fields = [
            'delivery_street', 'delivery_number', 'delivery_complement',
            'delivery_neighborhood', 'delivery_city', 'delivery_state',
            'delivery_zipcode', 'observations', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        # O usuário será passado via serializer.save(user=request.user)
        user = validated_data.pop('user', None)
        order = Order.objects.create(user=user, **validated_data)
        
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        order.calculate_total()
        return order


class OrderUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualização de pedidos (apenas se alterável)"""
    items = OrderItemSerializer(many=True, required=False)
    
    class Meta:
        model = Order
        fields = ['observations', 'items']
    
    def update(self, instance, validated_data):
        if not instance.can_alter():
            raise serializers.ValidationError("Este pedido não pode mais ser alterado.")
        
        items_data = validated_data.pop('items', None)
        
        # Atualizar observações
        instance.observations = validated_data.get('observations', instance.observations)
        instance.save()
        
        # Atualizar itens se fornecidos
        if items_data is not None:
            # Remover itens antigos
            instance.items.all().delete()
            
            # Criar novos itens
            for item_data in items_data:
                OrderItem.objects.create(order=instance, **item_data)
            
            instance.calculate_total()
        
        return instance


class ValidateDeliveryCodeSerializer(serializers.Serializer):
    """Serializer para validação de código de entrega"""
    code = serializers.CharField(max_length=6)


