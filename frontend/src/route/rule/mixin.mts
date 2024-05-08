export const matchRuleList = async (appId: number, options: {
    page?: number
    pageSize?: number
    keyword?: string
} = {}) => {
    const data = await fetch('/api/rule/match', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            appId,
            keyword: options.keyword ?? '',
            page: options.page ?? 0,
            pageSize: options.pageSize ?? 72
        })
    }).then(res => res.json())
    if (!data.success) throw new Error(data.message)
    return data.data as RuleData[]
}

export type RuleData = {
    id: number
    rule: string
    app_id: number
    contents: string[]
    match_type: number
    create_time: string
}

export const deleteRule = async (ruleId: number) => {
    const data = await fetch('/api/rule/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ruleId
        })
    }).then(res => res.json())
    if (!data.success) throw new Error(data.message)
    return data.data
}

export const createRule = async (appId: number, matchType: number, rule: string, contents: string[]) => {
    const data = await fetch('/api/rule/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            appId, matchType, rule, contents
        })
    }).then(res => res.json())
    if (!data.success) throw new Error(data.message)
    return data.data
}

export const matchTypeTexts = ['完全匹配', '包含匹配', '正则匹配']

export const updateRule = async (appId: number, ruleId: number, matchType: number, rule: string, contents: string[]) => {
    const data = await fetch('/api/rule/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            appId, ruleId, matchType, rule, contents
        })
    }).then(res => res.json())
    if (!data.success) throw new Error(data.message)
    return data.data
}
