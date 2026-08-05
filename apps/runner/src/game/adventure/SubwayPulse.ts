import type { StoryProgress } from '../GameFlow';
import type { AdventureSaveV2 } from './AdventureState';

export type SubwayEra =
	| 'metered-silence'
	| 'pirate-whisper'
	| 'open-vein'
	| 'vertical-ghost'
	| 'sky-mirror'
	| 'diaspora-chorus'
	| 'commons-loop'
	| 'public-forecast'
	| 'homebound-static'
	| 'last-route'
	| 'commons-line';

export interface SubwayPulseSnapshot {
	era: SubwayEra;
	label: string;
	tagline: string;
	announcement: string;
	networkMood: string;
	visualSignal: string;
	servicePattern: string;
}

const PULSES: Record<SubwayEra, SubwayPulseSnapshot> = {
	'metered-silence': {
		era: 'metered-silence',
		label: 'THE METERED SILENCE',
		tagline: 'The city moves, but only after asking a price.',
		announcement:
			'Passengers are reminded that unauthorized destinations may affect eligibility for future destinations.',
		networkMood: 'Skipped stops, fare surges, police-blue status lights, long intervals of administrative quiet.',
		visualSignal: 'Thin red line interrupted by black gaps.',
		servicePattern: 'Corporate express trains pass local platforms without slowing.',
	},
	'pirate-whisper': {
		era: 'pirate-whisper',
		label: 'THE PIRATE WHISPER',
		tagline: 'One dead platform begins answering back.',
		announcement:
			'Attention unauthorized passengers: the delay is political, the repair is collective, and the next low note is for you.',
		networkMood: 'Unofficial lights, handwritten maps, maintenance traffic carrying people after midnight.',
		visualSignal: 'A blue pulse traveling beneath the official red line.',
		servicePattern: 'Ghost trains appear at protected stops and vanish before enforcement arrives.',
	},
	'open-vein': {
		era: 'open-vein',
		label: 'THE OPEN VEIN',
		tagline: 'The line carries medicine before profit notices.',
		announcement:
			'Floodline service is delayed by water, knives, and a dispute over whether survival counts as freight.',
		networkMood: 'Clinic crates, market passengers, flooded tunnels, neighborhood stewards sharing line health.',
		visualSignal: 'Blue and green routes branching around flooded black sections.',
		servicePattern: 'Supply trains and passenger trains share track through negotiated priority windows.',
	},
	'vertical-ghost': {
		era: 'vertical-ghost',
		label: 'THE VERTICAL GHOST',
		tagline: 'The subway reaches a basement where elevators deny being transit.',
		announcement:
			'Blue Mercy transfer available to Labor B2. Public records insist Labor B2 is a ventilation preference.',
		networkMood: 'Canteen steam, deleted lift stops, freight cages, immaculate atriums, and worker routes drawn in negative space.',
		visualSignal: 'The blue line hits the Arcology and climbs as a dotted branch through missing floors.',
		servicePattern: 'Night trains feed hidden labor stops while lift priority remains privately authored.',
	},
	'sky-mirror': {
		era: 'sky-mirror',
		label: 'THE SKY MIRROR',
		tagline: 'The express line discovers that orbit is only the city with cleaner glass.',
		announcement:
			'Welcome to premium ascent. Your view of the city has been upgraded. The city itself has not.',
		networkMood: 'Corporate glass trains overlay labor shafts; public maps gain impossible vertical branches.',
		visualSignal: 'The subway diagram bends upward into a mirrored silver loop.',
		servicePattern: 'Elevator Seed routes expose worker floors and unlock an orbital express path.',
	},
	'diaspora-chorus': {
		era: 'diaspora-chorus',
		label: 'THE DIASPORA CHORUS',
		tagline: 'Retired train cars become gardens, studios, and arguments in orbit.',
		announcement:
			'Chorus Rail requests no saviors, three oxygen filters, and one delegation prepared to lose a vote gracefully.',
		networkMood: 'City announcements trade samples with colony rhythms; greenhouse cars mirror neighborhood clinics.',
		visualSignal: 'The line becomes a waveform linking city blue to orbital violet.',
		servicePattern: 'Transit is episodic and negotiated around air, food, and solar windows.',
	},
	'commons-loop': {
		era: 'commons-loop',
		label: 'THE COMMONS LOOP',
		tagline: 'The colony is not the end of the line, and the city is no longer its center.',
		announcement:
			'Chorus Rail connection accepted with revisions. Either endpoint may interrupt, delay, or refuse service without applying for independence.',
		networkMood:
			'Greenhouse cars, public air forecasts, rotating emergency authority, staff locals, and city medicine moving through one disputed loop.',
		visualSignal:
			'The orbital waveform closes into an uneven circle with arrows in both directions and no central interchange.',
		servicePattern:
			'Passenger, greenhouse, workshop, and air-reserve cars publish capacity and accept objections from either end.',
	},
	'public-forecast': {
		era: 'public-forecast',
		label: 'THE PUBLIC FORECAST',
		tagline: 'The line learns to predict without pretending prediction is permission.',
		announcement:
			'Forecast: inspections likely, resistance distributed, uncertainty publicly available for comment.',
		networkMood: 'Antenna weather, open routing manuals, disputed predictions displayed beside arrivals.',
		visualSignal: 'Branching signal constellations around every station node.',
		servicePattern: 'Passengers can see why routes change and challenge automated priority decisions.',
	},
	'homebound-static': {
		era: 'homebound-static',
		label: 'THE LONG WAY HOME',
		tagline: 'The orbital lift descends like a subway car through the architecture of extraction.',
		announcement:
			'Downbound cargo has declared itself passengers. Expect delays while ownership is removed from the manifest.',
		networkMood: 'City rumors rush upward; colony decisions descend in freight containers and returning companions.',
		visualSignal: 'A vertical gold line reconnecting the orbital waveform to the city grid.',
		servicePattern: 'The return route carries freed prisoners, seeds, tools, evidence, and unresolved political arguments.',
	},
	'last-route': {
		era: 'last-route',
		label: 'THE LAST ROUTE',
		tagline: 'Blue Mercy launches a message designed to return as tools, corrections, and new local copies.',
		announcement:
			'Final expedition service departs from the public platform. No heroic passengers required; maintenance, testimony, protected maps, and revision authority welcome.',
		networkMood:
			'City kitchens, colony greenhouses, forecast appeals, passenger manifests, and asteroid transmitters holding one unfinished chord.',
		visualSignal:
			'A hand-drawn blue route leaves the city, loops through violet orbit, reaches a white transmitter root, and returns as many thinner local lines.',
		servicePattern:
			'The final train carries practiced institutions outward and expects receiving stations to revise what comes back.',
	},
	'commons-line': {
		era: 'commons-line',
		label: 'THE COMMONS LINE',
		tagline: 'No center, no frontier, no route without a way to dispute it.',
		announcement:
			'Next arrival: late, repaired, publicly explained. Connections available to the city, the colony, and wherever the map is willing to be corrected.',
		networkMood: 'Stations serve as kitchens, clinics, greenhouses, archives, workshops, and assemblies.',
		visualSignal: 'A thick hand-drawn network with visible revisions instead of a perfect corporate diagram.',
		servicePattern: 'Schedules are proposals maintained by rotating crews and published constraints.',
	},
};

