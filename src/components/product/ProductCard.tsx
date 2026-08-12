import Taro from '@tarojs/taro'
import { Button, Text, View } from '@tarojs/components'
import type { CsProduct } from '@/types'
import { PriceText } from '@/components/ui/PriceText'
import { ProductImage } from '@/components/product/ProductImage'
import './ProductCard.scss'

interface Props {
  product: CsProduct
  onAdd?: (productId: string) => void
  productType?: string
  leadTimeHours?: number
}

export function ProductCard({ product, onAdd, productType, leadTimeHours }: Props) {
  const openDetail = () => Taro.navigateTo({ url: `/pages/product/detail/index?id=${product.id}` })
  const soldOut = !product.isActive || product.stock <= 0
  const isReservation = productType === 'reservation'

  return (
    <View className={`product-card ${soldOut ? 'product-card--sold-out' : ''}`} onClick={openDetail}>
      <View className="product-card__media">
        <ProductImage productId={product.id} src={product.cover} className="product-card__image" />
        {product.tags[0] ? <Text className="product-card__tag">{product.tags[0]}</Text> : null}
        {isReservation && leadTimeHours ? (
          <Text className="product-card__lead-time">提前{leadTimeHours}小时</Text>
        ) : null}
        {soldOut ? <Text className="product-card__sold-out">售罄</Text> : null}
      </View>
      <View className="product-card__body">
        <Text className="product-card__name">{product.name}</Text>
        <Text className="product-card__subtitle">{product.subtitle}</Text>
        <View className="product-card__footer">
          <PriceText value={product.price} original={product.originalPrice} size="small" />
          <Button
            className={`product-card__add ${isReservation ? 'product-card__add--reserve' : ''}`}
            disabled={soldOut}
            onClick={(event) => {
              event.stopPropagation()
              if (soldOut) return
              if (isReservation) {
                openDetail()
                return
              }
              onAdd?.(product.id)
            }}
          >
            {soldOut ? '售罄' : isReservation ? '预定' : '+'}
          </Button>
        </View>
      </View>
    </View>
  )
}
