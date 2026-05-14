@echo off
echo 启动 AI面试平台后端...
cd /d %~dp0backend
call venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
