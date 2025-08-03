from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q, Prefetch
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
def employee_list(request):
    """员工列表"""
    # 获取筛选参数
    
    #模糊搜索员工名或者员工id
    search_query = request.GET.get('search', '')
    
    #模糊搜索部门名或者部门id
    department_query = request.GET.get('department', '')
    
    #筛选条件
    is_employed = request.GET.get('status', 'all')
    
    # 构建查询
    employees = EmployeeProfile.objects.all()
    
    if search_query:
        employees = employees.filter(
            Q(name__icontains=search_query) | 
            Q(id_number__icontains=search_query)
        )
    
    if department_query:
        # 通过员工-部门关联表筛选
        department_ids = Department.objects.filter(
            Q(name__icontains=department_query) | 
            Q(department_id=department_query)
        ).values_list('department_id', flat=True)
        
        # 使用 IN 查询优化，避免循环查询
        if department_ids:
            employee_ids = EmployeeDepartment.objects.filter(
                department_id__in=department_ids
            ).values_list('employee_id', flat=True).distinct()
            
            if employee_ids:
                employees = employees.filter(employee_id__in=employee_ids)
    
    if is_employed == 'is_employed':
        employees = employees.filter(is_employed=True)
    elif is_employed == 'not_employed':
        employees = employees.filter(is_employed=False)
    
    # 获取部门列表用于筛选（提前获取，避免在JSON响应中再次查询）
    departments = list(Department.objects.all())
    
    # 分页前预加载员工的部门关系，避免N+1查询
    # 使用Prefetch对象可以更精确地控制预加载的查询
    employees = employees.prefetch_related(
        Prefetch(
            'employeedepartment_set',
            queryset=EmployeeDepartment.objects.select_related('department', 'position'),
            to_attr='prefetched_departments'
        )
    )
    
    # 分页
    paginator = Paginator(employees, 10)  # 每页10条
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    
    # 判断请求类型，返回不同的响应
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.GET.get('format') == 'json':
        # 准备JSON数据
        employee_list = []
        for employee in page_obj:
            # 使用预加载的部门信息，避免N+1查询
            dept_info = []
            for dept_relation in getattr(employee, 'prefetched_departments', []):
                dept_info.append({
                    'department_name': dept_relation.department.name,
                    'position_title': dept_relation.position.title
                })
            
            employee_list.append({
                'employee_id': employee.employee_id,
                'name': employee.name,
                'id_number': employee.id_number,
                'age': employee.age,
                'current_hire_date': employee.current_hire_date.strftime('%Y-%m-%d'),
                'is_employed': employee.is_employed,
                'departments': dept_info
            })
        
        # 准备分页信息
        pagination = {
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
            'has_previous': page_obj.has_previous(),
            'has_next': page_obj.has_next(),
            'previous_page': page_obj.previous_page_number() if page_obj.has_previous() else None,
            'next_page': page_obj.next_page_number() if page_obj.has_next() else None,
        }
        
        # 使用已经查询的部门列表，避免重复查询
        department_list = [{'id': dept.department_id, 'name': dept.name} for dept in departments]
        
        return JsonResponse({
            'employees': employee_list,
            'pagination': pagination,
            'departments': department_list,
            'filters': {
                'search_query': search_query,
                'department_query': department_query,
                'is_employed': is_employed,
            }
        })
    else:
        # 返回HTML页面
        context = {
            'page_obj': page_obj,
            'departments': departments,
            'search_query': search_query,
            'department_query': department_query,  
            'is_employed': is_employed,
        }
        return render(request, 'myapp/employee_list.html', context)
