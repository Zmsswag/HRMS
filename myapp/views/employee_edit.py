from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from django.core.paginator import Paginator
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.serializers.json import DjangoJSONEncoder
import json

from ..models import (
    EmployeeProfile, EmploymentHistory, Department, 
    EmployeeDepartment, Task, Attendance, Salary, TaskAssignment, Position
)

from ..decorators import custom_login_required

@custom_login_required
@require_http_methods(["GET", "POST", "PUT"])
def employee_edit(request, employee_id):
    """编辑员工信息"""
    employee = get_object_or_404(EmployeeProfile, pk=employee_id)
    
    # 获取当前用户的权限信息
    current_user_id = request.session.get('user_id')
    if not current_user_id:
        if request.content_type == 'application/json' or request.GET.get('format') == 'json':
            return JsonResponse({'error': '未登录或会话已过期'}, status=403)
        else:
            messages.error(request, '未登录或会话已过期')
            return redirect('login')
    
    # 获取当前用户的部门和权限
    try:
        current_user = EmployeeProfile.objects.get(employee_id=current_user_id)
        current_user_depts = EmployeeDepartment.objects.filter(employee=current_user)
        
        # 获取当前用户的最高权限
        current_user_max_power = 0
        current_user_departments = []
        current_user_power = None  # 初始化为None，避免未赋值错误
        
        for dept in current_user_depts:
            current_user_departments.append(dept.department.department_id)
            if dept.position.power and dept.position.power.power_level > current_user_max_power:
                current_user_max_power = dept.position.power.power_level
                current_user_power = dept.position.power
    except Exception as e:
        if request.content_type == 'application/json' or request.GET.get('format') == 'json':
            return JsonResponse({'error': f'获取用户权限失败: {str(e)}'}, status=403)
        else:
            messages.error(request, f'获取用户权限失败: {str(e)}')
            return redirect('employee_list')
    
    # 获取目标员工的权限
    target_user_depts = EmployeeDepartment.objects.filter(employee=employee)
    target_user_max_power = 0
    target_user_departments = []
    
    for dept in target_user_depts:
        target_user_departments.append(dept.department.department_id)
        if dept.position.power and dept.position.power.power_level > target_user_max_power:
            target_user_max_power = dept.position.power.power_level
    
    # 权限检查
    has_permission = False
    
    # 1. 检查是否为自己
    if current_user_id == employee.employee_id:
        has_permission = True
    # 2. 检查权限级别
    elif current_user_max_power > target_user_max_power:
        has_permission = True
    # 3. 检查部门权限
    elif current_user_power.modifie_same_department_position:
        # 检查是否有共同部门
        common_departments = set(current_user_departments).intersection(set(target_user_departments))
        if common_departments and current_user_max_power >= target_user_max_power:
            has_permission = True
    # 4. 检查跨部门权限
    elif current_user_power.modifie_other_department_position:
        if current_user_max_power >= target_user_max_power:
            has_permission = True
    
    if not has_permission:
        if request.content_type == 'application/json' or request.GET.get('format') == 'json':
            return JsonResponse({'error': '您没有权限修改此员工信息'}, status=403)
        else:
            messages.error(request, '您没有权限修改此员工信息')
            return redirect('employee_detail', employee_id=employee.employee_id)
    
    if request.method in ['POST', 'PUT']:
        # 判断是否是JSON请求
        if request.content_type == 'application/json':
            try:
                data = json.loads(request.body)
                name = data.get('name', employee.name)
                id_number = data.get('id_number', '')  # 允许身份证为空
                age = data.get('age', employee.age)
                is_employed = data.get('is_employed', employee.is_employed)
                leave_date = data.get('leave_date')
                leave_reason = data.get('leave_reason', '')
                department_ids = data.get('department_ids', [])
                position_ids = data.get('position_ids', [])
            except json.JSONDecodeError:
                return JsonResponse({'error': '无效的JSON数据'}, status=400)
        else:
            # 处理表单提交
            name = request.POST.get('name', employee.name)
            id_number = request.POST.get('id_number', '')  # 允许身份证为空
            age = request.POST.get('age', employee.age)
            is_employed = request.POST.get('is_employed') == 'true'
            leave_date = request.POST.get('leave_date')
            leave_reason = request.POST.get('leave_reason', '')
            department_ids = request.POST.getlist('department_ids', [])
            position_ids = request.POST.getlist('position_ids', [])
        
        # 更新员工基本信息
        employee.name = name
        employee.id_number = id_number  # 即使为空也可以保存
        employee.age = age
        
        # 处理雇佣状态变更
        if employee.is_employed != is_employed:
            employee.is_employed = is_employed
            
            # 如果是离职，创建离职记录
            if not is_employed and leave_date:
                # 查找最近的雇佣记录并更新
                try:
                    latest_history = EmploymentHistory.objects.filter(
                        employee=employee,
                        leave_date__isnull=True
                    ).latest('hire_date')
                    
                    if latest_history:
                        latest_history.leave_date = leave_date
                        latest_history.leave_reason = leave_reason
                        latest_history.save()
                except EmploymentHistory.DoesNotExist:
                    pass
        
        try:
            employee.save()
            
            # 处理部门和职位更新
            if department_ids and position_ids and len(department_ids) == len(position_ids):
                # 先删除现有关联
                EmployeeDepartment.objects.filter(employee=employee).delete()
                
                # 创建新关联
                for i in range(len(department_ids)):
                    try:
                        department = Department.objects.get(department_id=department_ids[i])
                        position = Position.objects.get(position_id=position_ids[i])
                        
                        EmployeeDepartment.objects.create(
                            employee=employee,
                            department=department,
                            position=position
                        )
                    except (Department.DoesNotExist, Position.DoesNotExist):
                        pass
            
            if request.content_type == 'application/json' or request.GET.get('format') == 'json':
                return JsonResponse({
                    'success': True,
                    'message': f'员工 {employee.name} 信息更新成功！'
                })
            else:
                messages.success(request, f'员工 {employee.name} 信息更新成功！')
                return redirect('employee_detail', employee_id=employee.employee_id)
        except Exception as e:
            if request.content_type == 'application/json' or request.GET.get('format') == 'json':
                return JsonResponse({
                    'success': False,
                    'error': f'更新员工信息失败：{str(e)}'
                }, status=400)
            else:
                messages.error(request, f'更新员工信息失败：{str(e)}')
    
    # 获取部门和职位信息用于表单选择
    departments = Department.objects.all()
    positions = Position.objects.all()
    dept_positions = EmployeeDepartment.objects.filter(employee=employee)
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.GET.get('format') == 'json':
        # 准备JSON数据
        employee_data = {
            'employee_id': employee.employee_id,
            'name': employee.name,
            'id_number': employee.id_number,
            'age': employee.age,
            'current_hire_date': employee.current_hire_date.strftime('%Y-%m-%d'),
            'is_employed': employee.is_employed,
        }
        
        # 部门职位信息
        dept_data = []
        for dp in dept_positions:
            dept_data.append({
                'department_id': dp.department.department_id,
                'department_name': dp.department.name,
                'position_id': dp.position.position_id,
                'position_title': dp.position.title,
            })
        
        # 部门和职位列表
        department_list = [{'id': dept.department_id, 'name': dept.name} for dept in departments]
        position_list = [{'id': pos.position_id, 'title': pos.title, 'department_id': pos.department.department_id} for pos in positions]
        
        return JsonResponse({
            'employee': employee_data,
            'current_departments': dept_data,
            'departments': department_list,
            'positions': position_list,
        })
    else:
        # 返回HTML页面
        context = {
            'employee': employee,
            'departments': departments,
            'positions': positions,
            'dept_positions': dept_positions,
        }
        return render(request, 'myapp/employee_edit.html', context)
