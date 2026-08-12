import Taro from '@tarojs/taro'
import { shopStore } from '@/store/shop'

export async function openShopContact() {
  try {
    const shop = await shopStore.load()
    const content = [
      shop.contactText || '欢迎咨询预定、配送和订单进度。',
      shop.serviceHours ? `服务时间：${shop.serviceHours}` : '',
      shop.address ? `门店地址：${shop.address}` : ''
    ].filter(Boolean).join('\n')

    if (!shop.isActive) {
      await Taro.showModal({ title: shop.name || '如也甜品屋', content: '客服暂未启用，请稍后再试。', showCancel: false })
      return
    }

    if (!shop.contactPhone) {
      await Taro.showModal({ title: shop.name || '如也甜品屋', content, showCancel: false })
      return
    }

    const result = await Taro.showModal({
      title: shop.name || '如也甜品屋',
      content,
      cancelText: '关闭',
      confirmText: '拨打电话'
    })
    if (result.confirm) {
      await Taro.makePhoneCall({ phoneNumber: shop.contactPhone })
    }
  } catch (error) {
    Taro.showToast({ title: error instanceof Error ? error.message : '客服信息加载失败', icon: 'none' })
  }
}
