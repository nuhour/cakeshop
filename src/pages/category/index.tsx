import Taro, { useDidShow } from '@tarojs/taro'
import { Input, Text, View } from '@tarojs/components'
import { useState } from 'react'
import type { CsCategory, CsProduct } from '@/types'
import { catalogStore } from '@/store/catalog'
import { cartStore } from '@/store/cart'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { ProductCard } from '@/components/product/ProductCard'
import './index.scss'

export default function CategoryPage() {
  const [categories, setCategories] = useState<CsCategory[]>(catalogStore.getCategories())
  const [products, setProducts] = useState<CsProduct[]>(catalogStore.getProducts())
  const [active, setActive] = useState(categories[0]?.id || '')
  const [keyword, setKeyword] = useState('')

  const reload = (categoryId = active, nextKeyword = keyword) => {
    catalogStore.loadProducts({ categoryId, keyword: nextKeyword }).then(setProducts)
  }

  useDidShow(() => {
    catalogStore.loadCategories().then((items) => {
      setCategories(items)
      const first = active || items[0]?.id || ''
      setActive(first)
      catalogStore.loadProducts({ categoryId: first }).then(setProducts)
    })
  })

  return (
    <View className="cakeshop-page category-page">
      <AppNavBar title="如也甜品屋" />
      <View className="category-search">
        <Input
          value={keyword}
          placeholder="搜索蛋糕、甜点..."
          onInput={(event) => {
            const value = String(event.detail.value || '')
            setKeyword(value)
            reload(active, value)
          }}
        />
      </View>
      <View className="category-tabs">
        {categories.map((category) => (
          <Text
            key={category.id}
            className={`category-tabs__item ${active === category.id ? 'category-tabs__item--active' : ''}`}
            onClick={() => {
              setActive(category.id)
              reload(category.id)
            }}
          >
            {category.name}
          </Text>
        ))}
      </View>
      <View className="category-title">{categories.find((item) => item.id === active)?.name || '全部商品'}</View>
      <View className="category-products">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAdd={async (id) => {
              try {
                await cartStore.add(id)
                Taro.showToast({ title: '已加入购物车', icon: 'success' })
              } catch (error) {
                Taro.showToast({ title: error instanceof Error ? error.message : '加入失败', icon: 'none' })
              }
            }}
          />
        ))}
      </View>
    </View>
  )
}
