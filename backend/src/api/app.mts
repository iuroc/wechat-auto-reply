import { Router } from 'express'
import { deleteAppTransaction, insertApp, pool, resetAppToken, selectApp, updateApp } from '../db.mjs'
import { sendError, sendRes } from '../util/res.mjs'
import { checkJWTMiddleware, getString, makeAppToken } from '../util/main.mjs'
import { PoolConnection } from 'mysql2/promise'

const router = Router()

router.post('/create', checkJWTMiddleware, async (req, res) => {
    let conn: PoolConnection | undefined
    try {
        conn = await pool.getConnection()
        const appName = getString(req.body, 'appName')
        if (appName == '') throw new Error('请输入正确的 appName')

        const token = makeAppToken()

        sendRes(res, true, '创建成功', { appId: await insertApp(conn, appName, token), appName, token })
    } catch (error) {
        sendError(res, error)
    } finally {
        conn?.release()
    }
})

router.post('/update', checkJWTMiddleware, async (req, res) => {
    let conn: PoolConnection | undefined
    try {
        conn = await pool.getConnection()
        const appId = parseInt(req.body.appId)

        if (isNaN(appId)) throw new Error('请输入正确的 appId')
        const appName = getString(req.body, 'appName')

        if (appName == '') throw new Error('请输入正确的 appName')

        await updateApp(conn, appName, appId)
        sendRes(res, true, '更新成功', { appId, appName })
    } catch (error) {
        sendError(res, error)
    } finally {
        conn?.release()
    }
})

router.post('/delete', checkJWTMiddleware, async (req, res) => {
    let conn: PoolConnection | undefined
    try {
        conn = await pool.getConnection()
        const appId = parseInt(req.body.appId)
        if (isNaN(appId)) throw new Error('请输入正确的 appId')
        await deleteAppTransaction(conn, appId)
        sendRes(res, true, '删除成功')
    } catch (error) {
        sendError(res, error)
    } finally {
        conn?.release()
    }
})

router.post('/list', checkJWTMiddleware, async (req, res) => {
    let conn: PoolConnection | undefined
    try {
        conn = await pool.getConnection()
        const keyword = getString(req.body, 'keyword')
        const page = parseInt(req.body.page) || 0
        const pageSize = parseInt(req.body.pageSize) || 72
        sendRes(res, true, '获取成功', await selectApp(conn, keyword, page, pageSize))
    } catch (error) {
        sendError(res, error)
    } finally {
        conn?.release()
    }
})

router.post('/resetToken', async (req, res) => {
    let conn: PoolConnection | undefined
    try {
        conn = await pool.getConnection()
        const appId = parseInt(req.body.appId)
        if (isNaN(appId)) throw new Error('请输入正确的 appId')
        const newToken = makeAppToken()
        await resetAppToken(conn, appId, newToken)
        sendRes(res, true, '重置成功', { token: newToken })
    } catch (error) {
        sendError(res, error)
    } finally {
        conn?.release()
    }
})

export default router