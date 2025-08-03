from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required

from ..models import Department, Position, EmployeeDepartment


@login_required
def department_list(request):
    """部门列表"""
    departments = Department.objects.all()
    
    # 统计每个部门的员工数量
    for dept in departments:
        dept.employee_count = EmployeeDepartment.objects.filter(department=dept).count()
    
    context = {
        'departments': departments,
    }
    return render(request, 'myapp/department_list.html', context)

@login_required
def department_detail(request, department_id):
    """部门详情"""
    department = get_object_or_404(Department, pk=department_id)
    
    # 获取部门下的职位
    positions = Position.objects.filter(department=department)
    
    # 获取部门下的员工
    employee_depts = EmployeeDepartment.objects.filter(department=department)
    
    context = {
        'department': department,
        'positions': positions,
        'employee_depts': employee_depts,
    }
    return render(request, 'myapp/department_detail.html', context)