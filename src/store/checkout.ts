import Taro from '@tarojs/taro'
import type { FulfillmentType } from '@/types'

export interface CsCheckoutState {
  source: 'cart' | 'buyNow'
  productId?: string
  buyNowProductType?: 'instock' | 'reservation'
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
  plaqueText?: string
  tablewareCount: number
  candles: string
  message: string
}

const KEY = 'cakeshop_checkout'

const defaultState = (): CsCheckoutState => ({
  source: 'cart',
  fulfillmentType: 'pickup',
  usePoints: false,
  useBalance: false,
  tablewareCount: 0,
  candles: '',
  message: ''
})

let state: CsCheckoutState = { ...defaultState(), ...(Taro.getStorageSync(KEY) || {}) }

const persist = () => Taro.setStorageSync(KEY, state)

export const checkoutStore = {
  get: () => state,
  set(next: Partial<CsCheckoutState>) {
    state = { ...state, ...next }
    persist()
  },
  start(next: Partial<CsCheckoutState>) {
    state = { ...defaultState(), ...next }
    persist()
  },
  clear() {
    state = defaultState()
    persist()
  }
}
