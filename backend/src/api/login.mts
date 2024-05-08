import { Router } from 'express'
import jwt from 'jsonwebtoken'
import config from '../config.mjs'
import { sendRes } from '../util/res.mjs'
import { checkJWTMiddleware } from '../util/main.mjs'

const router = Router()

router.post('/', (req, res) => {
    const password: string | undefined = req.body.password
    if (!password) throw res.clearCookie('token'), new Error('密码不能为空')
    if (password != config.root) throw res.clearCookie('token'), new Error('密码错误')
    res.cookie('token', jwt.sign({}, config.jwt, {
        expiresIn: '30d'
    }), {
        maxAge: 30 * 24 * 60 * 60 * 1000
    })
    sendRes(res, true, '登录成功')
})

router.get('/check', checkJWTMiddleware, (req, res) => {
    sendRes(res, true, '登录成功')
})

export default router