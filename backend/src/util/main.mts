import { networkInterfaces, NetworkInterfaceInfo } from 'os'
import { Response, Request, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import config from '../config.mjs'
import CryptoJS from 'crypto-js'

const { verify } = jwt

export const getIps = () => {
    const interfaces = networkInterfaces()
    const ips: string[] = []
    for (const name in interfaces) {
        const info = interfaces[name] as NetworkInterfaceInfo[]
        if (!info) throw new Error('获取')
        for (const item of info) {
            if (item.family === 'IPv4') ips.push(item.address)
        }
    }
    return ips
}

export const getString = (object: any, key: string): string => {
    return typeof object == 'undefined' ? '' : typeof object[key] == 'undefined' ? '' : object[key].toString()
}


/** 用于校验 JWT 的中间件，可通过 `req['userId']` 获取用户 ID */
export const checkJWTMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token ?? ''
    try {
        verify(token, config.jwt)
        next()
    } catch {
        res.clearCookie('token')
        throw new Error('身份校验失败，请先完成登录')
    }
}


export const makeAppToken = () => CryptoJS.MD5((Date.now() + Math.random() * 1000).toString()).toString(CryptoJS.enc.Hex)