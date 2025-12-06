import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings

User = get_user_model()
logger = logging.getLogger(__name__)


class OrderStatusConsumer(AsyncWebsocketConsumer):
    """Consumer WebSocket para atualizações de status de pedidos em tempo real"""
    
    async def connect(self):
        """Estabelece conexão WebSocket e autentica usuário"""
        logger.info('=== WebSocket connect() chamado ===')
        logger.info(f'Scope: {self.scope.get("path")}')
        logger.info(f'Headers: {dict(self.scope.get("headers", []))}')
        
        # Aceitar conexão primeiro para poder enviar mensagens de erro
        try:
            await self.accept()
            logger.info('Conexão WebSocket aceita com sucesso')
        except Exception as e:
            logger.error(f'Erro ao aceitar conexão WebSocket: {e}', exc_info=True)
            return
        
        # Autenticar via token JWT
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        
        logger.info(f'Tentativa de conexão WebSocket. Query string: {query_string[:50]}...')
        
        # Extrair token da query string (ex: ?token=xxx)
        if query_string:
            try:
                params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
                token = params.get('token')
            except Exception as e:
                logger.warning(f'Erro ao parsear query string: {e}')
        
        # Se não encontrou na query, tentar no header
        if not token:
            try:
                headers = dict(self.scope.get('headers', []))
                auth_header = headers.get(b'authorization', b'').decode()
                if auth_header.startswith('Bearer '):
                    token = auth_header.split(' ')[1]
            except Exception as e:
                logger.warning(f'Erro ao ler header authorization: {e}')
        
        if not token:
            logger.warning('Token não fornecido na conexão WebSocket')
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': 'Token de autenticação não fornecido'
            }))
            await self.close(code=4001)  # Código 4001 = Unauthorized
            return
        
        # Validar token JWT
        try:
            UntypedToken(token)
            decoded_data = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_data.get('user_id')
            
            if not user_id:
                logger.warning('Token JWT não contém user_id')
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'error': 'Token inválido: user_id não encontrado'
                }))
                await self.close(code=4001)
                return
            
            # Buscar usuário
            self.user = await self.get_user(user_id)
            if not self.user:
                logger.warning(f'Usuário com ID {user_id} não encontrado')
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'error': 'Usuário não encontrado'
                }))
                await self.close(code=4001)
                return
            
            self.user_id = self.user.id
            self.user_role = getattr(self.user, 'role', None)
            
            logger.info(f'WebSocket conectado com sucesso para usuário {self.user_id} (role: {self.user_role})')
            
        except (InvalidToken, TokenError) as e:
            logger.error(f'Erro na validação do token JWT: {e}')
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': 'Token inválido ou expirado'
            }))
            await self.close(code=4001)
            return
        except Exception as e:
            logger.error(f'Erro inesperado na autenticação WebSocket: {e}', exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': 'Erro interno na autenticação'
            }))
            await self.close(code=4002)  # Código 4002 = Internal Error
            return
        
        # Verificar se channel_layer está disponível
        if not self.channel_layer:
            logger.error('Channel layer não está disponível!')
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': 'Channel layer não configurado'
            }))
            await self.close(code=4002)
            return
        
        # Adicionar usuário aos grupos apropriados
        try:
            # Grupo global para operadores e admins verem todos os pedidos
            if self.user_role in ['OPERATOR', 'ADMIN']:
                await self.channel_layer.group_add(
                    'orders_global',
                    self.channel_name
                )
                logger.info(f'Usuário {self.user_id} adicionado ao grupo orders_global')
            
            # Grupo para o próprio usuário (para receber atualizações dos seus pedidos)
            await self.channel_layer.group_add(
                f'user_{self.user_id}',
                self.channel_name
            )
            logger.info(f'Usuário {self.user_id} adicionado ao grupo user_{self.user_id}')
            
            # Enviar mensagem de confirmação
            await self.send(text_data=json.dumps({
                'type': 'connection_success',
                'message': 'Conectado com sucesso'
            }))
            
        except Exception as e:
            logger.error(f'Erro ao adicionar usuário aos grupos: {e}', exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': 'Erro ao configurar grupos'
            }))
            await self.close(code=4002)
    
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

