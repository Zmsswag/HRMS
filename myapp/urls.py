from django.urls import path
from django.views.generic.base import RedirectView
from django.views.generic import TemplateView
# 修改导入语句，从views包中导入视图函数
from .views import (
    user_login, user_logout, home,
    employee_list, employee_detail, employee_add, employee_edit, employee_home, employee_detail_json,
    attendance_record, attendance_stats,
    salary_list, salary_detail, salary_add,
    department_list, department_detail,
    task_list, task_detail, task_add, task_update,
    message_list, message_detail,
    job_application_form, job_application_success, job_application_list, get_positions,
    profile,
    leave_application
)

# 导入任务分发相关视图
from .views.task_distribution import (
    task_distribution_view, get_departments, 
    get_employees, get_positions as get_task_positions,
    create_task as create_distributed_task
)

urlpatterns = [
    # 认证相关
    path('', user_login, name='login'),
    path('logout/', user_logout, name='logout'),
    # 添加这一行，将accounts/login/重定向到根路径
    path('accounts/login/', RedirectView.as_view(url='/', permanent=True)),
    
    # 首页
    path('home/', home, name='home'),
    
    # 员工管理
    path('employee', employee_list, name='employee_list'),
    #path('employee/employee_list', employee_list, name='employee_list'),
    path('employee/<int:employee_id>/', employee_detail, name='employee_detail'),
    path('employee/detail/<int:employee_id>/', employee_detail_json, name='employee_detail_json'),
    path('employee/add/', employee_add, name='employee_add'),
    path('employee/<int:employee_id>/edit/', employee_edit, name='employee_edit'),
    
    # 考勤管理
    path('attendance/', attendance_record, name='attendance_record'),
    path('attendance/stats/', attendance_stats, name='attendance_stats'),
    
    # 薪资管理
    path('salary/', salary_list, name='salary_list'),
    path('salary/<int:employee_id>/', salary_detail, name='salary_detail'),
    path('salary/add/', salary_add, name='salary_add'),
    
    # 部门管理
    path('department/', department_list, name='department_list'),
    path('department/<int:department_id>/', department_detail, name='department_detail'),
    
    # 任务管理
    path('task/', task_list, name='task_list'),
    path('task/<int:task_id>/', task_detail, name='task_detail'),
    path('task/add/', task_add, name='task_add'),
    path('task/<int:task_id>/update/', task_update, name='task_update'),
    
    # 消息通知
    path('message/', message_list, name='message_list'),
    path('message/<int:message_id>/', message_detail, name='message_detail'),
    
    # 招聘管理
    path('job/apply/', job_application_form, name='job_application_form'),
    path('job/success/', job_application_success, name='job_application_success'),
    path('job/applications/', job_application_list, name='job_application_list'),
    path('api/positions/', get_positions, name='get_positions'),
    
    # 个人主页
    path('profile/', profile, name='profile'),
    
    # 请假申请
    path('leave_application/', leave_application, name='leave_application'),
    
    # 任务分发相关
    path('task/distribution/', task_distribution_view, name='task_distribution'),
    path('api/departments/', get_departments, name='api_departments'),
    path('api/employees/', get_employees, name='api_employees'),
    path('api/task_positions/', get_task_positions, name='api_task_positions'),
    path('api/create_task/', create_distributed_task, name='api_create_task'),
    path(
        'preview-page/',  # <--- 你希望通过哪个 URL 访问
        TemplateView.as_view(template_name='myapp/salary_list.html'), # <--- 指定你的模板文件路径
        name='preview_page'
    ),
]