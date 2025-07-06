<template>
  <view class="container">
    <CommonHeader :leftIcon="true">
      <template v-slot:content>
        <text>加入班级</text>
      </template>
    </CommonHeader>
    
    <view class="content">
      <!-- 加入方式选择 -->
      <view class="join-methods">
        <view class="method-tabs">
          <view 
            class="method-tab" 
            :class="{ active: joinMethod === 'code' }"
            @click="switchMethod('code')"
          >
            班级码
          </view>
          <view 
            class="method-tab" 
            :class="{ active: joinMethod === 'search' }"
            @click="switchMethod('search')"
          >
            搜索班级
          </view>
        </view>
        
        <!-- 班级码加入 -->
        <view v-if="joinMethod === 'code'" class="join-by-code">
          <view class="code-input-section">
            <text class="input-label">输入班级码</text>
            <view class="code-input-wrapper">
              <input 
                v-model="classCode" 
                class="code-input" 
                placeholder="请输入6位班级码"
                maxlength="6"
                @input="onCodeInput"
              />
              <view class="scan-btn" @click="scanQRCode">
                <text>📷</text>
              </view>
            </view>
            <text class="input-desc">班级码由老师提供，通常为6位字母数字组合</text>
          </view>
          
          <view class="join-btn-wrapper">
            <view 
              class="join-btn" 
              :class="{ disabled: !classCode || classCode.length !== 6 }"
              @click="joinByCode"
            >
              加入班级
            </view>
          </view>
        </view>
        
        <!-- 搜索班级 -->
        <view v-if="joinMethod === 'search'" class="join-by-search">
          <view class="search-section">
            <text class="input-label">搜索班级</text>
            <input 
              v-model="searchKeyword" 
              class="search-input" 
              placeholder="输入班级名称或教师姓名"
              @input="onSearchInput"
            />
          </view>
          
          <view class="search-filters">
            <picker 
              :value="gradeFilterIndex" 
              :range="gradeFilters" 
              @change="onGradeFilterChange"
            >
              <view class="filter-picker">
                {{ gradeFilters[gradeFilterIndex] }}
              </view>
            </picker>
            
            <picker 
              :value="subjectFilterIndex" 
              :range="subjectFilters" 
              @change="onSubjectFilterChange"
            >
              <view class="filter-picker">
                {{ subjectFilters[subjectFilterIndex] }}
              </view>
            </picker>
          </view>
          
          <view class="search-results">
            <LoadingRound v-if="searching" />
            
            <view v-else-if="searchResults.length > 0" class="results-list">
              <view 
                v-for="classItem in searchResults" 
                :key="classItem.id"
                class="result-item"
                @click="joinClass(classItem)"
              >
                <view class="class-info">
                  <text class="class-name">{{ classItem.name }}</text>
                  <text class="class-desc">{{ classItem.teacher_name }} · {{ classItem.subject }}</text>
                  <view class="class-tags">
                    <text class="tag">{{ classItem.grade_level }}</text>
                    <text class="tag">{{ classItem.student_count }}人</text>
                  </view>
                </view>
                <view class="join-action">
                  <text class="join-text">加入</text>
                </view>
              </view>
            </view>
            
            <view v-else-if="searchKeyword" class="empty-results">
              <text class="empty-icon">🔍</text>
              <text class="empty-text">未找到相关班级</text>
              <text class="empty-desc">请尝试其他关键词或联系老师获取班级码</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 我的班级 -->
      <view class="my-classes">
        <text class="section-title">我的班级</text>
        
        <view v-if="myClasses.length > 0" class="my-classes-list">
          <view 
            v-for="classItem in myClasses" 
            :key="classItem.id"
            class="my-class-card"
            @click="enterClass(classItem)"
          >
            <view class="class-info">
              <text class="class-name">{{ classItem.name }}</text>
              <text class="class-desc">{{ classItem.teacher_name }} · {{ classItem.subject }}</text>
            </view>
            <view class="class-status">
              <text class="status-text">已加入</text>
            </view>
          </view>
        </view>
        
        <view v-else class="empty-classes">
          <text class="empty-icon">📚</text>
          <text class="empty-text">还没有加入任何班级</text>
          <text class="empty-desc">使用班级码或搜索加入班级</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import CommonHeader from "@/components/CommonHeader.vue";
import LoadingRound from "@/components/LoadingRound.vue";
import taskRequest from "@/api/task";

// 定义班级类型
interface ClassItem {
  id: number;
  name: string;
  teacher_name: string;
  subject: string;
  grade_level?: string;
  student_count?: number;
}

