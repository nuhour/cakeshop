import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Image, Text, View } from '@tarojs/components'
import { useState } from 'react'
import type { CsCategory, CsProduct } from '@/types'
import { catalogStore } from '@/store/catalog'
import { cartStore } from '@/store/cart'
import { userStore } from '@/store/user'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { PriceText } from '@/components/ui/PriceText'
import { EmptyState } from '@/components/ui/EmptyState'
import './index.scss'

// 与首页约定的临时筛选缓存 key：switchTab 跳 tabBar 页面时微信不会携带 query 参数，
// 首页把 keyword/categoryId 写入这里，本页读取一次后立即清除。
const PENDING_FILTER_KEY = 'cakeshop_pending_category_filter'

interface PendingCategoryFilter {
  categoryId?: string
  keyword?: string
}

export default function CategoryPage() {
  const [categories, setCategories] = useState<CsCategory[]>(catalogStore.getCategories())
  const [products, setProducts] = useState<CsProduct[]>(catalogStore.getProducts())
  const [active, setActive] = useState(categories[0]?.id || '')
  const [keyword, setKeyword] = useState('')

  const reload = (categoryId: string, nextKeyword: string) => {
    catalogStore.loadProducts({ categoryId, keyword: nextKeyword }).then(setProducts)
  }

  useDidShow(() => {
    const stored = Taro.getStorageSync(PENDING_FILTER_KEY)
    const pending: PendingCategoryFilter | null = stored && typeof stored === 'object' ? stored : null
    if (pending) Taro.removeStorageSync(PENDING_FILTER_KEY)

    catalogStore.loadCategories().then((items) => {
      setCategories(items)
      const nextActive = (pending && pending.categoryId) || active || items[0]?.id || ''
      const nextKeyword = pending ? (pending.keyword || '') : keyword
      setActive(nextActive)
      setKeyword(nextKeyword)
      reload(nextActive, nextKeyword)
    })
  })

  const addProduct = async (id: string) => {
    if (!(await userStore.ensureLogin('登录后可加入提篮'))) return
    try {
      await cartStore.add(id)
      Taro.showToast({ title: '已加入提篮', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '加入失败', icon: 'none' })
    }
  }

  const activeCategory = categories.find((item) => item.id === active)

  return (
    <View className="cakeshop-page category-page">
      <AppNavBar title="如 也" />
      <View className="category-body">
        <View className="category-nav">
          {categories.map((category) => (
            <Text
              key={category.id}
              className={`category-nav__item ${active === category.id ? 'category-nav__item--active' : ''}`}
              onClick={() => {
                setActive(category.id)
                reload(category.id, keyword)
              }}
            >
              {category.name}
            </Text>
          ))}
        </View>

        <View className="category-list">
          <View className="category-list__header cs-hairline">
            <Text className="category-list__title cs-serif">{activeCategory?.name || '全部商品'}</Text>
          </View>

          {products.length ? (
            <View className="category-list__items">
              {products.map((product) => {
                const soldOut = !product.isActive || product.stock <= 0
                const isReservation = product.productType === 'reservation'
                return (
                  <View
                    key={product.id}
                    className={`category-row ${soldOut ? 'category-row--sold-out' : ''}`}
                    onClick={() => Taro.navigateTo({ url: `/pages/product/detail/index?id=${product.id}` })}
                  >
                    <Image className="category-row__thumb" src={product.cover} mode="aspectFill" />
                    <View className="category-row__body">
                      <Text className="category-row__name cs-serif">{product.name}</Text>
                      <Text className="category-row__subtitle">{product.subtitle}</Text>
                      <View className="category-row__footer">
                        <PriceText value={product.price} original={product.originalPrice} size="small" />
                        <Button
                          className={`category-row__add ${isReservation ? 'category-row__add--reserve' : ''}`}
                          disabled={soldOut}
                          onClick={(event) => {
                            event.stopPropagation()
                            if (soldOut) return
                            addProduct(product.id)
                          }}
                        >
                          {soldOut ? '售罄' : isReservation ? '预定' : '+'}
                        </Button>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          ) : (
            <EmptyState title="暂无相关商品" description="换个分类或关键词试试" />
          )}
        </View>
      </View>
    </View>
  )
}
