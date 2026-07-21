import type { Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { arch, cpus, platform, release, totalmem } from 'node:os';
import { join } from 'node:path';

export interface CertificationBrowserEnvironment {
	browser: { version: string; userAgent: string };
	device: {
		tier: string;
		os: string;
		cpu: string;
		gpu: string;
		memoryGiB: number | null;
		logicalCores: number | null;
		devicePixelRatio: number | null;
		powerMode: string;
		thermalState: string;
	};
}

export async function captureCertificationEnvironment(
	page: Page,
	canvasSelector: string
): Promise<CertificationBrowserEnvironment> {
	const browser = await page.evaluate((selector) => {
		const canvas = document.querySelector<HTMLCanvasElement>(selector);
		const gl = canvas?.getContext('webgl2') ?? canvas?.getContext('webgl');
		let gpu = 'unknown';
		if (gl) {
			const debug = gl.getExtension('WEBGL_debug_renderer_info');
			gpu = debug
				? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL))
				: String(gl.getParameter(gl.RENDERER));
		}
		const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
		return {
			userAgent: navigator.userAgent,
			gpu,
			memoryGiB: navigatorWithMemory.deviceMemory ?? null,
			logicalCores: navigator.hardwareConcurrency || null,
			devicePixelRatio: window.devicePixelRatio,
		};
	}, canvasSelector);
	return {
		browser: { version: browser.userAgent, userAgent: browser.userAgent },
		device: {
			tier: process.env.ARCADE_CERT_TIER ?? 'unknown',
			os: process.env.ARCADE_CERT_OS ?? `${platform()} ${release()} ${arch()}`,
			cpu: process.env.ARCADE_CERT_CPU ?? cpus()[0]?.model ?? 'unknown',
			gpu: process.env.ARCADE_CERT_GPU ?? browser.gpu,
			memoryGiB:
				Number(process.env.ARCADE_CERT_MEMORY_GIB) || browser.memoryGiB || totalmem() / 2 ** 30,
			logicalCores:
				Number(process.env.ARCADE_CERT_LOGICAL_CORES) || browser.logicalCores || cpus().length,
			devicePixelRatio: browser.devicePixelRatio,
			powerMode: process.env.ARCADE_CERT_POWER_MODE ?? 'unknown',
			thermalState: process.env.ARCADE_CERT_THERMAL_STATE ?? 'unknown',
		},
	};
}

export async function beginCertifiedContextLoss(
	page: Page,
	canvasSelector: string
): Promise<'synthetic-event' | 'webgl-lose-context'> {
	const requested = process.env.ARCADE_CONTEXT_LOSS_MODE ?? 'auto';
	return page.evaluate(
		({ selector, requestedMode }) => {
			const canvas = document.querySelector<HTMLCanvasElement>(selector);
			if (!canvas) throw new Error(`Missing certification canvas ${selector}`);
			const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
			const extension = gl?.getExtension('WEBGL_lose_context') ?? null;
			if (requestedMode !== 'synthetic-event' && extension) {
				(window as Window & { __arcadeContextLossExtension?: WEBGL_lose_context })
					.__arcadeContextLossExtension = extension;
				extension.loseContext();
				return 'webgl-lose-context' as const;
			}
			if (requestedMode === 'webgl-lose-context') {
				throw new Error('WEBGL_lose_context is unavailable');
			}
			canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
			return 'synthetic-event' as const;
		},
		{ selector: canvasSelector, requestedMode: requested }
	);
}

export async function restoreCertifiedContext(
	page: Page,
	canvasSelector: string,
	mode: 'synthetic-event' | 'webgl-lose-context'
): Promise<void> {
	await page.evaluate(
		({ selector, contextMode }) => {
			const canvas = document.querySelector<HTMLCanvasElement>(selector);
			if (!canvas) throw new Error(`Missing certification canvas ${selector}`);
			if (contextMode === 'webgl-lose-context') {
				const holder = window as Window & { __arcadeContextLossExtension?: WEBGL_lose_context };
				const extension = holder.__arcadeContextLossExtension;
				if (!extension) throw new Error('Stored WEBGL_lose_context extension is unavailable');
				extension.restoreContext();
				delete holder.__arcadeContextLossExtension;
				return;
			}
			canvas.dispatchEvent(new Event('webglcontextrestored'));
		},
		{ selector: canvasSelector, contextMode: mode }
	);
}

export async function writeCertificationEvidence(
	kind: 'lifecycle' | 'visual',
	browserName: string,
	environment: CertificationBrowserEnvironment,
	payload: Record<string, unknown>
): Promise<void> {
	const directory = process.env.ARCADE_CERT_EVIDENCE_DIR;
	if (!directory) return;
	const recordedAt = new Date().toISOString();
	const project = process.env.ARCADE_CERT_PROJECT ?? 'badger-sprawl-runner';
	const evidence = {
		schemaVersion: 1,
		id: `${project}:${kind}:${browserName}:${recordedAt}`,
		kind,
		project,
		projectVersion: process.env.ARCADE_CERT_PROJECT_VERSION ?? 'unknown',
		runtimeVersion: process.env.ARCADE_CERT_RUNTIME_VERSION ?? 'unknown',
		recordedAt,
		source: process.env.ARCADE_CERT_SOURCE ?? 'local-browser',
		browser: { name: browserName, ...environment.browser },
		device: environment.device,
		...payload,
	};
	await mkdir(directory, { recursive: true });
	const safeTimestamp = recordedAt.replaceAll(':', '-');
	await writeFile(
		join(directory, `${project}-${kind}-${browserName}-${safeTimestamp}.json`),
		`${JSON.stringify(evidence, null, 2)}\n`
	);
}
