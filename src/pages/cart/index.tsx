import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Image, Text, View } from '@tarojs/components'
import { useState } from 'react'
import type { CsCartItem } from '@/types'
import { cartStore } from '@/store/cart'
import { catalogStore } from '@/store/catalog'
import { checkoutStore } from '@/store/checkout'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { PriceText } from '@/components/ui/PriceText'
import './index.scss'

export default function CartPage() {
  const [items, setItems] = useState<CsCartItem[]>(cartStore.getItems())

  const reload = () => setItems([...cartStore.getItems()])
  useDidShow(() => {
    cartStore.load().then(setItems)
  })

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
    checkoutStore.set({ source: 'cart', slotId: undefined })
    Taro.navigateTo({ url: '/pages/checkout/index' })
  }

  return (
    <View className="cakeshop-page cart-page">
      <AppNavBar title="提篮" />
      {showReservationNotice ? (
        <View className="cart-notice">
          <Text className="cart-notice__icon">◔</Text>
          <Text className="cart-notice__text">本单含定制蛋糕，将整单按预约时段交付</Text>
        </View>
      ) : null}
      {!items.length ? <EmptyState title="提篮还是空的" description="先去挑几样美味甜品吧" /> : null}
      {items.map((item) => {
        const product = catalogStore.findProduct(item.productId)
        if (!product) return null
        const invalid = !product.isActive || product.stock <= 0 || item.quantity > product.stock
        const specName = product.specs.find((spec) => spec.id === item.specId)?.name
        const flavorName = product.flavors.find((flavor) => flavor.id === item.flavorId)?.name
        return (
          <View key={`${item.productId}-${item.flavorId}-${item.specId}-${item.plaqueText || ''}`} className={`cart-item ${invalid ? 'cart-item--invalid' : ''}`}>
            <View
              className={`cart-item__check ${item.selected ? 'cart-item__check--active' : ''}`}
              onClick={() => {
                if (invalid && !item.selected) {
                  Taro.showToast({ title: product.stock <= 0 ? '商品已售罄' : '库存不足', icon: 'none' })
                  return
                }
                cartStore.toggle(item.productId, item.flavorId, item.specId, item.plaqueText).then(reload)
              }}
            />
            <Image className="cart-item__image" src={product.cover} mode="aspectFill" />
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
                <PriceText value={product.price} size="small" />
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
      <View className="cart-bar">
        <View>
          <Text className="cart-bar__label">合计</Text>
          <PriceText value={cartStore.getSelectedTotal()} />
        </View>
        <Button className="cart-bar__button" disabled={!canCheckout} onClick={checkout}>结算</Button>
      </View>
    </View>
  )
}
