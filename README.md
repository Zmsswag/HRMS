# 项目名称：[人力资源系统]/HRMS

本项目是一个前后端分离的应用，主要用于一个请假管理的工作流，后端使用 Django，前端使用 Vite + Vue (pnpm)。

## 环境要求

*   Python 3.8+
*   Node.js v16+
*   pnpm 

## 如何运行

请按照以下步骤启动项目。

### 1. 启动后端 (Django)

# 进入后端项目目录

# 安装后端依赖
pip install -r requirements.txt

# 进行数据库迁移（会生成一个新的 db.sqlite3 文件）
python manage.py migrate

# 启动后端开发服务器（默认运行在 http://127.0.0.1:8000）
python manage.py runserver

### 2. 启动前端 (Vite)

# 打开一个新的终端，进入前端项目目录
cd frontend

# 安装前端依赖 (pnpm 会读取 pnpm-lock.yaml 确保版本一致)
pnpm install

# 启动前端开发服务器（通常会运行在 http://localhost:5173）
pnpm run dev
