// Badger Sprawl Runner - dependency-free canvas prototype.
// The renderer draws placeholder vector sprites while data/sprites.json defines real production sprite requirements.

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const statusEl = document.querySelector('#status');
const miniEl = document.querySelector('#minigame');

const W = canvas.width;
const H = canvas.height;
const keys = new Set();
const pressed = new Set();

const P = {
	gravity: 1900,
	jumpVelocity: -650,
	maxFallSpeed: 1100,
	runAccelGround: 5200,
	runAccelAir: 2900,
	friction: 4200,
	maxRunSpeed: 285,
	fastFallMultiplier: 1.55,
	coyote: 0.095,
	jumpBuffer: 0.11,
	variableJumpCut: 0.48,
};

const world = {
	time: 0,
	cameraX: 0,
	heat: 0,
	loot: 0,
	message: 'Reach the green relay. Press M to practice a code gate.',
	platforms: [
		{ x: 0, y: 494, w: 1900, h: 80 },
		{ x: 230, y: 415, w: 135, h: 18 },
		{ x: 455, y: 360, w: 130, h: 18 },
		{ x: 705, y: 405, w: 150, h: 18 },
		{ x: 950, y: 338, w: 170, h: 18 },
		{ x: 1230, y: 420, w: 160, h: 18 },
		{ x: 1480, y: 365, w: 240, h: 18 },
	],
	pickups: [
		{ id: 'rocket_backpack', x: 270, y: 382, kind: 'rocket', taken: false },
		{ id: 'railgun', x: 500, y: 326, kind: 'railgun', taken: false },
		{ id: 'stim_pack', x: 996, y: 304, kind: 'stim', taken: false },
		{ id: 'katana', x: 1518, y: 330, kind: 'katana', taken: false },
	],
	enemies: [
		{ x: 620, y: 462, w: 34, h: 32, vx: -42, hp: 2, stun: 0, name: 'crawler' },
		{ x: 1130, y: 305, w: 34, h: 30, vx: 0, hp: 2, stun: 0, name: 'drone', phase: 0 },
	],
	bullets: [],
	sparks: [],
};

const player = {
	x: 60,
	y: 420,
	w: 34,
	h: 46,
	vx: 0,
	vy: 0,
	dir: 1,
	onGround: false,
	coyoteLeft: 0,
	jumpBuffered: 0,
	hp: 5,
	maxHp: 5,
	greyHp: 0,
	fuel: 0,
	maxFuel: 0,
	stims: 0,
	hasRailgun: false,
	hasRocket: false,
	hasKatana: false,
	meleeTimer: 0,
	shootCd: 0,
	invuln: 0,
	boostCd: 0,
	focus: 0,
	combo: 'claws',
	won: false,
};

const gate = {
	active: false,
	target: 'unlock --gate drain-7 --silent',
	input: '',
	timeLeft: 12,
	solved: false,
	flash: 0,
};

