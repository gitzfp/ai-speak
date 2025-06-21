#!/bin/bash

# AI-Speak Python FastAPI 班级接口测试脚本
# 基于Go版本的测试脚本修改，适配Python FastAPI接口
# 使用方法：
#   ./test-classes-python.sh           # 交互式菜单模式
#   ./test-classes-python.sh auto      # 自动化测试模式

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # 无颜色

# 设置API基础URL - 修改为Python FastAPI的端口
BASE_URL="http://localhost:8000/api/v1"
API_URL="$BASE_URL/classes"

# 全局变量
AUTO_MODE=false
CREATED_CLASS_ID=""
CREATED_TEACHER_ID="teacher001"
CREATED_STUDENT_ID="student001"

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

# 函数：运行测试并显示结果
run_test() {
  local test_name=$1
  local method=$2
  local url=$3
  local payload=$4
  local expected_codes=$5
  
  echo -e "${BLUE}运行测试: ${test_name}${NC}"
  
  if [[ $AUTO_MODE == false && -n "$payload" ]]; then
    echo "请求数据:"
    echo "$payload" | jq '.'
  fi
  
  # 发送请求并获取响应
  if [[ -n "$payload" ]]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" \
      -d "$payload")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
  fi
  
  if process_response "$response" "$test_name" "$expected_codes"; then
    # 如果是成功的班级创建，提取班级ID - 适配Python API响应格式
    if [[ $AUTO_MODE == true && "$test_name" == *"创建班级"* ]]; then
      local body=$(echo "$response" | sed '$d')
      # Python API返回的是data.id格式
      CREATED_CLASS_ID=$(echo "$body" | jq -r '.data.id' 2>/dev/null)
      if [[ -n "$CREATED_CLASS_ID" && "$CREATED_CLASS_ID" != "null" ]]; then
        echo "创建的班级ID: $CREATED_CLASS_ID"
      fi
    fi
    show_response "$response"
    return 0
  else
    show_response "$response"
    return 1
  fi
}

# 测试场景1: 创建班级
test_create_class() {
  echo -e "${BLUE}运行测试: 创建班级${NC}"
  
  local class_name="测试班级"
  local grade_level="三年级"
  local subject="english"
  local teacher_id="teacher001"
  local description="用于测试的班级"
  local max_students=30
  
  if [[ $AUTO_MODE == false ]]; then
    read -p "请输入班级名称 (默认: $class_name): " input_name
    [[ -n "$input_name" ]] && class_name="$input_name"
    
    read -p "请输入年级 (默认: $grade_level): " input_grade
    [[ -n "$input_grade" ]] && grade_level="$input_grade"
    
    read -p "请输入科目 (默认: $subject): " input_subject
    [[ -n "$input_subject" ]] && subject="$input_subject"
    
    read -p "请输入教师ID (默认: $teacher_id): " input_teacher
    [[ -n "$input_teacher" ]] && teacher_id="$input_teacher"
    
    read -p "请输入班级描述 (默认: $description): " input_desc
    [[ -n "$input_desc" ]] && description="$input_desc"
    
    read -p "请输入最大学生数 (默认: $max_students): " input_max
    [[ -n "$input_max" ]] && max_students="$input_max"
  fi
  
  local payload=$(cat <<EOF
{
  "name": "$class_name",
  "grade_level": "$grade_level",
  "subject": "$subject",
  "teacher_id": "$teacher_id",
  "description": "$description",
  "max_students": $max_students
}
EOF
  )
  
  run_test "创建班级" "POST" "$API_URL" "$payload" "200,201"
}

# 测试场景2: 获取班级信息
test_get_class() {
  echo -e "${BLUE}运行测试: 获取班级信息${NC}"
  
  local class_id
  if [[ $AUTO_MODE == true && -n "$CREATED_CLASS_ID" ]]; then
    class_id=$CREATED_CLASS_ID
    echo "使用自动创建的班级ID: $class_id"
  else
    read -p "请输入班级ID: " class_id
  fi
  
  run_test "获取班级信息" "GET" "$API_URL/$class_id" "" "200"
}

