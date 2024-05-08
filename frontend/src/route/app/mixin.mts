import van from 'vanjs-core'
import { AppListItemCard } from './view.mts'

export const fetchAppList = async (options?: {
    page?: number
    pageSize?: number
    keyword?: string
}) => {
    const data = await fetch('/api/app/list', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            keyword: options?.keyword ?? '',
            page: options?.page ?? 0,
            pageSize: options?.pageSize ?? 72
        })
    }).then(res => res.json())
    if (!data.success) throw new Error(data.message)
    return data.data as AppData[]
}

export type AppData = {
    id: number
    name: string
    token: string
    rule_count: number
    create_time: string
}

export const createApp = async (appName: string) => {
    const data = await fetch('api/app/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            appName
        })
    }).then(res => res.json())
    if (!data.success) throw new Error(data.message)
    return data.data as { appId: number, appName: string, token: string }
}

export const updateApp = async (appId: number, appName: string) => {
    const data = await fetch('api/app/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            appId,
            appName
        })
    }).then(res => res.json())
    if (!data.success) throw new Error(data.message)
    return data.data
}

export const reloadAppList = async () => {
    const appList = await fetchAppList()
    const appListEle = document.getElementById('app-list') as HTMLDivElement
    appListEle.innerHTML = ''
    van.add(appListEle, appList.map(AppListItemCard))
}

export const deleteApp = async (appId: number) => {
    const data = await fetch('api/app/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            appId
        })
    }).then(res => res.json())
    if (!data.success) throw new Error(data.message)
}

export const resetToken = async (appId: number) => {
    const data = await fetch('api/app/resetToken', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            appId
        })
    }).then(res => res.json())
    if (!data.success) throw new Error(data.message)
    return data.data.token as string
}