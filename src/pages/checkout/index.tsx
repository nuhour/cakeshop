import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Input, Text, Textarea, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { FulfillmentType, CsOrderPreview, CsStore } from '@/types'
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

type CandleMode = 'none' | 'plain' | 'digit'

const parseCandles = (value: string): { mode: CandleMode; digit: string } => {
  if (!value) return { mode: 'none', digit: '' }
  if (value === '普通蜡烛') return { mode: 'plain', digit: '' }
  const match = value.match(/^数字蜡烛\s*(\d+)?$/)
  if (match) return { mode: 'digit', digit: match[1] || '' }
  return { mode: 'none', digit: '' }
}

export default function CheckoutPage() {
  const [checkout, setCheckout] = useState<CsCheckoutState>(checkoutStore.get())
  const [stores, setStores] = useState<CsStore[]>(slotStore.getStores())
  const [addresses, setAddresses] = useState(addressStore.getList())
  const [preview, setPreview] = useState<CsOrderPreview | null>(null)
  const [previewError, setPreviewError] = useState('')
  const initialCandles = parseCandles(checkoutStore.get().candles)
  const [candleMode, setCandleMode] = useState<CandleMode>(initialCandles.mode)
  const [candleDigit, setCandleDigit] = useState<string>(initialCandles.digit)

  const sync = (next: Partial<CsCheckoutState>) => {
    checkoutStore.set(next)
    setCheckout({ ...checkoutStore.get() })
  }

  useDidShow(() => {
    slotStore.loadStores().then((items) => {
      setStores(items)
      if (!checkout.storeId && items[0]) sync({ storeId: items[0].id })
    })
    if (userStore.isLoggedIn()) {
      addressStore.load().then((items) => {
        setAddresses([...items])
        const defaultAddress = items.find((item) => item.isDefault) || items[0]
        if (!checkout.addressId && defaultAddress) sync({ addressId: defaultAddress.id })
      })
    }
  })

  const buyNowProduct = checkout.source === 'buyNow' && checkout.productId ? catalogStore.findProduct(checkout.productId) : undefined
  const selectedItems = checkout.source === 'buyNow' && checkout.productId
    ? [{ productId: checkout.productId, quantity: checkout.quantity || 1 }]
    : cartStore.getSelectedItems()

  const scheduled = checkout.source === 'buyNow'
    ? buyNowProduct?.productType === 'reservation'
    : cartStore.hasSelectedReservation()
  const minLeadHours = checkout.source === 'buyNow'
    ? (buyNowProduct?.leadTimeHours || 0)
    : cartStore.getSelectedMaxLeadHours()

  // instant 模式下清理预约相关字段，避免残留上一单的 slotId/蛋糕附加数据
  useEffect(() => {
    if (scheduled) return
    if (checkout.slotId || checkout.tablewareCount || checkout.candles) {
      sync({ slotId: undefined, tablewareCount: 0, candles: '' })
      setCandleMode('none')
      setCandleDigit('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduled])

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

  const buildPayload = (state: CsCheckoutState): CsCheckoutState => ({
    ...state,
    slotId: scheduled ? state.slotId : undefined,
    tablewareCount: scheduled ? state.tablewareCount : 0,
    candles: scheduled ? state.candles : '',
    plaqueText: state.source === 'buyNow' ? state.plaqueText : undefined
  })

  const canPreview = selectedItems.length > 0
    && userStore.isLoggedIn()
    && (!scheduled || Boolean(checkout.slotId))
    && (checkout.fulfillmentType !== 'delivery' || Boolean(checkout.addressId))

  useEffect(() => {
    if (!canPreview) {
      setPreview(null)
      setPreviewError('')
      return
    }
    let active = true
    setPreviewError('')
    csApi.previewOrder(buildPayload(checkout))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canPreview,
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
    checkout.tablewareCount,
    checkout.candles,
    selectedKey
  ])

  const setTablewareCount = (value: number) => {
    sync({ tablewareCount: Math.max(0, Math.min(20, value)) })
  }

  const applyCandleMode = (mode: CandleMode) => {
    setCandleMode(mode)
    const candles = mode === 'none' ? '' : mode === 'plain' ? '普通蜡烛' : (candleDigit ? `数字蜡烛 ${candleDigit}` : '数字蜡烛')
    sync({ candles })
  }

  const applyCandleDigit = (value: string) => {
    const digit = value.replace(/\D/g, '').slice(0, 3)
    setCandleDigit(digit)
    if (candleMode === 'digit') sync({ candles: digit ? `数字蜡烛 ${digit}` : '数字蜡烛' })
  }

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
    if (scheduled && !checkout.slotId) {
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
      const order = await orderStore.createOrder(buildPayload(checkout))
      try {
        await orderStore.payOrder(order.id)
      } catch (payError) {
        Taro.showToast({ title: payError instanceof Error ? payError.message : '支付发起失败，可在订单详情中重试', icon: 'none' })
      }
      checkoutStore.clear()
      Taro.navigateTo({ url: `/pages/order/detail/index?id=${order.id}` })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '提交失败', icon: 'none' })
    }
  }

  return (
    <View className="cakeshop-page checkout-page">
      <AppNavBar title="确认订单" back />

      <View className="checkout-card">
        <View className="checkout-tabs">
          {(['delivery', 'pickup'] as FulfillmentType[]).map((type) => (
            <Text
              key={type}
              className={`checkout-tabs__item ${checkout.fulfillmentType === type ? 'checkout-tabs__item--active' : ''}`}
              onClick={() => sync({ fulfillmentType: type, slotId: undefined })}
            >
              {type === 'delivery' ? '外卖配送' : '到店自提'}
            </Text>
          ))}
        </View>

        {checkout.fulfillmentType === 'pickup' ? (
          <View className="checkout-panel">
            <Text className="checkout-title cs-serif">自提门店</Text>
            {stores.map((store) => (
              <View key={store.id} className={`checkout-store ${checkout.storeId === store.id ? 'checkout-store--active' : ''}`} onClick={() => sync({ storeId: store.id, slotId: undefined })}>
                <Text className="checkout-store__name">{store.name}</Text>
                <Text className="checkout-store__addr">{store.address} · {store.businessHours}</Text>
              </View>
            ))}
            <View className="checkout-inputs">
              <Input className="checkout-input" placeholder="取货人姓名" value={checkout.pickupContactName || ''} onInput={(event) => sync({ pickupContactName: String(event.detail.value || '') })} />
              <Input className="checkout-input" placeholder="取货人手机号" value={checkout.pickupContactPhone || ''} onInput={(event) => sync({ pickupContactPhone: String(event.detail.value || '') })} />
            </View>
          </View>
        ) : (
          <View className="checkout-panel">
            <Text className="checkout-title cs-serif">配送地址</Text>
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
      </View>

      {scheduled ? (
        <View className="checkout-card">
          <Text className="checkout-title cs-serif">预约时段</Text>
          <SlotPicker
            fulfillmentType={checkout.fulfillmentType}
            storeId={checkout.fulfillmentType === 'pickup' ? checkout.storeId : undefined}
            minLeadHours={minLeadHours}
            selectedId={checkout.slotId}
            onSelect={(slotId) => sync({ slotId })}
          />
        </View>
      ) : (
        <View className="checkout-instant-hint">
          <Text className="checkout-instant-hint__text">下单后尽快为您备货交付</Text>
        </View>
      )}

      <View className="checkout-card">
        <Text className="checkout-title cs-serif">订单商品</Text>
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

      {scheduled ? (
        <View className="checkout-card">
          <Text className="checkout-title cs-serif">蛋糕附加</Text>
          <View className="checkout-extra-row">
            <Text className="checkout-extra-label">餐具份数</Text>
            <View className="checkout-stepper">
              <Button onClick={() => setTablewareCount(checkout.tablewareCount - 1)}>-</Button>
              <Text>{checkout.tablewareCount}</Text>
              <Button onClick={() => setTablewareCount(checkout.tablewareCount + 1)}>+</Button>
            </View>
          </View>
          <View className="cs-hairline checkout-extra-divider" />
          <View className="checkout-extra-row">
            <Text className="checkout-extra-label">蜡烛</Text>
            <View className="checkout-candle-options">
              {(['none', 'plain', 'digit'] as CandleMode[]).map((mode) => (
                <Text
                  key={mode}
                  className={`checkout-candle-chip ${candleMode === mode ? 'checkout-candle-chip--active' : ''}`}
                  onClick={() => applyCandleMode(mode)}
                >
                  {mode === 'none' ? '不需要' : mode === 'plain' ? '普通蜡烛' : '数字蜡烛'}
                </Text>
              ))}
            </View>
          </View>
          {candleMode === 'digit' ? (
            <Input
              className="checkout-candle-input"
              type="number"
              placeholder="请输入蜡烛数字"
              value={candleDigit}
              onInput={(event) => applyCandleDigit(String(event.detail.value || ''))}
            />
          ) : null}
        </View>
      ) : null}

      <View className="checkout-card">
        <View className="checkout-line"><Text>商品总价</Text><PriceText value={displayProductAmount} size="small" /></View>
        <View className="checkout-line"><Text>配送费</Text><PriceText value={displayDeliveryAmount} size="small" /></View>
        {displayCouponAmount > 0 ? (
          <View className="checkout-line"><Text>优惠券</Text><PriceText value={-displayCouponAmount} size="small" /></View>
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
          <Text className="checkout-bar__label">合计</Text>
          <PriceText value={total} size="large" />
        </View>
        <Button className="checkout-bar__button" onClick={submit}>微信支付</Button>
      </View>
    </View>
  )
}
