from django.contrib import admin
from .models import Order, OrderItem, DeliveryCode


class OrderItemInline(admin.TabularInline):
    """Inline para itens do pedido"""
    model = OrderItem
    extra = 0
    readonly_fields = ['subtotal']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    """Admin para pedidos"""
    list_display = [
        'id', 'user', 'status', 'total', 'created_at',
        'alterable_until', 'can_alter'
    ]
    list_filter = ['status', 'created_at', 'paid_at']
    search_fields = ['user__username', 'user__email', 'id']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'confirmed_at', 'alterable_until', 'paid_at', 'updated_at', 'total']
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Informações do Pedido', {
            'fields': ('user', 'status', 'total', 'observations')
        }),
        ('Endereço de Entrega', {
            'fields': (
                'delivery_street', 'delivery_number', 'delivery_complement',
                'delivery_neighborhood', 'delivery_city', 'delivery_state', 'delivery_zipcode'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'confirmed_at', 'alterable_until', 'paid_at', 'updated_at')
        }),
    )
    
    actions = ['mark_as_accepted', 'mark_as_in_production', 'mark_as_released']
    
    def mark_as_accepted(self, request, queryset):
        queryset.update(status='ACEITO')
    mark_as_accepted.short_description = "Marcar como Aceito"
    
    def mark_as_in_production(self, request, queryset):
        queryset.update(status='EM_PRODUCAO')
    mark_as_in_production.short_description = "Marcar como Em Produção"
    
    def mark_as_released(self, request, queryset):
        queryset.update(status='LIBERADO')
    mark_as_released.short_description = "Marcar como Liberado"


@admin.register(DeliveryCode)
class DeliveryCodeAdmin(admin.ModelAdmin):
    """Admin para códigos de entrega"""
    list_display = ['code', 'order', 'generated_at', 'expires_at', 'attempts', 'validated']
    list_filter = ['validated', 'generated_at']
    search_fields = ['code', 'order__id']
    readonly_fields = ['code', 'generated_at', 'expires_at', 'attempts', 'validated', 'validated_at']
    
    fieldsets = (
        ('Código', {
            'fields': ('order', 'code')
        }),
        ('Status', {
            'fields': ('validated', 'validated_at', 'attempts')
        }),
        ('Validade', {
            'fields': ('generated_at', 'expires_at')
        }),
    )
