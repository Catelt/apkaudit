import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  // Use relative paths for asset linking, allowing the app to be deployed anywhere, 
  // including subdirectories like github.io/apkaudit/
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: `${projectRoot}index.html`,
        vi: `${projectRoot}vi/index.html`,
      },
    },
  }
});
