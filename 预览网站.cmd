@echo off
chcp 65001 >nul
cd /d "%~dp0"
python tools\preview.py
if errorlevel 1 (
  echo.
  echo 预览启动失败。请确认已安装 Python 3，并保持项目文件夹完整。
  pause
)
