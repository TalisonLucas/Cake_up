from django.db import models


class CupcakeComponent(models.Model):
    """
    Modelo para componentes do cupcake personalizável
    (Massa, Recheio, Cobertura)
    """
    class ComponentType(models.TextChoices):
        MASSA = 'MASSA', 'Massa'
        RECHEIO = 'RECHEIO', 'Recheio'
        COBERTURA = 'COBERTURA', 'Cobertura'
    
    type = models.CharField(
        max_length=10,
        choices=ComponentType.choices,
        verbose_name='Tipo'
    )
    name = models.CharField(max_length=100, verbose_name='Nome')
    description = models.TextField(blank=True, verbose_name='Descrição')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Preço')
    image = models.ImageField(
        upload_to='cupcake_components/',
        null=True,
        blank=True,
        verbose_name='Imagem'
    )
    is_available = models.BooleanField(default=True, verbose_name='Disponível')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    
    class Meta:
        verbose_name = 'Componente de Cupcake'
        verbose_name_plural = 'Componentes de Cupcake'
        ordering = ['type', 'name']
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.name}"


class Product(models.Model):
    """
    Modelo para produtos prontos (cupcakes pré-definidos ou outros produtos)
    """
    class Category(models.TextChoices):
        CUPCAKE = 'CUPCAKE', 'Cupcake Pronto'
        BOLO = 'BOLO', 'Bolo'
        DOCE = 'DOCE', 'Doce'
        OUTROS = 'OUTROS', 'Outros'
    
    name = models.CharField(max_length=100, verbose_name='Nome')
    description = models.TextField(verbose_name='Descrição')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Preço')
    image = models.ImageField(
        upload_to='products/',
        null=True,
        blank=True,
        verbose_name='Imagem'
    )
    category = models.CharField(
        max_length=10,
        choices=Category.choices,
        default=Category.CUPCAKE,
        verbose_name='Categoria'
    )
    stock = models.IntegerField(default=0, verbose_name='Estoque')
    is_available = models.BooleanField(default=True, verbose_name='Disponível')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    
    class Meta:
        verbose_name = 'Produto'
        verbose_name_plural = 'Produtos'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def in_stock(self):
        return self.stock > 0
