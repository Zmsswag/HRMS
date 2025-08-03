from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from django.core.paginator import Paginator
from django.utils import timezone

from ..models import (
    EmployeeProfile, EmploymentHistory, Department, 
    EmployeeDepartment, Task, Attendance, Salary
)

from ..decorators import custom_login_required

@custom_login_required
def employee_home(request):
    """员工首页"""
    return render(request,'myapp/employee.html')
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
        
        # 初始化employee_ids列表
        employee_ids = []
        for department_id in department_ids:
            employee_ids.extend(EmployeeDepartment.objects.filter(
                department_id=department_id
            ).values_list('employee_id', flat=True))
        
        if employee_ids:
            employees = employees.filter(employee_id__in=employee_ids)
    
    if is_employed == 'is_employed':
        employees = employees.filter(is_employed=True)
    elif is_employed == 'not_employed':
        employees = employees.filter(is_employed=False)
    
    # 分页
    paginator = Paginator(employees, 10)  # 每页10条
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    
    # 获取部门列表用于筛选
    departments = Department.objects.all()
    
    context = {
        'page_obj': page_obj,
        'departments': departments,
        'search_query': search_query,
        'department_query': department_query,  
        'is_employed': is_employed,
    }
    return render(request, 'myapp/employee_list.html', context)
#undo ----------------------------------------------------------------
@custom_login_required
def employee_detail(request, employee_id):
    """员工详情"""
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
    
    context = {
        'employee': employee,
        'dept_positions': dept_positions,
        'employment_history': employment_history,
        'recent_attendance': recent_attendance,
        'recent_salary': recent_salary,
        'assigned_tasks': assigned_tasks,
    }
    return JsonResponse(context)

@custom_login_required
def employee_add(request):
    """添加员工"""
    if request.method == 'POST':
        # 处理表单提交
        name = request.POST.get('name')
        id_number = request.POST.get('id_number')
        age = request.POST.get('age')
        hire_date = request.POST.get('hire_date')
        
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
            
            messages.success(request, f'员工 {name} 添加成功！')
            return redirect('employee_detail', employee_id=employee.employee_id)
        except Exception as e:
            messages.error(request, f'添加员工失败：{str(e)}')
    
    # 获取部门和职位信息用于表单选择
    departments = Department.objects.all()
    
    context = {
        'departments': departments,
    }
    return render(request, 'myapp/employee_add.html', context)

@custom_login_required
def employee_edit(request, employee_id):
    """编辑员工信息"""
    employee = get_object_or_404(EmployeeProfile, pk=employee_id)
    
    if request.method == 'POST':
        # 处理表单提交
        employee.name = request.POST.get('name')
        employee.id_number = request.POST.get('id_number')
        employee.age = request.POST.get('age')
        
        # 处理雇佣状态变更
        new_status = request.POST.get('is_employed') == 'true'
        if employee.is_employed != new_status:
            employee.is_employed = new_status
            
            # 如果是离职，创建离职记录
            if not new_status:
                leave_date = request.POST.get('leave_date')
                leave_reason = request.POST.get('leave_reason', '')
                
                # 查找最近的雇佣记录并更新
                latest_history = EmploymentHistory.objects.filter(
                    employee=employee,
                    leave_date__isnull=True
                ).latest('hire_date')
                
                if latest_history:
                    latest_history.leave_date = leave_date
                    latest_history.leave_reason = leave_reason
                    latest_history.save()
        
        try:
            employee.save()
            messages.success(request, f'员工 {employee.name} 信息更新成功！')
            return redirect('employee_detail', employee_id=employee.employee_id)
        except Exception as e:
            messages.error(request, f'更新员工信息失败：{str(e)}')
    
    # 获取部门和职位信息用于表单选择
    departments = Department.objects.all()
    dept_positions = EmployeeDepartment.objects.filter(employee=employee)
    
    context = {
        'employee': employee,
        'departments': departments,
        'dept_positions': dept_positions,
    }
    return render(request, 'myapp/employee_edit.html', context)