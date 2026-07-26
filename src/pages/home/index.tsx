import Taro, { useDidShow } from '@tarojs/taro'
import { Image, Input, Text, View } from '@tarojs/components'
import { useState } from 'react'
import type { CsHomePayload } from '@/types'
import { catalogStore } from '@/store/catalog'
import { cartStore } from '@/store/cart'
import { demoHome } from '@/store/demo'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { ProductCard } from '@/components/product/ProductCard'
import './index.scss'

const CATEGORY_ICONS = ['🍰', '🧁', '🍵', '🎁']

// switchTab（跳转 tabBar 页面）在微信小程序真机上不会携带 query 参数，
// 用本地缓存把筛选条件传给分类页，由分类页在 useDidShow 里读取并清除。
const PENDING_FILTER_KEY = 'cakeshop_pending_category_filter'

interface PendingCategoryFilter {
  categoryId?: string
  keyword?: string
}

export default function HomePage() {
  const [home, setHome] = useState<CsHomePayload>(catalogStore.getHome() || demoHome)
  const [keyword, setKeyword] = useState('')

  useDidShow(() => {
    catalogStore.loadHome().then(setHome)
  })

  const addProduct = async (productId: string) => {
    try {
      await cartStore.add(productId)
      Taro.showToast({ title: '已加入购物车', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '加入失败', icon: 'none' })
    }
  }

  const goCategory = (filter: PendingCategoryFilter) => {
    Taro.setStorageSync(PENDING_FILTER_KEY, filter)
    Taro.switchTab({ url: '/pages/category/index' })
  }

  const banner = home.banners[0]

  return (
    <View className="cakeshop-page home-page">
      <AppNavBar title="如 也" />

      <View className="home-brand">
        <Text className="home-brand__slogan">甜品屋 · 一期一会</Text>
        <Text className="cs-seal home-brand__seal">如也</Text>
      </View>

      <View className="home-search cs-hairline" onClick={() => goCategory({ keyword })}>
        <Text className="home-search__icon">◎</Text>
        <Input
          className="home-search__input"
          value={keyword}
          placeholder="寻找心仪的甜点..."
          confirmType="search"
          onInput={(event) => setKeyword(String(event.detail.value || ''))}
          onConfirm={() => goCategory({ keyword })}
        />
      </View>

      {banner ? (
        <View
          className="home-banner cakeshop-card"
          onClick={() => banner.linkUrl && Taro.navigateTo({ url: banner.linkUrl })}
        >
          <Text className="home-banner__badge">节气限定</Text>
          <Image className="home-banner__image" src={banner.image} mode="aspectFill" />
          <View className="home-banner__footer">
            <Text className="home-banner__term">{banner.title}</Text>
            <Text className="home-banner__name cs-serif">{banner.subtitle}</Text>
          </View>
        </View>
      ) : null}

      <View className="home-categories">
        {home.categories.slice(0, 4).map((category, index) => (
          <View
            key={category.id}
            className="home-categories__item"
            onClick={() => goCategory({ categoryId: category.id })}
          >
            <Text className="home-categories__icon">{CATEGORY_ICONS[index] || '🍰'}</Text>
            <Text className="home-categories__label">{category.name}</Text>
          </View>
        ))}
      </View>

      <View className="cakeshop-section-title">
        <Text className="cs-serif">今日推荐</Text>
      </View>
      <View className="home-recommend">
        {home.recommendedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            productType={product.productType}
            leadTimeHours={product.leadTimeHours}
            onAdd={addProduct}
          />
        ))}
      </View>
    </View>
  )
}
