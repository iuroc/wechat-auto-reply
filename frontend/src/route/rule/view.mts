import { State } from 'vanjs-core'
import { RuleData, createRule, deleteRule, matchTypeTexts, updateRule } from './mixin.mjs'
import van from 'vanjs-core'
import { Modal } from 'bootstrap'
import { randomString } from '../../util.mts'

const { button, div, input, label, option, select, textarea } = van.tags

export const RuleListItemCard = (ruleData: RuleData) => {
    const getContent = (contents: string[]) => {
        const { length } = contents
        return length == 1 ? contents[0] : `共 ${length} 条目标`
    }
    const ruleState = van.state(ruleData.rule)
    const matchTypeState = van.state(ruleData.match_type)
    const contentsState = van.state(ruleData.contents)
    const deleteDisabled = van.state(false)
    const matchTypeColor = van.derive(() => ['success', 'warning', 'info'][matchTypeState.val])
    const matchTypeText = van.derive(() => matchTypeTexts[matchTypeState.val])
    const element = div({ class: 'col-xl-4 col-md-6' },
        div({ class: 'card card-body vstack gap-2' },
            div({ class: 'fs-5 fw-bold text-truncate' }, ruleState),
            div({ class: 'text-truncate' }, () => getContent(contentsState.val)),
            div({ class: 'hstack gap-2' },
                div({ class: () => `bg-${matchTypeColor.val}-subtle text-${matchTypeColor.val}-emphasis border border-${matchTypeColor.val}-subtle rounded px-2 py-1` }, matchTypeText),
                button({
                    class: 'btn btn-sm btn-outline-primary ms-auto', onclick() {
                        RuleModal.type.val = 'update'
                        RuleModal.rule.val = ruleState.val
                        RuleModal.matchType.val = matchTypeState.val
                        RuleModal.appId = ruleData.app_id
                        RuleModal.ruleId = ruleData.id
                        RuleModal.callback = () => {
                            ruleState.val = RuleModal.rule.val
                            matchTypeState.val = RuleModal.matchType.val
                            contentsState.val = RuleModal.contents.val.map(i => i.val)
                        }
                        RuleModal.clearContents()
                        contentsState.val.forEach(content => van.add(RuleModal.contentEditorBox, ContentEditor(content)))
                        RuleModal.modal.show()
                    }
                }, '编辑'),
                button({
                    class: 'btn btn-sm btn-outline-danger', async onclick() {
                        deleteDisabled.val = true
                        try {
                            await deleteRule(ruleData.id)
                            element.remove()
                        } catch (error) {
                            if (error instanceof Error) alert(error.message)
                        } finally {
                            deleteDisabled.val = false
                        }
                    },
                    disabled: deleteDisabled
                }, '删除'),
            ),
            div({ class: 'small text-secondary' }, new Date(ruleData.create_time).toLocaleString())
        )
    )
    return element
}

export const ContentEditor = (content: string) => {
    const contentState = van.state(content)
    RuleModal.contents.val = RuleModal.contents.val.concat([contentState])
    const element = div({ class: 'd-flex gap-2 align-items-center' },
        textarea({
            class: 'form-control', placeholder: '请输入目标内容', value: contentState, oninput(event) {
                contentState.val = event.target.value
            }
        }),
        div(button({
            class: 'btn btn-sm btn-danger text-nowrap', onclick() {
                RuleModal.contents.val = RuleModal.contents.val.filter(i => i != contentState)
                element.remove()
            },
            disabled: () => RuleModal.contents.val.length == 1
        }, '删除'))
    )
    return element
}

export class RuleModal {
    static modal: Modal
    static appId: number
    static ruleId: number
    static rule = van.state('')
    static element: HTMLDivElement
    static callback: () => void
    static type: State<'create' | 'update'> = van.state('create')
    static matchType = van.state(0)
    static contents: State<State<string>[]> = van.state([])
    static contentEditorBox = div({ class: 'vstack gap-2 mb-2' })
    static init() {
        if (this.element) return
        const inputEleId = randomString(10)
        const inputEle = input({
            class: 'form-control',
            id: inputEleId,
            value: this.rule,
            oninput: event => this.rule.val = event.target.value,
            placeholder: '请输入规则'
        })


        this.element = div({ class: 'modal fade', tabindex: -1 },
            div({ class: 'modal-dialog modal-fullscreen-sm-down modal-dialog-scrollable' },
                div({ class: 'modal-content' },
                    div({ class: 'modal-header' },
                        div({ class: 'modal-title h5' }, () => this.type.val == 'create' ? '创建规则' : '编辑规则'),
                        button({ class: 'btn-close', 'data-bs-dismiss': 'modal' })
                    ),
                    div({ class: 'modal-body vstack gap-3' },
                        () => {
                            const id = randomString(10)
                            return div(
                                label({ class: 'form-label', for: inputEleId }, '规则'),
                                inputEle
                            )
                        },
                        () => {
                            const id = randomString(10)
                            return div({ class: 'input-group' },
                                label({ class: 'input-group-text', for: id }, '匹配方式'),
                                () => select({
                                    class: 'form-select', id, oninput(event) {
                                        RuleModal.matchType.val = event.target.value
                                    }
                                },
                                    matchTypeTexts.map((text, index) => option({ selected: index == this.matchType.val, value: index }, text))
                                )
                            )
                        },
                        div(
                            div({ class: 'hstack mb-2' },
                                div('匹配目标'),
                                button({
                                    class: 'btn btn-sm btn-primary ms-auto', onclick() {
                                        const element = ContentEditor('')
                                        RuleModal.contentEditorBox.insertBefore(element, RuleModal.contentEditorBox.children[0])
                                        element.querySelector('textarea')?.focus()
                                    }
                                }, '添加')
                            ),
                            this.contentEditorBox,
                            div({ class: 'small text-secondary' }, '提示：用户触发规则后，将返回目标内容。')
                        ),
                    ),
                    div({ class: 'modal-footer' },
                        button({ class: 'btn btn-secondary', 'data-bs-dismiss': 'modal' }, '关闭'),
                        button({
                            class: 'btn btn-primary', async onclick() {
                                const goodItems = RuleModal.contents.val.filter(i => i.val.length != 0)
                                const contents = goodItems.map(i => i.val)
                                if (contents.length == 0) return alert('请至少设置一条非空的目标文本')
                                RuleModal.contents.val = goodItems
                                const { appId, ruleId } = RuleModal
                                const matchType = RuleModal.matchType.val
                                const rule = RuleModal.rule.val
                                try {
                                    if (RuleModal.type.val == 'update') {
                                        await updateRule(appId, ruleId, matchType, rule, contents)
                                        RuleModal.callback()
                                    } else {
                                        const { ruleId } = await createRule(appId, matchType, rule, contents)
                                        const ruleListEle = document.getElementById('rule-list') as HTMLDivElement
                                        ruleListEle.insertBefore(RuleListItemCard({
                                            app_id: appId,
                                            contents: contents,
                                            create_time: new Date().toLocaleString(),
                                            id: ruleId,
                                            match_type: matchType,
                                            rule: rule
                                        }), ruleListEle.children[0])
                                    }
                                    RuleModal.modal.hide()
                                } catch (error) {
                                    if (error instanceof Error) alert(error.message)
                                }
                            }, disabled: () => this.contents.val.length < 1 || this.rule.val.length == 0
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

    static clearContents() {
        this.contentEditorBox.innerHTML = ''
        this.contents.val = []
    }
}