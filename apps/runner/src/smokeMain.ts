import type { MenuOptionId } from './game/GameFlow';
import { buildLowerSprawlBuildComparison } from './game/LowerSprawlBuildComparison';
import { TitleCardRenderer } from './renderer/TitleCardRenderer';
import { createLocalStorageSaveDriver, loadGameFlow, saveGameFlow } from './storage/SaveStore';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
const statusEl = document.querySelector<HTMLElement>('#status');
const miniEl = document.querySelector<HTMLElement>('#minigame');

if (!canvas) throw new Error('Canvas not found');
if (!statusEl) throw new Error('Status panel not found');
if (!miniEl) throw new Error('Minigame panel not found');
const statusPanel: HTMLElement = statusEl;
const miniPanel: HTMLElement = miniEl;

const maybeCtx = canvas.getContext('2d');
if (!maybeCtx) throw new Error('2D context not available');
const ctx: CanvasRenderingContext2D = maybeCtx;

const saveDriver = createLocalStorageSaveDriver(window.localStorage);
const flow = loadGameFlow(saveDriver);
const titleCardRenderer = new TitleCardRenderer();
const skillIds = ['double_swipe', 'parry_tooth', 'rail_mastery'] as const;
const buildComparison = buildLowerSprawlBuildComparison();

let selectedMenuIndex = 0;
let selectedSkillIndex = 0;
let selectedBuildIndex = 0;
let buildDetailPage: 'routes' | 'evidence' = 'routes';
let banner = 'Choose a mode.';
let dummyHits = 0;

const W = canvas.width;
const H = canvas.height;

function clampIndex(index: number, length: number): number {
	return (index + length) % length;
}

function drawBuilds(): void {
	title('LOWER SPRAWL BUILD LAB', 'three routes • pressure • public consequence');
	panel(54, 116, 852, 374);
	const cardWidth = 248;
	buildComparison.cards.forEach((card, index) => {
		const x = 82 + index * 274;
		const selected = selectedBuildIndex === index;
		ctx.fillStyle = selected ? 'rgba(103,243,196,0.12)' : 'rgba(4,6,12,0.8)';
		ctx.fillRect(x, 150, cardWidth, 128);
		ctx.strokeStyle = selected ? '#67f3c4' : '#293348';
		ctx.lineWidth = selected ? 3 : 1;
		ctx.strokeRect(x, 150, cardWidth, 128);
		ctx.fillStyle = selected ? '#67f3c4' : '#eaf2ff';
		ctx.font = '700 16px ui-monospace, monospace';
		ctx.textAlign = 'left';
		ctx.fillText(`${card.mark} ${card.label.toUpperCase()}`, x + 12, 176);
		ctx.fillStyle = '#92a4be';
		ctx.font = '11px ui-monospace, monospace';
		wrapText(card.tagline, x + 12, 198, cardWidth - 24, 15);
		ctx.fillStyle = '#ffb35e';
		ctx.font = '700 10px ui-monospace, monospace';
		ctx.fillText(card.evidenceKind.replace('-', ' ').toUpperCase(), x + 12, 258);
	});
	const selected = buildComparison.cards[selectedBuildIndex];
	if (selected) {
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '700 14px ui-monospace, monospace';
		ctx.fillText(`${buildDetailPage.toUpperCase()} // ${selected.label}`, 82, 316);
		ctx.fillStyle = '#c1cad8';
		ctx.font = '12px ui-monospace, monospace';
		const lines =
			buildDetailPage === 'routes'
				? selected.preferredPlans.flatMap((plan) => [
						`${plan.label.toUpperCase()} / ${plan.risk.toUpperCase()}: ${plan.playerCue}`,
						`WORLD: ${plan.worldConsequenceHint}`,
					])
				: [...selected.evidenceLines, `FAILURE: ${selected.failureMode}`];
		let y = 344;
		for (const line of lines.slice(0, 5)) {
			wrapText(line, 82, y, 790, 16);
			y += 34;
		}
	}
	footer('Left/Right: build • Enter/Tab: routes/evidence • Escape: menu');
}

function currentMenuId(): MenuOptionId {
	return flow.getMenuOptions()[selectedMenuIndex]?.id ?? 'story';
}

