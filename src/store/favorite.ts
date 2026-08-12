import Taro from '@tarojs/taro'

const KEY = 'cakeshop_favorite_product_ids'

const read = (): string[] => {
  const value = Taro.getStorageSync(KEY)
  return Array.isArray(value) ? value.map(String) : []
}

let productIds = read()

const persist = () => Taro.setStorageSync(KEY, productIds)

export const favoriteStore = {
  has(productId: string) {
    return productIds.includes(productId)
  },
  toggle(productId: string) {
    if (this.has(productId)) {
      productIds = productIds.filter((id) => id !== productId)
      persist()
      return false
    }
    productIds = [productId, ...productIds]
    persist()
    return true
  }
}
