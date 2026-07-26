import type { CsCategory, CsFulfillmentSlot, CsHomePayload, CsProduct, CsStore } from '@/types'

const cover = (seed: string) => `https://picsum.photos/seed/cakeshop-${seed}/640/480`

export const demoCategories: CsCategory[] = [
  { id: 'cake', name: '生日蛋糕', sort: 1, isActive: true },
  { id: 'mousse', name: '慕斯甜点', sort: 2, isActive: true },
  { id: 'cookie', name: '曲奇饼干', sort: 3, isActive: true },
  { id: 'bread', name: '烘焙面包', sort: 4, isActive: true },
  { id: 'gift', name: '礼盒套餐', sort: 5, isActive: true }
]

export const demoProducts: CsProduct[] = [
  {
    id: 'cakeshop-cake-001',
    categoryId: 'cake',
    name: '经典草莓奶油蛋糕',
    subtitle: '新鲜草莓，轻盈奶油',
    price: 128,
    originalPrice: 158,
    stock: 30,
    sales: 382,
    points: 12,
    cover: cover('strawberry-cake'),
    media: [{ type: 'image', url: cover('strawberry-cake') }],
    detailImages: [cover('strawberry-cake-detail')],
    tags: ['热卖', '到店自提'],
    flavors: [{ id: 'classic', name: '原味' }, { id: 'choco', name: '巧克力' }],
    specs: [{ id: 'six-inch', name: '6寸' }, { id: 'eight-inch', name: '8寸', priceDelta: 40 }],
    ingredients: '淡奶油、新鲜草莓、戚风蛋糕胚、鸡蛋',
    nutrition: [{ label: '热量', value: '320kcal' }, { label: '蛋白质', value: '6g' }],
    isActive: true,
    isRecommended: true,
    isNew: false,
    productType: 'reservation',
    leadTimeHours: 4,
    allowPlaque: true
  },
  {
    id: 'cakeshop-mousse-001',
    categoryId: 'mousse',
    name: '芒果慕斯杯',
    subtitle: '细腻顺滑，现做现取',
    price: 26,
    originalPrice: 0,
    stock: 80,
    sales: 216,
    points: 6,
    cover: cover('mango-mousse'),
    media: [{ type: 'image', url: cover('mango-mousse') }],
    detailImages: [cover('mango-mousse-detail')],
    tags: ['新品'],
    flavors: [{ id: 'mango', name: '芒果' }, { id: 'matcha', name: '抹茶' }],
    specs: [{ id: 'single', name: '单杯' }, { id: 'pack4', name: '4杯装', priceDelta: 80 }],
    ingredients: '淡奶油、芒果果泥、吉利丁、牛奶',
    nutrition: [{ label: '热量', value: '210kcal' }, { label: '脂肪', value: '9g' }],
    isActive: true,
    isRecommended: true,
    isNew: true,
    productType: 'instock',
    leadTimeHours: 0,
    allowPlaque: false
  },
  {
    id: 'cakeshop-cookie-001',
    categoryId: 'cookie',
    name: '手工黄油曲奇',
    subtitle: '香浓黄油，酥脆不腻',
    price: 38,
    originalPrice: 45,
    stock: 60,
    sales: 168,
    points: 8,
    cover: cover('butter-cookie'),
    media: [{ type: 'image', url: cover('butter-cookie') }],
    detailImages: [cover('butter-cookie-detail')],
    tags: ['限量'],
    flavors: [{ id: 'original', name: '原味' }, { id: 'cocoa', name: '可可' }],
    specs: [{ id: 'box', name: '一盒' }, { id: 'gift-box', name: '礼盒装', priceDelta: 20 }],
    ingredients: '黄油、面粉、鸡蛋、糖粉',
    nutrition: [{ label: '热量', value: '380kcal' }, { label: '碳水', value: '48g' }],
    isActive: true,
    isRecommended: true,
    isNew: false,
    productType: 'instock',
    leadTimeHours: 0,
    allowPlaque: false
  },
  {
    id: 'cakeshop-bread-001',
    categoryId: 'bread',
    name: '法式牛角包',
    subtitle: '层层起酥，现烤现取',
    price: 15,
    originalPrice: 0,
    stock: 40,
    sales: 96,
    points: 3,
    cover: cover('croissant'),
    media: [{ type: 'image', url: cover('croissant') }],
    detailImages: [cover('croissant-detail')],
    tags: ['预定'],
    flavors: [{ id: 'classic', name: '原味' }],
    specs: [{ id: 'single', name: '单个' }, { id: 'pack4', name: '4个装', priceDelta: 45 }],
    ingredients: '面粉、黄油、酵母、牛奶',
    nutrition: [{ label: '热量', value: '420kcal' }, { label: '碳水', value: '55g' }],
    isActive: true,
    isRecommended: false,
    isNew: false,
    productType: 'reservation',
    leadTimeHours: 2,
    allowPlaque: false
  }
]

export const demoStores: CsStore[] = [
  {
    id: 'store-main',
    name: '如也甜品屋总店',
    address: '西安市碑林区甜蜜路 18 号',
    phone: '029-88886666',
    businessHours: '08:00-20:00',
    isPickupEnabled: true
  }
]

export const demoSlots: CsFulfillmentSlot[] = [
  { id: 'pickup-1', date: '2026-06-03', startTime: '09:00', endTime: '10:00', fulfillmentType: 'pickup', storeId: 'store-main', capacity: 40, reservedCapacity: 8, availableCapacity: 32, isActive: true },
  { id: 'pickup-2', date: '2026-06-03', startTime: '10:00', endTime: '11:00', fulfillmentType: 'pickup', storeId: 'store-main', capacity: 40, reservedCapacity: 14, availableCapacity: 26, isActive: true },
  { id: 'delivery-1', date: '2026-06-03', startTime: '14:00', endTime: '15:00', fulfillmentType: 'delivery', capacity: 30, reservedCapacity: 11, availableCapacity: 19, isActive: true },
  { id: 'delivery-2', date: '2026-06-03', startTime: '16:00', endTime: '17:00', fulfillmentType: 'delivery', capacity: 30, reservedCapacity: 20, availableCapacity: 10, isActive: true }
]

export const demoHome: CsHomePayload = {
  categories: demoCategories,
  products: demoProducts,
  banners: [
    {
      id: 'banner-fresh',
      title: '今日新鲜出炉',
      subtitle: '生日蛋糕 10 点前预定，午间可取',
      image: cover('banner-fresh'),
      linkUrl: '/pages/product/detail/index?id=cakeshop-cake-001',
      sort: 1,
      isActive: true
    }
  ],
  recommendedProducts: demoProducts.filter((item) => item.isRecommended),
  newProducts: demoProducts.filter((item) => item.isNew)
}
