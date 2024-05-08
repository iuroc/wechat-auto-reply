import van, { State } from 'vanjs-core'
import { AppData, createApp, deleteApp, fetchAppList, reloadAppList, resetToken, updateApp } from './mixin.mts'
import { Modal } from 'bootstrap'
import { routeTo } from 'vanjs-router'
import { randomString } from '../../util.mts'

const { button, div, input, label } = van.tags

export const AppListItemCard = (appData: AppData) => {
    const name = van.state(appData.name)
    const ruleCount = van.state(appData.rule_count)
    const createTime = van.derive(() => {
        return new Date(appData.create_time).toLocaleString()
    })
    const cardEle = div({ class: 'col-xl-4 col-md-6' },
        div({
            class: 'card card-body gap-2 vstack', role: 'button', onclick() {
                routeTo('rule', [appData.id])
            }
        },
            div({ class: 'fs-5 fw-bold' }, name),
            div({ class: 'hstack text-secondary' },
                div({}, '共 ', ruleCount, ' 条规则'),
                div({ class: 'ms-auto small text-secondary' }, createTime),
            ),
            div({ class: 'hstack user-select-none gap-2' },
                button({
                    class: 'btn btn-sm btn-outline-primary', onclick(event) {
                        event.stopPropagation()
                        AppModal.type.val = 'update'
                        AppModal.appId.val = appData.id
                        AppModal.appName.val = appData.name
                        AppModal.callback = () => {
                            name.val = AppModal.appName.val
                        }
                        AppModal.modal.show()
                    }
                }, '编辑'),
                button({
                    class: 'btn btn-sm btn-outline-danger', async onclick(event: Event) {
                        event.stopPropagation()
                        if (!confirm('确定要删除吗？')) return
                        try {
                            await deleteApp(appData.id)
                            cardEle.remove()
                        } catch (error) {
                            if (error instanceof Error) alert(error.message)
                        }
                    }
                }, '删除'),
                button({
                    class: 'btn btn-sm btn-success ms-auto', onclick(event: Event) {
                        event.stopPropagation()
                        WechatHelpModal.url.val = `${location.origin}/api/wechat/${appData.id}`
                        WechatHelpModal.token.val = appData.token
                        WechatHelpModal.appId = appData.id
                        WechatHelpModal.callback = () => {
                            appData.token = WechatHelpModal.token.val
                        }
                        WechatHelpModal.modal.show()
                    }
                }, '部署到公众号'),
            )
        )
    )
    return cardEle
}

export class AppModal {
    static element: HTMLDivElement
    static appName = van.state('')
    static modal: Modal
    static callback: () => void
    static appId = van.state(0)
    static type: State<'create' | 'update'> = van.state('create')
    static init() {
        if (this.element) return
        const inputEleId = randomString(10)
        const inputEle = input({
            class: 'form-control',
            value: this.appName,
            id: inputEleId,
            oninput: event => this.appName.val = event.target.value,
            placeholder: '请输入应用名称'
        })
        this.element = div({ class: 'modal fade', tabindex: -1 },
            div({ class: 'modal-dialog' },
                div({ class: 'modal-content' },
                    div({ class: 'modal-header' },
                        div({ class: 'modal-title h5' }, () => this.type.val == 'create' ? '创建应用' : '编辑应用'),
                        button({ class: 'btn-close', 'data-bs-dismiss': 'modal' })
                    ),
                    div({ class: 'modal-body vstack gap-3' },
                        div(
                            label({ class: 'form-label', for: inputEleId }, '应用名称'),
                            inputEle
                        ),
                    ),
                    div({ class: 'modal-footer' },
                        button({ class: 'btn btn-secondary', 'data-bs-dismiss': 'modal' }, '关闭'),
                        button({
                            class: 'btn btn-primary', async onclick() {
                                try {
                                    if (AppModal.appName.val.length == 0) throw new Error('应用名称不能为空')
                                    if (AppModal.type.val == 'create') {
                                        const { appId, appName, token } = await createApp(AppModal.appName.val)
                                        const appListEle = document.getElementById('app-list') as HTMLDivElement
                                        appListEle.insertBefore(AppListItemCard({
                                            name: appName,
                                            id: appId,
                                            rule_count: 0,
                                            token,
                                            create_time: new Date().toLocaleString()
                                        }), appListEle.children[0])
                                        AppModal.modal.hide()
                                    } else if (AppModal.type.val == 'update') {
                                        await updateApp(AppModal.appId.val, AppModal.appName.val)
                                        AppModal.callback()
                                        AppModal.modal.hide()
                                    }
                                } catch (error) {
                                    inputEle.focus()
                                    if (error instanceof Error) alert(error.message)
                                }
                            }
                        }, () => this.type.val == 'create' ? '确认创建' : '保存更新'),
                    )
                ),
            )
        )
        van.add(document.body, this.element)
        this.modal = new Modal(this.element)
        this.element.addEventListener('shown.bs.modal', () => {
            inputEle.focus()
        })
    }
}

export class WechatHelpModal {
    static url = van.state('')
    static token = van.state('')
    static appId: number
    static callback: () => void
    static element: HTMLDivElement
    static modal: Modal
    static init() {
        if (this.element) return
        this.element = div({ class: 'modal fade', tabindex: -1 },
            div({ class: 'modal-dialog' },
                div({ class: 'modal-content' },
                    div({ class: 'modal-header' },
                        div({ class: 'modal-title h5' }, '部署到公众号'),
                        button({ class: 'btn-close', 'data-bs-dismiss': 'modal' })
                    ),
                    div({ class: 'modal-body vstack gap-3' },
                        div({ class: 'input-group' },
                            label({ class: 'input-group-text' }, 'URL'),
                            input({
                                class: 'form-control', disabled: true, value: this.url, oninput(event) {
                                    WechatHelpModal.url.val = event.target.value
                                }
                            }),
                            button({ class: 'btn btn-success copybtn', 'data-clipboard-text': this.url }, '复制')
                        ),
                        div({ class: 'input-group' },
                            label({ class: 'input-group-text' }, 'Token'),
                            input({
                                class: 'form-control', disabled: true, value: this.token, oninput(event) {
                                    WechatHelpModal.token.val = event.target.value
                                }
                            }),
                            button({ class: 'btn btn-success copybtn', 'data-clipboard-text': this.token }, '复制')
                        ),
                    ),
                    div({ class: 'modal-footer' },
                        button({ class: 'btn btn-secondary', 'data-bs-dismiss': 'modal' }, '关闭'),
                        div(button({
                            class: 'btn btn-danger', async onclick() {
                                try {
                                    WechatHelpModal.token.val = await resetToken(WechatHelpModal.appId)
                                    WechatHelpModal.callback()
                                } catch (error) {
                                    if (error instanceof Error) alert(error.message)
                                }
                            }
                        }, '重置 Token'))
                    )
                ),
            )
        )
        van.add(document.body, this.element)
        this.modal = new Modal(this.element)
    }
}

