export function resolveRuntimeAssetUrl(assetPath: string, baseUrl?: string): string {
	const runtimeBase =
		baseUrl ?? (typeof document !== 'undefined' ? document.baseURI : 'http://localhost/');
	return new URL(assetPath.replace(/^\/+/, ''), runtimeBase).href;
}

export function runtimeToolsEnabled(options?: {
	dev?: boolean;
	href?: string;
}): boolean {
	const viteEnv = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env;
	const dev = options?.dev ?? viteEnv?.DEV === true;
	if (dev) return true;
	const href =
		options?.href ?? (typeof window !== 'undefined' ? window.location.href : 'http://localhost/');
	return new URL(href).searchParams.get('debug') === '1';
}
