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
def employee_home(request):
    """员工首页"""
    return render(request,'myapp/employee_home.html')
@custom_login_required
@require_http_methods(["GET", "POST"])
def employee_add(request):
    """添加员工"""
    if request.method == 'POST':
        # 判断是否是JSON请求
        if request.content_type == 'application/json':
            try:
                data = json.loads(request.body)
                name = data.get('name')
                id_number = data.get('id_number', '')
                age = data.get('age')
                hire_date = data.get('hire_date')
                department_ids = data.get('department_ids', [])
                position_ids = data.get('position_ids', [])
            except json.JSONDecodeError:
                return JsonResponse({'error': '无效的JSON数据'}, status=400)
        else:
            # 处理表单提交
            name = request.POST.get('name')
            id_number = request.POST.get('id_number', '')
            age = request.POST.get('age')
            hire_date = request.POST.get('hire_date')
            department_ids = request.POST.getlist('department_ids', [])
            position_ids = request.POST.getlist('position_ids', [])
        
        # 创建员工档案
        try:
            employee = EmployeeProfile.objects.create(
                name=name,
                id_number=id_number,
                age=age,
                current_hire_date=hire_date,
                is_employed=True
            )
            
            # 创建雇佣历史记录
            EmploymentHistory.objects.create(
                employee=employee,
                hire_date=hire_date
            )
            
            # 处理部门和职位分配
            if department_ids and position_ids and len(department_ids) == len(position_ids):
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
                    'message': f'员工 {name} 添加成功！',
                    'employee_id': employee.employee_id
                }, status=201)
            else:
                messages.success(request, f'员工 {name} 添加成功！')
                return redirect('employee_detail', employee_id=employee.employee_id)
        except Exception as e:
            if request.content_type == 'application/json' or request.GET.get('format') == 'json':
                return JsonResponse({
                    'success': False,
                    'error': f'添加员工失败：{str(e)}'
                }, status=400)
            else:
                messages.error(request, f'添加员工失败：{str(e)}')
    
    # 获取部门和职位信息用于表单选择
    departments = Department.objects.all()
    positions = Position.objects.all()
    
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.GET.get('format') == 'json':
        # 返回JSON格式的部门和职位数据
        department_list = [{'id': dept.department_id, 'name': dept.name} for dept in departments]
        position_list = [{'id': pos.position_id, 'title': pos.title, 'department_id': pos.department.department_id} for pos in positions]
        
        return JsonResponse({
            'departments': department_list,
            'positions': position_list,
        })
    else:
        # 返回HTML页面
        context = {
            'departments': departments,
            'positions': positions,
        }
        return render(request, 'myapp/employee_add.html', context)

# 新增删除员工API
@custom_login_required
@require_http_methods(["DELETE"])
def employee_delete(request, employee_id):
    """删除员工"""
    employee = get_object_or_404(EmployeeProfile, pk=employee_id)
    
    try:
        employee_name = employee.name
        employee.delete()
        
        return JsonResponse({
            'success': True,
            'message': f'员工 {employee_name} 已成功删除'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'删除员工失败：{str(e)}'
        }, status=400)