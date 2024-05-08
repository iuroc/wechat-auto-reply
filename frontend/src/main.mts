/// <reference types="vite/client" />
import van from 'vanjs-core'
import Home from './route/home/main.mjs'
import App from './route/app/index.mjs'
import Rule from './route//rule/index.mjs'
import login from './route/login/index.mts'
import 'bootstrap/dist/css/bootstrap.css'
import { AppModal, WechatHelpModal } from './route/app/view.mts'
import { RuleModal } from './route/rule/view.mts'
import ClipboardJS from 'clipboard'

van.add(document.body, Home(), App(), Rule(), login())

AppModal.init()
RuleModal.init()
WechatHelpModal.init()

new ClipboardJS('.copybtn', {
    container: WechatHelpModal.element
})