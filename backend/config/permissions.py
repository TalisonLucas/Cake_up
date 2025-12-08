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
        if not request.user or not request.user.is_authenticated:
            return False
        
        user_role = getattr(request.user, 'role', None)
        is_staff = getattr(request.user, 'is_staff', False)
        
        has_permission = (user_role in ['OPERATOR', 'ADMIN'] or is_staff)
        
        # Debug log (remover em produção)
        if not has_permission:
            print(f"[DEBUG IsOperatorOrAdmin] Negado - User: {request.user.username}, Role: {user_role}, is_staff: {is_staff}, Method: {request.method}")
        else:
            print(f"[DEBUG IsOperatorOrAdmin] Permitido - User: {request.user.username}, Role: {user_role}, is_staff: {is_staff}, Method: {request.method}")
        
        return has_permission


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



