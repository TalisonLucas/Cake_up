from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class CustomUser(AbstractUser):
    """
    Modelo customizado de usuário com roles e informações adicionais
    """
    class Role(models.TextChoices):
        CLIENT = 'CLIENT', 'Cliente'
        OPERATOR = 'OPERATOR', 'Operador'
        ADMIN = 'ADMIN', 'Administrador'
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Número de telefone deve estar no formato: '+999999999'. Até 15 dígitos permitidos."
    )
    
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.CLIENT,
        verbose_name='Tipo de Usuário'
    )
    phone = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        verbose_name='Telefone'
    )
    cpf = models.CharField(
        max_length=14,
        unique=True,
        null=True,
        blank=True,
        verbose_name='CPF'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    
    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"
    
    @property
    def is_client(self):
        return self.role == self.Role.CLIENT
    
    @property
    def is_operator(self):
        return self.role == self.Role.OPERATOR
    
    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN


class Address(models.Model):
    """
    Modelo de endereço associado ao usuário
    """
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='addresses',
        verbose_name='Usuário'
    )
    street = models.CharField(max_length=255, verbose_name='Rua')
    number = models.CharField(max_length=10, verbose_name='Número')
    complement = models.CharField(max_length=255, blank=True, verbose_name='Complemento')
    neighborhood = models.CharField(max_length=100, verbose_name='Bairro')
    city = models.CharField(max_length=100, verbose_name='Cidade')
    state = models.CharField(max_length=2, verbose_name='Estado')
    zipcode = models.CharField(max_length=9, verbose_name='CEP')
    is_default = models.BooleanField(default=False, verbose_name='Endereço Padrão')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    
    class Meta:
        verbose_name = 'Endereço'
        verbose_name_plural = 'Endereços'
        ordering = ['-is_default', '-created_at']
    
    def __str__(self):
        return f"{self.street}, {self.number} - {self.city}/{self.state}"
    
    def save(self, *args, **kwargs):
        # Se este é o único endereço ou marcado como padrão, garantir que seja o padrão
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)
        
        # Se o usuário não tem endereço padrão, este se torna o padrão
        if not Address.objects.filter(user=self.user, is_default=True).exists():
            self.is_default = True
            super().save(update_fields=['is_default'])
