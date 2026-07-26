import Taro, { useRouter } from '@tarojs/taro'
import { Button, Image, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import type { CsProduct } from '@/types'
import { catalogStore } from '@/store/catalog'
import { cartStore } from '@/store/cart'
import { checkoutStore } from '@/store/checkout'
import { AppNavBar } from '@/components/ui/AppNavBar'
import { PriceText } from '@/components/ui/PriceText'
import { openShopContact } from '@/utils/service'
import './index.scss'

export default function ProductDetailPage() {
  const router = useRouter()
  const id = String(router.params.id || '')
  const [product, setProduct] = useState<CsProduct | undefined>(catalogStore.findProduct(id))
  const [quantity, setQuantity] = useState(1)
  const [flavorId, setFlavorId] = useState(product?.flavors[0]?.id)
  const [specId, setSpecId] = useState(product?.specs[0]?.id)

  useEffect(() => {
    catalogStore.loadProduct(id).then((item) => {
      if (!item) return
      setProduct(item)
      setFlavorId(item.flavors[0]?.id)
      setSpecId(item.specs[0]?.id)
    })
  }, [id])

  if (!product) return <View className="cakeshop-page detail-page" />
  const soldOut = !product.isActive || product.stock <= 0

  const buyNow = () => {
    if (soldOut) {
      Taro.showToast({ title: '商品已售罄', icon: 'none' })
      return
    }
    checkoutStore.set({ source: 'buyNow', productId: product.id, quantity, flavorId, specId })
    Taro.navigateTo({ url: '/pages/checkout/index' })
  }

  const addToCart = async () => {
    try {
      await cartStore.add(product.id, quantity, flavorId, specId)
      Taro.showToast({ title: '已加入购物车', icon: 'success' })
    } catch (error) {
      Taro.showToast({ title: error instanceof Error ? error.message : '加入失败', icon: 'none' })
    }
  }

  return (
    <View className="cakeshop-page detail-page">
      <AppNavBar title="商品详情" back />
      <View className="detail-hero">
        <Image className="detail-hero__image" src={product.cover} mode="aspectFill" />
      </View>
      <View className="detail-panel">
        <View className="detail-head">
          <Text className="detail-title">{product.name}</Text>
          <PriceText value={product.price} original={product.originalPrice} />
        </View>
        <Text className="detail-subtitle">{product.subtitle}</Text>
        <Text className={soldOut ? 'detail-stock detail-stock--warn' : 'detail-stock'}>{soldOut ? '已售罄' : `库存 ${product.stock} 件`}</Text>
        <Text className="detail-desc">每日小批量制作，支持预约到店自提和预约配送。建议提前选择时段，下单后门店按预约时间备货。</Text>

        <Text className="detail-label">口味</Text>
        <View className="detail-options">
          {product.flavors.map((item) => (
            <Text key={item.id} className={`detail-chip ${flavorId === item.id ? 'detail-chip--active' : ''}`} onClick={() => setFlavorId(item.id)}>{item.name}</Text>
          ))}
        </View>

        <Text className="detail-label">规格</Text>
        <View className="detail-options">
          {product.specs.map((item) => (
            <Text key={item.id} className={`detail-chip ${specId === item.id ? 'detail-chip--active' : ''}`} onClick={() => setSpecId(item.id)}>{item.name}</Text>
          ))}
        </View>

        <View className="detail-quantity">
          <Text className="detail-label">数量</Text>
          <View className="detail-stepper">
            <Button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
            <Text>{quantity}</Text>
            <Button disabled={quantity >= product.stock} onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</Button>
          </View>
        </View>

        <View className="detail-note">
          <Text className="detail-note__title">老面慢发酵</Text>
          <Text className="detail-note__body">选用优质原料现烤现做，口感更细腻。配送订单按时段集中出炉，减少等待。</Text>
        </View>
      </View>
      <View className="detail-bar">
        <Button className="detail-bar__ghost" onClick={openShopContact}>客服</Button>
        <Button className="detail-bar__ghost">收藏</Button>
        <Button className="detail-bar__cart" disabled={soldOut} onClick={addToCart}>加入购物车</Button>
        <Button className="detail-bar__buy" disabled={soldOut} onClick={buyNow}>立即购买</Button>
      </View>
    </View>
  )
}
