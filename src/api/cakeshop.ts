import type {
  FulfillmentType,
  CsAddress,
  CsCartItem,
  CsCategory,
  CsCoupon,
  CsFulfillmentSlot,
  CsHomePayload,
  CsMemberAsset,
  CsOrder,
  CsOrderPayResult,
  CsOrderPreview,
  CsProduct,
  CsShopSettings,
  CsStore,
  CsUserProfile
} from '@/types'
import type { CsCheckoutState } from '@/store/checkout'
import { request } from './client'

const query = (params: Record<string, string | number | undefined>) => {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  return parts.length ? `?${parts.join('&')}` : ''
}

export interface WechatLoginResult {
  access: string
  refresh: string
  profile: CsUserProfile
  openid: string
}

export const csApi = {
  home: () => request<CsHomePayload>('/home'),
  shop: () => request<CsShopSettings>('/shop'),
  categories: () => request<CsCategory[]>('/categories'),
  products: (params: { categoryId?: string; keyword?: string; type?: string } = {}) =>
    request<CsProduct[]>(`/products${query(params)}`),
  productDetail: (id: string) => request<CsProduct>(`/products/${id}`),
  stores: () => request<CsStore[]>('/stores'),
  slots: (params: { date?: string; fulfillmentType?: FulfillmentType; storeId?: string } = {}) =>
    request<CsFulfillmentSlot[]>(`/slots${query(params)}`),
  wechatLogin: (data: { code: string; nickname?: string; avatar?: string }) =>
    request<WechatLoginResult>('/auth/wechat-login', { method: 'POST', data }),
  logout: (refresh?: string) => request<{ loggedOut: boolean }>('/auth/logout', { method: 'POST', data: { refresh } }),
  profile: () => request<CsUserProfile>('/profile'),
  assets: () => request<CsMemberAsset>('/assets'),
  addresses: () => request<CsAddress[]>('/addresses'),
  saveAddress: (address: CsAddress) => request<CsAddress>('/addresses', { method: 'POST', data: address }),
  setDefaultAddress: (id: string) => request<CsAddress>(`/addresses/${id}`, { method: 'POST', data: { action: 'setDefault' } }),
  deleteAddress: (id: string) => request<{ deleted: boolean }>(`/addresses/${id}`, { method: 'POST', data: { action: 'delete' } }),
  cart: () => request<CsCartItem[]>('/cart'),
  addCartItem: (data: { productId: string; quantity?: number; flavorId?: string; specId?: string }) =>
    request<CsCartItem[]>('/cart/items', { method: 'POST', data }),
  updateCartItem: (productId: string, data: Partial<CsCartItem>) =>
    request<CsCartItem[]>(`/cart/items/${productId}`, { method: 'POST', data }),
  deleteCartItem: (productId: string, data: Partial<CsCartItem> = {}) =>
    request<CsCartItem[]>(`/cart/items/${productId}`, { method: 'POST', data: { ...data, action: 'delete' } }),
  coupons: () => request<CsCoupon[]>('/coupons'),
  previewOrder: (checkout: CsCheckoutState) =>
    request<CsOrderPreview>('/orders/preview', { method: 'POST', data: checkout }),
  createOrder: (checkout: CsCheckoutState) =>
    request<CsOrder>('/orders', { method: 'POST', data: checkout }),
  orders: (status?: string) => request<CsOrder[]>(`/orders${query({ status })}`),
  orderDetail: (id: string) => request<CsOrder>(`/orders/${id}`),
  payOrder: (id: string) => request<CsOrderPayResult>(`/orders/${id}/pay`, { method: 'POST' }),
  cancelOrder: (id: string) => request<CsOrder>(`/orders/${id}/cancel`, { method: 'POST' }),
  confirmOrder: (id: string) => request<CsOrder>(`/orders/${id}/confirm`, { method: 'POST' })
}
