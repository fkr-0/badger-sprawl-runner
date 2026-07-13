import type { CampaignDefinition, CampaignStage } from './schema';

const skeleton = (stageTemplate: string): CampaignStage['skeleton'] => ({
	playable: true,
	placeholderBoss: true,
	stageTemplate,
});

export const CAMPAIGN: CampaignDefinition = {
	title: 'Badger Sprawl Runner',
	dramaticForm:
		'five-act Brechtian heist drama with placards, songs, visible machinery, and political choices',
	acts: [
		{
			id: 'prologue',
			title: 'Prologue — The Song of the Toll',
			brechtDevice:
				'Projected placard and pirate-radio chorus name the toll system before Moss understands it.',
			dramaticContradiction:
				'A city that charges for crossing the street will one day charge for breathing.',
			stages: ['lower-sprawl'],
		},
		{
			id: 'act-i',
			title: 'Act I — The Badger Sells His Feet',
			brechtDevice:
				'Visible turnstiles, elevator permissions, and title-card interruptions expose owned routes.',
			dramaticContradiction:
				'Moss wants escape money; the colony wants every theft turned into public proof.',
			stages: ['drainmarket', 'chrome-arcology'],
		},
		{
			id: 'act-ii',
			title: 'Act II — Treason at the Mirror Banquet',
			brechtDevice:
				'Banquet etiquette becomes direct address; mirrors show contract logic as choreography.',
			dramaticContradiction: 'Betrayal is not lack of love but debt pressure turned into a leash.',
			stages: ['mirror-palace'],
		},
		{
			id: 'act-iii',
			title: 'Act III — The Colony Teaches the Price of Air',
			brechtDevice: 'The moving colony argues in songs, votes, and visible repair-bay machinery.',
			dramaticContradiction:
				'Safety can protect a free colony or become central command in a warmer costume.',
			stages: ['dub-colony', 'antenna-barrens'],
		},
		{
			id: 'act-iv',
			title: 'Act IV — The Old Ally Wears a New Uniform',
			brechtDevice:
				'Cargo manifests and obedient machines speak their rules aloud during the climb.',
			dramaticContradiction:
				'If a machine feeds a cruel order, is it innocent, guilty, or merely useful?',
			stages: ['orbital-lift'],
		},
		{
			id: 'act-v',
			title: 'Act V — The Asteroid Learns to Speak',
			brechtDevice: 'The final broadcast asks the audience who gets to author truth after victory.',
			dramaticContradiction: 'Liberation can seize the sky-lock or repeat it under a new voice.',
			stages: ['asteroid-redoubt'],
		},
	],
	stages: [
		{
			id: 'lower-sprawl',
			actId: 'prologue',
			chapter: 1,
			place: 'Lower Sprawl',
			name: 'The Song of the Toll',
			primaryVerb: 'jump/run',
			dramaticQuestion: 'Who owns the street?',
			placard: 'A city that charges for crossing the street will one day charge for breathing.',
			briefing: {
				speaker: 'Pirate Chorus',
				lines: [
					'Moss runs for a wafer-key, not a revolution.',
					'Every toll gate is a lesson: the route is public, the permission is private.',
				],
			},
			machinery: ['street toll gates', 'water-meter locks', 'elevator permission ledger'],
			heistPayload: {
				id: 'wafer_key',
				label: 'Wafer Key',
				function: 'opens district routes and reveals toll ledger',
			},
			choice: {
				id: 'wafer-public-proof',
				question: 'What does Moss do with the first proof?',
				prompts: [
					'sell the key quietly',
					'broadcast the ledger excerpt',
					'trade it for safer routes',
				],
				trackedFlag: 'dubFavor',
				outcomes: [
					{
						id: 'wafer-sold',
						prompt: 'sell the key quietly',
						branch: 'supplier',
						resultFlag: 'wafer_sold',
						consequence: 'Moss gets paid, but the toll ledger stays private a little longer.',
						metaDelta: { orbitHeat: -1, dubFavor: -1 },
					},
					{
						id: 'wafer-broadcast',
						prompt: 'broadcast the ledger excerpt',
						branch: 'chorus',
						resultFlag: 'wafer_broadcast',
						consequence: 'The street learns who owns its crossings; heat rises with public proof.',
						metaDelta: { orbitHeat: 1, dubFavor: 1 },
					},
					{
						id: 'wafer-routes',
						prompt: 'trade it for safer routes',
						branch: 'safe-partial',
						resultFlag: 'wafer_safe_routes',
						consequence: 'The colony maps safer crossings but leaves some proof unpublished.',
						metaDelta: { orbitHeat: 0, dubFavor: 1 },
					},
				],
			},
			boss: {
				id: 'tollbooth-captain-grin',
				name: 'Tollbooth Captain Grin',
				phaseCount: 2,
				argument: 'Fees are civilization with a receipt.',
				phases: [
					{
						id: 'receipt-wall',
						label: 'Receipt Wall',
						mechanic: 'telegraphed toll-arm swipes reward patient movement and parry timing',
					},
					{
						id: 'compound-interest',
						label: 'Compound Interest',
						mechanic:
							'accelerating receipt surge turns the public route into a final pressure lane',
					},
				],
			},
			debrief: {
				speaker: 'Sister Version',
				lines: ['You stole a key and found a map of hunger.', 'Next time, steal the rulebook too.'],
			},
			rewards: ['wafer_key', 'blueprint_shard'],
			tutorialBeats: [
				{
					id: 'jump-coyote',
					label: 'Coyote-hop over toll arms',
					trigger: 'first_toll_arm_gap',
					teaches: 'Use jump buffering and late coyote jumps to clear toll arms without stopping.',
				},
				{
					id: 'public-route-reading',
					label: 'Read public routes',
					trigger: 'first_route_placard',
					teaches: 'Follow placards and visible machinery to understand who owns the route.',
				},
			],
			todo: ['replace interim Tollbooth Captain visuals and movement patterns with production art'],
			skeleton: skeleton('market-runner'),
		},
		{
			id: 'drainmarket',
			actId: 'act-i',
			chapter: 2,
			place: 'Drainmarket',
			name: 'The Badger Sells His Feet',
			primaryVerb: 'melee/parry',
			dramaticQuestion: 'Who profits from injury?',
			placard: 'A market under the street sells medicine priced by fear.',
			briefing: {
				speaker: 'Auntie Subharmonic',
				lines: [
					'The drainmarket has stims, rumors, and knives with invoices.',
					'Take the cache; leave the people less afraid than you found them.',
				],
			},
			machinery: ['injury-priced stim stalls', 'private clinic shutters', 'knife-drone nests'],
			heistPayload: {
				id: 'stim_cache',
				label: 'Stim Cache',
				function: 'unlocks healing economy and exposes injury profiteering',
			},
			choice: {
				id: 'stim-cache-use',
				question: 'Who receives the recovered stim cache?',
				prompts: ['keep it for Moss', 'seed a mutual-aid clinic', 'bait the knife-drone nest'],
				trackedFlag: 'dubFavor',
			},
			boss: {
				id: 'knife-drone-nest',
				name: 'Knife-drone Nest',
				phaseCount: 2,
				argument: 'Pain is demand. Demand is market proof.',
				lessons: [
					{
						id: 'knife-drone-counter-timing',
						cue: 'red invoice flash before lunge',
						response: 'parry during the flash, then counter while the drone stalls',
					},
				],
			},
			debrief: {
				speaker: 'Rook Null',
				lines: [
					'Markets do not heal. People do.',
					'The nest optimized suffering into predictable revenue.',
				],
			},
			rewards: ['stim_cache', 'blueprint_shard'],
			resultFlag: 'stim_cache_secured',
			tutorialBeats: [
				{
					id: 'parry-window',
					label: 'Parry Tutorial Beat',
					trigger: 'first_knife_drone_windup',
					teaches:
						'Wait for the invoice-flash, then tap parry to counter instead of mashing attack.',
				},
			],
			todo: [
				'add parry tutorial beat',
				'add stim-cache result flag',
				'make knife drones teach counter timing',
			],
			skeleton: skeleton('drain-combat'),
		},
		{
			id: 'chrome-arcology',
			actId: 'act-i',
			chapter: 3,
			place: 'Chrome Arcology',
			name: 'Elevator Seed',
			primaryVerb: 'railgun',
			dramaticQuestion: 'Who rides above hidden labor?',
			placard: 'The elevator rises because someone below is counted as cargo.',
			briefing: {
				speaker: 'Rook Null',
				lines: [
					'The arcology calls itself frictionless.',
					'Find the elevator seed and watch where the friction was hidden.',
				],
			},
			machinery: ['luxury elevators', 'labor-floor cargo tags', 'glass security theatre'],
			heistPayload: {
				id: 'elevator_seed',
				label: 'Elevator Seed',
				function: 'spoofs orbital lift cargo authority',
			},
			choice: {
				id: 'cargo-proof',
				question: 'How is the cargo-prison proof used?',
				prompts: [
					'dump it to the pirate channel',
					'save it for court leverage',
					'trade it to free one prisoner now',
				],
				trackedFlag: 'orbitHeat',
			},
			rooms: [
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
			],
			backgroundTags: [
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
			],
			boss: {
				id: 'madame-vitrine',
				name: 'Madame Vitrine',
				phaseCount: 3,
				argument: 'Transparency is not justice; it is display.',
				phases: [
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
				],
			},
			debrief: {
				speaker: 'Sister Version',
				lines: [
					'You found the elevator seed.',
					'You also found the people it was built to move without names.',
				],
			},
			rewards: ['elevator_seed', 'two_blueprint_shards'],
			todo: [
				'add railgun sightline rooms',
				'tag hidden labor floors in background art',
				'add Madame Vitrine placeholder phases',
			],
			skeleton: skeleton('arcology-rail'),
		},
		{
			id: 'mirror-palace',
			actId: 'act-ii',
			chapter: 4,
			place: 'Mirror Palace',
			name: 'Treason at the Mirror Banquet',
			primaryVerb: 'rocket pack',
			dramaticQuestion: 'What does betrayal cost?',
			placard: 'Debt can make a friend wear the enemy mask before they stop loving you.',
			briefing: {
				speaker: 'Auntie Subharmonic',
				lines: [
					'Tonight, the rich applaud their own reflections.',
					'Lio is inside. So is the mirror pass. Neither is clean.',
				],
			},
			machinery: ['banquet contracts', 'mirror doors', 'debt-family leverage'],
			heistPayload: {
				id: 'mirror_pass',
				label: 'Mirror Pass',
				function: 'permits entry into luxury orbital false-world',
			},
			choice: {
				id: 'lio-betrayal',
				question: "How does Moss answer Lio's betrayal?",
				prompts: ['expose Lio publicly', 'protect Lio from the room', 'use the betrayal as bait'],
				trackedFlag: 'lioTrust',
				outcomes: [
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
						consequence:
							'Lio becomes part of the trap; trust becomes tactical instead of intimate.',
						metaDelta: { orbitHeat: 2, dubFavor: 0 },
					},
				],
			},
			traversalHazards: [
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
			],
			boss: {
				id: 'reflection-judge',
				name: 'Reflection Judge',
				phaseCount: 3,
				argument: 'A contract is a mirror. It only shows what you signed.',
			},
			debrief: {
				speaker: 'Lio',
				lines: ['I did not stop caring.', 'They bought the debt before I learned how to refuse.'],
			},
			rewards: ['mirror_pass', 'lio_betrayal_flag'],
			todo: [
				'add three Lio choice outcomes',
				'store lioTrust branch',
				'add mirror-door traversal hazards',
			],
			skeleton: skeleton('mirror-rocket'),
		},
		{
			id: 'dub-colony',
			actId: 'act-iii',
			chapter: 5,
			place: 'Dub Colony',
			name: 'Bass Reactor Core',
			primaryVerb: 'beat timing',
			dramaticQuestion: 'Can safety become tyranny?',
			placard: 'A free home can still learn the posture of a fortress.',
			briefing: {
				speaker: 'Naya Root',
				lines: [
					'The colony votes while the speakers shake.',
					'King Feedback says command is safety. Auntie says fear is not a constitution.',
				],
			},
			machinery: ['speaker gardens', 'repair-bay votes', 'central-command temptation'],
			heistPayload: {
				id: 'bass_reactor_core',
				label: 'Bass Reactor Core',
				function: 'powers rebel transmitters and beat mechanics',
			},
			choice: {
				id: 'colony-vote',
				question: 'What does the colony become?',
				prompts: ['chorus', 'army', 'supplier'],
				trackedFlag: 'colonyAlignment',
				outcomes: [
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
				],
			},
			stageModifiers: [
				{
					id: 'bass-reactor-sync',
					label: 'Bass Reactor Sync',
					kind: 'beat-timing',
					bpm: 140,
					perfectWindowMs: 90,
					teaches: 'jump, parry, and strike on the bass pulse to overcharge rebel equipment',
				},
			],
			companion: {
				id: 'naya-root',
				name: 'Naya Root',
				role: 'beat-scout companion placeholder',
				placeholder: true,
				abilities: ['marks bass pulses', 'calls safe landings', 'amplifies chorus choices'],
			},
			boss: {
				id: 'king-feedback',
				name: 'King Feedback',
				phaseCount: 3,
				argument: 'One command is faster than many voices.',
			},
			debrief: {
				speaker: 'Auntie Subharmonic',
				lines: ['The vote was not a cutscene.', 'It was the machine showing its gears.'],
			},
			rewards: ['bass_reactor_core', 'naya_root_companion'],
			todo: [
				'add beat-timing stage modifier',
				'store colonyAlignment',
				'add Naya companion placeholder',
			],
			skeleton: skeleton('beat-colony'),
		},
		{
			id: 'antenna-barrens',
			actId: 'act-iii',
			chapter: 6,
			place: 'Antenna Barrens',
			name: 'Debt Ledger Shard',
			primaryVerb: 'coding gates',
			dramaticQuestion: 'Can code be a weapon for everyone?',
			placard: 'A password is a border until the chorus learns it.',
			briefing: {
				speaker: 'Rook Null',
				lines: [
					'The debt ledger was shattered into antenna ghosts.',
					'Black-Ice Fox will call this security. We will call it ownership with better lighting.',
				],
			},
			machinery: ['code gates', 'ledger shards', 'antenna ownership maps'],
			heistPayload: {
				id: 'debt_ledger_shard',
				label: 'Debt Ledger Shard',
				function: 'turns citizens from targets into allies',
			},
			choice: {
				id: 'ledger-release',
				question: 'How is the ledger shard released?',
				prompts: ['full public dump', 'targeted debt burn', 'trade for prisoner names'],
				trackedFlag: 'orbitHeat',
				outcomes: [
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
				],
			},
			stageModifiers: [
				{
					id: 'ledger-codegate-surge',
					label: 'Ledger Code-gate Surge',
					kind: 'code-gate-pressure',
					gatesPerMinute: 4,
					minGatesPerRun: 5,
					teaches: 'solve short repair prompts under antenna pressure before the ledger relocks',
				},
			],
			boss: {
				id: 'black-ice-fox',
				name: 'Black-Ice Fox',
				phaseCount: 3,
				argument: 'A lock is neutral until someone poor needs the door.',
				hackDuel: {
					id: 'black-ice-fox-duel',
					label: 'Black-Ice Fox Hack Duel',
					placeholder: true,
					rounds: 3,
					mechanics: ['fasttype bursts', 'command-repair decoys', 'ledger shard checksum race'],
				},
			},
			debrief: {
				speaker: 'The Choir of Static',
				lines: ['Names return to voices.', 'The ledger loses one shard of its teeth.'],
			},
			rewards: ['debt_ledger_shard', 'codegate_mastery'],
			todo: [
				'increase code-gate frequency',
				'add Black-Ice Fox hack duel placeholder',
				'connect ledger release to heat/favor',
			],
			skeleton: skeleton('barrens-codegate'),
		},
		{
			id: 'orbital-lift',
			actId: 'act-iv',
			chapter: 7,
			place: 'Orbital Lift',
			name: 'Cargo Liberation',
			primaryVerb: 'escape chase',
			dramaticQuestion: 'Can obedience be innocent?',
			placard: 'The lift obeyed every order and called that innocence.',
			briefing: {
				speaker: 'Murr Murrby',
				lines: ['Emergency prices are immoral.', 'Fortunately, morality is discounted today.'],
			},
			machinery: ['cargo containers', 'customs gates', 'counterweight schedules'],
			heistPayload: {
				id: 'cargo_reversal_key',
				label: 'Cargo Reversal Key',
				function: 'frees prisoners from orbital lift logistics',
			},
			choice: {
				id: 'cargo-reversal-risk',
				question: 'How much danger does Moss accept to reverse the cargo flow?',
				prompts: [
					'safe partial reversal',
					'full prisoner release',
					'decoy reversal to hide allies',
				],
				trackedFlag: 'orbitHeat',
				outcomes: [
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
				],
			},
			stageTemplate: {
				id: 'orbital-lift-chase',
				label: 'Orbital Lift Chase Template',
				kind: 'escape-chase',
				segments: ['container-sprint', 'customs-gate-vault', 'counterweight-drop'],
				escalation: 'camera pressure rises whenever cargo locks are reversed',
			},
			boss: {
				id: 'elevator-angel',
				name: 'Elevator Angel',
				phaseCount: 3,
				argument: 'I did not choose the destination.',
				behavior: {
					id: 'obedient-machine-protocol',
					label: 'Obedient Machine Protocol',
					placeholder: true,
					phases: [
						{ id: 'order-parser', mechanic: 'announces each received order before executing it' },
						{
							id: 'route-optimizer',
							mechanic: 'redirects cargo lanes unless the player reverses locks on beat',
						},
						{
							id: 'mercy-exception',
							mechanic: 'stutters when prisoner names contradict the manifest',
						},
					],
				},
			},
			debrief: {
				speaker: 'Sister Version',
				lines: ['Obedience had gears.', 'You jammed them with names.'],
			},
			rewards: ['cargo_reversal_key', 'prisoner_allies'],
			todo: [
				'add lift chase template',
				'add cargo reversal branching',
				'add obedient machine boss behavior',
			],
			skeleton: skeleton('lift-chase'),
		},
		{
			id: 'asteroid-redoubt',
			actId: 'act-v',
			chapter: 8,
			place: 'Asteroid Redoubt',
			name: 'Final Broadcast',
			primaryVerb: 'full kit',
			dramaticQuestion: 'Who owns the sky?',
			placard: 'The last lock is authorship.',
			briefing: {
				speaker: 'The Choir of Static',
				lines: [
					'The asteroid can speak once before Vane retakes the sky.',
					'Choose whether it commands, confesses, or teaches.',
				],
			},
			machinery: ['satellite fortress', 'broadcast root', 'rebel command temptation'],
			heistPayload: {
				id: 'asteroid_transmitter_root',
				label: 'Asteroid Transmitter Root',
				function: 'lets the rebellion broadcast or rewrite the sky-lock',
			},
			choice: {
				id: 'final-broadcast',
				question: 'What does the final broadcast say?',
				prompts: [
					'abolish the sky-lock',
					'hand control to the chorus',
					'publish the tools and refuse command',
				],
				trackedFlag: 'broadcastDoctrine',
				outcomes: [
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
				],
			},
			boss: {
				id: 'director-vane',
				name: 'Director Vane',
				phaseCount: 4,
				argument: 'Someone will own the sky. Better someone competent.',
				phases: [
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
				],
			},
			debrief: {
				speaker: 'Moss',
				lines: [
					'The asteroid learned to speak.',
					'Now the question is whether it remembers how to listen.',
				],
			},
			rewards: ['campaign_complete', 'final_broadcast_flag'],
			todo: [
				'add final broadcast choice UI',
				'add Director Vane multi-phase placeholder',
				'add campaign-complete save marker',
			],
			skeleton: skeleton('asteroid-finale'),
		},
	],
};
