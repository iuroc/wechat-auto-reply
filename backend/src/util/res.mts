import { Response } from 'express'

export const sendRes = (res: Response, success: boolean, message: string, data?: any) => {
    res.send({ success, message, data })
}

/**
 * 将异常信息响应给前端
 * @param res 响应对象
 * @param errorOrStr 捕获的异常或者自定义字符串
 */
export const sendError = (res: Response, errorOrStr: unknown) => {
    if (errorOrStr instanceof Error) sendRes(res, false, errorOrStr.message)
    else if (typeof errorOrStr == 'string') sendRes(res, false, errorOrStr)
}