window.addEventListener('keydown', (event) => {
	const state = flow.getState();

	if (event.code === 'Escape') {
		flow.returnToMenu();
		banner = 'Returned to menu.';
		event.preventDefault();
		return;
	}

	switch (state.mode) {
		case 'menu':
			if (event.code === 'ArrowUp') {
				selectedMenuIndex = clampIndex(selectedMenuIndex - 1, flow.getMenuOptions().length);
				event.preventDefault();
			}
			if (event.code === 'ArrowDown') {
				selectedMenuIndex = clampIndex(selectedMenuIndex + 1, flow.getMenuOptions().length);
				event.preventDefault();
			}
			if (event.code === 'Enter' || event.code === 'Space') {
				flow.selectMenu(currentMenuId());
				banner = `Opened ${flow.getState().mode}.`;
				event.preventDefault();
			}
			break;
		case 'builds':
			if (event.code === 'ArrowLeft' || event.code === 'ArrowUp') {
				selectedBuildIndex = clampIndex(
					selectedBuildIndex - 1,
					buildComparison.cards.length
				);
				event.preventDefault();
			}
			if (event.code === 'ArrowRight' || event.code === 'ArrowDown') {
				selectedBuildIndex = clampIndex(
					selectedBuildIndex + 1,
					buildComparison.cards.length
				);
				event.preventDefault();
			}
			if (event.code === 'Enter' || event.code === 'Space' || event.code === 'Tab') {
				buildDetailPage = buildDetailPage === 'routes' ? 'evidence' : 'routes';
				event.preventDefault();
			}
			break;
		case 'title-card':
			if (event.code === 'Enter' || event.code === 'Space') {
				flow.advanceTitleCard();
				banner = 'Briefing opened.';
				event.preventDefault();
			}
			break;
		case 'dialogue':
			if (event.code === 'Enter' || event.code === 'Space') {
				flow.advanceDialogue();
				banner = flow.getState().mode === 'stage' ? 'Stage started.' : 'Dialogue advanced.';
				event.preventDefault();
			}
			break;
		case 'stage':
			if (event.code === 'Enter' || event.code === 'Space') {
				flow.completeStage();
				saveGameFlow(saveDriver, flow);
				banner = 'Colony debrief opened.';
				event.preventDefault();
			}
			break;
		case 'debrief':
			if (event.code === 'Enter' || event.code === 'Space') {
				flow.advanceDebrief();
				saveGameFlow(saveDriver, flow);
				banner =
					flow.getState().mode === 'title-card' ? 'Next placard raised.' : 'Debrief advanced.';
				event.preventDefault();
			}
			break;
		case 'versus':
			if (event.code === 'KeyJ') {
				const result = flow.scoreVersusTag('player');
				banner = result.winner === 'player' ? 'Player wins the duel.' : 'Player scores a tag.';
				event.preventDefault();
			}
			if (event.code === 'KeyK') {
				const result = flow.scoreVersusTag('rival');
				banner = result.winner === 'rival' ? 'Rival wins the duel.' : 'Rival scores a tag.';
				event.preventDefault();
			}
			break;
		case 'training':
			if (event.code === 'KeyJ') {
				dummyHits += 1;
				banner = `Dummy hit ${dummyHits} time${dummyHits === 1 ? '' : 's'}.`;
				event.preventDefault();
			}
			if (event.code === 'KeyR') {
				dummyHits = 0;
				banner = 'Training dummy reset.';
				event.preventDefault();
			}
			break;
		case 'skills':
			if (event.code === 'ArrowUp') {
				selectedSkillIndex = clampIndex(selectedSkillIndex - 1, skillIds.length);
				event.preventDefault();
			}
			if (event.code === 'ArrowDown') {
				selectedSkillIndex = clampIndex(selectedSkillIndex + 1, skillIds.length);
				event.preventDefault();
			}
			if (event.code === 'Enter' || event.code === 'Space') {
				const skillId = skillIds[selectedSkillIndex] ?? 'double_swipe';
				const result = flow.purchaseSkill(skillId);
				if (result.ok) saveGameFlow(saveDriver, flow);
				banner = result.ok ? `Unlocked ${skillId}.` : `Cannot unlock ${skillId}: ${result.reason}.`;
				event.preventDefault();
			}
			break;
	}

	draw();
});

function clear(): void {
	const grd = ctx.createLinearGradient(0, 0, W, H);
	grd.addColorStop(0, '#101629');
	grd.addColorStop(0.6, '#090b12');
	grd.addColorStop(1, '#101018');
	ctx.fillStyle = grd;
	ctx.fillRect(0, 0, W, H);

	ctx.strokeStyle = 'rgba(103,243,196,0.08)';
	ctx.lineWidth = 1;
	for (let x = 0; x < W; x += 48) {
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x - 160, H);
		ctx.stroke();
	}
}

function title(text: string, subtitle: string): void {
	ctx.fillStyle = '#eaf2ff';
	ctx.font = '700 42px ui-monospace, monospace';
	ctx.textAlign = 'center';
	ctx.fillText(text, W / 2, 82);
	ctx.fillStyle = '#67f3c4';
	ctx.font = '16px ui-monospace, monospace';
	ctx.fillText(subtitle, W / 2, 112);
}

