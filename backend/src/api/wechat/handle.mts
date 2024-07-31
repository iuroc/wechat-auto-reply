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
        return selectRule(conn, this.appId, content)
    }

    /** @override */
    protected async textHandler() {
        let conn: PoolConnection | undefined
        try {
            conn = await pool.getConnection()
            if (await this.matchCustomTextRule(conn)) return conn.release()

            const inputContent = (this.input as InputTextMessage).xml.Content[0]
            const matchResult = await this.selectRule(conn, inputContent)

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
    protected async matchCustomTextRule(conn: PoolConnection): Promise<boolean> {
        const content = (this.input as InputTextMessage).xml.Content[0]
        if (content.startsWith('dj ')) {
            const match = content.match(/^dj\s+(\S+)(?:\s+(\d+))?/) as RegExpMatchArray
            const djName = match[1]
            const page = match[2] || 2
            let outputContent = ''
            if (djName.length == 0) {
                outputContent = '短剧名称不能为空'
            }
            else {
                const resData = await fetch(`https://api.hytys.cn/api/?path=movies&page=${page}&limit=10&name=${djName}`).then(res => res.json()) as { data: { rows: { name: string, createAt: string, link: string }[], total: number } }
                const searchResult = resData.data.rows.map(line => {
                    return line.name + '\n' + line.link + '\n' + new Date(parseInt(line.createAt) * 1000).toLocaleString()
                })
                if (searchResult.length == 0) {
                    outputContent = '暂无搜索结果'
                } else {
                    outputContent = searchResult.join('\n\n')
                    outputContent += `当前第${page}页，共${(resData.data.total - 1) / 10 + 1}页`
                }
            }
            this.res.send(this.makeOutput<OutputTextMessage>({
                Content: [outputContent],
                MsgType: ['text']
            }))
            return true
        }
        switch (content) {
            case 'yz':
                const target = await this.getRandromMatch(conn)
                this.yzCustomRule(target)
                break
            default:
                return false
        }
        return true
    }

    async getRandromMatch(conn: PoolConnection) {
        const inputContent = (this.input as InputTextMessage).xml.Content[0]
        const match = await this.selectRule(conn, inputContent)
        const index = Math.floor(Math.random() * match.length)
        const target = match[index].content as string
        return target
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
