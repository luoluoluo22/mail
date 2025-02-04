# QQ邮件查看器

一个基于 Netlify Functions 的 QQ 邮件查看器，支持查看最新邮件和历史邮件列表。

## 功能特点

- 🔒 密码保护访问
- 💾 支持记住密码
- 📧 完整显示最新邮件内容
- 📑 历史邮件列表预览
- 🎨 现代化的用户界面
- 📱 响应式设计
- ⚡ 实时邮件获取

## 部署步骤

1. Fork 本仓库或克隆到本地：
```bash
git clone https://github.com/luoluoluo22/mail.git
cd mail
```

2. 安装依赖：
```bash
npm install
```

3. 在 Netlify 中创建新站点：
   - 登录 Netlify 账户
   - 点击 "New site from Git"
   - 选择您的仓库
   - 构建命令设置为：`npm run build`
   - 发布目录设置为：`functions-build`

4. 配置环境变量：
   在 Netlify 的站点设置中，添加以下环境变量：
   - `APP_PASSWORD`: 访问密码（默认：123456）
   - `JWT_SECRET`: JWT 密钥（推荐使用随机字符串）

5. 配置 QQ 邮箱：
   - 登录 QQ 邮箱
   - 开启 IMAP 服务
   - 获取授权码
   - 在 `functions/email_handler.ts` 中更新配置：
     ```typescript
     const config = {
       user: '您的QQ邮箱@qq.com',
       password: '您的授权码',
       host: 'imap.qq.com',
       port: 993,
       tls: true,
       tlsOptions: { rejectUnauthorized: false }
     };
     ```

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 创建 `.env` 文件：
```
APP_PASSWORD=123456
JWT_SECRET=your-secret-key
```

3. 运行开发服务器：
```bash
netlify dev
```

## 技术栈

- 前端：
  - HTML5
  - Tailwind CSS
  - JavaScript

- 后端：
  - Netlify Functions
  - TypeScript
  - Node.js

- 功能：
  - IMAP 邮件获取
  - JWT 认证
  - 响应式设计

## 目录结构

```
.
├── functions/              # Netlify Functions 源码
│   ├── auth.ts            # 认证处理
│   └── email_handler.ts   # 邮件处理
├── app.js                 # 前端 JavaScript
├── index.html            # 主页面
├── favicon.svg           # 网站图标
└── package.json         # 项目配置
```

## 注意事项

1. 安全性：
   - 请修改默认密码
   - 使用强密码作为 JWT 密钥
   - 不要在代码中硬编码敏感信息

2. 性能：
   - 默认只获取最新的10封邮件
   - 邮件内容会缓存在内存中

3. 限制：
   - 需要 QQ 邮箱开启 IMAP 服务
   - 依赖 Netlify Functions 服务
   - 受限于 Netlify 免费套餐限制

## 常见问题

1. 登录失败
   - 检查密码是否正确
   - 确认环境变量是否配置
   - 查看浏览器控制台错误信息

2. 无法获取邮件
   - 确认 QQ 邮箱配置正确
   - 检查 IMAP 服务是否开启
   - 验证授权码是否有效

3. 部署问题
   - 确保所有依赖已安装
   - 检查构建命令是否正确
   - 查看 Netlify 部署日志

## 更新日志

### v1.0.0
- 初始版本发布
- 基本邮件查看功能
- 密码保护和认证
- 响应式界面设计

## 许可证

MIT License 