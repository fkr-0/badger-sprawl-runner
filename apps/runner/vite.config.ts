import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
	},
	resolve: {
		alias: {
			'@data': resolve(__dirname, '../../data'),
		},
	},
	publicDir: '../../assets',
});
