# myproject/settings.py

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-_y7hu(d4y&&ejfp73rghksmti-g=$qr+k(5w^gj3=xj=v=feer'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles', # 确保这个应用已启用
    'myapp',
    'workflows',
    'rest_framework'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware', # Session 支持
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',           # CSRF 保护
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'myproject.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        # 包含项目级模板目录和包含 React index.html 的目录
        'DIRS': [
            BASE_DIR / 'templates',      # 你可能有的项目级模板目录
            BASE_DIR / 'staticfiles',    # 让 render() 能找到 staticfiles/frontend/index.html
        ],
        'APP_DIRS': True, # 允许在应用内部查找模板
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'myproject.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'hrproject',     # 新数据库名
        'USER': 'root',             # 数据库用户名
        'PASSWORD': '131452',# 数据库密码
        'HOST': 'localhost',        # 数据库地址
        'PORT': '3306',             # 端口
        'OPTIONS': {
            'charset': 'utf8mb4',   # 支持 Emoji 和特殊字符
        },
    }
}

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = '/static/' # URL 前缀，用于访问静态文件

# ！！！ 修改这里：告诉 Django 在哪里查找静态文件源 ！！！
# 除了各个 app 下的 static/ 目录外，还包括 myapp 的静态目录和你存放 React 构建结果的目录
STATICFILES_DIRS = [
    BASE_DIR / 'myapp' / 'static',      # 保留你原来的 myapp 静态文件目录
    BASE_DIR / 'staticfiles',           # ！！！添加这里：让 Django 能找到 staticfiles/frontend/assets/ 等
]

# collectstatic 将把所有静态文件收集到这个目录 (主要用于生产环境)
# 在开发环境中，DEBUG=True 时，Django 会直接从 STATICFILES_DIRS 和 app/static 提供文件
STATIC_ROOT = BASE_DIR / 'staticfiles_collected' # 建议改成一个不同的目录名以避免混淆

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# 认证系统设置 (如果需要覆盖默认值)
# LOGIN_URL = 'myapp:login' # 示例：如果你的登录视图在 myapp 中，名称为 login
# LOGIN_REDIRECT_URL = '/'   # 登录后重定向的默认 URL
# LOGOUT_REDIRECT_URL = '/'  # 登出后重定向的默认 URL