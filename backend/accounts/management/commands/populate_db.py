"""
Management command para popular o banco de dados com dados iniciais
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Address
from products.models import CupcakeComponent, Product
from orders.models import Order, OrderItem, OrderStatus
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Popula o banco de dados com dados iniciais para desenvolvimento'
    
    def handle(self, *args, **options):
        self.stdout.write('Iniciando população do banco de dados...\n')
        
        # 1. Criar usuários
        self.stdout.write('Criando usuários...')
        self.create_users()
        
        # 2. Criar componentes de cupcake
        self.stdout.write('Criando componentes de cupcake...')
        self.create_cupcake_components()
        
        # 3. Criar produtos prontos
        self.stdout.write('Criando produtos prontos...')
        self.create_products()
        
        # 4. Criar pedidos de exemplo
        self.stdout.write('Criando pedidos de exemplo...')
        self.create_sample_orders()
        
        self.stdout.write(self.style.SUCCESS('\nBanco de dados populado com sucesso!'))
    
    def create_users(self):
        """Criar usuários de teste"""
        # Admin (já existe)
        try:
            admin = User.objects.get(username='admin')
            admin.set_password('admin123')
            admin.role = 'ADMIN'
            admin.first_name = 'Admin'
            admin.last_name = 'Sistema'
            admin.save()
            self.stdout.write(f'  - Admin atualizado: {admin.username}')
        except User.DoesNotExist:
            admin = User.objects.create_user(
                username='admin',
                email='admin@cakeup.com',
                password='admin123',
                role='ADMIN',
                first_name='Admin',
                last_name='Sistema'
            )
            self.stdout.write(f'  - Admin criado: {admin.username}')
        
        # Operador
        operator, created = User.objects.get_or_create(
            username='operador',
            defaults={
                'email': 'operador@cakeup.com',
                'role': 'OPERATOR',
                'first_name': 'Maria',
                'last_name': 'Operadora'
            }
        )
        if created:
            operator.set_password('operador123')
            operator.save()
            self.stdout.write(f'  - Operador criado: {operator.username}')
        
        # Clientes
        clients_data = [
            ('cliente1', 'cliente1@email.com', 'João', 'Silva', '11987654321', '123.456.789-00'),
            ('cliente2', 'cliente2@email.com', 'Maria', 'Santos', '11987654322', '234.567.890-11'),
            ('cliente3', 'cliente3@email.com', 'Pedro', 'Costa', '11987654323', '345.678.901-22'),
        ]
        
        for username, email, first_name, last_name, phone, cpf in clients_data:
            client, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'role': 'CLIENT',
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone': phone,
                    'cpf': cpf
                }
            )
            if created:
                client.set_password('cliente123')
                client.save()
                self.stdout.write(f'  - Cliente criado: {client.username}')
                
                # Criar endereço para cada cliente
                Address.objects.create(
                    user=client,
                    street='Rua das Flores',
                    number=f'{100 + clients_data.index((username, email, first_name, last_name, phone, cpf))}',
                    neighborhood='Centro',
                    city='São Paulo',
                    state='SP',
                    zipcode='01001-000',
                    is_default=True
                )
    
    def create_cupcake_components(self):
        """Criar componentes para cupcakes personalizados"""
        # Massas
        massas = [
            ('Chocolate', 'Massa de chocolate belga', Decimal('5.00')),
            ('Baunilha', 'Massa de baunilha Madagascar', Decimal('4.50')),
            ('Misto', 'Massa mesclada chocolate e baunilha', Decimal('5.50')),
        ]
        
        for name, desc, price in massas:
            CupcakeComponent.objects.get_or_create(
                type='MASSA',
                name=name,
                defaults={'description': desc, 'price': price}
            )
            self.stdout.write(f'  - Massa: {name}')
        
        # Recheios
        recheios = [
            ('Creme de Avelã', 'Delicioso creme de avelã', Decimal('3.00')),
            ('Leite em Pó', 'Recheio cremoso de leite em pó', Decimal('2.50')),
            ('Compota de Frutas Vermelhas', 'Compota artesanal de frutas vermelhas', Decimal('3.50')),
        ]
        
        for name, desc, price in recheios:
            CupcakeComponent.objects.get_or_create(
                type='RECHEIO',
                name=name,
                defaults={'description': desc, 'price': price}
            )
            self.stdout.write(f'  - Recheio: {name}')
        
        # Coberturas
        coberturas = [
            ('Chantili Chocolate', 'Cobertura de chantili com chocolate', Decimal('4.00')),
            ('Chantili Baunilha', 'Cobertura de chantili de baunilha', Decimal('3.50')),
            ('Chantili Groselha', 'Cobertura de chantili com groselha', Decimal('4.50')),
        ]
        
        for name, desc, price in coberturas:
            CupcakeComponent.objects.get_or_create(
                type='COBERTURA',
                name=name,
                defaults={'description': desc, 'price': price}
            )
            self.stdout.write(f'  - Cobertura: {name}')
    
    def create_products(self):
        """Criar produtos prontos"""
        products = [
            ('Cupcake Clássico', 'Cupcake de baunilha com cobertura de chocolate', Decimal('12.00'), 50),
            ('Cupcake Red Velvet', 'Cupcake red velvet com cream cheese', Decimal('15.00'), 30),
            ('Cupcake Limão', 'Cupcake de limão siciliano', Decimal('13.00'), 40),
            ('Mini Bolo Chocolate', 'Mini bolo de chocolate para 4 pessoas', Decimal('45.00'), 10),
            ('Brownie Recheado', 'Brownie com recheio de doce de leite', Decimal('18.00'), 25),
        ]
        
        for name, desc, price, stock in products:
            Product.objects.get_or_create(
                name=name,
                defaults={
                    'description': desc,
                    'price': price,
                    'stock': stock,
                    'category': 'CUPCAKE'
                }
            )
            self.stdout.write(f'  - Produto: {name}')
    
    def create_sample_orders(self):
        """Criar pedidos de exemplo"""
        cliente1 = User.objects.get(username='cliente1')
        produto = Product.objects.first()
        
        if not produto:
            self.stdout.write('  - Nenhum produto disponível para criar pedidos')
            return
        
        address = Address.objects.filter(user=cliente1).first()
        
        # Pedido 1 - Aguardando Confirmação
        order1 = Order.objects.create(
            user=cliente1,
            status=OrderStatus.AGUARDANDO_CONFIRMACAO,
            delivery_street=address.street,
            delivery_number=address.number,
            delivery_neighborhood=address.neighborhood,
            delivery_city=address.city,
            delivery_state=address.state,
            delivery_zipcode=address.zipcode,
            observations='Entregar pela manhã'
        )
        OrderItem.objects.create(
            order=order1,
            product_type='PRODUCT',
            product=produto,
            quantity=2,
            unit_price=produto.price
        )
        order1.calculate_total()
        self.stdout.write(f'  - Pedido #{order1.id} criado')

