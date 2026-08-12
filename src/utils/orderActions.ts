import Taro from '@tarojs/taro'
import type { CsOrder, OrderStatus } from '@/types'
import { cartStore } from '@/store/cart'
import { catalogStore } from '@/store/catalog'

export type CsOrderActionId =
  | 'pay'
  | 'cancel'
  | 'confirm'
  | 'buyAgain'
  | 'contactService'

export interface CsOrderAction {
  id: CsOrderActionId
  label: string
  primary?: boolean
}

export const orderStatusText: Record<OrderStatus, string> = {
  pendingPay: '待支付',
  preparing: '备货中',
  readyForPickup: '待取货',
  delivering: '配送中',
  completed: '已完成',
  cancelled: '已取消',
  afterSale: '售后中'
}

export const orderStatusDetail: Record<OrderStatus, { title: string; desc: string }> = {
  pendingPay: {
    title: '订单待支付',
    desc: '完成支付后，门店会按预约时段安排制作。'
  },
  preparing: {
    title: '门店备货中',
    desc: '甜品正在精心制作，请按预约时间到店或等待配送。'
  },
  readyForPickup: {
    title: '可到店取货',
    desc: '请向门店出示取货码，建议在预约时段内到店。'
  },
  delivering: {
    title: '配送中',
    desc: '订单已出门店，请保持电话畅通。'
  },
  completed: {
    title: '订单已完成',
    desc: '感谢支持，欢迎再次预定甜蜜好味。'
  },
  cancelled: {
    title: '订单已取消',
    desc: '该预约已关闭，商品和档期资源已释放。'
  },
  afterSale: {
    title: '售后中',
    desc: '如需补充说明，可联系门店客服处理。'
  }
}

const actionMeta: Record<CsOrderActionId, Omit<CsOrderAction, 'id'>> = {
  pay: { label: '去支付', primary: true },
  cancel: { label: '取消订单' },
  confirm: { label: '确认完成', primary: true },
  buyAgain: { label: '再来一单', primary: true },
  contactService: { label: '联系客服' }
}

const actionsByStatus: Record<OrderStatus, CsOrderActionId[]> = {
  pendingPay: ['pay', 'cancel', 'contactService'],
  preparing: ['contactService'],
  readyForPickup: ['confirm', 'contactService'],
  delivering: ['confirm', 'contactService'],
  completed: ['buyAgain', 'contactService'],
  cancelled: ['buyAgain', 'contactService'],
  afterSale: ['contactService']
}

const toAction = (id: CsOrderActionId): CsOrderAction => ({ id, ...actionMeta[id] })

export const getOrderActions = (order: Pick<CsOrder, 'status'>): CsOrderAction[] => {
  return actionsByStatus[order.status].map(toAction)
}

export const getCardPrimaryActions = (order: Pick<CsOrder, 'status'>) => {
  return getOrderActions(order).filter((action) => action.primary).slice(0, 1)
}

export const getCardInlineActions = (order: Pick<CsOrder, 'status'>) => {
  const preferred: CsOrderActionId[] = ['cancel', 'contactService']
  const primaryIds = new Set(getCardPrimaryActions(order).map((action) => action.id))
  return preferred
    .map((id) => getOrderActions(order).find((action) => action.id === id))
    .filter((action): action is CsOrderAction => Boolean(action))
    .filter((action) => !primaryIds.has(action.id))
    .slice(0, 2)
}

export const getDetailBarActions = (order: Pick<CsOrder, 'status'>) => {
  const preferred: CsOrderActionId[] = ['cancel', 'contactService', 'confirm', 'buyAgain', 'pay']
  const actions = getOrderActions(order)
  return preferred
    .map((id) => actions.find((action) => action.id === id))
    .filter((action): action is CsOrderAction => Boolean(action))
}

export const confirmOrderAction = async (actionId: CsOrderActionId) => {
  if (actionId === 'cancel') {
    const result = await Taro.showModal({
      title: '取消订单',
      content: '取消后会释放本单商品与预约档期，确定继续吗？',
      confirmText: '确认取消',
      confirmColor: '#953225'
    })
    return result.confirm
  }
  if (actionId === 'confirm') {
    const result = await Taro.showModal({
      title: '确认已完成',
      content: '请在已取货或已收到配送商品后确认完成。',
      confirmText: '确认完成',
      confirmColor: '#953225'
    })
    return result.confirm
  }
  return true
}

export const repeatOrderToCart = async (order: Pick<CsOrder, 'items'>) => {
  let addedQuantity = 0
  const skippedNames: string[] = []

  // 下单历史可能来自任意分类；每次重购都刷新全量目录，避免旧的筛选缓存误判商品缺货。
  await catalogStore.loadProducts()

  for (const item of order.items) {
    const product = catalogStore.findProduct(item.productId)
    if (!product || !product.isActive || product.stock <= 0) {
      skippedNames.push(product?.name || item.product?.name || item.productId)
      continue
    }
    const quantity = Math.min(item.quantity, product.stock)
    try {
      await cartStore.add(item.productId, quantity, item.flavorId, item.specId, item.plaqueText)
      addedQuantity += quantity
    } catch (_error) {
      skippedNames.push(product.name)
    }
  }

  if (!addedQuantity) throw new Error('原订单商品当前暂缺，请稍后再试')
  return { addedQuantity, skippedNames }
}

export const statusGroupForMine: Array<{ label: string; value: OrderStatus }> = [
  { label: '待支付', value: 'pendingPay' },
  { label: '备货中', value: 'preparing' },
  { label: '待取货', value: 'readyForPickup' },
  { label: '配送中', value: 'delivering' }
]
