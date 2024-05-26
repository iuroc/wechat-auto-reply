import { Response } from 'express'
import { InputHandler, InputMessage, InputTextMessage, OutputTextMessage } from './message.mjs'
import { pool, selectRule } from '../../db.mjs'
import { Connection, PoolConnection, createConnection } from 'mysql2/promise'
import { openai } from './chatgpt.mjs'
import config from '../../config.mjs'

export class MyInputHandler extends InputHandler {
    constructor(res: Response, input: InputMessage, public appId: number) {
        super(res, input)
    }

    private selectRule(conn: PoolConnection, content: string) {
        return selectRule(conn, this.appId, (this.input as InputTextMessage).xml.Content[0])
    }

    /** @override */
    protected async textHandler() {
        let conn: PoolConnection | undefined
        try {
            conn = await pool.getConnection()
            const matchResult = await this.selectRule(conn, (this.input as InputTextMessage).xml.Content[0])

            if (matchResult.length == 0) {
                // 如果允许使用 ChatGPT，则优先使用
                if (config.gptUse) {
                    conn.release()
                    return config.gptUse && this.gptHandler()
                }
                // 不能使用 ChatGPT，则尝试获取默认回复
                const defaultResult = await selectRule(conn, this.appId, '[[default]]')
                const index = Math.floor(Math.random() * defaultResult.length)
                if (defaultResult.length > 0) {
                    conn.release()
                    return this.res.send(this.makeOutput<OutputTextMessage>({
                        Content: [defaultResult[index].content],
                        MsgType: ['text']
                    }))
                } else throw new Error('暂时没有获取匹配的结果')
            }

            const index = Math.floor(Math.random() * matchResult.length)
            const target = matchResult[index].content as string

            if (this.matchCustomTextRule(target)) return conn.release()
            this.res.send(this.makeOutput<OutputTextMessage>({
                Content: [target],
                MsgType: ['text']
            }))
        } catch (error) {
            this.res.send('success')
        } finally {
            conn?.release()
        }
    }

    protected async gptHandler() {
        const content = (this.input as InputTextMessage).xml.Content[0]
        const response = await openai.chat.completions.create({
            messages: [{
                role: 'user',
                content: content
            }],
            model: 'gpt-3.5-turbo-1106'
        })
        const responseText = response.choices[0].message.content
        if (!responseText) return this.makeOutput<OutputTextMessage>({
            Content: ['暂时没有找到您要的答案哦'],
            MsgType: ['text']
        })
        this.res.send(this.makeOutput<OutputTextMessage>({
            MsgType: ['text'],
            Content: [responseText]
        }))
    }

    /** @override */
    protected subscribeEventHandler(): void {
        (this.input as InputTextMessage).xml.Content = ['[[subscribe]]']
        this.textHandler()
    }

    /** 匹配自定义文本规则，可开发自定义插件
     * 
     * 请通过 `this.res.send(this.makeOutput<>({}))` 响应请求
     * 
     * @returns 是否匹配成功
     */
    protected matchCustomTextRule(target: string): boolean {
        let matchResult = true
        const content = (this.input as InputTextMessage).xml.Content[0]
        switch (content) {
            case 'yz':
                this.yzCustomRule(target)
                break
            default:
                matchResult = false
        }
        return matchResult
    }

    /** 验证登录，自动向指定的数据表插入和当前微信 ID 关联的 6 位数字验证码 */
    protected async yzCustomRule(target: string) {
        const xmlData = (this.input as InputTextMessage).xml
        let conn: Connection | undefined
        try {
            const config = JSON.parse(target) as {
                host: string
                port: number
                user: string
                password: string
                database: string
                table: string
            }
            conn = await createConnection({
                host: config.host,
                port: config.port,
                user: config.user,
                password: config.password,
                database: config.database
            })
            await conn.query(`CREATE TABLE IF NOT EXISTS \`${config.table}\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`from_user\` VARCHAR(50) NOT NULL,
                \`vercode\` VARCHAR(20) NOT NULL,
                \`create_time\` DATETIME DEFAULT CURRENT_TIMESTAMP
            )`)
            const vercode = Math.floor(Math.random() * 900000) + 100000
            const fromUser = xmlData.FromUserName[0]
            const stat = await conn.prepare('INSERT INTO `' + config.table + '` (`from_user`, `vercode`) VALUES (?, ?)')
            await stat.execute([fromUser, vercode])
            this.res.send(this.makeOutput<OutputTextMessage>({
                Content: [vercode.toString()],
                MsgType: ['text']
            }))
        } catch (error) {
            if (error instanceof Error) console.log(error.message)
            this.res.send('success')
        } finally {
            conn?.end()
        }
    }
}