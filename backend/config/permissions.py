"""
Permissões customizadas para o sistema Cake Up
"""
from rest_framework.permissions import BasePermission


class IsClient(BasePermission):
    """Permite acesso apenas a usuários com role CLIENT"""
    
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated and 
                request.user.role == 'CLIENT')


class IsOperator(BasePermission):
    """Permite acesso apenas a usuários com role OPERATOR"""
    
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated and 
                request.user.role == 'OPERATOR')


class IsAdmin(BasePermission):
    """Permite acesso apenas a usuários com role ADMIN"""
    
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated and 
                (request.user.role == 'ADMIN' or request.user.is_staff))


class IsOperatorOrAdmin(BasePermission):
    """Permite acesso a operadores e administradores"""
    
    def has_permission(self, request, view):
        return (request.user and request.user.is_authenticated and 
                (request.user.role in ['OPERATOR', 'ADMIN'] or request.user.is_staff))


class IsOwnerOrReadOnly(BasePermission):
    """
    Permissão customizada para permitir que apenas o dono de um objeto possa editá-lo.
    Leitura é permitida para qualquer um autenticado.
    """
    
    def has_object_permission(self, request, view, obj):
        # Leitura permitida para qualquer request
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Escrita apenas para o dono ou staff
        return obj.user == request.user or request.user.is_staff


class IsOwner(BasePermission):
    """Permite acesso apenas ao dono do objeto"""
    
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user or request.user.is_staff

