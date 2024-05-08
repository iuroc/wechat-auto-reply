import van from 'vanjs-core'
import { Route, activeRoute } from 'vanjs-router'
import { fetchAppList, reloadAppList } from './mixin.mts'
import { AppListItemCard, AppModal } from './view.mts'
import { checkLogin } from '../../util.mts'

const { div, button } = van.tags

export default () => {
    const appListEle = div({ class: 'row gy-3 mb-4', id: 'app-list' })
    const loadingLock = van.state(false)
    const nextPage = van.state(0)
    window.addEventListener('scroll', async () => {
        if (window.scrollY + window.innerHeight >= document.body.offsetHeight - 20) {
            if (activeRoute.val.name != 'app') return
            if (loadingLock.val) return
            loadingLock.val = true
            try {
                const appList = await fetchAppList({
                    page: nextPage.val + 1
                })
                if (appList.length == 0) return
                nextPage.val++
                van.add(appListEle, appList.map(AppListItemCard))
                setTimeout(() => {
                    loadingLock.val = false
                }, 500)
            } catch (error) {
                if (error instanceof Error) alert(error.message)
            }
        }
    })
    return Route({
        name: 'app', class: 'container py-4 px-3', async onFirst() {
        }, async onLoad() {
            if (!await checkLogin()) return
            await reloadAppList()
        }
    },
        div({ class: 'hstack mb-4' },
            div({ class: 'fs-3' }, '应用列表'),
            button({
                class: 'btn btn-primary ms-auto', onclick() {
                    AppModal.type.val = 'create'
                    AppModal.appName.val = ''
                    AppModal.modal.show()
                }
            }, '创建应用')
        ),
        appListEle,
    )
}