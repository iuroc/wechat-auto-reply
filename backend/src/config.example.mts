export default {
    mysql: {
        host: process.env.MYSQL_HOST || '127.0.0.1',
        port: process.env.MYSQL_PORT || '3306',
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASS || '12345678',
        database: 'wechat_auto_reply'
    },
    root: process.env.ROOT_PASS || 'github@iuroc@root',
    jwt: process.env.JWT_KEY || 'github@iuroc@jwt',
    gptUse: process.env.GPT_USE || false,
    gpt: {
        baseURL: process.env.GPT_BASEURL || 'https://api.openai.com/v1',
        apiKey: process.env.GPT_APIKEY || 'sk-xxxxxxxxxxxxxxxxxx',
    }
}