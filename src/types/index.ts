export type FulfillmentType = 'pickup' | 'delivery'
export type OrderStatus = 'pendingPay' | 'preparing' | 'readyForPickup' | 'delivering' | 'completed' | 'cancelled' | 'afterSale'

export interface CsCategory {
  id: string
  name: string
  sort: number
  isActive: boolean
}

export interface CsProductOption {
  id: string
  name: string
  priceDelta?: number
}

export interface CsProduct {
  id: string
  categoryId: string
  name: string
  subtitle: string
  price: number
  originalPrice?: number
  stock: number
  sales: number
  points: number
  cover: string
  media: Array<{ type: 'image' | 'video'; url: string }>
  detailImages: string[]
  tags: string[]
  flavors: CsProductOption[]
  specs: CsProductOption[]
  ingredients: string
  nutrition: Array<{ label: string; value: string }>
  isActive: boolean
  isRecommended: boolean
  isNew: boolean
}

export interface CsHomeBanner {
  id: string
  title: string
  subtitle: string
  image: string
  linkUrl: string
  sort: number
  isActive: boolean
}

export interface CsHomePayload {
  categories: CsCategory[]
  products: CsProduct[]
  banners: CsHomeBanner[]
  recommendedProducts: CsProduct[]
  newProducts: CsProduct[]
}

export interface CsStore {
  id: string
  name: string
  address: string
  phone: string
  businessHours: string
  isPickupEnabled: boolean
}

export interface CsShopSettings {
  id?: string
  name: string
  title: string
  avatar: string
  address: string
  serviceHours: string
  contactPhone: string
  contactText: string
  qualificationImage: string
  isActive: boolean
}

export interface CsAddress {
  id: string
  name: string
  phone: string
  region: string
  detail: string
  tag: string
  isDefault: boolean
}

export interface CsFulfillmentSlot {
  id: string
  date: string
  startTime: string
  endTime: string
  fulfillmentType: FulfillmentType
  storeId?: string
  capacity: number
  reservedCapacity: number
  availableCapacity: number
  isActive: boolean
}

export interface CsCartItem {
  productId: string
  quantity: number
  selected: boolean
  flavorId?: string
  specId?: string
}

export interface CsCoupon {
  id: string
  title: string
  threshold: number
  discount: number
  status: 'unused' | 'used' | 'expired'
  expiresAt: string
}

export interface CsMemberAsset {
  balance: number
  points: number
  couponCount: number
}

export interface CsUserProfile {
  id?: string
  avatar: string
  nickname: string
  phone: string
  level: string
  asset: CsMemberAsset
}

export interface CsOrderItem {
  productId: string
  quantity: number
  price: number
  flavorId?: string
  specId?: string
  product?: CsProduct | null
}

export interface CsOrder {
  id: string
  orderNo: string
  status: OrderStatus
  fulfillmentType: FulfillmentType
  storeId?: string
  addressId?: string
  slotId: string
  appointmentDate: string
  appointmentStartTime: string
  appointmentEndTime: string
  pickupCode?: string
  pickupContactName?: string
  pickupContactPhone?: string
  items: CsOrderItem[]
  productAmount: number
  deliveryAmount: number
  couponAmount: number
  pointsAmount: number
  payableAmount: number
  message: string
  createdAt: string
  paidAt?: string
}

export interface CsOrderPreview {
  items: CsOrderItem[]
  productAmount: number
  deliveryAmount: number
  couponAmount: number
  pointsAmount: number
  payableAmount: number
}

export interface CsPaymentParams {
  appId: string
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
  mock: boolean
  bypass: boolean
}

export interface CsOrderPayResult {
  orderId: string
  orderNo: string
  payableAmount: number
  payment: CsPaymentParams
  bypass: boolean
  order?: CsOrder | null
}
