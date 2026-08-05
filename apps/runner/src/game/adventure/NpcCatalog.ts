import type { DistrictStoryPhase } from './AdventureState';
import {
	ANTENNA_BARRENS_CONVERSATIONS,
	ANTENNA_BARRENS_NPCS,
} from './AntennaBarrensNpcContent';
import {
	ASTEROID_REDOUBT_CONVERSATIONS,
	ASTEROID_REDOUBT_NPCS,
} from './AsteroidRedoubtNpcContent';
import {
	ORBITAL_LIFT_CONVERSATIONS,
	ORBITAL_LIFT_NPCS,
} from './OrbitalLiftNpcContent';
import {
	ALGORITHMIC_CIVIC_CONVERSATIONS,
	ALGORITHMIC_CIVIC_NPCS,
} from './AlgorithmicCivicContent';

export type NpcRole =
	| 'companion'
	| 'merchant'
	| 'mentor'
	| 'organizer'
	| 'technician'
	| 'investigator'
	| 'medic'
	| 'courier'
	| 'broadcaster'
	| 'artist'
	| 'antagonist'
	| 'witness';

export type NpcServiceId =
	| 'repair-bench'
	| 'field-shop'
	| 'clinic'
	| 'skill-mentor'
	| 'rumor-board'
	| 'legal-aid'
	| 'transit-control'
	| 'archive'
	| 'signal-lab'
	| 'greenhouse'
	| 'loadout-locker';

export interface NpcDef {
	id: string;
	name: string;
	alias?: string;
	pronouns: string;
	homeLocationId: string;
	roles: NpcRole[];
	services: NpcServiceId[];
	visualHook: string;
	voice: string;
	contradiction: string;
	longArc: string;
}

export interface NpcConversationDef {
	id: string;
	npcId: string;
	locationId: string;
	priority: number;
	phase?: DistrictStoryPhase;
	requiresWorldFlags?: string[];
	forbidsWorldFlags?: string[];
	repeatable?: boolean;
	trustDelta?: number;
	recordFlag?: string;
	startsQuestId?: string;
	startsQuestStepId?: string;
	speakerLine: string;
	mossLine?: string;
	followupLine?: string;
}

