#!/bin/bash

# 切换到正确的目录
cd "$(dirname "$0")"

echo "Starting AI-Speak Python FastAPI Server..."
echo "Current directory: $(pwd)"

# 智能检测Python命令函数
detect_python() {
    local context="$1"
    echo "[$context] 检测Python命令..."
    
    if command -v python >/dev/null 2>&1; then
        local python_version=$(python --version 2>&1)
        echo "[$context] 找到 python: $python_version"
        echo "python"
    elif command -v python3 >/dev/null 2>&1; then
        local python3_version=$(python3 --version 2>&1)
        echo "[$context] 找到 python3: $python3_version"
        echo "python3"
    else
        echo "[$context] 错误：未找到Python解释器"
        return 1
    fi
}

# 系统环境中检测Python命令（用于创建虚拟环境）
SYSTEM_PYTHON_CMD=$(detect_python "系统环境")
if [ $? -ne 0 ]; then
    exit 1
fi

# 检查虚拟环境是否存在
if [ ! -d ".venv" ]; then
    echo "虚拟环境不存在，正在创建..."
    $SYSTEM_PYTHON_CMD -m venv .venv
    echo "虚拟环境创建完成"
fi

# 激活虚拟环境
echo "激活虚拟环境..."
source .venv/bin/activate

# 检查并创建python软链接
if [ ! -f ".venv/bin/python" ]; then
    echo "创建python软链接..."
    ln -sf python3 .venv/bin/python
fi

# 虚拟环境中使用python命令
echo "[虚拟环境] 使用python命令"
VENV_PYTHON_CMD="python"

# 检查是否需要安装依赖
if [ ! -f ".venv/installed" ]; then
    echo "正在安装依赖..."
    pip install -r requirements.txt
    touch .venv/installed
    echo "依赖安装完成"
fi

# 启动服务器
echo "启动 AI-Speak Python FastAPI 服务器..."
echo "使用Python命令: $VENV_PYTHON_CMD"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 如果需要使用 gunicorn 启动 (生产环境)，可以注释掉上面的 uvicorn 命令，启用下面的命令：
# gunicorn -w 1 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8097 --reload

