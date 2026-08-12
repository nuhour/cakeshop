import Taro, { useDidShow } from '@tarojs/taro'
import { Button, Input, Text, Textarea, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { FulfillmentType, CsCartItem, CsOrderPreview, CsStore } from '@/types'
import { checkoutStore, type CsCheckoutState } from '@/store/checkout'
import { slotStore } from '@/store/slot'
import { orderStore } from '@/store/order'
import { cartStore } from '@/store/cart'
import { catalogStore } from '@/store/catalog'
import { addressStore } from '@/store/address'
import { userStore } from '@/store/user'
import { csApi } from '@/api/cakeshop'
import { getErrorMessage } from '@/api/client'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { SlotPicker } from '@/components/order/SlotPicker'
import { PriceText } from '@/components/ui/PriceText'
import { getProductOptionSummary, getProductUnitPrice } from '@/utils/pricing'
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
  const [storeLoadError, setStoreLoadError] = useState('')
  const [addresses, setAddresses] = useState(addressStore.getList())
  const [addressLoadError, setAddressLoadError] = useState('')
  const [preview, setPreview] = useState<CsOrderPreview | null>(null)
  const [previewError, setPreviewError] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const initialCandles = parseCandles(checkoutStore.get().candles)
  const [candleMode, setCandleMode] = useState<CandleMode>(initialCandles.mode)
  const [candleDigit, setCandleDigit] = useState<string>(initialCandles.digit)

  const sync = (next: Partial<CsCheckoutState>) => {
    checkoutStore.set(next)
    setCheckout({ ...checkoutStore.get() })
  }

  const reloadStores = async () => {
    try {
      const items = await slotStore.loadStores()
      setStores(items)
      setStoreLoadError('')
      const currentStoreId = checkoutStore.get().storeId
      if (items.length && !items.some((item) => item.id === currentStoreId)) sync({ storeId: items[0].id })
    } catch (error) {
      setStoreLoadError(getErrorMessage(error, '门店加载失败，请稍后重试'))
    }
  }

  useDidShow(() => {
    // 页面可能因导航栈缓存而复用，重新进入时以最新结算会话覆盖本地表单状态。
    const currentCheckout = { ...checkoutStore.get() }
    const currentCandles = parseCandles(currentCheckout.candles)
    setCheckout(currentCheckout)
    setCandleMode(currentCandles.mode)
    setCandleDigit(currentCandles.digit)
    setPreview(null)
    setPreviewError('')
    setPreviewLoading(false)
    setSubmitting(false)
    void reloadStores()
    if (userStore.isLoggedIn()) {
      const profile = userStore.getProfile()
      const current = checkoutStore.get()
      if ((!current.pickupContactName || !current.pickupContactPhone) && profile) {
        sync({
          pickupContactName: current.pickupContactName || profile.nickname,
          pickupContactPhone: current.pickupContactPhone || profile.phone
        })
      }
      addressStore.load().then((items) => {
        setAddresses([...items])
        setAddressLoadError('')
        const defaultAddress = items.find((item) => item.isDefault) || items[0]
        const currentAddressId = checkoutStore.get().addressId
        if (!items.some((item) => item.id === currentAddressId)) sync({ addressId: defaultAddress?.id })
      }).catch((error) => setAddressLoadError(getErrorMessage(error, '地址加载失败，请前往地址管理重试')))
    }
  })

  const buyNowProduct = checkout.source === 'buyNow' && checkout.productId ? catalogStore.findProduct(checkout.productId) : undefined
  const selectedItems: CsCartItem[] = checkout.source === 'buyNow' && checkout.productId
    ? [{
        productId: checkout.productId,
        quantity: checkout.quantity || 1,
        flavorId: checkout.flavorId,
        specId: checkout.specId,
        plaqueText: checkout.plaqueText,
        selected: true
      }]
    : cartStore.getSelectedItems()

  const scheduled = checkout.source === 'buyNow'
    ? (buyNowProduct ? buyNowProduct.productType === 'reservation' : checkout.buyNowProductType === 'reservation')
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
    return total + getProductUnitPrice(product, item.specId) * item.quantity
  }, 0)
  const deliveryAmount = checkout.fulfillmentType === 'delivery' ? 8 : 0
  const pointsAmount = checkout.usePoints ? Math.min(5, productAmount) : 0
  const selectedKey = selectedItems.map((item) => `${item.productId}:${item.quantity}:${item.flavorId || ''}:${item.specId || ''}:${item.plaqueText || ''}`).join('|')
  const displayProductAmount = preview?.productAmount ?? productAmount
  const displayDeliveryAmount = preview?.deliveryAmount ?? deliveryAmount
  const displayCouponAmount = preview?.couponAmount ?? 0
  const displayPointsAmount = preview?.pointsAmount ?? pointsAmount
  const total = preview?.payableAmount ?? Math.max(0, productAmount + deliveryAmount - pointsAmount)

  const buildPayload = (state: CsCheckoutState): CsCheckoutState => ({
    ...state,
    storeId: state.fulfillmentType === 'pickup' ? state.storeId : undefined,
    addressId: state.fulfillmentType === 'delivery' ? state.addressId : undefined,
    slotId: scheduled ? state.slotId : undefined,
    tablewareCount: scheduled ? state.tablewareCount : 0,
    candles: scheduled ? state.candles : '',
    plaqueText: state.source === 'buyNow' ? state.plaqueText : undefined
  })

  const canPreview = selectedItems.length > 0
    && userStore.isLoggedIn()
    && (!scheduled || Boolean(checkout.slotId))
    && (checkout.fulfillmentType !== 'pickup' || Boolean(checkout.storeId))
    && (checkout.fulfillmentType !== 'delivery' || Boolean(checkout.addressId))
  const pickupContactReady = checkout.fulfillmentType !== 'pickup'
    || (Boolean(checkout.pickupContactName?.trim()) && /^1\d{10}$/.test((checkout.pickupContactPhone || '').replace(/\s/g, '')))
  const previewReady = Boolean(preview) && canPreview && !previewError
  const canSubmit = previewReady && pickupContactReady

  useEffect(() => {
    if (!canPreview) {
      setPreview(null)
      setPreviewError('')
      setPreviewLoading(false)
      return
    }
    let active = true
    setPreview(null)
    setPreviewError('')
    setPreviewLoading(true)
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
      .finally(() => {
        if (active) setPreviewLoading(false)
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
    if (submitting) return
    if (!(await userStore.ensureLogin('登录后可提交订单'))) return
    if (!selectedItems.length) {
      Taro.showToast({ title: '订单中没有可结算商品', icon: 'none' })
      return
    }
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
    if (scheduled && candleMode === 'digit' && !candleDigit) {
      Taro.showToast({ title: '请填写数字蜡烛的数字', icon: 'none' })
      return
    }
    if (checkout.fulfillmentType === 'pickup' && !checkout.storeId) {
      Taro.showToast({ title: '请选择自提门店', icon: 'none' })
      return
    }
    if (checkout.fulfillmentType === 'pickup' && (!checkout.pickupContactName || !checkout.pickupContactPhone)) {
      Taro.showToast({ title: '请填写取货人信息', icon: 'none' })
      return
    }
    if (checkout.fulfillmentType === 'pickup' && !/^1\d{10}$/.test((checkout.pickupContactPhone || '').replace(/\s/g, ''))) {
      Taro.showToast({ title: '请输入正确的11位手机号', icon: 'none' })
      return
    }
    if (checkout.fulfillmentType === 'delivery' && !checkout.addressId) {
      Taro.showToast({ title: '请选择配送地址', icon: 'none' })
      return
    }
    if (previewLoading) {
      Taro.showToast({ title: '价格正在计算，请稍候', icon: 'none' })
      return
    }
    if (previewError) {
      Taro.showToast({ title: previewError, icon: 'none' })
      return
    }
    if (!previewReady) {
      Taro.showToast({ title: '订单价格尚未核对完成', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      const order = await orderStore.createOrder(buildPayload(checkout))
      let payFailed = false
      try {
        await orderStore.payOrder(order.id)
      } catch (payError) {
        payFailed = true
        Taro.showToast({ title: payError instanceof Error ? payError.message : '支付发起失败，可在订单详情中重试', icon: 'none' })
      }
      checkoutStore.clear()
      // 用 redirectTo 而非 navigateTo：把结算页从页面栈中替换掉，
      // 避免下单后用户从订单详情返回时又回到一个已清空/已提交的结算页重复下单。
      const goToOrder = () => Taro.redirectTo({ url: `/pages/order/detail/index?id=${order.id}` })
      if (payFailed) {
        setTimeout(goToOrder, 1500)
      } else {
        goToOrder()
      }
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '提交失败', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="cakeshop-page checkout-page">
      <AppNavBar title="确认订单" back />

      <View className="checkout-card">
        <View className="checkout-tabs">
          {(['pickup', 'delivery'] as FulfillmentType[]).map((type) => (
            <Button
              key={type}
              className={`checkout-tabs__item ${checkout.fulfillmentType === type ? 'checkout-tabs__item--active' : ''}`}
              onClick={() => sync({ fulfillmentType: type, slotId: undefined })}
            >
              {type === 'delivery' ? '外卖配送' : '到店自提'}
            </Button>
          ))}
        </View>

        {checkout.fulfillmentType === 'pickup' ? (
          <View className="checkout-panel">
            <Text className="checkout-title cs-serif">自提门店</Text>
            {storeLoadError ? (
              <View className="checkout-address-empty checkout-address-empty--error">
                <Text>{storeLoadError}</Text>
                <Button className="checkout-address-link" onClick={() => void reloadStores()}>重试 ›</Button>
              </View>
            ) : stores.length ? stores.map((store) => (
              <Button key={store.id} className={`checkout-store ${checkout.storeId === store.id ? 'checkout-store--active' : ''}`} onClick={() => sync({ storeId: store.id, slotId: undefined })}>
                <Text className="checkout-store__name">{store.name}</Text>
                <Text className="checkout-store__addr">{store.address} · {store.businessHours}</Text>
              </Button>
            )) : (
              <Button className="checkout-address-empty" onClick={() => void reloadStores()}>
                <Text>暂无可用门店</Text>
                <Text>点击重试 ›</Text>
              </Button>
            )}
            <View className="checkout-inputs">
              <Input className="checkout-input" placeholder="取货人姓名" value={checkout.pickupContactName || ''} onInput={(event) => sync({ pickupContactName: String(event.detail.value || '') })} />
              <Input className="checkout-input" placeholder="取货人手机号" value={checkout.pickupContactPhone || ''} onInput={(event) => sync({ pickupContactPhone: String(event.detail.value || '') })} />
            </View>
          </View>
        ) : (
          <View className="checkout-panel">
            <Text className="checkout-title cs-serif">配送地址</Text>
            {addressLoadError ? (
              <View className="checkout-address-empty checkout-address-empty--error">
                <Text>{addressLoadError}</Text>
                <Button className="checkout-address-link" onClick={() => Taro.navigateTo({ url: '/pages/address/list/index' })}>去重试 ›</Button>
              </View>
            ) : !addresses.length ? (
              <Button className="checkout-address-empty" onClick={() => Taro.navigateTo({ url: '/pages/address/list/index' })}>
                <Text>还没有配送地址</Text>
                <Text>去添加 ›</Text>
              </Button>
            ) : addresses.map((address) => (
              <Button
                key={address.id}
                className={`checkout-store ${checkout.addressId === address.id ? 'checkout-store--active' : ''}`}
                onClick={() => sync({ addressId: address.id })}
              >
                <Text className="checkout-store__name">{address.name} {address.phone}</Text>
                <Text className="checkout-store__addr">{address.region} · {address.detail}</Text>
              </Button>
            ))}
            <Button className="checkout-address-manage" onClick={() => Taro.navigateTo({ url: '/pages/address/list/index' })}>管理配送地址 ›</Button>
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
            onSelect={(slotId) => sync({ slotId: slotId || undefined })}
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
          const optionSummary = getProductOptionSummary(product, item.flavorId, item.specId)
          const itemKey = `${item.productId}:${item.flavorId || ''}:${item.specId || ''}:${item.plaqueText || ''}`
          return (
            <View key={itemKey} className="checkout-product">
              <View className="checkout-line">
                <Text>{product.name} x{item.quantity}</Text>
                <PriceText value={getProductUnitPrice(product, item.specId) * item.quantity} size="small" />
              </View>
              {optionSummary.length ? <Text className="checkout-product__options">{optionSummary.join(' · ')}</Text> : null}
              {item.plaqueText ? <Text className="checkout-product__plaque">贺牌：{item.plaqueText}</Text> : null}
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
              <Button disabled={checkout.tablewareCount <= 0} onClick={() => setTablewareCount(checkout.tablewareCount - 1)}>-</Button>
              <Text>{checkout.tablewareCount}</Text>
              <Button disabled={checkout.tablewareCount >= 20} onClick={() => setTablewareCount(checkout.tablewareCount + 1)}>+</Button>
            </View>
          </View>
          <View className="cs-hairline checkout-extra-divider" />
          <View className="checkout-extra-row">
            <Text className="checkout-extra-label">蜡烛</Text>
            <View className="checkout-candle-options">
              {(['none', 'plain', 'digit'] as CandleMode[]).map((mode) => (
                <Button
                  key={mode}
                  className={`checkout-candle-chip ${candleMode === mode ? 'checkout-candle-chip--active' : ''}`}
                  onClick={() => applyCandleMode(mode)}
                >
                  {mode === 'none' ? '不需要' : mode === 'plain' ? '普通蜡烛' : '数字蜡烛'}
                </Button>
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
        <Button className="checkout-line checkout-line--switch" onClick={() => sync({ usePoints: !checkout.usePoints })}>
          <Text>使用积分抵扣</Text><Text className={checkout.usePoints ? 'checkout-switch checkout-switch--on' : 'checkout-switch'}>{checkout.usePoints ? '已启用' : '未启用'}</Text>
        </Button>
        {previewError ? <Text className="checkout-error">{previewError}</Text> : null}
        {previewLoading ? <Text className="checkout-preview-loading">正在核对价格与优惠…</Text> : null}
        <Textarea key={`checkout-message-${checkout.sessionId}`} className="checkout-message" placeholder="给门店留言，例如少油、分袋包装" value={checkout.message} onInput={(event) => sync({ message: String(event.detail.value || '') })} />
      </View>

      <View className="checkout-bar">
        <View>
          <Text className="checkout-bar__label">合计</Text>
          <PriceText value={total} size="large" />
        </View>
        <Button className="checkout-bar__button" disabled={submitting || previewLoading || !canSubmit} onClick={submit}>
          {submitting ? '处理中…' : previewLoading ? '核价中…' : !previewReady ? (scheduled ? '请选择时段' : '等待核价') : !pickupContactReady ? '填写取货信息' : '微信支付'}
        </Button>
      </View>
    </View>
  )
}
