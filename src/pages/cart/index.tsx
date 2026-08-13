import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { CsCartItem, CsProduct } from '@/types'
import { cartStore } from '@/store/cart'
import { catalogStore } from '@/store/catalog'
import { checkoutStore } from '@/store/checkout'
import { userStore } from '@/store/user'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { PriceText } from '@/components/ui/PriceText'
import { ProductImage } from '@/components/product/ProductImage'
import { getProductUnitPrice } from '@/utils/pricing'
import { getErrorMessage } from '@/api/client'
import './index.scss'

export default function CartPage() {
  const [loggedIn, setLoggedIn] = useState(userStore.isLoggedIn())
  const [items, setItems] = useState<CsCartItem[]>(userStore.isLoggedIn() ? cartStore.getItems() : [])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => userStore.onLoginRequired(() => {
    setLoggedIn(false)
    setItems([])
    setLoadError('')
  }), [])

  const reload = () => setItems([...cartStore.getItems()])
  const refresh = async () => {
    setLoading(true)
    setLoadError('')
    const errors: string[] = []
    try {
      await catalogStore.loadProducts()
    } catch (error) {
      errors.push(getErrorMessage(error, '商品信息刷新失败'))
    }
    try {
      await cartStore.load()
    } catch (error) {
      errors.push(getErrorMessage(error, '提篮同步失败'))
    }
    // 401 会先触发登录失效事件，避免并发刷新把本地旧提篮重新渲染出来。
    if (userStore.isLoggedIn()) reload()
    else setItems([])
    setLoadError(errors[0] || '')
    setLoading(false)
  }

  useDidShow(() => {
    const authed = userStore.isLoggedIn()
    setLoggedIn(authed)
    if (authed) {
      // 先补齐商品缓存，避免用户从搜索/单一分类进入后，提篮中的其它分类商品缺少名称和价格。
      void refresh()
    } else {
      setItems([])
      setLoadError('')
    }
  })

  const login = async () => {
    try {
      await userStore.login()
      setLoggedIn(true)
      await refresh()
      Taro.showToast({ title: '登录成功', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '登录失败', icon: 'none' })
    }
  }

  const toggleSelection = async (item: CsCartItem, product: CsProduct, invalid: boolean) => {
    if (invalid && !item.selected) {
      Taro.showToast({ title: product.stock <= 0 ? '商品已售罄' : '库存不足', icon: 'none' })
      return
    }
    try {
      await cartStore.toggle(item.productId, item.flavorId, item.specId, item.plaqueText)
      reload()
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '选择状态同步失败', icon: 'none' })
    }
  }

  const stockWarnings = cartStore.getSelectedStockWarnings()
  const selectedItems = cartStore.getSelectedItems()
  const canCheckout = Boolean(selectedItems.length) && stockWarnings.length === 0
  const showReservationNotice = cartStore.hasSelectedReservation()

  const checkout = () => {
    if (!selectedItems.length) {
      Taro.showToast({ title: '请选择商品', icon: 'none' })
      return
    }
    if (stockWarnings.length) {
      Taro.showToast({ title: stockWarnings[0], icon: 'none' })
      return
    }
    checkoutStore.start({ source: 'cart' })
    Taro.navigateTo({ url: '/pages/checkout/index' })
  }

  return (
    <View className="cakeshop-page cart-page">
      <AppNavBar title="提篮" />
      {loggedIn && loadError ? (
        <View className="cart-error">
          <Text>{loadError}</Text>
          <Button className="cart-error__retry" onClick={refresh}>重试</Button>
        </View>
      ) : null}
      {showReservationNotice ? (
        <View className="cart-notice">
          <Text className="cart-notice__icon">◔</Text>
          <Text className="cart-notice__text">本单含定制蛋糕，将整单按预约时段交付</Text>
        </View>
      ) : null}
      {!loggedIn ? (
        <View>
          <EmptyState title="登录后查看提篮" description="登录同步你的提篮与订单" />
          <Button className="cs-login-btn" onClick={login}>微信一键登录</Button>
        </View>
      ) : null}
      {loggedIn && loading && !items.length ? <View className="cart-loading"><Text>正在同步提篮…</Text></View> : null}
      {loggedIn && !loading && !items.length ? (
        <EmptyState
          title="提篮还是空的"
          description="先去挑几样美味甜品吧"
          actionLabel="去逛逛"
          onAction={() => Taro.switchTab({ url: '/pages/category/index' })}
        />
      ) : null}
      {items.map((item) => {
        const product = catalogStore.findProduct(item.productId)
        if (!product) return null
        const invalid = !product.isActive || product.stock <= 0 || item.quantity > product.stock
        const specName = product.specs.find((spec) => spec.id === item.specId)?.name
        const flavorName = product.flavors.find((flavor) => flavor.id === item.flavorId)?.name
        return (
          <View key={`${item.productId}-${item.flavorId}-${item.specId}-${item.plaqueText || ''}`} className={`cart-item ${invalid ? 'cart-item--invalid' : ''}`}>
            <Button
              className={`cart-item__check ${item.selected ? 'cart-item__check--active' : ''}`}
              onClick={() => void toggleSelection(item, product, invalid)}
            >
              <Text className="cart-item__checkmark">{item.selected ? '✓' : ''}</Text>
            </Button>
            <ProductImage productId={product.id} src={product.cover} className="cart-item__image" />
            <View className="cart-item__body">
              <Text className="cart-item__name">{product.name}</Text>
              <Text className="cart-item__sub">{invalid ? (product.stock <= 0 ? '已售罄，请移除后重新选择' : `库存仅剩 ${product.stock} 件`) : product.subtitle}</Text>
              {specName || flavorName ? (
                <View className="cart-item__tags">
                  {specName ? <Text className="cart-item__tag">{specName}</Text> : null}
                  {flavorName ? <Text className="cart-item__tag">{flavorName}</Text> : null}
                </View>
              ) : null}
              {item.plaqueText ? <Text className="cart-item__plaque">贺牌：{item.plaqueText}</Text> : null}
              <View className="cart-item__foot">
                <PriceText value={getProductUnitPrice(product, item.specId)} size="small" />
                <View className="cart-item__stepper">
                  <Button onClick={() => cartStore.setQuantity(item.productId, item.quantity - 1, item.flavorId, item.specId, item.plaqueText).then(reload).catch((error) => Taro.showToast({ title: error instanceof Error ? error.message : '调整失败', icon: 'none' }))}>-</Button>
                  <Text>{item.quantity}</Text>
                  <Button disabled={item.quantity >= product.stock} onClick={() => cartStore.setQuantity(item.productId, item.quantity + 1, item.flavorId, item.specId, item.plaqueText).then(reload).catch((error) => Taro.showToast({ title: error instanceof Error ? error.message : '调整失败', icon: 'none' }))}>+</Button>
                </View>
              </View>
            </View>
          </View>
        )
      })}
      {loggedIn ? (
        <View className="cart-bar">
          <View>
            <Text className="cart-bar__label">合计</Text>
            <PriceText value={cartStore.getSelectedTotal()} />
          </View>
          <Button className="cart-bar__button" disabled={!canCheckout} onClick={checkout}>结算</Button>
        </View>
      ) : null}
    </View>
  )
}
