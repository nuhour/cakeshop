import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import { useState } from 'react'
import type { CsUserProfile } from '@/types'
import { userStore } from '@/store/user'
import { orderStore } from '@/store/order'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { statusGroupForMine } from '@/utils/orderActions'
import { openShopContact } from '@/utils/service'
import './index.scss'

export default function MinePage() {
  const [profile, setProfile] = useState<CsUserProfile | null>(userStore.getProfile())
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>(orderStore.statusCounts())
  const asset = profile?.asset || { balance: 86, points: 1280, couponCount: 3 }

  useDidShow(() => {
    if (userStore.isLoggedIn()) {
      userStore.loadProfile().then((next) => setProfile(next ? { ...next } : null))
      orderStore.load().then(() => setOrderCounts(orderStore.statusCounts()))
    }
  })

  const login = async () => {
    try {
      const next = await userStore.login()
      setProfile(next ? { ...next } : null)
      Taro.showToast({ title: '登录成功', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '登录失败', icon: 'none' })
    }
  }

  const logout = () => {
    userStore.logout()
    setProfile(null)
    setOrderCounts({})
    Taro.showToast({ title: '已退出', icon: 'success' })
  }

  return (
    <View className="cakeshop-page mine-page">
      <AppNavBar title="我的" />
      <View className="mine-card">
        <View>
          <Text className="mine-name">{profile?.nickname || '如也甜品屋会员'}</Text>
          <Text className="mine-level">{profile?.level || '暖麦会员'}</Text>
        </View>
        <Button className="mine-login" onClick={profile ? logout : login}>{profile ? '退出' : '登录'}</Button>
      </View>
      <View className="mine-assets">
        <View><Text className="mine-assets__value">¥{asset.balance.toFixed(2)}</Text><Text>余额</Text></View>
        <View><Text className="mine-assets__value">{asset.couponCount}</Text><Text>优惠券</Text></View>
        <View><Text className="mine-assets__value">{asset.points}</Text><Text>积分</Text></View>
      </View>
      <View className="mine-section">
        <View className="mine-section__head">
          <Text>我的订单</Text>
          <Text onClick={() => Taro.navigateTo({ url: '/pages/order/list/index' })}>全部订单 ›</Text>
        </View>
        <View className="mine-order-grid">
          {statusGroupForMine.map((item) => (
            <View
              key={item.value}
              className="mine-order-grid__item"
              onClick={() => Taro.navigateTo({ url: `/pages/order/list/index?status=${item.value}` })}
            >
              {orderCounts[item.value] ? <Text className="mine-order-grid__badge">{orderCounts[item.value]}</Text> : null}
              <Text>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <View className="mine-menu">
        {[
          ['收货地址', '/pages/address/list/index'],
          ['我的收藏', '/pages/mine/index'],
          ['优惠券', '/pages/mine/index'],
          ['积分商城', '/pages/mine/index'],
          ['联系客服', 'service'],
          ['隐私协议', '/pages/mine/index']
        ].map(([label, url]) => (
          <View key={label} className="mine-menu__item" onClick={() => url === 'service' ? openShopContact() : Taro.navigateTo({ url })}>
            <Text>{label}</Text>
            <Text>›</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
