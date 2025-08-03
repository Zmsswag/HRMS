from django.utils import timezone
from django.db import models
from django.contrib.auth.hashers import make_password
from django.db.models import UniqueConstraint
from django.core.exceptions import ValidationError
from django.db import transaction
import json

def HundredPercentValidator(value):
    """自定义验证器，确保任务完成率不超过100%"""
    if value > 100:
        raise ValidationError(
            ('%(value)s 超过100%'),
            params={'value': value},
        )
    return value

def validate_id_number_unique_if_not_empty(value):
    """自定义验证器，确保非空身份证号不重复"""
    if value == "":  # 允许空字符串
        return value
    
    # 检查是否已存在相同的非空身份证号
    if EmployeeProfile.objects.filter(id_number=value).exists():
        raise ValidationError(
            ('身份证号 %(value)s 已存在'),
            params={'value': value},
        )
    return value


class EmployeeProfile(models.Model):
    """员工档案表（核心表）
    对应SQL设计中的档案表，存储员工基本信息及雇佣状态"""
    employee_id = models.AutoField(primary_key=True, verbose_name="员工ID")
    name = models.CharField(max_length=100, verbose_name="姓名")
    id_number = models.CharField(
        max_length=18, 
        blank=True,  # 允许表单中为空
        default="",  # 默认为空字符串
        validators=[validate_id_number_unique_if_not_empty],  # 自定义验证器
        verbose_name="身份证号"
    )
    age = models.PositiveIntegerField(verbose_name="年龄")
    current_hire_date = models.DateField(verbose_name="当前入职时间")
    is_employed = models.BooleanField(default=True, verbose_name="是否在职")

    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        """重写save方法处理雇佣状态变更逻辑
        实现SQL设计中提到的自动更新入职时间功能"""
        with transaction.atomic():  # 保证事务原子性
            # 新员工入职时设置初始入职时间
            if not self.pk:  # 仅在新创建时处理
                if self.is_employed and self.current_hire_date is None:
                    self.current_hire_date = timezone.now().date()
            
            # 处理重新入职逻辑
            if self.pk:
                orig = EmployeeProfile.objects.select_for_update().get(pk=self.pk)
                if not orig.is_employed and self.is_employed:
                    # 更新入职时间为当前时间
                    self.current_hire_date = timezone.now().date()
            
        super().save(*args, **kwargs)

    class Meta:
        indexes = [
            # 为常用查询字段添加索引（注意：重复索引需要检查）
            models.Index(fields=['employee_id']),  #员工ID索引
            models.Index(fields=['is_employed']),  # 在职状态索引
            models.Index(fields=['name']),# 姓名索引
            models.Index(fields=['age']),
        ]
        # 添加中文名称
        verbose_name = "员工档案"
        verbose_name_plural = "员工档案"

class EmploymentHistory(models.Model):
    """雇佣历史表
    记录员工入职离职历史，与档案表关联"""
    record_id = models.AutoField(primary_key=True, verbose_name="记录ID")
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.SET_NULL,  # 员工被删除时，将此字段设为NULL
        null=True,  # 允许为NULL
        verbose_name="关联员工"
    )
    hire_date = models.DateField(verbose_name="入职时间")
    leave_date = models.DateField(null=True, blank=True, verbose_name="离职时间")
    leave_reason = models.CharField(
        max_length=200, 
        blank=True,
        verbose_name="离职原因"
    )
    
    def __str__(self):
        employee_name = self.employee.name if self.employee else "未知员工"
        return f"{employee_name}的雇佣记录({self.hire_date})"
    
    class Meta:
        verbose_name = "雇佣历史"
        verbose_name_plural = "雇佣历史"

class UserAccount(models.Model):
    """用户账号表
    与员工档案表一对一关联，存储登录凭证"""
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.CASCADE,  # 级联删除
        verbose_name="关联员工"
    )
    account = models.CharField(
        max_length=50,
        unique=True,  # 账号唯一约束
        verbose_name="登录账号"
    )
    password = models.CharField(max_length=128, verbose_name="加密密码")
    
    class Meta:
        indexes=[
            models.Index(fields=['employee']),
            models.Index(fields=['account']),
        ]
        verbose_name = "用户账号"
        verbose_name_plural = "用户账号"
        
    def save (self, *args, **kwargs):
        """重写save方法，确保密码加密存储"""
        self.password = make_password(self.password)
        super().save(*args, **kwargs)

