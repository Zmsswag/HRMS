from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.utils import timezone
from django.http import JsonResponse

from ..models import JobApplication, Department, Position


def job_application_form(request):
    """招聘申请表单"""
    if request.method == 'POST':
        name = request.POST.get('name')
        id_number = request.POST.get('id_number')
        education = request.POST.get('education')
        department_id = request.POST.get('department_id')
        position_id = request.POST.get('position_id')
        
        department = get_object_or_404(Department, pk=department_id)
        position = get_object_or_404(Position, pk=position_id)
        
        # 创建招聘申请
        JobApplication.objects.create(
            name=name,
            date=timezone.now().date(),
            id_number=id_number,
            education=education,
            expected_department=department,
            expected_position=position
        )
        
        messages.success(request, '您的申请已提交成功！我们会尽快与您联系。')
        return redirect('job_application_success')
    
    # 获取部门和职位信息用于表单选择
    departments = Department.objects.all()
    
    context = {
        'departments': departments,
    }
    return render(request, 'myapp/job_application_form.html', context)

def job_application_success(request):
    """招聘申请成功页面"""
    return render(request, 'myapp/job_application_success.html')

@login_required
def job_application_list(request):
    """招聘申请列表"""
    # 获取筛选参数
    department_id = request.GET.get('department', '')
    position_id = request.GET.get('position', '')
    
    # 构建查询
    applications = JobApplication.objects.all().order_by('-date')
    
    if department_id:
        applications = applications.filter(expected_department_id=department_id)
    
    if position_id:
        applications = applications.filter(expected_position_id=position_id)
    
    # 分页
    paginator = Paginator(applications, 10)  # 每页10条
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    
    # 获取部门和职位列表用于筛选
    departments = Department.objects.all()
    positions = Position.objects.all()
    
    context = {
        'page_obj': page_obj,
        'departments': departments,
        'positions': positions,
        'department_id': department_id,
        'position_id': position_id,
    }
    return render(request, 'myapp/job_application_list.html', context)

# API接口
def get_positions(request):
    """获取部门下的职位列表（AJAX接口）"""
    department_id = request.GET.get('department_id')
    
    if not department_id:
        return JsonResponse({'error': '缺少部门ID参数'}, status=400)
    
    positions = Position.objects.filter(department_id=department_id).values('position_id', 'title')
    
    return JsonResponse(list(positions), safe=False)