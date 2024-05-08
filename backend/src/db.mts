import {
    FieldPacket,
    PoolConnection,
    ResultSetHeader,
    RowDataPacket,
    createPool
} from 'mysql2/promise'
import config from './config.mjs'

export const pool = createPool({
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database
})

/** 新增一条规则 */
export const insertRule = async (conn: PoolConnection, matchType: number, appId: number, rule: string) => {
    const stat = await conn.prepare('INSERT INTO `reply_rule` (`match_type`, `app_id`, `rule`) VALUES (?, ?, ?)')
    const [result] = await stat.execute([matchType, appId, rule]) as [ResultSetHeader, FieldPacket[]]
    if (result.affectedRows == 0) throw new Error('创建 rule 失败')
    return result.insertId
}

/** 批量为某条规则绑定多条目标 */
export const insertTargets = async (conn: PoolConnection, appId: number, ruleId: number, contents: string[]) => {
    const stat2 = await conn.prepare('INSERT INTO `reply_target` (`app_id`, `rule_id`, `content`) VALUES (?, ?, ?)')
    for (const content of contents) {
        const [result] = await stat2.execute([appId, ruleId, content]) as [ResultSetHeader, FieldPacket[]]
        if (result.affectedRows == 0) throw new Error('创建 target 失败')
    }
}

/** 更新某条规则 */
export const updateRule = async (conn: PoolConnection, matchType: number, ruleId: number, rule: string) => {
    const stat = await conn.prepare('UPDATE `reply_rule` SET `match_type` = ?, `rule` = ? WHERE `id` = ?')
    const [result] = await stat.execute([matchType, rule, ruleId]) as [ResultSetHeader, FieldPacket[]]
    if (result.affectedRows == 0) throw new Error('更新 rule 失败')
}

/** 清空某条规则的全部目标 */
export const clearTargetsOfRule = async (conn: PoolConnection, ruleId: number) => {
    const stat = await conn.prepare('DELETE FROM `reply_target` WHERE `rule_id` = ?')
    await stat.execute([ruleId]) as [ResultSetHeader, FieldPacket[]]
}

/** 清空某个 APP 的全部目标 */
export const clearTargetsOfApp = async (conn: PoolConnection, appId: number) => {
    const stat = await conn.prepare('DELETE FROM `reply_target` WHERE `app_id` = ?')
    await stat.execute([appId]) as [ResultSetHeader, FieldPacket[]]
}

/** 清空某个 APP 的全部规则，不包括删除目标 */
export const clearRulesOfApp = async (conn: PoolConnection, appId: number) => {
    const stat = await conn.prepare('DELETE FROM `reply_rule` WHERE `app_id` = ?')
    await stat.execute([appId]) as [ResultSetHeader, FieldPacket[]]
}

/** 删除规则 */
export const deleteRule = async (conn: PoolConnection, ruleId: number) => {
    const stat = await conn.prepare('DELETE FROM `reply_rule` WHERE `id` = ?')
    const [result] = await stat.execute([ruleId]) as [ResultSetHeader, FieldPacket[]]
    if (result.affectedRows == 0) throw new Error('删除 rule 失败')
}

/** 事务，删除规则，包括删除规则相关的全部目标 */
export const deleteRuleTransaction = async (conn: PoolConnection, ruleId: number) => {
    conn.beginTransaction()
    await clearTargetsOfRule(conn, ruleId)
    await deleteRule(conn, ruleId)
    conn.commit()
}

/** 事务，删除 APP，包括删除 APP 的全部规则和目标 */
export const deleteAppTransaction = async (conn: PoolConnection, appId: number) => {
    conn.beginTransaction()
    await clearTargetsOfApp(conn, appId)
    await clearRulesOfApp(conn, appId)
    await deleteApp(conn, appId)
    conn.commit()
}

