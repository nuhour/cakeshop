import Taro from '@tarojs/taro'
import type { CsCategory, CsHomePayload, CsProduct } from '@/types'
import { csApi } from '@/api/cakeshop'

const CATEGORY_KEY = 'cakeshop_categories'
const PRODUCT_KEY = 'cakeshop_products'

const cachedHome = (): CsHomePayload => ({
  categories,
  products,
  banners: [],
  recommendedProducts: products.filter((item) => item.isRecommended),
  newProducts: products.filter((item) => item.isNew)
})

let categories: CsCategory[] = Taro.getStorageSync(CATEGORY_KEY) || []
let products: CsProduct[] = Taro.getStorageSync(PRODUCT_KEY) || []
let home: CsHomePayload = cachedHome()

const persist = () => {
  Taro.setStorageSync(CATEGORY_KEY, categories)
  Taro.setStorageSync(PRODUCT_KEY, products)
}

const mergeProducts = (nextProducts: CsProduct[]) => {
  const nextById = new Map(products.map((item) => [item.id, item]))
  nextProducts.forEach((item) => nextById.set(item.id, item))
  products = Array.from(nextById.values())
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
    } catch (error) {
      // 保留已有缓存的 categories/products 供其它页面（如提篮）继续按 id 查找，
      // 同时把本次错误交给页面显示，避免把网络异常误报为“暂无商品”。
      home = cachedHome()
      throw error
    }
    return home
  },
  async loadCategories() {
    try {
      categories = await csApi.categories()
      persist()
    } catch (error) {
      throw error
    }
    return categories
  },
  async loadProducts(params: { categoryId?: string; keyword?: string; type?: string } = {}) {
    try {
      const loaded = await csApi.products(params)
      // 分类和搜索结果只用于当前列表展示；商品总缓存保留其它分类，供提篮与“再来一单”按 id 查找。
      if (params.categoryId || params.keyword || params.type) mergeProducts(loaded)
      else products = loaded
      persist()
      return loaded
    } catch (error) {
      throw error
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
