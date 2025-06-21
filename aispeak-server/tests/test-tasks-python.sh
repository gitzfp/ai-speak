#!/bin/bash

# AI-Speak Python FastAPI 任务接口综合测试脚本
# 整合了交互式测试和自动化测试功能
# 使用方法：
#   ./test-tasks-python.sh           # 交互式菜单模式
#   ./test-tasks-python.sh auto      # 自动化测试模式

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # 无颜色

# 设置API基础URL
BASE_URL="http://127.0.0.1:8000/api/v1"
API_URL="$BASE_URL/tasks"

# 全局变量
AUTO_MODE=false
CREATED_CLASS_ID=""
CREATED_TASK_ID=""
CREATED_SUBMISSION_ID=""

# 通用响应处理函数
process_response() {
  local response=$1
  local test_name=$2
  local expected_codes=$3  # 可选参数，期望的状态码（如 "200,201"）

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  # 如果指定了期望状态码，检查是否匹配
  if [[ -n "$expected_codes" ]]; then
    if [[ ",$expected_codes," == *",$http_code,"* ]]; then
      echo -e "${GREEN}✓ $test_name 成功! 状态码: $http_code${NC}"
      return 0
    else
      echo -e "${RED}✗ $test_name 失败! 状态码: $http_code (期望: $expected_codes)${NC}"
      return 1
    fi
  else
    # 默认检查2xx状态码
    if [[ $http_code -ge 200 && $http_code -lt 300 ]]; then
      echo -e "${GREEN}✓ $test_name 成功! 状态码: $http_code${NC}"
      return 0
    else
      echo -e "${RED}✗ $test_name 失败! 状态码: $http_code${NC}"
      return 1
    fi
  fi
}

# 显示响应内容
show_response() {
  local response=$1
  local body=$(echo "$response" | sed '$d')

  if [[ $AUTO_MODE == false ]]; then
    echo "响应数据:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo -e "\n-----------------------------------\n"
  fi
}

# 获取现有班级的函数（不创建新班级，直接使用现有班级）
get_existing_class() {
  echo -e "\n${BLUE}设置班级ID${NC}"
  # Python API没有获取班级列表的端点，直接使用默认值
  CREATED_CLASS_ID="1"
  echo "使用默认班级ID: $CREATED_CLASS_ID"
  echo "注意: 使用现有班级，不创建新的测试班级"
  return 0
}

# 自动化模式下创建班级的函数（保留但不推荐使用）
auto_create_class() {
  echo -e "\n${BLUE}自动创建测试班级${NC}"
  response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/classes" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "自动测试班级",
      "grade_level": "三年级",
      "subject": "english",
      "teacher_id": "teacher001",
      "description": "用于自动化测试的班级",
      "max_students": 30
    }')

  if process_response "$response" "创建班级" "200,201"; then
    # 从响应中提取班级ID (Python API返回的是data.id)
    local body=$(echo "$response" | sed '$d')
    CREATED_CLASS_ID=$(echo "$body" | jq -r '.data.id' 2>/dev/null)
    if [[ -n "$CREATED_CLASS_ID" && "$CREATED_CLASS_ID" != "null" ]]; then
      echo "创建的班级ID: $CREATED_CLASS_ID"
    else
      echo "警告: 无法从响应中提取班级ID，使用默认值"
      CREATED_CLASS_ID="1"
    fi
    show_response "$response"
    return 0
  else
    show_response "$response"
    return 1
  fi
}

# 获取所有任务
test_get_all_tasks() {
  echo -e "${BLUE}运行测试: 获取所有任务${NC}"
  response=$(curl -s -w "\n%{http_code}" -X GET $API_URL)
  process_response "$response" "获取所有任务"
  show_response "$response"
}

# 按ID查询任务
test_get_task_by_id() {
  echo -e "${BLUE}运行测试: 按ID查询任务${NC}"

  local task_id
  if [[ $AUTO_MODE == true && -n "$CREATED_TASK_ID" ]]; then
    task_id=$CREATED_TASK_ID
    echo "使用自动创建的任务ID: $task_id"
  else
    read -p "请输入任务ID: " task_id
  fi

  response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/$task_id")
  process_response "$response" "按ID查询任务"
  show_response "$response"
}

# 按状态过滤任务
test_filter_tasks_by_status() {
  echo -e "${BLUE}运行测试: 按状态过滤任务${NC}"
  response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL?status=published")
  process_response "$response" "按状态过滤任务"
  show_response "$response"
}

