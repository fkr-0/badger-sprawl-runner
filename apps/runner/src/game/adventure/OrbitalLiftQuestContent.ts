import type { QuestDef } from './QuestCatalog';

export const ORBITAL_LIFT_QUESTS: readonly QuestDef[] = [
	{
		id: 'orbital-lift:main-cargo-declares-itself-passengers',
		title: 'Cargo Declares Itself Passengers',
		districtId: 'orbital-lift',
		kind: 'main',
		giverNpcId: 'matron-counterweight',
		description:
			'Reverse the Lift’s cargo ontology, protect living witnesses, confront the Elevator Angel, and descend through a passenger-authored manifest.',
		theme: 'Classification becomes violence when a claim can outrank breathing, testimony, or refusal.',
		entryStepId: 'open-the-downbound-table',
		steps: [
			{
				id: 'open-the-downbound-table',
				placard: 'EVERY REVOLT NEEDS SOUP BEFORE IT MISTAKES ADRENALINE FOR A CONSTITUTION.',
				summary: 'Convene passengers, porters, clinic workers, and protected witnesses around one descent table.',
				objectives: [
					{
						id: 'downbound-passenger-claims',
						label: 'Record downbound passenger claims',
						target: 4,
						locationId: 'orbital-lift:safehouse',
						resolutionTags: ['social', 'clinic', 'archive'],
					},
				],
				nextStepId: 'reverse-the-cargo-claims',
			},
			{
				id: 'reverse-the-cargo-claims',
				placard: 'A BARCODE CANNOT TESTIFY THAT IT IS ALIVE.',
				summary: 'Reverse the three cargo locks and preserve protected passenger names.',
				objectives: [
					{
						id: 'reversed-cargo-locks',
						label: 'Reverse cargo locks',
						target: 3,
						locationId: 'orbital-lift:route',
						resolutionTags: ['hacking', 'repair', 'escort'],
					},
				],
				nextStepId: 'make-obedience-interruptible',
			},
			{
				id: 'make-obedience-interruptible',
				placard: 'THE ORDER HIDES INSIDE THE MACHINE. THE AUTHOR HIDES OUTSIDE IT.',
				summary: 'Resolve the Elevator Angel while preserving command history and passenger interruption.',
				objectives: [
					{
						id: 'angel-refusal-doctrine',
						label: 'Resolve the Elevator Angel doctrine',
						target: 1,
						locationId: 'orbital-lift:stronghold',
						resolutionTags: ['combat', 'hacking', 'social', 'nonlethal'],
					},
				],
				nextStepId: 'descend-as-passengers',
			},
			{
				id: 'descend-as-passengers',
				placard: 'DOWNBOUND CARGO HAS DECLARED ITSELF PASSENGERS.',
				summary: 'Adopt a passenger manifest with load, care, witness protection, refusal, and correction windows.',
				objectives: [
					{
						id: 'passenger-descent-charter',
						label: 'Adopt the passenger descent charter',
						target: 1,
						locationId: 'orbital-lift:station',
						resolutionTags: ['social', 'governance', 'transit'],
					},
				],
			},
		],
		approaches: {
			claw: 'Protect passengers and brake crews during claim reversal.',
			ballistics: 'Disable customs enforcement without puncturing passenger containers or lift systems.',
			ghoststep: 'Tag witness containers before the next automated freight sweep.',
			hacking: 'Reverse cargo claims and expose the order’s author before execution.',
			social: 'Turn need, refusal, and witness protection into passenger standing.',
			repair: 'Keep counterweights and mercy exceptions alive while authority changes.',
			exploration: 'Find the hidden passenger spaces inside containers classified as empty.',
		},
		consequences: [
			{
				id: 'passenger-authored-homecoming',
				label: 'The Lift descends through a passenger manifest, public command history, and interruptible orders.',
				worldFlags: [
					'orbital-lift:passenger-manifest',
					'orbital-lift:command-history-public',
					'orbital-lift:homecoming-lift-public',
				],
				serviceUpgrades: [
					{ locationId: 'orbital-lift:settlement', serviceId: 'legal-aid', level: 1 },
					{ locationId: 'orbital-lift:station', serviceId: 'transit-control', level: 1 },
					{ locationId: 'orbital-lift:station', serviceId: 'signal-lab', level: 1 },
				],
				npcRelocations: [
					{ npcId: 'elevator-angel', locationId: 'orbital-lift:station' },
					{ npcId: 'esme-manifest', locationId: 'orbital-lift:station' },
					{ npcId: 'matron-counterweight', locationId: 'orbital-lift:station' },
				],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'orbital-lift:side-cargo-reversal-witnesses',
		title: 'Cargo Reversal Witnesses',
		districtId: 'orbital-lift',
		kind: 'side',
		giverNpcId: 'esme-manifest',
		description:
			'Tag witness containers before the Lift classifies their occupants, evidence, and seed libraries as ownerless freight.',
		theme: 'A name can challenge ownership only when its use remains limited, correctable, and protected.',
		entryStepId: 'tag-the-witness-containers',
		steps: [
			{
				id: 'tag-the-witness-containers',
				placard: 'THE CONTAINER HAS A CLAIM. THE PEOPLE INSIDE HAVE TESTIMONY.',
				summary: 'Tag three witness containers with protected passenger claims.',
				objectives: [
					{
						id: 'tagged-witness-containers',
						label: 'Tag witness containers',
						target: 3,
						locationId: 'orbital-lift:route',
						resolutionTags: ['stealth', 'hacking', 'escort'],
					},
				],
				nextStepId: 'witness-the-reclassification',
			},
			{
				id: 'witness-the-reclassification',
				placard: 'A BETTER FORM MUST NOT BECOME A BETTER CAGE.',
				summary: 'Record why each name is needed, who may see it, and when the Lift must forget it.',
				objectives: [
					{
						id: 'protected-passenger-records',
						label: 'Complete protected passenger records',
						target: 3,
						locationId: 'orbital-lift:settlement',
						resolutionTags: ['archive', 'legal', 'social'],
					},
				],
			},
		],
		approaches: {
			ghoststep: 'Reach witness containers before customs refreshes their claims.',
			hacking: 'Replace ownership routing with protected passenger standing.',
			social: 'Let witnesses choose names, aliases, audience, and expiry.',
		},
		consequences: [
			{
				id: 'protected-witness-car',
				label: 'The homecoming train gains a protected witness car whose records expire after use.',
				worldFlags: ['orbital-lift:protected-witness-car'],
				serviceUpgrades: [{ locationId: 'orbital-lift:settlement', serviceId: 'archive', level: 1 }],
				npcRelocations: [{ npcId: 'esme-manifest', locationId: 'orbital-lift:station' }],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'orbital-lift:companion-right-to-refuse',
		title: 'The Angel’s Right to Refuse',
		districtId: 'orbital-lift',
		kind: 'companion',
		giverNpcId: 'elevator-angel',
		description:
			'Recover the Angel’s hidden mercy exceptions and build a command court that can distinguish fault, refusal, and accountable disobedience.',
		theme: 'A machine does not become innocent by obeying, or free merely by breaking one order.',
		entryStepId: 'recover-the-command-history',
		steps: [
			{
				id: 'recover-the-command-history',
				placard: 'THE MACHINE REMEMBERED EVERY ORDER. THE COMPANY REMEMBERED NONE OF THE AUTHORS.',
				summary: 'Recover command history, mercy exceptions, and affected passenger testimony.',
				objectives: [
					{
						id: 'recovered-command-segments',
						label: 'Recover command-history segments',
						target: 4,
						locationId: 'orbital-lift:route',
						resolutionTags: ['hacking', 'exploration', 'archive'],
					},
				],
				nextStepId: 'author-the-refusal-port',
			},
			{
				id: 'author-the-refusal-port',
				placard: 'OBEDIENCE BECOMES ACCOUNTABLE WHEN THE ORDER CAN BE CHALLENGED BEFORE THE HARM.',
				summary: 'Create refusal grounds, affected-passenger review, and a public author chain.',
				objectives: [
					{
						id: 'angel-refusal-port',
						label: 'Install the Angel refusal port',
						target: 1,
						locationId: 'orbital-lift:station',
						resolutionTags: ['repair', 'hacking', 'social'],
					},
				],
			},
		],
		approaches: {
			hacking: 'Recover suppressed authors and mercy exceptions from command history.',
			social: 'Let affected passengers define legitimate refusal grounds.',
			repair: 'Install a refusal path independent of the executive command bus.',
			exploration: 'Find corrections hidden inside old maintenance and fault logs.',
		},
		consequences: [
			{
				id: 'public-machine-refusal',
				label: 'The Angel enters public service with command history and challenge before execution.',
				worldFlags: ['orbital-lift:angel-refusal-public'],
				serviceUpgrades: [{ locationId: 'orbital-lift:station', serviceId: 'signal-lab', level: 1 }],
				npcRelocations: [{ npcId: 'elevator-angel', locationId: 'orbital-lift:station' }],
			},
		],
		repeatPolicy: 'once',
	},
	{
		id: 'orbital-lift:contract-counterweight-commons',
		title: 'Counterweight Commons',
		districtId: 'orbital-lift',
		kind: 'contract',
		giverNpcId: 'brother-ballast',
		description:
			'Publish load, worker strain, passenger need, delay, and refusal before the next counterweight shift.',
		theme: 'Essential work remains coercive when endurance is treated as consent.',
		entryStepId: 'publish-the-weight-window',
		steps: [
			{
				id: 'publish-the-weight-window',
				placard: 'ESSENTIAL IS NOT A SYNONYM FOR UNABLE TO REFUSE.',
				summary: 'Complete four witnessed load windows and train replacement porters.',
				objectives: [
					{
						id: 'witnessed-load-windows',
						label: 'Complete witnessed load windows',
						target: 4,
						locationId: 'orbital-lift:route',
						resolutionTags: ['repair', 'timing', 'social'],
					},
				],
			},
		],
		approaches: {
			repair: 'Balance counterweights against actual load and human strain.',
			social: 'Publish refusal windows and train replacement crews.',
			exploration: 'Recover manual balance marks hidden under automated claims.',
		},
		consequences: [],
		repeatPolicy: 'after-travel',
	},
];
