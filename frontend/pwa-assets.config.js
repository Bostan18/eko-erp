import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    apple: {
      ...minimal2023Preset.apple,
      padding: 0.3,
      resizeOptions: { background: '#1f8f53', fit: 'contain' },
    },
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.3,
      resizeOptions: { background: '#1f8f53', fit: 'contain' },
    },
    transparent: {
      ...minimal2023Preset.transparent,
      padding: 0.05,
      favicons: [[64, 'favicon.ico']],
    },
  },
  images: ['public/logo-eko.svg'],
})
