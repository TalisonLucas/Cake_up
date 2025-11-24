from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Address


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Admin personalizado para CustomUser"""
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'is_staff', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'cpf']
    ordering = ['-created_at']
    
    fieldsets = UserAdmin.fieldsets + (
        ('Informações Adicionais', {
            'fields': ('role', 'phone', 'cpf')
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Informações Adicionais', {
            'fields': ('role', 'phone', 'cpf')
        }),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    """Admin para Address"""
    list_display = ['user', 'street', 'number', 'city', 'state', 'is_default', 'created_at']
    list_filter = ['is_default', 'state', 'city', 'created_at']
    search_fields = ['user__username', 'user__email', 'street', 'city', 'zipcode']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Usuário', {
            'fields': ('user',)
        }),
        ('Endereço', {
            'fields': ('street', 'number', 'complement', 'neighborhood', 'city', 'state', 'zipcode')
        }),
        ('Configurações', {
            'fields': ('is_default',)
        }),
    )
