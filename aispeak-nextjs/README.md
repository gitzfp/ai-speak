# AI语言学习平台 - Next.js版本

这是AI语言学习平台的Next.js重构版本，第一阶段完成了基础认证与权限模块。

## 🎯 第一阶段完成功能

### ✅ 基础认证与权限模块
- **访客登录** - 基于设备指纹的快速体验
- **手机登录** - 基于短信验证码的注册/登录
- **用户角色管理** - 学生/老师/管理员角色切换
- **权限控制系统** - JWT Token认证
- **状态管理** - 基于Zustand的响应式状态管理

## 🛠 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **UI组件**: shadcn/ui
- **状态管理**: Zustand (替代原计划的Pinia)
- **数据库**: Prisma + MySQL
- **认证**: JWT + bcryptjs
- **图标**: Lucide React

## 📦 项目结构

```
ai-speak-nextjs/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   └── account/       # 账户相关API
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # 组件库
│   ├── auth/             # 认证相关组件
│   └── ui/               # shadcn/ui基础组件
├── lib/                  # 工具库
│   ├── auth.ts           # 认证工具
│   ├── prisma.ts         # 数据库客户端
│   └── utils.ts          # 通用工具
├── prisma/               # 数据库
│   └── schema.prisma     # 数据模型
└── stores/               # 状态管理
    └── auth.ts           # 认证状态
```

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 环境配置
复制 `.env.example` 为 `.env` 并填写配置：

```env
# 数据库
DATABASE_URL="mysql://root:password@localhost:3306/ai_speak"

# JWT密钥
JWT_SECRET="your-super-secret-jwt-key-here"

# NextAuth (可选)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"
```

### 3. 数据库设置
```bash
# 生成Prisma客户端
npm run db:generate

# 同步数据库结构
npm run db:push

# 或运行迁移
npm run db:migrate
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🎨 界面预览

### 登录界面
- **访客登录**: 一键体验，无需注册
- **手机登录**: 短信验证码登录/注册
- **响应式设计**: 支持桌面和移动端

### 角色选择
- **学生模式**: AI对话练习、个性化学习
- **老师模式**: 学生管理、作业布置
- **清晰的功能说明**: 帮助用户选择合适角色

### 主界面
- **学习统计**: 时长、天数、单词量
- **快速开始**: AI对话、单词学习、语音练习
- **学习进度**: 可视化进度条
- **学习记录**: 历史记录展示

## 📋 API接口

### 认证接口
- `POST /api/account/visitor-login` - 访客登录
- `POST /api/account/phone-login` - 手机登录
- `GET /api/account/info` - 获取用户信息
- `GET /api/account/role` - 获取用户角色
- `POST /api/account/role` - 设置用户角色

## 🔄 状态管理

使用Zustand进行状态管理，主要状态包括：
- 用户信息 (user)
- 认证令牌 (token)
- 登录状态 (isAuthenticated)
- 加载状态 (isLoading)
- 错误信息 (error)

## 🎯 下一步计划

### 第二阶段：首页与教材管理
- [ ] 教材列表和搜索
- [ ] 课程章节导航
- [ ] 单词学习界面
- [ ] 学习进度追踪

### 第三阶段：AI聊天对话
- [ ] 聊天界面设计
- [ ] OpenAI集成
- [ ] 消息历史管理
- [ ] 对话设置

### 第四阶段：语音功能
- [ ] 腾讯云TTS集成
- [ ] 阿里云ASR集成
- [ ] 语音播放控制
- [ ] 发音评估

## 🐛 已知问题

1. **Linter错误**: 当前显示的TypeScript错误是因为依赖包未安装，运行`npm install`后会解决
2. **环境变量**: 需要正确配置数据库连接和JWT密钥
3. **短信验证**: 当前使用模拟验证码(123456)，生产环境需要集成真实短信服务

## 📝 开发注意事项

1. **数据库**: 确保MySQL服务正在运行
2. **端口**: 默认端口3000，如需修改请更新环境变量
3. **CORS**: API路由已配置正确的CORS头部
4. **安全**: JWT密钥请使用强随机字符串

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码变更
4. 推送到分支
5. 创建Pull Request

---

**注意**: 这是项目的第一个模块，主要完成了用户认证和权限管理。后续模块将逐步添加更多学习功能。 