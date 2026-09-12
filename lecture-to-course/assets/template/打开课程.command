#!/bin/sh
cd -- "$(dirname -- "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then
  exec python3 ./launch_course.py
fi
printf '%s\n' 'Python 3 is required for the local launcher. You can also try opening index.html directly.'
printf '%s\n' '本机启动入口需要 Python 3；也可尝试直接打开 index.html。按回车退出。'
read -r reply
