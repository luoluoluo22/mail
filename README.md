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
   - `EMAIL_USER`: QQ邮箱账号（例如：123456789@qq.com）
   - `EMAIL_PASSWORD`: QQ邮箱IMAP授权码
   - `EMAIL_HOST`: 邮箱服务器地址（默认：imap.qq.com）
   - `EMAIL_PORT`: 邮箱服务器端口（默认：993）

5. 配置 QQ 邮箱：
   - 登录 QQ 邮箱
   - 开启 IMAP 服务
   - 获取授权码
   - 将授权码配置到环境变量 `EMAIL_PASSWORD` 中

## QQ邮箱配置详细步骤

1. 登录QQ邮箱网页版：
   - 访问 https://mail.qq.com
   - 使用QQ号和密码登录

2. 开启IMAP服务：
   - 点击"设置" -> "账户"
   - 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
   - 开启"IMAP/SMTP服务"
   - 如果是首次开启，需要验证QQ密码

3. 获取授权码：
   - 开启服务后，会提示"生成授权码"
   - 点击"生成授权码"按钮
   - 根据提示完成验证
   - 保存生成的授权码（16位字符）

4. 配置环境变量：
   - 在Netlify的环境变量设置中：
     ```
     EMAIL_USER=您的QQ邮箱地址
     EMAIL_PASSWORD=刚才获取的授权码（16位）
     EMAIL_HOST=imap.qq.com
     EMAIL_PORT=993
     ```
   - 确保所有值都正确填写，不要有多余的空格
   - 保存环境变量设置

5. 常见问题：
   - 如果提示认证失败，请检查：
     * 授权码是否正确（不是QQ密码）
     * 邮箱地址是否正确
     * IMAP服务是否处于开启状态
   - 如果提示连接超时：
     * 检查防火墙设置
     * 确认网络连接正常
     * 尝试重新生成授权码

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 创建 `.env` 文件：
```
APP_PASSWORD=123456
JWT_SECRET=your-secret-key
EMAIL_USER=your-qq@qq.com
EMAIL_PASSWORD=your-imap-password
EMAIL_HOST=imap.qq.com
EMAIL_PORT=993
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