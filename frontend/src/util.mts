import { routeTo } from 'vanjs-router'

export const checkLogin = async () => {
    if (hasLogin.val) return true
    const data = await fetch('/api/login/check').then(res => res.json())
    if (!data.success) routeTo('login')
    hasLogin.val = data.success
    return data.success
}

export const hasLogin = { val: false }

export const randomString = (length: number): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const charactersLength = characters.length
    for (let i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    return result
}