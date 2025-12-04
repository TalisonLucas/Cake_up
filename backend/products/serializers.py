from rest_framework import serializers
from .models import CupcakeComponent, Product


class CupcakeComponentSerializer(serializers.ModelSerializer):
    """Serializer para componentes de cupcake"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = CupcakeComponent
        fields = [
            'id', 'type', 'type_display', 'name', 'description',
            'price', 'image', 'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer para produtos"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'image', 'category',
            'category_display', 'stock', 'is_available', 'in_stock',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


