from ..decorators import custom_login_required
# 使用自定义装饰器替代Django的login_required
@custom_login_required
def leave_application(request):
    pass