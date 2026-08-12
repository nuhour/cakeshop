export default {
  defineConstants: {
    'process.env.TARO_APP_CAKESHOP_API_BASE_URL': JSON.stringify(process.env.TARO_APP_CAKESHOP_API_BASE_URL || '')
  },
  mini: {
    optimizeMainPackage: {
      enable: true
    }
  },
  h5: {}
}
