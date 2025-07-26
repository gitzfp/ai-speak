#!/bin/bash

# AI-Speak Python FastAPI 提交接口综合测试脚本
# 基于Go版本的test-submissions.sh修改，适配Python FastAPI接口
# 使用方法：
#   ./test-submissions-python.sh           # 交互式菜单模式
#   ./test-submissions-python.sh auto      # 自动化测试模式

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # 无颜色

# 设置API基础URL - 修改为Python FastAPI的端口
BASE_URL="http://localhost:8097/api/v1"
API_URL="$BASE_URL/tasks"
API_SUBMISSIONS_URL="$BASE_URL"

# 全局变量
AUTO_MODE=false
CREATED_TASK_ID=""
CREATED_SUBMISSION_ID=""
CREATED_CLASS_ID=""

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

# 函数：运行提交测试并显示结果
run_test() {
  local test_name=$1
  local task_id=$2
  local payload=$3
  local expected_codes=$4
  
  echo -e "${BLUE}运行测试: ${test_name}${NC}"
  
  if [[ $AUTO_MODE == false ]]; then
    echo "请求数据:"
    echo "$payload" | jq '.'
  fi
  
  # 发送请求并获取响应
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/$task_id/submissions" \
    -H "Content-Type: application/json" \
    -d "$payload")
  
  if process_response "$response" "$test_name" "$expected_codes"; then
    # 如果是成功的提交创建，提取提交ID
    if [[ $AUTO_MODE == true && "$test_name" == *"提交"* ]]; then
      local body=$(echo "$response" | sed '$d')
      CREATED_SUBMISSION_ID=$(echo "$body" | grep -o '"id":[0-9]*' | cut -d':' -f2)
      if [[ -n "$CREATED_SUBMISSION_ID" ]]; then
        echo "创建的提交ID: $CREATED_SUBMISSION_ID"
      fi
    fi
    show_response "$response"
    return 0
  else
    show_response "$response"
    return 1
  fi
}

# 获取现有班级的函数（Python API没有班级列表端点，使用默认值）
get_existing_class() {
  echo -e "\n${BLUE}设置班级ID${NC}"
  # Python API没有获取班级列表的端点，直接使用默认值
  CREATED_CLASS_ID="1"
  echo "使用默认班级ID: $CREATED_CLASS_ID"
  echo "注意: Python API暂不支持获取班级列表，使用默认班级ID"
  return 0
}

# 获取现有任务的函数
get_existing_task() {
  echo -e "\n${BLUE}获取现有任务列表${NC}"
  # Python API的任务列表需要查询参数，尝试获取第一页
  response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL?page=1&page_size=10")

  if process_response "$response" "获取任务列表" "200"; then
    local body=$(echo "$response" | sed '$d')
    # 尝试从data.items中获取第一个任务的ID
    CREATED_TASK_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    if [[ -n "$CREATED_TASK_ID" ]]; then
      echo "使用现有任务ID: $CREATED_TASK_ID"
    else
      echo "警告: 未找到现有任务，使用默认值"
      CREATED_TASK_ID="1"
    fi
    if [[ $AUTO_MODE == false ]]; then
      show_response "$response"
    fi
    return 0
  else
    echo "获取任务失败，使用默认任务ID: 1"
    CREATED_TASK_ID="1"
    return 0
  fi
}

# 测试场景1: 基本提交任务（仅文本）
test_basic_text_submission() {
  if [[ $AUTO_MODE == true ]]; then
    local task_id=$CREATED_TASK_ID
    local content_id="1"
  else
    read -p "请输入任务ID: " task_id
    read -p "请输入内容ID: " content_id
  fi
  
  local payload='{
    "content_id": '$content_id',
    "response": "这是我的纯文本答案"
  }'
  
  run_test "基本文本提交" "$task_id" "$payload" "200,201"
}

