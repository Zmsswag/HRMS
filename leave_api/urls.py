# leave_api/urls.py
from django.urls import path
from . import views # 从当前应用导入视图

urlpatterns = [
    path('requests/pending/', views.PendingApprovalsListView.as_view(), name='pending-leave-requests'),
    path('requests/<int:pk>/approve/', views.ApproveLeaveRequestView.as_view(), name='approve-leave-request'),
    path('requests/<int:pk>/reject/', views.RejectLeaveRequestView.as_view(), name='reject-leave-request'),
]