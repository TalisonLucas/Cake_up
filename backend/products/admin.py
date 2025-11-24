from django.contrib import admin
from .models import CupcakeComponent, Product


@admin.register(CupcakeComponent)
class CupcakeComponentAdmin(admin.ModelAdmin):
    """Admin para Componentes de Cupcake"""
    list_display = ['name', 'type', 'price', 'is_available', 'created_at']
    list_filter = ['type', 'is_available', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['type', 'name']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('type', 'name', 'description')
        }),
        ('Preço e Disponibilidade', {
            'fields': ('price', 'is_available')
        }),
        ('Imagem', {
            'fields': ('image',)
        }),
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin para Produtos"""
    list_display = ['name', 'category', 'price', 'stock', 'is_available', 'created_at']
    list_filter = ['category', 'is_available', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('name', 'description', 'category')
        }),
        ('Preço e Estoque', {
            'fields': ('price', 'stock', 'is_available')
        }),
        ('Imagem', {
            'fields': ('image',)
        }),
    )