# 测试场景2: 单个文件提交
test_single_file_submission() {
  if [[ $AUTO_MODE == true ]]; then
    local task_id=$CREATED_TASK_ID
    local content_id="1"
  else
    read -p "请输入任务ID: " task_id
    read -p "请输入内容ID: " content_id
  fi
  
  local payload='{
    "content_id": '$content_id',
    "response": "这是我的提交，附带一个文件",
    "media_files": [
      {
        "url": "https://example.com/files/document1.pdf",
        "type": "file",
        "name": "作业文档.pdf",
        "mime_type": "application/pdf"
      }
    ]
  }'
  
  run_test "单个文件提交" "$task_id" "$payload" "200,201"
}

# 测试场景3: 单个音频提交
test_single_audio_submission() {
  if [[ $AUTO_MODE == true ]]; then
    local task_id=$CREATED_TASK_ID
    local content_id="1"
  else
    read -p "请输入任务ID: " task_id
    read -p "请输入内容ID: " content_id
  fi
  
  local payload='{
    "content_id": '$content_id',
    "response": "这是我的音频提交",
    "media_files": [
      {
        "url": "https://example.com/audio/recording1.mp3",
        "type": "audio",
        "name": "英语朗读.mp3",
        "mime_type": "audio/mpeg"
      }
    ]
  }'
  
  run_test "单个音频提交" "$task_id" "$payload" "200,201"
}

# 测试场景4: 多个文件提交
test_multiple_files_submission() {
  if [[ $AUTO_MODE == true ]]; then
    local task_id=$CREATED_TASK_ID
    local content_id="1"
  else
    read -p "请输入任务ID: " task_id
    read -p "请输入内容ID: " content_id
  fi
  
  local payload='{
    "content_id": '$content_id',
    "response": "这是我的多文件提交",
    "media_files": [
      {
        "url": "https://example.com/files/document1.pdf",
        "type": "file",
        "name": "作业文档.pdf",
        "mime_type": "application/pdf"
      },
      {
        "url": "https://example.com/audio/recording1.mp3",
        "type": "audio",
        "name": "英语朗读.mp3",
        "mime_type": "audio/mpeg"
      },
      {
        "url": "https://example.com/images/screenshot.png",
        "type": "image",
        "name": "截图.png",
        "mime_type": "image/png"
      }
    ]
  }'
  
  run_test "多个文件提交" "$task_id" "$payload" "200,201"
}

# 测试场景5: 多类型媒体文件提交（与Go版本对应）
test_multiple_media_submission() {
  if [[ $AUTO_MODE == true ]]; then
    local task_id=$CREATED_TASK_ID
    local content_id="1"
  else
    read -p "请输入任务ID: " task_id
    read -p "请输入内容ID: " content_id
  fi
  
  local payload='{
    "content_id": '$content_id',
    "response": "这是包含多种类型文件的提交",
    "media_files": [
      {
        "url": "https://example.com/audio/recording1.mp3",
        "type": "audio",
        "name": "英语朗读1.mp3",
        "mime_type": "audio/mpeg"
      },
      {
        "url": "https://example.com/audio/recording2.mp3",
        "type": "audio",
        "name": "英语朗读2.mp3",
        "mime_type": "audio/mpeg"
      },
      {
        "url": "https://example.com/images/homework1.jpg",
        "type": "image",
        "name": "作业照片1.jpg",
        "mime_type": "image/jpeg"
      },
      {
        "url": "https://example.com/images/homework2.jpg",
        "type": "image",
        "name": "作业照片2.jpg",
        "mime_type": "image/jpeg"
      },
      {
        "url": "https://example.com/files/document1.pdf",
        "type": "file",
        "name": "英语作文.pdf",
        "mime_type": "application/pdf"
      }
    ]
  }'
  
  run_test "多类型媒体文件提交" "$task_id" "$payload" "200,201"
}

