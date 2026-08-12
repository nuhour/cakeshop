import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Input, Text, View } from '@tarojs/components'
import { useRef, useState } from 'react'
import type { CsCategory, CsProduct } from '@/types'
import { catalogStore } from '@/store/catalog'
import { cartStore } from '@/store/cart'
import { userStore } from '@/store/user'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { PriceText } from '@/components/ui/PriceText'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProductImage } from '@/components/product/ProductImage'
import { getErrorMessage } from '@/api/client'
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
  const [draftKeyword, setDraftKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const requestId = useRef(0)

  const reload = async (categoryId: string, nextKeyword: string, inheritedError = '') => {
    const currentRequest = ++requestId.current
    setLoading(true)
    setLoadError(inheritedError)
    try {
      const items = await catalogStore.loadProducts({ categoryId: categoryId || undefined, keyword: nextKeyword })
      if (currentRequest !== requestId.current) return
      setProducts(items)
    } catch (error) {
      if (currentRequest !== requestId.current) return
      setProducts([])
      setLoadError(getErrorMessage(error, '商品加载失败，请稍后重试'))
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }

  useDidShow(() => {
    const stored = Taro.getStorageSync(PENDING_FILTER_KEY)
    const pending: PendingCategoryFilter | null = stored && typeof stored === 'object' ? stored : null
    if (pending) Taro.removeStorageSync(PENDING_FILTER_KEY)

    const initialize = async () => {
      let items = catalogStore.getCategories()
      let categoryError = ''
      try {
        items = await catalogStore.loadCategories()
      } catch (error) {
        categoryError = getErrorMessage(error, '分类加载失败，请稍后重试')
      }
      setCategories(items)
      // 只有切换品类时才带 categoryId，单独搜索应覆盖全部品类。
      const requestedActive = (pending && pending.categoryId) || (pending?.keyword ? '' : active)
      const nextActive = pending?.keyword
        ? ''
        : requestedActive && items.some((item) => item.id === requestedActive)
          ? requestedActive
          : items[0]?.id || ''
      const nextKeyword = pending ? (pending.keyword || '') : keyword
      setActive(nextActive)
      setKeyword(nextKeyword)
      setDraftKeyword(nextKeyword)
      await reload(nextActive, nextKeyword, categoryError)
    }
    void initialize()
  })

  const selectCategory = (categoryId: string) => {
    setActive(categoryId)
    void reload(categoryId, keyword)
  }

  const search = () => {
    const nextKeyword = draftKeyword.trim()
    // 输入关键词时切换到全部品类，避免当前分类条件把搜索结果悄悄过滤掉。
    const nextActive = nextKeyword ? '' : active
    setActive(nextActive)
    setKeyword(nextKeyword)
    void reload(nextActive, nextKeyword)
  }

  const clearKeyword = () => {
    setDraftKeyword('')
    setKeyword('')
    void reload(active, '')
  }

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
      <View className="category-search">
        <Text className="category-search__icon">⌕</Text>
        <Input
          className="category-search__input"
          value={draftKeyword}
          placeholder="搜索商品"
          confirmType="search"
          onInput={(event) => setDraftKeyword(String(event.detail.value || ''))}
          onConfirm={search}
        />
        {draftKeyword ? <Button className="category-search__clear" onClick={clearKeyword}>清除</Button> : null}
        <Button className="category-search__submit" onClick={search}>搜索</Button>
      </View>
      <View className="category-body">
        <View className="category-nav">
          <Button
            className={`category-nav__item ${active === '' ? 'category-nav__item--active' : ''}`}
            onClick={() => selectCategory('')}
          >全部</Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              className={`category-nav__item ${active === category.id ? 'category-nav__item--active' : ''}`}
              onClick={() => selectCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </View>

        <View className="category-list">
          <View className="category-list__header cs-hairline">
            <Text className="category-list__title cs-serif">{activeCategory?.name || '全部商品'}</Text>
            <Text className="category-list__summary">
              {keyword ? `关键词“${keyword}” · ` : ''}{loading ? '正在加载' : `${products.length} 件`}
            </Text>
          </View>

          {loadError && products.length ? (
            <View className="category-error">
              <Text>{loadError}</Text>
              <Button className="category-error__retry" onClick={() => reload(active, keyword)}>重试</Button>
            </View>
          ) : null}

          {loading ? (
            <View className="category-list__loading">
              <Text>加载中…</Text>
            </View>
          ) : loadError ? (
            <EmptyState
              title="商品加载失败"
              description={loadError}
              actionLabel="重新加载"
              onAction={() => reload(active, keyword)}
            />
          ) : products.length ? (
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
                    <ProductImage productId={product.id} src={product.cover} className="category-row__thumb" />
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
                            if (isReservation) {
                              Taro.navigateTo({ url: `/pages/product/detail/index?id=${product.id}` })
                              return
                            }
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
            <EmptyState
              title="暂无相关商品"
              description={keyword ? `没有找到与“${keyword}”相关的商品` : '换个分类试试'}
              actionLabel={keyword ? '清除关键词' : undefined}
              onAction={keyword ? clearKeyword : undefined}
            />
          )}
        </View>
      </View>
    </View>
  )
}
