# AISPeak Taro 小程序使用说明

## 环境设置

✅ **Taro配置已完成**
- Taro v4.1.2
- React + TypeScript
- 支持微信小程序、支付宝小程序、H5多端

## 构建命令

### 开发模式 (推荐)
```bash
# 微信小程序开发模式 (实时监听文件变化)
npm run taro:dev:weapp

# 支付宝小程序开发模式
npm run taro:dev:alipay

# H5开发模式
npm run taro:dev:h5
```

### 生产构建
```bash
# 微信小程序构建
npm run taro:build:weapp

# 支付宝小程序构建
npm run taro:build:alipay

# H5构建
npm run taro:build:h5
```

## 开发工具

### 微信开发者工具
1. 运行 `npm run taro:dev:weapp`
2. 打开微信开发者工具
3. 导入项目：选择 `ai-speak-nextjs/taro/dist` 目录
4. 项目类型：小程序

### 支付宝开发者工具
1. 运行 `npm run taro:dev:alipay`
2. 打开支付宝开发者工具
3. 导入项目：选择 `ai-speak-nextjs/taro/dist` 目录

## 项目结构
```
ai-speak-nextjs/
├── taro/                      # Taro小程序项目
│   ├── src/
│   │   ├── app.tsx           # 应用入口
│   │   ├── app.config.ts     # 应用配置
│   │   ├── pages/            # 页面目录
│   │   │   ├── login/        # 登录页
│   │   │   ├── index/        # 首页
│   │   │   └── profile/      # 个人中心
│   │   └── stores/           # 状态管理
│   ├── config/               # 构建配置
│   ├── dist/                 # 构建输出 (导入到开发者工具)
│   └── package.json          # Taro项目依赖
└── package.json              # 主项目脚本
```

## 当前功能

### ✅ 已实现页面
- **登录页** (`/pages/login/index`): 
  - 访客登录
  - 手机号登录  
  - 微信登录
  - 注册
- **首页** (`/pages/index/index`): 学习统计和快捷操作
- **个人中心** (`/pages/profile/index`): 用户信息页面

### 🔧 技术特性
- TypeScript支持
- SCSS样式
- 状态管理 (Zustand)
- 多端适配
- 热重载开发

## 下一步开发

1. **完善登录功能**: 集成API调用
2. **添加聊天页面**: AI对话功能
3. **语音处理**: 录音和播放
4. **教材管理**: 课本选择和学习进度
5. **练习模块**: 语音评测和练习

## 故障排除

### 构建失败
1. 检查Node.js版本 (建议v16+)
2. 删除node_modules重新安装: `rm -rf taro/node_modules && cd taro && npm install`
3. 清理构建缓存: `rm -rf taro/dist`

### 微信开发者工具无法预览
1. 确保运行了 `npm run taro:dev:weapp` 
2. 检查dist目录是否存在
3. 选择项目类型为"小程序"而不是"小游戏"

### 热重载不工作
1. 确保使用dev命令而不是build命令
2. 检查文件监听权限
3. 重启开发者工具 