import { defineConfig } from 'vite';

export default defineConfig({
  // Use relative paths for asset linking, allowing the app to be deployed anywhere, 
  // including subdirectories like github.io/apkaudit/
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