function panel(x: number, y: number, w: number, h: number): void {
	ctx.fillStyle = 'rgba(18,24,39,0.86)';
	ctx.fillRect(x, y, w, h);
	ctx.strokeStyle = 'rgba(103,243,196,0.45)';
	ctx.lineWidth = 2;
	ctx.strokeRect(x, y, w, h);
}

function drawMenu(): void {
	title('BADGER SPRAWL RUNNER', 'menu online: world • duel • training • skills • build lab • endless');
	panel(174, 112, 612, 396);
	const options = flow.getMenuOptions();
	options.forEach((option, index) => {
		const y = 158 + index * 56;
		const selected = index === selectedMenuIndex;
		ctx.fillStyle = selected ? '#ffb35e' : '#eaf2ff';
		ctx.font = '700 22px ui-monospace, monospace';
		ctx.textAlign = 'left';
		ctx.fillText(`${selected ? '>' : ' '} ${option.label}`, 230, y);
		ctx.fillStyle = '#92a4be';
		ctx.font = '13px ui-monospace, monospace';
		ctx.fillText(option.description, 260, y + 22);
	});
}

function drawTitleCard(): void {
	const state = flow.getState();
	const stageTitle =
		state.mode === 'title-card' ? state.stageId.toUpperCase().replaceAll('-', ' ') : 'STAGE';
	const placard = state.mode === 'title-card' ? state.placard : '';

	titleCardRenderer.render(
		ctx,
		placard,
		stageTitle,
		state.mode === 'title-card' ? (state.stageIndex + 1) / flow.getStages().length : 0
	);
	footer('Space/Enter: open briefing • Escape: menu');
}

function drawDebrief(): void {
	const state = flow.getState();
	const debrief = flow.getCurrentDebrief();
	title('COLONY DEBRIEF', debrief?.speaker ?? 'Signal Lost');
	panel(80, 220, 800, 190);
	if (state.mode === 'debrief' && debrief) {
		ctx.fillStyle = '#ffb35e';
		ctx.font = '700 18px ui-monospace, monospace';
		ctx.textAlign = 'left';
		ctx.fillText(debrief.speaker, 112, 260);
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '19px ui-monospace, monospace';
		wrapText(debrief.lines[state.lineIndex] ?? '', 112, 300, 740, 28);
	}
	footer('Space/Enter: advance debrief');
}

function drawDialogue(): void {
	const state = flow.getState();
	const dialogue = flow.getCurrentDialogue();
	title('DIALOGUE LINK', dialogue?.speaker ?? 'Signal Lost');
	panel(80, 220, 800, 190);
	if (state.mode === 'dialogue' && dialogue) {
		ctx.fillStyle = '#ffb35e';
		ctx.font = '700 18px ui-monospace, monospace';
		ctx.textAlign = 'left';
		ctx.fillText(dialogue.speaker, 112, 260);
		ctx.fillStyle = '#eaf2ff';
		ctx.font = '19px ui-monospace, monospace';
		wrapText(dialogue.lines[state.lineIndex] ?? '', 112, 300, 740, 28);
	}
	footer('Space/Enter: advance dialogue');
}

function drawStage(): void {
	const state = flow.getState();
	const stage = state.mode === 'stage' ? flow.getStages()[state.stageIndex] : undefined;
	title(
		stage?.name ?? 'STAGE',
		`stage ${(state.mode === 'stage' ? state.stageIndex : 0) + 1} of ${flow.getStages().length}`
	);
	panel(90, 150, 780, 300);
	ctx.fillStyle = '#67f3c4';
	ctx.font = '700 18px ui-monospace, monospace';
	ctx.textAlign = 'left';
	ctx.fillText('OBJECTIVE', 130, 205);
	ctx.fillStyle = '#eaf2ff';
	ctx.font = '20px ui-monospace, monospace';
	wrapText(stage?.objective ?? 'No objective loaded.', 130, 245, 680, 30);
	ctx.fillStyle = '#92a4be';
	ctx.font = '15px ui-monospace, monospace';
	ctx.fillText(`Reward: ${stage?.rewardBlueprintShards ?? 0} blueprint shard(s)`, 130, 360);
	drawBadger(690, 342);
	footer('Space/Enter: complete prototype stage • Escape: menu');
}

function drawVersus(): void {
	const state = flow.getState();
	const playerScore = state.mode === 'versus' ? state.playerScore : 0;
	const rivalScore = state.mode === 'versus' ? state.rivalScore : 0;
	title('VS MODE', 'local duel dummy: first to 3 tags');
	panel(190, 150, 580, 270);
	ctx.fillStyle = '#eaf2ff';
	ctx.font = '700 30px ui-monospace, monospace';
	ctx.textAlign = 'center';
	ctx.fillText(`PLAYER ${playerScore}  :  ${rivalScore} RIVAL`, W / 2, 250);
	ctx.fillStyle = '#92a4be';
	ctx.font = '16px ui-monospace, monospace';
	ctx.fillText('J scores for player • K scores for rival', W / 2, 310);
	ctx.fillText(banner, W / 2, 350);
}

