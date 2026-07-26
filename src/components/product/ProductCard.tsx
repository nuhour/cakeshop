import Taro from '@tarojs/taro'
import { Button, Image, Text, View } from '@tarojs/components'
import type { CsProduct } from '@/types'
import { PriceText } from '@/components/ui/PriceText'
import './ProductCard.scss'

interface Props {
  product: CsProduct
  onAdd?: (productId: string) => void
}

export function ProductCard({ product, onAdd }: Props) {
  const openDetail = () => Taro.navigateTo({ url: `/pages/product/detail/index?id=${product.id}` })
  const soldOut = !product.isActive || product.stock <= 0

  return (
    <View className={`product-card ${soldOut ? 'product-card--sold-out' : ''}`} onClick={openDetail}>
      <View className="product-card__media">
        <Image className="product-card__image" src={product.cover} mode="aspectFill" />
        {product.tags[0] ? <Text className="product-card__tag">{product.tags[0]}</Text> : null}
        {soldOut ? <Text className="product-card__sold-out">售罄</Text> : null}
      </View>
      <View className="product-card__body">
        <Text className="product-card__name">{product.name}</Text>
        <Text className="product-card__subtitle">{product.subtitle}</Text>
        <View className="product-card__footer">
          <PriceText value={product.price} original={product.originalPrice} size="small" />
          <Button
            className="product-card__add"
            disabled={soldOut}
            onClick={(event) => {
              event.stopPropagation()
              if (soldOut) return
              onAdd?.(product.id)
            }}
          >
            {soldOut ? '售罄' : '+'}
          </Button>
        </View>
      </View>
    </View>
  )
}
