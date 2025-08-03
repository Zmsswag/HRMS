from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.utils import timezone
import json

from ..models import (
    Task, TaskAssignment, EmployeeProfile, 
    Department, EmployeeDepartment, Position
)


@login_required
def task_distribution_view(request):
    """任务分发页面"""
    return render(request, 'myapp/task_distribution.html')


@login_required
@require_http_methods(["GET"])
def get_departments(request):
    """获取所有部门信息"""
    departments = Department.objects.all()
    data = [{
        'id': dept.department_id,
        'name': dept.name
    } for dept in departments]
    
    return JsonResponse({'departments': data})


@login_required
@require_http_methods(["GET"])
def get_employees(request):
    """获取员工信息，支持按部门筛选"""
    department_id = request.GET.get('department_id')
    
    # 构建查询
    employees = EmployeeProfile.objects.filter(is_employed=True)
    
    # 如果指定了部门，则筛选该部门的员工
    if department_id:
        # 通过员工-部门关联表筛选
        employee_ids = EmployeeDepartment.objects.filter(
            department_id=department_id
        ).values_list('employee_id', flat=True)
        
        employees = employees.filter(employee_id__in=employee_ids)
    
    # 构建返回数据
    data = []
    for emp in employees:
        # 获取员工的部门和职位信息
        dept_positions = EmployeeDepartment.objects.filter(employee=emp).select_related('department', 'position')
        
        departments = [{
            'id': dp.department.department_id,
            'name': dp.department.name,
            'position': dp.position.title
        } for dp in dept_positions]
        
        data.append({
            'id': emp.employee_id,
            'name': emp.name,
            'departments': departments
        })
    
    return JsonResponse({'employees': data})


@login_required
@require_http_methods(["GET"])
def get_positions(request):
    """获取职位信息，支持按部门筛选"""
    department_id = request.GET.get('department_id')
    
    # 构建查询
    positions = Position.objects.all()
    
    # 如果指定了部门，则筛选该部门的职位
    if department_id:
        positions = positions.filter(department_id=department_id)
    
    # 构建返回数据
    data = [{
        'id': pos.position_id,
        'title': pos.title,
        'department_id': pos.department.department_id,
        'department_name': pos.department.name
    } for pos in positions]
    
    return JsonResponse({'positions': data})


@login_required
@require_http_methods(["POST"])
def create_task(request):
    """创建任务并分配"""
    try:
        data = json.loads(request.body)
        
        title = data.get('title')
        description = data.get('description')
        priority = data.get('priority', 'medium')
        start_time = data.get('start_time')
        expected_end = data.get('expected_end')
        distribution_method = data.get('distribution_method')
        assignees = data.get('assignees', [])
        
        # 创建任务内容JSON
        content = {
            'title': title,
            'description': description,
            'priority': priority
        }
        
        # 创建任务
        task = Task.objects.create(
            completion=0,  # 初始进度为0
            content=content,
            assigner=request.user.username,  # 使用当前用户作为分配人
            start_time=start_time,
            expected_end=expected_end
        )
        
        # 根据分配方式处理任务分配
        if distribution_method == 'specific':
            # 直接分配给指定员工
            for employee_id in assignees:
                employee = get_object_or_404(EmployeeProfile, pk=employee_id)
                TaskAssignment.objects.create(
                    task=task,
                    employee=employee
                )
        
        elif distribution_method == 'department':
            # 分配给部门所有员工
            for department_id in assignees:
                # 获取部门下所有员工
                employee_ids = EmployeeDepartment.objects.filter(
                    department_id=department_id
                ).values_list('employee_id', flat=True)
                
                # 为每个员工创建任务分配
                for employee_id in employee_ids:
                    employee = get_object_or_404(EmployeeProfile, pk=employee_id)
                    TaskAssignment.objects.create(
                        task=task,
                        employee=employee
                    )
        
        elif distribution_method == 'role':
            # 分配给特定角色的员工
            for position_id in assignees:
                # 获取该职位的所有员工
                employee_ids = EmployeeDepartment.objects.filter(
                    position_id=position_id
                ).values_list('employee_id', flat=True)
                
                # 为每个员工创建任务分配
                for employee_id in employee_ids:
                    employee = get_object_or_404(EmployeeProfile, pk=employee_id)
                    TaskAssignment.objects.create(
                        task=task,
                        employee=employee
                    )
        
        return JsonResponse({
            'success': True,
            'task_id': task.task_id,
            'message': '任务创建并分配成功'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'任务创建失败: {str(e)}'
        }, status=400)