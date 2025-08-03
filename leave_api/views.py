# leave_api/views.py
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from myapp.models import LeaveApplication, EmployeeProfile # 从 myapp.models 导入
from .serializers import LeaveApplicationSerializer

# Demo 常量
DEMO_APPROVER_EMPLOYEE_ID = 1

class PendingApprovalsListView(generics.ListAPIView):
    serializer_class = LeaveApplicationSerializer
    permission_classes = [IsAuthenticated] # 确保用户已登录

    def get_queryset(self):
        # ** DEMO 逻辑 **
        # 假设当前登录用户是 session['user_id']
        # 我们只为 employee_id = 1 的用户显示待审批列表
        
        session_user_id = self.request.session.get('user_id')
        acting_user_id_from_query = self.request.query_params.get('approverId') # 前端发送的 approverId

        # 校验前端发送的 approverId 是否与 session 中的用户匹配 (对于真实场景很重要)
        # 且是否是我们 demo 中设定的审批人 ID
        if not session_user_id or \
           not acting_user_id_from_query or \
           str(session_user_id) != acting_user_id_from_query or \
           int(session_user_id) != DEMO_APPROVER_EMPLOYEE_ID:
            print(f"DEMO: Access denied or wrong approver. Session User: {session_user_id}, Query Approver: {acting_user_id_from_query}")
            return LeaveApplication.objects.none() # 不返回任何数据

        print(f"DEMO: Fetching pending approvals for hardcoded approver ID: {DEMO_APPROVER_EMPLOYEE_ID}")
        # 返回所有状态为 'pending' 的申请
        # 在真实场景中，这里会通过 WorkflowTask 查询
        queryset = LeaveApplication.objects.filter(status='pending').order_by('-apply_time')
        
        # --- 前端筛选和排序的简单实现 (基于模型字段) ---
        # 部门筛选 (由于部门是硬编码的，这里的筛选可能效果不大，除非前端传的就是"人力资源部")
        department_filter = self.request.query_params.get('department')
        if department_filter and department_filter == "人力资源部":
            pass # 所有都是人力资源部，所以不需要额外过滤
        elif department_filter: # 如果传了其他部门，则返回空
            return LeaveApplication.objects.none()

        # 申请人姓名筛选
        applicant_name_filter = self.request.query_params.get('applicantName')
        if applicant_name_filter:
            queryset = queryset.filter(employee__name__icontains=applicant_name_filter)
        
        # 排序
        sort_field_mapping = {
            'id': 'application_id',
            'applicantName': 'employee__name',
            'startDate': 'start_date',
            'duration': 'days',
            'createdAt': 'apply_time',
        }
        sort_field_frontend = self.request.query_params.get('sortField')
        sort_order = self.request.query_params.get('sortOrder', 'ascend') # antd 默认可能是 ascend

        if sort_field_frontend in sort_field_mapping:
            actual_sort_field = sort_field_mapping[sort_field_frontend]
            if sort_order == 'descend':
                actual_sort_field = f'-{actual_sort_field}'
            queryset = queryset.order_by(actual_sort_field)
        
        return queryset

    def list(self, request, *args, **kwargs):
        # ** DEMO: 确保只有 employee_id=1 的用户能获取列表 **
        session_user_id = self.request.session.get('user_id')
        acting_user_id_from_query = self.request.query_params.get('approverId')

        if not session_user_id or \
           not acting_user_id_from_query or \
           str(session_user_id) != acting_user_id_from_query or \
           int(session_user_id) != DEMO_APPROVER_EMPLOYEE_ID:
            # 对于 ListAPIView，如果 get_queryset 返回 none()，它通常会正确处理
            # 但我们可以在这里更明确地返回一个空的标准响应或错误
            return Response({
                'data': [],
                'current_page': 1,
                'page_size': self.paginator.get_page_size(request) if hasattr(self, 'paginator') and self.paginator else 10,
                'total': 0,
            }, status=status.HTTP_200_OK) # 或者 HTTP_403_FORBIDDEN 如果想更严格


        # 调用父类的 list 方法以利用其分页和序列化逻辑
        response = super().list(request, *args, **kwargs)
        
        # 适配前端期望的响应结构
        # DRF PageNumberPagination 默认返回 { "count": ..., "next": ..., "previous": ..., "results": ... }
        # 前端期望 { data: [], current_page: 1, page_size: 10, total: 0 }
        
        # 获取分页器信息（如果存在）
        page_size = 10 # 默认值
        current_page_num = int(request.query_params.get(self.paginator.page_query_param, 1)) if hasattr(self, 'paginator') and self.paginator and hasattr(self.paginator, 'page_query_param') else 1
        if hasattr(self, 'paginator') and self.paginator:
            try:
                 page_size = self.paginator.get_page_size(request)
            except: # pylint: disable=bare-except
                 pass # 使用默认

        return Response({
            'data': response.data.get('results', []), # 从DRF分页响应中提取 'results'
            'current_page': current_page_num,
            'page_size': page_size,
            'total': response.data.get('count', 0),   # 从DRF分页响应中提取 'count'
        }, status=status.HTTP_200_OK)


class BaseApprovalActionView(APIView):
    permission_classes = [IsAuthenticated]

    def update_leave_application_status(self, pk, new_status, comment, approver_employee_id):
        session_user_id = self.request.session.get('user_id')
        acting_user_id_from_query = self.request.query_params.get('actingUserId')

        # 权限校验
        if not session_user_id or \
           not acting_user_id_from_query or \
           str(session_user_id) != acting_user_id_from_query or \
           int(session_user_id) != DEMO_APPROVER_EMPLOYEE_ID:
            return Response({"error": "无权限操作或用户不匹配"}, status=status.HTTP_403_FORBIDDEN)

        try:
            leave_application = LeaveApplication.objects.get(application_id=pk)
        except LeaveApplication.DoesNotExist:
            return Response({"error": "请假申请不存在"}, status=status.HTTP_404_NOT_FOUND)

        if leave_application.status != 'pending':
            return Response({"error": f"申请状态为 {leave_application.get_status_display()}，无法重复审批"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            approver_profile = EmployeeProfile.objects.get(employee_id=approver_employee_id)
        except EmployeeProfile.DoesNotExist:
            # 理论上 approver_employee_id (DEMO_APPROVER_EMPLOYEE_ID) 应该是存在的
            return Response({"error": "审批人档案不存在"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        leave_application.status = new_status
        leave_application.approver = approver_profile
        leave_application.approval_comment = comment
        leave_application.approval_time = timezone.now() # 使用 django.utils.timezone
        leave_application.save()
        
        # ** DEMO: 这里我们不调用工作流引擎 **
        # workflow_engine.complete_task(task_id, approver_employee_id, outcome, completion_data)

        serializer = LeaveApplicationSerializer(leave_application)
        return Response({
            "message": f"申请已{leave_application.get_status_display()}", 
            "data": serializer.data
        }, status=status.HTTP_200_OK)


class ApproveLeaveRequestView(BaseApprovalActionView):
    def patch(self, request, pk, *args, **kwargs):
        comment = request.data.get('comment', '同意')
        return self.update_leave_application_status(pk, 'approved', comment, DEMO_APPROVER_EMPLOYEE_ID)


class RejectLeaveRequestView(BaseApprovalActionView):
    def patch(self, request, pk, *args, **kwargs):
        comment = request.data.get('comment', '不同意')
        return self.update_leave_application_status(pk, 'rejected', comment, DEMO_APPROVER_EMPLOYEE_ID)