export function resolveSubwayPulse(
	adventure: AdventureSaveV2,
	story: StoryProgress
): SubwayPulseSnapshot {
	const completed = new Set(story.completedStageIds);
	if (story.campaignComplete || completed.has('asteroid-redoubt')) return PULSES['commons-line'];
	if (story.currentStageId === 'asteroid-redoubt' && completed.has('orbital-lift')) {
		return PULSES['last-route'];
	}
	if (completed.has('orbital-lift')) return PULSES['homebound-static'];
	if (completed.has('antenna-barrens')) return PULSES['public-forecast'];
	if (completed.has('dub-colony')) return PULSES['commons-loop'];
	if (completed.has('mirror-palace')) {
		return PULSES['diaspora-chorus'];
	}
	if (completed.has('chrome-arcology')) return PULSES['sky-mirror'];
	if (
		story.currentStageId === 'chrome-arcology' ||
		adventure.districtPhases['chrome-arcology'] === 'contested'
	) {
		return PULSES['vertical-ghost'];
	}
	if (completed.has('drainmarket')) return PULSES['open-vein'];
	if (
		completed.has('lower-sprawl') ||
		adventure.districtPhases['lower-sprawl'] === 'transformed'
	) {
		return PULSES['pirate-whisper'];
	}
	return PULSES['metered-silence'];
}

