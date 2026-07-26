import type { CsOrder, OrderStatus } from '@/types'

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

export const statusGroupForMine: Array<{ label: string; value: OrderStatus }> = [
  { label: '待支付', value: 'pendingPay' },
  { label: '备货中', value: 'preparing' },
  { label: '待取货', value: 'readyForPickup' },
  { label: '配送中', value: 'delivering' }
]
