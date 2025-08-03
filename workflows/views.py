# workflows/views.py
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import BasePermission # 添加更具体的权限
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext as _
from django.db.models import Q
from django.contrib.auth import get_user_model
from  django.shortcuts import render

from .models import WorkflowDefinition, WorkflowInstance, WorkflowTask, WorkflowHistory
# 确保导入的模型常量有明确的来源
from .models import WorkflowTask as TaskStatusModel
from .models import WorkflowTask as AssigneeTypeModel
from .serializers import (
    WorkflowDefinitionSerializer, WorkflowInstanceSerializer, WorkflowTaskSerializer,
    WorkflowHistorySerializer, StartWorkflowSerializer, CompleteTaskSerializer
)
from .services import workflow_engine
from .permissions import CanUseWorkflows

# --- 权限类占位符 ---

    
class CanDesignWorkflows(BasePermission):
    def has_permission(self, request, view):
        # 临时放行所有请求，方便开发测试
        return True  # TODO: 后续实现检查用户是否有设计工作流的权限 (例如，属于特定组)

class CanManageInstances(BasePermission):
     def has_object_permission(self, request, view, obj):
        # 临时放行所有请求，方便开发测试
        return True  # TODO: 后续实现检查用户是否能管理特定实例的权限 (例如，管理员或特定角色)
        #return request.user and request.user.is_staff

class CanCompleteTask(BasePermission):
    def has_object_permission(self, request, view, obj: WorkflowTask):
        # TODO: 实现检查用户是否是任务的合法处理人
        user = request.user
        if not user or not user.is_authenticated:
            return False
        # 1. 直接分配给用户
        if obj.assignee_type == AssigneeTypeModel.AssigneeType.USER and obj.assignee_identifier == str(user.id):
            return True
        # 2. 分配给用户所在的角色/组 (需要查询用户的角色)
        if obj.assignee_type == AssigneeTypeModel.AssigneeType.ROLE:
            user_roles = user.groups.values_list('name', flat=True) # 假设使用 Django groups
            if obj.assignee_identifier in user_roles:
                return True
        # 3. 规则指定 (例如，申请人经理 - 需要更复杂的逻辑来解析规则并检查用户是否匹配)
        if obj.assignee_type == AssigneeTypeModel.AssigneeType.RULE:
            # 这里需要调用类似 _resolve_assignees 的逻辑来判断 user 是否是该规则的解析结果之一
            # resolved_users = workflow_engine._resolve_assignees(obj.assignee_type, obj.assignee_identifier, obj.instance)
            # if user in resolved_users:
            #     return True
            pass # 规则解析需要具体实现
        # 4. 检查是否在 assigned_users M2M 字段中 (如果使用认领机制)
        if user in obj.assigned_users.all():
            return True

        print(f"权限检查：用户 {user.id} 不能完成任务 {obj.id} (指派: {obj.assignee_type}:{obj.assignee_identifier})")
        return False


class WorkflowDefinitionViewSet(viewsets.ModelViewSet):
    """
    管理工作流定义的 API 端点。
    """
    queryset = WorkflowDefinition.objects.all() # 提供所有版本，前端可按需过滤 active
    serializer_class = WorkflowDefinitionSerializer
    permission_classes = [CanUseWorkflows, CanDesignWorkflows] # TODO: 限制给设计者/管理员

    # TODO: 添加用于激活/停用特定版本的操作

class WorkflowInstanceViewSet(mixins.ListModelMixin,
                              mixins.RetrieveModelMixin,
                              viewsets.GenericViewSet):
    """
    查看工作流实例和启动新实例的 API 端点。
    """
    queryset = WorkflowInstance.objects.all().select_related('definition')
    serializer_class = WorkflowInstanceSerializer
    permission_classes = [CanUseWorkflows] # TODO: 基于用户参与情况的权限

    @action(detail=False, methods=['post'], serializer_class=StartWorkflowSerializer)
    def start_workflow(self, request):
        """
        启动一个新的工作流实例。
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        triggered_by_object = None
        if data.get('trigger_content_type_id') and data.get('trigger_object_id'):
             try:
                 ct = ContentType.objects.get_for_id(data['trigger_content_type_id'])
                 # 确保模型存在
                 model_class = ct.model_class()
                 if model_class is None:
                      return Response({"error": _("无效的触发对象内容类型ID")}, status=status.HTTP_400_BAD_REQUEST)
                 triggered_by_object = model_class.objects.get(pk=data['trigger_object_id'])
             except ContentType.DoesNotExist:
                 return Response({"error": _("无效的触发对象内容类型ID")}, status=status.HTTP_400_BAD_REQUEST)
             except model_class.DoesNotExist:
                  return Response({"error": _("触发对象未找到")}, status=status.HTTP_400_BAD_REQUEST)

        try:
            instance = workflow_engine.start_instance(
                definition_id=data['definition_id'],
                initial_payload=data['initial_payload'],
                triggered_by_object=triggered_by_object,
                user=request.user
            )
        except WorkflowDefinition.DoesNotExist: # 捕获服务层可能抛出的错误
             return Response({"error": _("无法找到活动的工作流定义")}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
             print(f"启动工作流时发生意外错误: {e}")
             return Response({"error": _("启动工作流实例时发生内部错误。")}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


        if instance:
            # 使用主序列化器返回创建的实例数据
            instance_serializer = self.get_serializer(instance)
            return Response(instance_serializer.data, status=status.HTTP_201_CREATED)
        else:
            # start_instance 记录了错误，返回通用失败信息或特定错误
            return Response({"error": _("启动工作流实例失败。")}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        检索特定工作流实例的历史记录。
        """
        instance = self.get_object()
        # TODO: 添加权限检查，用户是否可以查看此实例的历史
        history = WorkflowHistory.objects.filter(instance=instance).select_related('user', 'task').order_by('timestamp')
        serializer = WorkflowHistorySerializer(history, many=True)
        return Response(serializer.data)

    # TODO: 添加取消、暂停、恢复实例的操作 (带权限检查)


