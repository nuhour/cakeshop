import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Image, ScrollView, Text, View } from '@tarojs/components'
import { useState } from 'react'
import type { CsHomePayload } from '@/types'
import { catalogStore } from '@/store/catalog'
import { cartStore } from '@/store/cart'
import { userStore } from '@/store/user'
import { shopStore } from '@/store/shop'
import { demoHome } from '@/store/demo'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { ProductCard } from '@/components/product/ProductCard'
import { openShopContact } from '@/utils/service'
import './index.scss'

export default function HomePage() {
  const [home, setHome] = useState<CsHomePayload>(catalogStore.getHome() || demoHome)
  const profile = userStore.getProfile()

  useDidShow(() => {
    catalogStore.loadHome().then(setHome)
    shopStore.load()
  })

  const addProduct = async (productId: string) => {
    await cartStore.add(productId)
    Taro.showToast({ title: '已加入购物车', icon: 'success' })
  }

  return (
    <View className="cakeshop-page home-page">
      <AppNavBar title="如也甜品屋" />
      <View className="home-member">
        <View>
          <Text className="home-member__hello">{profile?.nickname || '你好，甜品控'}</Text>
          <View className="home-member__stats">
            <Text>积分 {profile?.asset.points ?? 1280}</Text>
            <Text>余额 ¥{(profile?.asset.balance ?? 86).toFixed(2)}</Text>
          </View>
        </View>
        <Button className="home-member__login" onClick={() => userStore.requireLogin('请先登录如也甜品屋')}>登录</Button>
      </View>

      <View className="home-hero" onClick={() => Taro.navigateTo({ url: '/pages/category/index' })}>
        <Image className="home-hero__image" src={home.banners[0]?.image || home.products[0]?.cover} mode="aspectFill" />
        <View className="home-hero__content">
          <Text className="home-hero__tag">今日新鲜出炉</Text>
          <Text className="home-hero__title">{home.banners[0]?.title || '甜蜜新品上架'}</Text>
          <Text className="home-hero__subtitle">{home.banners[0]?.subtitle || '预定下单，预约到店或配送'}</Text>
        </View>
      </View>

      <View className="home-grid">
        {[
          ['生日蛋糕', '/pages/category/index'],
          ['甜点点心', '/pages/category/index'],
          ['饮品礼盒', '/pages/category/index'],
          ['预约订单', '/pages/order/list/index'],
          ['优惠券', '/pages/mine/index'],
          ['收藏', '/pages/mine/index'],
          ['门店', '/pages/checkout/index'],
          ['客服', 'service']
        ].map(([label, url]) => (
          <View key={label} className="home-grid__item" onClick={() => url === 'service' ? openShopContact() : Taro.navigateTo({ url })}>
            <Text className="home-grid__icon">✦</Text>
            <Text>{label}</Text>
          </View>
        ))}
      </View>

      <View className="cakeshop-section-title">
        <Text>今日特惠</Text>
        <Text className="home-more" onClick={() => Taro.navigateTo({ url: '/pages/category/index' })}>查看全部</Text>
      </View>
      <ScrollView className="home-specials" scrollX>
        {home.recommendedProducts.map((product) => (
          <View key={product.id} className="home-specials__item">
            <ProductCard product={product} onAdd={addProduct} />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
