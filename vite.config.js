import { defineConfig } from 'vite'

export default defineConfig({
  // ⚠️ 如果仓库名不是用户名.github.io，必须设置 base
  // 例如：仓库名是 threejs-demo，就填 '/threejs-demo/'

   base: '/BN001-Corner-storage-rack/', // 注意开头和结尾的斜杠
  //  base: '/',   // 临时改成根路径，方便本地测试
   build: {
    outDir: 'dist',
  }
})