# 通用任务创建测试函数
run_task_test() {
  local test_name=$1
  local payload=$2
  local expected_codes=$3

  echo -e "${BLUE}运行测试: ${test_name}${NC}"

  if [[ $AUTO_MODE == false ]]; then
    echo "请求数据:"
    echo "$payload" | jq '.'
  fi

  # 发送请求并获取响应
  response=$(curl -s -w "\n%{http_code}" -X POST $API_URL \
    -H "Content-Type: application/json" \
    -d "$payload")

  # 处理响应
  if process_response "$response" "$test_name" "$expected_codes"; then
    # 如果是成功的任务创建，提取任务ID
    if [[ $AUTO_MODE == true && "$test_name" == *"基本听写任务"* ]]; then
      local body=$(echo "$response" | sed '$d')
      CREATED_TASK_ID=$(echo "$body" | jq -r '.data.id' 2>/dev/null)
      if [[ -n "$CREATED_TASK_ID" && "$CREATED_TASK_ID" != "null" ]]; then
        echo "任务ID: $CREATED_TASK_ID"
      fi
    fi
    show_response "$response"
    return 0
  else
    show_response "$response"
    return 1
  fi
}

# 测试场景1: 基本听写任务
test_dictation_task() {
  local class_id="1"
  local status="draft"

  # 自动化模式下使用创建的班级ID和草稿状态
  if [[ $AUTO_MODE == true ]]; then
    class_id="$CREATED_CLASS_ID"  # 确保是字符串类型
    status="draft"
  fi

  local payload=$(cat <<EOF
{
  "title": "单词听写测试",
  "task_type": "dictation",
  "subject": "english",
  "status": "$status",
  "teacher_id": "teacher001",
  "class_id": "$class_id",
  "contents": [
    {
      "content_type": "dictation",
      "points": 100,
      "order_num": 1,
      "selected_word_ids": [1, 2, 3],
      "generate_mode": "manual"
    }
  ]
}
EOF
  )

  run_task_test "基本听写任务" "$payload"
}

# 测试场景2: 句子跟读任务
test_sentence_repeat_task() {
  local class_id="1"

  if [[ $AUTO_MODE == true ]]; then
    class_id="$CREATED_CLASS_ID"  # 确保是字符串类型
  fi

  local payload=$(cat <<EOF
{
  "title": "句子跟读测试",
  "task_type": "sentence_repeat",
  "subject": "english",
  "status": "draft",
  "teacher_id": "teacher001",
  "class_id": "$class_id",
  "contents": [
    {
      "content_type": "sentence_repeat",
      "points": 100,
      "order_num": 1,
      "selected_sentence_ids": [1, 2, 3],
      "generate_mode": "manual"
    }
  ]
}
EOF
  )

  run_task_test "句子跟读任务" "$payload"
}

# 测试场景3: 拼写任务
test_spelling_task() {
  local class_id="1"

  if [[ $AUTO_MODE == true ]]; then
    class_id="$CREATED_CLASS_ID"  # 确保是字符串类型
  fi

  local payload=$(cat <<EOF
{
  "title": "单词拼写测试",
  "task_type": "spelling",
  "subject": "english",
  "status": "published",
  "deadline": "2025-12-31T23:59:59Z",
  "teacher_id": "teacher001",
  "class_id": "$class_id",
  "contents": [
    {
      "content_type": "spelling",
      "points": 100,
      "order_num": 1,
      "selected_word_ids": [1, 2, 3, 4, 5],
      "generate_mode": "manual"
    }
  ]
}
EOF
  )

  run_task_test "拼写任务" "$payload"
}

# 更新任务
test_update_task() {
  echo -e "${BLUE}运行测试: 更新任务${NC}"

  local task_id
  if [[ $AUTO_MODE == true && -n "$CREATED_TASK_ID" ]]; then
    task_id=$CREATED_TASK_ID
    echo "使用自动创建的任务ID: $task_id"
  else
    read -p "请输入要更新的任务ID: " task_id
  fi

  local payload='{
    "title": "更新后的任务标题",
    "status": "published",
    "deadline": "2025-12-31T23:59:59Z"
  }'

  response=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/$task_id" \
    -H "Content-Type: application/json" \
    -d "$payload")

  process_response "$response" "更新任务"
  show_response "$response"
}

# 删除任务
test_delete_task() {
  echo -e "${BLUE}运行测试: 删除任务${NC}"

  local task_id
  if [[ $AUTO_MODE == true && -n "$CREATED_TASK_ID" ]]; then
    task_id=$CREATED_TASK_ID
    echo "使用自动创建的任务ID: $task_id"
  else
    read -p "请输入要删除的任务ID: " task_id
  fi

  response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL/$task_id")
  process_response "$response" "删除任务"
  show_response "$response"
}

# 自动化测试清理函数
auto_cleanup() {
  echo -e "\n${BLUE}清理测试数据${NC}"
  echo "注意: 使用现有班级，无需删除班级数据"
  # 如果有其他需要清理的测试数据，可以在这里添加
  # 例如：删除测试任务、测试提交等
}