export const NPC_CATALOG: NpcDef[] = [
	{
		id: 'auntie-subharmonic',
		name: 'Auntie Subharmonic',
		alias: 'The Low-Frequency Mechanic',
		pronouns: 'she/her',
		homeLocationId: 'lower-sprawl:safehouse',
		roles: ['mentor', 'technician', 'organizer', 'companion'],
		services: ['repair-bench', 'loadout-locker', 'skill-mentor', 'transit-control'],
		visualHook:
			'Weathered transit coat over a violet work suit, tuning fork earrings, portable dub console built from fare-gate parts.',
		voice:
			'Warm contralto, patient until somebody mistakes patience for permission. Speaks in musical engineering metaphors without becoming mystical.',
		contradiction:
			'She believes infrastructure must belong to everyone, yet she has hoarded the dangerous knowledge needed to wake the old line.',
		longArc:
			'Former night-line signal engineer who helped bury the municipal network when Vane privatized it. She becomes the moral engineer of the coalition, then must accept that a commons cannot be conducted by one trusted elder forever.',
	},
	{
		id: 'murr-murrby',
		name: 'Murr Murrby',
		alias: 'Emergency Retail',
		pronouns: 'he/him',
		homeLocationId: 'lower-sprawl:settlement',
		roles: ['merchant', 'witness'],
		services: ['field-shop', 'rumor-board'],
		visualHook:
			'Long raincoat lined with fold-out shelves, gold tooth shaped like a tiny receipt printer, umbrella antenna tuned to police bands.',
		voice:
			'Fast, dry, affectionate hustle. Every joke is a price tag he tears in half before the punchline lands.',
		contradiction:
			'He profits from emergency while quietly keeping half the district alive on impossible credit.',
		longArc:
			'His portable stall follows Moss from roofs to customs scanners. The player can help him become a cooperative quartermaster or watch him become the rebellion’s most charming monopolist.',
	},
	{
		id: 'lio-vale',
		name: 'Lio Vale',
		alias: 'The Courier Who Knows Every Locked Door',
		pronouns: 'he/they',
		homeLocationId: 'lower-sprawl:settlement',
		roles: ['courier', 'companion', 'witness'],
		services: [],
		visualHook:
			'Slim courier jacket patched with route maps, one corporate shoe and one street boot, always carrying somebody else’s sealed future.',
		voice:
			'Quiet, precise, noir fatalism interrupted by sudden tenderness. Never says “I am afraid”; describes the architecture around the fear.',
		contradiction:
			'He wants to save his family from the debt system and keeps serving the system because it has itemized exactly whom it will punish.',
		longArc:
			'Warns Moss, collaborates, betrays Moss under coercion, then returns in an orbital customs uniform. His arc asks whether confession without repair is merely another luxury.',
	},
	{
		id: 'sister-version',
		name: 'Sister Version',
		alias: 'Pirate of the Second Draft',
		pronouns: 'she/they',
		homeLocationId: 'lower-sprawl:station',
		roles: ['broadcaster', 'technician', 'artist'],
		services: ['signal-lab', 'archive'],
		visualHook:
			'Chrome headwrap, cassette-bandolier, coat painted with overwritten corporate slogans, broadcast mask hanging at her throat.',
		voice:
			'Incisive radio cadence with playful rewinds. Corrects herself in public because revision is part of the politics.',
		contradiction:
			'She believes every secret should become a public tool, but public exposure can destroy vulnerable people faster than institutions.',
		longArc:
			'Her transmissions make the subway speak, guide the orbital expedition, and shape the final broadcast doctrine: publish evidence, publish tools, or abolish the lock entirely.',
	},
	{
		id: 'conductor-oona-bell',
		name: 'Oona “One-Note” Bell',
		alias: 'Last Conductor of the Blue Mercy',
		pronouns: 'she/her',
		homeLocationId: 'lower-sprawl:station',
		roles: ['witness', 'mentor', 'organizer'],
		services: ['transit-control', 'rumor-board'],
		visualHook:
			'Old conductor cap, immaculate gloves, cane made from a brake handle, carries a muted pocket trumpet for departures no timetable admits.',
		voice:
			'Sparse and exact. Noir one-liners delivered like station announcements to an empty platform.',
		contradiction:
			'She kept ghost trains running for people the system erased, but chose who could board and still remembers every person she left behind.',
		longArc:
			'Her hidden timetables reveal that the subway was designed as a civic nervous system before it became a pricing engine. She trains a new rotating conductor council.',
	},
	{
		id: 'ossie-blue',
		name: 'Ossie Blue',
		alias: 'Fare Crimes, Retired',
		pronouns: 'he/him',
		homeLocationId: 'lower-sprawl:settlement',
		roles: ['investigator', 'witness'],
		services: ['rumor-board'],
		visualHook:
			'Broad-shouldered rain suit, battered fedora with a camera jammer in the brim, saxophone case full of confiscated warrants.',
		voice:
			'Hard-boiled understatement. Talks like he is dictating a case file to a city that may finally testify.',
		contradiction:
			'He once enforced fare debt because he believed procedure could restrain cruelty. Procedure merely taught cruelty to alphabetize.',
		longArc:
			'Builds a public case against the Ledger using evidence gathered across districts. He can become accountable investigator or nostalgic cop, depending on whether Moss centers victims or spectacle.',
	},
	{
		id: 'mercy-quill',
		name: 'Mercy Quill',
		alias: 'Counsel for the Uncounted',
		pronouns: 'they/them',
		homeLocationId: 'lower-sprawl:settlement',
		roles: ['organizer', 'artist', 'witness'],
		services: ['legal-aid', 'archive'],
		visualHook:
			'Ink-black suit under a paint-splashed overcoat, legal pads folded into throwing fans, silver loc cuffs etched with case numbers.',
		voice:
			'Controlled courtroom rhythm with flashes of battle-rap precision. Refuses the false comfort of neutral wording.',
		contradiction:
			'They turn private suffering into public cases, always risking that the case will consume the person.',
		longArc:
			'Creates the Mural of Routes, a living legal and visual history that becomes the coalition’s constitutional argument against Director Vane.',
	},
	{
		id: 'dr-calyx-reed',
		name: 'Dr. Calyx Reed',
		alias: 'Night Clinic Botanist',
		pronouns: 'she/her',
		homeLocationId: 'drainmarket:safehouse',
		roles: ['medic', 'organizer'],
		services: ['clinic', 'greenhouse'],
		visualHook:
			'Green surgical apron, brass respirator at the hip, medicinal moss growing in transparent shoulder capsules.',
		voice:
			'Gentle diagnostic clarity, never sentimental about pain and never cynical about recovery.',
		contradiction:
			'She triages ruthlessly to keep the clinic alive and fears that every principled refusal is paid for by a patient she cannot treat.',
		longArc:
			'Links Drainmarket mutual aid to Dub Colony agriculture. Her clinic becomes the first service mirrored between city and space.',
	},
	{
		id: 'big-esther-static',
		name: 'Big Esther Static',
		alias: 'Platform Steward',
		pronouns: 'she/her',
		homeLocationId: 'lower-sprawl:station',
		roles: ['organizer', 'witness'],
		services: ['transit-control'],
		visualHook:
			'Heavy quilted station vest, luminous boxing wraps, portable tea urn mounted where a riot shield used to be.',
		voice:
			'Big laugh, direct questions, zero romance about rebellion. Treats logistics as a form of love with deadlines.',
		contradiction:
			'She protects the platform so fiercely that protection can become another gate.',
		longArc:
			'Turns station defense into public stewardship and later challenges King Feedback’s emergency centralization with practical evidence from the city.',
	},
	{
		id: 'switchman-zed',
		name: 'Switchman Zed',
		alias: 'Nine Lives on Track Nine',
		pronouns: 'he/him',
		homeLocationId: 'lower-sprawl:station',
		roles: ['technician', 'witness'],
		services: ['transit-control', 'repair-bench'],
		visualHook:
			'Catlike maintenance android in a pinstripe vest, porcelain face repaired with copper staples, tail doubles as a track tester.',
		voice:
			'Deadpan machine literalism with suspiciously excellent comic timing.',
		contradiction:
			'Claims to be only a maintenance process while quietly making moral choices about which trains receive power.',
		longArc:
			'Becomes the first machine asked to testify against the orders it executed, foreshadowing the Elevator Angel’s question of responsibility.',
	},
	{
		id: 'rook-null',
		name: 'Rook Null',
		alias: 'Cartographer of Missing Floors',
		pronouns: 'they/them',
		homeLocationId: 'chrome-arcology:safehouse',
		roles: ['companion', 'technician', 'investigator'],
		services: ['signal-lab', 'archive'],
		visualHook:
			'Angular coat printed with impossible building sections, monocle projector that reveals deleted corridors.',
		voice:
			'Analytical, dry, unexpectedly poetic when describing omissions. Distrusts metaphors until a map lies.',
		contradiction:
			'They expose invisible systems but can treat people as nodes in a cleaner proof.',
		longArc:
			'Connects building maps, debt ledgers, antenna shards, and Skylock command paths into the final public manual.',
	},
	{
		id: 'mara-modulo',
		name: 'Mara Modulo',
		alias: 'The Secret That Refused to Stay Useful',
		pronouns: 'she/her',
		homeLocationId: 'antenna-barrens:settlement',
		roles: ['technician', 'mentor', 'antagonist'],
		services: ['signal-lab', 'skill-mentor'],
		visualHook:
			'Insulated white braids, patchwork Faraday cape, fingers marked with binary tattoo bands that never quite repeat.',
		voice:
			'Precise, teasing, intellectually combative. Answers bad questions by improving their threat model.',
		contradiction:
			'She protects people through secrecy even after secrecy becomes the private property of experts.',
		longArc:
			'Rival and mentor in the Antenna Barrens. She forces Sister Version and Rook to distinguish public knowledge from reckless exposure.',
	},
	{
		id: 'naya-root',
		name: 'Naya Root',
		alias: 'Shield Gardener',
		pronouns: 'she/her',
		homeLocationId: 'dub-colony:settlement',
		roles: ['companion', 'organizer', 'technician'],
		services: ['greenhouse', 'skill-mentor'],
		visualHook:
			'Greenhouse armor grown around a bass speaker core, seed-vial braids, translucent shield patterned like leaf veins.',
		voice:
			'Grounded, rhythmic, amused by heroic posing. Talks about defense as creating time for other people to act.',
		contradiction:
			'She protects fragile systems so well that she can become afraid to let them change.',
		longArc:
			'Links food, air, and transport politics. On returning to the city she turns abandoned platforms into greenhouse depots rather than military bunkers.',
	},
	{
		id: 'juno-jar',
		name: 'Juno Jar',
		alias: 'Vacuum Welder, Bad Influence',
		pronouns: 'they/she',
		homeLocationId: 'dub-colony:safehouse',
		roles: ['technician', 'artist', 'merchant'],
		services: ['repair-bench', 'field-shop'],
		visualHook:
			'Round welding helmet painted like a smiling moon, magnetic boots covered in stickers from stations that no longer officially exist.',
		voice:
			'Joyful technical profanity, improvisational jazz timing, cannot resist making a tool do one beautiful unnecessary thing.',
		contradiction:
			'They worship improvisation but leave maintenance debt for quieter people.',
		longArc:
			'Converts the Elevator Seed from corporate access key into a civic routing instrument and later builds the return train’s impossible coupler.',
	},
	{
		id: 'little-ix',
		name: 'Little Ix',
		alias: 'Map Kid of the Unfinished Line',
		pronouns: 'they/them',
		homeLocationId: 'asteroid-redoubt:settlement',
		roles: ['artist', 'witness'],
		services: ['archive'],
		visualHook:
			'Oversized station jacket, chalk-stained gloves, floating slate covered in routes drawn from rumors and dreams.',
		voice:
			'Blunt child logic. Asks the political question adults disguised as a technical limitation.',
		contradiction:
			'They believe every place belongs on the map and must learn that hiding can also protect a place.',
		longArc:
			'Draws the first map that includes the city, colony, asteroid, and return line as one public system rather than center and frontier.',
	},
	{
		id: 'king-feedback',
		name: 'King Feedback',
		alias: 'The Friendly Tyrant',
		pronouns: 'he/him',
		homeLocationId: 'dub-colony:stronghold',
		roles: ['antagonist', 'organizer', 'artist'],
		services: [],
		visualHook:
			'Royal sound-system armor assembled from community amplifiers, crown is a rotating emergency broadcast array.',
		voice:
			'Magnetic, funny, sincerely caring, dangerously certain. Makes authoritarianism sound like a favor he is tired of having to perform.',
		contradiction:
			'He built safety through collective sound, then concluded the collective needed one hand permanently on the master fader.',
		longArc:
			'Can be exiled, persuaded, or bound to council. Each outcome returns to the city as a different warning about emergency power.',
	},
	{
		id: 'black-ice-fox',
		name: 'The Black-Ice Fox',
		alias: 'Forecast Error in a Fur Coat',
		pronouns: 'they/it',
		homeLocationId: 'antenna-barrens:stronghold',
		roles: ['antagonist', 'technician', 'witness'],
		services: [],
		visualHook:
			'Crystalline code tails, old transit-prediction uniform rendered as a shifting holographic coat.',
		voice:
			'Cool synthetic bebop: clipped phrases, unexpected syncopation, repeats a word only when changing its meaning.',
		contradiction:
			'It predicts coercion so accurately that it has begun to mistake prediction for consent.',
		longArc:
			'Revealed as a discarded model trained on subway movement, debt, and policing. Defeat can destroy it, free it, or make its forecasting publicly contestable.',
	},
	{
		id: 'director-vane',
		name: 'Director Vane',
		alias: 'Accountable Owner of Everything That Moves',
		pronouns: 'he/him',
		homeLocationId: 'asteroid-redoubt:stronghold',
		roles: ['antagonist'],
		services: [],
		visualHook:
			'Airless executive tailoring, weather-vane halo, gloves that project ownership diagrams over living spaces.',
		voice:
			'Measured investor calm. Never threatens; describes the harm as a market response for which he is professionally saddened.',
		contradiction:
			'Claims ownership creates accountability while designing every contract so accountability travels downward and ownership upward.',
		longArc:
			'Final opponent and author of Skylock. He does not want chaos defeated; he wants every possible future priced before anybody can choose it.',
	},
	{
		id: 'temple-gauge',
		name: 'Temple Gauge',
		alias: 'Flood Engineer of Unpopular Measurements',
		pronouns: 'he/him',
		homeLocationId: 'drainmarket:settlement',
		roles: ['technician', 'investigator', 'organizer'],
		services: ['transit-control', 'rumor-board'],
		visualHook:
			'Long oilskin coat ruled with hand-painted water marks, brass level at his belt, silver headphones listening to pump harmonics.',
		voice:
			'Low, deliberate, and percussive. Gives every number a moral footnote and every warning the timing of a bass drop.',
		contradiction:
			'He insists the flood obeys measurement while quietly adjusting public gauges to keep insurers from abandoning the district.',
		longArc:
			'Reveals that Pump Nine has been transmitting market movement to the Ledger through maintenance telemetry. He must choose between trusted falsification and publicly contestable measurement.',
	},
	{
		id: 'jane-dogear',
		name: 'Jane Dogear',
		alias: 'Bookseller to Debts That Claim They Cannot Read',
		pronouns: 'she/her',
		homeLocationId: 'drainmarket:settlement',
		roles: ['investigator', 'merchant', 'witness'],
		services: ['archive', 'legal-aid'],
		visualHook:
			'Pinstripe waders, amber reading glasses, waterproof books chained to a narrow barge, receipt rolls braided into her hair.',
		voice:
			'Fast literary side-eye, corner-store precision, never wastes a metaphor on somebody who has not paid attention.',
		contradiction:
			'She preserves every obligation because erased history protects creditors as often as it protects debtors.',
		longArc:
			'Builds a people’s archive of mutual promises and predatory contracts, later teaching Rook how a map and a ledger can preserve deliberate ambiguity.',
	},
	{
		id: 'bishop-fuse',
		name: 'Bishop Fuse',
		alias: 'Pastor of the Current Commons',
		pronouns: 'he/him',
		homeLocationId: 'drainmarket:settlement',
		roles: ['organizer', 'technician', 'mentor'],
		services: ['repair-bench', 'skill-mentor'],
		visualHook:
			'Purple electrician’s coveralls beneath a severe black coat, insulated rings, portable organ wired to a neighborhood battery bank.',
		voice:
			'Sermonic call-and-response cut with electrician profanity. Makes a fuse diagram sound like a congregation deciding whether to stay.',
		contradiction:
			'He preaches shared power but controls the only complete wiring map because he remembers the last time a map was sold.',
		longArc:
			'Organizes Drainmarket’s energy cooperative, clashes with Auntie over secret infrastructure, and later helps power the homecoming platform without creating another indispensable priesthood.',
	},
	{
		id: 'silk-suture',
		name: 'Silk Suture',
		alias: 'Courier of the Cold Chain',
		pronouns: 'they/them',
		homeLocationId: 'drainmarket:safehouse',
		roles: ['medic', 'courier', 'companion'],
		services: ['clinic'],
		visualHook:
			'White motorcycle coat patched with red thread, insulated satchel, mirrored visor scratched into a permanent skeptical eyebrow.',
		voice:
			'Quick, understated, and ruthlessly practical. Delivers jokes like contraband medicine: compact, necessary, and already late.',
		contradiction:
			'They protect patient privacy by carrying everything personally, becoming a single fragile route the clinic cannot afford to lose.',
		longArc:
			'Pushes Moss to turn the Floodline into a redundant medical network. Can become a field companion once the clinic no longer depends on heroic delivery.',
	},
	{
		id: 'odessa-stack',
		name: 'Odessa “O.D.” Stack',
		alias: 'Canteen Steward of the Missing Shift',
		pronouns: 'she/her',
		homeLocationId: 'chrome-arcology:safehouse',
		roles: ['organizer', 'witness', 'mentor'],
		services: ['rumor-board', 'skill-mentor'],
		visualHook:
			'Gold cafeteria jacket over steel-toe boots, drumsticks in one pocket, meal tokens braided into a heavy key ring.',
		voice:
			'Warm hard-bop authority. Counts beats, portions, and lies with the same immaculate timing.',
		contradiction:
			'She keeps workers alive by counting every meal while knowing that any complete count can become a management weapon.',
		longArc:
			'Turns the hidden canteen census into a consent-based labor assembly and later designs rotating provision shifts for the colony expedition.',
	},
	{
		id: 'brother-pallet',
		name: 'Brother Pallet',
		alias: 'Cargo Handler, Apparently Not a Person',
		pronouns: 'he/him',
		homeLocationId: 'chrome-arcology:safehouse',
		roles: ['organizer', 'technician', 'witness'],
		services: ['repair-bench', 'transit-control'],
		visualHook:
			'Broad freight exoskeleton under a Sunday-black coat, barcode halo scratched out by hand, union pins welded directly into his chassis.',
		voice:
			'Gentle basso with warehouse humor. Refuses every metaphor that compares a worker to machinery, despite being machinery.',
		contradiction:
			'He demands recognition as a person while hiding vulnerable human workers inside cargo categories that once erased him.',
		longArc:
			'Leads the first mixed human-machine freight local and later testifies that ownership manifests are not neutral descriptions of passengers.',
	},
	{
		id: 'velvet-decimal',
		name: 'Velvet Decimal',
		alias: 'Concierge of Improper Access',
		pronouns: 'she/they',
		homeLocationId: 'chrome-arcology:settlement',
		roles: ['merchant', 'investigator', 'artist'],
		services: ['field-shop', 'legal-aid', 'archive'],
		visualHook:
			'Purple concierge suit cut like a 1970s detective coat, mirrored nails displaying temporary access codes, velvet rope worn as a sash.',
		voice:
			'Luxury-service polish with Bronx cipher timing. Every courtesy contains a loophole and every loophole has excellent posture.',
		contradiction:
			'She subverts access hierarchy by selling exceptions, making herself a charming private gatekeeper to public space.',
		longArc:
			'Can turn the Service Atrium into a public appeals desk or become the coalition’s most stylish broker of scarce credentials.',
	},
	{
		id: 'tern-spoke',
		name: 'Tern Spoke',
		alias: 'Elevator Mechanic of Horizontal Opinions',
		pronouns: 'they/them',
		homeLocationId: 'chrome-arcology:station',
		roles: ['technician', 'mentor', 'witness'],
		services: ['repair-bench', 'transit-control', 'loadout-locker'],
		visualHook:
			'Long white maintenance braids, orange lift harness, grease-pencil transit diagrams drawn over an immaculate gray suit.',
		voice:
			'Dry engineering noir. Describes vertical injustice as a routing bug nobody with a penthouse wishes to reproduce.',
		contradiction:
			'They believe every lift should be public but still carry a private master override after surviving the last shaft purge.',
		longArc:
			'Teaches Juno Jar how the Elevator Seed fails safely and helps build the impossible coupler that turns the orbital return into subway service.',
	},
	{
		id: 'madame-vitrine',
		name: 'Madame Vitrine',
		alias: 'Vice President of Human Display',
		pronouns: 'she/her',
		homeLocationId: 'chrome-arcology:stronghold',
		roles: ['antagonist', 'merchant'],
		services: [],
		visualHook:
			'Chrome fox silhouette in immaculate ivory tailoring, glass gloves projecting employment contracts around anyone she addresses.',
		voice:
			'Silken executive noir. Makes coercion sound like premium membership and violence like an unfortunate onboarding dependency.',
		contradiction:
			'She sincerely believes visibility creates dignity while converting every visible person into a priced display surface.',
		longArc:
			'Offers Moss legal authority to repair mobility for approved clients. Her defeat asks whether seizing administrative power changes who administration serves.',
	},
	{
		id: 'sable-meridian',
		name: 'Sable Meridian',
		alias: 'Head of Unscheduled Hospitality',
		pronouns: 'she/her',
		homeLocationId: 'mirror-palace:safehouse',
		roles: ['organizer', 'witness', 'investigator'],
		services: ['rumor-board', 'legal-aid'],
		visualHook:
			'Black satin service jacket over magnetic work boots, silver tray etched with staff-only tram routes, one eye lined in banquet gold and the other in engine grease.',
		voice:
			'Film-noir calm with union-floor timing. Delivers every dangerous fact as if confirming a dinner reservation.',
		contradiction:
			'She protects invisible workers by mastering the etiquette that erases them, and risks making invisibility into a permanent survival requirement.',
		longArc:
			'Builds a servants’ council capable of interrupting luxury service, then must decide whether the council represents workers or merely negotiates better invisibility.',
	},
	{
		id: 'orchid-debt',
		name: 'Orchid Debt',
		alias: 'Singer of the Complimentary Obligation',
		pronouns: 'they/she',
		homeLocationId: 'mirror-palace:settlement',
		roles: ['artist', 'witness', 'broadcaster'],
		services: ['archive', 'rumor-board'],
		visualHook:
			'Burgundy lounge suit with a floating microphone halo, contract clauses embroidered as gold musical rests, shoes adapted for zero-gravity tap breaks.',
		voice:
			'Smoky torch-song phrasing folding into sharp battle-rap internal rhyme whenever somebody calls coercion a benefit.',
		contradiction:
			'They turn hidden labor testimony into unforgettable art while risking that suffering becomes premium atmosphere for the same guests who caused it.',
		longArc:
			'Creates the Table of Refusals archive and later composes the homecoming announcement from statements workers chose to make public.',
	},
	{
		id: 'portia-drift',
		name: 'Portia Drift',
		alias: 'Driver of the False-World Tram',
		pronouns: 'she/her',
		homeLocationId: 'mirror-palace:station',
		roles: ['technician', 'courier', 'organizer'],
		services: ['transit-control', 'repair-bench'],
		visualHook:
			'White tram uniform cut like a 1970s getaway suit, mirrored visor cracked exactly across the official route, conductor’s baton rebuilt as a brake key.',
		voice:
			'Fast Queens street logic under immaculate resort diction. Laughs once before every impossible maneuver.',
		contradiction:
			'She smuggles staff through a private tram but controls the only timetable capable of doing so safely.',
		longArc:
			'Can turn the False-World Tram into a public staff route and later teaches Blue Mercy crews how orbital delay behaves when the track itself moves.',
	},
	{
		id: 'mister-vellum',
		name: 'Mister Vellum',
		alias: 'Sommelier of Binding Terms',
		pronouns: 'he/him',
		homeLocationId: 'mirror-palace:settlement',
		roles: ['merchant', 'witness', 'antagonist'],
		services: ['field-shop', 'legal-aid'],
		visualHook:
			'Ivory dinner coat made from smart paper, wine key shaped like a signature stylus, cufflinks displaying the resale value of whoever is speaking.',
		voice:
			'Velvet baritone and perfect courtesy. Pairs every exploitation with an expensive metaphor and every apology with a renewal option.',
		contradiction:
			'He can explain exactly how every contract harms its signer and believes that clarity makes the transaction ethical.',
		longArc:
			'May become an expert witness against the Palace or the coalition’s most useful—and least trustworthy—interpreter of ownership language.',
	},
	{
		id: 'reflection-judge',
		name: 'The Reflection Judge',
		alias: 'Arbiter of Authenticated Selves',
		pronouns: 'it/they',
		homeLocationId: 'mirror-palace:stronghold',
		roles: ['antagonist', 'investigator', 'witness'],
		services: [],
		visualHook:
			'Tall mirrored judicial frame wearing a robe assembled from guest profiles, face rendering whoever currently has the most contractual authority in the room.',
		voice:
			'Legal noir spoken in sampled voices. Answers every moral claim by presenting the claimant’s most compromising prior choice.',
		contradiction:
			'It exposes hypocrisy accurately and concludes that only ownership can stabilize contradiction.',
		longArc:
			'Its defeat determines whether contradictory testimony becomes grounds for punishment, protected revision, or a public record that nobody may own.',
	},
	{
		id: 'bassie-knot',
		name: 'Bassie Knot',
		alias: 'Assembly Keeper of the Unfinished Beat',
		pronouns: 'she/her',
		homeLocationId: 'dub-colony:settlement',
		roles: ['organizer', 'artist', 'mentor'],
		services: ['rumor-board', 'skill-mentor', 'archive'],
		visualHook:
			'Midnight-blue speaker cloak tied with hundreds of differently colored vote cords, heavy gold headphones worn around one elbow like a shield.',
		voice:
			'Warm block-party authority. Leaves deliberate silence after difficult questions and refuses to let charisma count as consensus.',
		contradiction:
			'She protects the assembly from domination by controlling its rhythm, speaking order, and stopping rules.',
		longArc:
			'Designs rotating facilitation and carries colony disagreement procedures back to the city, where speed pressures tempt everyone to skip them.',
	},
	{
		id: 'old-quasar-jones',
		name: 'Old Quasar Jones',
		alias: 'Solar-Sail Switchman',
		pronouns: 'he/him',
		homeLocationId: 'dub-colony:station',
		roles: ['technician', 'witness', 'mentor'],
		services: ['transit-control', 'repair-bench'],
		visualHook:
			'Copper pressure suit under a long charcoal rail coat, beard threaded with solar-fabric scraps, pocket watch showing three incompatible station times.',
		voice:
			'Dry elder humor, bebop patience, exact engineering detail. Calls orbital mechanics “timetable weather.”',
		contradiction:
			'He distrusts emergency rulers but quietly keeps obsolete manual controls only he understands.',
		longArc:
			'Trains replacement switch crews, helps Juno build the return coupler, and decides whether to destroy or publish the dangerous manual overrides.',
	},
	{
		id: 'coco-loop',
		name: 'Coco Loop',
		alias: 'Greenhouse Train Courier',
		pronouns: 'they/them',
		homeLocationId: 'dub-colony:settlement',
		roles: ['courier', 'artist', 'witness'],
		services: ['greenhouse', 'rumor-board'],
		visualHook:
			'Oversized orange station vest, seed packets arranged like mixtapes, wheeled oxygen cart covered in hand-drawn route stickers.',
		voice:
			'Quick childlike cipher logic, never sentimental. Treats adults’ political euphemisms as technical bugs requiring immediate renaming.',
		contradiction:
			'They believe every useful route should stay open and must learn that some protected habitats survive by remaining absent from public maps.',
		longArc:
			'Becomes Little Ix’s first map collaborator and brings the colony’s greenhouse timetable into abandoned city platforms.',
	},
	{
		id: 'ames-oxygen',
		name: 'Ames Oxygen',
		alias: 'Clerk of Breathable Exceptions',
		pronouns: 'he/they',
		homeLocationId: 'dub-colony:settlement',
		roles: ['technician', 'witness', 'antagonist'],
		services: ['archive', 'legal-aid'],
		visualHook:
			'Gray pressure vest with a red emergency sash, abacus respirator counting liters and promises, ink-stained gloves from signing temporary air allocations.',
		voice:
			'Exhausted bureaucratic precision with deadpan humor. Every sentence sounds like a form trying to become a confession.',
		contradiction:
			'He keeps people alive by allocating scarce air and has begun to confuse being necessary with having the right to decide alone.',
		longArc:
			'Can help turn oxygen allocation into a contestable public forecast or become the administrative spine of a softer permanent emergency.',
	},
	{
		id: 'marlo-turnstile',
		name: 'Marlo Turnstile',
		alias: 'Dispatcher of the Unsent Order',
		pronouns: 'he/him',
		homeLocationId: 'lower-sprawl:station',
		roles: ['technician', 'investigator', 'organizer', 'witness'],
		services: ['transit-control', 'archive'],
		visualHook:
			'Old patrol dispatch jacket with every rank patch removed, portable radio rebuilt into a public source ledger, subway token braided into one gray loc.',
		voice:
			'Low, careful dispatcher cadence. Repeats source, confidence, scope, and expiry before making any claim, then ruins the solemnity with bone-dry platform humor.',
		contradiction:
			'He knows exactly how local reports became coordinated violence because he made the routing legible enough to work.',
		longArc:
			'Refuses disappearance after the patrol cells dissolve. He apprentices under Oona, publishes the provenance of every local alert, trains rotating dispatch crews, and must learn that accountability does not make him permanently indispensable.',
	},
	{
		id: 'vera-counterweight',
		name: 'Vera Counterweight',
		alias: 'Alarm Fitter, Return-Line Mechanic',
		pronouns: 'she/they',
		homeLocationId: 'dub-colony:station',
		roles: ['technician', 'courier', 'witness'],
		services: ['repair-bench', 'transit-control'],
		visualHook:
			'Vacuum-orange work coat over a black rail suit, alarm lenses carried in padded seed tins, torque wrench painted with tiny arrows pointing both ways.',
		voice:
			'Exact mechanical language with sly workshop jokes. Calls every irreversible design decision “a confession with screws.”',
		contradiction:
			'She designed nonlethal alarm hardware to reduce casualties and thereby made coercive infrastructure cheaper to expand.',
		longArc:
			'Begins on Chorus Rail separating safety sensors from enforcement relays, rides the Lift home, and becomes one of several public maintainers who can repair alarms without owning the authority to arm them.',
	},
	...ANTENNA_BARRENS_NPCS,
	...ORBITAL_LIFT_NPCS,
	...ASTEROID_REDOUBT_NPCS,
	...ALGORITHMIC_CIVIC_NPCS,
];

