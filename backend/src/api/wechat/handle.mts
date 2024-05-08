import { Response } from 'express'
import { InputHandler, InputMessage, InputTextMessage, OutputTextMessage } from './message.mjs'
import { pool, selectRule } from '../../db.mjs'
import { PoolConnection } from 'mysql2/promise'
import { openai } from './chatgpt.mjs'
import config from '../../config.mjs'

export class MyInputHandler extends InputHandler {
    constructor(res: Response, input: InputMessage, public appId: number) {
        super(res, input)
    }

    /** @override */
    protected async textHandler() {
        let conn: PoolConnection | undefined
        try {
            conn = await pool.getConnection()
            const matchResult = await selectRule(conn, this.appId, (this.input as InputTextMessage).xml.Content[0])
            if (matchResult.length == 0) {
                // 如果允许使用 ChatGPT，则优先使用
                if (config.gptUse) return config.gptUse && this.gptHandler()
                // 不能使用 ChatGPT，则尝试获取默认回复
                const defaultResult = await selectRule(conn, this.appId, '[[default]]')
                const index = Math.floor(Math.random() * defaultResult.length)
                if (defaultResult.length > 0) {
                    return this.res.send(this.makeOutput<OutputTextMessage>({
                        Content: [defaultResult[index].content],
                        MsgType: ['text']
                    }))
                } else throw new Error('暂时没有获取匹配的结果')
            }
            const index = Math.floor(Math.random() * matchResult.length)
            this.res.send(this.makeOutput<OutputTextMessage>({
                Content: [matchResult[index].content],
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
}