"""
URL configuration for config project - Cake Up API
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView
)

def health_check(request):
    return JsonResponse({
        "status": "ok",
        "message": "Cake Up API is running!",
        "version": "1.0.0"
    })

# Customizar admin
admin.site.site_header = "Cake Up - Administração"
admin.site.site_title = "Cake Up Admin"
admin.site.index_title = "Bem-vindo ao painel administrativo do Cake Up"

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Health Check
    path('api/health/', health_check, name='health_check'),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Apps URLs
    path('api/auth/', include('accounts.urls')),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/reports/', include('reports.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)




