from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from config.permissions import IsOperatorOrAdmin
from .models import CupcakeComponent, Product
from .serializers import CupcakeComponentSerializer, ProductSerializer


class CupcakeComponentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para componentes de cupcake
    GET: Todos podem ver
    POST/PUT/DELETE: Operador e Admin podem atualizar
    """
    queryset = CupcakeComponent.objects.all()
    serializer_class = CupcakeComponentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'is_available']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['type', 'name']
    
    def get_permissions(self):
        # Debug: verificar qual action está sendo usado
        print(f"[DEBUG CupcakeComponentViewSet] Action: {self.action}, Method: {self.request.method if hasattr(self, 'request') else 'N/A'}")
        
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            # Para create, update, partial_update, destroy
            permission_classes = [IsOperatorOrAdmin]
        return [permission() for permission in permission_classes]


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet para produtos
    GET: Todos podem ver
    POST/PUT/DELETE: Apenas admin
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_available']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [IsAuthenticatedOrReadOnly]
        else:
            permission_classes = [IsAdminUser]
        return [permission() for permission in permission_classes]
