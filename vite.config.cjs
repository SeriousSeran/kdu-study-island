const { defineConfig, loadEnv } = require("vite");
const react = require("@vitejs/plugin-react");
const basicSsl = require("@vitejs/plugin-basic-ssl").default || require("@vitejs/plugin-basic-ssl");

module.exports = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const disableSsl = process.env.VITE_ENABLE_SSL !== "1";
  return {
    plugins: [react(), ...(disableSsl ? [] : [basicSsl()])],
    server: {
      port: 4175,
      strictPort: false,
      proxy: {
        "/api/moonshot": {
          target: "https://api.moonshot.ai",
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/moonshot/, ""),
          configure: proxy => {
            proxy.on("proxyReq", proxyReq => {
              if (env.MOONSHOT_API_KEY) proxyReq.setHeader("Authorization", `Bearer ${env.MOONSHOT_API_KEY}`);
            });
          },
        },
        "/api/groq": {
          target: "https://api.groq.com",
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/groq/, ""),
          configure: proxy => {
            proxy.on("proxyReq", proxyReq => {
              if (env.GROQ_API_KEY) proxyReq.setHeader("Authorization", `Bearer ${env.GROQ_API_KEY}`);
            });
          },
        },
      },
    },
    preview: {
      port: 4175,
      strictPort: false,
    },
  };
});
