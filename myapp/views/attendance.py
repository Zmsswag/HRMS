from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from datetime import datetime, timedelta

from ..models import EmployeeProfile, Attendance, EmployeeDepartment, Department


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