class Attendance(models.Model):
    """考勤打卡表
    记录每日上下班打卡时间，防止重复打卡"""
    ATTENDANCE_TYPE = [('in', '上班'), ('out', '下班')]
    
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.CASCADE,
        verbose_name="关联员工"
    )
    date = models.DateField(verbose_name="打卡日期")
    type = models.CharField(
        max_length=3, 
        choices=ATTENDANCE_TYPE,
        verbose_name="打卡类型"
    )
    time = models.DateTimeField(verbose_name="具体时间")

    class Meta:
        constraints = [
            # 唯一约束：同一员工同一天不能重复同类型打卡
            UniqueConstraint(
                fields=['employee', 'date', 'type'],
                name='unique_attendance'
            )
        ]
        verbose_name = "考勤打卡"
        verbose_name_plural = "考勤打卡"


class Salary(models.Model):
    """薪酬表
    按日期记录员工薪酬，支持自动计算和手动修改"""
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.SET_NULL,  # 员工被删除时，将此字段设为NULL
        null=True,  # 允许为NULL
        verbose_name="关联员工"
    )
    date = models.DateField(verbose_name="薪资月份")
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name="薪酬金额(元)"
    )

    class Meta:
        # 复合主键约束：同一员工同月只能有一条记录
        unique_together = ('employee', 'date')
        verbose_name = "薪酬"
        verbose_name_plural = "薪酬"

class Message(models.Model):
    """消息通知表
    支持JSON格式消息内容存储"""
    message_id = models.AutoField(primary_key=True, verbose_name="消息ID")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="发送时间")
    content = models.JSONField(verbose_name="消息内容（JSON格式）")
    is_read = models.BooleanField(default=False, verbose_name="已读状态")
    msg_type = models.CharField(max_length=20, verbose_name="消息类型")
    
    class Meta:
        verbose_name = "消息通知"
        verbose_name_plural = "消息通知"

class MessageEmployee(models.Model):
    """消息-员工关联表
    实现多对多关系，支持消息的批量发送"""
    message = models.ForeignKey(
        Message, 
        verbose_name="消息ID", 
        on_delete=models.CASCADE,
    )
    employee = models.ForeignKey(
        EmployeeProfile,
        verbose_name="接收员工",
        on_delete=models.CASCADE, 
    )
    
    class Meta:
        unique_together = ('message', 'employee')
        verbose_name = "消息-员工关联"
        verbose_name_plural = "消息-员工关联"

class Department(models.Model):
    """部门信息表"""
    department_id = models.AutoField(primary_key=True, verbose_name="部门ID")
    name = models.CharField(max_length=100, verbose_name="部门名称")
    def __str__(self):
        return self.name
    class Meta:
        verbose_name = "部门信息"
        verbose_name_plural = "部门信息"

class Position_Power(models.Model):
    """职位权限表"""
    power_id = models.AutoField(primary_key=True, verbose_name="权限ID")
    name = models.CharField(max_length=100, verbose_name="权限名称")
    #低权限不能修改高权限
    power_level = models.IntegerField(
        default=0,
        verbose_name="权限值"
    )
    modifie_same_department_position = models.BooleanField(
        default=False, 
        verbose_name="是否允许修改同部门"
    )
    modifie_other_department_position = models.BooleanField(
        default=False,
        verbose_name="是否允许修改其他部门" 
    )
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "职位权限"
        verbose_name_plural = "职位权限"

class Position(models.Model):
    """职位信息表"""
    position_id = models.AutoField(primary_key=True, verbose_name="职位ID")
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        verbose_name="所属部门"
    )
    title = models.CharField(max_length=100, verbose_name="职位名称")
    power = models.ForeignKey(
        Position_Power,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name="职位权限"
    )
    
    def __str__(self):
        return self.title
    
    class Meta:
        verbose_name = "职位信息"
        verbose_name_plural = "职位信息"

    
    