function aabb(a, b) {
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function clamp(v, min, max) {
	return Math.max(min, Math.min(max, v));
}
function edge(code) {
	return pressed.has(code);
}
function down(...codes) {
	return codes.some((c) => keys.has(c));
}

function reset() {
	location.reload();
}

window.addEventListener('keydown', (e) => {
	if (!keys.has(e.code)) pressed.add(e.code);
	keys.add(e.code);
	if (gate.active && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
		gate.input += e.key;
		e.preventDefault();
	}
	if (gate.active && e.code === 'Backspace') {
		gate.input = gate.input.slice(0, -1);
		e.preventDefault();
	}
	if (gate.active && e.code === 'Enter') {
		submitGate();
		e.preventDefault();
	}
	if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
		e.preventDefault();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));

function submitGate() {
	if (gate.input === gate.target) {
		gate.solved = true;
		gate.active = false;
		gate.flash = 1;
		world.loot += 3;
		world.heat = Math.max(0, world.heat - 1);
		world.message = 'Clean code gate: relay open, loot +3, heat down.';
	} else {
		gate.input = '';
		world.heat += 1;
		player.invuln = Math.max(player.invuln, 0.55);
		world.message = 'Bad command. Alarm heat rises; try again or keep running.';
	}
}

function control(dt) {
	if (edge('KeyR')) reset();
	if (edge('KeyM')) {
		gate.active = !gate.active;
		gate.input = '';
		gate.timeLeft = 12;
	}
	if (gate.active) return;

	if (edge('Space') || edge('KeyW') || edge('ArrowUp')) player.jumpBuffered = P.jumpBuffer;
	const left = down('KeyA', 'ArrowLeft');
	const right = down('KeyD', 'ArrowRight');
	const axis = (right ? 1 : 0) - (left ? 1 : 0);
	if (axis) player.dir = axis;
	const accel = player.onGround ? P.runAccelGround : P.runAccelAir;
	player.vx += axis * accel * dt;
	if (!axis && player.onGround) {
		const f = Math.sign(player.vx) * P.friction * dt;
		player.vx = Math.abs(f) > Math.abs(player.vx) ? 0 : player.vx - f;
	}
	player.vx = clamp(player.vx, -P.maxRunSpeed, P.maxRunSpeed);

	if (player.jumpBuffered > 0 && (player.onGround || player.coyoteLeft > 0)) {
		player.vy = P.jumpVelocity;
		player.onGround = false;
		player.coyoteLeft = 0;
		player.jumpBuffered = 0;
		world.sparks.push({ x: player.x + 16, y: player.y + 44, t: 0.25, kind: 'dust' });
	}
	if (!down('Space', 'KeyW', 'ArrowUp') && player.vy < -120) player.vy *= P.variableJumpCut;
	if (down('KeyS', 'ArrowDown') && player.vy > 0)
		player.vy += P.gravity * (P.fastFallMultiplier - 1) * dt;

	if (edge('KeyJ')) melee();
	if (edge('KeyK')) shoot();
	if (edge('KeyE')) useItem();
}

function melee() {
	player.meleeTimer = player.hasKatana ? 0.28 : 0.18;
	player.combo = player.hasKatana ? 'katana' : 'claws';
	const box = { x: player.x + (player.dir > 0 ? player.w : -42), y: player.y + 8, w: 42, h: 28 };
	for (const e of world.enemies)
		if (e.hp > 0 && aabb(box, e)) {
			e.hp -= player.hasKatana ? 2 : 1;
			e.stun = 0.45;
			e.vx += player.dir * 150;
			player.vx += -player.dir * 35;
			world.sparks.push({ x: e.x + e.w / 2, y: e.y + 15, t: 0.28, kind: player.combo });
		}
}

function shoot() {
	if (!player.hasRailgun || player.shootCd > 0) return;
	player.shootCd = 0.72;
	player.vx -= player.dir * 95;
	world.bullets.push({
		x: player.x + player.w / 2,
		y: player.y + 20,
		vx: player.dir * 720,
		w: 20,
		h: 5,
		life: 1.1,
	});
	world.sparks.push({
		x: player.x + (player.dir > 0 ? player.w : -8),
		y: player.y + 20,
		t: 0.16,
		kind: 'muzzle',
	});
}

function useItem() {
	if (player.hasRocket && player.fuel > 0 && player.boostCd <= 0) {
		const up = down('KeyW', 'ArrowUp') ? -1 : 0;
		const side =
			(down('KeyD', 'ArrowRight') ? 1 : 0) - (down('KeyA', 'ArrowLeft') ? 1 : 0) || player.dir;
		player.vx += side * 230;
		player.vy = Math.min(player.vy, -120) + up * 210 - 220;
		player.fuel--;
		player.boostCd = 0.35;
		world.sparks.push({ x: player.x + 15, y: player.y + 45, t: 0.36, kind: 'rocket' });
	} else if (player.stims > 0 && player.hp < player.maxHp) {
		player.stims--;
		player.hp = Math.min(player.maxHp, player.hp + 2);
		player.focus = 1.5;
		world.message = 'Stim used: heal + focus window.';
	}
}

function physics(dt) {
	player.jumpBuffered = Math.max(0, player.jumpBuffered - dt);
	player.coyoteLeft = Math.max(0, player.coyoteLeft - dt);
	player.meleeTimer = Math.max(0, player.meleeTimer - dt);
	player.shootCd = Math.max(0, player.shootCd - dt);
	player.invuln = Math.max(0, player.invuln - dt);
	player.boostCd = Math.max(0, player.boostCd - dt);
	player.focus = Math.max(0, player.focus - dt);

	player.vy = Math.min(P.maxFallSpeed, player.vy + P.gravity * dt);
	player.x += player.vx * dt;
	player.y += player.vy * dt;
	player.onGround = false;

	for (const p of world.platforms) {
		if (aabb(player, p) && player.vy >= 0 && player.y + player.h - player.vy * dt <= p.y + 6) {
			player.y = p.y - player.h;
			player.vy = 0;
			player.onGround = true;
			player.coyoteLeft = P.coyote;
			if (player.hasRocket) player.fuel = Math.min(player.maxFuel, player.fuel + dt * 1.75);
		}
	}
	player.fuel = Math.min(player.maxFuel, player.fuel);
	player.x = Math.max(0, player.x);
	if (player.y > H + 200) damage(1, 'fell into the undercity; respawned');
}

function updateWorld(dt) {
	if (gate.active) {
		gate.timeLeft -= dt;
		if (gate.timeLeft <= 0) {
			gate.timeLeft = 12;
			gate.input = '';
			world.heat++;
			world.message = 'Timeout. Heat rises.';
		}
	}
	gate.flash = Math.max(0, gate.flash - dt);
	for (const e of world.enemies) {
		if (e.hp <= 0) continue;
		e.stun = Math.max(0, e.stun - dt);
		if (e.name === 'crawler' && e.stun <= 0) {
			e.x += e.vx * dt;
			if (e.x < 560 || e.x > 760) e.vx *= -1;
		}
		if (e.name === 'drone') {
			e.phase += dt;
			e.y = 300 + Math.sin(e.phase * 2.1) * 32;
		}
		if (aabb(player, e) && player.invuln <= 0) damage(1, `hit by ${e.name}`);
	}
	for (const b of world.bullets) {
		b.x += b.vx * dt;
		b.life -= dt;
		for (const e of world.enemies)
			if (e.hp > 0 && aabb(b, e)) {
				e.hp -= 2;
				e.stun = 0.5;
				b.life = 0;
				world.sparks.push({ x: e.x, y: e.y, t: 0.25, kind: 'emp' });
			}
	}
	world.bullets = world.bullets.filter((b) => b.life > 0);
	world.sparks = world.sparks.map((s) => ({ ...s, t: s.t - dt })).filter((s) => s.t > 0);

	for (const p of world.pickups)
		if (!p.taken && aabb(player, { x: p.x, y: p.y, w: 28, h: 28 })) {
			p.taken = true;
			collect(p);
		}
	if (player.x > 1660 && !player.won) {
		player.won = true;
		world.message = 'Relay seized. The dub colony broadcasts: next stop, orbital heist.';
	}
	world.cameraX += (player.x - 260 - world.cameraX) * Math.min(1, dt * 4);
	world.cameraX = clamp(world.cameraX, 0, 990);
}

function collect(p) {
	if (p.kind === 'rocket') {
		player.hasRocket = true;
		player.maxFuel = 3;
		player.fuel = 3;
		world.message = 'Rocket backpack acquired. E boosts; fuel recharges on ground.';
	}
	if (p.kind === 'railgun') {
		player.hasRailgun = true;
		world.message = 'Railgun acquired. K fires a heavy recoil shot.';
	}
	if (p.kind === 'stim') {
		player.stims += 2;
		world.message = 'Stim packs +2. E uses one when hurt if no rocket boost is ready.';
	}
	if (p.kind === 'katana') {
		player.hasKatana = true;
		world.message = 'Katana acquired. Melee becomes a longer draw slash.';
	}
}

function damage(amount, msg) {
	player.hp -= amount;
	player.greyHp = Math.min(player.maxHp, player.greyHp + amount);
	player.invuln = 1.1;
	world.message = msg;
	player.x = Math.max(40, player.x - 70);
	player.y = 420;
	player.vx = 0;
	player.vy = 0;
	if (player.hp <= 0) {
		player.hp = player.maxHp;
		world.heat += 2;
		world.loot = Math.max(0, world.loot - 2);
		world.message = 'Downed. Crew patches you up; loot lost, heat rises.';
	}
}

function draw() {
	ctx.clearRect(0, 0, W, H);
	const cam = world.cameraX;
	const sky = ctx.createLinearGradient(0, 0, 0, H);
	sky.addColorStop(0, '#111832');
	sky.addColorStop(0.55, '#12101f');
	sky.addColorStop(1, '#080a12');
	ctx.fillStyle = sky;
	ctx.fillRect(0, 0, W, H);

	// parallax neon sprawl
	for (let i = 0; i < 16; i++) {
		const x = ((i * 135 - cam * 0.35) % 1200) - 120;
		const h = 90 + (i % 5) * 25;
		ctx.fillStyle = i % 3 ? '#151b2d' : '#1c1731';
		ctx.fillRect(x, H - 110 - h, 90, h);
		ctx.fillStyle = i % 2 ? '#67f3c4' : '#ff5e7a';
		ctx.fillRect(x + 14, H - 96 - h, 8, 28);
	}

	ctx.save();
	ctx.translate(-cam, 0);
	for (const p of world.platforms) {
		ctx.fillStyle = '#243149';
		ctx.fillRect(p.x, p.y, p.w, p.h);
		ctx.fillStyle = '#67f3c4';
		ctx.fillRect(p.x, p.y, p.w, 3);
		ctx.fillStyle = 'rgba(255,255,255,.08)';
		for (let x = p.x; x < p.x + p.w; x += 32) ctx.fillRect(x, p.y + 5, 18, 3);
	}
	for (const p of world.pickups) if (!p.taken) drawPickup(p);
	for (const e of world.enemies) if (e.hp > 0) drawEnemy(e);
	for (const b of world.bullets) {
		ctx.fillStyle = '#c9f7ff';
		ctx.fillRect(b.x, b.y, b.w, b.h);
		ctx.fillStyle = '#67f3c4';
		ctx.fillRect(b.x - 18, b.y + 1, 18, 2);
	}
	for (const s of world.sparks) drawSpark(s);
	drawBadger(player);
	drawRelay(1715, 314);
	ctx.restore();

	drawOverlay();
}

function drawBadger(p) {
	ctx.save();
	ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
	if (p.dir < 0) ctx.scale(-1, 1);
	if (p.invuln > 0 && Math.floor(world.time * 20) % 2 === 0) ctx.globalAlpha = 0.45;
	ctx.fillStyle = '#272b32';
	ctx.fillRect(-17, -18, 34, 36);
	ctx.fillStyle = '#f0f0e8';
	ctx.fillRect(-13, -14, 26, 10); // badger stripe
	ctx.fillStyle = '#111';
	ctx.fillRect(2, -12, 5, 5);
	ctx.fillStyle = '#364457';
	ctx.fillRect(-19, 10, 13, 16);
	ctx.fillRect(6, 10, 13, 16);
	ctx.fillStyle = '#1b1d24';
	ctx.fillRect(-20, -24, 10, 10);
	ctx.fillRect(10, -24, 10, 10);
	if (p.hasRocket) {
		ctx.fillStyle = '#514065';
		ctx.fillRect(-25, -8, 9, 24);
		if (p.boostCd > 0.1) {
			ctx.fillStyle = '#ffb35e';
			ctx.fillRect(-31, 12, 14, 20);
		}
	}
	if (p.hasRailgun) {
		ctx.fillStyle = '#a8f7ff';
		ctx.fillRect(8, -3, 30, 7);
		ctx.fillStyle = '#2a6070';
		ctx.fillRect(20, -7, 12, 4);
	}
	if (p.meleeTimer > 0) {
		ctx.strokeStyle = p.combo === 'katana' ? '#eaf2ff' : '#ffef9f';
		ctx.lineWidth = p.combo === 'katana' ? 5 : 4;
		ctx.beginPath();
		ctx.arc(18, 0, 28, -0.8, 0.8);
		ctx.stroke();
	}
	ctx.restore();
}
function drawEnemy(e) {
	ctx.fillStyle = e.name === 'drone' ? '#9a6cff' : '#ff5e7a';
	ctx.fillRect(e.x, e.y, e.w, e.h);
	ctx.fillStyle = '#10131c';
	ctx.fillRect(e.x + 6, e.y + 8, 7, 7);
	ctx.fillRect(e.x + 22, e.y + 8, 7, 7);
}
function drawPickup(p) {
	ctx.fillStyle =
		p.kind === 'stim'
			? '#67f3c4'
			: p.kind === 'railgun'
				? '#c9f7ff'
				: p.kind === 'katana'
					? '#eaf2ff'
					: '#ffb35e';
	ctx.fillRect(p.x, p.y, 28, 28);
	ctx.fillStyle = 'rgba(0,0,0,.35)';
	ctx.fillRect(p.x + 5, p.y + 5, 18, 18);
}
function drawSpark(s) {
	ctx.globalAlpha = Math.max(0, s.t * 3);
	ctx.fillStyle = s.kind === 'emp' ? '#67f3c4' : s.kind === 'rocket' ? '#ffb35e' : '#eaf2ff';
	ctx.beginPath();
	ctx.arc(s.x, s.y, 18 * (s.t + 0.1), 0, Math.PI * 2);
	ctx.fill();
	ctx.globalAlpha = 1;
}
function drawRelay(x, y) {
	ctx.fillStyle = player.won ? '#67f3c4' : '#3d4b62';
	ctx.fillRect(x, y, 40, 180);
	ctx.fillStyle = '#eaf2ff';
	ctx.fillRect(x - 18, y + 10, 76, 12);
}

function drawOverlay() {
	ctx.fillStyle = 'rgba(4,6,12,.72)';
	ctx.fillRect(16, 16, 450, 74);
	ctx.fillStyle = '#eaf2ff';
	ctx.font = '16px ui-monospace, monospace';
	ctx.fillText(
		`HP ${'♥'.repeat(player.hp)}${'·'.repeat(player.maxHp - player.hp)}  Heat ${world.heat}  Loot ${world.loot}`,
		30,
		42
	);
	ctx.fillText(
		`Fuel ${player.hasRocket ? `${player.fuel.toFixed(1)}/${player.maxFuel}` : 'no pack'}  Stims ${player.stims}  Rail ${player.hasRailgun ? 'yes' : 'no'}  Katana ${player.hasKatana ? 'yes' : 'no'}`,
		30,
		67
	);
	if (gate.flash > 0) {
		ctx.fillStyle = 'rgba(103,243,196,.25)';
		ctx.fillRect(0, 0, W, H);
	}
}

function updateHud() {
	statusEl.innerHTML = `<strong>Status</strong><br>${world.message}<br><span>Position ${Math.round(player.x)} / 1750 · enemies left ${world.enemies.filter((e) => e.hp > 0).length}</span>`;
	if (gate.active) {
		miniEl.className = 'code-active';
		miniEl.innerHTML = `<strong>Code gate</strong><br>Type: <code>${gate.target}</code><br><code>&gt; ${gate.input}</code><br>${gate.timeLeft.toFixed(1)}s left · Enter submits · Backspace edits`;
	} else {
		miniEl.className = gate.solved ? 'code-active' : '';
		miniEl.innerHTML = `<strong>Minigame slot</strong><br>${gate.solved ? 'Gate solved. Future variants: regex, routing, bytecode ordering, micro-code.' : 'Press M near a terminal to open a fast typing gate.'}`;
	}
}

let last = performance.now();
function loop(now) {
	const dt = Math.min(0.033, (now - last) / 1000);
	last = now;
	const simDt = player.focus > 0 ? dt * 0.62 : dt;
	world.time += dt;
	control(simDt);
	physics(simDt);
	updateWorld(simDt);
	draw();
	updateHud();
	pressed.clear();
	requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
