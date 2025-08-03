from django.contrib.auth.hashers import make_password, check_password
from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth import logout
from myapp.models import UserAccount
from django.urls import reverse



@custom_login_required
def return_base_information(request):
    """
    以json格式返回用户个人信息
    """
    # 获取当前登录用户的信息
    user_id = request.session.get('user_id')
    if not user_id:
        return JsonResponse({'error': '未登录或会话已过期'}, status=403)
    
    try:
        user = EmployeeProfile.objects.get(employee_id=user_id)
        user_departments = EmployeeDepartment.objects.filter(employee=user).select_related('department', 'position')
        
        # 构建用户信息
        user_info = {
            'employee_id': user.employee_id,
            'name': user.name,
            'departments': []
        }
        
        for dept in user_departments:
            user_info['departments'].append({
                'department_name': dept.department.name,
                'position_title': dept.position.title
            })
        
        return JsonResponse(user_info)
    except Exception as e:
        return JsonResponse({'error': f'获取用户信息失败: {str(e)}'}, status=500)
    