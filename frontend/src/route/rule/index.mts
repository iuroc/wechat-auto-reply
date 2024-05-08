import van from 'vanjs-core'
import { Route, routeTo, activeRoute } from 'vanjs-router'
import { checkLogin } from '../../util.mts'
import { createRule, matchRuleList } from './mixin.mts'
import { ContentEditor, RuleListItemCard, RuleModal } from './view.mts'

const { button, div } = van.tags

export const selectMode = van.state(false)

Object.defineProperty(window, 'createRule', { value: createRule })

export default () => {
    const ruleListEle = div({ class: 'row gy-3', id: 'rule-list' })
    const loadingLock = van.state(false)
    const nextPage = van.state(0)
    return Route({
        name: 'rule', class: 'container py-4 px-3', async onLoad(route) {
            if (!await checkLogin()) return
            ruleListEle.innerHTML = ''
            loadingLock.val = false
            nextPage.val = 0
            const appId = parseInt(route.args[0])
            if (isNaN(appId)) return routeTo('home')
            const ruleList = await matchRuleList(appId)
            van.add(ruleListEle, ruleList.map(RuleListItemCard))
        }, onFirst(route) {
            const appId = parseInt(route.args[0])
            if (isNaN(appId)) return routeTo('home')
            window.addEventListener('scroll', async () => {
                if (window.scrollY + window.innerHeight >= document.body.offsetHeight - 20) {
                    if (activeRoute.val.name != 'rule') return
                    if (loadingLock.val) return
                    loadingLock.val = true
                    try {
                        const appList = await matchRuleList(appId, {
                            page: nextPage.val + 1
                        })
                        if (appList.length == 0) return
                        nextPage.val++
                        van.add(ruleListEle, appList.map(RuleListItemCard))
                        setTimeout(() => {
                            loadingLock.val = false
                        }, 500)
                    } catch (error) {
                        if (error instanceof Error) alert(error.message)
                    }
                }
            })
        }
    },
        div({ class: 'hstack mb-4 gap-2' },
            div({ class: 'fs-3' }, '规则列表'),
            button({
                class: 'btn btn-success ms-auto', onclick() {
                    RuleModal.type.val = 'create'
                    RuleModal.clearContents()
                    RuleModal.matchType.val = 0
                    RuleModal.rule.val = ''
                    RuleModal.appId = parseInt(activeRoute.val.args[0])
                    van.add(RuleModal.contentEditorBox, ContentEditor(''))
                    RuleModal.modal.show()
                }
            }, '创建规则'),
        ),
        ruleListEle
    )
}