# workflows/services.py
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext as _ # 用于服务层中的字符串

from .models import WorkflowDefinition, WorkflowInstance, WorkflowTask, WorkflowHistory
# 修正导入路径，确保它们指向你的模型
from .models import WorkflowTask as TaskStatusModel # 重命名以避免与常量冲突
from .models import WorkflowInstance as InstanceStatusModel
from .models import WorkflowTask as AssigneeTypeModel

# 假设用户/角色/组织逻辑可用 (例如，在 'accounts' 应用中)
# from accounts.services import get_user_manager, get_users_in_role

# --- 用户/组织服务的占位符 ---
# 用你实际的用户/角色查找逻辑替换
class OrgChartService:
    def get_user_manager(self, user):
        # 实现查找用户经理的逻辑
        print(f"警告：OrgChartService.get_user_manager 未为用户 {user.id} 实现")
        return None # 占位符

    def get_users_in_role(self, role_name):
        # 实现查找属于某个角色/组的用户的逻辑
        print(f"警告：OrgChartService.get_users_in_role 未为角色 {role_name} 实现")
        User = get_user_model()
        # 示例：return User.objects.filter(groups__name=role_name)
        return [] # 占位符

org_chart_service = OrgChartService() # 实例化或获取服务

# --- 规则评估器 ---
class RuleEvaluator:
    def evaluate(self, condition_string, payload):
        # 警告：评估任意字符串是危险的！
        # 使用安全的评估库 (如 'asteval' 或构建简单的解析器)
        # 为简单起见，这里只做基本检查。请替换为健壮的实现。
        print(f"正在评估条件：'{condition_string}' 使用 payload：{payload}")
        try:
            # 示例简单条件："payload.leave_days <= 3"
            if condition_string is None or condition_string.strip() == '':
                return True # 无条件视为真
            if 'payload.' in condition_string:
                parts = condition_string.split(' ')
                if len(parts) == 3:
                    key = parts[0].replace('payload.', '')
                    op = parts[1]
                    value_str = parts[2]
                    payload_value = payload.get(key)

                    if payload_value is None: return False

                    # 基本比较 (生产环境中需要显著扩展)
                    try:
                        # 尝试数字比较
                        num_payload = float(payload_value)
                        num_value = float(value_str)
                        if op == '<=': return num_payload <= num_value
                        if op == '>': return num_payload > num_value
                        if op == '==': return num_payload == num_value
                        if op == '!=': return num_payload != num_value
                        if op == '<': return num_payload < num_value
                        if op == '>=': return num_payload >= num_value
                    except ValueError:
                         # 如果转换数字失败，尝试字符串比较
                         str_value = value_str.strip("'\"") # 去除引号
                         str_payload = str(payload_value)
                         if op == '==': return str_payload == str_value
                         if op == '!=': return str_payload != str_value
                         # 对字符串的其他比较意义不大，除非有特殊需求

                    # 添加更多操作符和类型检查
            print(f"警告：不支持的条件格式：{condition_string}")
            return False # 条件未知或格式错误时默认为 false
        except Exception as e:
            print(f"错误：评估条件 '{condition_string}' 时出错：{e}")
            return False

rule_evaluator = RuleEvaluator()