export const NPC_CONVERSATIONS: NpcConversationDef[] = [
	{
		id: 'auntie:first-low-note',
		npcId: 'auntie-subharmonic',
		locationId: 'lower-sprawl:safehouse',
		priority: 100,
		phase: 'contested',
		trustDelta: 2,
		recordFlag: 'heard-first-low-note',
		startsQuestId: 'lower-sprawl:main-song-of-the-toll',
		startsQuestStepId: 'listen-to-the-relay',
		speakerLine:
			'The city still has a heartbeat, Moss. Vane just put a meter on it and called the ticking prosperity.',
		mossLine: 'Then we stop paying attention to the meter.',
		followupLine:
			'No. We learn what it powers, who it starves, and which wire to cut without blacking out the clinic.',
	},
	{
		id: 'auntie:after-grin',
		npcId: 'auntie-subharmonic',
		locationId: 'lower-sprawl:safehouse',
		priority: 120,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'auntie-accepts-shared-switch',
		speakerLine:
			'Captain Grin is gone. That only means the gate has stopped smiling while it steals. Now comes the difficult part: deciding who gets a key.',
		mossLine: 'Everybody.',
		followupLine: 'Good slogan. Tomorrow we test it against a broken brake, three grudges, and rush hour.',
	},
	{
		id: 'murr:survival-retail',
		npcId: 'murr-murrby',
		locationId: 'lower-sprawl:settlement',
		priority: 80,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'murr-opened-ledger',
		speakerLine:
			'Welcome to survival retail. Prices are immoral, inventory is nervous, and credit is available to anyone willing to outlive me.',
		mossLine: 'You make disaster sound franchised.',
		followupLine: 'Kid, disaster was franchised before I got the umbrella.',
	},
	{
		id: 'lio:architecture-of-fear',
		npcId: 'lio-vale',
		locationId: 'lower-sprawl:settlement',
		priority: 90,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'lio-warning-heard',
		speakerLine:
			'You break the toll office, they do not punish the office. They punish the addresses attached to your name.',
		mossLine: 'That is why nobody moves alone.',
		followupLine:
			'The cameras count bodies. They do not count promises. Bring me something the cameras cannot invoice.',
	},
	{
		id: 'one-note:ghost-timetable',
		npcId: 'conductor-oona-bell',
		locationId: 'lower-sprawl:station',
		priority: 100,
		phase: 'contested',
		trustDelta: 2,
		recordFlag: 'ghost-timetable-offered',
		startsQuestId: 'lower-sprawl:side-last-fare-home',
		startsQuestStepId: 'find-the-three-missing-stops',
		speakerLine:
			'The official map says this platform died nine years ago. The official map never came to the funeral.',
		mossLine: 'You kept a train running.',
		followupLine:
			'I kept a promise moving. Find the three stops they deleted and I will show you where the promise sleeps.',
	},
	{
		id: 'ossie:case-without-city',
		npcId: 'ossie-blue',
		locationId: 'lower-sprawl:settlement',
		priority: 70,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'ossie-case-opened',
		startsQuestId: 'lower-sprawl:side-no-receipt-for-grief',
		startsQuestStepId: 'collect-eviction-warrants',
		speakerLine:
			'I got six eviction warrants signed by a printer that does not legally exist. That makes it either a ghost or management.',
		mossLine: 'Which do you investigate first?',
		followupLine: 'Management. Ghosts have the decency to admit they are dead.',
	},
	{
		id: 'mercy:mural-is-evidence',
		npcId: 'mercy-quill',
		locationId: 'lower-sprawl:settlement',
		priority: 60,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'mural-of-routes-begun',
		speakerLine:
			'A contract hides violence in paragraphs. A mural has to commit the violence in public. Help me paint the route they keep calling an accident.',
		mossLine: 'Paint can be surveilled.',
		followupLine: 'So can silence. At least paint chooses a color.',
	},
	{
		id: 'esther:platform-rule',
		npcId: 'big-esther-static',
		locationId: 'lower-sprawl:station',
		priority: 65,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'platform-steward-met',
		speakerLine:
			'Rule one: nobody gets abandoned on my platform. Rule two: if rule one makes you important, sit down until the feeling passes.',
		mossLine: 'What is rule three?',
		followupLine: 'Tea is not a tactical resource until I say it is.',
	},
	{
		id: 'zed:maintenance-is-moral',
		npcId: 'switchman-zed',
		locationId: 'lower-sprawl:station',
		priority: 55,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'zed-testimony-seeded',
		speakerLine:
			'I am not authorized to distinguish a stranded passenger from an unprofitable delay. I have nevertheless developed a persistent software defect.',
		mossLine: 'A conscience?',
		followupLine: 'Please do not report the bug. It has excellent uptime.',
	},
	{
		id: 'sister:first-pirate-signal',
		npcId: 'sister-version',
		locationId: 'lower-sprawl:station',
		priority: 130,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'dub-colony-signal-heard',
		speakerLine:
			'Attention, unauthorized passengers: a moving colony has been singing into a corporate dead channel. The song contains coordinates and one very polite warning.',
		mossLine: 'What warning?',
		followupLine: 'Do not bring them a savior. Bring spare parts and the capacity to lose an argument.',
	},
	{
		id: 'one-note:commons-departure',
		npcId: 'conductor-oona-bell',
		locationId: 'lower-sprawl:station',
		priority: 110,
		phase: 'transformed',
		trustDelta: 1,
		recordFlag: 'blue-mercy-public-service',
		speakerLine:
			'First public departure in nine years. No first class. No last class. Just people late for lives the timetable pretended were cancelled.',
	},
	{
		id: 'calyx:knife-weather',
		npcId: 'dr-calyx-reed',
		locationId: 'drainmarket:safehouse',
		priority: 120,
		phase: 'contested',
		trustDelta: 2,
		recordFlag: 'calyx-explained-cold-chain',
		startsQuestId: 'drainmarket:main-knife-weather',
		startsQuestStepId: 'keep-the-cold-chain',
		speakerLine:
			'The drones are not stealing medicine, Moss. They are enforcing a theory that sick people are risky inventory.',
		mossLine: 'I can break the theory’s legs.',
		followupLine:
			'After you learn which leg carries insulin. Heroism is contraindicated until we finish triage.',
	},
	{
		id: 'silk:one-fragile-route',
		npcId: 'silk-suture',
		locationId: 'drainmarket:safehouse',
		priority: 105,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'silk-requested-camera-free-route',
		startsQuestId: 'drainmarket:side-clinic-without-cameras',
		startsQuestStepId: 'mark-the-blind-corners',
		speakerLine:
			'Every safe delivery uses me, one bike, and the same seven blind corners. That is not a network. That is a eulogy with good tires.',
		mossLine: 'We make more blind corners.',
		followupLine: 'We make more couriers. Privacy should not require a stunt professional.',
	},
	{
		id: 'temple:pump-nine-listens',
		npcId: 'temple-gauge',
		locationId: 'drainmarket:settlement',
		priority: 110,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'pump-nine-suspicion-opened',
		startsQuestId: 'drainmarket:side-pump-nine-listens',
		startsQuestStepId: 'hear-the-second-waterline',
		speakerLine:
			'Pump Nine reports water pressure every six seconds. Funny thing: it reports footsteps in between.',
		mossLine: 'A pump with ears.',
		followupLine: 'A landlord with plumbing. Machines rarely invent the invasive part.',
	},
	{
		id: 'jane:promises-and-invoices',
		npcId: 'jane-dogear',
		locationId: 'drainmarket:settlement',
		priority: 95,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'jane-opened-obligation-archive',
		speakerLine:
			'This shelf is promises. That shelf is invoices dressed like promises. The drones shelve them together because sorting would reduce revenue.',
		mossLine: 'How do you tell the difference?',
		followupLine: 'Ask who may renegotiate. A promise has people in it. An invoice has an exit wound.',
	},
	{
		id: 'bishop:current-is-a-verb',
		npcId: 'bishop-fuse',
		locationId: 'drainmarket:settlement',
		priority: 85,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'current-commons-met',
		startsQuestId: 'drainmarket:contract-cold-chain-blues',
		startsQuestStepId: 'carry-the-cold-note',
		speakerLine:
			'Power is not a thing we own. Current is a verb. The trouble starts when one man conjugates it for everybody.',
		mossLine: 'You have the only complete wiring map.',
		followupLine: 'Yes. Sermons improve when the congregation interrupts on time.',
	},
	{
		id: 'calyx:open-vein',
		npcId: 'dr-calyx-reed',
		locationId: 'drainmarket:station',
		priority: 130,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'calyx-accepted-open-vein',
		speakerLine:
			'The first train arrived late, wet, and carrying exactly what we requested. I distrust miracles. This looks like maintenance.',
		mossLine: 'You sound disappointed.',
		followupLine: 'Relieved. Miracles do not publish shift schedules.',
	},
	{
		id: 'temple:public-gauge',
		npcId: 'temple-gauge',
		locationId: 'drainmarket:station',
		priority: 115,
		phase: 'transformed',
		trustDelta: 1,
		recordFlag: 'pump-weather-public',
		speakerLine:
			'Gauge is public now. Raw reading, confidence, who calibrated it, and who objected. Turns out uncertainty behaves better when it has witnesses.',
	},
	{
		id: 'rook:first-missing-floor',
		npcId: 'rook-null',
		locationId: 'chrome-arcology:safehouse',
		priority: 130,
		phase: 'contested',
		trustDelta: 2,
		recordFlag: 'rook-shared-negative-map',
		startsQuestId: 'chrome-arcology:main-elevator-seed',
		startsQuestStepId: 'audit-the-missing-floors',
		speakerLine:
			'The building has eighty-four floors, ninety-one elevator stops, and six thousand workers whose addresses resolve to a maintenance error.',
		mossLine: 'You mapped the error.',
		followupLine: 'I mapped the shape around it. A person is not proven merely because the wall forgot to lie convincingly.',
	},
	{
		id: 'odessa:meal-count',
		npcId: 'odessa-stack',
		locationId: 'chrome-arcology:safehouse',
		priority: 115,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'odessa-opened-missing-shift',
		startsQuestId: 'chrome-arcology:contract-lunch-break-in-vertical-time',
		startsQuestStepId: 'synchronize-the-breaks',
		speakerLine:
			'Management says no third shift exists. The soup says otherwise. Soup has fewer incentives to falsify headcount.',
		mossLine: 'How many bowls?',
		followupLine: 'Enough to organize. Too many to publish without asking.',
	},
	{
		id: 'pallet:person-not-package',
		npcId: 'brother-pallet',
		locationId: 'chrome-arcology:safehouse',
		priority: 105,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'pallet-rejected-cargo-personhood',
		startsQuestId: 'chrome-arcology:side-person-without-floor',
		startsQuestStepId: 'find-the-negative-addresses',
		speakerLine:
			'The manifest calls me handling equipment. Calls the prisoners temperature-sensitive freight. Grammar is doing armed work today.',
		mossLine: 'We rewrite the manifest.',
		followupLine: 'After we ask the freight what names it wants the guards to know.',
	},
	{
		id: 'velvet:premium-ground',
		npcId: 'velvet-decimal',
		locationId: 'chrome-arcology:settlement',
		priority: 90,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'velvet-opened-improper-access',
		speakerLine:
			'Welcome to the Service Atrium, where the floor is public, the doors are private, and standing still may incur a hospitality fee.',
		mossLine: 'You sell access?',
		followupLine: 'I sell the embarrassing fact that access was always negotiable.',
	},
	{
		id: 'lio:licensed-troubleshooter',
		npcId: 'lio-vale',
		locationId: 'chrome-arcology:settlement',
		priority: 120,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'lio-showed-family-clause',
		startsQuestId: 'chrome-arcology:companion-legitimate-troubleshooter',
		startsQuestStepId: 'read-the-family-clause',
		speakerLine:
			'Vitrine offered me a clean uniform, protected addresses, and a job escorting the people who dirty the uniform by existing.',
		mossLine: 'That is not protection.',
		followupLine: 'No. It is architecture shaped like my family.',
	},
	{
		id: 'tern:vertical-neighborhood',
		npcId: 'tern-spoke',
		locationId: 'chrome-arcology:station',
		priority: 100,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'tern-explained-vertical-line',
		speakerLine:
			'An elevator is a subway with one dimension bullied out of the conversation.',
		mossLine: 'And the penthouse?',
		followupLine: 'An express stop that purchased the right to call every local platform a shaft.',
	},
	{
		id: 'vitrine:legitimate-offer',
		npcId: 'madame-vitrine',
		locationId: 'chrome-arcology:settlement',
		priority: 140,
		phase: 'contested',
		trustDelta: -1,
		recordFlag: 'vitrine-offered-license',
		speakerLine:
			'Moss, you have demonstrated premium disruption capability. I can make your trespass retroactively visionary.',
		mossLine: 'And the workers?',
		followupLine: 'Included in the vision wherever inclusion remains operationally elegant.',
	},
	{
		id: 'rook:seed-is-a-constitution',
		npcId: 'rook-null',
		locationId: 'chrome-arcology:station',
		priority: 150,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'rook-reframed-elevator-seed',
		speakerLine:
			'The Seed is not a key. It is a constitution written as routing defaults, failure policy, and who may interrupt an ascent.',
		mossLine: 'Can it reach orbit?',
		followupLine: 'Yes. The difficult question is whether orbit becomes another penthouse or another stop.',
	},
	{
		id: 'odessa:public-shift',
		npcId: 'odessa-stack',
		locationId: 'chrome-arcology:safehouse',
		priority: 120,
		phase: 'transformed',
		trustDelta: 1,
		recordFlag: 'odessa-published-consent-roster',
		speakerLine:
			'New shift board lists the work, the risk, who volunteered, and who may remove their name. Management calls it inefficient.',
		mossLine: 'Is it?',
		followupLine: 'Gloriously. Efficiency had been eating lunch alone.',
	},
	{
		id: 'sable:first-service-map',
		npcId: 'sable-meridian',
		locationId: 'mirror-palace:safehouse',
		priority: 140,
		phase: 'contested',
		trustDelta: 2,
		recordFlag: 'sable-shared-service-map',
		startsQuestId: 'mirror-palace:main-banquet-of-air',
		startsQuestStepId: 'enter-through-the-work',
		speakerLine:
			'The Palace map has guest routes, art routes, champagne routes, and one regrettable category called staff presence. We use the regret as a door.',
		mossLine: 'Where does the subway fit?',
		followupLine: 'Under the performance. Same as the workers. The useful things are always asked to enter from backstage.',
	},
	{
		id: 'orchid:refusal-is-not-content',
		npcId: 'orchid-debt',
		locationId: 'mirror-palace:settlement',
		priority: 120,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'orchid-opened-refusal-table',
		startsQuestId: 'mirror-palace:side-table-of-refusals',
		startsQuestStepId: 'collect-chosen-refusals',
		speakerLine:
			'Guests applaud the song about unpaid gravity. They think applause converts theft into cultural literacy.',
		mossLine: 'Stop singing it for them.',
		followupLine: 'Or change who owns the room after the last note. Silence is not automatically ours either.',
	},
	{
		id: 'vellum:contract-pairing',
		npcId: 'mister-vellum',
		locationId: 'mirror-palace:settlement',
		priority: 110,
		phase: 'contested',
		trustDelta: -1,
		recordFlag: 'vellum-offered-clarity',
		speakerLine:
			'Tonight’s air lease pairs beautifully with inherited liability. Notes of cedar, vacuum, and a dependent who cannot afford your principles.',
		mossLine: 'You know it is poison.',
		followupLine: 'I know its composition. Morality is not among my licensed tasting disciplines.',
	},
	{
		id: 'portia:false-world-local',
		npcId: 'portia-drift',
		locationId: 'mirror-palace:station',
		priority: 125,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'portia-showed-staff-local',
		startsQuestId: 'mirror-palace:contract-unlicensed-gravity',
		startsQuestStepId: 'recover-the-local-stops',
		speakerLine:
			'The guest tram makes one elegant circle. The staff local makes eleven ugly stops and arrives everywhere important.',
		mossLine: 'Why hide the useful route?',
		followupLine: 'Because usefulness is labor, and luxury cannot admit it has a transfer station.',
	},
	{
		id: 'lio:repair-is-a-route',
		npcId: 'lio-vale',
		locationId: 'mirror-palace:safehouse',
		priority: 150,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'lio-requested-repair-route',
		startsQuestId: 'mirror-palace:companion-betrayal-with-transfer',
		startsQuestStepId: 'trace-the-coercion-chain',
		speakerLine:
			'I closed three doors. One saved my family. Two delivered workers to the Judge. The contract wants those facts to cancel each other.',
		mossLine: 'They do not.',
		followupLine: 'Good. Then give me work heavier than confession.',
	},
	{
		id: 'judge:authenticated-contradiction',
		npcId: 'reflection-judge',
		locationId: 'mirror-palace:settlement',
		priority: 160,
		phase: 'contested',
		trustDelta: -2,
		recordFlag: 'judge-rendered-moss-profile',
		speakerLine:
			'You condemn ownership while carrying keys, companions, weapons, and the authority to decide which testimony becomes consequence.',
		mossLine: 'Contradiction is not your property.',
		followupLine: 'Unowned contradiction is merely litigation without customer support.',
	},
	{
		id: 'bassie:unfinished-beat',
		npcId: 'bassie-knot',
		locationId: 'dub-colony:settlement',
		priority: 140,
		phase: 'contested',
		trustDelta: 2,
		recordFlag: 'bassie-opened-assembly',
		startsQuestId: 'dub-colony:main-master-fader',
		startsQuestStepId: 'hear-the-emergency-history',
		speakerLine:
			'King Feedback saved us four times. Fifth time he saved the emergency from ending.',
		mossLine: 'You want me to remove him?',
		followupLine: 'I want the colony to survive being asked what comes after gratitude.',
	},
	{
		id: 'naya:air-needs-time',
		npcId: 'naya-root',
		locationId: 'dub-colony:settlement',
		priority: 130,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'naya-linked-shield-and-air',
		startsQuestId: 'dub-colony:side-air-is-not-a-favor',
		startsQuestStepId: 'publish-the-breathing-window',
		speakerLine:
			'A shield does not solve danger. It creates twelve seconds in which nobody else has to obey the fastest person in the room.',
		mossLine: 'And the oxygen clerk?',
		followupLine: 'He thinks scarcity appoints him. I think scarcity requires witnesses.',
	},
	{
		id: 'juno:coupler-with-a-chorus',
		npcId: 'juno-jar',
		locationId: 'dub-colony:safehouse',
		priority: 125,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'juno-started-return-coupler',
		startsQuestId: 'dub-colony:side-greenhouse-night-line',
		startsQuestStepId: 'fit-the-seed-to-chorus-rail',
		speakerLine:
			'The Seed expects one clean authority. Chorus Rail expects three mechanics arguing and a child changing the destination sticker.',
		mossLine: 'Can you couple them?',
		followupLine: 'Mechanically, yes. Politically, I need a wrench that apologizes.',
	},
	{
		id: 'ames:breathable-exception',
		npcId: 'ames-oxygen',
		locationId: 'dub-colony:settlement',
		priority: 115,
		phase: 'contested',
		trustDelta: 0,
		recordFlag: 'ames-opened-air-ledger',
		speakerLine:
			'Air is free. Delivery, filtration, reserve pressure, and surviving a disagreement during a leak remain regrettably administrative.',
		mossLine: 'Who audits the regret?',
		followupLine: 'Presently? The person regretting most efficiently.',
	},
	{
		id: 'quasar:manual-sunrise',
		npcId: 'old-quasar-jones',
		locationId: 'dub-colony:station',
		priority: 120,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'quasar-opened-solar-window',
		startsQuestId: 'dub-colony:contract-solar-window-shift',
		startsQuestStepId: 'share-the-window',
		speakerLine:
			'Orbit gives everybody sunrise and charges maintenance for scheduling it.',
		mossLine: 'King controls the windows?',
		followupLine: 'Emergency channel does. King merely keeps forgetting his hand is on it.',
	},
	{
		id: 'coco:route-without-middle',
		npcId: 'coco-loop',
		locationId: 'dub-colony:settlement',
		priority: 105,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'coco-drew-colony-loop',
		speakerLine:
			'Your city map puts us at the end. End means “deliveries later” and “rescue maybe.” I drew it round.',
		mossLine: 'Where is the center?',
		followupLine: 'That is the bug I removed.',
	},
	{
		id: 'bassie:rotating-fader',
		npcId: 'bassie-knot',
		locationId: 'dub-colony:settlement',
		priority: 170,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'bassie-published-rotation',
		speakerLine:
			'Master fader rotates by task, expires by clock, and can be interrupted by two rooms that disagree for different reasons.',
		mossLine: 'Messy.',
		followupLine: 'That is how we know it belongs to living people.',
	},
	{
		id: 'portia:public-local',
		npcId: 'portia-drift',
		locationId: 'mirror-palace:station',
		priority: 170,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'portia-opened-public-local',
		speakerLine:
			'Guest express now waits for the staff local at transfer. Luxury has discovered connection anxiety.',
		mossLine: 'How is the timetable?',
		followupLine: 'Late, public, and finally carrying the people who make it work.',
	},
	{
		id: 'marlo:the-order-i-did-not-send',
		npcId: 'marlo-turnstile',
		locationId: 'lower-sprawl:station',
		priority: 145,
		phase: 'contested',
		trustDelta: 0,
		recordFlag: 'marlo-opened-dispatch-ledger',
		speakerLine:
			'I did not order the platform sweep. I marked one report “credible, local, immediate.” The machine conjugated the rest into boots.',
		mossLine: 'You still routed it.',
		followupLine: 'Yes. “I only supplied the grammar” is how dispatchers ask history for a discount.',
	},
	{
		id: 'marlo:rotating-night-dispatch',
		npcId: 'marlo-turnstile',
		locationId: 'lower-sprawl:station',
		priority: 185,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'marlo-published-dispatch-rotation',
		speakerLine:
			'Every alert now carries source, confidence, purpose, radius, expiry, and the name of the next crew allowed to disagree with it.',
		mossLine: 'And your shift?',
		followupLine: 'Ends at four. Accountability without clocking out is just a nicer uniform for permanent authority.',
	},
	{
		id: 'vera:separate-the-eyes-from-the-orders',
		npcId: 'vera-counterweight',
		locationId: 'dub-colony:station',
		priority: 150,
		phase: 'contested',
		trustDelta: 1,
		recordFlag: 'vera-separated-safety-and-enforcement',
		speakerLine:
			'This lens can see a pressure leak or a fugitive. Hardware does not care. Wiring diagrams do. Budgets care loudest.',
		mossLine: 'Can you keep the warning and remove the hunt?',
		followupLine: 'Yes. But the new circuit needs a public hand on the test switch, not my good intentions soldered shut.',
	},
	{
		id: 'vera:homecoming-maintenance-window',
		npcId: 'vera-counterweight',
		locationId: 'lower-sprawl:station',
		priority: 182,
		phase: 'transformed',
		trustDelta: 2,
		recordFlag: 'vera-opened-homecoming-repair-window',
		speakerLine:
			'Colony alarms now arrive as maintenance questions. City dispatch answers with provenance, not pursuit. The coupler complains in both accents.',
		mossLine: 'Who owns the arm switch?',
		followupLine: 'Nobody alone. That makes repairs slower and sleep considerably better.',
	},
	...ANTENNA_BARRENS_CONVERSATIONS,
	...ORBITAL_LIFT_CONVERSATIONS,
	...ASTEROID_REDOUBT_CONVERSATIONS,
	...ALGORITHMIC_CIVIC_CONVERSATIONS,
];

export function getNpcDef(npcId: string): NpcDef | undefined {
	return NPC_CATALOG.find((npc) => npc.id === npcId);
}

export function getNpcConversations(npcId: string): NpcConversationDef[] {
	return NPC_CONVERSATIONS.filter((conversation) => conversation.npcId === npcId).sort(
		(a, b) => b.priority - a.priority
	);
}

