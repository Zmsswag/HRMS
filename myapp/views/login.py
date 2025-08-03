from django.contrib.auth.hashers import make_password, check_password
from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth import logout
from myapp.models import UserAccount
from django.urls import reverse


# 用户认证相关视图
def user_login(request):
    """用户登录"""
    # 如果用户已登录且请求的是登录页面，直接跳转到首页
    # 注意：只有当请求的是GET方法时才进行这个检查
    if  request.method == 'GET'  and request.session.get('user_id'):
        print("session has got")
        return redirect('home')
    
    if request.method == 'POST':
        account = request.POST.get('account')
        password = request.POST.get('password')
        
        try:
            user = UserAccount.objects.get(account=account)
            if check_password(password, user.password):
                # 登录成功，设置session
                request.session['user_id'] = user.employee.employee_id
                request.session['user_name'] = user.employee.name
                # 确保session被保存
                request.session.save()
                
                messages.success(request, f'欢迎回来，{user.employee.name}！')
                
                return redirect('home')
            else:
                messages.error(request, '密码错误，请重试。')
        except UserAccount.DoesNotExist:
            messages.error(request, '账号不存在，请检查输入。')
    
    # 只有未登录用户才会到达这里
    return render(request, 'myapp/login.html')

def user_logout(request):
    """用户登出"""
    # 清除所有session数据
    request.session.flush()
    messages.info(request, '您已成功退出系统。')
    return redirect('login')