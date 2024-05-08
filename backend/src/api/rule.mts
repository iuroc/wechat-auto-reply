import { Router } from 'express'
import { PoolConnection } from 'mysql2/promise'
import { sendError, sendRes } from '../util/res.mjs'
import { deleteRuleTransaction, insertRule, insertTargets, pool, selectRule, updateRule, updateRuleTransaction } from '../db.mjs'
import { checkJWTMiddleware, getString } from '../util/main.mjs'

const router = Router()

router.post('/create', checkJWTMiddleware, async (req, res) => {
    let conn: PoolConnection | undefined
    try {
        conn = await pool.getConnection()

        await conn.beginTransaction()

        const appId = parseInt(req.body.appId)
        if (isNaN(appId)) throw new Error('请输入正确的 appId')

        const matchType = parseInt(req.body.matchType)
        if (isNaN(matchType)) throw new Error('请输入正确的 matchType')

        const rule = getString(req.body, 'rule')
        if (rule == '') throw new Error('请输入正确的 rule')

        const contents = req.body.contents as string[]
        if (!Array.isArray(contents)) throw new Error('请输入正确的 contents')
        if (contents.length == 0) throw new Error('请输入至少一条 content')
        const ruleId = await insertRule(conn, matchType, appId, rule)
        await insertTargets(conn, appId, ruleId, contents)
        await conn.commit()
        sendRes(res, true, '创建成功', { ruleId })
    } catch (error) {
        await conn?.rollback()
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

        const ruleId = parseInt(req.body.ruleId)
        if (isNaN(ruleId)) throw new Error('请输入正确的 ruleId')

        const matchType = parseInt(req.body.matchType)
        if (isNaN(matchType)) throw new Error('请输入正确的 matchType')

        const rule = getString(req.body, 'rule')
        if (rule == '') throw new Error('请输入正确的 rule')

        const contents = req.body.contents as string[]
        if (!Array.isArray(contents)) throw new Error('请输入正确的 contents')
        if (contents.length == 0) throw new Error('请输入至少一条 content')
        await updateRuleTransaction(conn, appId, ruleId, matchType, rule, contents)
        sendRes(res, true, '更新成功')
    } catch (error) {
        conn?.rollback()
        sendError(res, error)
    } finally {
        conn?.release()
    }
})



router.post('/delete', checkJWTMiddleware, async (req, res) => {
    let conn: PoolConnection | undefined
    try {
        conn = await pool.getConnection()
        const ruleId = parseInt(req.body.ruleId)
        if (isNaN(ruleId)) throw new Error('请输入正确的 ruleId')
        await deleteRuleTransaction(conn, ruleId)
        sendRes(res, true, '删除成功')
    } catch (error) {
        conn?.rollback()
        sendError(res, error)
    } finally {
        conn?.release()
    }
})

router.post('/match', checkJWTMiddleware, async (req, res) => {
    let conn: PoolConnection | undefined
    try {
        conn = await pool.getConnection()
        const appId = parseInt(req.body.appId)
        if (isNaN(appId)) throw new Error('请输入正确的 appId')
        const page = parseInt(req.body.page) || 0
        const pageSize = parseInt(req.body.pageSize) || 72
        const keyword = getString(req.body, 'keyword')
        const rows = await selectRule(conn, appId, keyword, page, pageSize)
        const ruleMap = new Map<number, { [key: string]: any, contents: string[] }>()
        rows.forEach(row => {
            const { content } = row
            delete row.content
            if (!ruleMap.has(row.id)) {
                ruleMap.set(row.id, { ...row, contents: [] })
            }
            ruleMap.get(row.id)?.contents.push(content)
        })
        sendRes(res, true, '获取成功', Array.from(ruleMap.values()))
    } catch (error) {
        sendError(res, error)
    } finally {
        conn?.release()
    }
})

export default router