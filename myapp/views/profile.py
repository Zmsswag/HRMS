from django.shortcuts import render
from django.contrib import messages
from django.shortcuts import render, redirect
from django.contrib.auth import logout
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, Count

from ..models import (
    EmployeeProfile, EmployeeDepartment, Department, 
    Position, Attendance, Task, TaskAssignment, LeaveApplication, Leave
)
from ..decorators import custom_login_required


@custom_login_required
def profile(request):
    """
    个人中心页面视图
    """
    # 获取当前登录用户的信息
    user_id = request.session.get('user_id')
    if not user_id:
        messages.error(request, '未登录或会话已过期')
        return redirect('login')
    
    try:
        # 获取员工基本信息
        user = EmployeeProfile.objects.get(employee_id=user_id)
        
        # 获取员工的部门和职位信息
        user_departments = EmployeeDepartment.objects.filter(employee=user).select_related('department', 'position')
        
        # 获取考勤数据 - 本月出勤天数（根据打卡记录统计）
        current_month = timezone.now().month
        current_year = timezone.now().year
        
        # 统计本月有多少天同时有上班和下班打卡记录
        attendance_days = Attendance.objects.filter(
            employee=user,
            date__month=current_month,
            date__year=current_year
        ).values('date').annotate(
            punch_count=Count('type', distinct=True)
        ).filter(punch_count__gte=2).count()
        
        # 获取待办任务数量
        pending_tasks = TaskAssignment.objects.filter(
            employee=user,
            task__completion__lt=100  # 使用任务完成度小于100%来判断未完成任务
        ).count()
        
        # 获取待审批数量 - 如果用户有审批权限
        pending_approvals = 0
        for dept in user_departments:
            if dept.position.power and dept.position.power.power_level >=1000:
                # 查找需要该用户审批的请假申请
                dept_pending_approvals = LeaveApplication.objects.filter(
                    department=dept.department,
                    status='pending'  # 使用英文状态值'pending'而不是中文'待审批'
                ).count()
                pending_approvals += dept_pending_approvals
        
        # 获取年假余额 - 计算所有类型假期的总和
        current_year = timezone.now().year
        leave_balance = 0
        try:
            leave = Leave.objects.get(employee=user, year=current_year)
            # 计算所有类型假期的总和
            leave_balance = (
                leave.annual_leave + 
                leave.sick_leave + 
                leave.personal_leave + 
                leave.marriage_leave + 
                leave.maternity_leave + 
                leave.paternity_leave + 
                leave.bereavement_leave
            )
        except Leave.DoesNotExist:
            leave_balance = 0  # 如果没有记录，默认为0
        
        context = {
            'user': user,
            'user_departments': user_departments,
            'attendance_count': attendance_days,
            'pending_tasks': pending_tasks,
            'pending_approvals': pending_approvals,
            'leave_balance': leave_balance
        }
        
        return render(request, 'myapp/profile.html', context)
    
    except EmployeeProfile.DoesNotExist:
        messages.error(request, '用户不存在')
        return redirect('login')
    except Exception as e:
        messages.error(request, f'获取个人信息失败: {str(e)}')
        return redirect('home')


