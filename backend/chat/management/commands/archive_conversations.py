from django.core.management.base import BaseCommand
from chat.models import Conversation
from django.utils import timezone


class Command(BaseCommand):
    help = 'Arquiva conversas relacionadas a pedidos pagos ou cancelados há mais de 24h'

    def handle(self, *args, **options):
        """Executa o arquivamento automático de conversas"""
        # Buscar conversas que devem ser arquivadas
        conversations_to_archive = Conversation.objects.filter(
            is_archived=False,
            order__isnull=False
        )
        
        archived_count = 0
        
        for conversation in conversations_to_archive:
            if conversation.should_be_archived():
                conversation.archive()
                archived_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Conversa #{conversation.id} arquivada (Pedido #{conversation.order.id})'
                    )
                )
        
        if archived_count == 0:
            self.stdout.write(
                self.style.SUCCESS('Nenhuma conversa precisa ser arquivada no momento.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nTotal de conversas arquivadas: {archived_count}'
                )
            )
