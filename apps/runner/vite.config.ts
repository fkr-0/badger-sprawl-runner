import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
	base: './',
	server: {
		port: 5173,
	},
	build: {
		target: 'ES2022',
		outDir: 'dist',
		sourcemap: true,
		chunkSizeWarningLimit: 600,
		modulePreload: false,
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
				'sprite-review': resolve(__dirname, 'sprite-review.html'),
			},
			output: {
				manualChunks(id) {
					if (id.includes('vite/preload-helper')) return 'vite-runtime';
					if (id.includes('/node_modules/.pnpm/pixi.js@')) return 'pixi-runtime';
					if (id.endsWith('/vendor/arcade-runtime.mjs')) return 'arcade-runtime';
					return undefined;
				},
			},
		},
	},
	resolve: {
		alias: {
			'@data': resolve(__dirname, '../../data'),
		},
	},
	publicDir: 'public',
});
