import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { Text, View } from '@tarojs/components'
import { useState } from 'react'
import type { CsOrder, OrderStatus } from '@/types'
import { orderStore } from '@/store/order'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { OrderCard } from '@/components/order/OrderCard'
import { statusGroupForMine, type CsOrderActionId } from '@/utils/orderActions'
import { openShopContact } from '@/utils/service'
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
  const [orders, setOrders] = useState<CsOrder[]>(orderStore.list())
  const [counts, setCounts] = useState<Record<string, number>>(orderStore.statusCounts())

  const reload = (status = active) => orderStore.load().then(() => {
    setOrders(orderStore.list(status))
    setCounts(orderStore.statusCounts())
  })
  useDidShow(() => { reload() })

  const handleAction = async (actionId: CsOrderActionId, order: CsOrder) => {
    if (actionId === 'pay') {
      await orderStore.payOrder(order.id)
      Taro.showToast({ title: '支付成功', icon: 'success' })
    } else if (actionId === 'cancel') {
      await orderStore.cancelOrder(order.id)
      Taro.showToast({ title: '已取消', icon: 'success' })
    } else if (actionId === 'confirm') {
      await orderStore.confirmOrder(order.id)
      Taro.showToast({ title: '订单已完成', icon: 'success' })
    } else if (actionId === 'buyAgain') {
      Taro.switchTab({ url: '/pages/category/index' })
      return
    } else if (actionId === 'contactService') {
      openShopContact()
      return
    }
    reload()
  }

  return (
    <View className="cakeshop-page order-list-page">
      <AppNavBar title="我的订单" back />
      <View className="order-tabs">
        {tabs.map((tab) => (
          <Text
            key={tab.label}
            className={`order-tabs__item ${active === tab.value ? 'order-tabs__item--active' : ''}`}
            onClick={() => {
              setActive(tab.value)
              reload(tab.value)
            }}
          >
            {tab.label}
            {tab.value && counts[tab.value] ? <Text className="order-tabs__badge">{counts[tab.value]}</Text> : null}
          </Text>
        ))}
      </View>
      {!orders.length ? <EmptyState title="暂无订单" description="预定一份甜蜜好味，订单会出现在这里" /> : null}
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onAction={handleAction}
        />
      ))}
    </View>
  )
}
