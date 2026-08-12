import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { Button, Image, Input, Text, View } from '@tarojs/components'
import { useState } from 'react'
import type { CsHomePayload } from '@/types'
import { catalogStore } from '@/store/catalog'
import { cartStore } from '@/store/cart'
import { userStore } from '@/store/user'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProductCard } from '@/components/product/ProductCard'
import { getErrorMessage } from '@/api/client'
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
  const [home, setHome] = useState<CsHomePayload>(catalogStore.getHome())
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const refresh = async () => {
    setLoading(true)
    setLoadError('')
    try {
      setHome(await catalogStore.loadHome())
    } catch (error) {
      setHome(catalogStore.getHome())
      setLoadError(getErrorMessage(error, '首页加载失败，请稍后重试'))
    } finally {
      setLoading(false)
    }
  }

  useDidShow(() => {
    void refresh()
  })

  usePullDownRefresh(() => {
    void refresh().finally(() => Taro.stopPullDownRefresh())
  })

  const addProduct = async (productId: string) => {
    if (!(await userStore.ensureLogin('登录后可加入提篮'))) return
    try {
      await cartStore.add(productId)
      Taro.showToast({ title: '已加入提篮', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '加入失败', icon: 'none' })
    }
  }

  const goCategory = (filter: PendingCategoryFilter) => {
    Taro.setStorageSync(PENDING_FILTER_KEY, filter)
    Taro.switchTab({ url: '/pages/category/index' })
  }

  const search = () => goCategory({ keyword: keyword.trim() })

  const banner = home.banners[0]
  const bannerContent = banner ? (
    <>
      <Text className="home-banner__badge">节气限定</Text>
      <Image className="home-banner__image" src={banner.image} mode="aspectFill" />
      <View className="home-banner__footer">
        <Text className="home-banner__term">{banner.title}</Text>
        <Text className="home-banner__name cs-serif">{banner.subtitle}</Text>
      </View>
    </>
  ) : null

  return (
    <View className="cakeshop-page home-page">
      <AppNavBar title="如 也" />

      <View className="home-brand">
        <Text className="home-brand__slogan">甜品屋 · 一期一会</Text>
        <Text className="cs-seal home-brand__seal">如也</Text>
      </View>

      <View className="home-search cs-hairline">
        <Input
          className="home-search__input"
          value={keyword}
          placeholder="寻找心仪的甜点..."
          confirmType="search"
          onInput={(event) => setKeyword(String(event.detail.value || ''))}
          onConfirm={search}
        />
        <Button className="home-search__action" onClick={search}>搜索</Button>
      </View>

      {loadError && home.recommendedProducts.length ? (
        <View className="home-error">
          <Text>网络刷新失败，当前展示最近缓存</Text>
          <Button className="home-error__retry" onClick={refresh}>重试</Button>
        </View>
      ) : null}

      {banner ? (
        banner.linkUrl ? (
          <Button className="home-banner cakeshop-card" onClick={() => Taro.navigateTo({ url: banner.linkUrl })}>
            {bannerContent}
          </Button>
        ) : (
          <View className="home-banner cakeshop-card">{bannerContent}</View>
        )
      ) : null}

      <View className="home-categories">
        {home.categories.slice(0, 4).map((category, index) => (
          <Button
            key={category.id}
            className="home-categories__item"
            onClick={() => goCategory({ categoryId: category.id })}
          >
            <Text className="home-categories__icon">{CATEGORY_ICONS[index] || '🍰'}</Text>
            <Text className="home-categories__label">{category.name}</Text>
          </Button>
        ))}
      </View>

      {loading && !home.recommendedProducts.length ? (
        <View className="home-loading"><Text>正在加载甜品…</Text></View>
      ) : home.recommendedProducts.length ? (
        <>
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
        </>
      ) : (
        <EmptyState
          title={loadError ? '首页加载失败' : '暂无推荐商品'}
          description={loadError || '稍后再来看看新鲜甜品'}
          actionLabel="重新加载"
          onAction={refresh}
        />
      )}
    </View>
  )
}
