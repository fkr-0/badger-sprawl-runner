import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { badgerManualChunk } from './build/chunkStrategy';

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
				manualChunks: badgerManualChunk,
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
