from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login
from django.shortcuts import render, redirect
from django.contrib import messages
from django.utils import timezone
from datetime import timedelta
import calendar

from ..models import (
    EmployeeProfile, Department, Task, Message, 
    Attendance, Salary, EmployeeDepartment,MessageEmployee
)
from ..decorators import custom_login_required
# 使用自定义装饰器替代Django的login_required
@custom_login_required
def home(request):
    print("进入home视图")
    print(f"当前用户ID: {request.session.get('user_id')}")
    print(f"当前用户名: {request.session.get('user_name')}")
    
    """系统首页"""
    # 获取系统概览数据
    employee_count = EmployeeProfile.objects.filter(is_employed=True).count()
    department_count = Department.objects.count()
    task_count = Task.objects.filter(actual_end__isnull=True).count()
    
    # 获取最近的消息
    recent_messages = Message.objects.all().order_by('-timestamp')[:5]
    
    # 获取未读消息数量
    unread_message_count = MessageEmployee.objects.filter(
        message__is_read=False,
        employee__employee_id=request.session.get('user_id')
        
    ).count()
    
    # 获取员工数据统计（按月统计员工数量变化）
    today = timezone.now().date()
    months = []
    employee_counts = []
    
    for i in range(6):
        # 计算6个月前到当前月的数据
        month_date = (today.replace(day=1) - timedelta(days=30*i))
        month_name = f"{month_date.month}月"
        months.append(month_name)
        
        # 获取当月在职员工数量
        count = EmployeeProfile.objects.filter(
            is_employed=True,
            current_hire_date__lte=month_date
        ).count()
        employee_counts.append(count)
    
    # 反转列表以按时间顺序显示
    months.reverse()
    employee_counts.reverse()

    # 获取上个月的日期范围
    today = timezone.now().date()
    first_day_of_current_month = today.replace(day=1)
    last_day_of_previous_month = first_day_of_current_month - timedelta(days=1)
    first_day_of_previous_month = last_day_of_previous_month.replace(day=1)
    
    # 获取上个月的天数
    _, last_month_days = calendar.monthrange(first_day_of_previous_month.year, first_day_of_previous_month.month)
    
    # 获取在职员工总数
    total_employees = EmployeeProfile.objects.filter(is_employed=True).count()
    
    # 正常出勤：有上班打卡和下班打卡的记录
    normal_attendance_count = Attendance.objects.filter(
        date__gte=first_day_of_previous_month,
        date__lte=last_day_of_previous_month,
        type='out'  # 通过前端保证必须先上班打卡才能下班打卡
    ).values('employee_id', 'date').distinct().count()
    
    # 迟到：上班打卡时间晚于9:00的记录
    late_attendance_count = Attendance.objects.filter(
        date__gte=first_day_of_previous_month,
        date__lte=last_day_of_previous_month,
        type='in',
        time__hour__gte=9,
        time__minute__gt=0
    ).count()
    
    # 早退：下班打卡时间早于18:00的记录
    early_leave_count = Attendance.objects.filter(
        date__gte=first_day_of_previous_month,
        date__lte=last_day_of_previous_month,
        type='out',
        time__hour__lt=18
    ).count()
    
    # 缺勤：工作日没有打卡记录的员工数
    # 假设每个工作日都应该有记录，简化计算
    total_expected_attendance = total_employees * last_month_days
    absent_count = total_expected_attendance - normal_attendance_count
    
    # 计算百分比
    total_records = normal_attendance_count + late_attendance_count + early_leave_count + absent_count
    if total_records > 0:
        normal_percentage = round((normal_attendance_count / total_records) * 100, 1)
        late_percentage = round((late_attendance_count / total_records) * 100, 1)
        early_leave_percentage = round((early_leave_count / total_records) * 100, 1)
        absent_percentage = round((absent_count / total_records) * 100, 1)
    else:
        normal_percentage = late_percentage = early_leave_percentage = absent_percentage = 0
    
    # 获取当前登录用户信息
    user_name = request.session.get('user_name', '管理员')
    
    # 获取最近任务
    recent_tasks = Task.objects.all().order_by('-assign_time')[:5]
    
    # 计算任务完成率
    total_tasks = Task.objects.count()
    completed_tasks = Task.objects.filter(completion=100).count()
    task_completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0
    
    # 获取部门人数分布
    departments = Department.objects.all()
    department_data = []
    for dept in departments:
        count = EmployeeDepartment.objects.filter(department=dept).count()
        if count > 0:
            department_data.append({
                'value': count,
                'name': dept.name
            })
    
    context = {
        'employee_count': employee_count,
        'department_count': department_count,
        'task_count': task_count,
        'recent_messages': recent_messages,
        'recent_tasks': recent_tasks,
        'unread_message_count': unread_message_count,
        'user_name': user_name,
        'task_completion_rate': task_completion_rate,
        
        # 图表数据
        'months': months,
        'employee_counts': employee_counts,
        'attendance_data': [
            {'value': normal_percentage, 'name': f'正常 ({normal_percentage}%)'},
            {'value': late_percentage, 'name': f'迟到 ({late_percentage}%)'},
            {'value': early_leave_percentage, 'name': f'早退 ({early_leave_percentage}%)'},
            {'value': absent_percentage, 'name': f'缺勤 ({absent_percentage}%)'}
        ],
        'department_data': department_data
    }
    return render(request, 'myapp/home.html', context)
