#!/bin/bash

# AI-Speak 任务接口综合测试脚本
# 整合了交互式测试和自动化测试功能
# 使用方法：
#   ./test-tasks.sh           # 交互式菜单模式
#   ./test-tasks.sh auto      # 自动化测试模式

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # 无颜色

# 设置API基础URL
BASE_URL="http://localhost:8080/api/v1"
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

# 自动化模式下创建班级的函数
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
    # 从响应中提取班级ID (注意API返回的是大写的ID字段)
    local body=$(echo "$response" | sed '$d')
    CREATED_CLASS_ID=$(echo "$body" | grep -o '"ID":[0-9]*' | cut -d':' -f2)
    if [[ -n "$CREATED_CLASS_ID" ]]; then
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
      CREATED_TASK_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
      if [[ -n "$CREATED_TASK_ID" ]]; then
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
    class_id=$CREATED_CLASS_ID
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
    class_id=$CREATED_CLASS_ID
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
  local payload='{
    "title": "单词拼写测试",
    "task_type": "spelling",
    "subject": "english",
    "status": "published",
    "deadline": "2025-12-31T23:59:59Z",
    "teacher_id": "teacher001",
    "class_id": "1",
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

  run_task_test "拼写任务" "$payload"
}

# 测试场景4: 综合测验任务
test_quiz_task() {
  local payload='{
    "title": "综合测验",
    "task_type": "quiz",
    "subject": "english",
    "status": "published",
    "deadline": "2025-12-31T23:59:59Z",
    "teacher_id": "teacher001",
    "class_id": "1",
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

  run_task_test "综合测验任务" "$payload"
}

# 测试场景5: 草稿状态任务（不需要截止时间）
test_draft_task() {
  local payload='{
    "title": "草稿状态任务",
    "task_type": "dictation",
    "subject": "english",
    "status": "draft",
    "teacher_id": "teacher001",
    "class_id": "1",
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

  run_task_test "草稿状态任务" "$payload"
}

# 测试场景6: 自动生成模式
test_auto_generate_task() {
  local payload='{
    "title": "自动生成听写任务",
    "task_type": "dictation",
    "subject": "english",
    "status": "published",
    "deadline": "2025-12-31T23:59:59Z",
    "teacher_id": "teacher001",
    "class_id": "1",
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

  run_task_test "自动生成模式" "$payload"
}

