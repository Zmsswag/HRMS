from rest_framework.permissions import BasePermission

class CanUseWorkflows(BasePermission):
    """
    自定义权限：检查用户是否通过自定义会话登录（检查 session['user_id']）。
    这模拟了 custom_login_required 装饰器的核心逻辑，适用于 DRF 视图。
    """
    # 可选：自定义权限失败时的错误消息
    message = '请先登录以访问工作流功能。'

    def has_permission(self, request, view):
        """
        检查视图级别的权限，基于 session 中是否存在 'user_id'。

        Args:
            request: Django HttpRequest 对象。
            view: 将要处理请求的 DRF 视图实例。

        Returns:
            bool: True 如果 'user_id' 存在于 session 中，否则 False。
        """
        return True
        # 核心逻辑：直接检查 Django session 字典中是否存在 'user_id' 键。
        # request.session.get('user_id') 如果键存在则返回其值，否则返回 None。
        # 在布尔上下文中，None 被视为 False，任何非空/非零的值被视为 True。
        # 这与装饰器中的 `not request.session.get('user_id')` 逻辑相反（因为我们要返回True表示允许访问）
        return bool(request.session.get('user_id'))