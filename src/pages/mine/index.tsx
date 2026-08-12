import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Image, Text, View } from '@tarojs/components'
import { useState } from 'react'
import type { CsMemberAsset, CsUserProfile } from '@/types'
import { userStore } from '@/store/user'
import { orderStore } from '@/store/order'
import { csApi } from '@/api/cakeshop'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { statusGroupForMine } from '@/utils/orderActions'
import { openShopContact } from '@/utils/service'
import './index.scss'

const emptyAsset: CsMemberAsset = { balance: 0, points: 0, couponCount: 0 }

const ORDER_ICONS: Record<string, string> = {
  pendingPay: '💰',
  preparing: '🧁',
  readyForPickup: '🎂',
  delivering: '🚲'
}

const TERMS_CONTENT = [
  '《用户服务协议》',
  '欢迎您使用「如也」甜品屋提供的服务。在开始这段寻味之旅前，请仔细阅读本协议。我们崇尚自然、节制的美学，同样希望在服务条款中保持清晰与坦诚。',
  '1. 服务的接受与修改：当您使用我们的应用程序、网站或进入实体门店点单时，即表示您已阅读并同意本协议的全部内容。如也保留随时基于业务需要修改本协议的权利，修改后的内容将通过官方渠道公布。',
  '2. 账号注册与使用：您需要提供真实、准确的个人资料完成注册；请妥善保管您的账号密码，因保管不善造成的损失由用户自行承担；如也积分（雅集点）仅限本人使用，不得转让或售卖。',
  '3. 订单与支付：我们的产品多采用应季鲜材，部分限量供应。订单一经确认，除不可抗力外，原则上不支持无理由取消。请在点单前仔细核对商品信息及取餐时间。',
  '',
  '《隐私政策》',
  '在如也，我们尊重留白——不仅在设计与口味上，也在您的数字生活里。我们承诺仅收集为您提供优质服务所必需的信息，并妥善保护您的隐私安全。',
  '1. 我们收集的信息：为完成订单配送、积分累积及个性化推荐，我们可能收集您的基础信息（如手机号码、昵称）、交易信息（如订单历史、偏好口味）、设备信息（如操作系统版本，仅用于改善应用体验）。',
  '2. 信息的存储与保护：您的数据存储于安全的加密服务器中，我们采用符合行业标准的安全技术防止信息丢失、不当使用或未经授权的访问，绝不会将您的个人信息出售给第三方机构。',
  '3. 您的权利：您随时可以在应用内查看、修改您的个人信息，或联系客服申请注销账号。账号注销后，除法律法规要求保留的交易记录外，其余个人数据将被彻底清除。'
].join('\n')

