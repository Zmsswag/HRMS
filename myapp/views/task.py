from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.utils import timezone
import json

from ..models import Task, TaskAssignment, EmployeeProfile


@login_required
def task_list(request):
    """任务列表"""
    # 获取筛选参数
    status = request.GET.get('status', 'all')
    
    # 构建查询
    tasks = Task.objects.all()
    
    if status == 'pending':
        tasks = tasks.filter(completion__lt=100, actual_end__isnull=True)
    elif status == 'completed':
        tasks = tasks.filter(completion=100, actual_end__isnull=False)
    elif status == 'overdue':
        tasks = tasks.filter(expected_end__lt=timezone.now(), completion__lt=100)
    
    # 分页
    paginator = Paginator(tasks, 10)  # 每页10条
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'status': status,
    }
    return render(request, 'myapp/task_list.html', context)

@login_required
def task_detail(request, task_id):
    """任务详情"""
    task = get_object_or_404(Task, pk=task_id)
    
    # 获取任务分配的员工
    assignments = TaskAssignment.objects.filter(task=task)
    
    context = {
        'task': task,
        'assignments': assignments,
    }
    return render(request, 'myapp/task_detail.html', context)

@login_required
def task_add(request):
    """添加任务"""
    if request.method == 'POST':
        content = json.loads(request.POST.get('content', '{}'))
        assigner = request.POST.get('assigner')
        start_time = request.POST.get('start_time')
        expected_end = request.POST.get('expected_end')
        employee_ids = request.POST.getlist('employee_ids')
        
        # 创建任务
        task = Task.objects.create(
            completion=0,  # 初始进度为0
            content=content,
            assigner=assigner,
            start_time=start_time,
            expected_end=expected_end
        )
        
        # 分配任务给员工
        for employee_id in employee_ids:
            employee = get_object_or_404(EmployeeProfile, pk=employee_id)
            TaskAssignment.objects.create(
                task=task,
                employee=employee
            )
        
        messages.success(request, '任务创建成功！')
        return redirect('task_detail', task_id=task.task_id)
    
    # 获取员工列表用于表单选择
    employees = EmployeeProfile.objects.filter(is_employed=True)
    
    context = {
        'employees': employees,
    }
    return render(request, 'myapp/task_add.html', context)

@login_required
def task_update(request, task_id):
    """更新任务进度"""
    task = get_object_or_404(Task, pk=task_id)
    
    if request.method == 'POST':
        completion = int(request.POST.get('completion', 0))
        
        # 更新任务进度
        task.completion = completion
        
        # 如果完成度为100%，设置实际完成时间
        if completion == 100 and task.actual_end is None:
            task.actual_end = timezone.now()
        
        task.save()
        messages.success(request, '任务进度更新成功！')
        return redirect('task_detail', task_id=task.task_id)
    
    context = {
        'task': task,
    }
    return render(request, 'myapp/task_update.html', context)