# 测试场景6: 混合内容提交
test_mixed_content_submission() {
  if [[ $AUTO_MODE == true ]]; then
    local task_id=$CREATED_TASK_ID
    local content_id="1"
  else
    read -p "请输入任务ID: " task_id
    read -p "请输入内容ID: " content_id
  fi
  
  local payload='{
    "content_id": '$content_id',
    "response": "这是一个包含文本、音频和图片的综合提交。我已经完成了所有要求的任务内容。",
    "media_files": [
      {
        "url": "https://example.com/audio/pronunciation.wav",
        "type": "audio",
        "name": "发音练习.wav",
        "size": 1024000,
        "mime_type": "audio/wav"
      },
      {
        "url": "https://example.com/images/homework.jpg",
        "type": "image",
        "name": "作业照片.jpg",
        "size": 512000,
        "mime_type": "image/jpeg"
      }
    ]
  }'
  
  run_test "混合内容提交" "$task_id" "$payload" "200,201"
}

# 测试场景6: 无效数据提交（测试错误处理）
test_invalid_submission() {
  if [[ $AUTO_MODE == true ]]; then
    local task_id=$CREATED_TASK_ID
  else
    read -p "请输入任务ID: " task_id
  fi
  
  local payload='{
    "content_id": "invalid_id",
    "response": ""
  }'
  
  run_test "无效数据提交" "$task_id" "$payload" "400,422"
}

# 测试场景7: 空提交
test_empty_submission() {
  if [[ $AUTO_MODE == true ]]; then
    local task_id=$CREATED_TASK_ID
  else
    read -p "请输入任务ID: " task_id
  fi
  
  local payload='{}'
  
  run_test "空提交" "$task_id" "$payload" "400,422"
}

# 获取提交详情
test_get_submission() {
  if [[ $AUTO_MODE == true ]]; then
    local submission_id=$CREATED_SUBMISSION_ID
  else
    read -p "请输入提交ID: " submission_id
  fi
  
  if [[ -z "$submission_id" ]]; then
    echo -e "${RED}错误: 提交ID不能为空${NC}"
    return 1
  fi
  
  echo -e "${BLUE}运行测试: 获取提交详情${NC}"
  
  response=$(curl -s -w "\n%{http_code}" -X GET "$API_SUBMISSIONS_URL/submissions/$submission_id")
  
  process_response "$response" "获取提交详情" "200"
  show_response "$response"
}

# 评分提交
test_grade_submission() {
  if [[ $AUTO_MODE == true ]]; then
    local submission_id=$CREATED_SUBMISSION_ID
  else
    read -p "请输入提交ID: " submission_id
  fi
  
  if [[ -z "$submission_id" ]]; then
    echo -e "${RED}错误: 提交ID不能为空${NC}"
    return 1
  fi
  
  local payload='{
    "score": 85,
    "feedback": "很好的提交！发音清晰，但需要注意语调。"
  }'
  
  echo -e "${BLUE}运行测试: 评分提交${NC}"
  
  if [[ $AUTO_MODE == false ]]; then
    echo "请求数据:"
    echo "$payload" | jq '.'
  fi
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_SUBMISSIONS_URL/submissions/$submission_id/grade" \
    -H "Content-Type: application/json" \
    -d "$payload")
  
  process_response "$response" "评分提交" "200"
  show_response "$response"
}

# 获取任务的所有提交
test_list_task_submissions() {
  if [[ $AUTO_MODE == true ]]; then
    local task_id=$CREATED_TASK_ID
  else
    read -p "请输入任务ID: " task_id
  fi
  
  if [[ -z "$task_id" ]]; then
    echo -e "${RED}错误: 任务ID不能为空${NC}"
    return 1
  fi
  
  echo -e "${BLUE}运行测试: 获取任务提交列表${NC}"
  
  response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/$task_id/submissions")
  
  process_response "$response" "获取任务提交列表" "200"
  show_response "$response"
}

