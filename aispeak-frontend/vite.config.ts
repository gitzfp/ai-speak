import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
const target = "https://crm.shoxfashion.com/api/cms-dashboard/";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  server: {
    host: "0.0.0.0",
    port: 5174,
    proxy: {
       '/ap33': {
        target: 'https://api.mypep.com.cn', // 目标服务器地址
        changeOrigin: true, // 修改请求的 Origin 为目标服务器的 Origin
        rewrite: (path) => path.replace(/^\/ap33/, ''), // 重写路径，去掉 /api 前缀
        headers: {
          // 添加自定义请求头
          Origin: 'https://diandu.mypep.cn',
          Referer: 'https://diandu.mypep.cn/',
        },
      },
       '/ap22': {
        target: 'https://diandu.mypep.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ap22/, '')
      }
    },
  },
});