class EmployeeDepartment(models.Model):
    """员工-部门关联表
    实现多对多关系，支持兼职"""
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.CASCADE,
        verbose_name="关联员工"
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        verbose_name="所属部门"
    )
    position = models.ForeignKey(
        Position,
        on_delete=models.CASCADE,
        verbose_name="担任职位"
    )

    class Meta:
        # 唯一约束：避免重复的部门职位分配
        unique_together = ('employee', 'department', 'position')
        verbose_name = "员工-部门关联"
        verbose_name_plural = "员工-部门关联"

class Approval(models.Model):
    """审批记录表"""
    approval_id = models.AutoField(primary_key=True, verbose_name="审批ID")
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.SET_NULL,  # 员工被删除时，将此字段设为NULL
        null=True,  # 允许为NULL
        verbose_name="申请人"
    )
    content = models.JSONField(verbose_name="审批内容（JSON格式）")
    approval_type = models.CharField(max_length=20, verbose_name="审批类型")
    
    class Meta:
        verbose_name = "审批记录"
        verbose_name_plural = "审批记录"

class JobApplication(models.Model):
    """招聘申请表
    实现每天每人每个部门岗位只能申请一次"""
    name = models.CharField(max_length=100, verbose_name="申请人姓名")
    date = models.DateField(verbose_name="申请日期")
    id_number = models.CharField(max_length=18, verbose_name="身份证号")
    education = models.CharField(max_length=100, verbose_name="学历")
    expected_department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        verbose_name="期望部门"
    )
    expected_position = models.ForeignKey(
        Position,
        on_delete=models.CASCADE,
        verbose_name="期望职位"
    )

    class Meta:
        # 复合主键：控制每人每天每个岗位只能申请一次
        unique_together = ('date', 'id_number', 'expected_department', 'expected_position')
        verbose_name = "招聘申请"
        verbose_name_plural = "招聘申请"

class Task(models.Model):
    """任务主表
    包含任务进度和生命周期管理"""
    task_id = models.AutoField(primary_key=True, verbose_name="任务ID")
    completion = models.PositiveIntegerField(
        validators=[HundredPercentValidator],  # 自定义验证
        verbose_name="完成进度（0-100）"
    )
    content = models.JSONField(verbose_name="任务内容（JSON格式）")
    assigner = models.CharField(
        max_length=50, 
        default='CEO',
        verbose_name="分配人"
    )
    assign_time = models.DateTimeField(
        auto_now_add=True,
        verbose_name="分配时间"
    )
    start_time = models.DateTimeField(verbose_name="实际开始时间")
    expected_end = models.DateTimeField(verbose_name="预期完成时间")
    actual_end = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name="实际完成时间"
    )
    class Meta:
        verbose_name = "任务信息"
        verbose_name_plural = "任务信息"
    def save(self, *args, **kwargs):
        """重写save方法，确保任务完成后更新实际完成时间"""

        
        if self.completion == 100 and not self.actual_end:
            # 任务完成且没有设置完成时间时，自动设置为当前时间
            self.actual_end = timezone.now()
        elif self.completion < 100:
            # 任务未完成时，清除完成时间
            self.actual_end = None
            
            
        super().save(*args, **kwargs)
        

class TaskAssignment(models.Model):
    """任务分配表
    记录任务与执行人的多对多关系"""
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,  # 级联删除
        verbose_name="关联任务"
    )
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.CASCADE,
        verbose_name="负责员工"
    )

    class Meta:
        # 唯一约束：避免重复分配同一任务给同一员工
        unique_together = ('task', 'employee')
        verbose_name="任务分配"
        verbose_name_plural="任务分配"

class Leave(models.Model):
    """剩余假期天数表
    记录员工各类假期的剩余天数"""
    employee = models.OneToOneField(
        EmployeeProfile,
        on_delete=models.CASCADE,
        related_name='leave_balance',
        verbose_name="关联员工"
    )
    annual_leave = models.FloatField(default=0, verbose_name="年假剩余天数")
    sick_leave = models.FloatField(default=0, verbose_name="病假剩余天数")
    personal_leave = models.FloatField(default=0, verbose_name="事假剩余天数")
    marriage_leave = models.FloatField(default=0, verbose_name="婚假剩余天数")
    maternity_leave = models.FloatField(default=0, verbose_name="产假剩余天数")
    paternity_leave = models.FloatField(default=0, verbose_name="陪产假剩余天数")
    bereavement_leave = models.FloatField(default=0, verbose_name="丧假剩余天数")
    year = models.IntegerField(default=timezone.now().year, verbose_name="年份")
    
    def __str__(self):
        return f"{self.employee.name}的假期余额({self.year}年)"
    
    class Meta:
        verbose_name = "剩余假期"
        verbose_name_plural = "剩余假期"
        unique_together = ('employee', 'year')
        indexes = [
            models.Index(fields=['employee']),
            models.Index(fields=['year']),
        ]


