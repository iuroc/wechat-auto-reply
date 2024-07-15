# Wechat Auto Reply

> 微信公众号关键词回复助手

## 功能概述

- 可创建多个应用，每个应用独立设置关键词匹配规则
- 每个应用独立分配 token 和接口 URL
- 可配置 ChatGPT 接口
- 支持匹配方式
  - 完全匹配
  - 包含匹配
  - 正则匹配
- 支持被动回复类型
  - 文本消息回复
  - 图片消息回复
  - 链接消息回复
  - 位置信息回复
  - 短视频消息回复
  - 视频消息回复
  - 语音消息回复
  - 事件推送处理
- 支持事件推送类型
  - 用户关注事件
  - 用户取消关注事件
  - 用户未关注状态扫描二维码，然后关注
  - 扫描带参数二维码事件
  - 自定义菜单事件 - 点击菜单跳转链接时的事件推送
  - 自定义菜单事件 - 点击菜单拉取消息时的事件推送
  - 上报地理位置事件
- 更多信息请参考：[基础消息能力 / 接收普通消息](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Receiving_standard_messages.html)

## 快速开始

- 执行下面的代码
  ```bash
  git clone https://github.com/iuroc/wechat-auto-reply.git
  cd wechat-auto-reply
  npm config set registry https://registry.npmmirror.com/
  npm install
  cp backend/src/config.example.mts backend/src/config.mts
  ```
- 在 `backend/src/config.mts` 中配置数据库信息和加密参数
- 将 `init.sql` 文件导入 MySQL 数据库
- 开发环境
  ```bash
  npm run backend:dev:tsc    # 启动 TypeScript 自动编译
  npm run backend:dev:serve  # 启动开发环境 HTTP 服务器
  npm run frontend:dev       # 启动 Vite 前端开发环境
  ```
- 生产环境
  ```bash
  npm run build
  npm run start
  ```

## 环境变量

| 名称        | 描述             | 默认值                    |
| ----------- | ---------------- | ------------------------- |
| ROOT_PASS   | 管理员密码       | github@iuroc@root         |
| JWT_KEY     | JWT 密钥         | github@iuroc@jwt          |
| MYSQL_HOST  | 数据库主机       | 127.0.0.1                 |
| MYSQL_PORT  | 数据库端口       | 3306                      |
| MYSQL_USER  | 数据库用户名     | root                      |
| MYSQL_PASS  | 数据库密码       | 12345678                  |
| GPT_BASEURL | ChatGPT 接口地址 | https://api.openai.com/v1 |
| GPT_APIKEY  | ChatGPT APIKEY   | sk-xxxxxxxxxxxxxxxxxx     |
| GPT_USE     | 是否启用 ChatGPT | false                     |

## 设置用户关注后回复

点击创建规则，将规则设置为 `[[subscribe]]`，然后设置回复内容即可。

## 设置无匹配结果时默认回复

点击创建规则，将规则设置为 `[[default]]`，然后设置回复内容即可。

## 高级设置

### 插件开发

在 `MyInputHandler.matchCustomTextRule` 方法中编写规则，要求最后返回布尔值，代表当前是否命中插件规则，如果已经命中，则不会进行之后的系统匹配。

### 配置微信登录

- 新建一条 `yz` 规则，目标内容为 JSON 字符串，格式如下：

  ```json
  {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "12345678",
    "database": "wechat_vercode",
    "table": "wechat_vercode"
  }
  ```

- 前端用户扫码，进入公众号
- 用户发送 `yz`，自动回复验证码
- 用户将验证码填入前端表单，点击登录
- 服务器校验验证码，匹配项目用户，如果项目用户不存在则自动创建，返回登录信息

## 相关技术

- TypeScript
- Node.js
- Express
- Van.js
- Bootstrap
- MySQL
