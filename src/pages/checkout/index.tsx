import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Input, Text, Textarea, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { FulfillmentType, CsFulfillmentSlot, CsOrderPreview, CsStore } from '@/types'
import { checkoutStore, type CsCheckoutState } from '@/store/checkout'
import { slotStore } from '@/store/slot'
import { orderStore } from '@/store/order'
import { cartStore } from '@/store/cart'
import { catalogStore } from '@/store/catalog'
import { addressStore } from '@/store/address'
import { userStore } from '@/store/user'
import { csApi } from '@/api/cakeshop'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { SlotPicker } from '@/components/order/SlotPicker'
import { PriceText } from '@/components/ui/PriceText'
import './index.scss'

export default function CheckoutPage() {
  const [checkout, setCheckout] = useState<CsCheckoutState>(checkoutStore.get())
  const [stores, setStores] = useState<CsStore[]>(slotStore.getStores())
  const [slots, setSlots] = useState<CsFulfillmentSlot[]>(slotStore.getSlots())
  const [addresses, setAddresses] = useState(addressStore.getList())
  const [preview, setPreview] = useState<CsOrderPreview | null>(null)
  const [previewError, setPreviewError] = useState('')

  const sync = (next: Partial<CsCheckoutState>) => {
    checkoutStore.set(next)
    const merged = checkoutStore.get()
    setCheckout({ ...merged })
    slotStore.loadSlots({ fulfillmentType: merged.fulfillmentType, storeId: merged.storeId }).then(setSlots)
  }

  useDidShow(() => {
    slotStore.loadStores().then((items) => {
      setStores(items)
      if (!checkout.storeId && items[0]) sync({ storeId: items[0].id })
    })
    slotStore.loadSlots({ fulfillmentType: checkout.fulfillmentType, storeId: checkout.storeId }).then(setSlots)
    if (userStore.isLoggedIn()) {
      addressStore.load().then((items) => {
        setAddresses([...items])
        const defaultAddress = items.find((item) => item.isDefault) || items[0]
        if (!checkout.addressId && defaultAddress) sync({ addressId: defaultAddress.id })
      })
    }
  })

  const selectedItems = checkout.source === 'buyNow' && checkout.productId
    ? [{ productId: checkout.productId, quantity: checkout.quantity || 1 }]
    : cartStore.getSelectedItems()
  const productAmount = selectedItems.reduce((total, item) => {
    const product = catalogStore.findProduct(item.productId)
    return total + (product?.price || 0) * item.quantity
  }, 0)
  const deliveryAmount = checkout.fulfillmentType === 'delivery' ? 8 : 0
  const pointsAmount = checkout.usePoints ? Math.min(5, productAmount) : 0
  const selectedKey = selectedItems.map((item) => `${item.productId}:${item.quantity}:${item.flavorId || ''}:${item.specId || ''}`).join('|')
  const displayProductAmount = preview?.productAmount ?? productAmount
  const displayDeliveryAmount = preview?.deliveryAmount ?? deliveryAmount
  const displayCouponAmount = preview?.couponAmount ?? 0
  const displayPointsAmount = preview?.pointsAmount ?? pointsAmount
  const total = preview?.payableAmount ?? Math.max(0, productAmount + deliveryAmount - pointsAmount)

  useEffect(() => {
    if (!checkout.slotId || !selectedItems.length || !userStore.isLoggedIn()) {
      setPreview(null)
      setPreviewError('')
      return
    }
    let active = true
    setPreviewError('')
    csApi.previewOrder(checkout)
      .then((nextPreview) => {
        if (!active) return
        setPreview(nextPreview)
      })
      .catch((error) => {
        if (!active) return
        setPreview(null)
        setPreviewError(error instanceof Error ? error.message : '价格计算失败')
      })
    return () => {
      active = false
    }
  }, [
    checkout.source,
    checkout.productId,
    checkout.quantity,
    checkout.flavorId,
    checkout.specId,
    checkout.fulfillmentType,
    checkout.storeId,
    checkout.addressId,
    checkout.slotId,
    checkout.selectedCouponId,
    checkout.usePoints,
    selectedKey
  ])

  const submit = async () => {
    const warnings = checkout.source === 'cart' ? cartStore.getSelectedStockWarnings() : selectedItems.map((item) => {
      const product = catalogStore.findProduct(item.productId)
      if (!product || !product.isActive) return '商品已下架'
      if (product.stock <= 0) return `${product.name} 已售罄`
      if (item.quantity > product.stock) return `${product.name} 库存仅剩 ${product.stock} 件`
      return ''
    }).filter(Boolean)
    if (warnings.length) {
      Taro.showToast({ title: warnings[0], icon: 'none' })
      return
    }
    if (!checkout.slotId) {
      Taro.showToast({ title: '请选择预约时段', icon: 'none' })
      return
    }
    if (checkout.fulfillmentType === 'pickup' && (!checkout.pickupContactName || !checkout.pickupContactPhone)) {
      Taro.showToast({ title: '请填写取货人信息', icon: 'none' })
      return
    }
    if (checkout.fulfillmentType === 'delivery' && !checkout.addressId) {
      Taro.showToast({ title: '请选择配送地址', icon: 'none' })
      return
    }
    try {
      const order = await orderStore.createOrder(checkout)
      Taro.navigateTo({ url: `/pages/order/detail/index?id=${order.id}` })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '提交失败', icon: 'none' })
    }
  }

  return (
    <View className="cakeshop-page checkout-page">
      <AppNavBar title="预约结算" back />
      <View className="checkout-card">
        <Text className="checkout-title">履约方式</Text>
        <View className="checkout-segment">
          {(['pickup', 'delivery'] as FulfillmentType[]).map((type) => (
            <Text key={type} className={`checkout-segment__item ${checkout.fulfillmentType === type ? 'checkout-segment__item--active' : ''}`} onClick={() => sync({ fulfillmentType: type, slotId: undefined })}>
              {type === 'pickup' ? '到店自提' : '预约配送'}
            </Text>
          ))}
        </View>
      </View>

      {checkout.fulfillmentType === 'pickup' ? (
        <View className="checkout-card">
          <Text className="checkout-title">自提门店</Text>
          {stores.map((store) => (
            <View key={store.id} className={`checkout-store ${checkout.storeId === store.id ? 'checkout-store--active' : ''}`} onClick={() => sync({ storeId: store.id, slotId: undefined })}>
              <Text className="checkout-store__name">{store.name}</Text>
              <Text className="checkout-store__addr">{store.address} · {store.businessHours}</Text>
            </View>
          ))}
          <View className="checkout-inputs">
            <Input placeholder="取货人姓名" value={checkout.pickupContactName || ''} onInput={(event) => sync({ pickupContactName: String(event.detail.value || '') })} />
            <Input placeholder="取货人手机号" value={checkout.pickupContactPhone || ''} onInput={(event) => sync({ pickupContactPhone: String(event.detail.value || '') })} />
          </View>
        </View>
      ) : (
        <View className="checkout-card">
          <Text className="checkout-title">配送信息</Text>
          {!addresses.length ? (
            <View className="checkout-address-empty" onClick={() => Taro.navigateTo({ url: '/pages/address/list/index' })}>
              <Text>还没有配送地址</Text>
              <Text>去添加 ›</Text>
            </View>
          ) : addresses.map((address) => (
            <View
              key={address.id}
              className={`checkout-store ${checkout.addressId === address.id ? 'checkout-store--active' : ''}`}
              onClick={() => sync({ addressId: address.id })}
            >
              <Text className="checkout-store__name">{address.name} {address.phone}</Text>
              <Text className="checkout-store__addr">{address.region} · {address.detail}</Text>
            </View>
          ))}
          <Text className="checkout-address-manage" onClick={() => Taro.navigateTo({ url: '/pages/address/list/index' })}>管理配送地址 ›</Text>
        </View>
      )}

      <View className="checkout-card">
        <Text className="checkout-title">预约时段</Text>
        <SlotPicker slots={slots} selectedId={checkout.slotId} onSelect={(slotId) => sync({ slotId })} />
      </View>

      <View className="checkout-card">
        <Text className="checkout-title">订单商品</Text>
        {selectedItems.map((item) => {
          const product = catalogStore.findProduct(item.productId)
          if (!product) return null
          return (
            <View key={item.productId} className="checkout-line">
              <Text>{product.name} x{item.quantity}</Text>
              <PriceText value={product.price * item.quantity} size="small" />
            </View>
          )
        })}
      </View>

      <View className="checkout-card">
        <View className="checkout-line"><Text>商品小计</Text><PriceText value={displayProductAmount} size="small" /></View>
        <View className="checkout-line"><Text>配送费</Text><PriceText value={displayDeliveryAmount} size="small" /></View>
        {displayCouponAmount > 0 ? (
          <View className="checkout-line"><Text>优惠抵扣</Text><PriceText value={-displayCouponAmount} size="small" /></View>
        ) : null}
        {displayPointsAmount > 0 ? (
          <View className="checkout-line"><Text>积分抵扣</Text><PriceText value={-displayPointsAmount} size="small" /></View>
        ) : null}
        <View className="checkout-line checkout-line--switch" onClick={() => sync({ usePoints: !checkout.usePoints })}>
          <Text>使用积分抵扣</Text><Text className={checkout.usePoints ? 'checkout-switch checkout-switch--on' : 'checkout-switch'}>{checkout.usePoints ? '已启用' : '未启用'}</Text>
        </View>
        {previewError ? <Text className="checkout-error">{previewError}</Text> : null}
        <Textarea className="checkout-message" placeholder="给门店留言，例如少油、分袋包装" value={checkout.message} onInput={(event) => sync({ message: String(event.detail.value || '') })} />
      </View>

      <View className="checkout-bar">
        <View>
          <Text className="checkout-bar__label">应付</Text>
          <PriceText value={total} size="large" />
        </View>
        <Button className="checkout-bar__button" onClick={submit}>提交订单</Button>
      </View>
    </View>
  )
}
