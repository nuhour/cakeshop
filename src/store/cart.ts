import Taro from '@tarojs/taro'
import type { CsCartItem } from '@/types'
import { csApi } from '@/api/cakeshop'
import { catalogStore } from './catalog'
import { userStore } from './user'
import { getProductUnitPrice } from '@/utils/pricing'

const KEY = 'cakeshop_cart'
export const CART_UPDATED_EVENT = 'cakeshop:cart-updated'

let items: CsCartItem[] = Taro.getStorageSync(KEY) || []

const persist = () => Taro.setStorageSync(KEY, items)
const notifyUpdated = () => Taro.eventCenter.trigger(CART_UPDATED_EVENT, [...items])
const replaceItems = (nextItems: CsCartItem[]) => {
  items = nextItems.map((item) => ({ ...item }))
  persist()
  notifyUpdated()
}

export const cartStore = {
  getItems: () => items,
  async load() {
    if (!userStore.isLoggedIn()) return items
    replaceItems(await csApi.cart())
    return items
  },
  async add(productId: string, quantity = 1, flavorId?: string, specId?: string, plaqueText?: string) {
    const product = catalogStore.findProduct(productId)
    if (!product || !product.isActive) throw new Error('商品已下架')
    if (product.stock <= 0) throw new Error('商品已售罄')
    const nextFlavorId = flavorId || product.flavors[0]?.id
    const nextSpecId = specId || product.specs[0]?.id
    const existing = items.find((item) => this.matches(item, productId, nextFlavorId, nextSpecId, plaqueText))
    const nextQuantity = (existing?.quantity || 0) + quantity
    if (nextQuantity > product.stock) throw new Error('库存不足')
    if (userStore.isLoggedIn()) {
      replaceItems(await csApi.addCartItem({ productId, quantity, flavorId: nextFlavorId, specId: nextSpecId, plaqueText }))
      return items
    }
    if (existing) {
      existing.quantity = nextQuantity
    } else {
      items = [{ productId, quantity, flavorId: nextFlavorId, specId: nextSpecId, plaqueText, selected: true }, ...items]
    }
    persist()
    notifyUpdated()
    return items
  },
  async setQuantity(productId: string, quantity: number, flavorId?: string, specId?: string, plaqueText?: string) {
    if (quantity <= 0) return this.remove(productId, flavorId, specId, plaqueText)
    const product = catalogStore.findProduct(productId)
    if (!product || !product.isActive) throw new Error('商品已下架')
    if (product.stock <= 0) throw new Error('商品已售罄')
    const nextQuantity = Math.min(Math.max(1, quantity), product.stock)
    if (userStore.isLoggedIn()) {
      replaceItems(await csApi.updateCartItem(productId, { quantity: nextQuantity, flavorId, specId, plaqueText: plaqueText || '' }))
      return items
    }
    items = items.map((item) => this.matches(item, productId, flavorId, specId, plaqueText) ? { ...item, quantity: nextQuantity } : item)
    persist()
    notifyUpdated()
    return items
  },
  async toggle(productId: string, flavorId?: string, specId?: string, plaqueText?: string) {
    const current = items.find((row) => this.matches(row, productId, flavorId, specId, plaqueText))
    if (!current) return items
    if (userStore.isLoggedIn()) {
      replaceItems(await csApi.updateCartItem(productId, { selected: !current.selected, flavorId, specId, plaqueText: plaqueText || '' }))
      return items
    }
    items = items.map((item) => this.matches(item, productId, flavorId, specId, plaqueText) ? { ...item, selected: !item.selected } : item)
    persist()
    notifyUpdated()
    return items
  },
  async remove(productId: string, flavorId?: string, specId?: string, plaqueText?: string) {
    if (userStore.isLoggedIn()) {
      replaceItems(await csApi.deleteCartItem(productId, { flavorId, specId, plaqueText: plaqueText || '' }))
      return items
    }
    items = items.filter((item) => !this.matches(item, productId, flavorId, specId, plaqueText))
    persist()
    notifyUpdated()
    return items
  },
  matches(item: CsCartItem, productId: string, flavorId?: string, specId?: string, plaqueText?: string) {
    return item.productId === productId && (item.flavorId || '') === (flavorId || '') && (item.specId || '') === (specId || '') && (item.plaqueText || '') === (plaqueText || '')
  },
  clearSelected() {
    items = items.filter((item) => !item.selected)
    persist()
    notifyUpdated()
  },
  getSelectedItems: () => items.filter((item) => item.selected),
  getSelectedTotal() {
    return items.filter((item) => item.selected).reduce((total, item) => {
      const product = catalogStore.findProduct(item.productId)
      return total + getProductUnitPrice(product, item.specId) * item.quantity
    }, 0)
  },
  getSelectedStockWarnings() {
    return items.filter((item) => item.selected).map((item) => {
      const product = catalogStore.findProduct(item.productId)
      if (!product || !product.isActive) return '有商品已下架'
      if (product.stock <= 0) return `${product.name} 已售罄`
      if (item.quantity > product.stock) return `${product.name} 库存仅剩 ${product.stock} 件`
      return ''
    }).filter(Boolean)
  },
  getBadgeCount() {
    return items.reduce((total, item) => total + item.quantity, 0)
  },
  getSelectedMaxLeadHours() {
    return items.filter((item) => item.selected).reduce((max, item) => {
      const product = catalogStore.findProduct(item.productId)
      if (!product || product.productType !== 'reservation') return max
      return Math.max(max, product.leadTimeHours || 0)
    }, 0)
  },
  hasSelectedReservation() {
    return items.filter((item) => item.selected).some((item) => {
      const product = catalogStore.findProduct(item.productId)
      return product?.productType === 'reservation'
    })
  }
}