export default function MinePage() {
  const [loggedIn, setLoggedIn] = useState(userStore.isLoggedIn())
  const [profile, setProfile] = useState<CsUserProfile | null>(loggedIn ? userStore.getProfile() : null)
  const [asset, setAsset] = useState<CsMemberAsset>((loggedIn && userStore.getProfile()?.asset) || emptyAsset)
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>(loggedIn ? orderStore.statusCounts() : {})

  useDidShow(() => {
    const authed = userStore.isLoggedIn()
    setLoggedIn(authed)
    if (authed) {
      userStore.loadProfile().then((next) => setProfile(next ? { ...next } : null))
      csApi.assets().then(setAsset).catch(() => {})
      orderStore.load().then(() => setOrderCounts(orderStore.statusCounts())).catch(() => {})
    } else {
      setProfile(null)
      setAsset(emptyAsset)
      setOrderCounts({})
    }
  })

  const login = async () => {
    try {
      const next = await userStore.login()
      setLoggedIn(true)
      setProfile(next ? { ...next } : null)
      csApi.assets().then(setAsset).catch(() => {})
      orderStore.load().then(() => setOrderCounts(orderStore.statusCounts())).catch(() => {})
      Taro.showToast({ title: '登录成功', icon: 'success' })
      return true
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '登录失败', icon: 'none' })
      return false
    }
  }

  const ensureLoggedIn = async () => {
    if (userStore.isLoggedIn()) return true
    return login()
  }

  const logout = () => {
    userStore.logout()
    setLoggedIn(false)
    setProfile(null)
    setAsset(emptyAsset)
    setOrderCounts({})
    Taro.showToast({ title: '已退出', icon: 'success' })
  }

  const showTerms = () => {
    Taro.showModal({
      title: '条款与隐私',
      content: TERMS_CONTENT,
      showCancel: false,
      confirmText: '我知道了'
    })
  }

  const menuItems: Array<{ icon: string; label: string; onClick: () => void }> = [
    {
      icon: '📍',
      label: '地址管理',
      onClick: async () => {
        if (await ensureLoggedIn()) Taro.navigateTo({ url: '/pages/address/list/index' })
      }
    },
    { icon: '📞', label: '联系客服', onClick: () => openShopContact() },
    { icon: '📜', label: '条款与隐私', onClick: showTerms }
  ]

  return (
    <View className="cakeshop-page mine-page">
      <AppNavBar title="我的" />

      <View className="mine-card">
        <View className="mine-card__avatar">
          {profile?.avatar ? (
            <Image className="mine-card__avatar-img" src={profile.avatar} mode="aspectFill" />
          ) : (
            <Text className="mine-card__avatar-fallback">{(profile?.nickname || '如')[0]}</Text>
          )}
        </View>
        <View className="mine-card__info">
          <Text className="mine-card__name cs-serif">{loggedIn ? (profile?.nickname || '如也甜品屋会员') : '未登录'}</Text>
          <Text className="mine-card__level">{loggedIn ? (profile?.level || '如也会员') : '登录后同步会员权益与订单'}</Text>
        </View>
        <Text className="cs-seal mine-card__seal">如也</Text>
        <Button className="mine-card__auth" onClick={loggedIn ? logout : login}>{loggedIn ? '退出' : '登录'}</Button>
      </View>

      <Button className="mine-assets cakeshop-card" onClick={loggedIn ? undefined : login}>
        <View className="mine-assets__item">
          <Text className="mine-assets__value cs-serif">{loggedIn ? `¥${asset.balance.toFixed(2)}` : '--'}</Text>
          <Text className="mine-assets__label">余额</Text>
        </View>
        <View className="mine-assets__item">
          <Text className="mine-assets__value cs-serif">{loggedIn ? asset.points : '--'}</Text>
          <Text className="mine-assets__label">积分</Text>
        </View>
        <View className="mine-assets__item">
          <Text className="mine-assets__value cs-serif">{loggedIn ? asset.couponCount : '--'}</Text>
          <Text className="mine-assets__label">优惠券</Text>
        </View>
        {!loggedIn ? <Text className="mine-assets__hint">登录后查看会员资产</Text> : null}
      </Button>

      <View className="mine-section cakeshop-card">
        <View className="mine-section__head cs-hairline">
          <Text className="cs-serif">我的订单</Text>
          <Button
            className="mine-section__more"
            onClick={async () => {
              if (await ensureLoggedIn()) Taro.navigateTo({ url: '/pages/order/list/index' })
            }}
          >全部订单 ›</Button>
        </View>
        <View className="mine-order-grid">
          {statusGroupForMine.map((item) => (
            <Button
              key={item.value}
              className="mine-order-grid__item"
              onClick={async () => {
                if (await ensureLoggedIn()) Taro.navigateTo({ url: `/pages/order/list/index?status=${item.value}` })
              }}
            >
              <View className="mine-order-grid__icon">
                <Text>{ORDER_ICONS[item.value] || '🍰'}</Text>
                {orderCounts[item.value] ? <Text className="mine-order-grid__badge">{orderCounts[item.value]}</Text> : null}
              </View>
              <Text className="mine-order-grid__label">{item.label}</Text>
            </Button>
          ))}
        </View>
      </View>

      <View className="mine-menu cakeshop-card">
        {menuItems.map((item) => (
          <Button key={item.label} className="mine-menu__item" onClick={item.onClick}>
            <Text className="mine-menu__icon">{item.icon}</Text>
            <Text className="mine-menu__label">{item.label}</Text>
            <Text className="mine-menu__arrow">›</Text>
          </Button>
        ))}
      </View>
    </View>
  )
}