# 新增验证测试场景
# 测试场景7: 验证测试 - 缺少必填字段
test_validation_missing_fields() {
  echo -e "${BLUE}运行测试: 验证测试 - 缺少必填字段${NC}"

  # 缺少标题
  echo -e "${YELLOW}测试: 缺少标题${NC}"
  local payload1=$(cat <<EOF
{
  "task_type": "dictation",
  "subject": "english",
  "teacher_id": "teacher001",
  "class_id": "1",
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
  run_task_test "缺少标题" "$payload1" "400"

  # 缺少teacher_id
  echo -e "${YELLOW}测试: 缺少teacher_id${NC}"
  local payload2=$(cat <<EOF
{
  "title": "测试任务",
  "task_type": "dictation",
  "subject": "english",
  "class_id": "1",
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
  run_task_test "缺少teacher_id" "$payload2" "400"

  # 缺少class_id
  echo -e "${YELLOW}测试: 缺少class_id${NC}"
  local payload3=$(cat <<EOF
{
  "title": "测试任务",
  "task_type": "dictation",
  "subject": "english",
  "teacher_id": "teacher001",
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
  run_task_test "缺少class_id" "$payload3" "400"
}

# 测试场景8: 验证测试 - 无效字段值
test_validation_invalid_values() {
  echo -e "${BLUE}运行测试: 验证测试 - 无效字段值${NC}"

  # 标题过长
  echo -e "${YELLOW}测试: 标题过长${NC}"
  local long_title=$(printf 'a%.0s' {1..101})
  local payload1=$(cat <<EOF
{
  "title": "$long_title",
  "task_type": "dictation",
  "subject": "english",
  "teacher_id": "teacher001",
  "class_id": "1",
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
  run_task_test "标题过长" "$payload1" "400"

  # 无效任务类型
  echo -e "${YELLOW}测试: 无效任务类型${NC}"
  local payload2='{
    "title": "测试任务",
    "task_type": "invalid_type",
    "subject": "english",
    "teacher_id": "teacher001",
    "class_id": "1",
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
  run_task_test "无效任务类型" "$payload2" "400"

  # 内容分值不等于100
  echo -e "${YELLOW}测试: 内容分值不等于100${NC}"
  local payload3='{
    "title": "测试任务",
    "task_type": "dictation",
    "subject": "english",
    "teacher_id": "teacher001",
    "class_id": "1",
    "contents": [
      {
        "content_type": "dictation",
        "points": 80,
        "order_num": 1,
        "selected_word_ids": [1, 2, 3],
        "generate_mode": "manual"
      }
    ]
  }'
  run_task_test "内容分值不等于100" "$payload3" "400"
}

# 测试场景9: 验证测试 - 任务类型和内容类型不匹配
test_validation_type_mismatch() {
  echo -e "${BLUE}运行测试: 验证测试 - 任务类型和内容类型不匹配${NC}"

  local payload='{
    "title": "类型不匹配测试",
    "task_type": "dictation",
    "subject": "english",
    "teacher_id": "teacher001",
    "class_id": "1",
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

  run_task_test "任务类型和内容类型不匹配" "$payload" "400"
}

# 测试场景10: 验证测试 - 已发布任务缺少截止时间
test_validation_published_no_deadline() {
  echo -e "${BLUE}运行测试: 验证测试 - 已发布任务缺少截止时间${NC}"

  local payload='{
    "title": "已发布任务无截止时间",
    "task_type": "dictation",
    "subject": "english",
    "status": "published",
    "teacher_id": "teacher001",
    "class_id": "1",
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

  run_task_test "已发布任务缺少截止时间" "$payload" "400"
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

# 提交测试场景
test_submit_task() {
  echo -e "${BLUE}运行测试: 提交任务${NC}"

  local task_id
  local content_id="1"
  local response_text="测试回答"

  if [[ $AUTO_MODE == true && -n "$CREATED_TASK_ID" ]]; then
    task_id=$CREATED_TASK_ID
    echo "使用自动创建的任务ID: $task_id"
  else
    read -p "请输入任务ID: " task_id
    read -p "请输入内容ID: " content_id
    read -p "请输入回答内容: " response_text
  fi

  payload=$(cat <<EOF
{
  "content_id": $content_id,
  "response": "$response_text",
  "media_files": [
    {
      "url": "https://example.com/audio.mp3",
      "type": "audio",
      "name": "recording.mp3"
    }
  ]
}
EOF
  )

  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/$task_id/submissions" \
    -H "Content-Type: application/json" \
    -d "$payload")

  process_response "$response" "提交任务"
  show_response "$response"

  # 自动化模式下提取提交ID
  if [[ $AUTO_MODE == true ]]; then
    local body=$(echo "$response" | sed '$d')
    CREATED_SUBMISSION_ID=$(echo "$body" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    if [[ -n "$CREATED_SUBMISSION_ID" ]]; then
      echo "提交ID: $CREATED_SUBMISSION_ID"
    fi
  fi
}

# 评分测试场景
test_grade_submission() {
  echo -e "${BLUE}运行测试: 评分提交${NC}"

  local submission_id
  local score="85.5"
  local feedback="很好！单词拼写正确，发音清晰。"

  if [[ $AUTO_MODE == true && -n "$CREATED_SUBMISSION_ID" ]]; then
    submission_id=$CREATED_SUBMISSION_ID
    echo "使用自动创建的提交ID: $submission_id"
  else
    read -p "请输入提交ID: " submission_id
    read -p "请输入分数 (0-100): " score
    read -p "请输入反馈: " feedback
  fi

  payload=$(cat <<EOF
{
  "score": $score,
  "feedback": "$feedback"
}
EOF
  )

  response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/submissions/$submission_id/grade" \
    -H "Content-Type: application/json" \
    -d "$payload")

  process_response "$response" "评分提交"
  show_response "$response"
}

# 显示菜单并获取用户选择
show_menu() {
  echo -e "${BLUE}请选择要运行的测试场景:${NC}"
  echo "1) 运行所有基本测试"
  echo "2) 运行所有验证测试"
  echo "3) 获取所有任务"
  echo "4) 按ID查询任务"
  echo "5) 按状态过滤任务"
  echo "6) 更新任务"
  echo "7) 删除任务"
  echo "8) 提交任务"
  echo "9) 评分提交"
  echo "0) 退出"

  read -p "请输入选项 (0-9): " choice

  case $choice in
    1)
      echo -e "${YELLOW}运行所有基本测试...${NC}"
      test_dictation_task
      test_sentence_repeat_task
      test_spelling_task
      test_quiz_task
      test_draft_task
      test_auto_generate_task
      ;;
    2)
      echo -e "${YELLOW}运行所有验证测试...${NC}"
      test_validation_missing_fields
      test_validation_invalid_values
      test_validation_type_mismatch
      test_validation_published_no_deadline
      ;;
    3) test_get_all_tasks ;;
    4) test_get_task_by_id ;;
    5) test_filter_tasks_by_status ;;
    6) test_update_task ;;
    7) test_delete_task ;;
    8) test_submit_task ;;
    9) test_grade_submission ;;
    0) exit 0 ;;
    *) echo -e "${RED}无效选项，请重新选择${NC}" ;;
  esac
  show_menu
}

