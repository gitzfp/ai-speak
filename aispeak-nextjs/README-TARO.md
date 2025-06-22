# AISPeak 多端开发架构

## 📱 技术栈

### Web端 (Next.js)
- **框架**: Next.js 14 + React 18
- **样式**: Tailwind CSS + shadcn/ui
- **状态管理**: Zustand
- **数据库**: Prisma + SQLite
- **认证**: JWT

### 小程序端 (Taro)
- **框架**: Taro 4.x + React 18
- **样式**: SCSS
- **状态管理**: Zustand (复用Web端)
- **API**: 复用Next.js后端

## 🏗️ 项目结构

```
ai-speak-nextjs/
├── app/                    # Next.js App Router
│   ├── api/               # API路由 (Web端和小程序共用)
│   ├── globals.css        # Web端全局样式
│   ├── layout.tsx         # Web端布局
│   └── page.tsx           # Web端首页
├── components/            # Web端组件
├── stores/               # Zustand状态管理 (Web端和小程序共用)
├── lib/                  # 工具函数和配置
├── prisma/               # 数据库schema
└── taro/                 # Taro小程序端
    ├── config/           # Taro配置
    ├── src/
    │   ├── app.tsx       # 小程序入口
    │   ├── app.config.ts # 小程序配置
    │   ├── stores/       # 小程序专用状态管理
    │   └── pages/        # 小程序页面
    └── project.config.json # 微信小程序配置
```

## 🔄 代码复用策略

### 1. API接口复用
- 小程序直接调用Next.js的API路由
- 统一的认证和数据格式
- 环境变量配置不同域名

### 2. 状态管理复用
- Web端和小程序都使用Zustand
- 小程序版本适配Taro的存储API
- 相同的用户状态和业务逻辑

### 3. 业务逻辑复用
- 表单验证逻辑
- 用户认证流程
- 数据处理函数

## 🚀 开发命令

### Web端开发
```bash
npm run dev              # 启动Next.js开发服务器
npm run build           # 构建Web端
npm run start           # 启动生产服务器
```

### 小程序开发
```bash
npm run taro:dev:weapp   # 微信小程序开发模式
npm run taro:dev:alipay  # 支付宝小程序开发模式
npm run taro:dev:h5      # H5开发模式

npm run taro:build:weapp  # 构建微信小程序
npm run taro:build:alipay # 构建支付宝小程序
npm run taro:build:h5     # 构建H5版本
```

## 📱 支持平台

- ✅ **Web浏览器** (Next.js)
- ✅ **微信小程序** (Taro)
- ✅ **支付宝小程序** (Taro)
- ⏳ **H5移动端** (Taro)
- ⏳ **App** (React Native/Taro)

## 🔧 配置说明

### 环境变量
```env
# .env.local
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-jwt-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
```

### Taro配置
- `taro/config/index.js` - 主配置文件
- `taro/config/dev.js` - 开发环境配置
- `taro/config/prod.js` - 生产环境配置

## 🎯 第一阶段功能 (已完成)

### 认证模块
- [x] 访客登录 (设备指纹)
- [x] 手机号登录
- [x] 微信小程序登录
- [x] 用户注册 (含年级选择)
- [x] 登录状态持久化
- [x] 角色权限管理

### 用户设置
- [x] 学习语言设置
- [x] 语音角色选择
- [x] 个人信息管理
- [x] 退出登录

## 🛠️ 开发工具推荐

### VS Code 插件
- Taro Helper
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prisma

### 小程序开发工具
- 微信开发者工具
- 支付宝小程序开发工具

## 📝 开发规范

### 组件命名
- Web端: PascalCase (LoginForm.tsx)
- 小程序: kebab-case (login/index.tsx)

### 样式规范
- Web端: Tailwind CSS类名
- 小程序: SCSS + BEM命名规范

### 状态管理
- 使用TypeScript严格类型检查
- 状态按功能模块拆分
- 持久化重要用户数据

## 🔍 调试技巧

### Web端调试
```bash
npm run dev
# 打开 http://localhost:3000
# 使用浏览器开发者工具
```

### 小程序调试
```bash
npm run taro:dev:weapp
# 使用微信开发者工具打开 taro/dist 目录
# 查看控制台日志和网络请求
```

## 📚 参考文档

- [Next.js 官方文档](https://nextjs.org/docs)
- [Taro 官方文档](https://docs.taro.zone)
- [Zustand 文档](https://github.com/pmndrs/zustand)
- [Prisma 文档](https://www.prisma.io/docs)

## 🤝 贡献指南

1. 功能开发先在Web端完成
2. 然后适配到小程序端
3. 保持API接口的向后兼容
4. 添加必要的类型定义
5. 编写测试用例 