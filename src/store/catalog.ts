import Taro from '@tarojs/taro'
import type { CsCategory, CsHomePayload, CsProduct } from '@/types'
import { csApi } from '@/api/cakeshop'

const CATEGORY_KEY = 'cakeshop_categories'
const PRODUCT_KEY = 'cakeshop_products'

const emptyHome = (): CsHomePayload => ({
  categories: [],
  products: [],
  banners: [],
  recommendedProducts: [],
  newProducts: []
})

let categories: CsCategory[] = Taro.getStorageSync(CATEGORY_KEY) || []
let products: CsProduct[] = Taro.getStorageSync(PRODUCT_KEY) || []
let home: CsHomePayload = emptyHome()

const persist = () => {
  Taro.setStorageSync(CATEGORY_KEY, categories)
  Taro.setStorageSync(PRODUCT_KEY, products)
}

export const catalogStore = {
  getCategories: () => categories,
  getProducts: () => products,
  getHome: () => home,
  findProduct: (id?: string) => products.find((item) => item.id === id),
  async loadHome() {
    try {
      home = await csApi.home()
      categories = home.categories
      products = home.products
      persist()
    } catch (_error) {
      // 保留已有缓存的 categories/products 供其它页面（如提篮）继续按 id 查找，
      // 但如实告知调用方本次首页数据获取失败，不用假数据掩盖。
      home = emptyHome()
    }
    return home
  },
  async loadCategories() {
    try {
      categories = await csApi.categories()
      persist()
    } catch (_error) {}
    return categories
  },
  async loadProducts(params: { categoryId?: string; keyword?: string; type?: string } = {}) {
    try {
      products = await csApi.products(params)
      persist()
      return products
    } catch (_error) {
      return []
    }
  },
  async loadProduct(id: string) {
    try {
      const product = await csApi.productDetail(id)
      products = products.some((item) => item.id === product.id)
        ? products.map((item) => item.id === product.id ? product : item)
        : [product, ...products]
      persist()
      return product
    } catch (error) {
      throw error
    }
  }
}
