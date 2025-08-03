# workflows/models.py
from django.db import models
from django.conf import settings
# from django.contrib.auth.models import User # 使用 settings.AUTH_USER_MODEL 代替
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext_lazy as _ # 用于模型字段的国际化
import uuid

# --- 工作流定义 ---
class WorkflowDefinition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True, help_text=_("工作流定义的唯一名称"))
    description = models.TextField(blank=True, null=True, verbose_name=_("描述"))
    # 存储来自前端设计器的图形结构 (节点、边、位置)
    definition_json = models.JSONField(help_text=_("工作流图的 JSON 表示"))
    version = models.PositiveIntegerField(default=1, verbose_name=_("版本"))
    is_active = models.BooleanField(default=True, help_text=_("此定义是否可用于启动新实例"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("创建时间"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("更新时间"))

    class Meta:
        verbose_name = _("工作流定义")
        verbose_name_plural = _("工作流定义")
        unique_together = ('name', 'version') # 允许同名工作流有多个版本
        ordering = ('name', '-version')

    def __str__(self):
        return f"{self.name} (v{self.version})"

# --- 工作流实例 ---
class WorkflowInstance(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('待处理') # 实例已创建但尚未开始执行第一个节点
        RUNNING = 'RUNNING', _('运行中')
        COMPLETED = 'COMPLETED', _('已完成')
        FAILED = 'FAILED', _('失败')
        CANCELED = 'CANCELED', _('已取消')
        SUSPENDED = 'SUSPENDED', _('已暂停') # 用于手动干预或长时间等待

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    definition = models.ForeignKey(WorkflowDefinition, on_delete=models.PROTECT, related_name='instances', verbose_name=_("关联定义"))
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, verbose_name=_("状态"))
    # 存储与此特定运行关联的动态数据 (例如，请假请求详情)
    payload = models.JSONField(default=dict, help_text=_("此工作流实例的数据负载"), verbose_name=_("数据负载"))
    # 存储 definition_json 中当前活动节点的 ID 列表
    # 如果工作流具有并行路径，则可以是列表
    current_node_ids = models.JSONField(default=list, help_text=_("定义中活动节点的 ID 列表"), verbose_name=_("当前节点ID"))
    started_at = models.DateTimeField(auto_now_add=True, verbose_name=_("开始时间"))
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name=_("完成时间"))
    # 可选：链接到触发此工作流的对象 (例如，一个 LeaveRequest)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True, verbose_name=_("触发对象类型"))
    object_id = models.UUIDField(null=True, blank=True, verbose_name=_("触发对象ID")) # 假设关联对象的主键是 UUID
    triggered_by_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        verbose_name = _("工作流实例")
        verbose_name_plural = _("工作流实例")
        ordering = ('-started_at',)

    def __str__(self):
        return f"实例 {self.id} ({self.definition.name} v{self.definition.version}) - {self.get_status_display()}"

# --- 工作流任务 (用户任务，如审批) ---
class WorkflowTask(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('待处理') # 任务已创建，等待分配或认领
        ASSIGNED = 'ASSIGNED', _('已分配') # 任务已被认领或直接分配给特定用户
        COMPLETED = 'COMPLETED', _('已完成')
        CANCELED = 'CANCELED', _('已取消') # 工作流路径改变，任务不再需要

    class AssigneeType(models.TextChoices):
        USER = 'USER', _('特定用户')
        ROLE = 'ROLE', _('角色/用户组')
        RULE = 'RULE', _('规则指定') # 例如, 'RequesterManager' (申请人经理)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    instance = models.ForeignKey(WorkflowInstance, on_delete=models.CASCADE, related_name='tasks', verbose_name=_("关联实例"))
    # 生成此任务的 definition_json 中的节点 ID
    node_id = models.CharField(max_length=255, help_text=_("来自工作流定义的节点 ID"), verbose_name=_("节点 ID"))
    task_type = models.CharField(max_length=50, default='APPROVAL', help_text=_("任务类型，例如 APPROVAL, FORM_ENTRY"), verbose_name=_("任务类型"))
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, verbose_name=_("状态"))

    # 指派人信息
    assignee_type = models.CharField(max_length=20, choices=AssigneeType.choices, verbose_name=_("指派类型"))
    # 根据 assignee_type 存储用户 ID、角色名称或规则标识符
    assignee_identifier = models.CharField(max_length=255, help_text=_("用户 ID、角色名称或规则标识符"), verbose_name=_("指派标识"))
    # 可选：一旦分配/认领，链接到实际用户 (对于 ROLE 类型特别有用)
    assigned_users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='workflow_tasks', verbose_name=_("已分配用户"))

    # 任务元数据
    due_date = models.DateTimeField(null=True, blank=True, verbose_name=_("截止日期"))
    # 存储任务完成的结果，例如 'approved', 'rejected', 自定义结果
    outcome = models.CharField(max_length=100, null=True, blank=True, verbose_name=_("结果"))
    # 存储任务完成时提交的数据 (例如，审批意见，表单数据)
    completion_data = models.JSONField(null=True, blank=True, verbose_name=_("完成数据"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("创建时间"))
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name=_("完成时间"))
    completed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='+', verbose_name=_("完成人"))

    class Meta:
        verbose_name = _("工作流任务")
        verbose_name_plural = _("工作流任务")
        ordering = ('created_at',)

    def __str__(self):
        return f"任务 {self.id} (实例 {self.instance.id}, 节点 {self.node_id}) - {self.get_status_display()}"


