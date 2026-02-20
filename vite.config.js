import { defineConfig } from 'vite'

export default defineConfig({
  // 如果你的项目不是部署在根路径（比如 GitHub 的用户主页），需要设置 base
  // 例如：部署在 https://用户名.github.io/仓库名/
  // base: '/仓库名/',
  build: {
    outDir: 'dist',    // 默认就是 dist
  }
})