<template>
  <view class="container">
    <CommonHeader 
      :leftIcon="true" 
      :backFn="cancel"
      backgroundColor="#f5f7fa"
    >
      <template v-slot:content>
        <text>创建班级</text>
      </template>
    </CommonHeader>
    
    <view class="content">
      <view class="form">
        <!-- 基本信息 -->
        <view class="form-section">
          <text class="section-title">基本信息</text>
          
          <view class="form-item">
            <text class="label">班级名称 *</text>
            <input 
              v-model="form.name" 
              class="input" 
              placeholder="如：三年级1班、初一英语班"
              maxlength="50"
            />
          </view>
          
          <view class="form-item">
            <text class="label">班级描述</text>
            <textarea 
              v-model="form.description" 
              class="textarea" 
              placeholder="简单描述班级情况（可选）"
              maxlength="200"
            />
          </view>
          
          <view class="form-item">
            <text class="label">年级 *</text>
            <picker 
              :value="gradeIndex" 
              :range="grades" 
              @change="onGradeChange"
            >
              <view class="picker">
                {{ grades[gradeIndex] || '请选择年级' }}
              </view>
            </picker>
          </view>
          
          <view class="form-item">
            <text class="label">学科 *</text>
            <picker 
              :value="subjectIndex" 
              :range="subjects" 
              @change="onSubjectChange"
            >
              <view class="picker">
                {{ subjects[subjectIndex] || '请选择学科' }}
              </view>
            </picker>
          </view>
          
          <view class="form-item">
            <text class="label">学校</text>
            <input 
              v-model="form.school" 
              class="input" 
              placeholder="学校名称（可选）"
            />
          </view>
        </view>
        
        <!-- 班级设置 -->
        <view class="form-section">
          <text class="section-title">班级设置</text>
          
          <view class="form-item">
            <text class="label">最大学生数</text>
            <input 
              v-model="form.max_students" 
              class="input" 
              type="number"
              placeholder="如：30（可选，默认50人）"
            />
          </view>
          

        </view>

      </view>
      
      <!-- 底部按钮 -->
      <view class="bottom-actions">
        <view class="btn-group">
          <view class="btn cancel" @click="cancel">取消</view>
          <view 
            class="btn submit" 
            @click="submit"
            :class="{ disabled: !canSubmit }"
          >
            创建班级
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import CommonHeader from "@/components/CommonHeader.vue";
import taskRequest from "@/api/task";

const form = ref({
  name: '',
  description: '',
  grade_level: '',
  subject: '',
  school: '',
  max_students: 50
});

const gradeIndex = ref(-1);
const subjectIndex = ref(-1);

const grades = ref([
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '七年级', '八年级', '九年级',
  '高一', '高二', '高三'
]);

const subjects = ref([
  '语文', '数学', '英语', '物理', '化学', '生物',
  '历史', '地理', '政治', '音乐', '美术', '体育',
  '信息技术', '通用技术', '其他'
]);

const canSubmit = computed(() => {
  return form.value.name && form.value.grade_level && form.value.subject;
});

const onGradeChange = (e: any) => {
  gradeIndex.value = e.detail.value;
  form.value.grade_level = grades.value[e.detail.value];
};

const onSubjectChange = (e: any) => {
  subjectIndex.value = e.detail.value;
  form.value.subject = subjects.value[e.detail.value];
};

const cancel = () => {
  // 检查是否有未保存的内容
  const hasContent = form.value.name || form.value.description || 
                    form.value.grade_level || form.value.subject || 
                    form.value.school;
  
  if (hasContent) {
    uni.showModal({
      title: '确认返回',
      content: '您有未保存的内容，确定要返回吗？',
      showCancel: true,
      cancelText: '继续编辑',
      confirmText: '确定返回',
      success: (res) => {
        if (res.confirm) {
          uni.navigateBack();
        }
      }
    });
  } else {
    uni.navigateBack();
  }
};

const submit = () => {
  if (!canSubmit.value) {
    uni.showToast({ title: '请完善必填信息', icon: 'none' });
    return;
  }

  // 学科映射：中文到英文
  const subjectMap: { [key: string]: string } = {
    '语文': 'chinese',
    '数学': 'math', 
    '英语': 'english',
    '物理': 'science',
    '化学': 'science',
    '生物': 'science',
    '历史': 'history',
    '地理': 'geography',
    '政治': 'history',
    '音乐': 'music',
    '美术': 'art',
    '体育': 'physical_education',
    '信息技术': 'other',
    '通用技术': 'other',
    '其他': 'other'
  };
  
  const submitData = {
    name: form.value.name,
    grade_level: form.value.grade_level,
    subject: subjectMap[form.value.subject] || 'other',
    description: form.value.description || null,
    school_name: form.value.school || null,
    max_students: Number(form.value.max_students) || 50
  };
  
  console.log('提交班级数据:', submitData);
  
  uni.showLoading({ title: '创建中...' });
  
  taskRequest.createClass(submitData).then((res) => {
    uni.hideLoading();
    console.log('班级创建成功:', res);
    // 优化成功提示
    uni.showModal({
      title: '创建成功',
      content: `班级"${form.value.name}"创建成功！`,
      showCancel: false,
      confirmText: '确定',
      success: () => {
        // 立即返回
        uni.navigateBack();
      }
    });
  }).catch((error) => {
    uni.hideLoading();
    console.error('班级创建失败:', error);
    
    // 优化错误提示
    uni.showModal({
      title: '创建失败',
      content: error.message || '创建失败，请检查网络连接或重试',
      showCancel: true,
      cancelText: '取消',
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          // 重新尝试提交
          submit();
        }
      }
    });
  });
};
</script>

<style scoped lang="less">
.container {
  background: #f5f7fa;
  min-height: 100vh;
  padding: 20rpx;
  padding-bottom: 120rpx;
}

.form {
  .form-section {
    background: white;
    border-radius: 16rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    
    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
      margin-bottom: 24rpx;
    }
    
    .form-item {
      margin-bottom: 24rpx;
      
      .label {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 12rpx;
        font-weight: 500;
      }
      
      .input, .textarea, .picker {
        width: 100%;
        padding: 24rpx;
        background: #f8f9fa;
        border-radius: 12rpx;
        font-size: 28rpx;
        color: #333;
        border: 1px solid #e8e8e8;
      }
      
      .textarea {
        min-height: 120rpx;
      }
      
      .picker {
        color: #666;
      }
      
      .checkbox-item {
        display: flex;
        align-items: center;
        margin-bottom: 8rpx;
        
        .checkbox-label {
          margin-left: 16rpx;
          font-size: 28rpx;
          color: #333;
        }
      }
      
      .checkbox-desc {
        font-size: 24rpx;
        color: #999;
        line-height: 1.4;
        margin-left: 40rpx;
      }
    }
  }
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 32rpx;
  border-top: 1px solid #e8e8e8;
  
  .btn-group {
    display: flex;
    gap: 24rpx;
    
    .btn {
      flex: 1;
      text-align: center;
      padding: 32rpx;
      border-radius: 12rpx;
      font-size: 32rpx;
      font-weight: 600;
      
      &.cancel {
        background: #f5f5f5;
        color: #666;
      }
      
      &.submit {
        background: linear-gradient(135deg, #4B7EFE, #6A93FF);
        color: white;
        
        &.disabled {
          opacity: 0.5;
        }
      }
    }
  }
}
</style>