# --- 工作流历史记录 (可选但推荐用于审计) ---
class WorkflowHistory(models.Model):
    class EventType(models.TextChoices):
        INSTANCE_STARTED = 'INSTANCE_STARTED', _('实例已启动')
        INSTANCE_COMPLETED = 'INSTANCE_COMPLETED', _('实例已完成')
        INSTANCE_FAILED = 'INSTANCE_FAILED', _('实例失败')
        INSTANCE_CANCELED = 'INSTANCE_CANCELED', _('实例已取消')
        NODE_ENTERED = 'NODE_ENTERED', _('进入节点')
        NODE_EXITED = 'NODE_EXITED', _('离开节点') # 通常在移动到下一个节点时
        TASK_CREATED = 'TASK_CREATED', _('任务已创建')
        TASK_ASSIGNED = 'TASK_ASSIGNED', _('任务已分配/认领')
        TASK_COMPLETED = 'TASK_COMPLETED', _('任务已完成')
        TASK_TIMED_OUT = 'TASK_TIMED_OUT', _('任务超时')
        COMMENT_ADDED = 'COMMENT_ADDED', _('评论已添加') # 通用目的评论

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    instance = models.ForeignKey(WorkflowInstance, on_delete=models.CASCADE, related_name='history_logs', verbose_name=_("关联实例"))
    node_id = models.CharField(max_length=255, null=True, blank=True, help_text=_("相关的节点 ID，如果适用"), verbose_name=_("节点 ID"))
    task = models.ForeignKey(WorkflowTask, on_delete=models.SET_NULL, null=True, blank=True, related_name='history_logs', verbose_name=_("关联任务"))
    event_type = models.CharField(max_length=30, choices=EventType.choices, verbose_name=_("事件类型"))
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name=_("时间戳"))
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, help_text=_("触发事件的用户，如果适用"), verbose_name=_("用户"))
    # 存储额外细节，如评论、结果、评估的条件、错误消息
    details = models.JSONField(null=True, blank=True, verbose_name=_("详情"))

    class Meta:
        verbose_name = _("工作流历史")
        verbose_name_plural = _("工作流历史")
        ordering = ('timestamp',)

    def __str__(self):
        return f"{self.timestamp} - {self.instance.id} - {self.get_event_type_display()}"