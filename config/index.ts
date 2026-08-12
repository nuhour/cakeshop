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
    output: {
      // 微信开发者工具监听 dist 时保留已有 app.json，避免增量编译窗口短暂丢失入口文件。
      clean: process.env.NODE_ENV !== 'development'
    },
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
