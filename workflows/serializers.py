# workflows/serializers.py
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import WorkflowDefinition, WorkflowInstance, WorkflowTask, WorkflowHistory

class WorkflowDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowDefinition
        fields = ('id', 'name', 'description', 'definition_json', 'version', 'is_active', 'created_at', 'updated_at')
        read_only_fields = ('id', 'version', 'created_at', 'updated_at') # 版本可能由内部管理

class WorkflowInstanceSerializer(serializers.ModelSerializer):
    definition_name = serializers.CharField(source='definition.name', read_only=True, label=_("定义名称"))
    definition_version = serializers.IntegerField(source='definition.version', read_only=True, label=_("定义版本"))
    status_display = serializers.CharField(source='get_status_display', read_only=True, label=_("状态显示"))

    class Meta:
        model = WorkflowInstance
        fields = ('id', 'definition', 'definition_name', 'definition_version', 'status', 'status_display', 'payload', 'current_node_ids', 'started_at', 'completed_at', 'content_type', 'object_id')
        read_only_fields = ('id', 'definition_name', 'definition_version', 'status', 'status_display', 'current_node_ids', 'started_at', 'completed_at')

class WorkflowTaskSerializer(serializers.ModelSerializer):
    instance_id = serializers.UUIDField(source='instance.id', read_only=True, label=_("实例ID"))
    status_display = serializers.CharField(source='get_status_display', read_only=True, label=_("状态显示"))
    assignee_type_display = serializers.CharField(source='get_assignee_type_display', read_only=True, label=_("指派类型显示"))
    # 可选择包含实例中的部分 payload 以提供上下文
    instance_payload_summary = serializers.SerializerMethodField(read_only=True, label=_("实例数据摘要"))

    class Meta:
        model = WorkflowTask
        # assigned_users 可能需要单独的 UserSerializer
        fields = ('id', 'instance_id', 'node_id', 'task_type', 'status', 'status_display', 'assignee_type', 'assignee_type_display', 'assignee_identifier', 'assigned_users', 'due_date', 'outcome', 'completion_data', 'created_at', 'completed_at', 'completed_by', 'instance_payload_summary')
        read_only_fields = ('id', 'instance_id', 'node_id', 'task_type', 'status', 'status_display', 'assignee_type', 'assignee_type_display', 'assignee_identifier', 'assigned_users', 'due_date', 'created_at', 'completed_at', 'completed_by', 'instance_payload_summary', 'outcome') # 结果通过完成动作设置

    def get_instance_payload_summary(self, obj):
        # 示例：为列表视图返回实例 payload 的子集
        payload = obj.instance.payload
        # 根据你的 payload 结构调整
        return {
            _('申请人'): payload.get('requester_name'),
            _('类型'): payload.get('leave_type'), # 假设是请假流程
            _('开始日期'): payload.get('start_date'),
        }

class WorkflowHistorySerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True, allow_null=True, label=_("用户邮箱")) # 示例
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True, label=_("事件类型显示"))

    class Meta:
        model = WorkflowHistory
        fields = ('id', 'instance', 'node_id', 'task', 'event_type', 'event_type_display', 'timestamp', 'user', 'user_email', 'details')
        read_only_fields = '__all__'

# --- 特定动作的序列化器 ---
class StartWorkflowSerializer(serializers.Serializer):
    definition_id = serializers.UUIDField(required=True, label=_("工作流定义ID"))
    initial_payload = serializers.JSONField(required=True, label=_("初始数据负载"))
    # 可选：用于关联触发对象
    trigger_content_type_id = serializers.IntegerField(required=False, allow_null=True, label=_("触发对象内容类型ID"))
    trigger_object_id = serializers.UUIDField(required=False, allow_null=True, label=_("触发对象ID"))

class CompleteTaskSerializer(serializers.Serializer):
    outcome = serializers.CharField(required=True, max_length=100, label=_("任务结果")) # 例如 "approved", "rejected"
    completion_data = serializers.JSONField(required=False, default=dict, label=_("完成数据")) # 例如评论