class LeaveApplication(models.Model):
    """假期申请表
    记录员工的请假申请及审批状态"""
    LEAVE_TYPES = [
        ('annual', '年假'),
        ('sick', '病假'),
        ('personal', '事假'),
        ('marriage', '婚假'),
        ('maternity', '产假'),
        ('paternity', '陪产假'),
        ('bereavement', '丧假'),
        ('other', '其他')
    ]
    
    STATUS_CHOICES = [
        ('pending', '待审批'),
        ('approved', '已批准'),
        ('rejected', '已拒绝'),
        ('cancelled', '已取消')
    ]
    
    application_id = models.AutoField(primary_key=True, verbose_name="申请ID")
    employee = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.CASCADE,
        related_name='leave_applications',
        verbose_name="申请员工"
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        verbose_name="所属部门"
    )
    leave_type = models.CharField(
        max_length=20,
        choices=LEAVE_TYPES,
        verbose_name="假期类型"
    )
    start_date = models.DateField(verbose_name="开始日期")
    end_date = models.DateField(verbose_name="结束日期")
    days = models.FloatField(verbose_name="请假天数")
    reason = models.TextField(verbose_name="请假原因")
    apply_time = models.DateTimeField(auto_now_add=True, verbose_name="申请时间")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="审批状态"
    )
    approver = models.ForeignKey(
        EmployeeProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_leaves',
        verbose_name="审批人"
    )
    approval_time = models.DateTimeField(null=True, blank=True, verbose_name="审批时间")
    approval_comment = models.TextField(blank=True, verbose_name="审批意见")
    
    def __str__(self):
        return f"{self.employee.name}的{self.get_leave_type_display()}申请({self.start_date}至{self.end_date})"
    
    def save(self, *args, **kwargs):
        """重写save方法，自动计算请假天数"""
        if not self.days:
            # 计算请假天数（包括开始日期和结束日期）
            delta = self.end_date - self.start_date
            self.days = delta.days + 1
        
        # 如果状态变更为已批准，自动设置审批时间
        if self.status == 'approved' and not self.approval_time:
            self.approval_time = timezone.now()
            
            # 更新员工的假期余额
            try:
                leave_balance = Leave.objects.get(employee=self.employee, year=self.start_date.year)
                
                # 根据假期类型减少相应的余额
                if self.leave_type == 'annual':
                    leave_balance.annual_leave = max(0, leave_balance.annual_leave - self.days)
                elif self.leave_type == 'sick':
                    leave_balance.sick_leave = max(0, leave_balance.sick_leave - self.days)
                elif self.leave_type == 'personal':
                    leave_balance.personal_leave = max(0, leave_balance.personal_leave - self.days)
                elif self.leave_type == 'marriage':
                    leave_balance.marriage_leave = max(0, leave_balance.marriage_leave - self.days)
                elif self.leave_type == 'maternity':
                    leave_balance.maternity_leave = max(0, leave_balance.maternity_leave - self.days)
                elif self.leave_type == 'paternity':
                    leave_balance.paternity_leave = max(0, leave_balance.paternity_leave - self.days)
                elif self.leave_type == 'bereavement':
                    leave_balance.bereavement_leave = max(0, leave_balance.bereavement_leave - self.days)
                
                leave_balance.save()
            except Leave.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "假期申请"
        verbose_name_plural = "假期申请"
        indexes = [
            models.Index(fields=['employee']),
            models.Index(fields=['department']),
            models.Index(fields=['status']),
            models.Index(fields=['start_date']),
            models.Index(fields=['end_date']),
        ]