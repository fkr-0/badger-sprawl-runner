import type { Player } from '../actors/MossBadger';
import type { ActionMap } from './InputSystem';
import type { CombatEntity } from './CombatSystem';
import type { EncounterReadinessSystem } from './EncounterReadinessSystem';
import {
	findEncounterRoute,
	getEncounterZoneAtPoint,
	type EncounterPortalState,
	type StageEncounterTopology,
} from '../world/EncounterTopology';

export type PlayerSoundKind =
	| 'footstep'
	| 'jump'
	| 'dodge'
	| 'melee'
	| 'rail-shot'
	| 'hack-pulse'
	| 'impact'
	| 'door'
	| 'trap'
	| 'decoy'
	| 'alarm';

export interface PlayerSoundEvent {
	kind: PlayerSoundKind;
	x: number;
	y: number;
	intensity: number;
	radius: number;
	sourceId?: string;
	sourceKind?: 'player' | 'environment' | 'device' | 'decoy';
}

export interface EnemyPerceptionStepOptions {
	externalSounds?: readonly PlayerSoundEvent[];
	topology?: StageEncounterTopology;
	portalStates?: Readonly<Record<string, EncounterPortalState>>;
}

export type EnemyPerceptionEvent =
	| {
			kind: 'sound-heard';
			enemyId: string;
			soundKind: PlayerSoundKind;
			confidence: number;
			x: number;
			y: number;
			sourceId?: string;
			portalIds?: string[];
		}
	| {
			kind: 'search-started' | 'search-ended';
			enemyId: string;
			x: number;
			y: number;
		};

export interface EnemyPerceptionProfile {
	confidenceDecayPerSecond: number;
	investigateSpeed: number;
	searchRadius: number;
	searchSeconds: number;
	engageConfidence: number;
	minimumAudibleConfidence: number;
}

interface EnemyPerceptionMemory {
	state: 'calm' | 'investigating' | 'searching';
	confidence: number;
	lastKnownX: number;
	lastKnownY: number;
	searchOriginX: number;
	searchDirection: -1 | 1;
	searchRemaining: number;
	lastSoundKind?: PlayerSoundKind;
	lastSoundSourceId?: string;
	lastPortalIds: string[];
}

const DEFAULT_PROFILE: EnemyPerceptionProfile = Object.freeze({
	confidenceDecayPerSecond: 0.16,
	investigateSpeed: 72,
	searchRadius: 74,
	searchSeconds: 3.2,
	engageConfidence: 0.92,
	minimumAudibleConfidence: 0.08,
});

/**
 * Local perception memory for non-engaged enemies.
 *
 * Sound creates uncertain evidence, not player omniscience. Enemies remember a
 * source point, investigate it, search a bounded area, and eventually return
 * to their readiness disposition. Engagement still belongs to
 * EncounterReadiness; attack behavior still belongs to stage enemy systems.
 */
export class EnemyPerceptionMemorySystem {
	private readonly memory = new Map<string, EnemyPerceptionMemory>();
	private footstepCooldown = 0;

	constructor(private readonly profile: EnemyPerceptionProfile = DEFAULT_PROFILE) {}

	step(
		enemies: CombatEntity[],
		player: Player,
		action: ActionMap,
		dt: number,
		readiness: Pick<EncounterReadinessSystem, 'raiseNotice'>,
		options: EnemyPerceptionStepOptions = {}
	): EnemyPerceptionEvent[] {
		const safeDt = Math.max(0, dt);
		const events: EnemyPerceptionEvent[] = [];
		const sounds = [
			...this.derivePlayerSounds(player, action, safeDt),
			...(options.externalSounds ?? []).map((sound) => ({ ...sound })),
		];
		for (const [index, enemy] of enemies.entries()) {
			if (enemy.hp <= 0 || enemy.isDummy) continue;
			const id = stableEnemyId(enemy, index);
			const memory = this.ensureMemory(id, enemy);
			if (enemy.awarenessState === 'engaged') {
				memory.lastKnownX = player.x + player.w / 2;
				memory.lastKnownY = player.y + player.h / 2;
				memory.confidence = 1;
				this.project(enemy, memory);
				continue;
			}

			const heard = this.getLoudestHeardSound(
				enemy,
				sounds,
				options.topology,
				options.portalStates
			);
			if (heard) {
				const previousState = memory.state;
				memory.confidence = Math.min(1, Math.max(memory.confidence, heard.confidence));
				memory.lastKnownX = heard.sound.x;
				memory.lastKnownY = heard.sound.y;
				memory.searchOriginX = heard.sound.x;
				memory.searchRemaining = this.profile.searchSeconds;
				memory.lastSoundKind = heard.sound.kind;
				memory.lastSoundSourceId = heard.sound.sourceId;
				memory.lastPortalIds = [...heard.portalIds];
				memory.state = 'investigating';
				events.push({
					kind: 'sound-heard',
					enemyId: id,
					soundKind: heard.sound.kind,
					confidence: heard.confidence,
					x: heard.sound.x,
					y: heard.sound.y,
					sourceId: heard.sound.sourceId,
					portalIds: [...heard.portalIds],
				});
				if (previousState === 'calm') {
					events.push({
						kind: 'search-started',
						enemyId: id,
						x: heard.sound.x,
						y: heard.sound.y,
					});
				}
				readiness.raiseNotice(enemy, heard.confidence * 0.48);
				if (memory.confidence >= this.profile.engageConfidence) {
					readiness.raiseNotice(enemy, 1);
				}
			}

			if (memory.state === 'investigating') {
				this.stepInvestigation(enemy, memory, safeDt);
			} else if (memory.state === 'searching') {
				this.stepSearch(enemy, memory, safeDt);
			}
			if (!heard) memory.confidence = Math.max(0, memory.confidence - safeDt * this.profile.confidenceDecayPerSecond);
			if (memory.state !== 'calm' && memory.searchRemaining <= 0 && memory.confidence <= 0.18) {
				memory.state = 'calm';
				enemy.vx = 0;
				events.push({
					kind: 'search-ended',
					enemyId: id,
					x: memory.lastKnownX,
					y: memory.lastKnownY,
				});
			}
			this.project(enemy, memory);
		}
		return events;
	}

