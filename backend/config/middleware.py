"""
Custom middleware for Cake Up
"""
from django.utils.deprecation import MiddlewareMixin


class NgrokSkipBrowserWarningMiddleware(MiddlewareMixin):
    """
    Middleware para pular o aviso do ngrok adicionando o header necessário.
    Isso permite que requisições automáticas (API, WebSocket) funcionem sem
    serem bloqueadas pela página de aviso do ngrok.
    """
    
    def process_response(self, request, response):
        # Adicionar header para pular aviso do ngrok
        response['ngrok-skip-browser-warning'] = 'true'
        return response


