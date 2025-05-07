#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 设置API基础URL
API_URL="http://localhost:8080/tasks"

# 新增通用响应处理函数
process_get_response() {
  local response=$1
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
    echo -e "${GREEN}测试成功! 状态码: $http_code${NC}"
  else
    echo -e "${RED}测试失败! 状态码: $http_code${NC}"
  fi

  echo "响应数据:"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  echo -e "\n-----------------------------------\n"
}

# 新增测试场景7: 获取所有任务
test_get_all_tasks() {
  echo -e "${BLUE}运行测试: 获取所有任务${NC}"
  response=$(curl -s -w "\n%{http_code}" -X GET $API_URL)
  process_get_response "$response"
}

# 新增测试场景8: 按ID查询任务
test_get_task_by_id() {
  echo -e "${BLUE}运行测试: 按ID查询任务${NC}"
  read -p "请输入任务ID: " task_id
  response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/$task_id")
  process_get_response "$response"
}

# 新增测试场景9: 按状态过滤任务
test_filter_tasks_by_status() {
  echo -e "${BLUE}运行测试: 按状态过滤任务${NC}"
  response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL?status=published")
  process_get_response "$response"
}

# 函数：运行测试并显示结果
run_test() {
  local test_name=$1
  local payload=$2
  
  echo -e "${BLUE}运行测试: ${test_name}${NC}"
  echo "请求数据:"
  echo "$payload" | jq '.'
  
  # 发送请求并获取响应
  response=$(curl -s -w "\n%{http_code}" -X POST $API_URL \
    -H "Content-Type: application/json" \
    -d "$payload")
  
  # 提取HTTP状态码和响应体
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  # 显示结果
  if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
    echo -e "${GREEN}测试成功! 状态码: $http_code${NC}"
  else
    echo -e "${RED}测试失败! 状态码: $http_code${NC}"
  fi
  
  echo "响应数据:"
  echo "$body" | jq '.' 2>/dev/null || echo "$body"
  echo -e "\n-----------------------------------\n"
}

# 测试场景1: 基本听写任务
test_dictation_task() {
  local payload='{
    "title": "单词听写测试",
    "task_type": "dictation",
    "subject": "english",
    "status": "published",
    "deadline": "2025-12-31T23:59:59Z",
    "contents": [
      {
        "content_type": "dictation",
        "points": 100,
        "order_num": 1,
        "selected_word_ids": [1157, 1158, 1159],
        "generate_mode": "manual"
      }
    ]
  }'
  
  run_test "基本听写任务" "$payload"
}

# 测试场景2: 句子跟读任务
test_sentence_repeat_task() {
  local payload='{
    "title": "句子跟读测试",
    "task_type": "sentence_repeat",
    "subject": "english",
    "status": "published",
    "deadline": "2025-12-31T23:59:59Z",
    "contents": [
      {
        "content_type": "sentence_repeat",
        "points": 100,
        "order_num": 1,
        "selected_sentence_ids": [1, 2, 3],
        "generate_mode": "manual"
      }
    ]
  }'
  
  run_test "句子跟读任务" "$payload"
}

# 测试场景3: 拼写任务
test_spelling_task() {
  local payload='{
    "title": "单词拼写测试",
    "task_type": "spelling",
    "subject": "english",
    "status": "published",
    "deadline": "2025-12-31T23:59:59Z",
    "contents": [
      {
        "content_type": "spelling",
        "points": 100,
        "order_num": 1,
        "selected_word_ids": [1, 2, 3, 4, 5],
        "generate_mode": "manual"
      }
    ]
  }'
  
  run_test "拼写任务" "$payload"
}

# 测试场景4: 综合测验任务
test_quiz_task() {
  local payload='{
    "title": "综合测验",
    "task_type": "quiz",
    "subject": "english",
    "status": "published",
    "deadline": "2025-12-31T23:59:59Z",
    "contents": [
      {
        "content_type": "dictation",
        "points": 50,
        "order_num": 1,
        "selected_word_ids": [1, 2, 3],
        "generate_mode": "manual"
      },
      {
        "content_type": "sentence_repeat",
        "points": 50,
        "order_num": 2,
        "selected_sentence_ids": [1, 2, 3],
        "generate_mode": "manual"
      }
    ]
  }'
  
  run_test "综合测验任务" "$payload"
}