	derivePlayerSounds(player: Player, action: ActionMap, dt: number): PlayerSoundEvent[] {
		this.footstepCooldown = Math.max(0, this.footstepCooldown - dt);
		const x = player.x + player.w / 2;
		const y = player.y + player.h / 2;
		const sounds: PlayerSoundEvent[] = [];
		if (action.shootPressed) sounds.push({ kind: 'rail-shot', x, y, intensity: 1, radius: 920, sourceId: 'player', sourceKind: 'player' });
		if (action.meleePressed) sounds.push({ kind: 'melee', x, y, intensity: 0.72, radius: 560, sourceId: 'player', sourceKind: 'player' });
		if (action.dodgePressed) sounds.push({ kind: 'dodge', x, y, intensity: 0.5, radius: 400, sourceId: 'player', sourceKind: 'player' });
		if (action.jumpPressed) sounds.push({ kind: 'jump', x, y, intensity: 0.38, radius: 330, sourceId: 'player', sourceKind: 'player' });
		if (action.hackPressed) sounds.push({ kind: 'hack-pulse', x, y, intensity: 0.22, radius: 210, sourceId: 'player', sourceKind: 'player' });
		if (
			this.footstepCooldown <= 0 &&
			player.onGround &&
			(action.moveLeft || action.moveRight) &&
			Math.abs(player.vx) > 55
		) {
			sounds.push({ kind: 'footstep', x, y, intensity: 0.18, radius: 180, sourceId: 'player', sourceKind: 'player' });
			this.footstepCooldown = 0.3;
		}
		return sounds;
	}

	getMemorySnapshot(): Array<{
		enemyId: string;
		state: EnemyPerceptionMemory['state'];
		confidence: number;
		lastKnownX: number;
		lastKnownY: number;
	}> {
		return [...this.memory.entries()]
			.map(([enemyId, memory]) => ({
				enemyId,
				state: memory.state,
				confidence: memory.confidence,
				lastKnownX: memory.lastKnownX,
				lastKnownY: memory.lastKnownY,
			}))
			.sort((a, b) => a.enemyId.localeCompare(b.enemyId));
	}

	private getLoudestHeardSound(
		enemy: CombatEntity,
		sounds: readonly PlayerSoundEvent[],
		topology?: StageEncounterTopology,
		portalStates: Readonly<Record<string, EncounterPortalState>> = {}
	): { sound: PlayerSoundEvent; confidence: number; portalIds: string[] } | null {
		let loudest: { sound: PlayerSoundEvent; confidence: number; portalIds: string[] } | null = null;
		const enemyX = enemy.x + enemy.w / 2;
		const enemyY = enemy.y + enemy.h / 2;
		for (const sound of sounds) {
			const distance = Math.hypot(sound.x - enemyX, sound.y - enemyY);
			if (distance > sound.radius) continue;
			const attenuation = 1 - distance / Math.max(1, sound.radius);
			const roleMultiplier =
				enemy.communicationRole === 'relay'
					? 1.14
					: enemy.communicationRole === 'enforcer'
						? 0.88
						: 1;
			let topologyTransmission = 1;
			let portalIds: string[] = [];
			if (topology) {
				const sourceZone = getEncounterZoneAtPoint(topology, sound.x, sound.y);
				const enemyZone = getEncounterZoneAtPoint(topology, enemyX, enemyY);
				if (sourceZone && enemyZone) {
					const route = findEncounterRoute(
						topology,
						sourceZone.id,
						enemyZone.id,
						'sound',
						portalStates
					);
					if (!route) continue;
					topologyTransmission = route.transmission;
					portalIds = [...route.portalIds];
				}
				topologyTransmission *=
					1 - soundOcclusionLoss(topology, sound.x, sound.y, enemyX, enemyY);
			}
			const confidence = Math.min(
				1,
				sound.intensity * attenuation * roleMultiplier * Math.max(0, topologyTransmission)
			);
			if (confidence < this.profile.minimumAudibleConfidence) continue;
			if (!loudest || confidence > loudest.confidence) {
				loudest = { sound, confidence, portalIds };
			}
		}
		return loudest;
	}