# --- 工作流引擎服务 ---
class WorkflowEngineService:

    def _log_history(self, instance, event_type, node_id=None, task=None, user=None, details=None):
        WorkflowHistory.objects.create(
            instance=instance,
            node_id=node_id,
            task=task,
            event_type=event_type,
            user=user,
            details=details or {}
        )

    def _find_node_by_id(self, definition_json, node_id):
        nodes = definition_json.get('nodes', [])
        for node in nodes:
            if node.get('id') == node_id:
                return node
        return None

    def _find_outgoing_edges(self, definition_json, source_node_id):
        edges = definition_json.get('edges', [])
        return [edge for edge in edges if edge.get('source') == source_node_id]

    def _resolve_assignees(self, assignee_type, identifier, instance):
        User = get_user_model()
        users = []
        if assignee_type == AssigneeTypeModel.AssigneeType.USER:
            try:
                # 假设 identifier 是用户 ID
                users.append(User.objects.get(pk=identifier)) # 使用 pk 更通用
            except User.DoesNotExist:
                print(f"错误：指派人用户 ID {identifier} 未找到。")
        elif assignee_type == AssigneeTypeModel.AssigneeType.ROLE:
             # 假设 identifier 是角色名称
            users.extend(org_chart_service.get_users_in_role(identifier))
        elif assignee_type == AssigneeTypeModel.AssigneeType.RULE:
            if identifier == 'RequesterManager':
                 # 假设 payload 中有 'requester_id'
                 requester_id = instance.payload.get('requester_id')
                 if requester_id:
                     try:
                        requester = User.objects.get(pk=requester_id)
                        manager = org_chart_service.get_user_manager(requester)
                        if manager:
                            users.append(manager)
                        else:
                            print(f"警告：用户 {requester_id} 的经理未找到。")
                     except User.DoesNotExist:
                         print(f"错误：申请人用户 ID {requester_id} 未找到。")
                 else:
                     print("错误：无法解析 'RequesterManager'，payload 中缺少 'requester_id'。")
            # 根据需要添加更多规则
        return users

    def _create_task(self, instance, node_definition):
        node_id = node_definition.get('id')
        # 假设配置嵌套在节点数据的 'data' 字段下
        config = node_definition.get('data', {}).get('config', {})
        # 从配置中获取或使用默认值
        assignee_type = config.get('assigneeType', AssigneeTypeModel.AssigneeType.ROLE)
        assignee_identifier = config.get('assigneeIdentifier', 'DefaultRole') # 需要一个有意义的默认值或使其必需

        task = WorkflowTask.objects.create(
            instance=instance,
            node_id=node_id,
            # 使用节点类型或配置中的 taskType
            task_type=config.get('taskType', node_definition.get('type', 'APPROVAL')).upper(),
            status=TaskStatusModel.Status.PENDING,
            assignee_type=assignee_type,
            assignee_identifier=assignee_identifier,
            # due_date= # 如果存在 config.timeoutDuration，则计算得出
        )
        # 可选：如果 assignee_type 是 USER 或 ROLE 分配是立即的，则立即解析并链接用户
        # resolved_users = self._resolve_assignees(assignee_type, assignee_identifier, instance)
        # if resolved_users:
        #     task.assigned_users.set(resolved_users)
        #     task.status = TaskStatusModel.Status.ASSIGNED # 或者保持 PENDING 直到被认领？取决于逻辑。
        #     task.save()

        self._log_history(instance, WorkflowHistory.EventType.TASK_CREATED, node_id=node_id, task=task, details={'指派给': f"{assignee_type}:{assignee_identifier}"})
        # TODO: 向潜在的指派人发送通知
        # TODO: 如果 config.timeoutDuration 存在，使用 Celery 安排超时检查
        return task

    @transaction.atomic
    def start_instance(self, definition_id, initial_payload, triggered_by_object=None, user=None):
        try:
            # 优先选择最新的 active 版本
            definition = WorkflowDefinition.objects.filter(
                # 如果 name 是唯一的，可以直接用 name 查找最新 active 版本
                # name=definition_name,
                id=definition_id, # 如果传入的是特定版本的 ID
                is_active=True
            ).latest('version') # 或者根据你的逻辑选择版本
        except WorkflowDefinition.DoesNotExist:
            print(f"错误：活动的工作流定义 {definition_id} 未找到。")
            # 或者引发异常
            return None

        instance = WorkflowInstance.objects.create(
            definition=definition,
            status=InstanceStatusModel.Status.RUNNING, # 开始时即为运行中
            payload=initial_payload,
            current_node_ids=[], # 将通过查找开始节点来设置
            triggered_by_object=triggered_by_object
        )
        self._log_history(instance, WorkflowHistory.EventType.INSTANCE_STARTED, user=user, details={'初始负载': initial_payload})

        # 查找 'start' 节点 (假设来自 React Flow 的类型是 'startNode')
        start_node = None
        for node in definition.definition_json.get('nodes', []):
             # 根据你的前端开始事件节点类型调整 'startNode'
            if node.get('type') == 'startNode':
                start_node = node
                break

        if not start_node:
            instance.status = InstanceStatusModel.Status.FAILED
            instance.completed_at = timezone.now()
            instance.save()
            self._log_history(instance, WorkflowHistory.EventType.INSTANCE_FAILED, details={'错误': '定义中未找到开始节点'})
            print(f"错误：定义 {definition.id} 未找到开始节点")
            return instance # 返回失败的实例

        # 立即从开始节点推进
        self.advance_workflow(instance, start_node.get('id'))
        return instance

    @transaction.atomic
    def advance_workflow(self, instance, completed_node_id, completion_data=None):
        # completion_data 通常包含任务结果等信息，会合并到实例 payload 中或用于条件判断

        # 重新获取实例以确保状态最新，并锁定行以防并发问题
        try:
            instance = WorkflowInstance.objects.select_for_update().get(pk=instance.pk)
        except WorkflowInstance.DoesNotExist:
            print(f"错误：实例 {instance.pk} 在推进时丢失。")
            return

        if instance.status not in [InstanceStatusModel.Status.RUNNING, InstanceStatusModel.Status.SUSPENDED]:
             print(f"警告：尝试推进非运行中的实例 {instance.id} (状态: {instance.status})")
             return

        definition_json = instance.definition.definition_json
        completed_node = self._find_node_by_id(definition_json, completed_node_id)

        if not completed_node:
            # 如果调用正确，这不应该发生
            print(f"错误：完成的节点 ID {completed_node_id} 在实例 {instance.id} 中未找到")
            # 考虑将实例标记为 FAILED
            instance.status = InstanceStatusModel.Status.FAILED
            instance.save()
            self._log_history(instance, WorkflowHistory.EventType.INSTANCE_FAILED, node_id=completed_node_id, details={'错误': f'完成的节点 {completed_node_id} 在定义中未找到'})
            return

        # 更新 payload（例如合并任务的完成数据）
        if isinstance(completion_data, dict):
            instance.payload.update(completion_data) # 合并结果到 payload

        # 记录离开已完成的节点
        self._log_history(instance, WorkflowHistory.EventType.NODE_EXITED, node_id=completed_node_id, details=completion_data)

        # 更新当前节点 (移除刚完成的节点)
        current_nodes = list(instance.current_node_ids)
        if completed_node_id in current_nodes:
            current_nodes.remove(completed_node_id)

        next_node_ids_to_activate = []

        # 查找从已完成节点出发的边
        outgoing_edges = self._find_outgoing_edges(definition_json, completed_node_id)

        # 根据节点类型和边/条件确定下一个节点
        node_type = completed_node.get('type', '').lower()

        if node_type == 'decisionnode': # 或者你的决策节点类型
            evaluated_edge_found = False
            default_edge = None
            for edge in outgoing_edges:
                condition = edge.get('data', {}).get('condition', '') # 条件在边的 data.condition 中
                is_default = edge.get('data', {}).get('isDefault', False) # 检查是否有默认标记

                if not condition and not is_default: # 没有条件也不是默认，视为始终为真
                     target_node_id = edge.get('target')
                     next_node_ids_to_activate.append(target_node_id)
                     self._log_history(instance, WorkflowHistory.EventType.NODE_ENTERED, node_id=target_node_id, details={'来自决策节点': completed_node_id, '原因': '无条件路径'})
                     evaluated_edge_found = True
                     break # 假设是排他网关 (XOR)

                elif condition and rule_evaluator.evaluate(condition, instance.payload):
                     target_node_id = edge.get('target')
                     next_node_ids_to_activate.append(target_node_id)
                     self._log_history(instance, WorkflowHistory.EventType.NODE_ENTERED, node_id=target_node_id, details={'来自决策节点': completed_node_id, '满足条件': condition})
                     evaluated_edge_found = True
                     break # 假设是排他网关 (XOR)

                elif is_default:
                    default_edge = edge # 记下默认边，最后处理

            if not evaluated_edge_found and default_edge:
                 target_node_id = default_edge.get('target')
                 next_node_ids_to_activate.append(target_node_id)
                 self._log_history(instance, WorkflowHistory.EventType.NODE_ENTERED, node_id=target_node_id, details={'来自决策节点': completed_node_id, '原因': '默认路径'})
                 evaluated_edge_found = True

            if not evaluated_edge_found:
                 # 处理没有条件匹配且没有默认路径的情况 (例如，错误或流程卡住)
                 print(f"警告：决策节点 {completed_node_id} 在实例 {instance.id} 中没有路径满足条件且无默认路径")
                 # 可以在这里将实例标记为 FAILED 或 SUSPENDED
                 # instance.status = InstanceStatusModel.Status.SUSPENDED
                 # self._log_history(instance, WorkflowHistory.EventType.INSTANCE_FAILED, node_id=completed_node_id, details={'错误':'决策节点无匹配路径'})
                 pass # 当前实现：此路径停止

        elif node_type == 'endnode': # 或者你的结束节点类型
             # 工作流路径在此结束。如果没有其他活动路径，则完成实例。
             pass # 下面的逻辑处理实例完成检查

        else: # 标准节点类型 (开始、审批、服务、通知等)
             # 除非是并行拆分节点，否则假定只有一个传出路径
             for edge in outgoing_edges:
                 target_node_id = edge.get('target')
                 next_node_ids_to_activate.append(target_node_id)
                 self._log_history(instance, WorkflowHistory.EventType.NODE_ENTERED, node_id=target_node_id, details={'来自节点': completed_node_id})
                 # 如果是并行拆分 (AND)，添加所有目标。如果是顺序流，应该只有一条边。

        # 处理新激活的节点
        newly_activated_nodes_requiring_processing = []
        for next_node_id in next_node_ids_to_activate:
             if next_node_id not in current_nodes: # 避免在合并并行路径时重复添加
                 current_nodes.append(next_node_id)
                 newly_activated_nodes_requiring_processing.append(next_node_id)

        instance.current_node_ids = current_nodes # 先保存当前节点状态
        instance.save() # 保存 payload 和 current_node_ids 的更新

        # 现在处理需要动作的新节点（创建任务、执行服务等）
        # 将此移到循环外可以避免在一个事务中嵌套调用 advance_workflow
        for node_id_to_process in newly_activated_nodes_requiring_processing:
             next_node = self._find_node_by_id(definition_json, node_id_to_process)
             if not next_node:
                 print(f"错误：下一个节点 ID {node_id_to_process} 在定义中未找到。")
                 instance.status = InstanceStatusModel.Status.FAILED
                 instance.save() # 保存失败状态
                 self._log_history(instance, WorkflowHistory.EventType.INSTANCE_FAILED, details={'错误': f'下一个节点 {node_id_to_process} 未找到'})
                 # 停止此实例的进一步处理
                 continue # 处理下一个可能的新激活节点

             next_node_type = next_node.get('type', '').lower()

             # 为 *新进入* 的节点执行逻辑
             if next_node_type in ['approvalnode', 'usertasknode']: # 检查你的特定类型
                 self._create_task(instance, next_node)
                 # 路径在此暂停，等待任务完成

             elif next_node_type == 'servicetasknode':
                 # TODO: 执行服务任务 (例如，调用外部 API, 更新数据库)
                 # 这可能是同步的或异步的 (使用 Celery)
                 # 如果同步且成功，立即调用 advance_workflow(instance, node_id_to_process, {'service_result': ...})
                 # 如果异步，Celery 任务必须在完成时调用 advance_workflow
                 print(f"信息：到达服务任务 {node_id_to_process}。执行未实现。")
                 # 暂时假设同步成功：
                 # 注意：在同一个事务中递归调用 advance_workflow 可能导致问题，最好用 Celery
                 # self.advance_workflow(instance, node_id_to_process, {'service_result': 'NotImplemented'})
                 # 如果需要立即推进，并且操作很快，可以在这里直接调用，但要注意事务嵌套
                 # 更好的方式是让服务任务执行后（可能通过 Celery 任务）再调用 advance_workflow

             elif next_node_type == 'notificationnode':
                 # TODO: 发送通知 (例如，使用 Celery)
                 print(f"信息：到达通知任务 {node_id_to_process}。发送未实现。")
                 # 通知通常不阻塞，立即推进
                 # 同样，推荐异步处理后调用 advance_workflow
                 # self.advance_workflow(instance, node_id_to_process, {'notification_sent': 'NotImplemented'})

             elif next_node_type == 'endnode':
                 # 到达结束节点。此路径完成。
                 # 下面的逻辑将检查整个实例是否应完成。
                 pass # 此处无需操作

             elif next_node_type == 'decisionnode':
                  # 决策逻辑在 *离开* 节点时运行，所以只需进入即可。
                  # 或者，如果条件仅依赖于已存在的 payload，可以立即评估？
                  # 标准做法是根据传入数据/任务结果在退出时评估。
                  pass # 假设在退出时评估

             else: # 包括 'startNode' 或其他中间节点
                 # 没有特定操作，自动推进
                 self.advance_workflow(instance, node_id_to_process)


        # 在所有新节点处理（或任务创建）完成后，检查实例是否已完成
        # 重新获取实例状态，因为 advance_workflow 可能已被递归或异步调用修改
        instance.refresh_from_db()
        if not instance.current_node_ids and instance.status == InstanceStatusModel.Status.RUNNING: # 没有活动的节点意味着工作流完成
            instance.status = InstanceStatusModel.Status.COMPLETED
            instance.completed_at = timezone.now()
            instance.save()
            self._log_history(instance, WorkflowHistory.EventType.INSTANCE_COMPLETED)
            # TODO: 执行工作流完成时的任何最终操作 (例如，更新原始请假请求的状态)


    @transaction.atomic
    def complete_task(self, task_id, user, outcome, completion_data=None):
        try:
            # 使用 select_for_update 锁定任务和实例以防止竞争条件
            task = WorkflowTask.objects.select_for_update().select_related('instance').get(id=task_id)
            instance = WorkflowInstance.objects.select_for_update().get(id=task.instance.id)
            task.instance = instance # 确保任务关联的是锁定的实例
        except WorkflowTask.DoesNotExist:
            print(f"错误：任务 {task_id} 未找到。")
            raise ValueError(_("任务未找到")) # 返回可翻译的错误
        except WorkflowInstance.DoesNotExist:
             print(f"错误：任务 {task_id} 关联的实例 {task.instance_id} 未找到。")
             raise ValueError(_("任务关联的实例未找到"))

        # TODO: 添加权限检查：'user' 是否允许完成此任务？
        # (检查 task.assigned_users 或解析指派人标识符)
        # if not self._can_user_complete_task(user, task):
        #     raise PermissionError(_("用户无权完成此任务"))

        if task.status == TaskStatusModel.Status.COMPLETED:
            print(f"警告：任务 {task_id} 已完成。")
            # 可以选择返回任务或引发特定错误，表明重复完成
            # raise ValueError(_("任务已完成"))
            return task

        if task.status == TaskStatusModel.Status.CANCELED:
            print(f"警告：任务 {task_id} 已取消，无法完成。")
            raise ValueError(_("任务已取消"))


        task.status = TaskStatusModel.Status.COMPLETED
        task.outcome = outcome
        task.completion_data = completion_data or {}
        task.completed_at = timezone.now()
        task.completed_by = user
        task.save()

        # 将任务结果合并到实例 payload 中，以便后续节点（如决策节点）使用
        task_result_payload = {
            f"{task.node_id}_outcome": outcome,
            f"{task.node_id}_completion_data": task.completion_data,
            f"{task.node_id}_completed_by": user.username # 或 user.id
        }
        # instance.payload.update(task_result_payload) # advance_workflow 现在处理合并
        # instance.save() # advance_workflow 会保存

        self._log_history(
            instance,
            WorkflowHistory.EventType.TASK_COMPLETED,
            node_id=task.node_id,
            task=task,
            user=user,
            details={'结果': outcome, '完成数据': task.completion_data}
        )

        # 从生成此任务的节点推进工作流
        self.advance_workflow(instance, task.node_id, task_result_payload) # 将任务结果传递下去

        return task

# 实例化服务供视图使用
workflow_engine = WorkflowEngineService()