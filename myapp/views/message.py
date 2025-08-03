from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator

from ..models import Message, EmployeeProfile


@login_required
def message_list(request):
    """消息列表"""
    employee_id = request.session.get('user_id')
    
    if not employee_id:
        messages.error(request, '请先登录系统。')
        return redirect('login')
    
    employee = get_object_or_404(EmployeeProfile, pk=employee_id)
    
    # 获取员工的所有消息
    # 错误的代码：
    # user_messages = Message.objects.filter(messageemployee=employee).order_by('-timestamp')
    
    # 正确的代码：
    # 通过 'messageemployee__employee' 路径进行查询
    # 意思是：筛选 Message 对象，条件是其反向关联的 MessageEmployee 对象中的 employee 字段等于当前的 employee 实例
    user_messages = Message.objects.filter(messageemployee__employee=employee).order_by('-timestamp').distinct()
    
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