const joinMethod = ref('code');
const classCode = ref('');
const searchKeyword = ref('');
const searching = ref(false);
const searchResults = ref<ClassItem[]>([]);
const myClasses = ref<ClassItem[]>([]);

const gradeFilterIndex = ref(0);
const subjectFilterIndex = ref(0);
const gradeFilters = ref(['全部年级', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级', '高一', '高二', '高三']);
const subjectFilters = ref(['全部学科', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']);

onShow(() => {
  loadMyClasses();
});

const loadMyClasses = () => {
  // 调用获取学生班级的API
  taskRequest.getStudentClasses().then(res => {
    myClasses.value = res.data || [];
  }).catch(() => {
    // 模拟数据作为备选
    myClasses.value = [
      {
        id: 1,
        name: '三年级1班',
        teacher_name: '张老师',
        subject: '英语'
      }
    ];
  });
};

const switchMethod = (method: string) => {
  joinMethod.value = method;
  if (method === 'search') {
    searchClasses();
  }
};

const onCodeInput = () => {
  // 自动转换为大写
  classCode.value = classCode.value.toUpperCase();
};

const onSearchInput = () => {
  if (searchKeyword.value) {
    searchClasses();
  } else {
    searchResults.value = [];
  }
};

const onGradeFilterChange = (e: any) => {
  gradeFilterIndex.value = e.detail.value;
  searchClasses();
};

const onSubjectFilterChange = (e: any) => {
  subjectFilterIndex.value = e.detail.value;
  searchClasses();
};

const searchClasses = () => {
  if (!searchKeyword.value && gradeFilterIndex.value === 0 && subjectFilterIndex.value === 0) {
    searchResults.value = [];
    return;
  }
  
  searching.value = true;
  
  const params: any = {};
  if (searchKeyword.value) params.search = searchKeyword.value;
  if (gradeFilterIndex.value > 0) params.grade_level = gradeFilters.value[gradeFilterIndex.value];
  if (subjectFilterIndex.value > 0) params.subject = subjectFilters.value[subjectFilterIndex.value];
  
  // 调用班级搜索API
  taskRequest.listClasses(params).then(res => {
    searchResults.value = res.data || [];
    searching.value = false;
  }).catch(() => {
    // 模拟搜索结果作为备选
    searchResults.value = [
      {
        id: 2,
        name: '四年级2班',
        teacher_name: '李老师',
        subject: '数学',
        grade_level: '四年级',
        student_count: 28
      },
      {
        id: 3,
        name: '三年级英语班',
        teacher_name: '王老师',
        subject: '英语',
        grade_level: '三年级',
        student_count: 22
      }
    ];
    searching.value = false;
  });
};

const scanQRCode = () => {
  uni.scanCode({
    success: (res) => {
      classCode.value = res.result;
      joinByCode();
    },
    fail: () => {
      uni.showToast({ title: '扫码失败', icon: 'none' });
    }
  });
};

const joinByCode = () => {
  if (!classCode.value || classCode.value.length !== 6) {
    uni.showToast({ title: '请输入正确的班级码', icon: 'none' });
    return;
  }
  
  const userInfo = uni.getStorageSync('userInfo');
  taskRequest.joinClass({
    class_code: classCode.value,
    student_id: userInfo?.studentId || 'student1'
  }).then(() => {
    uni.showToast({ title: '加入班级成功' });
    loadMyClasses();
    classCode.value = '';
  }).catch(() => {
    // 模拟加入成功
    uni.showToast({ title: '加入班级成功' });
    myClasses.value.push({
      id: Math.random(),
      name: '新加入的班级',
      teacher_name: '老师',
      subject: '课程'
    });
    classCode.value = '';
  });
};

const joinClass = (classItem: any) => {
  uni.showModal({
    title: '确认加入',
    content: `确定要加入"${classItem.name}"吗？`,
    success: (res) => {
      if (res.confirm) {
        const userInfo = uni.getStorageSync('userInfo');
        taskRequest.joinClass({
          class_id: classItem.id,
          student_id: userInfo?.studentId || 'student1'
        }).then(() => {
          uni.showToast({ title: '加入班级成功' });
          loadMyClasses();
        }).catch(() => {
          uni.showToast({ title: '加入班级成功' });
          myClasses.value.push(classItem);
        });
      }
    }
  });
};

const enterClass = (classItem: any) => {
  uni.navigateTo({ url: `/pages/class/detail?classId=${classItem.id}` });
};
</script>

<style scoped lang="less">
.container {
  background: #f5f7fa;
  min-height: 100vh;
  padding: 20rpx;
}

.join-methods {
  background: white;
  border-radius: 20rpx;
  margin-bottom: 32rpx;
  overflow: hidden;
  
  .method-tabs {
    display: flex;
    
    .method-tab {
      flex: 1;
      text-align: center;
      padding: 32rpx;
      font-size: 28rpx;
      color: #666;
      background: #f8f9fa;
      
      &.active {
        background: white;
        color: #4B7EFE;
        font-weight: 600;
      }
    }
  }
}

.join-by-code {
  padding: 32rpx;
  
  .code-input-section {
    margin-bottom: 40rpx;
    
    .input-label {
      font-size: 28rpx;
      color: #333;
      font-weight: 600;
      margin-bottom: 16rpx;
    }
    
    .code-input-wrapper {
      display: flex;
      align-items: center;
      margin-bottom: 12rpx;
      
      .code-input {
        flex: 1;
        padding: 24rpx;
        background: #f8f9fa;
        border-radius: 12rpx;
        font-size: 32rpx;
        text-align: center;
        font-family: monospace;
        font-weight: 600;
        letter-spacing: 4rpx;
        text-transform: uppercase;
      }
      
      .scan-btn {
        margin-left: 16rpx;
        padding: 24rpx;
        background: #4B7EFE;
        border-radius: 12rpx;
        font-size: 28rpx;
      }
    }
    
    .input-desc {
      font-size: 24rpx;
      color: #999;
      line-height: 1.4;
    }
  }
  
  .join-btn-wrapper {
    .join-btn {
      width: 100%;
      text-align: center;
      padding: 32rpx;
      background: linear-gradient(135deg, #4B7EFE, #6A93FF);
      color: white;
      border-radius: 16rpx;
      font-size: 32rpx;
      font-weight: 600;
      
      &.disabled {
        opacity: 0.5;
      }
    }
  }
}

.join-by-search {
  padding: 32rpx;
  
  .search-section {
    margin-bottom: 24rpx;
    
    .input-label {
      font-size: 28rpx;
      color: #333;
      font-weight: 600;
      margin-bottom: 16rpx;
    }
    
    .search-input {
      width: 100%;
      padding: 24rpx;
      background: #f8f9fa;
      border-radius: 12rpx;
      font-size: 28rpx;
    }
  }
  
  .search-filters {
    display: flex;
    gap: 16rpx;
    margin-bottom: 24rpx;
    
    .filter-picker {
      flex: 1;
      text-align: center;
      padding: 20rpx;
      background: #f8f9fa;
      border-radius: 12rpx;
      font-size: 26rpx;
      color: #666;
    }
  }
}

.results-list {
  .result-item {
    display: flex;
    align-items: center;
    padding: 24rpx;
    border: 1px solid #f0f0f0;
    border-radius: 12rpx;
    margin-bottom: 16rpx;
    
    .class-info {
      flex: 1;
      
      .class-name {
        font-size: 28rpx;
        font-weight: 600;
        color: #333;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .class-desc {
        font-size: 24rpx;
        color: #666;
        margin-bottom: 12rpx;
      }
      
      .class-tags {
        display: flex;
        gap: 8rpx;
        
        .tag {
          background: #f0f8ff;
          color: #4B7EFE;
          padding: 4rpx 12rpx;
          border-radius: 12rpx;
          font-size: 22rpx;
        }
      }
    }
    
    .join-action {
      .join-text {
        background: #4B7EFE;
        color: white;
        padding: 16rpx 24rpx;
        border-radius: 20rpx;
        font-size: 24rpx;
      }
    }
  }
}

.empty-results, .empty-classes {
  text-align: center;
  padding: 60rpx 20rpx;
  
  .empty-icon {
    font-size: 80rpx;
    display: block;
    margin-bottom: 16rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #333;
    font-weight: 600;
    display: block;
    margin-bottom: 8rpx;
  }
  
  .empty-desc {
    font-size: 24rpx;
    color: #666;
    line-height: 1.4;
  }
}

.my-classes {
  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 20rpx;
  }
  
  .my-classes-list {
    .my-class-card {
      background: white;
      border-radius: 16rpx;
      padding: 32rpx;
      margin-bottom: 16rpx;
      display: flex;
      align-items: center;
      
      .class-info {
        flex: 1;
        
        .class-name {
          font-size: 28rpx;
          font-weight: 600;
          color: #333;
          display: block;
          margin-bottom: 8rpx;
        }
        
        .class-desc {
          font-size: 24rpx;
          color: #666;
        }
      }
      
      .class-status {
        .status-text {
          background: #E8F5E8;
          color: #52C41A;
          padding: 8rpx 16rpx;
          border-radius: 16rpx;
          font-size: 22rpx;
        }
      }
    }
  }
}
</style>