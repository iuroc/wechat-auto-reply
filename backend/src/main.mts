import express, { NextFunction, Response, Request } from 'express'
import { getIps } from './util/main.mjs'
import router from './router.mjs'
import { sendRes } from './util/res.mjs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import cookieParser from 'cookie-parser'

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use((req, _, next) => {
    if (req.is('text/xml')) {
        let data = ''
        req.on('data', chunk => {
            data += chunk
        })
        req.on('end', () => {
            (req as any).xmlBody = data
            next()
        })
    } else next()
})
app.use(router)

app.use(express.static(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'frontend', 'dist')))

app.use((err: Error, _: Request, res: Response, __: NextFunction) => {
    sendRes(res, false, err.message)
})

const port = parseInt(process.argv[2]) || 9090
app.listen(port, '0.0.0.0')
console.log(getIps().map(ip => `👉 http://${ip}:${port}`).join('\n'))