export const updateRuleTransaction = async (
    conn: PoolConnection,
    appId: number,
    ruleId: number,
    matchType: number,
    rule: string,
    contents: string[]
) => {
    await conn.beginTransaction()
    // 更新已有的规则
    await updateRule(conn, matchType, ruleId, rule)
    // 清空目标，准备重新设置目标
    await clearTargetsOfRule(conn, ruleId)
    // 重新设置目标
    await insertTargets(conn, appId, ruleId, contents)
    conn.commit()
}

/** 创建一个 APP */
export const insertApp = async (conn: PoolConnection, appName: string, token: string) => {
    const stat = await conn.prepare('INSERT INTO `reply_app` (`name`, `token`) VALUES (?, ?)')
    const [result] = await stat.execute([appName, token]) as [ResultSetHeader, FieldPacket[]]
    if (result.affectedRows == 0) throw new Error('创建失败')
    return result.insertId
}

/** 更新一个 APP */
export const updateApp = async (conn: PoolConnection, appName: string, appId: number) => {
    const stat = await conn.prepare('UPDATE `reply_app` SET `name` = ? WHERE `id` = ?')
    const [result] = await stat.execute([appName, appId]) as [ResultSetHeader, FieldPacket[]]
    if (result.affectedRows == 0) throw new Error('更新失败')
}

/** 删除一个 APP */
export const deleteApp = async (conn: PoolConnection, appId: number) => {
    const stat = await conn.prepare('DELETE FROM `reply_app` WHERE `id` = ?')
    const [result] = await stat.execute([appId]) as [ResultSetHeader, FieldPacket[]]
    if (result.affectedRows == 0) throw new Error('删除失败')
}

export const selectApp = async (conn: PoolConnection, keyword: string, page: number = 0, pageSize: number = 72) => {
    const stat = await conn.prepare(`
SELECT A.*, COUNT(B.\`id\`) as rule_count 
FROM \`reply_app\` AS A 
LEFT JOIN \`reply_rule\` AS B ON A.\`id\` = B.\`app_id\` 
${keyword ? `WHERE A.\`name\` LIKE ? ` : ''}
GROUP BY A.\`id\`
ORDER BY A.\`create_time\` DESC
LIMIT ? OFFSET ?`)
    const items = [pageSize.toString(), (page * pageSize).toString()]
    const [rows] = await stat.execute(keyword ? [`%${keyword}%`, ...items] : items) as [RowDataPacket[], FieldPacket[]]
    return rows
}

export const selectRule = async (conn: PoolConnection, appId: number, keyword: string, page: number = 0, pageSize: number = 72) => {
    const stat = await conn.prepare(`SELECT R.*, T.content FROM \`reply_rule\` AS R
    JOIN \`reply_target\` AS T ON R.id = T.rule_id
    WHERE R.\`app_id\` = ?
    ${keyword ? `AND ( R.\`match_type\` = 0 AND R.\`rule\` = ? )
	OR ( R.\`match_type\` = 1 AND ? LIKE CONCAT( '%', R.rule, '%' ))
	OR ( R.\`match_type\` = 2 AND ? REGEXP R.rule )` : ''}
    ORDER BY R.\`create_time\` DESC
    LIMIT ? OFFSET ?`)
    const [rows] = await stat.execute(keyword ?
        [appId, keyword, keyword, keyword, pageSize.toString(), (page * pageSize).toString()] :
        [appId, pageSize.toString(), (page * pageSize).toString()]) as [RowDataPacket[], FieldPacket[]]
    return rows
}

export const getAppToken = async (conn: PoolConnection, appId: number) => {
    const stat = await conn.prepare('SELECT `token` FROM `reply_app` WHERE `id` = ?')
    const [result] = await stat.execute([appId]) as [RowDataPacket[], FieldPacket[]]
    if (result.length == 0) throw new Error('获取 token 失败')
    return result[0].token as string
}

export const resetAppToken = async (conn: PoolConnection, appId: number, token: string) => {
    const stat = await conn.prepare('UPDATE `reply_app` SET `token` = ? WHERE `id` = ?')
    const [result] = await stat.execute([token, appId]) as [ResultSetHeader, FieldPacket[]]
    if (result.affectedRows == 0) throw new Error('重置 token 失败')
}
