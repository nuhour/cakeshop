import Taro from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import type { CsOrder } from '@/types'
import { PriceText } from '@/components/ui/PriceText'
import { getCardInlineActions, getCardPrimaryActions, type CsOrderActionId, orderStatusText } from '@/utils/orderActions'
import './OrderCard.scss'

interface Props {
  order: CsOrder
  onAction?: (actionId: CsOrderActionId, order: CsOrder) => void
}

export function OrderCard({ order, onAction }: Props) {
  const primaryActions = getCardPrimaryActions(order)
  const inlineActions = getCardInlineActions(order)
  const actions = [...inlineActions, ...primaryActions]

  return (
    <View className="order-card" onClick={() => Taro.navigateTo({ url: `/pages/order/detail/index?id=${order.id}` })}>
      <View className="order-card__head">
        <Text>{order.orderNo}</Text>
        <Text className="order-card__status">{orderStatusText[order.status] || order.status}</Text>
      </View>
      <Text className="order-card__slot">
        {order.fulfillmentType === 'pickup' ? '到店自提' : '预约配送'} · {order.fulfillmentMode === 'instant' ? '尽快交付' : `${order.appointmentDate} ${order.appointmentStartTime}-${order.appointmentEndTime}`}
      </Text>
      <Text className="order-card__items">共 {order.items.reduce((total, item) => total + item.quantity, 0)} 件商品</Text>
      <View className="order-card__foot">
        <PriceText value={order.payableAmount} size="small" />
        {actions.length ? (
          <View className="order-card__actions">
            {actions.map((action) => (
              <Button
                key={action.id}
                className={action.primary ? 'order-card__primary' : 'order-card__ghost'}
                onClick={(event) => {
                  event.stopPropagation()
                  onAction?.(action.id, order)
                }}
              >
                {action.label}
              </Button>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  )
}
