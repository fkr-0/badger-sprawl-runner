import { readFile } from 'node:fs/promises';

function assert(condition, message) {
	if (!condition) throw new Error(message);
}

const loaderSource = await readFile(new URL('../data/story-content.ts', import.meta.url), 'utf8');
const generatedSource = await readFile(
	new URL('../data/story-content.generated.ts', import.meta.url),
	'utf8',
);

assert(
	loaderSource.includes("import { GENERATED_STORY_CONTENT } from './story-content.generated';"),
	'StoryContentLoader must import generated story-flavour content',
);
assert(
	loaderSource.includes('this.content = GENERATED_STORY_CONTENT'),
	'StoryContentLoader must cache generated story content instead of returning an empty stub',
);
assert(
	!loaderSource.includes('TODO: Implement actual YAML parsing'),
	'StoryContentLoader should not advertise unimplemented YAML parsing after integration',
);

const chapterCount = (generatedSource.match(/"chapterId":/g) || []).length;
assert(chapterCount === 8, `expected generated story content to include 8 chapters, got ${chapterCount}`);

for (const required of [
	'"chapterId": "ch01_lower_sprawl"',
	'"chapterId": "ch08_asteroid_redoubt"',
	'"globalIdleActions"',
	'"reusableBarks"',
]) {
	assert(generatedSource.includes(required), `generated story content missing ${required}`);
}

console.log('badger-sprawl-runner story content loader contract ok');
