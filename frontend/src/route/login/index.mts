import van from 'vanjs-core'
import { Route, routeTo } from 'vanjs-router'
import { login } from './mixin.mjs'
import { checkLogin, hasLogin } from '../../util.mts'

const { button, div, input, label } = van.tags

export default () => {
    const password = van.state('')
    const inputEle = input({
        class: 'form-control',
        type: 'password',
        autocomplete: 'new-password',
        oninput: event => password.val = event.target.value,
        placeholder: '请输入管理员密码'
    })
    return Route({
        name: 'login', class: 'container py-5 px-4', onLoad() {
            setTimeout(() => inputEle.focus())
        }
    },
        div({ class: 'row' },
            div({ class: 'h2 mb-4 text-center' }, '管理员登录'),
            div({ class: 'col-lg-4 col-sm-8 mx-auto' },
                div({ class: 'mb-3' },
                    label({ class: 'form-label' }, '管理员密码'),
                    inputEle
                ),
                button({
                    class: 'btn btn-success w-100', async onclick() {
                        inputEle.focus()
                        if (password.val.length == 0)
                            return hasLogin.val = false, alert('密码不能为空')
                        try {
                            await login(password.val)
                            hasLogin.val = true
                            routeTo('home')
                        } catch (error) {
                            if (error instanceof Error)
                                hasLogin.val = false, alert(`登录失败，${error.message}`)
                        }
                    }
                }, '登录')
            )
        ),
    )
}