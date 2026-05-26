#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const generatedPaths = ['playwright-report/index.html', 'test-results'];
let hasFailure = false;

if (existsSync('test-results')) {
	console.error('Unexpected generated e2e artifact: test-results/');
	hasFailure = true;
}

try {
	execFileSync('git', ['diff', '--quiet', '--', 'playwright-report/index.html'], { stdio: 'ignore' });
} catch {
	console.error('Unexpected generated e2e artifact change: playwright-report/index.html');
	hasFailure = true;
}

if (hasFailure) {
	console.error(`Clean or revert generated paths before committing: ${generatedPaths.join(', ')}`);
	process.exit(1);
}