# 测试场景3: 更新班级信息
test_update_class() {
  echo -e "${BLUE}运行测试: 更新班级信息${NC}"
  
  local class_id
  local new_name="更新后的班级名称"
  local new_description="更新后的班级描述"
  
  if [[ $AUTO_MODE == true && -n "$CREATED_CLASS_ID" ]]; then
    class_id=$CREATED_CLASS_ID
    echo "使用自动创建的班级ID: $class_id"
  else
    read -p "请输入班级ID: " class_id
    read -p "请输入新的班级名称 (默认: $new_name): " input_name
    [[ -n "$input_name" ]] && new_name="$input_name"
    read -p "请输入新的班级描述 (默认: $new_description): " input_desc
    [[ -n "$input_desc" ]] && new_description="$input_desc"
  fi
  
  local payload=$(cat <<EOF
{
  "name": "$new_name",
  "description": "$new_description"
}
EOF
  )
  
  run_test "更新班级信息" "PUT" "$API_URL/$class_id" "$payload" "200"
}

# 测试场景4: 添加学生到班级
test_add_student() {
  echo -e "${BLUE}运行测试: 添加学生到班级${NC}"
  
  local class_id
  local student_id="student001"
  
  if [[ $AUTO_MODE == true && -n "$CREATED_CLASS_ID" ]]; then
    class_id=$CREATED_CLASS_ID
    echo "使用自动创建的班级ID: $class_id"
  else
    read -p "请输入班级ID: " class_id
    read -p "请输入学生ID (默认: $student_id): " input_student
    [[ -n "$input_student" ]] && student_id="$input_student"
  fi
  
  local payload=$(cat <<EOF
{
  "student_id": "$student_id"
}
EOF
  )
  
  run_test "添加学生到班级" "POST" "$API_URL/$class_id/students" "$payload" "200,201"
}

# 测试场景5: 移除班级学生
test_remove_student() {
  echo -e "${BLUE}运行测试: 移除班级学生${NC}"
  
  local class_id
  local student_id="student001"
  
  if [[ $AUTO_MODE == true && -n "$CREATED_CLASS_ID" ]]; then
    class_id=$CREATED_CLASS_ID
    echo "使用自动创建的班级ID: $class_id"
  else
    read -p "请输入班级ID: " class_id
    read -p "请输入要移除的学生ID (默认: $student_id): " input_student
    [[ -n "$input_student" ]] && student_id="$input_student"
  fi
  
  run_test "移除班级学生" "DELETE" "$API_URL/$class_id/students/$student_id" "" "200,204"
}

# 测试场景6: 添加教师到班级
test_add_teacher() {
  echo -e "${BLUE}运行测试: 添加教师到班级${NC}"
  
  local class_id
  local teacher_id="teacher002"
  local role="teacher"
  
  if [[ $AUTO_MODE == true && -n "$CREATED_CLASS_ID" ]]; then
    class_id=$CREATED_CLASS_ID
    echo "使用自动创建的班级ID: $class_id"
  else
    read -p "请输入班级ID: " class_id
    read -p "请输入教师ID (默认: $teacher_id): " input_teacher
    [[ -n "$input_teacher" ]] && teacher_id="$input_teacher"
  fi
  
  local payload=$(cat <<EOF
{
  "teacher_id": "$teacher_id",
  "role": "$role"
}
EOF
  )
  
  run_test "添加教师到班级" "POST" "$API_URL/$class_id/teachers" "$payload" "200,201"
}

# 测试场景7: 移除班级教师
test_remove_teacher() {
  echo -e "${BLUE}运行测试: 移除班级教师${NC}"
  
  local class_id
  local teacher_id="teacher002"
  
  if [[ $AUTO_MODE == true && -n "$CREATED_CLASS_ID" ]]; then
    class_id=$CREATED_CLASS_ID
    echo "使用自动创建的班级ID: $class_id"
  else
    read -p "请输入班级ID: " class_id
    read -p "请输入要移除的教师ID (默认: $teacher_id): " input_teacher
    [[ -n "$input_teacher" ]] && teacher_id="$input_teacher"
  fi
  
  run_test "移除班级教师" "DELETE" "$API_URL/$class_id/teachers/$teacher_id" "" "200,204"
}

# 测试场景8: 删除班级
test_delete_class() {
  echo -e "${BLUE}运行测试: 删除班级${NC}"
  
  local class_id
  if [[ $AUTO_MODE == true && -n "$CREATED_CLASS_ID" ]]; then
    class_id=$CREATED_CLASS_ID
    echo "使用自动创建的班级ID: $class_id"
  else
    read -p "请输入要删除的班级ID: " class_id
  fi
  
  run_test "删除班级" "DELETE" "$API_URL/$class_id" "" "200,204"
}

