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
  onLoginRequired(handler: () => void) {
    const event = 'cakeshop:login-required'
    Taro.eventCenter.on(event, handler)
    return () => { Taro.eventCenter.off(event, handler) }
  },
  requireLogin(message = '登录后可继续操作') {
    if (this.isLoggedIn()) return true
    Taro.showToast({ title: message, icon: 'none' })
    Taro.eventCenter.trigger('cakeshop:login-required', message)
    return false
  },
  // 未登录时先尝试微信静默登录（无需用户额外操作），失败才提示
  async ensureLogin(message = '请先登录') {
    if (this.isLoggedIn()) return true
    try {
      await this.login()
      return true
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : message, icon: 'none' })
      return false
    }
  },
  async loadProfile() {
    try {
      profile = await csApi.profile()
      persist()
    } catch (_error) {}
    return profile
  },
  async login() {
    let code = ''
    try {
      const loginResult = await Taro.login()
      code = loginResult.code || ''
    } catch (error) {
      // 开发者工具游客/模拟器环境偶尔没有登录 code，交给本地后端测试身份继续联调。
      if (process.env.NODE_ENV !== 'development') throw error
    }
    if (!code && process.env.NODE_ENV === 'development') {
      code = 'cakeshop-dev-login'
    }
    if (!code) {
      throw new Error('微信登录code获取失败')
    }
    const result = await csApi.wechatLogin({ code })
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
