#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 设置API基础URL
API_URL="http://localhost:8080/api/v1/tasks"
API_SUBMISSIONS_URL="http://localhost:8080/api/v1"

# 通用响应处理函数
process_response() {
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

# 函数：运行提交测试并显示结果
run_test() {
  local test_name=$1
  local task_id=$2
  local payload=$3
  
  echo -e "${BLUE}运行测试: ${test_name}${NC}"
  echo "请求数据:"
  echo "$payload" | jq '.'
  
  # 发送请求并获取响应
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/$task_id/submissions" \
    -H "Content-Type: application/json" \
    -d "$payload")
  
  process_response "$response"
}

# 测试场景1: 基本提交任务（仅文本）
test_basic_text_submission() {
  read -p "请输入任务ID: " task_id
  read -p "请输入内容ID: " content_id
  
  local payload='{
    "content_id": '"$content_id"',
    "response": "这是我的纯文本答案"
  }'
  
  run_test "基本文本提交" "$task_id" "$payload"
}

# 测试场景2: 单个文件提交
test_single_file_submission() {
  read -p "请输入任务ID: " task_id
  read -p "请输入内容ID: " content_id
  
  local payload='{
    "content_id": '"$content_id"',
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
  
  run_test "单个文件提交" "$task_id" "$payload"
}

# 测试场景3: 单个音频提交
test_single_audio_submission() {
  read -p "请输入任务ID: " task_id
  read -p "请输入内容ID: " content_id
  
  local payload='{
    "content_id": '"$content_id"',
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
  
  run_test "单个音频提交" "$task_id" "$payload"
}

# 测试场景4: 多类型媒体文件提交
test_multiple_media_submission() {
  read -p "请输入任务ID: " task_id
  read -p "请输入内容ID: " content_id
  
  local payload='{
    "content_id": '"$content_id"',
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
  
  run_test "多类型媒体文件提交" "$task_id" "$payload"
}

# 测试场景5: 获取提交详情
test_get_submission() {
  echo -e "${BLUE}运行测试: 获取提交详情${NC}"
  read -p "请输入提交ID: " submission_id
  
  response=$(curl -s -w "\n%{http_code}" -X GET "http://localhost:8080/api/v1/submissions/$submission_id")
  
  process_response "$response"
}

# 测试场景6: 获取任务的所有提交
test_list_submissions() {
  echo -e "${BLUE}运行测试: 获取任务的所有提交${NC}"
  read -p "请输入任务ID: " task_id
  
  response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/$task_id/submissions")
  
  process_response "$response"
}

# 测试场景7: 评分提交
test_grade_submission() {
  echo -e "${BLUE}运行测试: 评分提交${NC}"
  read -p "请输入提交ID: " submission_id
  read -p "请输入评分 (0-100): " score
  read -p "请输入反馈: " feedback
  
  local payload='{
    "score": '"$score"',
    "feedback": "'"$feedback"'"
  }'
  
  echo "请求数据:"
  echo "$payload" | jq '.'
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_SUBMISSIONS_URL/submissions/$submission_id/grade" \
    -H "Content-Type: application/json" \
    -d "$payload")
    
  process_response "$response"
}

# 测试场景8: 获取自动评分的提交
test_auto_graded_submissions() {
  echo -e "${BLUE}运行测试: 获取自动评分的提交${NC}"
  read -p "请输入任务ID: " task_id
  
  response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/$task_id/submissions?auto_graded=true")
  
  process_response "$response"
}


# 显示菜单并获取用户选择
show_menu() {
  echo -e "${BLUE}请选择要运行的测试场景:${NC}"
  echo "1) 基本文本提交"
  echo "2) 单个文件提交"
  echo "3) 单个音频提交"
  echo "4) 多类型媒体文件提交"
  echo "5) 获取提交详情"
  echo "6) 获取任务的所有提交"
  echo "7) 评分提交"
  echo "8) 获取自动评分的提交"
  echo "0) 退出"
  
  read -p "请输入选项 (0-9): " choice
  
  case $choice in
    1) test_basic_text_submission ;;
    2) test_single_file_submission ;;
    3) test_single_audio_submission ;;
    4) test_multiple_media_submission ;;
    5) test_get_submission ;;
    6) test_list_submissions ;;
    7) test_grade_submission ;;
    8) test_auto_graded_submissions ;;
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