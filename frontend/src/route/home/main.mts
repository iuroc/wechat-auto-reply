import { Route, routeTo } from 'vanjs-router'
import { checkLogin, hasLogin } from '../../util.mts'

export default () => Route({
    name: 'home', onLoad: async () => {
        if (!await checkLogin()) return
        routeTo('app')
    }
})