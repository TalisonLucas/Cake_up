from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order, DeliveryCode, OrderStatus


@receiver(post_save, sender=Order)
def create_delivery_code_on_status_change(sender, instance, created, **kwargs):
    """
    Criar código de entrega quando o pedido for marcado como LIBERADO
    """
    if not created and instance.status == OrderStatus.LIBERADO:
        # Verificar se já existe um código de entrega
        if not hasattr(instance, 'delivery_code'):
            DeliveryCode.objects.create(order=instance)

