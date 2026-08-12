import camelliaImage from '@/assets/products/camellia.jpg'
import osmanthusImage from '@/assets/products/osmanthus.jpg'
import montBlancImage from '@/assets/products/mont-blanc.jpg'
import matchaImage from '@/assets/products/matcha.jpg'
import zaosuImage from '@/assets/products/zaosu.jpg'
import eggYolkImage from '@/assets/products/egg-yolk.jpg'
import giftBoxImage from '@/assets/products/gift-box.jpg'

// 演示商品使用随包资源，避免开发工具或真机拦截远程图片。
const LOCAL_PRODUCT_IMAGES: Record<string, string> = {
  'cs-camellia-cake': camelliaImage,
  'cs-osmanthus-mousse-cake': osmanthusImage,
  'cs-mont-blanc': montBlancImage,
  'cs-uji-matcha-redbean': matchaImage,
  'cs-zaosu': zaosuImage,
  'cs-egg-yolk-pastry': eggYolkImage,
  'cs-signature-gift-box': giftBoxImage,
}

export const PRODUCT_IMAGE_FALLBACK = camelliaImage

export function resolveProductImage(productId: string, remoteUrl?: string) {
  return LOCAL_PRODUCT_IMAGES[productId] || remoteUrl || PRODUCT_IMAGE_FALLBACK
}
