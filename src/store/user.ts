import Taro from '@tarojs/taro'
import type { CsUserProfile } from '@/types'
import { csApi } from '@/api/cakeshop'

const USER_KEY = 'cakeshop_user'

let profile: CsUserProfile | null = Taro.getStorageSync(USER_KEY) || null

const persist = () => {
  if (profile) Taro.setStorageSync(USER_KEY, profile)
}

export const userStore = {
  getProfile: () => profile,
  isLoggedIn: () => Boolean(Taro.getStorageSync('cakeshop_token')),
  requireLogin(message = '登录后可继续操作') {
    if (this.isLoggedIn()) return true
    Taro.showToast({ title: message, icon: 'none' })
    Taro.eventCenter.trigger('cakeshop:login-required', message)
    return false
  },
  async loadProfile() {
    try {
      profile = await csApi.profile()
      persist()
    } catch (_error) {}
    return profile
  },
  async login() {
    const loginResult = await Taro.login()
    if (!loginResult.code) {
      throw new Error('微信登录code获取失败')
    }
    const result = await csApi.wechatLogin({ code: loginResult.code })
    Taro.setStorageSync('cakeshop_token', result.access)
    Taro.setStorageSync('cakeshop_refresh_token', result.refresh)
    profile = result.profile
    persist()
    return profile
  },
  setProfile(next: CsUserProfile) {
    profile = next
    persist()
  },
  logout() {
    profile = null
    Taro.removeStorageSync('cakeshop_token')
    Taro.removeStorageSync('cakeshop_refresh_token')
    Taro.removeStorageSync(USER_KEY)
  }
}
