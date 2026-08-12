import type { CsProduct } from '@/types'

export function getProductUnitPrice(product?: CsProduct, specId?: string) {
  if (!product) return 0
  const spec = product.specs.find((item) => item.id === specId)
  return typeof spec?.price === 'number' && Number.isFinite(spec.price) ? spec.price : product.price
}

export function getProductOptionSummary(product?: CsProduct, flavorId?: string, specId?: string) {
  if (!product) return []
  const specName = product.specs.find((item) => item.id === specId)?.name
  const flavorName = product.flavors.find((item) => item.id === flavorId)?.name
  return [specName, flavorName].filter((item): item is string => Boolean(item))
}
