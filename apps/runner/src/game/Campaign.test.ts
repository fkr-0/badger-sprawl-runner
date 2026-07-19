import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CAMPAIGN, FIRST_THREE_ACT_STAGE_IDS } from './Campaign';

describe('Brechtian story campaign skeleton', () => {
	it('defines the complete eight-stage story spine from the story bible', () => {
		expect(CAMPAIGN.stages.map((stage) => stage.id)).toEqual([
			'lower-sprawl',
			'drainmarket',
			'chrome-arcology',
			'mirror-palace',
			'dub-colony',
			'antenna-barrens',
			'orbital-lift',
			'asteroid-redoubt',
		]);
	});

	it('fully designs the first three Brecht acts with placards, machinery, choices, and debrief tasks', () => {
		const firstThreeActs = CAMPAIGN.acts.slice(0, 3);

		expect(firstThreeActs.map((act) => act.id)).toEqual(['prologue', 'act-i', 'act-ii']);
		for (const act of firstThreeActs) {
			expect(act.brechtDevice).toBeTruthy();
			expect(act.dramaticContradiction).toBeTruthy();
			expect(act.stages.length).toBeGreaterThan(0);
		}

		expect(FIRST_THREE_ACT_STAGE_IDS).toEqual([
			'lower-sprawl',
			'drainmarket',
			'chrome-arcology',
			'mirror-palace',
		]);
	});



	it('defines one integrated minigame for every campaign stage', () => {
		for (const stage of CAMPAIGN.stages) {
			expect(stage.minigames?.length).toBeGreaterThanOrEqual(1);
			const minigame = stage.minigames?.[0];
			expect(minigame?.id).toBeTruthy();
			expect(minigame?.title).toBeTruthy();
			expect(minigame?.kind).toMatch(/^(timing|codegate|routing|memory|signal)$/);
			expect(minigame?.objective).toBeTruthy();
			expect(minigame?.teaches).toBeTruthy();
			expect(minigame?.reward).toBeTruthy();
		}
	});

	it('defines one integrated side quest for every campaign stage', () => {
		for (const stage of CAMPAIGN.stages) {
			expect(stage.sideQuests?.length).toBeGreaterThanOrEqual(1);
			const quest = stage.sideQuests?.[0];
			expect(quest?.id).toBeTruthy();
			expect(quest?.title).toBeTruthy();
			expect(quest?.giver).toBeTruthy();
			expect(quest?.objective).toBeTruthy();
			expect(quest?.reward).toBeTruthy();
			expect(quest?.stageHook).toBeTruthy();
		}
	});

	it('prints every campaign stage into the global todo checklist', () => {
		const todo = readFileSync(new URL('../../../../todo.md', import.meta.url), 'utf8');

		for (const stage of CAMPAIGN.stages) {
			expect(todo).toContain(`### Stage ${stage.chapter}: ${stage.name}`);
			expect(todo).toContain(stage.placard);
			expect(todo).toContain(stage.heistPayload.label);
		}
	});


	it('backs completed story integration todo items with structured source or e2e evidence', () => {
		const todo = readFileSync(new URL('../../../../todo.md', import.meta.url), 'utf8');
		const storyFlowScene = readFileSync(new URL('../scenes/StoryFlowScene.ts', import.meta.url), 'utf8');
		const titleScene = readFileSync(new URL('../scenes/TitleScene.ts', import.meta.url), 'utf8');
		const stageRunOptions = readFileSync(new URL('./StageRunOptions.ts', import.meta.url), 'utf8');
		const storyProgressMigration = readFileSync(
			new URL('./StoryProgressMigration.ts', import.meta.url),
			'utf8'
		);
		const branchRecapE2e = readFileSync(
			new URL('../../../../tests/e2e/story-choice-recap.spec.ts', import.meta.url),
			'utf8'
		);
		const titleProgressE2e = readFileSync(
			new URL('../../../../tests/e2e/title-progress.spec.ts', import.meta.url),
			'utf8'
		);
		const stageDebugE2e = readFileSync(
			new URL('../../../../tests/e2e/stage-debug-panel.spec.ts', import.meta.url),
			'utf8'
		);
		const legacySaveE2e = readFileSync(
			new URL('../../../../tests/e2e/legacy-save-migration.spec.ts', import.meta.url),
			'utf8'
		);

		const evidenceContracts = [
			{
				todo: 'Turn campaign choice data into an in-game choice UI',
				evidence: [storyFlowScene, 'chooseStageChoice'],
			},
			{
				todo: 'Add a result/branch recap panel after every stage choice',
				evidence: [storyFlowScene, 'BranchChoiceRecap', branchRecapE2e, 'badger:story-choice-recap'],
			},
			{
				todo: 'Surface story progress in the menu',
				evidence: [titleScene, 'getStoryProgressSummary', titleProgressE2e, 'badger:title-progress-summary'],
			},
			{
				todo: 'Add stage-detail debug panel',
				evidence: [storyFlowScene, 'StageDebugDetail', stageDebugE2e, 'badger:stage-debug-detail'],
			},
			{
				todo: 'Add save migration/versioning',
				evidence: [storyProgressMigration, 'migrateStoryProgress', legacySaveE2e, 'legacy story progress'],
			},
			{
				todo: 'Add contract tests proving every `CampaignStage.todo` item marked done',
				evidence: [stageRunOptions, 'buildStageRunSceneOptions', storyFlowScene, 'buildStageDebugDetail'],
			},
		];

		for (const contract of evidenceContracts) {
			expect(todo).toContain(`- [x] ${contract.todo}`);
			for (let index = 0; index < contract.evidence.length; index += 2) {
				const source = contract.evidence[index] ?? '';
				const marker = contract.evidence[index + 1] ?? '';
				expect(source).toContain(marker);
			}
		}
	});

	it('defines the Drainmarket parry lesson, stim-cache result flag, and knife-drone counter-timing contract', () => {
		const drainmarket = CAMPAIGN.stages.find((stage) => stage.id === 'drainmarket');

		expect(drainmarket?.tutorialBeats).toContainEqual({
			id: 'parry-window',
			label: 'Parry Tutorial Beat',
			trigger: 'first_knife_drone_windup',
			teaches: 'Wait for the invoice-flash, then tap parry to counter instead of mashing attack.',
		});
		expect(drainmarket?.resultFlag).toBe('stim_cache_secured');
		expect(drainmarket?.boss.lessons).toContainEqual({
			id: 'knife-drone-counter-timing',
			cue: 'red invoice flash before lunge',
			response: 'parry during the flash, then counter while the drone stalls',
		});
	});

	it('defines Chrome Arcology railgun sightline rooms, hidden labor-floor tags, and Madame Vitrine phases', () => {
		const arcology = CAMPAIGN.stages.find((stage) => stage.id === 'chrome-arcology');

		expect(arcology?.rooms).toEqual([
			{
				id: 'glass-atrium-sightline',
				label: 'Glass Atrium Sightline',
				teaches: 'charge the railgun across a safe long lane before drones enter',
			},
			{
				id: 'cargo-shaft-crossfire',
				label: 'Cargo Shaft Crossfire',
				teaches: 'fire through two tagged cargo gaps while moving between cover',
			},
			{
				id: 'vitrine-gallery-pierce',
				label: 'Vitrine Gallery Pierce',
				teaches: 'line up armored displays so one charged shot pierces the whole exhibit',
			},
		]);
		expect(arcology?.backgroundTags).toEqual([
			{
				id: 'labor-floor-b2',
				label: 'hidden labor floor B2',
				reveal: 'cargo tag silhouettes behind luxury glass',
			},
			{
				id: 'labor-floor-b7',
				label: 'hidden labor floor B7',
				reveal: 'unpaid maintenance crew elevator shadow',
			},
		]);
		expect(arcology?.boss.phases).toEqual([
			{
				id: 'display-window',
				label: 'Display Window',
				mechanic: 'telegraphed glass-lane shots teach railgun dodges',
			},
			{
				id: 'price-tag-crossfire',
				label: 'Price-tag Crossfire',
				mechanic: 'summons cargo-tag drones that must be lined up and pierced',
			},
			{
				id: 'transparent-justice',
				label: 'Transparent Justice',
				mechanic: 'breaks cover and forces charged shots through moving mirrors',
			},
		]);
	});

	it('defines Mirror Palace Lio choice outcomes and mirror-door traversal hazards', () => {
		const mirrorPalace = CAMPAIGN.stages.find((stage) => stage.id === 'mirror-palace');

		expect(mirrorPalace?.choice.outcomes).toEqual([
			{
				id: 'lio-exposed',
				prompt: 'expose Lio publicly',
				branch: 'exposed',
				resultFlag: 'lio_exposed',
				consequence: 'Lio survives politically wounded; colony heat drops but trust breaks.',
				metaDelta: { orbitHeat: -1, dubFavor: -1 },
			},
			{
				id: 'lio-protected',
				prompt: 'protect Lio from the room',
				branch: 'protected',
				resultFlag: 'lio_protected',
				consequence:
					'Lio keeps faith with Moss; orbit heat rises because the room sees mercy as weakness.',
				metaDelta: { orbitHeat: 1, dubFavor: 1 },
			},
			{
				id: 'lio-baited',
				prompt: 'use the betrayal as bait',
				branch: 'baited',
				resultFlag: 'lio_baited',
				consequence: 'Lio becomes part of the trap; trust becomes tactical instead of intimate.',
				metaDelta: { orbitHeat: 2, dubFavor: 0 },
			},
		]);
		expect(mirrorPalace?.traversalHazards).toEqual([
			{
				id: 'debt-contract-door',
				label: 'Debt-contract Door',
				teaches: 'read the contract glyph before dashing through the mirror',
			},
			{
				id: 'reflection-loop',
				label: 'Reflection Loop',
				teaches: 'break the false exit by reversing direction on the second shimmer',
			},
			{
				id: 'banquet-switchback',
				label: 'Banquet Switchback',
				teaches: 'rocket across alternating doors while guards applaud the wrong reflection',
			},
		]);
	});

	it('defines Dub Colony beat timing, colony alignment outcomes, and visible Naya companion', () => {
		const dubColony = CAMPAIGN.stages.find((stage) => stage.id === 'dub-colony');

		expect(dubColony?.stageModifiers).toContainEqual({
			id: 'bass-reactor-sync',
			label: 'Bass Reactor Sync',
			kind: 'beat-timing',
			bpm: 86,
			perfectWindowMs: 145,
			teaches: 'jump, parry, and strike on the bass pulse to overcharge rebel equipment',
		});
		expect(dubColony?.choice.outcomes).toEqual([
			{
				id: 'colony-chorus',
				prompt: 'chorus',
				branch: 'chorus',
				resultFlag: 'colony_alignment_chorus',
				consequence:
					'The colony stays noisy and democratic; support arrives as many small assists.',
			},
			{
				id: 'colony-army',
				prompt: 'army',
				branch: 'army',
				resultFlag: 'colony_alignment_army',
				consequence:
					'The colony centralizes command; support arrives faster but dissent gets quieter.',
			},
			{
				id: 'colony-supplier',
				prompt: 'supplier',
				branch: 'supplier',
				resultFlag: 'colony_alignment_supplier',
				consequence:
					'The colony becomes logistics first; shops improve while public risk is outsourced.',
			},
		]);
		expect(dubColony?.companion).toEqual({
			id: 'naya-root',
			name: 'Naya Root',
			role: 'visible shield companion and beat scout',
			placeholder: false,
			abilities: ['marks bass pulses', 'calls safe landings', 'amplifies chorus choices'],
		});
		expect(dubColony?.boss.phases?.map((phase) => phase.id)).toEqual([
			'security-pulse',
			'emergency-crown',
			'chorus-test',
		]);
	});

	it('defines Antenna Barrens code-gate pressure, Black-Ice Fox hack duel, and ledger release heat/favor outcomes', () => {
		const barrens = CAMPAIGN.stages.find((stage) => stage.id === 'antenna-barrens');

		expect(barrens?.stageModifiers).toContainEqual({
			id: 'ledger-codegate-surge',
			label: 'Ledger Code-gate Surge',
			kind: 'code-gate-pressure',
			gatesPerMinute: 4,
			minGatesPerRun: 5,
			teaches: 'solve short repair prompts under antenna pressure before the ledger relocks',
		});
		expect(barrens?.boss.hackDuel).toEqual({
			id: 'black-ice-fox-duel',
			label: 'Black-Ice Fox Hack Duel',
			placeholder: true,
			rounds: 3,
			mechanics: ['fasttype bursts', 'command-repair decoys', 'ledger shard checksum race'],
		});
		expect(barrens?.choice.outcomes).toEqual([
			{
				id: 'ledger-public-dump',
				prompt: 'full public dump',
				branch: 'public-dump',
				resultFlag: 'ledger_public_dump',
				consequence: 'Debt proof spreads everywhere; dub favor rises but orbit heat spikes.',
				metaDelta: { dubFavor: 2, orbitHeat: 2 },
			},
			{
				id: 'ledger-targeted-burn',
				prompt: 'targeted debt burn',
				branch: 'targeted-burn',
				resultFlag: 'ledger_targeted_burn',
				consequence:
					'Selected families are freed quietly; dub favor rises while orbit heat stays controlled.',
				metaDelta: { dubFavor: 1, orbitHeat: 0 },
			},
			{
				id: 'ledger-prisoner-trade',
				prompt: 'trade for prisoner names',
				branch: 'prisoner-trade',
				resultFlag: 'ledger_prisoner_trade',
				consequence:
					'The shard buys names for the lift job; orbit heat rises from the negotiation trail.',
				metaDelta: { dubFavor: 0, orbitHeat: 1 },
			},
		]);
	});

	it('defines Orbital Lift chase template, cargo reversal branches, and Elevator Angel obedience behavior', () => {
		const lift = CAMPAIGN.stages.find((stage) => stage.id === 'orbital-lift');

		expect(lift?.stageTemplate).toEqual({
			id: 'orbital-lift-chase',
			label: 'Orbital Lift Chase Template',
			kind: 'escape-chase',
			segments: ['container-sprint', 'customs-gate-vault', 'counterweight-drop'],
			escalation: 'camera pressure rises whenever cargo locks are reversed',
		});
		expect(lift?.choice.outcomes).toEqual([
			{
				id: 'cargo-safe-partial',
				prompt: 'safe partial reversal',
				branch: 'safe-partial',
				resultFlag: 'cargo_safe_partial',
				consequence: 'A smaller prisoner group escapes cleanly; heat stays manageable.',
				metaDelta: { dubFavor: 1, orbitHeat: 0 },
			},
			{
				id: 'cargo-full-release',
				prompt: 'full prisoner release',
				branch: 'full-release',
				resultFlag: 'cargo_full_release',
				consequence:
					'The lift floods with freed prisoners; the rebellion grows and orbit heat surges.',
				metaDelta: { dubFavor: 3, orbitHeat: 2 },
			},
			{
				id: 'cargo-decoy-reversal',
				prompt: 'decoy reversal to hide allies',
				branch: 'decoy-reversal',
				resultFlag: 'cargo_decoy_reversal',
				consequence:
					'A false cargo trail protects allies; favor rises slowly while Vane chases ghosts.',
				metaDelta: { dubFavor: 1, orbitHeat: -1 },
			},
		]);
		expect(lift?.boss.behavior).toEqual({
			id: 'obedient-machine-protocol',
			label: 'Obedient Machine Protocol',
			placeholder: true,
			phases: [
				{ id: 'order-parser', mechanic: 'announces each received order before executing it' },
				{
					id: 'route-optimizer',
					mechanic: 'redirects cargo lanes unless the player reverses locks on beat',
				},
				{ id: 'mercy-exception', mechanic: 'stutters when prisoner names contradict the manifest' },
			],
		});
	});

	it('defines Asteroid Redoubt final broadcast choices and Director Vane phases', () => {
		const redoubt = CAMPAIGN.stages.find((stage) => stage.id === 'asteroid-redoubt');

		expect(redoubt?.choice.outcomes).toEqual([
			{
				id: 'broadcast-abolish-skylock',
				prompt: 'abolish the sky-lock',
				branch: 'abolish-skylock',
				resultFlag: 'broadcast_abolish_skylock',
				consequence: 'The lock is broken publicly; no one can quietly inherit it.',
			},
			{
				id: 'broadcast-chorus-control',
				prompt: 'hand control to the chorus',
				branch: 'chorus-control',
				resultFlag: 'broadcast_chorus_control',
				consequence: 'The colony becomes steward of the sky, watched by every listener.',
			},
			{
				id: 'broadcast-publish-tools',
				prompt: 'publish the tools and refuse command',
				branch: 'publish-tools',
				resultFlag: 'broadcast_publish_tools',
				consequence:
					'The method escapes ownership; freedom becomes reproducible instead of centralized.',
			},
		]);
		expect(redoubt?.boss.phases).toEqual([
			{
				id: 'competence-monologue',
				label: 'Competence Monologue',
				mechanic: 'Vane narrates why someone efficient must own the sky',
			},
			{
				id: 'skylock-enforcement',
				label: 'Sky-lock Enforcement',
				mechanic: 'satellite locks close routes unless prior payloads are used in sequence',
			},
			{
				id: 'broadcast-counterclaim',
				label: 'Broadcast Counterclaim',
				mechanic: 'Vane corrupts the final message while Moss protects the chosen doctrine',
			},
			{
				id: 'ownership-collapse',
				label: 'Ownership Collapse',
				mechanic: 'all previous witnesses interrupt the command channel',
			},
		]);
	});

	it('gives every stage enough data for playable skeleton routing and global todo output', () => {
		for (const stage of CAMPAIGN.stages) {
			expect(stage.actId).toBeTruthy();
			expect(stage.place).toBeTruthy();
			expect(stage.primaryVerb).toBeTruthy();
			expect(stage.heistPayload.id).toBeTruthy();
			expect(stage.placard).toMatch(/\S/);
			expect(stage.briefing.lines.length).toBeGreaterThanOrEqual(2);
			expect(stage.machinery.length).toBeGreaterThan(0);
			expect(stage.choice.prompts.length).toBe(3);
			expect(stage.boss.id).toBeTruthy();
			expect(stage.debrief.lines.length).toBeGreaterThanOrEqual(2);
			expect(stage.todo.length).toBeGreaterThan(0);
			expect(stage.skeleton).toMatchObject({ playable: true, placeholderBoss: true });
		}
	});
});
