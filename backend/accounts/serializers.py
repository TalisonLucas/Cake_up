from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser, Address


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer customizado que aceita email OU username para login
    O campo 'username' pode receber tanto username quanto email
    """
    username_field = 'username'
    
    def validate(self, attrs):
        # Obter o valor enviado no campo 'username' (pode ser username ou email)
        username_or_email = attrs.get(self.username_field, '')
        password = attrs.get('password')
        
        # Se parece um email (contém @), buscar o username correspondente
        if '@' in username_or_email:
            try:
                user = CustomUser.objects.get(email=username_or_email)
                attrs[self.username_field] = user.username
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError({
                    'detail': 'Credenciais inválidas.'
                })
        
        # Chamar validação padrão do TokenObtainPairSerializer
        return super().validate(attrs)


class AddressSerializer(serializers.ModelSerializer):
    """Serializer para endereços"""
    
    class Meta:
        model = Address
        fields = [
            'id', 'street', 'number', 'complement', 'neighborhood',
            'city', 'state', 'zipcode', 'is_default', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer básico para usuário"""
    addresses = AddressSerializer(many=True, read_only=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'cpf', 'addresses', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de usuário"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = CustomUser
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'phone', 'cpf'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "As senhas não coincidem."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualização de usuário"""
    
    class Meta:
        model = CustomUser
        fields = ['email', 'first_name', 'last_name', 'phone', 'cpf']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para alteração de senha"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "As senhas não coincidem."})
        return attrs
