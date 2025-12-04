import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings

User = get_user_model()


class OrderStatusConsumer(AsyncWebsocketConsumer):
    """Consumer WebSocket para atualizações de status de pedidos em tempo real"""
    
    async def connect(self):
        """Estabelece conexão WebSocket e autentica usuário"""
        # Autenticar via token JWT
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        
        # Extrair token da query string (ex: ?token=xxx)
        if query_string:
            params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
            token = params.get('token')
        
        # Se não encontrou na query, tentar no header
        if not token:
            headers = dict(self.scope.get('headers', []))
            auth_header = headers.get(b'authorization', b'').decode()
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            await self.close()
            return
        
        # Validar token JWT
        try:
            UntypedToken(token)
            decoded_data = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_data.get('user_id')
            
            if not user_id:
                await self.close()
                return
            
            # Buscar usuário
            self.user = await self.get_user(user_id)
            if not self.user:
                await self.close()
                return
            
            self.user_id = self.user.id
            self.user_role = self.user.role
            
        except (InvalidToken, TokenError, Exception) as e:
            print(f"Erro na autenticação WebSocket: {e}")
            await self.close()
            return
        
        # Aceitar conexão
        await self.accept()
        
        # Adicionar usuário aos grupos apropriados
        # Grupo global para operadores e admins verem todos os pedidos
        if self.user_role in ['OPERATOR', 'ADMIN']:
            await self.channel_layer.group_add(
                'orders_global',
                self.channel_name
            )
        
        # Grupo para o próprio usuário (para receber atualizações dos seus pedidos)
        await self.channel_layer.group_add(
            f'user_{self.user_id}',
            self.channel_name
        )
    
    async def disconnect(self, close_code):
        """Remove usuário dos grupos ao desconectar"""
        if hasattr(self, 'user_id'):
            if hasattr(self, 'user_role') and self.user_role in ['OPERATOR', 'ADMIN']:
                await self.channel_layer.group_discard(
                    'orders_global',
                    self.channel_name
                )
            
            await self.channel_layer.group_discard(
                f'user_{self.user_id}',
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Recebe mensagens do cliente (não usado no momento)"""
        try:
            data = json.loads(text_data)
            # Pode ser usado para ping/pong ou outras comunicações
        except json.JSONDecodeError:
            pass
    
    async def order_status_update(self, event):
        """Envia atualização de status do pedido para o cliente"""
        await self.send(text_data=json.dumps({
            'type': 'order_status_update',
            'order': event['order'],
            'message': event.get('message', 'Status do pedido atualizado')
        }))
    
    async def order_created(self, event):
        """Envia notificação de novo pedido criado"""
        await self.send(text_data=json.dumps({
            'type': 'order_created',
            'order': event['order'],
            'message': event.get('message', 'Novo pedido criado')
        }))
    
    @database_sync_to_async
    def get_user(self, user_id):
        """Busca usuário de forma assíncrona"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