	private stepInvestigation(
		enemy: CombatEntity,
		memory: EnemyPerceptionMemory,
		dt: number
	): void {
		const enemyCenter = enemy.x + enemy.w / 2;
		const dx = memory.lastKnownX - enemyCenter;
		if (Math.abs(dx) <= 24) {
			memory.state = 'searching';
			memory.searchOriginX = memory.lastKnownX;
			enemy.vx = 0;
			enemy.aiState = 'searching-last-known-position';
			return;
		}
		memory.searchRemaining = Math.max(0, memory.searchRemaining - dt * 0.25);
		const direction: -1 | 1 = dx < 0 ? -1 : 1;
		enemy.dir = direction;
		enemy.vx = direction * this.profile.investigateSpeed;
		enemy.x += enemy.vx * dt;
		enemy.aiState = 'investigating-sound';
		enemy.spriteAnimation = 'patrol_or_move';
	}

	private stepSearch(enemy: CombatEntity, memory: EnemyPerceptionMemory, dt: number): void {
		memory.searchRemaining = Math.max(0, memory.searchRemaining - dt);
		const left = memory.searchOriginX - this.profile.searchRadius;
		const right = memory.searchOriginX + this.profile.searchRadius;
		if (enemy.x <= left) memory.searchDirection = 1;
		if (enemy.x >= right) memory.searchDirection = -1;
		enemy.dir = memory.searchDirection;
		enemy.vx = memory.searchDirection * this.profile.investigateSpeed * 0.55;
		enemy.x += enemy.vx * dt;
		enemy.aiState = 'searching-last-known-position';
		enemy.spriteAnimation = 'patrol_or_move';
	}

	private ensureMemory(enemyId: string, enemy: CombatEntity): EnemyPerceptionMemory {
		const existing = this.memory.get(enemyId);
		if (existing) return existing;
		const created: EnemyPerceptionMemory = {
			state: 'calm',
			confidence: 0,
			lastKnownX: enemy.x + enemy.w / 2,
			lastKnownY: enemy.y + enemy.h / 2,
			searchOriginX: enemy.x,
			searchDirection: enemy.dir < 0 ? -1 : 1,
			searchRemaining: 0,
			lastPortalIds: [],
		};
		this.memory.set(enemyId, created);
		return created;
	}

	private project(enemy: CombatEntity, memory: EnemyPerceptionMemory): void {
		enemy.perceptionState = memory.state;
		enemy.soundConfidence = memory.confidence;
		enemy.lastHeardSoundKind = memory.lastSoundKind;
		enemy.lastHeardSoundSourceId = memory.lastSoundSourceId;
		enemy.soundPortalIds = [...memory.lastPortalIds];
		if (memory.state !== 'calm') {
			enemy.lastKnownPlayerX = memory.lastKnownX;
			enemy.lastKnownPlayerY = memory.lastKnownY;
		}
	}
}

function stableEnemyId(enemy: CombatEntity, index: number): string {
	return enemy.id ?? `${enemy.procgenFamily ?? enemy.procgenRole ?? 'enemy'}:${index}`;
}

function soundOcclusionLoss(
	topology: StageEncounterTopology,
	fromX: number,
	fromY: number,
	toX: number,
	toY: number
): number {
	const dx = toX - fromX;
	if (Math.abs(dx) < 0.001) return 0;
	let loss = 0;
	for (const occluder of topology.occluders) {
		if (occluder.soundLoss <= 0) continue;
		const centerX = occluder.x + occluder.w / 2;
		const t = (centerX - fromX) / dx;
		if (t <= 0 || t >= 1) continue;
		const lineY = fromY + (toY - fromY) * t;
		if (lineY < occluder.y || lineY > occluder.y + occluder.h) continue;
		loss += occluder.soundLoss;
	}
	return Math.min(0.75, Math.max(0, loss));
}
