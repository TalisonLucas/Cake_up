from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0002_conversation_assigned_operator_conversation_order_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='conversation',
            name='auto_close_at',
            field=models.DateTimeField(
                blank=True,
                help_text='Após confirmação de entrega, conversa encerra neste horário',
                null=True,
                verbose_name='Encerrar automaticamente em',
            ),
        ),
    ]
