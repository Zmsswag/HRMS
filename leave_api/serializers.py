# leave_api/serializers.py
from rest_framework import serializers
from myapp.models import LeaveApplication, EmployeeProfile # 从 myapp.models 导入模型

class EmployeeProfileSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeProfile
        fields = ['employee_id', 'name']


class LeaveApplicationSerializer(serializers.ModelSerializer):
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    employee_id_val = serializers.IntegerField(source='employee.employee_id', read_only=True) # 使用不同的名字以避免与模型字段冲突

    approver_name = serializers.CharField(source='approver.name', read_only=True, allow_null=True)

    # --- 映射到前端 DataTable dataIndex ---
    id = serializers.IntegerField(source='application_id', read_only=True)
    applicantName = serializers.CharField(source='employee.name', read_only=True)
    
    # ** DEMO 硬编码部门 **
    department = serializers.SerializerMethodField(read_only=True)
    
    leaveType = serializers.CharField(source='get_leave_type_display', read_only=True)
    startDate = serializers.DateField(source='start_date')
    endDate = serializers.DateField(source='end_date')
    duration = serializers.FloatField(source='days')
    createdAt = serializers.DateTimeField(source='apply_time', read_only=True)
    # status 字段会由前端的 StatusIndicator 使用，所以可以直接传原始值
    # status = serializers.CharField() # Meta 中已包含 status

    def get_department(self, obj):
        # ** DEMO: 始终返回 "人力资源部" **
        return "人力资源部"

    class Meta:
        model = LeaveApplication
        fields = [
            'id',
            'employee',         # 原始外键，用于调试或未来需要
            'employee_id_val',  # 映射的员工ID
            'applicantName',
            'department',       # 硬编码的部门
            'leave_type',       # 原始 choice
            'leaveType',        # 可读显示
            'start_date',       # 原始字段
            'startDate',        # 映射给前端
            'end_date',         # 原始字段
            'endDate',          # 映射给前端
            'days',             # 原始字段
            'duration',         # 映射给前端
            'reason',
            'apply_time',       # 原始字段
            'createdAt',        # 映射给前端
            'status',           # 原始 choice 字段 (例如 'pending', 'approved')
            'status_display',
            'approver',
            'approver_name',
            'approval_time',
            'approval_comment',
        ]
        # 对于 demo，我们让一些字段在视图中处理只读逻辑
        # read_only_fields = ['apply_time', 'approval_time', 'approver']