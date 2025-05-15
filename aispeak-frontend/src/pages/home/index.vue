<template>
    <div class="home-container">  
      <!-- 用户信息 -->
      <div class="user-info">
        <div class="user-name">
          <span class="user-name-text">BOBBY老师</span>
          <uni-icons type="checkbox" size="20" color="#1890ff"></uni-icons>
        </div>
        <div></div>
      </div>
  
      <!-- 选项卡 -->
      <div class="tabs">
        <div class="tab" :class="{ active: currentTab === 'all' }" @click="handleTabClick('all')">全部</div>
        <div class="tab" :class="{ active: currentTab === 'my' }" @click="handleTabClick('my')">我发布的</div>
        <div class="class-stat-button">
          <span>班级统计时</span>
          <span class="small-text">分秒必争，高效共进</span>
        </div>
      </div>
  
      <!-- 日期显示 -->
      <div class="date-display">04月13日</div>
  
      <!-- 任务卡片 -->
      <div class="task-card">
        <div class="task-header">
          <div class="task-icon">📘</div>
          <div class="task-title">04月13日(周日)英语任务 —1班</div>
          <div class="task-actions">
            <span class="refresh-icon">↻</span>
            <span class="more-icon">⋯</span>
          </div>
        </div>
        <div class="task-stats">
          <div class="stat-item">
            <div class="label">已提交</div>
            <div class="value">0</div>
          </div>
          <div class="stat-item">
            <div class="label">未提交</div>
            <div class="value">3</div>
          </div>
          <div class="stat-item">
            <div class="label">提交率</div>
            <div class="value">0%</div>
          </div>
        </div>
        <div class="task-footer">已加到全部</div>
      </div>
  
      <!-- 系统信息卡片 -->
      <div class="system-card">
        <div class="system-header">
          <div class="system-icon">💌</div>
          <div class="system-title">致用户的一封信</div>
          <div class="more-icon">⋯</div>
        </div>
        <div class="system-subtitle">顶呱呱团队发布</div>
        <div class="system-content">
          老师您好，很高兴您选择使用顶呱呱。
          初次使用的老师/家长，顶呱呱强烈建议您，先
          点击查看下方的【快速入门视频】，可以让您轻
          松愉快地了解顶呱呱能为您和家长带来的便
          捷服务。
        </div>
        <div class="system-actions">
          <button class="action-button primary">👁️ 快速入门视频</button>
          <button class="action-button secondary">📚 更多使用帮助</button>
        </div>
      </div>
  
      <!-- 底部发布按钮 -->
      <div class="publish-button" @click="showPublishMenu">
        <span class="plus-icon">+</span>
        <span>发布</span>
      </div>
      
      <!-- 发布菜单弹窗 -->
      <div class="publish-menu-overlay" v-if="showMenu" @click="hidePublishMenu">
        <div class="publish-menu-content" @click.stop>
          <div class="search-bar">
            <input type="text" placeholder="输入想要发布的内容" />
            <button class="search-button">搜索</button>
          </div>
          
          <!-- 英语学科常用 -->
          <div class="menu-section">
            <div class="section-header">
              <div class="section-title">英语学科常用</div>
              <div class="section-toggle">切换 ≡</div>
            </div>
            
            <div class="menu-grid">
              <div class="menu-item" v-for="(item, index) in englishItems" :key="'eng-'+index" @click="handleMenuItemClick(item)">
                <div class="menu-icon" :class="item.highlight ? 'highlight' : ''" :style="{backgroundColor: item.bgColor}">
                  <span v-if="item.highlight" class="highlight-text">{{item.highlight}}</span>
                  {{item.icon}}
                </div>
                <div class="menu-item-text">{{item.text}}</div>
                <div v-if="item.tag" class="menu-item-tag">{{item.tag}}</div>
              </div>
            </div>
          </div>
          
          <!-- 班级管理常用 -->
          <div class="menu-section">
            <div class="section-header">
              <div class="section-title">班级管理常用</div>
            </div>
            
            <div class="menu-grid">
              <div class="menu-item" v-for="(item, index) in classItems" :key="'class-'+index" @click="handleMenuItemClick(item)">
                <div class="menu-icon" :style="{backgroundColor: item.bgColor}">
                  {{item.icon}}
                </div>
                <div class="menu-item-text">{{item.text}}</div>
                <div v-if="item.tag" class="menu-item-tag">{{item.tag}}</div>
              </div>
            </div>
          </div>
          
          <!-- 热门模版 -->
          <div class="menu-section">
            <div class="section-header">
              <div class="section-title">热门模版</div>
            </div>
            
            <div class="menu-grid">
              <div class="menu-item" v-for="(item, index) in templateItems" :key="'temp-'+index" @click="handleMenuItemClick(item)">
                <div class="menu-icon" :style="{backgroundColor: item.bgColor}">
                  {{item.icon}}
                </div>
                <div class="menu-item-text">{{item.text}}</div>
                <div v-if="item.tag" class="menu-item-tag hot">{{item.tag}}</div>
              </div>
            </div>
          </div>
          
          <!-- 关闭按钮 -->
          <div class="close-button" @click="hidePublishMenu">
            <uni-icons type="closeempty" size="25" color="#fff"></uni-icons>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'HomeIndex',
    data() {
      return {
        currentTab: 'all',
        showMenu: false,
        englishItems: [
          { icon: '✏️', text: '普通作业', bgColor: '#3B9FFB' },
          { icon: 'A8', text: '听说速写', bgColor: '#F8AD3A' },
          { icon: '📝', text: '打卡', bgColor: '#4AD2A3' },
          { icon: '📊', text: '发成绩', bgColor: '#2196F3' },
          { icon: '📚', text: '记单词', bgColor: '#FF9800' },
          { icon: '📋', text: '测验', bgColor: '#F5675C' }
        ],
        classItems: [
          { icon: '📊', text: '填表统计', bgColor: '#FF7043' },
          { icon: '💰', text: '收退款', bgColor: '#4AD2A3' },
          { icon: '📢', text: '通知', bgColor: '#FFBA3B' },
          { icon: '🏆', text: '接龙', bgColor: '#33CEC3' },
          { icon: '👨‍👩‍👧‍👦', text: '家长签', bgColor: '#FF7850' },
          { icon: '📒', text: '记账本', bgColor: '#FFBA3B', tag: 'NEW' },
          { icon: '🖨️', text: '云打印', bgColor: '#3BAAFF' },
          { icon: '⋯', text: '展开更多', bgColor: '#BDBDBD' }
        ],
        templateItems: [
          { icon: '📚', text: '课外书阅读打卡', bgColor: '#5A7D9F', tag: 'HOT' },
          { icon: '📸', text: '截图收集', bgColor: '#9966CC', tag: 'HOT' },
          { icon: '🔒', text: '安全到家接龙', bgColor: '#33B4FF' },
          { icon: '📝', text: '英语定制打卡', bgColor: '#33CEC3' }
        ]
      }
    },
    methods: {
      handleTabClick(tab) {
        if (tab === 'all') {
          this.currentTab = 'all';
        } else if (tab === 'my') {
          this.currentTab = 'my';
        }
      },
      showPublishMenu() {
        this.showMenu = true;
      },
      hidePublishMenu() {
        this.showMenu = false;
      },
      handleMenuItemClick(item) {
        console.log('选择了菜单项:', item.text);
        this.hidePublishMenu();
        // 这里可以根据选择的菜单项进行相应的跳转或操作
        uni.showToast({
          title: `选择了${item.text}`,
          icon: 'none'
        });
      }
    }
  }
  </script>
  
  <style scoped>
  .home-container {
    padding-bottom: 60px;
    background-color: #f5f5f7;
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .nav-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: #fff;
  }
  
  .title {
    font-size: 18px;
    font-weight: 500;
  }
  
  .nav-icons {
    display: flex;
    gap: 15px;
  }
  
  .user-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background-color: #fff;
  }
  
  .user-name {
    font-size: 18px;
    font-weight: bold;
    display: flex;
    align-items: center;
  }
  
  .verified-icon {
    color: #1890ff;
    margin-left: 5px;
    border: 1px solid #1890ff;
    border-radius: 50%;
    font-size: 12px;
    padding: 1px;
  }
  
  .tabs {
    display: flex;
    padding: 0 15px;
    background-color: #fff;
    position: relative;
    border-bottom: 1px solid #eee;
  }
  
  .tab {
    padding: 10px 0;
    margin-right: 20px;
    font-size: 14px;
    position: relative;
    cursor: pointer;
  }
  
  .tab.active {
    color: #1890ff;
    font-weight: 500;
  }
  
  .tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #1890ff;
  }
  
  .class-stat-button {
    position: absolute;
    right: 15px;
    top: 15px;
    background-color: #666;
    color: white;
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .small-text {
    font-size: 10px;
    opacity: 0.8;
  }
  
  .date-display {
    padding: 10px 15px;
    color: #666;
    font-size: 14px;
  }
  
  .task-card {
    margin: 0 15px 15px;
    background: white;
    border-radius: 10px;
    overflow: hidden;
  }
  
  .task-header {
    display: flex;
    align-items: center;
    padding: 15px;
  }
  
  .task-icon {
    margin-right: 10px;
    font-size: 20px;
  }
  
  .task-title {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
  }
  
  .task-actions {
    display: flex;
    gap: 10px;
  }
  
  .task-stats {
    display: flex;
    padding: 10px 15px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .stat-item {
    flex: 1;
    text-align: center;
  }
  
  .label {
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
  }
  
  .value {
    font-size: 16px;
    font-weight: 500;
  }
  
  .task-footer {
    padding: 10px 15px;
    font-size: 12px;
    color: #666;
    text-align: center;
  }
  
  .system-card {
    margin: 0 15px 15px;
    background: white;
    border-radius: 10px;
    padding: 15px;
  }
  
  .system-header {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
  }
  
  .system-icon {
    font-size: 20px;
    margin-right: 10px;
    color: #1890ff;
  }
  
  .system-title {
    flex: 1;
    font-size: 16px;
    font-weight: 500;
  }
  
  .system-subtitle {
    font-size: 12px;
    color: #999;
    margin-bottom: 10px;
  }
  
  .system-content {
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 15px;
  }
  
  .system-actions {
    display: flex;
    gap: 10px;
  }
  
  .action-button {
    flex: 1;
    border: none;
    padding: 8px 0;
    border-radius: 5px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  
  .action-button.primary {
    background-color: #e6f7ff;
    color: #1890ff;
  }
  
  .action-button.secondary {
    background-color: #f5f5f5;
    color: #666;
  }
  
  .publish-button {
    position: fixed;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #1890ff;
    color: white;
    padding: 10px 20px;
    border-radius: 25px;
    display: flex;
    align-items: center;
    font-size: 16px;
    z-index: 1;
    cursor: pointer;
  }
  
  .plus-icon {
    margin-right: 5px;
    font-weight: bold;
  }
  
  /* 发布菜单弹窗样式 */
  .publish-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.5);
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .publish-menu-content {
    background-color: #f5f5f7;
    width: 100%;
    height: 100%;
    padding: 15px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  
  .search-bar {
    display: flex;
    margin-bottom: 15px;
    margin-left: 10px;
    margin-right: 10px;
  }
  
  .search-bar input {
    flex: 1;
    padding: 8px 15px;
    border: 1px solid #e8e8e8;
    border-top-left-radius: 20px;
    border-bottom-left-radius: 20px;
    background-color: #fff;
    font-size: 14px;
    outline: none;
  }
  
  .search-button {
    background-color: #1890ff;
    color: white;
    border: none;
    padding: 0 15px;
    border-top-right-radius: 20px;
    border-bottom-right-radius: 20px;
    font-size: 14px;
    cursor: pointer;
  }
  
  .menu-section {
    margin-bottom: 15px;
    background-color: white;
    border-radius: 10px;
    padding: 15px;
    margin-left: 10px;
    margin-right: 10px;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
  }
  
  .section-title {
    font-size: 14px;
    font-weight: 500;
  }
  
  .section-toggle {
    font-size: 12px;
    color: #666;
  }
  
  .menu-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  
  .menu-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }
  
  .menu-icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
    color: white;
    font-size: 18px;
    position: relative;
  }
  
  .menu-icon.highlight {
    position: relative;
  }
  
  .highlight-text {
    position: absolute;
    top: -10px;
    right: -10px;
    background-color: #ff4d4f;
    color: white;
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 10px;
  }
  
  .menu-item-text {
    font-size: 12px;
    text-align: center;
  }
  
  .menu-item-tag {
    position: absolute;
    top: -5px;
    right: 0;
    background-color: #ff4d4f;
    color: white;
    font-size: 10px;
    padding: 0px 4px;
    border-radius: 8px;
  }
  
  .menu-item-tag.hot {
    background-color: #ff4d4f;
  }
  
  .close-button {
    width: 80px;
    height: 50px;
    border-radius: 50px;
    background-color: #2196F3;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 25px;
    position: fixed;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    cursor: pointer;
    z-index: 101;
  }
  .user-name-text{
    margin-right: 10px;
  }
  </style>