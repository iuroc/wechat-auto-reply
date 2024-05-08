# Wechat Auto Reply

> 微信公众号关键词回复管理程序


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

|      名称      |       描述          |
|      ---       |       ---           |
|   ROOT_PASS    |   管理员密码         |
|   JWT_KEY      |   JWT 密钥          |
|   MYSQL_HOST   |   数据库主机         |
|   MYSQL_PORT   |   数据库端口         |
|   MYSQL_USER   |   数据库用户名       |
|   MYSQL_PASS   |   数据库密码         |
|   GPT_BASEURL  |   ChatGPT 接口地址   |
|   GPT_APIKEY   |   ChatGPT APIKEY    |

## 设置用户关注后回复

点击创建规则，将规则设置为 `[[subscribe]]`，然后设置回复内容即可。

## 设置无匹配结果时默认回复

点击创建规则，将规则设置为 `[[default]]`，然后设置回复内容即可。

## 相关技术

- TypeScript
- Node.js
- Express
- Van.js
- Bootstrap
- MySQL