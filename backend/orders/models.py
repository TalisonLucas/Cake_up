from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import random
import string


class OrderStatus(models.TextChoices):
    """Status possíveis de um pedido"""
    AGUARDANDO_CONFIRMACAO = 'AGUARDANDO_CONFIRMACAO', 'Aguardando Confirmação'
    ACEITO = 'ACEITO', 'Aceito'
    EM_PRODUCAO = 'EM_PRODUCAO', 'Em Produção'
    LIBERADO = 'LIBERADO', 'Liberado'
    PAGO = 'PAGO', 'Pago'


class Order(models.Model):
    """Modelo de Pedido"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Usuário'
    )
    status = models.CharField(
        max_length=25,
        choices=OrderStatus.choices,
        default=OrderStatus.AGUARDANDO_CONFIRMACAO,
        verbose_name='Status'
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Total'
    )
    
    # Endereço de entrega (copiado do Address para manter histórico)
    delivery_street = models.CharField(max_length=255, verbose_name='Rua')
    delivery_number = models.CharField(max_length=10, verbose_name='Número')
    delivery_complement = models.CharField(max_length=255, blank=True, verbose_name='Complemento')
    delivery_neighborhood = models.CharField(max_length=100, verbose_name='Bairro')
    delivery_city = models.CharField(max_length=100, verbose_name='Cidade')
    delivery_state = models.CharField(max_length=2, verbose_name='Estado')
    delivery_zipcode = models.CharField(max_length=9, verbose_name='CEP')
    
    observations = models.TextField(blank=True, verbose_name='Observações')
    
    # Timestamps importantes
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='Confirmado em')
    alterable_until = models.DateTimeField(null=True, blank=True, verbose_name='Alterável até')
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name='Pago em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    
    class Meta:
        verbose_name = 'Pedido'
        verbose_name_plural = 'Pedidos'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Pedido #{self.id} - {self.user.username} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Se é um novo pedido, definir alterable_until (2 minutos após criação)
        if is_new and not self.confirmed_at:
            self.confirmed_at = self.created_at
            self.alterable_until = self.created_at + timedelta(minutes=2)
            super().save(update_fields=['confirmed_at', 'alterable_until'])
    
    def can_alter(self):
        """Verifica se o pedido ainda pode ser alterado"""
        if not self.alterable_until:
            return False
        return timezone.now() < self.alterable_until and self.status == OrderStatus.AGUARDANDO_CONFIRMACAO
    
    def calculate_total(self):
        """Calcula o total do pedido baseado nos itens"""
        total = sum(item.subtotal for item in self.items.all())
        self.total = total
        self.save(update_fields=['total'])
        return total


class OrderItem(models.Model):
    """Itens do pedido"""
    class ProductType(models.TextChoices):
        PRODUCT = 'PRODUCT', 'Produto Pronto'
        CUSTOM_CUPCAKE = 'CUSTOM_CUPCAKE', 'Cupcake Personalizado'
    
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Pedido'
    )
    product_type = models.CharField(
        max_length=15,
        choices=ProductType.choices,
        verbose_name='Tipo de Produto'
    )
    
    # Referência ao produto (se for produto pronto)
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Produto'
    )
    
    # Dados do cupcake customizado (se for custom)
    custom_cupcake_data = models.JSONField(
        null=True,
        blank=True,
        verbose_name='Dados do Cupcake Personalizado',
        help_text='JSON com massa_id, recheio_id, cobertura_id'
    )
    
    quantity = models.IntegerField(default=1, verbose_name='Quantidade')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Preço Unitário')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Subtotal')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    
    class Meta:
        verbose_name = 'Item do Pedido'
        verbose_name_plural = 'Itens do Pedido'
    
    def __str__(self):
        if self.product_type == self.ProductType.PRODUCT:
            return f"{self.quantity}x {self.product.name if self.product else 'Produto'}"
        return f"{self.quantity}x Cupcake Personalizado"
    
    def save(self, *args, **kwargs):
        # Calcular subtotal
        self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)
        
        # Atualizar total do pedido
        self.order.calculate_total()


class DeliveryCode(models.Model):
    """Código de confirmação de entrega"""
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name='delivery_code',
        verbose_name='Pedido'
    )
    code = models.CharField(max_length=6, unique=True, verbose_name='Código')
    generated_at = models.DateTimeField(auto_now_add=True, verbose_name='Gerado em')
    expires_at = models.DateTimeField(verbose_name='Expira em')
    attempts = models.IntegerField(default=0, verbose_name='Tentativas')
    validated = models.BooleanField(default=False, verbose_name='Validado')
    validated_at = models.DateTimeField(null=True, blank=True, verbose_name='Validado em')
    
    class Meta:
        verbose_name = 'Código de Entrega'
        verbose_name_plural = 'Códigos de Entrega'
    
    def __str__(self):
        return f"Código {self.code} - Pedido #{self.order.id}"
    
    @staticmethod
    def generate_code():
        """Gera um código único de 6 dígitos"""
        while True:
            code = ''.join(random.choices(string.digits, k=6))
            if not DeliveryCode.objects.filter(code=code).exists():
                return code
    
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_code()
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Verifica se o código ainda é válido"""
        return not self.validated and timezone.now() < self.expires_at and self.attempts < 3
    
    def validate_code(self, input_code):
        """Valida o código fornecido"""
        self.attempts += 1
        
        if not self.is_valid():
            self.save(update_fields=['attempts'])
            return False
        
        if self.code == input_code:
            self.validated = True
            self.validated_at = timezone.now()
            self.order.status = OrderStatus.PAGO
            self.order.paid_at = timezone.now()
            self.order.save(update_fields=['status', 'paid_at'])
            self.save(update_fields=['validated', 'validated_at', 'attempts'])
            return True
        
        self.save(update_fields=['attempts'])
        return False
