from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q, Sum, Avg
from django.core.paginator import Paginator
from django.utils import timezone
from datetime import datetime, timedelta

import json

from .models import (
    EmployeeProfile, EmploymentHistory, UserAccount, Attendance,
    Salary, Message, Department, Position, EmployeeDepartment,
    Approval, JobApplication, Task, TaskAssignment
)





# 首页视图
# 员工管理相关视图
@login_required
def employee_list(request):
    """员工列表"""
    # 获取筛选参数
    search_query = request.GET.get('search', '')
    department_id = request.GET.get('department', '')
    is_employed = request.GET.get('status', 'all')
    
    # 构建查询
    employees = EmployeeProfile.objects.all()
    
    if search_query:
        employees = employees.filter(
            Q(name__icontains=search_query) | 
            Q(id_number__icontains=search_query)
        )
    
    if department_id:
        # 通过员工-部门关联表筛选
        employee_ids = EmployeeDepartment.objects.filter(
            department_id=department_id
        ).values_list('employee_id', flat=True)
        employees = employees.filter(employee_id__in=employee_ids)
    
    if is_employed != 'all':
        employees = employees.filter(is_employed=(is_employed == 'true'))
    
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
        'department_id': department_id,
        'is_employed': is_employed,
    }
    return render(request, 'myapp/employee_list.html', context)

@login_required
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
    return render(request, 'myapp/employee_detail.html', context)

@login_required
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

@login_required
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

# 考勤管理相关视图
@login_required
def attendance_record(request):
    """考勤打卡"""
    if request.method == 'POST':
        employee_id = request.session.get('user_id')
        attendance_type = request.POST.get('type')
        
        if not employee_id:
            messages.error(request, '请先登录系统。')
            return redirect('login')
        
        employee = get_object_or_404(EmployeeProfile, pk=employee_id)
        today = timezone.now().date()
        
        # 检查是否已经打过相同类型的卡
        existing = Attendance.objects.filter(
            employee=employee,
            date=today,
            type=attendance_type
        ).exists()
        
        if existing:
            messages.warning(request, f'今日已经{attendance_type=="in" and "上班" or "下班"}打卡，无需重复操作。')
        else:
            # 创建打卡记录
            Attendance.objects.create(
                employee=employee,
                date=today,
                type=attendance_type,
                time=timezone.now()
            )
            messages.success(request, f'{attendance_type=="in" and "上班" or "下班"}打卡成功！')
    
    # 获取当前用户的打卡记录
    employee_id = request.session.get('user_id')
    if employee_id:
        employee = get_object_or_404(EmployeeProfile, pk=employee_id)
        today = timezone.now().date()
        
        # 获取今日打卡状态
        today_in = Attendance.objects.filter(
            employee=employee,
            date=today,
            type='in'
        ).first()
        
        today_out = Attendance.objects.filter(
            employee=employee,
            date=today,
            type='out'
        ).first()
        
        # 获取最近一周的打卡记录
        week_ago = today - timedelta(days=7)
        recent_records = Attendance.objects.filter(
            employee=employee,
            date__gte=week_ago
        ).order_by('-date', '-time')
        
        context = {
            'today_in': today_in,
            'today_out': today_out,
            'recent_records': recent_records,
        }
    else:
        context = {}
    
    return render(request, 'myapp/attendance_record.html', context)

@login_required
def attendance_stats(request):
    """考勤统计"""
    # 获取筛选参数
    department_id = request.GET.get('department', '')
    start_date = request.GET.get('start_date', '')
    end_date = request.GET.get('end_date', '')
    
    # 设置默认日期范围为本月
    if not start_date or not end_date:
        today = timezone.now().date()
        start_date = today.replace(day=1)
        end_date = today
    else:
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    
    # 构建查询
    attendance_query = Attendance.objects.filter(
        date__gte=start_date,
        date__lte=end_date
    )
    
    if department_id:
        # 通过员工-部门关联表筛选
        employee_ids = EmployeeDepartment.objects.filter(
            department_id=department_id
        ).values_list('employee_id', flat=True)
        attendance_query = attendance_query.filter(employee_id__in=employee_ids)
    
    # 按员工分组统计
    employees = EmployeeProfile.objects.filter(is_employed=True)
    stats = []
    
    for employee in employees:
        employee_records = attendance_query.filter(employee=employee)
        
        # 统计上班打卡次数
        in_count = employee_records.filter(type='in').count()
        
        # 统计下班打卡次数
        out_count = employee_records.filter(type='out').count()
        
        # 计算工作日数量（简化处理，实际应考虑节假日）
        workdays = (end_date - start_date).days + 1
        
        stats.append({
            'employee': employee,
            'in_count': in_count,
            'out_count': out_count,
            'workdays': workdays,
            'attendance_rate': round((in_count / workdays) * 100, 2) if workdays > 0 else 0,
        })
    
    # 获取部门列表用于筛选
    departments = Department.objects.all()
    
    context = {
        'stats': stats,
        'departments': departments,
        'department_id': department_id,
        'start_date': start_date,
        'end_date': end_date,
    }
    return render(request, 'myapp/attendance_stats.html', context)

# 薪资管理相关视图
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

# 部门管理相关视图
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

# 任务管理相关视图
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

# 消息通知相关视图
@login_required
def message_list(request):
    """消息列表"""
    employee_id = request.session.get('user_id')
    
    if not employee_id:
        messages.error(request, '请先登录系统。')
        return redirect('login')
    
    employee = get_object_or_404(EmployeeProfile, pk=employee_id)
    
    # 获取员工的所有消息
    user_messages = Message.objects.filter(employee=employee).order_by('-timestamp')
    
    # 分页
    paginator = Paginator(user_messages, 10)  # 每页10条
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
    }
    return render(request, 'myapp/message_list.html', context)

@login_required
def message_detail(request, message_id):
    """消息详情"""
    message = get_object_or_404(Message, pk=message_id)
    
    # 标记消息为已读
    if not message.is_read:
        message.is_read = True
        message.save()
    
    context = {
        'message': message,
    }
    return render(request, 'myapp/message_detail.html', context)

# 招聘管理相关视图
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
