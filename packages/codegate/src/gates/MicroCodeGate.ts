import type { MiniGameSpec, MiniGameResult } from '../types';

export interface MicroCodeGateConfig {
	expectedExpression: string;
	input: number;
	output: number;
}

const ARITHMETIC_EXPRESSION = /^[\d+\-*/().\s]+$/;

function evaluateArithmeticExpression(expression: string): number | null {
	if (!ARITHMETIC_EXPRESSION.test(expression)) return null;

	const matchedTokens = expression.match(/\d+(?:\.\d+)?|[()+\-*/]/g);
	if (!matchedTokens) return null;

	const tokens = matchedTokens;
	let index = 0;

	function parseExpression(): number | null {
		let value = parseTerm();
		if (value === null) return null;

		while (tokens[index] === '+' || tokens[index] === '-') {
			const operator = tokens[index++];
			const right = parseTerm();
			if (right === null) return null;
			value = operator === '+' ? value + right : value - right;
		}

		return value;
	}

	function parseTerm(): number | null {
		let value = parseFactor();
		if (value === null) return null;

		while (tokens[index] === '*' || tokens[index] === '/') {
			const operator = tokens[index++];
			const right = parseFactor();
			if (right === null) return null;
			value = operator === '*' ? value * right : value / right;
		}

		return value;
	}

	function parseFactor(): number | null {
		const token = tokens[index++];
		if (!token) return null;

		if (token === '(') {
			const value = parseExpression();
			if (tokens[index++] !== ')') return null;
			return value;
		}

		if (token === '-') {
			const value = parseFactor();
			return value === null ? null : -value;
		}

		const value = Number(token);
		return Number.isFinite(value) ? value : null;
	}

	const result = parseExpression();
	return result !== null && index === tokens.length ? result : null;
}

export function createMicroCodeGate(spec: MiniGameSpec, config: MicroCodeGateConfig) {
	return {
		validate(input: string): MiniGameResult | null {
			const result = evaluateArithmeticExpression(input);
			if (result === config.output) {
				return { outcome: 'clean', heatDelta: -1, rewardTags: spec.rewardTags, timeMs: 0 };
			}
			return null;
		},
	};
}
