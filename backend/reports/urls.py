from django.urls import path
from .views import (
    DashboardStatsView, SalesReportView, ProductPerformanceView,
    OperatorPerformanceView, CustomerStatsView
)

urlpatterns = [
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('sales/', SalesReportView.as_view(), name='sales-report'),
    path('products/', ProductPerformanceView.as_view(), name='product-performance'),
    path('operators/', OperatorPerformanceView.as_view(), name='operator-performance'),
    path('customers/', CustomerStatsView.as_view(), name='customer-stats'),
]


