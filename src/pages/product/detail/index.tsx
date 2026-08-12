import Taro, { useRouter } from '@tarojs/taro'
import { Button, Input, Swiper, SwiperItem, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { CsFulfillmentSlot, CsProduct } from '@/types'
import { catalogStore } from '@/store/catalog'
import { cartStore } from '@/store/cart'
import { checkoutStore } from '@/store/checkout'
import { favoriteStore } from '@/store/favorite'
import { userStore } from '@/store/user'
import { csApi } from '@/api/cakeshop'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { PriceText } from '@/components/ui/PriceText'
import { openShopContact } from '@/utils/service'
import { getProductUnitPrice } from '@/utils/pricing'
import { ProductImage } from '@/components/product/ProductImage'
import './index.scss'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const formatSlot = (slot: CsFulfillmentSlot) => {
  const [year, month, day] = slot.date.split('-').map((part) => Number(part))
  const date = new Date(year || 0, (month || 1) - 1, day || 1)
  return `${month}月${day}日（周${WEEKDAYS[date.getDay()]}）${slot.startTime}-${slot.endTime}`
}

export default function ProductDetailPage() {
  const router = useRouter()
  const id = String(router.params.id || '')
  const [product, setProduct] = useState<CsProduct | undefined>(catalogStore.findProduct(id))
  const [quantity, setQuantity] = useState(1)
  const [flavorId, setFlavorId] = useState(product?.flavors[0]?.id)
  const [specId, setSpecId] = useState(product?.specs[0]?.id)
  const [plaqueText, setPlaqueText] = useState('')
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [earliestSlot, setEarliestSlot] = useState<CsFulfillmentSlot | null>(null)
  const [slotLoaded, setSlotLoaded] = useState(false)
  const [slotLoadError, setSlotLoadError] = useState('')
  const [loading, setLoading] = useState(!product)
  const [notFound, setNotFound] = useState(false)
  const [favorited, setFavorited] = useState(favoriteStore.has(id))

  useEffect(() => {
    setNotFound(false)
    setLoading(!catalogStore.findProduct(id))
    catalogStore.loadProduct(id).then((item) => {
      setProduct(item)
      setFlavorId(item.flavors[0]?.id)
      setSpecId(item.specs[0]?.id)
    }).catch((error) => {
      if (!catalogStore.findProduct(id)) setNotFound(true)
      Taro.showToast({ title: error instanceof Error ? error.message : '商品加载失败', icon: 'none' })
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!product || product.productType !== 'reservation') {
      setEarliestSlot(null)
      setSlotLoaded(true)
      return
    }
    setSlotLoaded(false)
    setSlotLoadError('')
    csApi.slots({ minLeadHours: product.leadTimeHours })
      .then((slots) => {
        const now = new Date()
        const upcoming = slots.find((slot) => {
          const [year, month, day] = slot.date.split('-').map((part) => Number(part))
          const [hour, minute] = slot.startTime.split(':').map((part) => Number(part))
          const slotTime = new Date(year || 0, (month || 1) - 1, day || 1, hour || 0, minute || 0)
          return slotTime.getTime() > now.getTime()
        })
        setEarliestSlot(upcoming || null)
      })
      .catch((error) => {
        setEarliestSlot(null)
        setSlotLoadError(error instanceof Error ? error.message : '时段暂不可用')
      })
      .finally(() => setSlotLoaded(true))
  }, [product?.id, product?.leadTimeHours, product?.productType])

  if (!product) {
    return (
      <View className="cakeshop-page detail-page">
        <AppNavBar title="商品详情" back />
        <EmptyState
          title={loading ? '正在加载商品' : notFound ? '商品不存在或已下架' : '商品详情暂不可用'}
          description={loading ? '请稍候' : '换个商品看看吧'}
        />
      </View>
    )
  }
  const soldOut = !product.isActive || product.stock <= 0
  const isReservation = product.productType === 'reservation'
  const unitPrice = getProductUnitPrice(product, specId)
  const gallery = product.media.length ? product.media.map((item) => item.url) : [product.cover]
  const normalizedPlaqueText = plaqueText.trim() || undefined

  const buyNow = async () => {
    if (soldOut) {
      Taro.showToast({ title: '商品已售罄', icon: 'none' })
      return
    }
    if (!(await userStore.ensureLogin('登录后可下单'))) return
    checkoutStore.set({ source: 'buyNow', productId: product.id, buyNowProductType: product.productType, quantity, flavorId, specId, plaqueText: normalizedPlaqueText, slotId: undefined })
    Taro.navigateTo({ url: '/pages/checkout/index' })
  }

  const addToCart = async () => {
    if (!(await userStore.ensureLogin('登录后可加入提篮'))) return
    try {
      await cartStore.add(product.id, quantity, flavorId, specId, normalizedPlaqueText)
      Taro.showToast({ title: '已加入提篮', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '加入失败', icon: 'none' })
    }
  }

  const toggleFavorite = async () => {
    if (!(await userStore.ensureLogin('登录后可收藏商品'))) return
    const next = favoriteStore.toggle(product.id)
    setFavorited(next)
    Taro.showToast({ title: next ? '已收藏' : '已取消收藏', icon: next ? 'success' : 'none' })
  }

  return (
    <View className="cakeshop-page detail-page">
      <AppNavBar title="商品详情" back />

      <View className="detail-gallery">
        <Swiper
          className="detail-gallery__swiper"
          current={galleryIndex}
          circular={gallery.length > 1}
          onChange={(event) => setGalleryIndex(event.detail.current)}
        >
          {gallery.map((url, index) => (
            <SwiperItem key={`${url}-${index}`}>
              <ProductImage productId={product.id} src={url} className="detail-gallery__image" />
            </SwiperItem>
          ))}
        </Swiper>
        {gallery.length > 1 ? (
          <Text className="detail-gallery__badge">{galleryIndex + 1}/{gallery.length}</Text>
        ) : null}
      </View>

      <View className="detail-panel">
        <View className="detail-head">
          <Text className="detail-title cs-serif">{product.name}</Text>
          {isReservation ? <Text className="cs-seal detail-seal">预定</Text> : null}
        </View>
        <PriceText value={unitPrice} original={product.originalPrice} />
        <Text className="detail-subtitle">{product.subtitle}</Text>
        <Text className={soldOut ? 'detail-stock detail-stock--warn' : 'detail-stock'}>{soldOut ? '已售罄' : `库存 ${product.stock} 件`}</Text>

        {isReservation ? (
          <View className="detail-notice">
            <Text className="detail-notice__icon">◷</Text>
            <Text className="detail-notice__text">需提前{product.leadTimeHours}小时预定</Text>
          </View>
        ) : null}

        <View className="cs-hairline detail-divider" />

        <View className="detail-section">
          <Text className="detail-section__title cs-serif">规格选择</Text>
          <Text className="detail-label">尺寸</Text>
          <View className="detail-options">
            {product.specs.map((item) => (
              <Text key={item.id} className={`detail-chip ${specId === item.id ? 'detail-chip--active' : ''}`} onClick={() => setSpecId(item.id)}>{item.name}</Text>
            ))}
          </View>
          <Text className="detail-label">口味基底</Text>
          <View className="detail-options">
            {product.flavors.map((item) => (
              <Text key={item.id} className={`detail-chip ${flavorId === item.id ? 'detail-chip--active' : ''}`} onClick={() => setFlavorId(item.id)}>{item.name}</Text>
            ))}
          </View>
        </View>

        <View className="cs-hairline detail-divider" />

        {product.allowPlaque ? (
          <View className="detail-section">
            <View className="detail-plaque__head">
              <Text className="detail-section__title cs-serif">贺牌留言</Text>
              <Text className="detail-plaque__count">{plaqueText.length}/20</Text>
            </View>
            <Input
              className="detail-plaque__input"
              value={plaqueText}
              maxlength={20}
              placeholder="请填写贺卡内容（选填）"
              onInput={(event) => setPlaqueText(String(event.detail.value || '').slice(0, 20))}
            />
          </View>
        ) : null}

        {isReservation ? (
          <View className="detail-slot cakeshop-card">
            <Text className="detail-slot__icon">◔</Text>
            <View className="detail-slot__body">
              <Text className="detail-slot__title">最早可约时间</Text>
              <Text className="detail-slot__value">{!slotLoaded ? '加载中…' : slotLoadError ? '时段暂不可用，结算时可重试' : earliestSlot ? formatSlot(earliestSlot) : '暂无可约时段'}</Text>
            </View>
          </View>
        ) : null}

        <View className="detail-quantity">
          <Text className="detail-label">数量</Text>
          <View className="detail-stepper">
            <Button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
            <Text>{quantity}</Text>
            <Button disabled={quantity >= product.stock} onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</Button>
          </View>
        </View>
      </View>

      <View className="detail-bar">
        <View className="detail-bar__minor">
          <Button className="detail-bar__ghost" onClick={openShopContact}>客服</Button>
          <Button className={`detail-bar__ghost ${favorited ? 'detail-bar__ghost--active' : ''}`} onClick={toggleFavorite}>
            {favorited ? '已收藏' : '收藏'}
          </Button>
        </View>
        <View className="detail-bar__actions">
          <Button className="detail-bar__cart" disabled={soldOut} onClick={addToCart}>加入提篮</Button>
          <Button className="detail-bar__buy" disabled={soldOut} onClick={buyNow}>{isReservation ? '立即预定' : '立即购买'}</Button>
        </View>
      </View>
    </View>
  )
}
