import { Router } from 'express'
import loginApi from './api/login.mjs'
import appApi from './api/app.mjs'
import ruleApi from './api/rule.mjs'
import wechatApi from './api/wechat/index.mjs'

const router = Router()

router.use('/api/login', loginApi)
router.use('/api/app', appApi)
router.use('/api/rule', ruleApi)
router.use('/api/wechat', wechatApi)

export default router