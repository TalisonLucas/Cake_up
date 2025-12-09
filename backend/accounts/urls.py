from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, RegisterView, UserProfileView, 
    ChangePasswordView, AddressViewSet, UserAdminViewSet
)

router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'admin/users', UserAdminViewSet, basename='admin-users')

urlpatterns = [
    # JWT Authentication (aceita email ou username)
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User Registration and Profile
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Addresses
    path('', include(router.urls)),
]

