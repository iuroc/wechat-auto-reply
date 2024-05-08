import { Router } from 'express'
import CryptJS from 'crypto-js'
import { getAppToken, pool } from '../../db.mjs'
import { PoolConnection } from 'mysql2/promise'
import { sendError, sendRes } from '../../util/res.mjs'
import XML2JS from 'xml2js'
import { InputMessage } from './message.mjs'
import { MyInputHandler } from './handle.mjs'

const router = Router()

router.get('/:appId', async (req, res) => {
    let conn: PoolConnection | undefined
    try {
        const signature = req.query.signature
        const timestamp = req.query.timestamp
        const nonce = req.query.nonce
        const echostr = req.query.echostr
        const appId = parseInt(req.params.appId)
        if (isNaN(appId)) throw new Error('请输入正确的 :appId')
        conn = await pool.getConnection()
        const token = await getAppToken(conn, appId)
        const fields = [token, timestamp, nonce]
        const result = CryptJS.SHA1(fields.sort().join('')).toString(CryptJS.enc.Hex)
        if (result == signature) res.send(echostr)
        else sendRes(res, false, '校验失败')
    } catch (error) {
        sendError(res, error)
    } finally {
        conn?.release()
    }
})

router.post('/:appId', async (req, res) => {
    try {
        const appId = parseInt(req.params.appId)
        if (isNaN(appId)) throw new Error('请输入正确的 appId')
        const input = await XML2JS.parseStringPromise((req as any).xmlBody) as InputMessage
        if (!input) throw new Error('请求体不是正确的 XML')
        new MyInputHandler(res, input, appId)
    } catch (error) {
        if (error instanceof Error) sendRes(res, false, error.message)
    }
})

export default router