from django.contrib.auth.hashers import make_password, check_password
from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth import logout, login
from django.contrib.auth.models import User
from myapp.models import UserAccount

def user_login(request):
    """用户登录"""
    if request.method == 'POST':
        account = request.POST.get('account')
        password = request.POST.get('password')
        
        try:
            user_account = UserAccount.objects.get(account=account)
            if check_password(password, user_account.password):
                # 登录成功，设置session
                request.session['user_id'] = user_account.employee.employee_id
                request.session['user_name'] = user_account.employee.name
                
                # 获取或创建Django User对象
                try:
                    user = User.objects.get(username=account)
                except User.DoesNotExist:
                    # 如果不存在，创建一个新的User对象
                    user = User.objects.create(
                        username=account,
                        password=user_account.password  # 已经是哈希过的密码
                    )
                
                # 使用Django的login函数设置认证状态
                user.backend = 'django.contrib.auth.backends.ModelBackend'
                login(request, user)
                
                messages.success(request, f'欢迎回来，{user_account.employee.name}！')
                return redirect('home')
            else:
                messages.error(request, '密码错误，请重试。')
        except UserAccount.DoesNotExist:
            messages.error(request, '账号不存在，请检查输入。')
    
    return render(request, 'myapp/login.html')