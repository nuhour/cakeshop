import Taro, { useRouter } from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { CsOrder } from '@/types'
import { orderStore } from '@/store/order'
import { catalogStore } from '@/store/catalog'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { PriceText } from '@/components/ui/PriceText'
import { confirmOrderAction, getDetailBarActions, orderStatusDetail, repeatOrderToCart, type CsOrderActionId } from '@/utils/orderActions'
import { openShopContact } from '@/utils/service'
import { getProductOptionSummary } from '@/utils/pricing'
import { getErrorMessage } from '@/api/client'
import './index.scss'

export default function OrderDetailPage() {
  const router = useRouter()
  const id = String(router.params.id || '')
  const [order, setOrder] = useState<CsOrder | undefined>(orderStore.find(id))
  const [loading, setLoading] = useState(!order)
  const [loadError, setLoadError] = useState('')
  const [acting, setActing] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError('')
    orderStore.loadDetail(id).then((item) => {
      if (!active) return
      if (item) setOrder(item)
      else setLoadError('找不到这笔订单')
    }).catch((error) => {
      if (!active) return
      setLoadError(getErrorMessage(error, '订单加载失败，请稍后重试'))
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [id])

  if (!order) {
    return (
      <View className="cakeshop-page order-detail-page--empty">
        <AppNavBar title="订单详情" back />
        <EmptyState
          title={loading ? '正在加载订单' : '订单详情不可用'}
          description={loading ? '请稍候' : loadError || '这笔订单可能已被移除'}
          actionLabel={loading ? undefined : '查看我的订单'}
          onAction={loading ? undefined : () => Taro.redirectTo({ url: '/pages/order/list/index' })}
        />
      </View>
    )
  }

  const handleAction = async (actionId: CsOrderActionId) => {
    if (acting) return
    setActing(true)
    if (actionId === 'buyAgain') {
      try {
        const result = await repeatOrderToCart(order)
        await Taro.switchTab({ url: '/pages/cart/index' })
        Taro.showToast({
          title: result.skippedNames.length ? `已加入 ${result.addedQuantity} 件，部分商品暂缺` : `已加入提篮，共 ${result.addedQuantity} 件`,
          icon: 'none'
        })
      } catch (error) {
        Taro.showToast({ title: error instanceof Error ? error.message : '再次购买失败', icon: 'none' })
      } finally {
        setActing(false)
      }
      return
    }
    if (actionId === 'contactService') {
      try {
        await openShopContact()
      } catch (error) {
        Taro.showToast({ title: error instanceof Error ? error.message : '客服信息加载失败', icon: 'none' })
      } finally {
        setActing(false)
      }
      return
    }
    try {
      if (!(await confirmOrderAction(actionId))) return
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
      }
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '操作失败，请稍后重试', icon: 'none' })
    } finally {
      setActing(false)
    }
  }

  const detail = orderStatusDetail[order.status]
  const actions = getDetailBarActions(order)
  const isPaid = Boolean(order.paidAt)
  const showPickupCode = order.fulfillmentType === 'pickup' && isPaid
  const slotText = order.fulfillmentMode === 'instant'
    ? '尽快交付'
    : `${order.appointmentDate} ${order.appointmentStartTime}-${order.appointmentEndTime}`
  const fulfillmentText = order.fulfillmentType === 'pickup'
    ? order.fulfillmentMode === 'instant' ? '到店自提' : '预约到店'
    : order.fulfillmentMode === 'instant' ? '外卖配送' : '预约配送'
  const showExtras = order.tablewareCount > 0 || Boolean(order.candles)

  return (
    <View className="cakeshop-page order-detail-page">
      <AppNavBar title="订单详情" back />
      <View className="order-detail-status">
        <Text className="order-detail-status__title cs-serif">{detail.title}</Text>
        <Text className="order-detail-status__desc">{detail.desc}</Text>
        <Text className="order-detail-status__slot">
          {fulfillmentText} · {slotText}
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
          // 优先使用订单创建时的商品快照，避免商品下架/改价后老订单显示当前（错误）信息
          const product = item.product || catalogStore.findProduct(item.productId)
          return (
            <View key={`${item.productId}_${index}`} className="order-detail-item">
              <View className="order-detail-line">
                <Text>
                  {product?.name || item.productId} x{item.quantity}
                  {product && !product.isActive ? <Text className="order-detail-item__badge">已下架</Text> : null}
                </Text>
                <PriceText value={item.price * item.quantity} size="small" />
              </View>
              {getProductOptionSummary(product || undefined, item.flavorId, item.specId).length ? (
                <Text className="order-detail-options">{getProductOptionSummary(product || undefined, item.flavorId, item.specId).join(' · ')}</Text>
              ) : null}
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
              disabled={acting}
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
