from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q, Sum, Avg
from django.core.paginator import Paginator
from django.utils import timezone
from datetime import datetime

from ..models import EmployeeProfile, Salary, EmployeeDepartment, Department


@login_required
def salary_list(request):
    """薪资列表"""
    # 获取筛选参数
    search_query = request.GET.get('search', '')
    department_id = request.GET.get('department', '')
    month = request.GET.get('month', '')
    
    # 设置默认月份为当前月
    if not month:
        month = timezone.now().date().replace(day=1)
    else:
        month = datetime.strptime(month, '%Y-%m').date()
    
    # 构建查询
    salaries = Salary.objects.filter(date=month)
    
    if search_query:
        salaries = salaries.filter(
            Q(employee__name__icontains=search_query) | 
            Q(employee__id_number__icontains=search_query)
        )
    
    if department_id:
        # 通过员工-部门关联表筛选
        employee_ids = EmployeeDepartment.objects.filter(
            department_id=department_id
        ).values_list('employee_id', flat=True)
        salaries = salaries.filter(employee_id__in=employee_ids)
    
    # 分页
    paginator = Paginator(salaries, 10)  # 每页10条
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    
    # 获取部门列表用于筛选
    departments = Department.objects.all()
    
    # 计算统计数据
    total_amount = salaries.aggregate(Sum('amount'))['amount__sum'] or 0
    avg_amount = salaries.aggregate(Avg('amount'))['amount__avg'] or 0
    
    context = {
        'page_obj': page_obj,
        'departments': departments,
        'search_query': search_query,
        'department_id': department_id,
        'month': month,
        'total_amount': total_amount,
        'avg_amount': avg_amount,
    }
    return render(request, 'myapp/salary_list.html', context)

@login_required
def salary_detail(request, employee_id):
    """员工薪资详情"""
    employee = get_object_or_404(EmployeeProfile, pk=employee_id)
    
    # 获取员工的所有薪资记录
    salaries = Salary.objects.filter(employee=employee).order_by('-date')
    
    # 计算统计数据
    total_amount = salaries.aggregate(Sum('amount'))['amount__sum'] or 0
    avg_amount = salaries.aggregate(Avg('amount'))['amount__avg'] or 0
    
    context = {
        'employee': employee,
        'salaries': salaries,
        'total_amount': total_amount,
        'avg_amount': avg_amount,
    }
    return render(request, 'myapp/salary_detail.html', context)

@login_required
def salary_add(request):
    """添加薪资记录"""
    if request.method == 'POST':
        employee_id = request.POST.get('employee_id')
        date = request.POST.get('date')
        amount = request.POST.get('amount')
        
        employee = get_object_or_404(EmployeeProfile, pk=employee_id)
        
        # 检查是否已存在该月薪资记录
        existing = Salary.objects.filter(
            employee=employee,
            date=date
        ).exists()
        
        if existing:
            messages.warning(request, f'员工 {employee.name} 在 {date} 已有薪资记录，请勿重复添加。')
        else:
            # 创建薪资记录
            Salary.objects.create(
                employee=employee,
                date=date,
                amount=amount
            )
            messages.success(request, f'员工 {employee.name} 的薪资记录添加成功！')
            return redirect('salary_list')
    
    # 获取员工列表用于表单选择
    employees = EmployeeProfile.objects.filter(is_employed=True)
    
    context = {
        'employees': employees,
    }
    return render(request, 'myapp/salary_add.html', context)