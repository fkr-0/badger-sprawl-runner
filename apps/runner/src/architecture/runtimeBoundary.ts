export interface RuntimeBoundary {
	supportedRoots: string[];
	quarantinedLegacyRoots: string[];
}

const SUPPORTED_ROOTS = [
	'src/main.ts',
	'src/game/**/*.ts',
	'src/architecture/**/*.ts',
	'src/storage/**/*.ts',
];
const QUARANTINED_LEGACY_ROOTS = [
	'src/actors',
	'src/audio',
	'src/engine',
	'src/renderer',
	'src/scenes',
	'src/systems',
	'src/world',
	'src/main.js',
];

export function getRuntimeBoundary(): RuntimeBoundary {
	return {
		supportedRoots: [...SUPPORTED_ROOTS],
		quarantinedLegacyRoots: [...QUARANTINED_LEGACY_ROOTS],
	};
}

export function isSupportedRuntimePath(path: string): boolean {
	const normalized = normalize(path);
	return (
		normalized === 'src/main.ts' ||
		normalized.startsWith('src/game/') ||
		normalized.startsWith('src/architecture/') ||
		normalized.startsWith('src/storage/')
	);
}

export function isLegacyRuntimePath(path: string): boolean {
	const normalized = normalize(path);
	return QUARANTINED_LEGACY_ROOTS.some(
		(root) => normalized === root || normalized.startsWith(`${root}/`)
	);
}

function normalize(path: string): string {
	return path.replaceAll('\\\\', '/').replace(/^\.\//, '');
}