function drawTraining(): void {
	title('DUMMY TRAINING', 'invincible target sandbox');
	panel(150, 145, 660, 310);
	drawBadger(300, 335);
	ctx.fillStyle = '#4a4a4a';
	ctx.fillRect(590, 290, 70, 110);
	ctx.fillStyle = '#67f3c4';
	ctx.font = '700 17px ui-monospace, monospace';
	ctx.textAlign = 'center';
	ctx.fillText('DUMMY BADGER', 625, 270);
	ctx.fillStyle = '#eaf2ff';
	ctx.fillText('∞ HP', 625, 425);
	ctx.fillText(`hits: ${dummyHits}`, W / 2, 215);
	footer('J: hit dummy • R: reset dummy • Escape: menu');
}

function drawSkills(): void {
	title('SKILL TREE', 'blueprint shard upgrades');
	panel(150, 130, 660, 340);
	const meta = flow.getMeta();
	ctx.fillStyle = '#ffb35e';
	ctx.font = '18px ui-monospace, monospace';
	ctx.textAlign = 'left';
	ctx.fillText(`Blueprint Shards: ${meta.blueprintShards}`, 190, 180);
	skillIds.forEach((skillId, index) => {
		const y = 235 + index * 62;
		const selected = selectedSkillIndex === index;
		const unlocked = meta.purchasedSkills.includes(skillId);
		ctx.fillStyle = unlocked ? '#67f3c4' : selected ? '#ffb35e' : '#eaf2ff';
		ctx.font = '700 20px ui-monospace, monospace';
		ctx.fillText(`${selected ? '>' : ' '} ${skillId.replaceAll('_', ' ')}`, 210, y);
		ctx.fillStyle = '#92a4be';
		ctx.font = '13px ui-monospace, monospace';
		ctx.fillText(
			unlocked ? 'learned' : 'press Enter to unlock if prerequisites and shards allow',
			240,
			y + 22
		);
	});
	footer('Arrow keys: select skill • Enter: purchase • Escape: menu');
}

function drawBadger(x: number, y: number): void {
	ctx.fillStyle = '#d8d2c4';
	ctx.fillRect(x, y - 46, 58, 46);
	ctx.fillStyle = '#171717';
	ctx.fillRect(x + 7, y - 42, 15, 38);
	ctx.fillRect(x + 38, y - 42, 13, 38);
	ctx.fillStyle = '#67f3c4';
	ctx.fillRect(x + 46, y - 30, 32, 7);
}

function footer(text: string): void {
	ctx.fillStyle = '#92a4be';
	ctx.font = '14px ui-monospace, monospace';
	ctx.textAlign = 'center';
	ctx.fillText(text, W / 2, H - 34);
}

function wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
	const words = text.split(' ');
	let line = '';
	let lineY = y;
	for (const word of words) {
		const testLine = line ? `${line} ${word}` : word;
		if (ctx.measureText(testLine).width > maxWidth && line) {
			ctx.fillText(line, x, lineY);
			line = word;
			lineY += lineHeight;
		} else {
			line = testLine;
		}
	}
	if (line) ctx.fillText(line, x, lineY);
}

function updatePanels(): void {
	const state = flow.getState();
	const meta = flow.getMeta();
	statusPanel.innerHTML = `<strong>Mode:</strong> ${state.mode}<br/><strong>Blueprint shards:</strong> ${meta.blueprintShards}<br/><strong>Banner:</strong> ${banner}`;
	miniPanel.innerHTML =
		'<strong>Controls:</strong> Arrow keys navigate. Enter/Space confirms. Escape returns to menu.<br/><strong>Implemented slice:</strong> persistent world, eight-stage story spine, VS shell, training, skill tree, three-build Lower Sprawl lab, endless route.';
}

function draw(): void {
	clear();
	switch (flow.getState().mode) {
		case 'menu':
			drawMenu();
			break;
		case 'title-card':
			drawTitleCard();
			break;
		case 'dialogue':
			drawDialogue();
			break;
		case 'stage':
			drawStage();
			break;
		case 'debrief':
			drawDebrief();
			break;
		case 'versus':
			drawVersus();
			break;
		case 'training':
			drawTraining();
			break;
		case 'skills':
			drawSkills();
			break;
		case 'builds':
			drawBuilds();
			break;
	}
	updatePanels();
}

draw();
