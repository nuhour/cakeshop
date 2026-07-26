import Taro from '@tarojs/taro'
import type { CsOrder, OrderStatus } from '@/types'
import type { CsCheckoutState } from './checkout'
import { csApi } from '@/api/cakeshop'
import { cartStore } from './cart'

const KEY = 'cakeshop_orders'
let orders: CsOrder[] = Taro.getStorageSync(KEY) || []
const persist = () => Taro.setStorageSync(KEY, orders)

export const orderStore = {
  async load(status?: OrderStatus) {
    try {
      orders = await csApi.orders(status)
      persist()
    } catch (_error) {}
    return this.list(status)
  },
  list(status?: OrderStatus) {
    return status ? orders.filter((order) => order.status === status) : orders
  },
  async loadDetail(id: string) {
    try {
      const order = await csApi.orderDetail(id)
      orders = orders.some((item) => item.id === order.id) ? orders.map((item) => item.id === order.id ? order : item) : [order, ...orders]
      persist()
      return order
    } catch (_error) {
      return this.find(id)
    }
  },
  find(id?: string) {
    return orders.find((order) => order.id === id)
  },
  async createOrder(checkout: CsCheckoutState) {
    const created = await csApi.createOrder(checkout)
    orders = [created, ...orders.filter((item) => item.id !== created.id)]
    persist()
    cartStore.clearSelected()
    return created
  },
  async payOrder(id: string) {
    const payResult = await csApi.payOrder(id)
    const paid = payResult.order || await csApi.orderDetail(id)
    orders = orders.map((item) => item.id === paid.id ? paid : item)
    persist()
    return paid
  },
  async cancelOrder(id: string) {
    const cancelled = await csApi.cancelOrder(id)
    orders = orders.map((item) => item.id === cancelled.id ? cancelled : item)
    persist()
    return cancelled
  },
  async confirmOrder(id: string) {
    const confirmed = await csApi.confirmOrder(id)
    orders = orders.map((item) => item.id === confirmed.id ? confirmed : item)
    persist()
    return confirmed
  },
  countByStatus(status: OrderStatus) {
    return orders.filter((order) => order.status === status).length
  },
  statusCounts() {
    return orders.reduce<Record<string, number>>((result, order) => {
      result[order.status] = (result[order.status] || 0) + 1
      return result
    }, {})
  }
}
