import { defineConfig } from '@tarojs/cli'
import path from 'path'

export default defineConfig(async (merge) => {
  const baseConfig = {
    projectName: 'cakeshop-miniapp',
    date: '2026-06-03',
    designWidth: 375,
    deviceRatio: {
      640: 2.34 / 2,
      375: 2,
      750: 1,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [],
    framework: 'react',
    compiler: 'webpack5',
    alias: {
      '@': path.resolve(__dirname, '..', 'src')
    },
    mini: {
      miniCssExtractPluginOption: {
        ignoreOrder: true
      },
      postcss: {
        pxtransform: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    },
    h5: {}
  }

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, (await import('./dev')).default)
  }

  return merge({}, baseConfig, (await import('./prod')).default)
})
