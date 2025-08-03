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
def employee_detail_json(request, employee_id):
    """获取员工详情的JSON数据"""
    employee = get_object_or_404(EmployeeProfile, pk=employee_id)
    
    # 获取员工的部门和职位信息
    dept_positions = EmployeeDepartment.objects.filter(employee=employee)
    
    # 获取雇佣历史
    employment_history = EmploymentHistory.objects.filter(employee=employee).order_by('-hire_date')
    
    # 获取最近的考勤记录
    recent_attendance = Attendance.objects.filter(employee=employee).order_by('-date', '-time')[:10]
    
    # 获取最近的薪资记录
    recent_salary = Salary.objects.filter(employee=employee).order_by('-date')[:12]
    
    # 获取分配的任务
    assigned_tasks = Task.objects.filter(
        taskassignment__employee=employee,
        actual_end__isnull=True
    ).order_by('expected_end')
    
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
    
    # 雇佣历史
    history_data = []
    for history in employment_history:
        history_data.append({
            'record_id': history.record_id,
            'hire_date': history.hire_date.strftime('%Y-%m-%d'),
            'leave_date': history.leave_date.strftime('%Y-%m-%d') if history.leave_date else None,
            'leave_reason': history.leave_reason,
        })
    
    # 考勤记录
    attendance_data = []
    for att in recent_attendance:
        attendance_data.append({
            'date': att.date.strftime('%Y-%m-%d'),
            'type': att.type,
            'time': att.time.strftime('%H:%M:%S'),
        })
    
    # 薪资记录
    salary_data = []
    for sal in recent_salary:
        salary_data.append({
            'date': sal.date.strftime('%Y-%m'),
            'amount': float(sal.amount),
        })
    
    # 任务信息
    task_data = []
    for task in assigned_tasks:
        task_data.append({
            'task_id': task.task_id,
            'content': task.content,
            'completion': task.completion,
            'assign_time': task.assign_time.strftime('%Y-%m-%d %H:%M'),
            'expected_end': task.expected_end.strftime('%Y-%m-%d %H:%M'),
        })
    
    return JsonResponse({
        'employee': employee_data,
        'departments': dept_data,
        'employment_history': history_data,
        'attendance': attendance_data,
        'salary': salary_data,
        'tasks': task_data,
    })


@custom_login_required
def employee_detail(request, employee_id):
    """员工详情"""
    # 判断请求类型，返回不同的响应
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.GET.get('format') == 'json':
        # 直接调用employee_detail_json函数获取JSON数据
        return employee_detail_json(request, employee_id)
    else:
        # 获取员工基本信息用于渲染HTML页面
        employee = get_object_or_404(EmployeeProfile, pk=employee_id)
        
        # 返回HTML页面，不预加载数据，由前端通过AJAX获取
        context = {
            'employee_id': employee_id,
            'employee': employee,
        }
        return render(request, 'myapp/employee_detail.html', context)

