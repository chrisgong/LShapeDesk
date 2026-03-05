#!/usr/bin/env sh
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

PID_FILE=".dev_server.pid"
LOG_FILE="dev_server.log"

if [ -f "$PID_FILE" ]; then
  PID="$(cat "$PID_FILE")"
  if ps -p "$PID" >/dev/null 2>&1; then
    echo "开发服务器已在运行 (PID: $PID)。"
    exit 0
  else
    echo "发现失效的 PID 文件，正在清理。"
    rm -f "$PID_FILE"
  fi
fi

npm run dev >"$LOG_FILE" 2>&1 &
PID=$!
echo "$PID" >"$PID_FILE"

echo "开发服务器已启动 (PID: $PID)。"
echo "访问地址: http://localhost:3000/"
echo "日志输出在: $LOG_FILE"

