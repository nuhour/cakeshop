import Taro from '@tarojs/taro'
import type { CsShopSettings } from '@/types'
import { csApi } from '@/api/cakeshop'

const KEY = 'cakeshop_shop_settings'

const defaultShop: CsShopSettings = {
  name: '如也甜品屋',
  title: '甜品蛋糕预定',
  avatar: '',
  address: '甜蜜路18号',
  serviceHours: '08:00 - 20:00',
  contactPhone: '029-88886666',
  contactText: '欢迎咨询预定、到店自提、预约配送和订单进度。',
  qualificationImage: '',
  isActive: true
}

let shop: CsShopSettings = Taro.getStorageSync(KEY) || defaultShop

const persist = () => Taro.setStorageSync(KEY, shop)

export const shopStore = {
  get: () => shop,
  async load() {
    try {
      shop = await csApi.shop()
      persist()
    } catch (_error) {}
    return shop
  }
}
