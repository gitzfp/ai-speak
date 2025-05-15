<template>
    <div class="character-selection">
      <!-- 添加安全区域占位符 -->
      <div class="safe-area-top"></div>
  
      <div class="selection-prompt">请选择您要使用的身份</div>
  
      <div class="character-list">
        <!-- 教师角色 -->
        <div class="character-item" @click="selectCharacter('teacher')">
          <div class="avatar teacher">
            <span class="avatar-icon">👨‍🏫</span>
          </div>
          <div class="info">
            <div class="name">我是老师</div>
            <div class="tag">老师</div>
          </div>
          <div class="arrow">›</div>
        </div>
  
        <!-- 学生角色 -->
        <div class="character-item" @click="selectCharacter('student')">
          <div class="avatar student">
            <span class="avatar-icon">👨‍🎓</span>
          </div>
          <div class="info">
            <div class="name">我是学生</div>
            <div class="tag">学生</div>
          </div>
          <div class="arrow">›</div>
        </div>
  
        <!-- 添加身份按钮 -->
        <div class="character-item add-character" @click="addCharacter">
          <div class="avatar add">
            <span class="avatar-icon">+</span>
          </div>
          <div class="info">
            <div class="name">添加身份</div>
          </div>
          <div class="arrow">›</div>
        </div>
      </div>
    </div>
  </template>
  
<script>
  import { defineComponent, onMounted } from 'vue';
  
  export default defineComponent({
    name: 'CharacterSelection',
    setup() {
      // 在小程序环境中，使用uni-app的 API 进行导航
      const goBack = () => {
        uni.navigateBack();
      };
  
      const selectCharacter = (type) => {
        // 保存选择的角色类型
        console.log(type);
        uni.setStorageSync('characterType', type);
        
        // 根据角色类型跳转到对应页面
        if (type === 'teacher') {
          // 修改跳转到首页
          uni.switchTab({ url: '/pages/home/index' });
        } else if (type === 'student') {
          uni.navigateTo({ url: '/pages/student/dashboard' });
        }
      };
  
      const addCharacter = () => {
        uni.navigateTo({ url: '/pages/add-character/index' });
      };
  
      // 获取系统信息，计算安全区域
      onMounted(() => {
        uni.getSystemInfo({
          success: (res) => {
            // 获取状态栏高度
            const statusBarHeight = res.statusBarHeight;
            // 使用uni-app的API来存储全局数据
            getApp().globalData = getApp().globalData || {};
            getApp().globalData.statusBarHeight = statusBarHeight;
          }
        });
      });
  
      return {
        goBack,
        selectCharacter,
        addCharacter
      };
    }
  });
</script>
  
<style scoped>
  /* 使用CSS变量存储状态栏高度 */
  :root {
    --status-bar-height: 20px;
  }
  
  .character-selection {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: #f5f5f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .selection-prompt {
    padding: 15px 16px;
    color: #666;
    font-size: 14px;
    background-color: #f8f8f8;
  }
  
  .character-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 16px;
  }
  
  .character-item {
    display: flex;
    align-items: center;
    padding: 16px;
    background-color: #fff;
    border-radius: 10px;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    font-size: 20px;
  }
  
  .teacher {
    background-color: #FFD700;
  }
  
  .student {
    background-color: #4ECCA3;
  }
  
  .add {
    background-color: #eaeaea;
    color: #666;
  }
  
  .info {
    flex: 1;
  }
  
  .name {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .tag {
    display: inline-block;
    font-size: 12px;
    color: #666;
    background-color: #f5f5f5;
    padding: 2px 8px;
    border-radius: 10px;
  }
  
  .arrow {
    font-size: 20px;
    color: #ccc;
  }
  
  /* 图标样式 */
  .icon-home:before {
    content: "⌂";
  }
</style>