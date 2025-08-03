# workflows/urls.py
from . import views
from django.urls import path, re_path, include
from rest_framework.routers import DefaultRouter

# 创建一个 DRF 路由器
router = DefaultRouter()
# 注册视图集
router.register(r'definitions', views.WorkflowDefinitionViewSet, basename='workflowdefinition')
router.register(r'instances', views.WorkflowInstanceViewSet, basename='workflowinstance')
router.register(r'tasks', views.WorkflowTaskViewSet, basename='workflowtask')

# 应用的 URL 配置
urlpatterns = [
    # 包含路由器生成的 URL
    path('', include(router.urls)),
    # 设计器配置的单独 URL
    path('designer/config/', views.WorkflowDesignerConfigView.as_view(), name='workflow-designer-config'),
]# --- API Router (用于 DRF ViewSets) ---
router = DefaultRouter()
router.register(r'definitions', views.WorkflowDefinitionViewSet, basename='workflowdefinition')
# ... 在这里注册所有工作流相关的 API ViewSet ...

# --- API URL Patterns (列表) ---
api_urlpatterns = [
    # 包含由 router 自动生成的 API URLs (/definitions/, /definitions/{pk}/ etc.)
    path('', include(router.urls)),
    # 单独定义的 API 端点
    path('designer/config/', views.WorkflowDesignerConfigView.as_view(), name='workflow-designer-config'),
]

# --- Page / SPA Entry URL Patterns (列表) ---
page_urlpatterns = [
    # /workflows/ (基础路径) -> 指向 SPA 入口视图
    path('', views.workflow_spa_entry, name='workflow_spa_index'),

    # 通配符路由: /workflows/ 下的任何其他路径都指向 SPA 入口视图，
    # 以便 React Router 能够处理客户端路由 (例如 /workflows/tasks, /workflows/designer/123)
    # 需要放在具体 Django 页面路由之后（如果你有的话）
    re_path(r'^(?:.*)/$', views.workflow_spa_entry, name='workflow_spa_catchall'),
    re_path(r'^(?:.*)$', views.workflow_spa_entry, name='workflow_spa_catchall_no_slash'),
]