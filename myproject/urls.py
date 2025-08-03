# myproject/urls.py
from django.contrib import admin
from django.urls import path, include
# 导入 workflows.urls 中定义的 URL 列表
from workflows.urls import api_urlpatterns, page_urlpatterns
# 导入开发环境静态文件服务配置
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # myapp 应用的 URLs
    path('', include('myapp.urls')),

    # 工作流 API URLs (前缀: /api/workflows/)
    path('api/workflows/', include((api_urlpatterns, 'workflows-api'), namespace='workflows-api')),

    # 工作流 SPA 页面/入口 URLs (前缀: /workflows/)
    path('workflows/', include((page_urlpatterns, 'workflows-pages'), namespace='workflows-pages')),
]

# 仅在开发模式 (DEBUG=True) 下添加静态文件服务
# 这允许 Django 开发服务器提供 React 构建的 JS/CSS 文件
if settings.DEBUG:
    # 告诉 Django 从 /static/ URL 提供 staticfiles 目录下的文件
    urlpatterns += static(settings.STATIC_URL, document_root=settings.BASE_DIR / 'staticfiles')