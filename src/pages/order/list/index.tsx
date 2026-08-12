import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import { useState } from 'react'
import type { CsOrder, OrderStatus } from '@/types'
import { orderStore } from '@/store/order'
import { userStore } from '@/store/user'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { OrderCard } from '@/components/order/OrderCard'
import { confirmOrderAction, repeatOrderToCart, statusGroupForMine, type CsOrderActionId } from '@/utils/orderActions'
import { openShopContact } from '@/utils/service'
import { getErrorMessage } from '@/api/client'
import './index.scss'

const tabs: Array<{ label: string; value?: OrderStatus }> = [
  { label: '全部' },
  ...statusGroupForMine,
  { label: '已完成', value: 'completed' }
]

export default function OrderListPage() {
  const router = useRouter()
  const initialStatus = tabs.some((tab) => tab.value === router.params.status) ? router.params.status as OrderStatus : undefined
  const [active, setActive] = useState<OrderStatus | undefined>(initialStatus)
  const [loggedIn, setLoggedIn] = useState(userStore.isLoggedIn())
  const [orders, setOrders] = useState<CsOrder[]>(userStore.isLoggedIn() ? orderStore.list() : [])
  const [counts, setCounts] = useState<Record<string, number>>(userStore.isLoggedIn() ? orderStore.statusCounts() : {})
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [actingOrderId, setActingOrderId] = useState('')

  const reload = async (status = active) => {
    setLoading(true)
    setLoadError('')
    try {
      await orderStore.load()
      setOrders(orderStore.list(status))
      setCounts(orderStore.statusCounts())
    } catch (error) {
      setLoadError(getErrorMessage(error, '订单加载失败，请稍后重试'))
      setOrders(orderStore.list(status))
      setCounts(orderStore.statusCounts())
    } finally {
      setLoading(false)
    }
  }
  useDidShow(() => {
    const authed = userStore.isLoggedIn()
    setLoggedIn(authed)
    if (authed) {
      void reload()
    } else {
      setOrders([])
      setCounts({})
    }
  })

  const login = async () => {
    try {
      await userStore.login()
      setLoggedIn(true)
      void reload()
      Taro.showToast({ title: '登录成功', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '登录失败', icon: 'none' })
    }
  }

  const handleAction = async (actionId: CsOrderActionId, order: CsOrder) => {
    if (actingOrderId) return
    setActingOrderId(order.id)
    try {
      if (actionId === 'buyAgain') {
        const result = await repeatOrderToCart(order)
        await Taro.switchTab({ url: '/pages/cart/index' })
        Taro.showToast({
          title: result.skippedNames.length ? `已加入 ${result.addedQuantity} 件，部分商品暂缺` : `已加入提篮，共 ${result.addedQuantity} 件`,
          icon: 'none'
        })
        return
      }
      if (actionId === 'contactService') {
        await openShopContact()
        return
      }
      if (!(await confirmOrderAction(actionId))) return
      if (actionId === 'pay') {
        await orderStore.payOrder(order.id)
        Taro.showToast({ title: '支付成功', icon: 'success' })
      } else if (actionId === 'cancel') {
        await orderStore.cancelOrder(order.id)
        Taro.showToast({ title: '已取消', icon: 'success' })
      } else if (actionId === 'confirm') {
        await orderStore.confirmOrder(order.id)
        Taro.showToast({ title: '订单已完成', icon: 'success' })
      }
      await reload()
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : actionId === 'buyAgain' ? '再次购买失败' : '操作失败，请稍后重试', icon: 'none' })
    } finally {
      setActingOrderId('')
    }
  }

  return (
    <View className="cakeshop-page order-list-page">
      <AppNavBar title="我的订单" back />
      <View className="order-tabs">
        {tabs.map((tab) => (
          <Button
            key={tab.label}
            className={`order-tabs__item ${active === tab.value ? 'order-tabs__item--active' : ''}`}
            onClick={() => {
              setActive(tab.value)
              reload(tab.value)
            }}
          >
            {tab.label}
            {tab.value && counts[tab.value] ? <Text className="order-tabs__badge">{counts[tab.value]}</Text> : null}
          </Button>
        ))}
      </View>
      {!loggedIn ? (
        <View>
          <EmptyState title="登录后查看订单" description="登录同步你的订单与预约" />
          <Button className="cs-login-btn" onClick={login}>微信一键登录</Button>
        </View>
      ) : null}
      {loggedIn && loadError ? (
        <EmptyState title="订单加载失败" description={loadError} actionLabel="重新加载" onAction={() => void reload()} />
      ) : null}
      {loggedIn && loading && !orders.length ? <View className="order-list-loading"><Text>正在加载订单…</Text></View> : null}
      {loggedIn && !loading && !loadError && !orders.length ? (
        <EmptyState
          title="暂无订单"
          description="预定一份甜蜜好味，订单会出现在这里"
          actionLabel="去逛逛"
          onAction={() => Taro.switchTab({ url: '/pages/category/index' })}
        />
      ) : null}
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onAction={(actionId, currentOrder) => {
            if (actingOrderId === currentOrder.id) return
            void handleAction(actionId, currentOrder)
          }}
          actionDisabled={Boolean(actingOrderId)}
        />
      ))}
    </View>
  )
}
