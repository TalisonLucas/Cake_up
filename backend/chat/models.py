from datetime import timedelta

from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone


class Conversation(models.Model):
    """Modelo de conversa entre usuários"""
    class ConversationType(models.TextChoices):
        CLIENT_ESTABLISHMENT = 'CLIENT_ESTABLISHMENT', 'Cliente-Estabelecimento'
        OPERATOR_ADMIN = 'OPERATOR_ADMIN', 'Operador-Administrador'
    
    class ConversationStatus(models.TextChoices):
        OPEN = 'open', 'Aberta'
        RESOLVED = 'resolved', 'Resolvida'
        CLOSED = 'closed', 'Fechada'
    
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations',
        verbose_name='Participantes'
    )
    conversation_type = models.CharField(
        max_length=25,
        choices=ConversationType.choices,
        verbose_name='Tipo de Conversa'
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='conversations',
        null=True,
        blank=True,
        verbose_name='Pedido',
        help_text='Obrigatório para conversas Cliente-Estabelecimento'
    )
    assigned_operator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='assigned_conversations',
        null=True,
        blank=True,
        verbose_name='Operador Atribuído',
        limit_choices_to={'role': 'OPERATOR'}
    )
    status = models.CharField(
        max_length=10,
        choices=ConversationStatus.choices,
        default=ConversationStatus.OPEN,
        verbose_name='Status'
    )
    auto_close_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Encerrar automaticamente em',
        help_text='Após confirmação de entrega, conversa encerra neste horário'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    
    class Meta:
        verbose_name = 'Conversa'
        verbose_name_plural = 'Conversas'
        ordering = ['-updated_at']
    
    def __str__(self):
        participants_names = ', '.join([p.username for p in self.participants.all()])
        return f"{self.get_conversation_type_display()} - {participants_names}"
    
    def clean(self):
        """Validação: CLIENT_ESTABLISHMENT deve ter order obrigatório"""
        if self.conversation_type == self.ConversationType.CLIENT_ESTABLISHMENT and not self.order:
            raise ValidationError({
                'order': 'Conversas Cliente-Estabelecimento devem ter um pedido associado.'
            })
    
    def save(self, *args, **kwargs):
        """Chama clean antes de salvar"""
        self.full_clean()
        super().save(*args, **kwargs)
    
    def get_last_message(self):
        """Retorna a última mensagem da conversa"""
        return self.messages.last()

    @property
    def is_closed(self):
        return self.status == self.ConversationStatus.CLOSED

    def schedule_auto_close(self, from_time=None, minutes=10):
        """Agenda encerramento automático (ex.: após entrega confirmada)."""
        base = from_time or timezone.now()
        self.auto_close_at = base + timedelta(minutes=minutes)
        if self.status == self.ConversationStatus.CLOSED:
            return
        self.save(update_fields=['auto_close_at', 'updated_at'])

    def close(self, *, force=False):
        """Encerra a conversa."""
        if self.status == self.ConversationStatus.CLOSED and not force:
            return False
        self.status = self.ConversationStatus.CLOSED
        self.save(update_fields=['status', 'updated_at'])
        return True

    def close_if_due(self):
        """Fecha se auto_close_at já passou. Retorna True se fechou agora."""
        if self.status == self.ConversationStatus.CLOSED:
            return False
        if self.auto_close_at and timezone.now() >= self.auto_close_at:
            return self.close()
        return False

    @classmethod
    def close_all_due(cls):
        """Fecha em lote conversas com auto_close_at vencido."""
        now = timezone.now()
        return cls.objects.filter(
            auto_close_at__lte=now,
        ).exclude(
            status=cls.ConversationStatus.CLOSED,
        ).update(status=cls.ConversationStatus.CLOSED, updated_at=now)

    @classmethod
    def schedule_auto_close_for_order(cls, order, minutes=10):
        """Agenda encerramento nas conversas do pedido após confirmação de entrega."""
        from_time = getattr(order, 'paid_at', None) or timezone.now()
        close_at = from_time + timedelta(minutes=minutes)
        qs = cls.objects.filter(
            order=order,
            conversation_type=cls.ConversationType.CLIENT_ESTABLISHMENT,
        ).exclude(status=cls.ConversationStatus.CLOSED)
        return qs.update(auto_close_at=close_at, updated_at=timezone.now())


class Message(models.Model):
    """Modelo de mensagem dentro de uma conversa"""
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='Conversa'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        verbose_name='Remetente'
    )
    content = models.TextField(verbose_name='Conteúdo')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Enviado em')
    is_read = models.BooleanField(default=False, verbose_name='Lida')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='Lida em')
    
    class Meta:
        verbose_name = 'Mensagem'
        verbose_name_plural = 'Mensagens'
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"
    
    def mark_as_read(self):
        """Marca a mensagem como lida"""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