# 自动化测试函数
run_auto_tests() {
  echo -e "\n${YELLOW}=== AI-Speak Python FastAPI 任务接口自动化测试 ===${NC}\n"

  local total_tests=0
  local passed_tests=0
  local failed_tests=0

  # 测试1: 设置班级ID
  echo "测试1: 设置班级ID"
  total_tests=$((total_tests + 1))
  if get_existing_class; then
    passed_tests=$((passed_tests + 1))
  else
    failed_tests=$((failed_tests + 1))
    echo "班级ID设置失败，跳过后续测试"
    return
  fi

  # 测试2: 获取所有任务
  echo -e "\n测试2: 获取所有任务"
  total_tests=$((total_tests + 1))
  if test_get_all_tasks; then
    passed_tests=$((passed_tests + 1))
  else
    failed_tests=$((failed_tests + 1))
  fi

  # 测试3: 创建听写任务
  echo -e "\n测试3: 创建听写任务"
  total_tests=$((total_tests + 1))
  if test_dictation_task; then
    passed_tests=$((passed_tests + 1))
  else
    failed_tests=$((failed_tests + 1))
  fi

  # 测试4: 按ID查询任务
  if [[ -n "$CREATED_TASK_ID" ]]; then
    echo -e "\n测试4: 按ID查询任务"
    total_tests=$((total_tests + 1))
    if test_get_task_by_id; then
      passed_tests=$((passed_tests + 1))
    else
      failed_tests=$((failed_tests + 1))
    fi
  fi

  # 测试5: 更新任务
  if [[ -n "$CREATED_TASK_ID" ]]; then
    echo -e "\n测试5: 更新任务"
    total_tests=$((total_tests + 1))
    if test_update_task; then
      passed_tests=$((passed_tests + 1))
    else
      failed_tests=$((failed_tests + 1))
    fi
  fi

  # 测试6: 创建句子跟读任务
  echo -e "\n测试6: 创建句子跟读任务"
  total_tests=$((total_tests + 1))
  if test_sentence_repeat_task; then
    passed_tests=$((passed_tests + 1))
  else
    failed_tests=$((failed_tests + 1))
  fi

  # 测试7: 创建拼写任务
  echo -e "\n测试7: 创建拼写任务"
  total_tests=$((total_tests + 1))
  if test_spelling_task; then
    passed_tests=$((passed_tests + 1))
  else
    failed_tests=$((failed_tests + 1))
  fi

  # 测试8: 按状态过滤任务
  echo -e "\n测试8: 按状态过滤任务"
  total_tests=$((total_tests + 1))
  if test_filter_tasks_by_status; then
    passed_tests=$((passed_tests + 1))
  else
    failed_tests=$((failed_tests + 1))
  fi

  # 测试9: 删除任务
  if [[ -n "$CREATED_TASK_ID" ]]; then
    echo -e "\n测试9: 删除任务"
    total_tests=$((total_tests + 1))
    if test_delete_task; then
      passed_tests=$((passed_tests + 1))
    else
      failed_tests=$((failed_tests + 1))
    fi
  fi

  # 清理测试数据
  auto_cleanup

  # 显示测试结果
  echo -e "\n${YELLOW}=== 测试结果汇总 ===${NC}"
  echo "总测试数: $total_tests"
  echo "成功测试数: $passed_tests"
  echo "失败测试数: $failed_tests"

  if [[ $failed_tests -eq 0 ]]; then
    echo -e "${GREEN}✓ 所有测试通过!${NC}"
  else
    echo -e "${RED}✗ 部分测试失败${NC}"
  fi
}

# 交互式菜单
show_menu() {
  echo -e "\n${YELLOW}=== AI-Speak Python FastAPI 任务接口测试工具 ===${NC}"
  echo -e "API基础URL: $BASE_URL\n"
  echo "1. 获取所有任务"
  echo "2. 按ID查询任务"
  echo "3. 按状态过滤任务"
  echo "4. 创建听写任务"
  echo "5. 创建句子跟读任务"
  echo "6. 创建拼写任务"
  echo "7. 更新任务"
  echo "8. 删除任务"
  echo "9. 运行自动化测试"
  echo "0. 退出"
  echo -e "\n请选择操作 (0-9):"
}

# 主程序
main() {
  # 检查是否为自动化模式
  if [[ "$1" == "auto" ]]; then
    AUTO_MODE=true
    run_auto_tests
    return
  fi

  # 交互式模式
  while true; do
    show_menu
    read -r choice
    case $choice in
      1) test_get_all_tasks ;;
      2) test_get_task_by_id ;;
      3) test_filter_tasks_by_status ;;
      4) test_dictation_task ;;
      5) test_sentence_repeat_task ;;
      6) test_spelling_task ;;
      7) test_update_task ;;
      8) test_delete_task ;;
      9) AUTO_MODE=true; run_auto_tests; AUTO_MODE=false ;;
      0) echo "退出测试工具"; break ;;
      *) echo -e "${RED}无效选择，请重新输入${NC}" ;;
    esac
  done
}

# 运行主程序
main "$@"