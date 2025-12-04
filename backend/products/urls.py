from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CupcakeComponentViewSet, ProductViewSet

router = DefaultRouter()
router.register(r'cupcake-components', CupcakeComponentViewSet, basename='cupcake-component')
router.register(r'products', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
]


