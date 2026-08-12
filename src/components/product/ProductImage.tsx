import { Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { PRODUCT_IMAGE_FALLBACK, resolveProductImage } from '@/utils/productImage'

interface Props {
  productId: string
  src?: string
  className?: string
}

export function ProductImage({ productId, src, className }: Props) {
  const resolvedSrc = resolveProductImage(productId, src)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [resolvedSrc])

  return (
    <Image
      className={className}
      src={failed ? PRODUCT_IMAGE_FALLBACK : resolvedSrc}
      mode="aspectFill"
      onError={() => setFailed(true)}
    />
  )
}