# 获取自动评分的提交
test_auto_graded_submissions() {
  if [[ $AUTO_MODE == true ]]; then
    local task_id=$CREATED_TASK_ID
  else
    read -p "请输入任务ID: " task_id
  fi
  
  if [[ -z "$task_id" ]]; then
    echo -e "${RED}错误: 任务ID不能为空${NC}"
    return 1
  fi
  
  echo -e "${BLUE}运行测试: 获取自动评分的提交${NC}"
  
  response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/$task_id/submissions?auto_graded=true")
  
  process_response "$response" "获取自动评分的提交" "200"
  show_response "$response"
}

# 自动化测试模式
run_auto_tests() {
  echo -e "${YELLOW}开始自动化提交测试...${NC}\n"
  
  # 获取现有测试数据
  get_existing_class
  get_existing_task
  
  # 运行所有提交测试
  echo -e "\n${YELLOW}=== 开始提交测试 ===${NC}"
  
  test_basic_text_submission
  sleep 1
  
  test_single_file_submission
  sleep 1
  
  test_single_audio_submission
  sleep 1
  
  test_multiple_files_submission
  sleep 1
  
  test_multiple_media_submission
  sleep 1
  
  test_mixed_content_submission
  sleep 1
  
  # 测试错误情况
  echo -e "\n${YELLOW}=== 开始错误处理测试 ===${NC}"
  
  test_invalid_submission
  sleep 1
  
  test_empty_submission
  sleep 1
  
  # 测试提交管理功能
  if [[ -n "$CREATED_SUBMISSION_ID" ]]; then
    echo -e "\n${YELLOW}=== 开始提交管理测试 ===${NC}"
    
    test_get_submission
    sleep 1
    
    test_grade_submission
    sleep 1
  fi
  
  test_list_task_submissions
  test_auto_graded_submissions
  
  echo -e "\n${GREEN}自动化测试完成！${NC}"
}

# 显示菜单
show_menu() {
  echo -e "${BLUE}=== AI-Speak Python FastAPI 提交接口测试 ===${NC}"
  echo "1. 基本文本提交"
  echo "2. 单个文件提交"
  echo "3. 单个音频提交"
  echo "4. 多个文件提交"
  echo "5. 多类型媒体文件提交"
  echo "6. 混合内容提交"
  echo "7. 无效数据提交（错误测试）"
  echo "8. 空提交（错误测试）"
  echo "9. 获取提交详情"
  echo "10. 评分提交"
  echo "11. 获取任务提交列表"
  echo "12. 获取自动评分的提交"
  echo "13. 查看现有班级和任务"
  echo "14. 运行所有测试（自动化）"
  echo "0. 退出"
  echo -e "${NC}"
}

# 主函数
main() {
  # 检查是否为自动化模式
  if [[ "$1" == "auto" ]]; then
    AUTO_MODE=true
    run_auto_tests
    return
  fi
  
  while true; do
    show_menu
    read -p "请选择测试选项 (0-14): " choice
    
    case $choice in
      1) test_basic_text_submission ;;
      2) test_single_file_submission ;;
      3) test_single_audio_submission ;;
      4) test_multiple_files_submission ;;
      5) test_multiple_media_submission ;;
      6) test_mixed_content_submission ;;
      7) test_invalid_submission ;;
      8) test_empty_submission ;;
      9) test_get_submission ;;
      10) test_grade_submission ;;
      11) test_list_task_submissions ;;
      12) test_auto_graded_submissions ;;
      13) 
          echo -e "${BLUE}查看现有班级和任务${NC}"
          get_existing_class
          get_existing_task
          ;;
      14) 
          AUTO_MODE=true
          run_auto_tests
          AUTO_MODE=false
          ;;
      0) 
        echo -e "${GREEN}测试结束，再见！${NC}"
        exit 0
        ;;
      *) 
        echo -e "${RED}无效选项，请重新选择${NC}"
        ;;
    esac
    
    echo
    read -p "按回车键继续..."
    clear
  done
}

# 运行主函数
main "$@"