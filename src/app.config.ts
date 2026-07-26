export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/category/index',
    'pages/cart/index',
    'pages/mine/index'
  ],
  subPackages: [
    {
      root: 'pages/product',
      pages: ['detail/index']
    },
    {
      root: 'pages/checkout',
      pages: ['index']
    },
    {
      root: 'pages/order',
      pages: ['list/index', 'detail/index']
    },
    {
      root: 'pages/address',
      pages: ['list/index']
    }
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationStyle: 'custom',
    backgroundColor: '#fff8f2'
  },
  tabBar: {
    color: '#57423e',
    selectedColor: '#953225',
    backgroundColor: '#fff8f2',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/home/index', text: '首页' },
      { pagePath: 'pages/category/index', text: '分类' },
      { pagePath: 'pages/cart/index', text: '提篮' },
      { pagePath: 'pages/mine/index', text: '我的' }
    ]
  }
})
