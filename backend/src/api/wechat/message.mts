import { Response } from 'express'
import XML2JS from 'xml2js'

export class InputHandler {
    private builder = new XML2JS.Builder()
    constructor(protected res: Response, protected input: InputMessage) {
        switch (input.xml.MsgType[0]) {
            case 'text':
                this.textHandler()
                break
            case 'image':
                this.imageHandler()
                break
            case 'link':
                this.linkHandler()
                break
            case 'location':
                this.locationHandler()
                break
            case 'shortvideo':
                this.shortvideoHandler()
                break
            case 'video':
                this.videoHandler()
                break
            case 'voice':
                this.voiceHandler()
                break
            case 'event':
                this.eventHandler()
                break
            default:
                res.send('success')
        }
    }
    /** 短视频消息回复 */
    protected shortvideoHandler() {
        this.res.send('success')
    }
    /** 视频消息回复 */
    protected videoHandler() {
        this.res.send('success')
    }
    /** 语音消息回复 */
    protected voiceHandler() {
        this.res.send('success')
    }
    /** 位置信息回复 */
    protected locationHandler() {
        this.res.send('success')
    }
    /** 文本消息回复 */
    protected textHandler() {
        this.res.send('success')
    }
    /** 图片消息回复 */
    protected imageHandler() {
        this.res.send('success')
    }
    /** 链接消息回复 */
    protected linkHandler() {
        this.res.send('success')
    }

    /** 事件推送处理 */
    protected eventHandler() {
        switch ((this.input as InputEventMessage).xml.Event[0]) {
            case 'subscribe':
                if (!(this.input as InputQREventMessage).xml.Ticket) this.subscribeEventHandler()
                else this.subscribeQREventHandler()
                break
            case 'unsubscribe':
                this.unsubscribeEventHandler()
                break
            case 'VIEW':
                this.viewEventHandler()
                break
            case 'CLICK':
                this.clickEventHandler()
                break
            case 'LOCATION':
                this.locationEventHandler()
                break
            case 'SCAN':
                this.scanHandler()
                break
            default:
                this.res.send('success')
        }
    }
    /** 用户未关注状态扫描二维码，然后关注
     * 
     * 默认自动调用 `subscribeEventHandler` 和 `scanHandler` 方法，覆写本方法后可执行自定义事件 */
    protected subscribeQREventHandler() {
        this.subscribeEventHandler()
        this.scanHandler()
    }
    /** 自定义菜单事件 - 点击菜单拉取消息时的事件推送 */
    protected clickEventHandler() {
        this.res.send('success')
    }
    /** 上报地理位置事件 */
    protected locationEventHandler() {
        this.res.send('success')
    }
    /** 扫描带参数二维码事件 */
    protected scanHandler() {
        this.res.send('success')
    }
    /** 取消关注事件 */
    protected unsubscribeEventHandler() {
        this.res.send('success')
    }
    /** 关注事件 */
    protected subscribeEventHandler() {
        this.res.send('success')
    }
    /** 自定义菜单事件 - 点击菜单跳转链接时的事件推送 */
    protected viewEventHandler() {
        this.res.send('success')
    }

    /** 构建回复的 XML 字符串 */
    protected makeOutput<T extends OutputMessage>(data: Omit<T['xml'], BaseMsgType>) {
        const output: OutputMessage = {
            xml: {
                CreateTime: [Math.floor(Date.now() / 1000).toString()],
                FromUserName: this.input.xml.ToUserName,
                ToUserName: this.input.xml.FromUserName,
                ...data
            }
        }
        return this.builder.buildObject(output)
    }
}

type BaseMsgType = 'ToUserName' | 'FromUserName' | 'CreateTime'

export type Message<MsgType> = {
    xml: Tag<BaseMsgType> & { 'MsgType': [MsgType] }
}

export type InputMessage<T extends 'text' | 'image' | 'voice' | 'video' | 'shortvideo' | 'location' | 'link' | 'event'
    = 'text' | 'image' | 'voice' | 'video' | 'shortvideo' | 'location' | 'link' | 'event'> = Message<T> & {
        xml: Tag<'MsgId' | 'MsgDataId' | 'Idx'>
    }

export type InputTextMessage = InputMessage<'text'> & {
    xml: Tag<'Content'>
}

export type InputImageMessage = InputMessage<'image'> & {
    xml: Tag<'PicUrl' | 'MediaId'>
}

export type InputVoiceMessage = InputMessage<'voice'> & {
    xml: Tag<'MediaId' | 'Format' | 'MediaId16K'>
}

export type InputVideoMessage<T extends 'video' | 'shortvideo' = 'video'> = InputMessage<T> & {
    xml: Tag<'MediaId' | 'ThumbMediaId'>
}

export type InputShortVideoMessage = InputVideoMessage<'shortvideo'>

export type InputLocationMessage = InputMessage<'location'> & {
    xml: Tag<'Location_X' | 'Location_Y' | 'Scale' | 'Label'>
}

export type InputLinkMessage = InputMessage<'link'> & {
    xml: Tag<'Title' | 'Description' | 'Url'>
}

export type InputEventMessage<T extends 'subscribe' | 'unsubscribe' | 'SCAN' | 'LOCATION' | 'CLICK' | 'VIEW'
    = 'subscribe' | 'unsubscribe' | 'SCAN' | 'LOCATION' | 'CLICK' | 'VIEW'
> = InputMessage<'event'> & {
    xml: Tag<'Event', T> & Tag<'EventKey'>
}

/** 扫描带参数二维码事件 */
export type InputQREventMessage = InputEventMessage<'subscribe' | 'SCAN'> & {
    xml: Tag<'Ticket'>
}

export type OutputMessage<T extends 'text' | 'image' | 'voice' | 'video' | 'music' | 'news'
    = 'text' | 'image' | 'voice' | 'video' | 'music' | 'news'> = Message<T>

export type OutputTextMessage = OutputMessage<'text'> & {
    xml: Tag<'Content'>
}

export type OutputImageMessage = OutputMessage<'image'> & {
    xml: Tag<'Image', Tag<'MediaId'>>
}

export type OutputVoiceMessage = OutputMessage<'voice'> & {
    xml: Tag<'Voice', Tag<'MediaId'>>
}

export type OutputVideoMessage = OutputMessage<'video'> & {
    xml: Tag<'Video', Tag<'MediaId' | 'Title' | 'Description'>>
}

export type OutputMusicMessage = OutputMessage<'music'> & {
    xml: Tag<'Music', Tag<'Title' | 'Description' | 'MusicUrl' | 'HQMusicUrl' | 'ThumbMediaId'>>
}

export type OutputNewsMessage = OutputMessage<'news'> & {
    xml: Tag<'ArticleCount'> & Tag<'Articles', Tag<'item', Tag<'Title' | 'Description' | 'PicUrl' | 'Url'>>>
}

export type Tag<K extends string, V = string> = Record<K, [V]>