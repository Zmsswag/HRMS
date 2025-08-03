from django.shortcuts import redirect
from django.contrib import messages

def custom_login_required(view_func):
    """自定义登录验证装饰器，替代Django的login_required"""
    def wrapper(request, *args, **kwargs):
        if not request.session.get('user_id'):
            messages.error(request, '请先登录')
            return redirect('login')
        return view_func(request, *args, **kwargs)
    return wrapper