# 测试场景5: 草稿状态任务（不需要截止时间）
test_draft_task() {
  local payload='{
    "title": "草稿状态任务",
    "task_type": "dictation",
    "subject": "english",
    "status": "draft",
    "contents": [
      {
        "content_type": "dictation",
        "points": 100,
        "order_num": 1,
        "selected_word_ids": [1, 2, 3],
        "generate_mode": "manual"
      }
    ]
  }'
  
  run_test "草稿状态任务" "$payload"
}

# 测试场景6: 自动生成模式
test_auto_generate_task() {
  local payload='{
    "title": "自动生成听写任务",
    "task_type": "dictation",
    "subject": "english",
    "status": "published",
    "deadline": "2025-12-31T23:59:59Z",
    "contents": [
      {
        "content_type": "dictation",
        "points": 100,
        "order_num": 1,
        "ref_book_id": "bookA",
        "ref_lesson_id": 1,
        "generate_mode": "auto"
      }
    ]
  }'
  
  run_test "自动生成模式" "$payload"
}

# 新增测试场景11: 更新任务
test_update_task() {
  echo -e "${BLUE}运行测试: 更新任务${NC}"
  read -p "请输入要更新的任务ID: " task_id
  read -p "请输入新标题: " new_title
  
  payload=$(cat <<EOF
{
  "title": "$new_title",
  "description": "更新后的任务描述"
}
EOF
  )

  response=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/$task_id" \
    -H "Content-Type: application/json" \
    -d "$payload")
  
  process_get_response "$response"
}

# 新增测试场景12: 删除任务
test_delete_task() {
  echo -e "${BLUE}运行测试: 删除任务${NC}"
  read -p "请输入要删除的任务ID: " task_id
  
  response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/$task_id")
  
  http_code=$(echo "$response" | tail -n1)
  
  if [[ $http_code -eq 204 ]]; then
    echo -e "${GREEN}测试成功! 状态码: $http_code${NC}"
    echo "任务删除成功"
  else
    echo -e "${RED}测试失败! 状态码: $http_code${NC}"
    echo "响应数据:"
    echo "$response" | sed '$d' | jq '.' 2>/dev/null || echo "$response" | sed '$d'
  fi
  echo -e "\n-----------------------------------\n"
}

# 显示菜单并获取用户选择
show_menu() {
  echo -e "${BLUE}请选择要运行的测试场景:${NC}"
  echo "1) 基本听写任务"
  echo "2) 句子跟读任务"
  echo "3) 拼写任务"
  echo "4) 综合测验任务"
  echo "5) 草稿状态任务"
  echo "6) 自动生成模式"
  echo "7) 运行所有测试"
  echo "8) 获取所有任务"
  echo "9) 按ID查询任务"
  echo "10) 按状态过滤任务"
  echo "11) 更新任务"
  echo "12) 删除任务"
  echo "0) 退出"
  
  read -p "请输入选项 (0-7): " choice
  
  case $choice in
    1) test_dictation_task ;;
    2) test_sentence_repeat_task ;;
    3) test_spelling_task ;;
    4) test_quiz_task ;;
    5) test_draft_task ;;
    6) test_auto_generate_task ;;
    7) 
      test_dictation_task
      test_sentence_repeat_task
      test_spelling_task
      test_quiz_task
      test_draft_task
      test_auto_generate_task
      ;;
    8) test_get_all_tasks ;;
    9) test_get_task_by_id ;;
    10) test_filter_tasks_by_status ;;
    11) test_update_task ;;
    12) test_delete_task ;;
    0) exit 0 ;;
    *) echo -e "${RED}无效选项，请重新选择${NC}" ;;
  esac
  show_menu
}

# 检查jq是否安装
if ! command -v jq &> /dev/null; then
  echo -e "${RED}错误: 需要安装jq来格式化JSON输出${NC}"
  echo "请运行: brew install jq"
  exit 1
fi

# 启动菜单
show_menu