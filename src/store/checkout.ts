import Taro from '@tarojs/taro'
import type { FulfillmentType } from '@/types'

export interface CsCheckoutState {
  source: 'cart' | 'buyNow'
  productId?: string
  quantity?: number
  flavorId?: string
  specId?: string
  fulfillmentType: FulfillmentType
  storeId?: string
  addressId?: string
  slotId?: string
  selectedCouponId?: string
  usePoints: boolean
  useBalance: boolean
  pickupContactName?: string
  pickupContactPhone?: string
  message: string
}

const KEY = 'cakeshop_checkout'

let state: CsCheckoutState = Taro.getStorageSync(KEY) || {
  source: 'cart',
  fulfillmentType: 'pickup',
  usePoints: false,
  useBalance: false,
  message: ''
}

const persist = () => Taro.setStorageSync(KEY, state)

export const checkoutStore = {
  get: () => state,
  set(next: Partial<CsCheckoutState>) {
    state = { ...state, ...next }
    if (next.fulfillmentType === 'pickup') state.addressId = undefined
    if (next.fulfillmentType === 'delivery') state.storeId = undefined
    persist()
  },
  clear() {
    state = {
      source: 'cart',
      fulfillmentType: 'pickup',
      usePoints: false,
      useBalance: false,
      message: ''
    }
    persist()
  }
}
