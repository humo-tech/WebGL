import { defineConfig } from 'astro/config'
import vue from '@astrojs/vue'
import glsl from 'vite-plugin-glsl'

// https://astro.build/config
export default defineConfig({
  site: 'https://humo-tech.github.io/',
  base: '/WebGL',
  server: {
    host: '0.0.0.0',
  },
  integrations: [vue()],
  vite: {
    plugins: [glsl()],
  },
})
