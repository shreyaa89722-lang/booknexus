import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        signup: resolve(__dirname, 'signup.html'),
        browse: resolve(__dirname, 'browse.html'),
        book: resolve(__dirname, 'book.html'),
        recommendations: resolve(__dirname, 'recommendations.html'),
        rentals: resolve(__dirname, 'rentals.html'),
        listings: resolve(__dirname, 'listings.html'),
        bookForm: resolve(__dirname, 'book-form.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        admin: resolve(__dirname, 'admin.html'),
        profile: resolve(__dirname, 'profile.html'),
        booknexus: resolve(__dirname, 'booknexus.html'),
      },
    },
  },
});