# 自动化测试模式 - 运行完整的端到端测试
run_auto_tests() {
  echo -e "${BLUE}=== AI-Speak 任务接口自动化测试 ===${NC}"

  local test_count=0
  local success_count=0

  # 测试1: 获取所有任务
  echo -e "\n${BLUE}测试1: 获取所有任务${NC}"
  test_get_all_tasks && ((success_count++))
  ((test_count++))

  # 测试2: 创建班级（任务创建的前置条件）
  echo -e "\n${BLUE}测试2: 创建班级${NC}"
  auto_create_class && ((success_count++))
  ((test_count++))

  # 如果班级创建成功，继续后续测试
  if [[ -n "$CREATED_CLASS_ID" ]]; then
    # 测试3: 运行所有基本测试
    echo -e "\n${BLUE}测试3: 运行所有基本测试${NC}"
    local basic_tests_success=true
    test_dictation_task || basic_tests_success=false
    test_sentence_repeat_task || basic_tests_success=false
    test_spelling_task || basic_tests_success=false
    test_quiz_task || basic_tests_success=false
    test_draft_task || basic_tests_success=false
    test_auto_generate_task || basic_tests_success=false

    if [[ $basic_tests_success == true ]]; then
      ((success_count++))
    fi
    ((test_count++))

    # 测试4: 运行所有验证测试
    echo -e "\n${BLUE}测试4: 运行所有验证测试${NC}"
    local validation_tests_success=true
    test_validation_missing_fields || validation_tests_success=false
    test_validation_invalid_values || validation_tests_success=false
    test_validation_type_mismatch || validation_tests_success=false
    test_validation_published_no_deadline || validation_tests_success=false

    if [[ $validation_tests_success == true ]]; then
      ((success_count++))
    fi
    ((test_count++))

    # 如果任务创建成功，继续后续测试
    if [[ -n "$CREATED_TASK_ID" ]]; then
      # 测试5: 按ID查询任务
      echo -e "\n${BLUE}测试5: 按ID查询任务${NC}"
      test_get_task_by_id && ((success_count++))
      ((test_count++))

      # 测试6: 按状态过滤任务
      echo -e "\n${BLUE}测试6: 按状态过滤任务${NC}"
      test_filter_tasks_by_status && ((success_count++))
      ((test_count++))

      # 测试7: 提交任务
      echo -e "\n${BLUE}测试7: 提交任务${NC}"
      test_submit_task && ((success_count++))
      ((test_count++))

      # 如果提交成功，进行评分测试
      if [[ -n "$CREATED_SUBMISSION_ID" ]]; then
        # 测试8: 评分提交
        echo -e "\n${BLUE}测试8: 评分提交${NC}"
        test_grade_submission && ((success_count++))
        ((test_count++))
      fi
    fi
  fi

  # 显示测试结果摘要
  echo -e "\n${BLUE}=== 测试完成 ===${NC}"
  echo -e "总测试数: $test_count"
  echo -e "成功测试数: $success_count"
  echo -e "失败测试数: $((test_count - success_count))"

  if [[ $success_count -eq $test_count ]]; then
    echo -e "${GREEN}✓ 所有测试通过！${NC}"
  else
    echo -e "${RED}✗ 部分测试失败${NC}"
  fi
}



# 检查jq是否安装
check_dependencies() {
  if ! command -v jq &> /dev/null; then
    echo -e "${RED}错误: 需要安装jq来格式化JSON输出${NC}"
    echo "请运行: brew install jq"
    exit 1
  fi
}

# 主函数
main() {
  check_dependencies

  # 检查命令行参数
  if [[ "$1" == "auto" ]]; then
    AUTO_MODE=true
    run_auto_tests
  elif [[ "$1" =~ ^[0-9]+$ ]]; then
    AUTO_MODE=false
    case $1 in
      1)
        test_dictation_task
        test_sentence_repeat_task
        test_spelling_task
        test_quiz_task
        test_draft_task
        test_auto_generate_task
        ;;
      2)
        test_validation_missing_fields
        test_validation_invalid_values
        test_validation_type_mismatch
        test_validation_published_no_deadline
        ;;
      3) test_get_all_tasks ;;
      4) test_get_task_by_id ;;
      5) test_filter_tasks_by_status ;;
      6) test_update_task ;;
      7) test_delete_task ;;
      8) test_submit_task ;;
      9) test_grade_submission ;;
      *) echo "无效测试编号: $1" && exit 1 ;;
    esac
  else
    AUTO_MODE=false
    show_menu
  fi
}

# 启动脚本
main "$@"