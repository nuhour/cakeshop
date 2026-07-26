import Taro, { useRouter } from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { CsOrder } from '@/types'
import { orderStore } from '@/store/order'
import { catalogStore } from '@/store/catalog'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { PriceText } from '@/components/ui/PriceText'
import { getDetailBarActions, orderStatusDetail, type CsOrderActionId } from '@/utils/orderActions'
import { openShopContact } from '@/utils/service'
import './index.scss'

export default function OrderDetailPage() {
  const router = useRouter()
  const id = String(router.params.id || '')
  const [order, setOrder] = useState<CsOrder | undefined>(orderStore.find(id))

  useEffect(() => {
    orderStore.loadDetail(id).then((item) => {
      if (item) setOrder(item)
    })
  }, [id])

  if (!order) return <View className="cakeshop-page"><AppNavBar title="订单详情" back /></View>

  const handleAction = async (actionId: CsOrderActionId) => {
    if (actionId === 'pay') {
      const next = await orderStore.payOrder(order.id)
      setOrder({ ...next })
      Taro.showToast({ title: '支付成功', icon: 'success' })
    } else if (actionId === 'cancel') {
      const next = await orderStore.cancelOrder(order.id)
      setOrder({ ...next })
      Taro.showToast({ title: '已取消', icon: 'success' })
    } else if (actionId === 'confirm') {
      const next = await orderStore.confirmOrder(order.id)
      setOrder({ ...next })
      Taro.showToast({ title: '订单已完成', icon: 'success' })
    } else if (actionId === 'buyAgain') {
      Taro.switchTab({ url: '/pages/category/index' })
    } else if (actionId === 'contactService') {
      openShopContact()
    }
  }

  const detail = orderStatusDetail[order.status]
  const actions = getDetailBarActions(order)
  const isPaid = Boolean(order.paidAt)
  const showPickupCode = order.fulfillmentType === 'pickup' && isPaid
  const slotText = order.fulfillmentMode === 'instant'
    ? '尽快交付'
    : `${order.appointmentDate} ${order.appointmentStartTime}-${order.appointmentEndTime}`
  const showExtras = order.tablewareCount > 0 || Boolean(order.candles)

  return (
    <View className="cakeshop-page order-detail-page">
      <AppNavBar title="订单详情" back />
      <View className="order-detail-status">
        <Text className="order-detail-status__title cs-serif">{detail.title}</Text>
        <Text className="order-detail-status__desc">{detail.desc}</Text>
        <Text className="order-detail-status__slot">
          {order.fulfillmentType === 'pickup' ? '预约到店' : '预约配送'} · {slotText}
        </Text>
      </View>

      {showPickupCode ? (
        <View className="order-detail-pickup">
          <Text className="order-detail-pickup__label">取货码</Text>
          <Text className="order-detail-pickup__code cs-serif">{order.pickupCode || '生成中'}</Text>
          <Text className="order-detail-pickup__hint">请向门店出示此取货码</Text>
        </View>
      ) : null}

      <View className="order-detail-card">
        <Text className="order-detail-title cs-serif">订单商品</Text>
        {order.items.map((item, index) => {
          const product = catalogStore.findProduct(item.productId) || item.product
          return (
            <View key={`${item.productId}_${index}`} className="order-detail-item">
              <View className="order-detail-line">
                <Text>{product?.name || item.productId} x{item.quantity}</Text>
                <PriceText value={item.price * item.quantity} size="small" />
              </View>
              {item.plaqueText ? <Text className="order-detail-plaque">贺牌：{item.plaqueText}</Text> : null}
            </View>
          )
        })}
      </View>

      {showExtras ? (
        <View className="order-detail-card">
          <Text className="order-detail-title cs-serif">蛋糕附加</Text>
          {order.tablewareCount > 0 ? (
            <View className="order-detail-line"><Text>餐具份数</Text><Text>{order.tablewareCount} 份</Text></View>
          ) : null}
          {order.candles ? (
            <View className="order-detail-line"><Text>蜡烛</Text><Text>{order.candles}</Text></View>
          ) : null}
        </View>
      ) : null}

      <View className="order-detail-card">
        <Text className="order-detail-title cs-serif">费用明细</Text>
        <View className="order-detail-line"><Text>商品金额</Text><PriceText value={order.productAmount} size="small" /></View>
        <View className="order-detail-line"><Text>配送费</Text><PriceText value={order.deliveryAmount} size="small" /></View>
        {order.couponAmount > 0 ? (
          <View className="order-detail-line"><Text>优惠券</Text><PriceText value={-order.couponAmount} size="small" /></View>
        ) : null}
        {order.pointsAmount > 0 ? (
          <View className="order-detail-line"><Text>积分抵扣</Text><PriceText value={-order.pointsAmount} size="small" /></View>
        ) : null}
        <View className="order-detail-total"><Text>实付</Text><PriceText value={order.payableAmount} /></View>
      </View>

      <View className="order-detail-card">
        <Text className="order-detail-title cs-serif">订单信息</Text>
        <Text className="order-detail-info">订单号：{order.orderNo}</Text>
        <Text className="order-detail-info">下单时间：{order.createdAt}</Text>
        {order.pickupContactName ? <Text className="order-detail-info">取货人：{order.pickupContactName} {order.pickupContactPhone}</Text> : null}
        <Text className="order-detail-info">留言：{order.message || '无'}</Text>
      </View>

      {actions.length ? (
        <View className="order-detail-bar">
          {actions.map((action) => (
            <Button
              key={action.id}
              className={action.primary ? 'order-detail-bar__primary' : 'order-detail-bar__ghost'}
              onClick={() => handleAction(action.id)}
            >
              {action.label}
            </Button>
          ))}
        </View>
      ) : null}
    </View>
  )
}
