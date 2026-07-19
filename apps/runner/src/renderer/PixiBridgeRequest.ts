export function isBadgerPixiBridgeRequested(search = globalThis.location?.search ?? ''): boolean {
	const params = new URLSearchParams(search);
	return params.get('renderer') === 'bridge' || params.get('pixiBridge') === '1';
}