class WorkflowTaskViewSet(mixins.ListModelMixin,
                          mixins.RetrieveModelMixin,
                          viewsets.GenericViewSet):
    """
    查看任务和完成任务的 API 端点。
    """
    queryset = WorkflowTask.objects.all().select_related('instance', 'completed_by', 'instance__definition')
    serializer_class = WorkflowTaskSerializer
    permission_classes = [CanUseWorkflows] # 列表和检索也应该有权限控制

    def get_queryset(self):
        """
        根据登录用户过滤任务。
        用户应只能看到分配给他们或他们所属角色的任务。
        """
        user = self.request.user
        if not user.is_authenticated:
            return WorkflowTask.objects.none()

        # 实现基于用户 ID、用户角色/组匹配 task.assignee_identifier 和 task.assignee_type 的过滤。
        # 这比较复杂。
        # 简单的示例：直接分配给用户的任务 或 状态为 PENDING 且分配给用户所在角色的任务
        User = get_user_model()
        user_roles = user.groups.values_list('name', flat=True) # 示例：使用 Django groups 作为角色

        # Q 对象用于组合查询条件
        # 1. 直接分配给用户的任务
        user_q = Q(assignee_type=AssigneeTypeModel.AssigneeType.USER, assignee_identifier=str(user.id))
        # 2. 分配给用户所属角色且状态为待处理的任务 (已完成的不需要显示在待办列表)
        #    注意：如果角色任务需要认领，逻辑会更复杂
        role_q = Q(assignee_type=AssigneeTypeModel.AssigneeType.ROLE, assignee_identifier__in=list(user_roles), status=TaskStatusModel.Status.PENDING)
        # 3. 如果使用了 assigned_users M2M 字段（例如认领后），也需要包含
        assigned_q = Q(assigned_users=user)

        # TODO: 规则指派 (RULE) 的过滤需要调用服务来解析规则并判断用户是否匹配，这在查询时比较困难
        # 可能需要在服务层实现一个辅助函数来获取用户相关的任务 ID 列表

        # 组合查询
        # final_q = user_q | role_q | assigned_q
        # distinct() 避免重复
        # return super().get_queryset().filter(final_q).distinct()

        # --- 临时：返回所有任务用于演示 ---
        print("警告：WorkflowTaskViewSet 查询集过滤尚未完全针对用户权限实现。")
        qs = super().get_queryset()

        # 实现 ?status=pending 过滤
        status_filter = self.request.query_params.get('status')
        if status_filter:
            # 最好验证 status_filter 是否是合法的状态值
            valid_statuses = [choice[0] for choice in TaskStatusModel.Status.choices]
            if status_filter.upper() in valid_statuses:
                 qs = qs.filter(status=status_filter.upper())
            else:
                 # 或者返回空集，或者忽略无效过滤器
                 pass

        # 实现 ?assignee=me 过滤 (需要完善)
        assignee_filter = self.request.query_params.get('assignee')
        if assignee_filter == 'me':
             # 用上面构建的 final_q 替换这里的简单过滤
             print("警告：按 'assignee=me' 过滤未完全实现。")
             qs = qs.filter(Q(assignee_identifier=str(user.id)) | Q(assigned_users=user) | Q(assignee_type=AssigneeTypeModel.AssigneeType.ROLE, assignee_identifier__in=list(user_roles), status=TaskStatusModel.Status.PENDING)).distinct()

        return qs


    @action(detail=True, methods=['post'], serializer_class=CompleteTaskSerializer, permission_classes=[CanUseWorkflows, CanCompleteTask])
    def complete(self, request, pk=None):
        """
        完成一个工作流任务 (例如，批准/驳回)。
        权限检查由 CanCompleteTask 处理。
        """
        task = self.get_object() # get_object 会处理 404 并应用权限检查
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            # 权限检查已由 permission_classes 处理
            completed_task = workflow_engine.complete_task(
                task_id=task.id,
                user=request.user,
                outcome=data['outcome'],
                completion_data=data.get('completion_data')
            )
            # 使用主序列化器返回更新后的任务数据
            task_serializer = self.serializer_class(completed_task)
            return Response(task_serializer.data, status=status.HTTP_200_OK)
        except ValueError as e: # 捕获服务层特定的业务逻辑错误
             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        # PermissionError 应该由 DRF 的权限系统处理，返回 403
        # except PermissionError as e:
        #      return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e: # 捕获意外错误
             print(f"错误：完成任务 {task.id} 时发生意外错误：{e}")
             # 生产环境中应记录详细错误日志
             return Response({"error": _("完成任务失败。")}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # TODO: 如果需要基于角色的任务认领机制，添加 'claim' 操作。

# --- 设计器配置 API (简单示例) ---
from rest_framework.views import APIView

class WorkflowDesignerConfigView(APIView):
    """
    提供工作流设计器前端所需的配置信息。
    """
    permission_classes = [CanDesignWorkflows] # 允许所有登录用户查看配置？或者限制给设计者？

    def get(self, request, format=None):
        # TODO: 这个配置可以做得更动态，例如从数据库或配置文件加载
        config = {
            "nodeTypes": [
                {"type": "startNode", "label": _("开始事件"), "icon": "play-circle", "configSchema": {}},
                {"type": "endNode", "label": _("结束事件"), "icon": "stop-circle", "configSchema": {}},
                {
                    "type": "approvalNode",
                    "label": _("审批节点"),
                    "icon": "check-square",
                    "configSchema": {
                        # key: {label, type, options?, defaultValue?, helpText?}
                        "assigneeType": {"label": _("指派类型"), "type": "select", "options": [("USER", _("特定用户")), ("ROLE", _("角色/组")), ("RULE", _("规则指定"))], "defaultValue": "ROLE"},
                        "assigneeIdentifier": {"label": _("指派标识 (用户ID/角色名/规则)"), "type": "text"},
                        "taskName": {"label": _("任务名称模板"), "type": "text", "helpText": _("例如：审批 {payload.leave_type} 申请")},
                        # "timeoutDuration": {"label": _("超时 (秒, 0=无)"), "type": "number", "defaultValue": 0},
                        # "timeoutAction": {"label": _("超时动作"), "type": "select", "options": [("NOTIFY", _("提醒")), ("AUTO_REJECT", _("自动驳回")), ("AUTO_APPROVE", _("自动批准")), ("ESCALATE", _("上报"))]},
                    }
                },
                {
                    "type": "decisionNode",
                    "label": _("决策节点 (网关)"),
                    "icon": "gateway", # 使用更合适的图标名
                    "configSchema": {} # 条件通常在连接线上配置
                },
                {
                    "type": "notificationNode",
                    "label": _("通知节点"),
                    "icon": "bell",
                    "configSchema": {
                        "recipientType": {"label": _("接收人类型"), "type": "select", "options": [("USER", _("特定用户")), ("ROLE", _("角色/组")), ("REQUESTER", _("申请人"))], "defaultValue": "REQUESTER"},
                        "recipientIdentifier": {"label": _("接收人标识 (用户ID/角色名)"), "type": "text", "helpText": _("如果类型是申请人则无需填写")},
                        "messageTemplate": {"label": _("消息模板"), "type": "textarea", "helpText": _("可使用 {payload.field_name} 变量")},
                    }
                 },
                # 添加其他节点类型: ServiceTask, FormTask 等
            ],
            "edgeConfigSchema": { # 连接线的配置 (特别是从决策节点出来的线)
                "condition": {"label": _("流转条件"), "type": "textarea", "helpText": _("例如：payload.amount > 1000 或 payload.status == 'urgent' (为空则无条件)")},
                "isDefault": {"label": _("是否默认路径"), "type": "checkbox", "helpText": _("当决策节点其他条件都不满足时走此路径")}
            }
        }
        return Response(config)
    
    
#@custom_login_required # 使用装饰器保护视图
def workflow_spa_entry(request, *args, **kwargs):
    """
    提供 React SPA 的入口 index.html。
    Django 会在 settings.py 中 TEMPLATES['DIRS'] 定义的目录下查找 'frontend/index.html'。
    """
    try:
        # 渲染位于 'staticfiles/frontend/index.html' 的模板
        return render(request, 'frontend/index.html')
    except Exception as e:
        # 添加日志或打印错误方便调试
        print(f"Error rendering SPA entry view: {e}")
        return HttpResponseNotFound("Workflow application entry point not found.")