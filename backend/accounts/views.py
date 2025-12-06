from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import update_session_auth_hash
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import CustomUser, Address
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    AddressSerializer, ChangePasswordSerializer, CustomTokenObtainPairSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """View customizada para login que aceita email ou username"""
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """View para registro de novos usuários"""
    queryset = CustomUser.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserCreateSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View para visualizar e atualizar perfil do usuário"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserSerializer
        return UserUpdateSerializer
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """View para alterar senha"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        # Verificar senha antiga
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {"old_password": "Senha atual incorreta."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Definir nova senha
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # Atualizar sessão para não deslogar o usuário
        update_session_auth_hash(request, user)
        
        return Response(
            {"message": "Senha alterada com sucesso."},
            status=status.HTTP_200_OK
        )


@extend_schema(
    parameters=[
        OpenApiParameter('id', int, OpenApiParameter.PATH, description='ID do endereço')
    ]
)
class AddressViewSet(viewsets.ModelViewSet):
    """ViewSet para CRUD de endereços"""
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Address.objects.none()
        return Address.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Ação para definir um endereço como padrão"""
        address = self.get_object()
        Address.objects.filter(user=request.user, is_default=True).update(is_default=False)
        address.is_default = True
        address.save()
        return Response({'message': 'Endereço definido como padrão.'})
