import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings
from .models import Conversation, Message

User = get_user_model()
logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    """Consumer WebSocket para chat em tempo real"""
    
    async def connect(self):
        """Estabelece conexão WebSocket e autentica usuário"""
        logger.info('=== Chat WebSocket connect() chamado ===')
        
        # Aceitar conexão primeiro
        try:
            await self.accept()
            logger.info('Conexão Chat WebSocket aceita com sucesso')
        except Exception as e:
            logger.error(f'Erro ao aceitar conexão Chat WebSocket: {e}', exc_info=True)
            return
        
        # Autenticar via token JWT
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        
        # Extrair token da query string
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
            logger.warning('Token não fornecido na conexão Chat WebSocket')
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': 'Token de autenticação não fornecido'
            }))
            await self.close(code=4001)
            return
        
        # Validar token JWT
        try:
            UntypedToken(token)
            decoded_data = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_data.get('user_id')
            
            if not user_id:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'error': 'Token inválido: user_id não encontrado'
                }))
                await self.close(code=4001)
                return
            
            # Buscar usuário
            self.user = await self.get_user(user_id)
            if not self.user:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'error': 'Usuário não encontrado'
                }))
                await self.close(code=4001)
                return
            
            self.user_id = self.user.id
            self.conversation_groups = set()  # Grupos de conversa que o usuário está
            
            logger.info(f'Chat WebSocket conectado para usuário {self.user_id}')
            
            # Enviar mensagem de sucesso
            await self.send(text_data=json.dumps({
                'type': 'connection_success',
                'message': 'Conectado ao chat'
            }))
            
        except (InvalidToken, TokenError) as e:
            logger.error(f'Erro na validação do token JWT: {e}')
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': 'Token inválido ou expirado'
            }))
            await self.close(code=4001)
        except Exception as e:
            logger.error(f'Erro inesperado na conexão: {e}', exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': 'Erro interno do servidor'
            }))
            await self.close(code=4002)
    
    async def disconnect(self, close_code):
        """Remove usuário de todos os grupos ao desconectar"""
        logger.info(f'Chat WebSocket desconectado (código: {close_code})')
        
        # Remover de todos os grupos
        for group_name in list(self.conversation_groups):
            await self.channel_layer.group_discard(
                group_name,
                self.channel_name
            )
        self.conversation_groups.clear()
    
    async def receive(self, text_data):
        """Processa mensagens recebidas do cliente"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'join_conversation':
                await self.join_conversation(data.get('conversation_id'))
            elif message_type == 'leave_conversation':
                await self.leave_conversation(data.get('conversation_id'))
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
            else:
                logger.warning(f'Tipo de mensagem desconhecido: {message_type}')
                
        except json.JSONDecodeError:
            logger.error('Erro ao decodificar JSON recebido')
        except Exception as e:
            logger.error(f'Erro ao processar mensagem: {e}', exc_info=True)
    
    async def join_conversation(self, conversation_id):
        """Adiciona usuário ao grupo da conversa"""
        if not conversation_id:
            return
        
        # Verificar se usuário é participante da conversa
        is_participant = await self.is_conversation_participant(conversation_id)
        if not is_participant:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': 'Você não é participante desta conversa'
            }))
            return
        
        group_name = f'chat_{conversation_id}'
        
        # Adicionar ao grupo
        await self.channel_layer.group_add(
            group_name,
            self.channel_name
        )
        self.conversation_groups.add(group_name)
        
        logger.info(f'Usuário {self.user_id} entrou na conversa {conversation_id}')
        
        await self.send(text_data=json.dumps({
            'type': 'joined_conversation',
            'conversation_id': conversation_id
        }))
    
    async def leave_conversation(self, conversation_id):
        """Remove usuário do grupo da conversa"""
        if not conversation_id:
            return
        
        group_name = f'chat_{conversation_id}'
        
        # Remover do grupo
        await self.channel_layer.group_discard(
            group_name,
            self.channel_name
        )
        self.conversation_groups.discard(group_name)
        
        logger.info(f'Usuário {self.user_id} saiu da conversa {conversation_id}')
    
    async def new_message(self, event):
        """Envia nova mensagem para o cliente"""
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message'],
            'conversation_id': event['conversation_id']
        }))
    
    async def message_read(self, event):
        """Notifica que mensagem foi lida"""
        await self.send(text_data=json.dumps({
            'type': 'message_read',
            'message_id': event['message_id'],
            'conversation_id': event['conversation_id']
        }))
    
    async def operator_assigned(self, event):
        """Notifica que operador foi atribuído à conversa"""
        await self.send(text_data=json.dumps({
            'type': 'operator_assigned',
            'conversation_id': event['conversation_id'],
            'operator_id': event['operator_id'],
            'operator_name': event['operator_name']
        }))
    
    async def conversation_status_changed(self, event):
        """Notifica que status da conversa mudou"""
        await self.send(text_data=json.dumps({
            'type': 'conversation_status_changed',
            'conversation_id': event['conversation_id'],
            'status': event['status']
        }))
    
    async def admin_called(self, event):
        """Notifica que administrador foi chamado"""
        await self.send(text_data=json.dumps({
            'type': 'admin_called',
            'conversation_id': event['conversation_id'],
            'operator_id': event['operator_id'],
            'operator_name': event['operator_name']
        }))
    
    @database_sync_to_async
    def get_user(self, user_id):
        """Busca usuário do banco"""
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
    
    @database_sync_to_async
    def is_conversation_participant(self, conversation_id):
        """Verifica se usuário é participante da conversa"""
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            return self.user in conversation.participants.all()
        except Conversation.DoesNotExist:
            return False