# 自动化测试模式 - 运行完整的端到端测试
run_auto_tests() {
  echo -e "${BLUE}=== AI-Speak Python FastAPI 班级接口自动化测试 ===${NC}"
  
  local test_count=0
  local success_count=0
  
  # 测试1: 创建班级
  echo -e "\n${BLUE}测试1: 创建班级${NC}"
  test_create_class && ((success_count++))
  ((test_count++))
  
  # 如果班级创建成功，继续后续测试
  if [[ -n "$CREATED_CLASS_ID" ]]; then
    # 测试2: 获取班级信息
    echo -e "\n${BLUE}测试2: 获取班级信息${NC}"
    test_get_class && ((success_count++))
    ((test_count++))
    
    # 测试3: 更新班级信息
    echo -e "\n${BLUE}测试3: 更新班级信息${NC}"
    test_update_class && ((success_count++))
    ((test_count++))
    
    # 测试4: 添加学生
    echo -e "\n${BLUE}测试4: 添加学生到班级${NC}"
    test_add_student && ((success_count++))
    ((test_count++))
    
    # 测试5: 添加教师
    echo -e "\n${BLUE}测试5: 添加教师到班级${NC}"
    test_add_teacher && ((success_count++))
    ((test_count++))
    
    # 测试6: 移除教师
    echo -e "\n${BLUE}测试6: 移除班级教师${NC}"
    test_remove_teacher && ((success_count++))
    ((test_count++))
    
    # 测试7: 移除学生
    echo -e "\n${BLUE}测试7: 移除班级学生${NC}"
    test_remove_student && ((success_count++))
    ((test_count++))
    
    # 测试8: 删除班级
    echo -e "\n${BLUE}测试8: 删除班级${NC}"
    test_delete_class && ((success_count++))
    ((test_count++))
  else
    echo -e "${RED}班级创建失败，跳过后续测试${NC}"
  fi
  
  # 显示测试结果
  echo -e "\n${BLUE}=== 测试结果汇总 ===${NC}"
  echo -e "总测试数: $test_count"
  echo -e "成功测试数: $success_count"
  echo -e "失败测试数: $((test_count - success_count))"
  
  if [[ $success_count -eq $test_count ]]; then
    echo -e "${GREEN}✓ 所有测试通过!${NC}"
  else
    echo -e "${RED}✗ 部分测试失败${NC}"
  fi
}

# 显示菜单并获取用户选择
show_menu() {
  echo -e "${BLUE}请选择要运行的测试场景:${NC}"
  echo "1) 创建班级"
  echo "2) 获取班级信息"
  echo "3) 更新班级信息"
  echo "4) 添加学生到班级"
  echo "5) 移除班级学生"
  echo "6) 添加教师到班级"
  echo "7) 移除班级教师"
  echo "8) 删除班级"
  echo "9) 运行自动化测试"
  echo "0) 退出"
  
  read -p "请输入选项 (0-9): " choice
  
  case $choice in
    1) test_create_class ;;
    2) test_get_class ;;
    3) test_update_class ;;
    4) test_add_student ;;
    5) test_remove_student ;;
    6) test_add_teacher ;;
    7) test_remove_teacher ;;
    8) test_delete_class ;;
    9) AUTO_MODE=true; run_auto_tests; AUTO_MODE=false ;;
    0) exit 0 ;;
    *) echo -e "${RED}无效选项，请重新选择${NC}" ;;
  esac
  echo
  show_menu
}

# 检查jq是否安装
if ! command -v jq &> /dev/null; then
  echo -e "${RED}错误: 需要安装jq来格式化JSON输出${NC}"
  echo "请运行: brew install jq"
  exit 1
fi

# 检查curl是否安装
if ! command -v curl &> /dev/null; then
  echo -e "${RED}错误: 需要安装curl来发送HTTP请求${NC}"
  exit 1
fi

# 主程序入口
echo -e "${BLUE}=== AI-Speak Python FastAPI 班级接口测试工具 ===${NC}"
echo -e "API基础URL: $BASE_URL"
echo

# 检查命令行参数
if [[ $1 == "auto" ]]; then
  AUTO_MODE=true
  run_auto_tests
else
  show_menu
fi