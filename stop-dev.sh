#!/usr/bin/env sh
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

PID_FILE=".dev_server.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "未找到 PID 文件，开发服务器可能未运行。"
  exit 0
fi

PID="$(cat "$PID_FILE")"

if ps -p "$PID" >/dev/null 2>&1; then
  echo "正在停止开发服务器 (PID: $PID)..."
  kill "$PID" >/dev/null 2>&1 || true
  sleep 1
  if ps -p "$PID" >/dev/null 2>&1; then
    echo "进程仍在运行，尝试强制结束..."
    kill -9 "$PID" >/dev/null 2>&1 || true
  fi
  echo "开发服务器已停止。"
else
  echo "PID $PID 未在运行。"
fi

rm -f "$PID_FILE"

