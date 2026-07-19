// GENERATED FILE — DO NOT EDIT DIRECTLY.
// Edit source/runtime/*.js.inc and run `npm run source:build`.

export const ARCADE_RUNTIME_VERSION = '1.7.0';
export const ARCADE_PIXI_RUNTIME_VERSION = ARCADE_RUNTIME_VERSION;

export const DEFAULT_ARCADE_LAYERS = Object.freeze([
  'backdrop',
  'world-back',
  'world',
  'actors',
  'projectiles',
  'effects',
  'world-front',
  'hud',
  'overlay',
]);

function finiteNumber(value, fallback) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function positiveNumber(value, fallback) {
  const resolved = finiteNumber(value, fallback);
  return resolved > 0 ? resolved : fallback;
}

export function clampArcadeValue(value, minimum, maximum) {
  return clampNumber(value, minimum, maximum);
}

export function approachArcadeValue(current, target, maximumDelta) {
  return approach(current, target, maximumDelta);
}

export function applyArcadeDrag(value, drag, delta = 1) {
  return approach(value, 0, Math.max(0, finiteNumber(drag, 0)) * Math.max(0, finiteNumber(delta, 0)));
}

export function integrateArcadeBody2D(body, delta = 1) {
  return integrateBody(body, delta);
}

const ARCADE_ANIMATION_MODES = new Set(['loop', 'once', 'pingpong']);

function normalizeAnimationMode(mode) {
  return ARCADE_ANIMATION_MODES.has(mode) ? mode : 'loop';
}

function resolveAnimationFrameDuration(frameDuration, frame) {
  const rawDuration = typeof frameDuration === 'function'
    ? frameDuration(frame)
    : Array.isArray(frameDuration)
      ? frameDuration[frame]
      : frameDuration;
  return positiveNumber(rawDuration, 1 / 60);
}

export function createArcadeAnimationClock(initial = {}) {
  return {
    frame: Math.max(0, Math.floor(finiteNumber(initial.frame, 0))),
    elapsed: Math.max(0, finiteNumber(initial.elapsed, 0)),
    direction: initial.direction === -1 ? -1 : 1,
    playing: initial.playing === true,
    paused: initial.paused === true,
    completed: initial.completed === true,
    frameAdvances: 0,
    advancedFrames: [],
  };
}

export function playArcadeAnimationClock(state = {}, options = {}) {
  const current = createArcadeAnimationClock(state);
  const restart = options.restart !== false;
  return {
    ...current,
    frame: restart ? Math.max(0, Math.floor(finiteNumber(options.frame, 0))) : current.frame,
    elapsed: restart ? 0 : current.elapsed,
    direction: restart ? (options.direction === -1 ? -1 : 1) : current.direction,
    playing: true,
    paused: false,
    completed: false,
    frameAdvances: 0,
    advancedFrames: [],
  };
}

export function advanceArcadeAnimationClock(state, deltaTime, timeline = {}) {
  const current = createArcadeAnimationClock(state);
  const frameCount = Math.max(0, Math.floor(finiteNumber(timeline.frameCount, 0)));
  const delta = Math.max(0, finiteNumber(deltaTime, 0));
  const speed = Math.max(0, finiteNumber(timeline.speed, 1));
  const mode = normalizeAnimationMode(timeline.mode);
  const maxAdvances = Math.max(1, Math.floor(finiteNumber(timeline.maxAdvances, 10_000)));

  if (!current.playing || current.paused || frameCount === 0 || delta === 0 || speed === 0) {
    return current;
  }

  let frame = clampArcadeValue(current.frame, 0, frameCount - 1);
  let elapsed = current.elapsed + delta * speed;
  let direction = current.direction;
  let playing = current.playing;
  let completed = false;
  let frameAdvances = 0;
  const advancedFrames = [];

  if (frameCount === 1 && timeline.singleFrameMode !== 'complete') {
    const duration = resolveAnimationFrameDuration(timeline.frameDuration, 0);
    return {
      ...current,
      frame: 0,
      elapsed: elapsed % duration,
      playing: true,
      completed: false,
      frameAdvances: Math.floor(elapsed / duration),
      advancedFrames: [],
    };
  }

  while (playing && frameAdvances < maxAdvances) {
    const duration = resolveAnimationFrameDuration(timeline.frameDuration, frame);
    if (elapsed < duration) break;
    elapsed -= duration;
    frameAdvances += 1;

    if (mode === 'loop') {
      frame = (frame + 1) % frameCount;
      advancedFrames.push(frame);
      continue;
    }

    if (mode === 'once') {
      if (frame < frameCount - 1) {
        frame += 1;
        advancedFrames.push(frame);
      } else {
        playing = false;
        completed = true;
        elapsed = 0;
      }
      continue;
    }

    if (direction === 1) {
      if (frame < frameCount - 1) {
        frame += 1;
        advancedFrames.push(frame);
      }
      else {
        direction = -1;
        frame = Math.max(0, frameCount - 2);
        advancedFrames.push(frame);
      }
    } else if (frame > 0) {
      frame -= 1;
      advancedFrames.push(frame);
    } else {
      direction = 1;
      frame = Math.min(frameCount - 1, 1);
      advancedFrames.push(frame);
    }
  }

  if (frameAdvances === maxAdvances && playing) {
    elapsed = Math.min(elapsed, resolveAnimationFrameDuration(timeline.frameDuration, frame));
  }

  return {
    ...current,
    frame,
    elapsed,
    direction,
    playing,
    completed,
    frameAdvances,
    advancedFrames,
  };
}

const UINT32_MAX_PLUS_ONE = 0x100000000;

export function hashSeed(seed) {
  const text = String(seed ?? '');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createDeterministicRng(seed = 0) {
  return {
    seed: typeof seed === 'number' && Number.isFinite(seed) ? seed >>> 0 : hashSeed(seed),
    calls: 0,
  };
}

export function nextRng(state) {
  let value = Number.isFinite(state?.seed) ? state.seed >>> 0 : 0;
  value += 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  const seed = value >>> 0;
  const random = ((value ^ (value >>> 14)) >>> 0) / UINT32_MAX_PLUS_ONE;
  return {
    state: {
      seed,
      calls: Math.max(0, Math.floor(finiteNumber(state?.calls, 0))) + 1,
    },
    value: random,
  };
}

export function rngRange(state, minimum, maximum) {
  coreInvariant(Number.isFinite(minimum) && Number.isFinite(maximum), 'rng range bounds must be finite');
  coreInvariant(maximum >= minimum, 'rng range maximum must be greater than or equal to minimum');
  const next = nextRng(state);
  return {
    state: next.state,
    value: minimum + (maximum - minimum) * next.value,
  };
}

export function rngInt(state, minimumInclusive, maximumInclusive) {
  coreInvariant(
    Number.isFinite(minimumInclusive) && Number.isFinite(maximumInclusive),
    'rng integer bounds must be finite',
  );
  const minimum = Math.ceil(minimumInclusive);
  const maximum = Math.floor(maximumInclusive);
  coreInvariant(maximum >= minimum, 'rng integer maximum must be greater than or equal to minimum');
  const next = nextRng(state);
  return {
    state: next.state,
    value: Math.floor(next.value * (maximum - minimum + 1)) + minimum,
  };
}

export function rngPick(state, values) {
  coreInvariant(Array.isArray(values) && values.length > 0, 'cannot pick from an empty deterministic list');
  const picked = rngInt(state, 0, values.length - 1);
  return {
    state: picked.state,
    value: values[picked.value],
    index: picked.value,
  };
}

export function rngWeightedPick(state, values, weightOf = (value) => value?.weight ?? 1) {
  coreInvariant(Array.isArray(values) && values.length > 0, 'cannot pick from an empty weighted list');
  coreInvariant(typeof weightOf === 'function', 'weighted rng requires a weight selector');
  const weights = values.map((value, index) => {
    const weight = Number(weightOf(value, index));
    coreInvariant(Number.isFinite(weight) && weight >= 0, `weighted rng entry ${index} must have a non-negative finite weight`);
    return weight;
  });
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  coreInvariant(totalWeight > 0, 'weighted rng requires at least one positive weight');
  const rolled = rngRange(state, 0, totalWeight);
  let cursor = rolled.value;
  let index = values.length - 1;
  for (let candidate = 0; candidate < values.length; candidate += 1) {
    cursor -= weights[candidate];
    if (cursor < 0) {
      index = candidate;
      break;
    }
  }
  return {
    state: rolled.state,
    value: values[index],
    index,
    roll: rolled.value,
    totalWeight,
  };
}

export function rngShuffle(state, values) {
  coreInvariant(Array.isArray(values), 'rng shuffle values must be an array');
  const shuffled = [...values];
  let nextState = state;
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const picked = rngInt(nextState, 0, index);
    nextState = picked.state;
    [shuffled[index], shuffled[picked.value]] = [shuffled[picked.value], shuffled[index]];
  }
  return { state: nextState, value: shuffled };
}

export function createSeededRandom(seed = 0) {
  let state = createDeterministicRng(seed);
  const random = () => {
    const next = nextRng(state);
    state = next.state;
    return next.value;
  };
  random.snapshot = () => ({ ...state });
  random.restore = (nextState) => {
    state = {
      seed: Number.isFinite(nextState?.seed) ? nextState.seed >>> 0 : 0,
      calls: Math.max(0, Math.floor(finiteNumber(nextState?.calls, 0))),
    };
    return random;
  };
  return random;
}

export function createCooldownState(initial = {}) {
  const cooldowns = {};
  for (const [key, rawRemaining] of Object.entries(initial ?? {})) {
    const remaining = Math.max(0, finiteNumber(rawRemaining, 0));
    if (remaining > 0) cooldowns[key] = remaining;
  }
  return cooldowns;
}

export function startCooldown(state, key, duration) {
  coreInvariant(typeof key === 'string' && key.length > 0, 'cooldown key is required');
  const next = createCooldownState(state);
  const remaining = Math.max(0, finiteNumber(duration, 0));
  if (remaining > 0) next[key] = remaining;
  else delete next[key];
  return next;
}

export function clearCooldown(state, key) {
  const next = createCooldownState(state);
  if (key === undefined) return {};
  delete next[key];
  return next;
}

export function stepCooldownState(state, delta = 1) {
  const elapsed = Math.max(0, finiteNumber(delta, 0));
  if (elapsed === 0) return createCooldownState(state);
  const next = {};
  for (const [key, remaining] of Object.entries(createCooldownState(state))) {
    const stepped = Math.max(0, remaining - elapsed);
    if (stepped > 0) next[key] = stepped;
  }
  return next;
}

export function cooldownRemaining(state, key) {
  return Math.max(0, finiteNumber(state?.[key], 0));
}

export function isCooldownReady(state, key) {
  return cooldownRemaining(state, key) <= 0;
}

export function tryStartCooldown(state, key, duration) {
  const current = createCooldownState(state);
  const remaining = cooldownRemaining(current, key);
  if (remaining > 0) return { started: false, state: current, remaining };
  const next = startCooldown(current, key, duration);
  return { started: true, state: next, remaining: cooldownRemaining(next, key) };
}

export function getElapsedCooldownStatus(now, lastTriggeredAt, duration) {
  const resolvedNow = finiteNumber(now, 0);
  const resolvedLast = finiteNumber(lastTriggeredAt, 0);
  const resolvedDuration = Math.max(0, finiteNumber(duration, 0));
  const elapsed = Math.max(0, resolvedNow - resolvedLast);
  const remaining = Math.max(0, resolvedDuration - elapsed);
  return {
    ready: remaining <= 0,
    elapsed,
    remaining,
    progress: resolvedDuration <= 0 ? 1 : clampNumber(elapsed / resolvedDuration, 0, 1),
  };
}

const DEFAULT_SNAPSHOT_PRECISION = 6;

const ARCADE_SPRITE_DEFAULT_VERSION = '1.0.0';

function isArcadeSpriteRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArcadeSpritePositiveInteger(value) {
  return Number.isInteger(value) && Number(value) > 0;
}

function isArcadeSpriteNonNegativeInteger(value) {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isArcadeSpriteFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validateArcadeSpriteBox(value) {
  return isArcadeSpriteRecord(value)
    && isArcadeSpriteFiniteNumber(value.x)
    && isArcadeSpriteFiniteNumber(value.y)
    && isArcadeSpriteFiniteNumber(value.w)
    && isArcadeSpriteFiniteNumber(value.h)
    && value.w > 0
    && value.h > 0
    && (value.label === undefined || typeof value.label === 'string');
}

function validateArcadeSpriteEvent(value, frameCount) {
  return isArcadeSpriteRecord(value)
    && isArcadeSpriteNonNegativeInteger(value.frame)
    && value.frame < frameCount
    && typeof value.kind === 'string'
    && value.kind.length > 0
    && (value.name === undefined || typeof value.name === 'string')
    && (value.payload === undefined || isArcadeSpriteRecord(value.payload));
}

function validateArcadeSpriteAnimation(value, totalFrames) {
  if (!isArcadeSpriteRecord(value)) return false;
  if (!isArcadeSpritePositiveInteger(value.frames)) return false;
  if (!isArcadeSpriteFiniteNumber(value.fps) || value.fps <= 0) return false;

  const frameCount = Number(value.frames);
  if (value.order !== undefined) {
    if (!Array.isArray(value.order) || value.order.length !== frameCount) return false;
    for (const frame of value.order) {
      if (!isArcadeSpriteNonNegativeInteger(frame) || frame >= totalFrames) return false;
    }
  }
  if (value.loop !== undefined && typeof value.loop !== 'boolean') return false;
  if (value.anchor !== undefined) {
    if (!Array.isArray(value.anchor)
      || value.anchor.length !== 2
      || !value.anchor.every(isArcadeSpriteFiniteNumber)) return false;
  }
  for (const key of ['hitboxes', 'hurtboxes']) {
    if (value[key] !== undefined
      && (!Array.isArray(value[key]) || !value[key].every(validateArcadeSpriteBox))) return false;
  }
  if (value.events !== undefined
    && (!Array.isArray(value.events)
      || !value.events.every((event) => validateArcadeSpriteEvent(event, frameCount)))) return false;
  if (value.tags !== undefined
    && (!Array.isArray(value.tags) || !value.tags.every((tag) => typeof tag === 'string'))) return false;
  return true;
}

function arcadeSpriteSourceSheets(manifest) {
  return manifest.sheets ?? manifest.spriteSheets;
}

/**
 * Validate either the normalized runtime sprite-manifest shape
 * `{ version, sheets }` or Badger's project-data alias
 * `{ schemaVersion, spriteSheets }`.
 */
export function validateArcadeSpriteManifest(manifest) {
  if (!isArcadeSpriteRecord(manifest)) return false;
  if (!(typeof manifest.version === 'string'
    || typeof manifest.schemaVersion === 'string'
    || typeof manifest.schemaVersion === 'number')) return false;

  const sheets = arcadeSpriteSourceSheets(manifest);
  if (!Array.isArray(sheets)) return false;

  const seenIds = new Set();
  for (const sheet of sheets) {
    if (!isArcadeSpriteRecord(sheet)) return false;
    if (typeof sheet.id !== 'string' || sheet.id.length === 0 || seenIds.has(sheet.id)) return false;
    seenIds.add(sheet.id);
    if (typeof sheet.file !== 'string' || sheet.file.length === 0) return false;
    if (!Array.isArray(sheet.frameSize)
      || sheet.frameSize.length !== 2
      || !sheet.frameSize.every(isArcadeSpritePositiveInteger)) return false;

    let totalGridFrames;
    if (sheet.grid !== undefined) {
      if (!isArcadeSpriteRecord(sheet.grid)
        || !isArcadeSpritePositiveInteger(sheet.grid.columns)
        || !isArcadeSpritePositiveInteger(sheet.grid.rows)) return false;
      totalGridFrames = sheet.grid.columns * sheet.grid.rows;
    }

    if (!isArcadeSpriteRecord(sheet.animations) || Object.keys(sheet.animations).length === 0) return false;
    for (const animation of Object.values(sheet.animations)) {
      const frameCount = isArcadeSpriteRecord(animation) && isArcadeSpritePositiveInteger(animation.frames)
        ? animation.frames
        : 0;
      if (!validateArcadeSpriteAnimation(animation, totalGridFrames ?? frameCount)) return false;
    }
    if (sheet.source !== undefined && !isArcadeSpriteRecord(sheet.source)) return false;
  }
  return true;
}

function freezeArcadeSpriteBox(box) {
  return Object.freeze({
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    ...(box.label === undefined ? {} : { label: box.label }),
  });
}

function freezeArcadeSpriteEvent(event) {
  return Object.freeze({
    frame: event.frame,
    kind: event.kind,
    ...(event.name === undefined ? {} : { name: event.name }),
    ...(event.payload === undefined ? {} : { payload: Object.freeze({ ...event.payload }) }),
  });
}

function normalizeArcadeSpriteAnimation(animation) {
  return Object.freeze({
    frames: animation.frames,
    fps: animation.fps,
    ...(animation.order === undefined ? {} : { order: Object.freeze([...animation.order]) }),
    ...(animation.loop === undefined ? {} : { loop: animation.loop }),
    ...(animation.anchor === undefined ? {} : { anchor: Object.freeze([...animation.anchor]) }),
    ...(animation.hitboxes === undefined
      ? {}
      : { hitboxes: Object.freeze(animation.hitboxes.map(freezeArcadeSpriteBox)) }),
    ...(animation.hurtboxes === undefined
      ? {}
      : { hurtboxes: Object.freeze(animation.hurtboxes.map(freezeArcadeSpriteBox)) }),
    ...(animation.events === undefined
      ? {}
      : { events: Object.freeze(animation.events.map(freezeArcadeSpriteEvent)) }),
    ...(animation.tags === undefined ? {} : { tags: Object.freeze([...animation.tags]) }),
  });
}

function normalizeArcadeSpriteSheet(sheet) {
  const animations = Object.fromEntries(
    Object.entries(sheet.animations).map(([name, animation]) => [name, normalizeArcadeSpriteAnimation(animation)]),
  );
  return Object.freeze({
    id: sheet.id,
    file: sheet.file,
    frameSize: Object.freeze([...sheet.frameSize]),
    ...(sheet.grid === undefined
      ? {}
      : { grid: Object.freeze({ columns: sheet.grid.columns, rows: sheet.grid.rows }) }),
    animations: Object.freeze(animations),
    ...(sheet.source === undefined ? {} : { source: Object.freeze({ ...sheet.source }) }),
  });
}

export function normalizeArcadeSpriteManifest(manifest) {
  if (!validateArcadeSpriteManifest(manifest)) throw new Error('Invalid arcade sprite manifest');
  const sheets = arcadeSpriteSourceSheets(manifest).map(normalizeArcadeSpriteSheet);
  return Object.freeze({
    version: String(manifest.version ?? manifest.schemaVersion ?? ARCADE_SPRITE_DEFAULT_VERSION),
    sheets: Object.freeze(sheets),
  });
}

/** Resolve one local animation frame to its source rectangle and anchor. */
export function resolveArcadeSpriteFrame(sheet, animationName, frameIndex) {
  const animation = sheet?.animations?.[animationName];
  if (!animation || !Array.isArray(sheet.frameSize) || animation.frames <= 0) return null;
  const localFrame = Math.max(0, Math.floor(finiteNumber(frameIndex, 0))) % animation.frames;
  const absoluteFrame = animation.order?.[localFrame] ?? localFrame;
  const [frameWidth, frameHeight] = sheet.frameSize;
  let sourceX;
  let sourceY;
  if (sheet.grid) {
    sourceX = (absoluteFrame % sheet.grid.columns) * frameWidth;
    sourceY = Math.floor(absoluteFrame / sheet.grid.columns) * frameHeight;
  } else {
    const animationRow = Object.keys(sheet.animations).indexOf(animationName);
    if (animationRow < 0) return null;
    sourceX = absoluteFrame * frameWidth;
    sourceY = animationRow * frameHeight;
  }
  const [anchorX, anchorY] = animation.anchor ?? [frameWidth / 2, frameHeight];
  return Object.freeze({
    sheetId: sheet.id,
    animationName,
    localFrame,
    absoluteFrame,
    sourceX,
    sourceY,
    frameWidth,
    frameHeight,
    anchorX,
    anchorY,
    pivotX: anchorX / frameWidth,
    pivotY: anchorY / frameHeight,
    anchorUnits: 'pixels',
  });
}

/** Compile a sheet animation into the animation-clock and renderer-neutral clip IR. */
export function compileArcadeSpriteClip(sheet, animationName) {
  const animation = sheet?.animations?.[animationName];
  if (!animation) return null;
  const frameDuration = 1 / animation.fps;
  const frames = [];
  for (let index = 0; index < animation.frames; index += 1) {
    const address = resolveArcadeSpriteFrame(sheet, animationName, index);
    if (!address) return null;
    frames.push(Object.freeze({ frameIndex: index, duration: frameDuration, address }));
  }
  return Object.freeze({
    id: `${sheet.id}:${animationName}`,
    sheetId: sheet.id,
    animationName,
    frameCount: animation.frames,
    fps: animation.fps,
    frameDuration,
    frameDurationMs: frameDuration * 1000,
    mode: animation.loop === false ? 'once' : 'loop',
    anchor: Object.freeze([...(animation.anchor ?? [sheet.frameSize[0] / 2, sheet.frameSize[1]])]),
    hitboxes: Object.freeze([...(animation.hitboxes ?? [])]),
    hurtboxes: Object.freeze([...(animation.hurtboxes ?? [])]),
    tags: Object.freeze([...(animation.tags ?? [])]),
    frames: Object.freeze(frames),
  });
}

/**
 * Select events for every frame actually crossed by an animation clock.
 * Repeated frame indexes intentionally repeat their events after loop wrap.
 */
export function collectArcadeSpriteAnimationEvents(animation, advancedFrames = []) {
  if (!animation || !Array.isArray(advancedFrames) || !Array.isArray(animation.events)) return Object.freeze([]);
  const byFrame = new Map();
  for (const event of animation.events) {
    const list = byFrame.get(event.frame) ?? [];
    list.push(event);
    byFrame.set(event.frame, list);
  }
  const selected = [];
  for (const frame of advancedFrames) {
    for (const event of byFrame.get(frame) ?? []) selected.push(event);
  }
  return Object.freeze(selected);
}

export function createArcadeSpriteManifestIndex(manifest) {
  const normalized = normalizeArcadeSpriteManifest(manifest);
  const sheets = new Map(normalized.sheets.map((sheet) => [sheet.id, sheet]));
  return Object.freeze({
    manifest: normalized,
    size: sheets.size,
    ids: Object.freeze([...sheets.keys()]),
    has: (id) => sheets.has(id),
    get: (id) => sheets.get(id) ?? null,
  });
}

function arcadeSpriteInspectionInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

function arcadeSpriteInspectionFinite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function arcadeSpriteInspectionPositiveInteger(value, label) {
  const resolved = arcadeSpriteInspectionFinite(value, Number.NaN);
  arcadeSpriteInspectionInvariant(
    Number.isInteger(resolved) && resolved > 0,
    `${label} must be a positive integer`,
  );
  return resolved;
}

function arcadeSpriteInspectionNonNegativeInteger(value, label) {
  const resolved = arcadeSpriteInspectionFinite(value, Number.NaN);
  arcadeSpriteInspectionInvariant(
    Number.isInteger(resolved) && resolved >= 0,
    `${label} must be a non-negative integer`,
  );
  return resolved;
}

const arcadeSpriteInspectionAdapterIds = new WeakMap();
let arcadeSpriteInspectionNextAdapterId = 1;

function arcadeSpriteInspectionAdapterKey(adapter) {
  if (typeof adapter !== 'function') return 'none';
  let id = arcadeSpriteInspectionAdapterIds.get(adapter);
  if (id === undefined) {
    id = arcadeSpriteInspectionNextAdapterId;
    arcadeSpriteInspectionNextAdapterId += 1;
    arcadeSpriteInspectionAdapterIds.set(adapter, id);
  }
  return String(id);
}

function arcadeSpriteInspectionFrame(frame = {}) {
  const sourceX = arcadeSpriteInspectionNonNegativeInteger(
    frame.sourceX ?? frame.x ?? 0,
    'sprite frame sourceX',
  );
  const sourceY = arcadeSpriteInspectionNonNegativeInteger(
    frame.sourceY ?? frame.y ?? 0,
    'sprite frame sourceY',
  );
  const frameWidth = arcadeSpriteInspectionPositiveInteger(
    frame.frameWidth ?? frame.width,
    'sprite frame width',
  );
  const frameHeight = arcadeSpriteInspectionPositiveInteger(
    frame.frameHeight ?? frame.height,
    'sprite frame height',
  );
  const absoluteFrame = arcadeSpriteInspectionNonNegativeInteger(
    frame.absoluteFrame ?? frame.index ?? 0,
    'sprite absolute frame',
  );
  const anchor = frame.pivot ?? frame.anchor;
  const explicitPixelAnchor = frame.anchorUnits === 'pixels';
  const rawAnchorX = arcadeSpriteInspectionFinite(
    explicitPixelAnchor
      ? frame.anchorX ?? frame.pivotX ?? anchor?.[0] ?? anchor?.x
      : frame.pivotX ?? frame.anchorX ?? anchor?.[0] ?? anchor?.x,
    explicitPixelAnchor ? frameWidth / 2 : 0.5,
  );
  const rawAnchorY = arcadeSpriteInspectionFinite(
    explicitPixelAnchor
      ? frame.anchorY ?? frame.pivotY ?? anchor?.[1] ?? anchor?.y
      : frame.pivotY ?? frame.anchorY ?? anchor?.[1] ?? anchor?.y,
    explicitPixelAnchor ? frameHeight : 1,
  );
  const legacyPixelAnchor = frame.anchorUnits === undefined
    && frame.pivotX === undefined
    && frame.pivotY === undefined
    && frame.pivot === undefined
    && (Math.abs(rawAnchorX) > 1 || Math.abs(rawAnchorY) > 1);
  const anchorX = explicitPixelAnchor || legacyPixelAnchor ? rawAnchorX / frameWidth : rawAnchorX;
  const anchorY = explicitPixelAnchor || legacyPixelAnchor ? rawAnchorY / frameHeight : rawAnchorY;
  arcadeSpriteInspectionInvariant(sourceX >= 0, 'sprite frame sourceX must be non-negative');
  arcadeSpriteInspectionInvariant(sourceY >= 0, 'sprite frame sourceY must be non-negative');
  arcadeSpriteInspectionInvariant(Number.isFinite(anchorX), 'sprite frame anchorX must be finite');
  arcadeSpriteInspectionInvariant(Number.isFinite(anchorY), 'sprite frame anchorY must be finite');
  return Object.freeze({
    absoluteFrame,
    sourceX,
    sourceY,
    frameWidth,
    frameHeight,
    anchorX,
    anchorY,
    anchorUnits: 'normalized',
  });
}

function arcadeSpriteInspectionSourceSize(source) {
  const width = arcadeSpriteInspectionPositiveInteger(source?.width, 'sprite source width');
  const height = arcadeSpriteInspectionPositiveInteger(source?.height, 'sprite source height');
  return Object.freeze({ width, height });
}

function arcadeSpriteInspectionCacheIdentity(source, frame, options) {
  let sourceKey;
  if (typeof options.cacheKey === 'function') {
    const resolved = options.cacheKey(source, frame);
    sourceKey = resolved === undefined || resolved === null ? null : String(resolved);
  } else if (options.cacheKey !== undefined && options.cacheKey !== null) {
    sourceKey = String(options.cacheKey);
  } else {
    const resolved = source?.cacheKey ?? source?.id;
    sourceKey = resolved === undefined || resolved === null ? null : String(resolved);
  }
  if (sourceKey === null) return null;
  const readPixels = options.readPixels
    ?? source?.readPixels
    ?? source?.getImageData;
  return [
    sourceKey,
    frame.absoluteFrame,
    frame.sourceX,
    frame.sourceY,
    frame.frameWidth,
    frame.frameHeight,
    `read=${arcadeSpriteInspectionAdapterKey(readPixels)}`,
    `process=${arcadeSpriteInspectionAdapterKey(options.processPixels)}`,
  ].join(':');
}

function arcadeSpriteInspectionCacheKey(identity, options) {
  if (identity === null) return null;
  return [
    identity,
    arcadeSpriteInspectionFinite(options.alphaThreshold, 16),
    arcadeSpriteInspectionFinite(options.edgeWidth, -1),
    arcadeSpriteInspectionFinite(options.blankCoverageThreshold, 0.01),
    arcadeSpriteInspectionFinite(options.backgroundLeakCoverageThreshold, 0.72),
    arcadeSpriteInspectionFinite(options.backgroundLeakEdgeThreshold, 0.58),
  ].join(':');
}

function arcadeSpriteInspectionCacheGet(cache, key) {
  if (!cache || key === null) return undefined;
  return typeof cache.get === 'function' ? cache.get(key) : undefined;
}

function arcadeSpriteInspectionCacheSet(cache, key, value) {
  if (!cache || key === null || typeof cache.set !== 'function') return;
  cache.set(key, value);
}

function arcadeSpriteInspectionNormalizePixels(value, expectedWidth, expectedHeight) {
  arcadeSpriteInspectionInvariant(value && value.data !== undefined, 'sprite pixel adapter returned no data');
  const width = arcadeSpriteInspectionPositiveInteger(value.width, 'sprite pixel width');
  const height = arcadeSpriteInspectionPositiveInteger(value.height, 'sprite pixel height');
  arcadeSpriteInspectionInvariant(
    width === expectedWidth && height === expectedHeight,
    `sprite pixel adapter returned ${width}x${height}; expected ${expectedWidth}x${expectedHeight}`,
  );
  arcadeSpriteInspectionInvariant(
    typeof value.data.length === 'number' && value.data.length >= width * height * 4,
    'sprite pixel data must contain RGBA values for every pixel',
  );
  return Object.freeze({ data: value.data, width, height });
}

function arcadeSpriteInspectionExtractPixels(source, sourceSize, frame) {
  arcadeSpriteInspectionInvariant(
    source?.data !== undefined,
    'sprite frame inspection requires source RGBA data or an injected readPixels adapter',
  );
  arcadeSpriteInspectionInvariant(
    typeof source.data.length === 'number' && source.data.length >= sourceSize.width * sourceSize.height * 4,
    'sprite source data must contain RGBA values for every source pixel',
  );
  const data = new Uint8ClampedArray(frame.frameWidth * frame.frameHeight * 4);
  for (let y = 0; y < frame.frameHeight; y += 1) {
    const sourceOffset = ((frame.sourceY + y) * sourceSize.width + frame.sourceX) * 4;
    const targetOffset = y * frame.frameWidth * 4;
    for (let x = 0; x < frame.frameWidth * 4; x += 1) {
      data[targetOffset + x] = source.data[sourceOffset + x] ?? 0;
    }
  }
  return Object.freeze({ data, width: frame.frameWidth, height: frame.frameHeight });
}

function arcadeSpriteInspectionReadPixels(source, sourceSize, frame, options, cacheIdentity) {
  const processedKey = cacheIdentity === null ? null : `${cacheIdentity}:processed`;
  const cached = arcadeSpriteInspectionCacheGet(options.processedFrameCache, processedKey);
  if (cached !== undefined) {
    return arcadeSpriteInspectionNormalizePixels(cached, frame.frameWidth, frame.frameHeight);
  }

  const rectangle = Object.freeze({
    x: frame.sourceX,
    y: frame.sourceY,
    width: frame.frameWidth,
    height: frame.frameHeight,
  });
  let pixels;
  if (typeof options.readPixels === 'function') {
    pixels = options.readPixels(source, rectangle, frame);
  } else if (typeof source?.readPixels === 'function') {
    pixels = source.readPixels(rectangle, frame);
  } else if (typeof source?.getImageData === 'function') {
    pixels = source.getImageData(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
  } else {
    pixels = arcadeSpriteInspectionExtractPixels(source, sourceSize, frame);
  }
  pixels = arcadeSpriteInspectionNormalizePixels(pixels, frame.frameWidth, frame.frameHeight);
  if (typeof options.processPixels === 'function') {
    const processed = options.processPixels(pixels, Object.freeze({ source, frame, rectangle }));
    if (processed !== undefined) {
      pixels = arcadeSpriteInspectionNormalizePixels(
        processed,
        frame.frameWidth,
        frame.frameHeight,
      );
    }
  }
  arcadeSpriteInspectionCacheSet(options.processedFrameCache, processedKey, pixels);
  return pixels;
}

export function inspectArcadeSpriteFrame(source, rawFrame, options = {}) {
  const frame = arcadeSpriteInspectionFrame(rawFrame);
  const sourceSize = arcadeSpriteInspectionSourceSize(source);
  arcadeSpriteInspectionInvariant(
    frame.sourceX + frame.frameWidth <= sourceSize.width
      && frame.sourceY + frame.frameHeight <= sourceSize.height,
    `sprite frame ${frame.absoluteFrame} source rectangle is outside ${sourceSize.width}x${sourceSize.height}`,
  );

  const cacheIdentity = arcadeSpriteInspectionCacheIdentity(source, frame, options);
  const cacheKey = arcadeSpriteInspectionCacheKey(cacheIdentity, options);
  const cached = arcadeSpriteInspectionCacheGet(options.cache, cacheKey);
  if (cached !== undefined) return cached;

  const pixels = arcadeSpriteInspectionReadPixels(source, sourceSize, frame, options, cacheIdentity);
  const alphaThreshold = Math.max(0, Math.min(255, arcadeSpriteInspectionFinite(options.alphaThreshold, 16)));
  const edgeWidth = options.edgeWidth === undefined
    ? Math.min(2, Math.max(1, Math.floor(Math.min(pixels.width, pixels.height) / 16)))
    : Math.max(0, Math.min(
      Math.min(pixels.width, pixels.height),
      Math.floor(arcadeSpriteInspectionFinite(options.edgeWidth, 0)),
    ));
  const blankCoverageThreshold = Math.max(
    0,
    arcadeSpriteInspectionFinite(options.blankCoverageThreshold, 0.01),
  );
  const backgroundLeakCoverageThreshold = Math.max(
    0,
    arcadeSpriteInspectionFinite(options.backgroundLeakCoverageThreshold, 0.72),
  );
  const backgroundLeakEdgeThreshold = Math.max(
    0,
    arcadeSpriteInspectionFinite(options.backgroundLeakEdgeThreshold, 0.58),
  );

  let opaquePixels = 0;
  let edgePixels = 0;
  let opaqueEdgePixels = 0;
  let minOpaqueX = pixels.width;
  let minOpaqueY = pixels.height;
  let maxOpaqueX = -1;
  let maxOpaqueY = -1;
  for (let y = 0; y < pixels.height; y += 1) {
    for (let x = 0; x < pixels.width; x += 1) {
      const alpha = pixels.data[(y * pixels.width + x) * 4 + 3] ?? 0;
      if (alpha > alphaThreshold) {
        opaquePixels += 1;
        minOpaqueX = Math.min(minOpaqueX, x);
        minOpaqueY = Math.min(minOpaqueY, y);
        maxOpaqueX = Math.max(maxOpaqueX, x);
        maxOpaqueY = Math.max(maxOpaqueY, y);
      }
      const onTopOrSide = edgeWidth > 0
        && (y < edgeWidth || x < edgeWidth || x >= pixels.width - edgeWidth);
      if (onTopOrSide) {
        edgePixels += 1;
        if (alpha > alphaThreshold) opaqueEdgePixels += 1;
      }
    }
  }

  const pixelCount = Math.max(1, pixels.width * pixels.height);
  const opaqueCoverage = opaquePixels / pixelCount;
  const topAndSideEdgeCoverage = opaqueEdgePixels / Math.max(1, edgePixels);
  const transparent = opaquePixels === 0;
  const opaqueBounds = Object.freeze({
    x: transparent ? 0 : minOpaqueX,
    y: transparent ? 0 : minOpaqueY,
    width: transparent ? 0 : maxOpaqueX - minOpaqueX + 1,
    height: transparent ? 0 : maxOpaqueY - minOpaqueY + 1,
  });
  const pivotValid = frame.anchorX >= 0 && frame.anchorX <= 1
    && frame.anchorY >= 0 && frame.anchorY <= 1;
  const blank = opaqueCoverage < blankCoverageThreshold;
  const backgroundLeak = opaqueCoverage > backgroundLeakCoverageThreshold
    || topAndSideEdgeCoverage > backgroundLeakEdgeThreshold;
  const diagnostics = [];
  if (transparent) diagnostics.push('transparent-frame');
  else if (blank) diagnostics.push('low-opaque-coverage');
  if (!pivotValid) diagnostics.push('pivot-outside-frame');
  if (backgroundLeak) diagnostics.push('background-leak');

  const inspection = Object.freeze({
    frameIndex: frame.absoluteFrame,
    width: pixels.width,
    height: pixels.height,
    sourceRect: Object.freeze({
      x: frame.sourceX,
      y: frame.sourceY,
      width: frame.frameWidth,
      height: frame.frameHeight,
    }),
    opaqueBounds,
    opaquePixels,
    opaqueCoverage,
    topAndSideEdgeCoverage,
    boundsValid: true,
    pivotValid,
    transparent,
    opaque: !transparent,
    blank,
    backgroundLeak,
    diagnostics: Object.freeze(diagnostics),
  });
  arcadeSpriteInspectionCacheSet(options.cache, cacheKey, inspection);
  return inspection;
}

function arcadeSpriteVisibleScaleFrames(atlas, options) {
  const frames = options.frames ?? atlas?.frames;
  arcadeSpriteInspectionInvariant(Array.isArray(frames), 'sprite atlas frames must be an array');
  const selected = options.frameIndexes === undefined
    ? frames
    : (() => {
      const indexes = new Set(options.frameIndexes.map((value) => Number(value)));
      return frames.filter((frame, index) => indexes.has(
        Number(frame?.absoluteFrame ?? frame?.index ?? index),
      ));
    })();
  arcadeSpriteInspectionInvariant(selected.length > 0, 'sprite visible scale requires at least one frame');
  return selected;
}

function arcadeSpriteRepresentativeHeight(heights, mode) {
  const ordered = [...heights].sort((left, right) => left - right);
  if (typeof mode === 'function') {
    const value = arcadeSpriteInspectionFinite(mode(Object.freeze(ordered)), Number.NaN);
    arcadeSpriteInspectionInvariant(value > 0, 'sprite visible-height resolver must return a positive value');
    return value;
  }
  if (mode === 'mean') return ordered.reduce((sum, value) => sum + value, 0) / ordered.length;
  if (mode === 'min') return ordered[0];
  if (mode === 'max') return ordered[ordered.length - 1];
  return ordered[Math.floor(ordered.length / 2)];
}

export function resolveArcadeSpriteVisibleScale(atlas, options = {}) {
  const source = options.source ?? atlas?.source ?? atlas?.image;
  arcadeSpriteInspectionInvariant(source, 'sprite atlas source is required');
  const frames = arcadeSpriteVisibleScaleFrames(atlas, options);
  const inspect = options.inspect ?? inspectArcadeSpriteFrame;
  arcadeSpriteInspectionInvariant(typeof inspect === 'function', 'sprite inspection callback must be a function');
  const heights = frames
    .map((frame) => inspect(source, frame, options.inspectionOptions).opaqueBounds.height)
    .filter((height) => Number.isFinite(height) && height > 0);
  const fallbackHeight = arcadeSpriteInspectionFinite(
    options.fallbackVisibleHeight ?? atlas?.frameHeight ?? frames[0]?.frameHeight ?? frames[0]?.height,
    0,
  );
  if (heights.length === 0 && fallbackHeight > 0) heights.push(fallbackHeight);
  arcadeSpriteInspectionInvariant(heights.length > 0, 'sprite atlas has no visible frame height');
  const representativeHeight = arcadeSpriteRepresentativeHeight(
    heights,
    options.representative ?? 'median',
  );
  const targetVisibleHeight = arcadeSpriteInspectionFinite(options.targetVisibleHeight, 1);
  arcadeSpriteInspectionInvariant(targetVisibleHeight > 0, 'target sprite visible height must be positive');
  const multiplier = arcadeSpriteInspectionFinite(options.multiplier, 1);
  arcadeSpriteInspectionInvariant(multiplier >= 0, 'sprite visible scale multiplier must be non-negative');
  const minimum = arcadeSpriteInspectionFinite(options.minimum, 0);
  const maximum = arcadeSpriteInspectionFinite(options.maximum, Number.POSITIVE_INFINITY);
  arcadeSpriteInspectionInvariant(minimum >= 0, 'minimum sprite scale must be non-negative');
  arcadeSpriteInspectionInvariant(maximum >= minimum, 'maximum sprite scale must be at least minimum');
  return Math.max(
    minimum,
    Math.min(maximum, (targetVisibleHeight / representativeHeight) * multiplier),
  );
}

export function createArcadeSpriteFrameGeometry(rawFrame, transform = {}) {
  const frame = arcadeSpriteInspectionFrame(rawFrame);
  const x = arcadeSpriteInspectionFinite(transform.x, 0)
    + arcadeSpriteInspectionFinite(transform.offsetX, 0);
  const y = arcadeSpriteInspectionFinite(transform.y, 0)
    + arcadeSpriteInspectionFinite(transform.offsetY, 0);
  const commonScale = Math.abs(arcadeSpriteInspectionFinite(transform.scale, 1));
  const scaleX = commonScale * Math.abs(arcadeSpriteInspectionFinite(transform.scaleX, 1));
  const scaleY = commonScale * Math.abs(arcadeSpriteInspectionFinite(transform.scaleY, 1));
  const signedScaleX = transform.flipX === true ? -scaleX : scaleX;
  const rawLocalX = -frame.frameWidth * frame.anchorX;
  const rawLocalY = -frame.frameHeight * frame.anchorY;
  const localX = Object.is(rawLocalX, -0) ? 0 : rawLocalX;
  const localY = Object.is(rawLocalY, -0) ? 0 : rawLocalY;
  const firstX = x + localX * signedScaleX;
  const secondX = x + (localX + frame.frameWidth) * signedScaleX;
  const firstY = y + localY * scaleY;
  const secondY = y + (localY + frame.frameHeight) * scaleY;
  const destinationX = Math.min(firstX, secondX);
  const destinationY = Math.min(firstY, secondY);
  const destinationWidth = Math.abs(secondX - firstX);
  const destinationHeight = Math.abs(secondY - firstY);
  return Object.freeze({
    source: Object.freeze({
      x: frame.sourceX,
      y: frame.sourceY,
      width: frame.frameWidth,
      height: frame.frameHeight,
    }),
    local: Object.freeze({
      x: localX,
      y: localY,
      width: frame.frameWidth,
      height: frame.frameHeight,
    }),
    destination: Object.freeze({
      x: destinationX,
      y: destinationY,
      width: destinationWidth,
      height: destinationHeight,
    }),
    pivot: Object.freeze({
      sourceX: frame.frameWidth * frame.anchorX,
      sourceY: frame.frameHeight * frame.anchorY,
      x,
      y,
      destinationX: x - destinationX,
      destinationY: y - destinationY,
    }),
    matrix: Object.freeze({
      a: signedScaleX,
      b: 0,
      c: 0,
      d: scaleY,
      tx: x,
      ty: y,
    }),
    flipX: transform.flipX === true,
    scaleX,
    scaleY,
  });
}

function arcadeSpriteCanvasInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

function arcadeSpriteCanvasFinite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function arcadeSpriteCanvasPositive(value, fallback) {
  const resolved = arcadeSpriteCanvasFinite(value, fallback);
  return resolved > 0 ? resolved : fallback;
}

function arcadeSpriteCanvasFrameDimension(frame, axis) {
  const direct = axis === 'width' ? frame?.frameWidth ?? frame?.width : frame?.frameHeight ?? frame?.height;
  const value = Math.floor(arcadeSpriteCanvasFinite(direct, 0));
  arcadeSpriteCanvasInvariant(value > 0, `sprite canvas frame ${axis} must be positive`);
  return value;
}

function arcadeSpriteCanvasPlacementFrame(frame, placement) {
  if (placement !== 'top-left') return frame;
  return {
    ...frame,
    anchorUnits: 'normalized',
    anchorX: 0,
    anchorY: 0,
    pivotX: 0,
    pivotY: 0,
    anchor: [0, 0],
    pivot: [0, 0],
  };
}

function arcadeSpriteCanvasAssertContext(context) {
  arcadeSpriteCanvasInvariant(context && typeof context.save === 'function', 'sprite canvas context must support save');
  arcadeSpriteCanvasInvariant(typeof context.restore === 'function', 'sprite canvas context must support restore');
  arcadeSpriteCanvasInvariant(typeof context.translate === 'function', 'sprite canvas context must support translate');
  arcadeSpriteCanvasInvariant(typeof context.scale === 'function', 'sprite canvas context must support scale');
  arcadeSpriteCanvasInvariant(typeof context.drawImage === 'function', 'sprite canvas context must support drawImage');
}

/**
 * Draw one atlas frame through a shared Canvas2D transform contract.
 *
 * `placement: 'pivot'` treats x/y as the authored frame pivot and is suitable
 * for fighters and world actors. `placement: 'top-left'` preserves legacy
 * blitter semantics and mirrors around the destination frame rectangle.
 */
export function drawArcadeSpriteCanvasFrame(context, image, rawFrame, options = {}) {
  arcadeSpriteCanvasAssertContext(context);
  arcadeSpriteCanvasInvariant(image, 'sprite canvas image is required');

  const placement = options.placement === 'top-left' ? 'top-left' : 'pivot';
  const frameWidth = arcadeSpriteCanvasFrameDimension(rawFrame, 'width');
  const commonScale = Math.abs(arcadeSpriteCanvasFinite(options.scale, 1));
  const scaleX = Math.abs(arcadeSpriteCanvasFinite(options.scaleX, 1));
  const scaleY = Math.abs(arcadeSpriteCanvasFinite(options.scaleY, 1));
  const horizontalScale = commonScale * scaleX;
  const flipX = options.flipX === true;
  const rawX = arcadeSpriteCanvasFinite(options.x, 0)
    + (placement === 'top-left' && flipX ? frameWidth * horizontalScale : 0);
  const rawY = arcadeSpriteCanvasFinite(options.y, 0);
  const x = options.snapToPixels === true ? Math.round(rawX) : rawX;
  const y = options.snapToPixels === true ? Math.round(rawY) : rawY;
  const frame = arcadeSpriteCanvasPlacementFrame(rawFrame, placement);
  const geometry = createArcadeSpriteFrameGeometry(frame, {
    x,
    y,
    scale: commonScale,
    scaleX,
    scaleY,
    flipX,
  });
  const opacity = Math.max(0, Math.min(1, arcadeSpriteCanvasFinite(options.opacity, 1)));

  context.save();
  try {
    const inheritedAlpha = arcadeSpriteCanvasFinite(context.globalAlpha, 1);
    context.globalAlpha = inheritedAlpha * opacity;
    const smoothing = options.imageSmoothingEnabled ?? options.smoothing;
    if (typeof smoothing === 'boolean') {
      context.imageSmoothingEnabled = smoothing;
    }
    if (typeof options.compositeOperation === 'string' && options.compositeOperation.length > 0) {
      context.globalCompositeOperation = options.compositeOperation;
    }
    context.translate(geometry.matrix.tx, geometry.matrix.ty);
    context.scale(geometry.matrix.a, geometry.matrix.d);
    context.drawImage(
      image,
      geometry.source.x,
      geometry.source.y,
      geometry.source.width,
      geometry.source.height,
      Object.is(geometry.local.x, -0) ? 0 : geometry.local.x,
      Object.is(geometry.local.y, -0) ? 0 : geometry.local.y,
      geometry.local.width,
      geometry.local.height,
    );
  } finally {
    context.restore();
  }
  return geometry;
}

/** Canonical concise alias for the shared Canvas frame renderer. */
export const drawArcadeSpriteCanvas = drawArcadeSpriteCanvasFrame;

function arcadeSpriteContactSheetCells(entries, options) {
  const count = entries.length;
  const columns = Math.max(1, Math.floor(arcadeSpriteCanvasFinite(options.columns, Math.min(6, Math.max(1, count)))));
  const rows = Math.max(1, Math.ceil(count / columns));
  const cellWidth = arcadeSpriteCanvasPositive(options.cellWidth, 176);
  const cellHeight = arcadeSpriteCanvasPositive(options.cellHeight, 176);
  const gap = Math.max(0, arcadeSpriteCanvasFinite(options.gap, 0));
  const padding = Math.max(0, arcadeSpriteCanvasFinite(options.padding, 16));
  const labelHeight = Math.max(0, arcadeSpriteCanvasFinite(options.labelHeight, 28));
  const contentPadding = Math.max(0, arcadeSpriteCanvasFinite(options.contentPadding, padding));
  const width = columns * cellWidth + Math.max(0, columns - 1) * gap;
  const height = rows * cellHeight + Math.max(0, rows - 1) * gap;
  const cells = entries.map((entry, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = column * (cellWidth + gap);
    const y = row * (cellHeight + gap);
    const content = Object.freeze({
      x: x + contentPadding,
      y: y + contentPadding,
      width: Math.max(1, cellWidth - contentPadding * 2),
      height: Math.max(1, cellHeight - labelHeight - contentPadding * 2),
    });
    const frameWidth = entry?.frame ? arcadeSpriteCanvasFrameDimension(entry.frame, 'width') : 1;
    const frameHeight = entry?.frame ? arcadeSpriteCanvasFrameDimension(entry.frame, 'height') : 1;
    const fitScale = Math.min(content.width / frameWidth, content.height / frameHeight);
    const scale = Math.max(0, fitScale * arcadeSpriteCanvasPositive(entry?.scale, 1));
    const drawX = content.x + (content.width - frameWidth * scale) / 2;
    const drawY = content.y + (content.height - frameHeight * scale) / 2;
    const inspectedFrame = entry?.frame ? arcadeSpriteInspectionFrame(entry.frame) : null;
    const sourcePivotX = inspectedFrame ? inspectedFrame.frameWidth * inspectedFrame.anchorX : 0;
    const sourcePivotY = inspectedFrame ? inspectedFrame.frameHeight * inspectedFrame.anchorY : 0;
    return Object.freeze({
      index,
      column,
      row,
      x,
      y,
      width: cellWidth,
      height: cellHeight,
      content,
      label: String(entry?.label ?? entry?.id ?? `frame ${index}`),
      labelBounds: Object.freeze({
        x: x + contentPadding,
        y: y + cellHeight - labelHeight,
        width: Math.max(1, cellWidth - contentPadding * 2),
        height: labelHeight,
      }),
      scale,
      drawX,
      drawY,
      flipX: entry?.flipX === true,
      pivot: Object.freeze({
        x: drawX + (entry?.flipX === true ? frameWidth - sourcePivotX : sourcePivotX) * scale,
        y: drawY + sourcePivotY * scale,
      }),
    });
  });
  return Object.freeze({
    width,
    height,
    columns,
    rows,
    cellWidth,
    cellHeight,
    gap,
    padding,
    labelHeight,
    cells: Object.freeze(cells),
  });
}

/** Create deterministic contact-sheet cell geometry without requiring a DOM. */
export function createArcadeSpriteContactSheetLayout(entries, options = {}) {
  arcadeSpriteCanvasInvariant(Array.isArray(entries), 'sprite contact-sheet entries must be an array');
  return arcadeSpriteContactSheetCells(entries, options);
}

function arcadeSpriteContactSheetStyle(context, property, value) {
  if (value !== undefined && property in context) context[property] = value;
}

/**
 * Draw a visual review contact sheet. Images are provided by the consumer, so
 * loading, chroma processing and URL ownership remain outside the runtime.
 */
export function drawArcadeSpriteContactSheetCanvas(context, entries, options = {}) {
  arcadeSpriteCanvasAssertContext(context);
  arcadeSpriteCanvasInvariant(Array.isArray(entries), 'sprite contact-sheet entries must be an array');
  const layout = createArcadeSpriteContactSheetLayout(entries, options);
  if (options.resizeCanvas === true && context.canvas) {
    context.canvas.width = Math.ceil(layout.width);
    context.canvas.height = Math.ceil(layout.height);
  }
  if (typeof context.clearRect === 'function') {
    context.clearRect(0, 0, layout.width, layout.height);
  }
  if (typeof context.fillRect === 'function' && options.background !== null) {
    arcadeSpriteContactSheetStyle(context, 'fillStyle', options.background ?? '#111318');
    context.fillRect(0, 0, layout.width, layout.height);
  }

  const rendered = [];
  for (const cell of layout.cells) {
    const entry = entries[cell.index];
    const image = entry?.image ?? entry?.source;
    if (!image || !entry.frame) continue;
    if (typeof context.fillRect === 'function') {
      arcadeSpriteContactSheetStyle(context, 'fillStyle', options.cellBackground ?? '#1b1f27');
      context.fillRect(cell.x, cell.y, cell.width, cell.height);
    }
    const scale = Math.min(
      arcadeSpriteCanvasPositive(options.maximumScale, Number.POSITIVE_INFINITY),
      cell.scale,
    );
    const geometry = drawArcadeSpriteCanvasFrame(context, image, entry.frame, {
      x: cell.drawX,
      y: cell.drawY,
      placement: 'top-left',
      scale,
      flipX: entry.flipX === true,
      opacity: entry.opacity,
      imageSmoothingEnabled: options.imageSmoothingEnabled ?? options.smoothing ?? false,
      snapToPixels: options.snapToPixels,
    });

    const showPivot = options.debugPivot ?? options.showPivot ?? true;
    if (showPivot && typeof context.beginPath === 'function') {
      const radius = Math.max(3, arcadeSpriteCanvasFinite(options.pivotRadius, 5));
      arcadeSpriteContactSheetStyle(context, 'fillStyle', options.pivotColor ?? '#ffcf5a');
      context.beginPath();
      if (typeof context.arc === 'function' && typeof context.fill === 'function') {
        context.arc(cell.pivot.x, cell.pivot.y, radius, 0, Math.PI * 2);
        context.fill();
      } else if (
        typeof context.moveTo === 'function'
        && typeof context.lineTo === 'function'
        && typeof context.stroke === 'function'
      ) {
        arcadeSpriteContactSheetStyle(context, 'strokeStyle', options.pivotColor ?? '#ffcf5a');
        context.moveTo(cell.pivot.x - radius, cell.pivot.y);
        context.lineTo(cell.pivot.x + radius, cell.pivot.y);
        context.moveTo(cell.pivot.x, cell.pivot.y - radius);
        context.lineTo(cell.pivot.x, cell.pivot.y + radius);
        context.stroke();
      }
    }
    if ((options.debugFrame ?? true) && typeof context.strokeRect === 'function') {
      arcadeSpriteContactSheetStyle(context, 'strokeStyle', options.cellBorder ?? '#596273');
      arcadeSpriteContactSheetStyle(context, 'lineWidth', 1);
      context.strokeRect(cell.x + 0.5, cell.y + 0.5, cell.width - 1, cell.height - 1);
    }
    if (typeof context.fillText === 'function' && cell.labelBounds.height > 0) {
      arcadeSpriteContactSheetStyle(context, 'fillStyle', options.labelColor ?? '#eef1f6');
      arcadeSpriteContactSheetStyle(context, 'font', options.font ?? '12px monospace');
      arcadeSpriteContactSheetStyle(context, 'textBaseline', 'middle');
      context.fillText(
        cell.label,
        cell.labelBounds.x,
        cell.labelBounds.y + cell.labelBounds.height / 2,
        cell.labelBounds.width,
      );
    }
    rendered.push(Object.freeze({
      index: cell.index,
      geometry,
      scale,
      drawX: cell.drawX,
      drawY: cell.drawY,
    }));
  }
  return Object.freeze({
    ...layout,
    layout,
    rendered: Object.freeze(rendered),
  });
}

function normalizeSnapshotNumber(value, precision) {
  if (!Number.isFinite(value)) return 0;
  const scale = 10 ** precision;
  const rounded = Math.round(value * scale) / scale;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function isPlainSnapshotObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function stableSnapshotValue(value, options, seen, path) {
  const precision = Math.max(0, Math.floor(finiteNumber(options.precision, DEFAULT_SNAPSHOT_PRECISION)));
  const ignore = options.ignoreKeysSet;
  if (value === null) return null;
  if (typeof value === 'number') return normalizeSnapshotNumber(value, precision);
  if (typeof value === 'boolean' || typeof value === 'string') return value;
  coreInvariant(value !== undefined, `snapshot value at ${path} is undefined`);
  coreInvariant(typeof value === 'object', `snapshot value at ${path} must be JSON-compatible`);
  coreInvariant(!seen.has(value), `snapshot value at ${path} contains a cycle`);
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((entry, index) => stableSnapshotValue(entry, options, seen, `${path}[${index}]`));
    }
    coreInvariant(isPlainSnapshotObject(value), `snapshot value at ${path} must be a plain object`);
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      if (ignore.has(key) || value[key] === undefined) continue;
      sorted[key] = stableSnapshotValue(value[key], options, seen, path === '$' ? key : `${path}.${key}`);
    }
    return sorted;
  } finally {
    seen.delete(value);
  }
}

export function stableSnapshot(value, options = {}) {
  return stableSnapshotValue(value, {
    precision: options.precision,
    ignoreKeysSet: new Set(options.ignoreKeys ?? []),
  }, new WeakSet(), '$');
}

export function stableSnapshotString(value, options = {}) {
  return JSON.stringify(stableSnapshot(value, options));
}

export function fnv1a32(input) {
  const text = String(input ?? '');
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function deterministicHash(value, options = {}) {
  return fnv1a32(stableSnapshotString(value, options));
}

function cloneCommandValue(value, path = '$', seen = new WeakSet()) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') {
    coreInvariant(Number.isFinite(value), `command value at ${path} must be finite`);
    return Object.is(value, -0) ? 0 : value;
  }
  coreInvariant(value !== undefined, `command value at ${path} is undefined`);
  coreInvariant(typeof value === 'object', `command value at ${path} must be JSON-compatible`);
  coreInvariant(!seen.has(value), `command value at ${path} contains a cycle`);
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((entry, index) => cloneCommandValue(entry, `${path}[${index}]`, seen));
    }
    coreInvariant(isPlainSnapshotObject(value), `command value at ${path} must be a plain object`);
    const cloned = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] === undefined) continue;
      cloned[key] = cloneCommandValue(value[key], path === '$' ? key : `${path}.${key}`, seen);
    }
    return cloned;
  } finally {
    seen.delete(value);
  }
}

function commandTick(value, label) {
  const tick = Number(value);
  coreInvariant(Number.isInteger(tick) && tick >= 0, `${label} must be a non-negative integer`);
  return tick;
}

function normalizeCommandStream(stream) {
  coreInvariant(stream && typeof stream === 'object', 'command stream must be an object');
  coreInvariant(Number(stream.version) === 1, 'command stream version must be 1');
  const startTick = commandTick(stream.startTick ?? 0, 'command stream startTick');
  const endTick = commandTick(stream.endTick ?? startTick, 'command stream endTick');
  coreInvariant(endTick >= startTick, 'command stream endTick must not precede startTick');
  coreInvariant(Array.isArray(stream.entries), 'command stream entries must be an array');
  let previousTick = startTick;
  let previousSequence = -1;
  const entries = stream.entries.map((entry, index) => {
    coreInvariant(entry && typeof entry === 'object', `command entry ${index} must be an object`);
    const tick = commandTick(entry.tick, `command entry ${index} tick`);
    const sequence = commandTick(entry.sequence ?? index, `command entry ${index} sequence`);
    coreInvariant(tick >= startTick && tick <= endTick, `command entry ${index} tick is outside the stream range`);
    coreInvariant(tick >= previousTick, `command entry ${index} tick must be monotonic`);
    coreInvariant(sequence > previousSequence, `command entry ${index} sequence must be strictly increasing`);
    previousTick = tick;
    previousSequence = sequence;
    return { tick, sequence, command: cloneCommandValue(entry.command) };
  });
  return {
    version: 1,
    startTick,
    endTick,
    metadata: stream.metadata === undefined ? null : cloneCommandValue(stream.metadata),
    entries,
  };
}

export function createCommandRecorder(options = {}) {
  const originTick = commandTick(options.startTick ?? 0, 'command recorder startTick');
  const capacity = options.capacity === undefined
    ? Number.POSITIVE_INFINITY
    : Math.max(0, Math.floor(finiteNumber(options.capacity, 0)));
  const metadata = options.metadata === undefined ? null : cloneCommandValue(options.metadata);
  let tick = originTick;
  let sequence = 0;
  let entries = [];

  const recorder = {
    record(command, atTick = tick) {
      const resolvedTick = commandTick(atTick, 'command tick');
      const previousTick = entries.at(-1)?.tick ?? originTick;
      coreInvariant(resolvedTick >= previousTick, 'recorded command ticks must be monotonic');
      const entry = {
        tick: resolvedTick,
        sequence: sequence++,
        command: cloneCommandValue(command),
      };
      if (capacity > 0) {
        entries.push(entry);
        if (entries.length > capacity) entries.splice(0, entries.length - capacity);
      }
      tick = Math.max(tick, resolvedTick);
      return { ...entry, command: cloneCommandValue(entry.command) };
    },
    advance(amount = 1) {
      const delta = commandTick(amount, 'command recorder advance');
      tick += delta;
      return tick;
    },
    setTick(nextTick) {
      const resolvedTick = commandTick(nextTick, 'command recorder tick');
      const minimum = entries.at(-1)?.tick ?? originTick;
      coreInvariant(resolvedTick >= minimum, 'command recorder tick cannot move before recorded commands');
      tick = resolvedTick;
      return tick;
    },
    snapshot() {
      return normalizeCommandStream({
        version: 1,
        startTick: entries[0]?.tick ?? originTick,
        endTick: Math.max(tick, entries.at(-1)?.tick ?? originTick),
        metadata,
        entries,
      });
    },
    serialize() {
      return serializeCommandStream(recorder.snapshot());
    },
    clear(nextTick = originTick) {
      tick = commandTick(nextTick, 'command recorder clear tick');
      sequence = 0;
      entries = [];
      return recorder;
    },
    get tick() {
      return tick;
    },
    get size() {
      return entries.length;
    },
  };
  return recorder;
}

export function serializeCommandStream(stream) {
  return JSON.stringify(normalizeCommandStream(stream));
}

export function parseCommandStream(serialized) {
  coreInvariant(typeof serialized === 'string', 'serialized command stream must be a string');
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    throw new Error(`@arcade/runtime: invalid command stream JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return normalizeCommandStream(parsed);
}

export function replayCommandStream(options = {}) {
  coreInvariant(typeof options.reduce === 'function', 'command replay requires a reduce function');
  const stream = typeof options.stream === 'string'
    ? parseCommandStream(options.stream)
    : normalizeCommandStream(options.stream);
  const snapshotState = options.snapshot ?? ((state) => state);
  coreInvariant(typeof snapshotState === 'function', 'command replay snapshot must be a function');
  let state = options.cloneInitialState ? options.cloneInitialState(options.initialState) : options.initialState;
  const frames = [];
  for (const [index, entry] of stream.entries.entries()) {
    const context = Object.freeze({
      index,
      tick: entry.tick,
      sequence: entry.sequence,
      command: entry.command,
      stream,
    });
    state = options.reduce(state, cloneCommandValue(entry.command), context);
    const snapshot = stableSnapshot(snapshotState(state, context), options.hashOptions);
    frames.push({
      index,
      tick: entry.tick,
      sequence: entry.sequence,
      hash: fnv1a32(JSON.stringify(snapshot)),
      ...(options.includeSnapshots ? { snapshot } : {}),
    });
  }
  return {
    stream,
    finalState: state,
    frames,
    finalHash: frames.at(-1)?.hash ?? deterministicHash(snapshotState(state, Object.freeze({
      index: -1,
      tick: stream.startTick,
      sequence: -1,
      command: null,
      stream,
    })), options.hashOptions),
  };
}

export function verifyReplayHashes(actual, expectedHashes) {
  const frames = Array.isArray(actual) ? actual : actual?.frames ?? [];
  coreInvariant(Array.isArray(frames), 'replay frames must be an array');
  coreInvariant(Array.isArray(expectedHashes), 'expected replay hashes must be an array');
  const mismatches = [];
  const count = Math.max(frames.length, expectedHashes.length);
  for (let index = 0; index < count; index += 1) {
    const frame = frames[index];
    const actualHash = frame?.hash ?? frame?.frameHash ?? '<missing>';
    const expectedHash = expectedHashes[index] ?? '<missing>';
    if (actualHash !== expectedHash) mismatches.push({ index, expected: expectedHash, actual: actualHash });
  }
  return mismatches;
}

function snapshotPathMatches(path, ignorePaths) {
  return ignorePaths.some((ignore) => path === ignore || path.startsWith(`${ignore}.`) || path.startsWith(`${ignore}[`));
}

function snapshotObjectKeys(left, right) {
  const keys = new Set();
  if (isPlainSnapshotObject(left)) for (const key of Object.keys(left)) keys.add(key);
  if (isPlainSnapshotObject(right)) for (const key of Object.keys(right)) keys.add(key);
  return [...keys].sort((a, b) => a.localeCompare(b));
}

function diffSnapshotValues(left, right, path, ignorePaths, entries) {
  if (path && snapshotPathMatches(path, ignorePaths)) return;
  if (JSON.stringify(left) === JSON.stringify(right)) return;
  const leftIsArray = Array.isArray(left);
  const rightIsArray = Array.isArray(right);
  if (leftIsArray || rightIsArray) {
    const count = Math.max(leftIsArray ? left.length : 0, rightIsArray ? right.length : 0);
    for (let index = 0; index < count; index += 1) {
      diffSnapshotValues(leftIsArray ? left[index] : undefined, rightIsArray ? right[index] : undefined, `${path}[${index}]`, ignorePaths, entries);
    }
    return;
  }
  const leftIsObject = isPlainSnapshotObject(left);
  const rightIsObject = isPlainSnapshotObject(right);
  if (leftIsObject || rightIsObject) {
    for (const key of snapshotObjectKeys(left, right)) {
      diffSnapshotValues(leftIsObject ? left[key] : undefined, rightIsObject ? right[key] : undefined, path ? `${path}.${key}` : key, ignorePaths, entries);
    }
    return;
  }
  entries.push({ path, left, right });
}

export function diffSnapshots(input = {}) {
  const left = stableSnapshot(input.left, input.hashOptions);
  const right = stableSnapshot(input.right, input.hashOptions);
  const entries = [];
  diffSnapshotValues(left, right, '', input.ignorePaths ?? [], entries);
  return entries.sort((a, b) => a.path.localeCompare(b.path));
}

export function createEventBus() {
  const listeners = new Map();
  let emittedEvents = 0;

  const bus = {
    on(event, handler) {
      coreInvariant(event !== undefined && event !== null, 'event bus key is required');
      coreInvariant(typeof handler === 'function', 'event bus handler must be a function');
      const handlers = listeners.get(event) ?? new Set();
      handlers.add(handler);
      listeners.set(event, handlers);
      return () => bus.off(event, handler);
    },
    once(event, handler) {
      coreInvariant(typeof handler === 'function', 'event bus once handler must be a function');
      let unsubscribe = () => {};
      const wrapped = (payload) => {
        unsubscribe();
        handler(payload);
      };
      unsubscribe = bus.on(event, wrapped);
      return unsubscribe;
    },
    off(event, handler) {
      if (event === undefined) {
        const hadListeners = listeners.size > 0;
        listeners.clear();
        return hadListeners;
      }
      const handlers = listeners.get(event);
      if (!handlers) return false;
      if (handler === undefined) return listeners.delete(event);
      const removed = handlers.delete(handler);
      if (handlers.size === 0) listeners.delete(event);
      return removed;
    },
    clear(event) {
      return bus.off(event);
    },
    emit(event, payload) {
      emittedEvents += 1;
      const handlers = listeners.get(event);
      if (!handlers) return 0;
      const snapshot = [...handlers];
      for (const handler of snapshot) handler(payload);
      return snapshot.length;
    },
    hasListeners(event) {
      return (listeners.get(event)?.size ?? 0) > 0;
    },
    listenerCount(event) {
      if (event !== undefined) return listeners.get(event)?.size ?? 0;
      let count = 0;
      for (const handlers of listeners.values()) count += handlers.size;
      return count;
    },
    snapshot() {
      const events = [...listeners.entries()]
        .map(([event, handlers]) => ({ event, listeners: handlers.size }))
        .sort((left, right) => String(left.event).localeCompare(String(right.event)));
      return Object.freeze({
        eventCount: events.length,
        listenerCount: events.reduce((total, entry) => total + entry.listeners, 0),
        emittedEvents,
        events: Object.freeze(events.map((entry) => Object.freeze(entry))),
      });
    },
  };
  return bus;
}

export function createRecyclingPool(options = {}) {
  const capacity = Math.floor(finiteNumber(options.capacity, 0));
  coreInvariant(capacity > 0, 'recycling pool capacity must be a positive integer');
  coreInvariant(typeof options.create === 'function', 'recycling pool requires a create function');
  coreInvariant(options.reset === undefined || typeof options.reset === 'function', 'recycling pool reset must be a function');

  const slots = Array.from({ length: capacity }, (_, index) => ({
    value: options.create(index),
    active: false,
    generation: 0,
  }));
  const slotByValue = new Map();
  for (const [index, slot] of slots.entries()) {
    coreInvariant(!slotByValue.has(slot.value), 'recycling pool create function must return unique values');
    slotByValue.set(slot.value, index);
  }

  let cursor = 0;
  let acquired = 0;
  let released = 0;
  let recycled = 0;

  const resetSlot = (slot, index, reason, wasRecycled = false) => {
    options.reset?.(slot.value, Object.freeze({
      index,
      reason,
      recycled: wasRecycled,
      generation: slot.generation,
    }));
  };

  const pool = {
    acquire(initializer) {
      coreInvariant(initializer === undefined || typeof initializer === 'function', 'recycling pool initializer must be a function');
      let index = -1;
      for (let offset = 0; offset < capacity; offset += 1) {
        const candidate = (cursor + offset) % capacity;
        if (!slots[candidate].active) {
          index = candidate;
          break;
        }
      }
      const wasRecycled = index === -1;
      if (wasRecycled) {
        index = cursor;
        recycled += 1;
      }
      const slot = slots[index];
      slot.active = true;
      slot.generation += 1;
      cursor = (index + 1) % capacity;
      acquired += 1;
      resetSlot(slot, index, 'acquire', wasRecycled);
      const context = Object.freeze({
        index,
        recycled: wasRecycled,
        generation: slot.generation,
      });
      initializer?.(slot.value, context);
      return slot.value;
    },
    release(value) {
      const index = slotByValue.get(value);
      if (index === undefined || !slots[index].active) return false;
      const slot = slots[index];
      slot.active = false;
      released += 1;
      resetSlot(slot, index, 'release');
      return true;
    },
    clear() {
      let cleared = 0;
      for (const [index, slot] of slots.entries()) {
        if (!slot.active) continue;
        slot.active = false;
        cleared += 1;
        released += 1;
        resetSlot(slot, index, 'clear');
      }
      return cleared;
    },
    forEachActive(callback) {
      coreInvariant(typeof callback === 'function', 'recycling pool callback must be a function');
      for (const [index, slot] of slots.entries()) {
        if (slot.active) callback(slot.value, index, slot.generation);
      }
    },
    activeValues() {
      return slots.filter((slot) => slot.active).map((slot) => slot.value);
    },
    values() {
      return slots.map((slot) => slot.value);
    },
    isActive(value) {
      const index = slotByValue.get(value);
      return index !== undefined && slots[index].active;
    },
    snapshot() {
      const active = slots.reduce((count, slot) => count + Number(slot.active), 0);
      return Object.freeze({ capacity, active, acquired, released, recycled });
    },
    get capacity() {
      return capacity;
    },
  };
  return pool;
}

function arcadeInteractionInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

function arcadeInteractionFinite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function arcadeInteractionNonNegative(value, label) {
  const resolved = arcadeInteractionFinite(value, Number.NaN);
  arcadeInteractionInvariant(Number.isFinite(resolved) && resolved >= 0, `${label} must be non-negative`);
  return resolved;
}

function arcadeInteractionPositiveInteger(value, label) {
  const resolved = arcadeInteractionFinite(value, Number.NaN);
  arcadeInteractionInvariant(Number.isInteger(resolved) && resolved > 0, `${label} must be a positive integer`);
  return resolved;
}

function freezeBufferedInputQueue(queue) {
  return Object.freeze({
    window: queue.window,
    capacity: queue.capacity,
    nextSequence: queue.nextSequence,
    entries: Object.freeze(queue.entries.map((entry) => Object.freeze({ ...entry }))),
  });
}

function normalizeBufferedInputQueue(queue) {
  arcadeInteractionInvariant(queue && Array.isArray(queue.entries), 'buffered input queue is required');
  return {
    window: arcadeInteractionNonNegative(queue.window, 'buffered input window'),
    capacity: arcadeInteractionPositiveInteger(queue.capacity, 'buffered input capacity'),
    nextSequence: Math.max(0, Math.floor(arcadeInteractionFinite(queue.nextSequence, 0))),
    entries: queue.entries.map((entry, index) => {
      arcadeInteractionInvariant(entry && Object.hasOwn(entry, 'value'), `buffered input entry ${index} requires a value`);
      return {
        value: entry.value,
        at: arcadeInteractionNonNegative(entry.at, `buffered input entry ${index} timestamp`),
        sequence: Math.max(0, Math.floor(arcadeInteractionFinite(entry.sequence, index))),
      };
    }),
  };
}

function sortBufferedInputEntries(entries) {
  return [...entries].sort((left, right) => left.at - right.at || left.sequence - right.sequence);
}

export function createBufferedInputQueue(options = {}) {
  return freezeBufferedInputQueue({
    window: arcadeInteractionNonNegative(options.window ?? 10, 'buffered input window'),
    capacity: arcadeInteractionPositiveInteger(options.capacity ?? 32, 'buffered input capacity'),
    nextSequence: 0,
    entries: [],
  });
}

export function pruneBufferedInputQueue(queue, now) {
  const normalized = normalizeBufferedInputQueue(queue);
  const timestamp = arcadeInteractionNonNegative(now, 'buffered input timestamp');
  const entries = normalized.entries.filter((entry) => entry.at > timestamp || timestamp - entry.at <= normalized.window);
  return freezeBufferedInputQueue({ ...normalized, entries });
}

export function pushBufferedInput(queue, value, at) {
  const normalized = normalizeBufferedInputQueue(queue);
  const timestamp = arcadeInteractionNonNegative(at, 'buffered input timestamp');
  const entries = sortBufferedInputEntries([
    ...normalized.entries,
    { value, at: timestamp, sequence: normalized.nextSequence },
  ]).slice(-normalized.capacity);
  return freezeBufferedInputQueue({
    ...normalized,
    nextSequence: normalized.nextSequence + 1,
    entries,
  });
}

function findBufferedInputEntry(queue, now, options = {}) {
  const predicate = options.predicate ?? (() => true);
  arcadeInteractionInvariant(typeof predicate === 'function', 'buffered input predicate must be a function');
  const eligible = queue.entries.filter((entry) => entry.at <= now && predicate(entry.value, entry));
  if (options.order === 'oldest') return eligible[0] ?? null;
  return eligible[eligible.length - 1] ?? null;
}

export function peekBufferedInput(queue, now, options = {}) {
  const pruned = pruneBufferedInputQueue(queue, now);
  const entry = findBufferedInputEntry(pruned, now, options);
  return Object.freeze({ entry, value: entry?.value ?? null, queue: pruned });
}

export function consumeBufferedInput(queue, now, options = {}) {
  const peeked = peekBufferedInput(queue, now, options);
  if (!peeked.entry) return peeked;
  return Object.freeze({
    entry: peeked.entry,
    value: peeked.value,
    queue: freezeBufferedInputQueue({
      ...normalizeBufferedInputQueue(peeked.queue),
      entries: peeked.queue.entries.filter((entry) => entry.sequence !== peeked.entry.sequence),
    }),
  });
}

function arcadeGridAvailable(itemCount, options) {
  const available = [];
  for (let index = 0; index < itemCount; index += 1) {
    if (options.isAvailable?.(index) === false) continue;
    available.push(index);
  }
  return available;
}

function arcadeGridSequenceMove(current, direction, itemCount, options, availableSet) {
  const delta = direction === 'left' || direction === 'previous' ? -1 : 1;
  for (let step = 1; step <= itemCount; step += 1) {
    let candidate = current + delta * step;
    if (options.wrapX !== false) candidate = ((candidate % itemCount) + itemCount) % itemCount;
    else if (candidate < 0 || candidate >= itemCount) return current;
    if (availableSet.has(candidate)) return candidate;
  }
  return current;
}

function arcadeGridRowCandidates(row, columns, itemCount, availableSet) {
  const start = row * columns;
  const end = Math.min(itemCount, start + columns);
  const candidates = [];
  for (let index = start; index < end; index += 1) {
    if (availableSet.has(index)) candidates.push(index);
  }
  return candidates;
}

export function resolveGridFocusIndex(index, direction, itemCount, options = {}) {
  const count = Math.max(0, Math.floor(arcadeInteractionFinite(itemCount, 0)));
  if (count === 0) return 0;
  arcadeInteractionInvariant(
    ['left', 'right', 'up', 'down', 'next', 'previous'].includes(direction),
    `unknown grid focus direction: ${direction}`,
  );
  const columns = arcadeInteractionPositiveInteger(options.columns ?? 1, 'grid column count');
  const available = arcadeGridAvailable(count, options);
  if (available.length === 0) return 0;
  const availableSet = new Set(available);
  let current = Math.max(0, Math.min(count - 1, Math.floor(arcadeInteractionFinite(index, 0))));
  if (!availableSet.has(current)) current = available[0];

  if (direction === 'next' || direction === 'previous') {
    return arcadeGridSequenceMove(current, direction, count, { ...options, wrapX: options.wrap !== false }, availableSet);
  }
  if (direction === 'left' || direction === 'right') {
    if (options.horizontalMode === 'sequence') {
      return arcadeGridSequenceMove(current, direction, count, options, availableSet);
    }
    const row = Math.floor(current / columns);
    const candidates = arcadeGridRowCandidates(row, columns, count, availableSet);
    const position = candidates.indexOf(current);
    if (position < 0 || candidates.length < 2) return current;
    const delta = direction === 'left' ? -1 : 1;
    let next = position + delta;
    if (options.wrapX !== false) next = (next + candidates.length) % candidates.length;
    else if (next < 0 || next >= candidates.length) return current;
    return candidates[next];
  }

  const rowCount = Math.ceil(count / columns);
  const currentRow = Math.floor(current / columns);
  const preferredColumn = Math.max(
    0,
    Math.min(columns - 1, Math.floor(arcadeInteractionFinite(options.preferredColumn, current % columns))),
  );
  const delta = direction === 'up' ? -1 : 1;
  for (let step = 1; step <= rowCount; step += 1) {
    let row = currentRow + delta * step;
    if (options.wrapY !== false) row = ((row % rowCount) + rowCount) % rowCount;
    else if (row < 0 || row >= rowCount) return current;
    const candidates = arcadeGridRowCandidates(row, columns, count, availableSet);
    if (!candidates.length) continue;
    return candidates.reduce((best, candidate) => {
      const candidateDistance = Math.abs((candidate % columns) - preferredColumn);
      const bestDistance = Math.abs((best % columns) - preferredColumn);
      return candidateDistance < bestDistance || (candidateDistance === bestDistance && candidate < best)
        ? candidate
        : best;
    }, candidates[0]);
  }
  return current;
}

export function createGridFocusNavigator(options = {}) {
  let items = [...(options.items ?? [])];
  let columns = arcadeInteractionPositiveInteger(options.columns ?? 1, 'grid column count');
  const events = options.events ?? createEventBus();
  const isAvailable = (index) => items[index]?.disabled !== true && items[index]?.hidden !== true;
  let focusedIndex = items.findIndex((item, index) => item.id === options.initialId && isAvailable(index));
  if (focusedIndex < 0) focusedIndex = items.findIndex((_item, index) => isAvailable(index));
  let preferredColumn = focusedIndex >= 0 ? focusedIndex % columns : 0;

  const navigator = {
    events,
    setItems(nextItems, nextColumns = columns) {
      const previousId = navigator.current()?.id ?? null;
      items = [...nextItems];
      columns = arcadeInteractionPositiveInteger(nextColumns, 'grid column count');
      focusedIndex = items.findIndex((item, index) => item.id === previousId && isAvailable(index));
      if (focusedIndex < 0) focusedIndex = items.findIndex((_item, index) => isAvailable(index));
      preferredColumn = focusedIndex >= 0 ? focusedIndex % columns : 0;
      return navigator.current();
    },
    current() {
      return focusedIndex >= 0 ? items[focusedIndex] ?? null : null;
    },
    focus(id, reason = 'programmatic') {
      const nextIndex = items.findIndex((item, index) => item.id === id && isAvailable(index));
      if (nextIndex < 0 || nextIndex === focusedIndex) return false;
      const previousId = navigator.current()?.id ?? null;
      focusedIndex = nextIndex;
      preferredColumn = focusedIndex % columns;
      const item = navigator.current();
      events.emit('focus:change', Object.freeze({ previousId, id: item.id, reason, item }));
      return true;
    },
    move(direction) {
      if (focusedIndex < 0) return null;
      const nextIndex = resolveGridFocusIndex(focusedIndex, direction, items.length, {
        columns,
        wrap: options.wrap,
        wrapX: options.wrapX ?? options.wrap,
        wrapY: options.wrapY ?? options.wrap,
        horizontalMode: options.horizontalMode,
        preferredColumn,
        isAvailable,
      });
      const vertical = direction === 'up' || direction === 'down';
      const previousPreferredColumn = preferredColumn;
      navigator.focus(items[nextIndex]?.id, direction);
      if (vertical) preferredColumn = previousPreferredColumn;
      return navigator.current();
    },
    activate() {
      const item = navigator.current();
      if (!item) return false;
      item.onActivate?.(item);
      events.emit('focus:activate', Object.freeze({ id: item.id, item }));
      return true;
    },
    snapshot() {
      return Object.freeze({
        focusedId: navigator.current()?.id ?? null,
        focusedIndex,
        preferredColumn,
        columns,
        items: Object.freeze(items.map((item) => Object.freeze({
          id: item.id,
          disabled: Boolean(item.disabled),
          hidden: Boolean(item.hidden),
        }))),
      });
    },
  };
  return navigator;
}

export function createUiNavigationRepeater(options = {}) {
  const directions = Object.freeze([...(options.directions ?? ['up', 'down', 'left', 'right'])]);
  arcadeInteractionInvariant(directions.length > 0, 'UI navigation repeater requires directions');
  const initialDelay = arcadeInteractionNonNegative(options.initialDelay ?? 18, 'UI repeat initial delay');
  const repeatInterval = arcadeInteractionNonNegative(options.repeatInterval ?? 5, 'UI repeat interval');
  const maximumTriggers = arcadeInteractionPositiveInteger(options.maximumTriggersPerStep ?? 32, 'UI maximum triggers per step');
  const events = options.events ?? createEventBus();
  const states = new Map(directions.map((direction) => [direction, { held: false, untilRepeat: initialDelay }]));

  const repeater = {
    events,
    step(input = {}, delta = 1) {
      const elapsed = arcadeInteractionNonNegative(delta, 'UI navigation delta');
      const pressed = directions.filter((direction) => input[direction] === true);
      const selected = options.mode === 'dominant' ? pressed.slice(0, 1) : pressed;
      const selectedSet = new Set(selected);
      const triggered = [];
      for (const direction of directions) {
        const state = states.get(direction);
        if (!selectedSet.has(direction)) {
          state.held = false;
          state.untilRepeat = initialDelay;
          continue;
        }
        if (!state.held) {
          state.held = true;
          state.untilRepeat = initialDelay;
          triggered.push(direction);
          continue;
        }
        if (repeatInterval === 0 && initialDelay === 0) continue;
        state.untilRepeat -= elapsed;
        while (state.untilRepeat <= 0 && triggered.length < maximumTriggers) {
          triggered.push(direction);
          state.untilRepeat += repeatInterval > 0 ? repeatInterval : Number.POSITIVE_INFINITY;
        }
      }
      for (const direction of triggered) {
        events.emit('ui-navigation:trigger', Object.freeze({ direction, input, delta: elapsed }));
      }
      return Object.freeze(triggered);
    },
    reset(direction) {
      const targets = direction === undefined ? directions : [direction];
      for (const target of targets) {
        const state = states.get(target);
        if (!state) continue;
        state.held = false;
        state.untilRepeat = initialDelay;
      }
      return repeater.snapshot();
    },
    snapshot() {
      return Object.freeze({
        directions,
        initialDelay,
        repeatInterval,
        states: Object.freeze(Object.fromEntries(
          directions.map((direction) => [direction, Object.freeze({ ...states.get(direction) })]),
        )),
      });
    },
  };
  return repeater;
}

function freezeTimelineState(time, nextSequence, entries) {
  return Object.freeze({
    time,
    nextSequence,
    entries: Object.freeze(entries.map((entry) => Object.freeze({ ...entry }))),
  });
}

function sortTimelineEntries(entries) {
  return [...entries].sort((left, right) => left.at - right.at || left.sequence - right.sequence);
}

export function createTimelineQueue(values = [], options = {}) {
  const time = finiteNumber(options.time, 0);
  const getAt = options.getAt ?? ((value) => value?.at);
  coreInvariant(typeof getAt === 'function', 'timeline getAt must be a function');
  const entries = values.map((value, sequence) => ({
    at: finiteNumber(getAt(value, time, sequence), time),
    sequence,
    value,
  }));
  return freezeTimelineState(time, entries.length, sortTimelineEntries(entries));
}

export function enqueueTimelineEntry(state, value, options = {}) {
  coreInvariant(state && Array.isArray(state.entries), 'timeline state is required');
  const time = finiteNumber(state.time, 0);
  const sequence = Math.max(0, Math.floor(finiteNumber(state.nextSequence, state.entries.length)));
  const at = finiteNumber(
    options.at ?? options.getAt?.(value, time, sequence) ?? value?.at,
    time,
  );
  const entries = sortTimelineEntries([...state.entries, { at, sequence, value }]);
  return freezeTimelineState(time, sequence + 1, entries);
}

export function stepTimelineQueue(state, delta) {
  coreInvariant(state && Array.isArray(state.entries), 'timeline state is required');
  const normalizedDelta = finiteNumber(delta, Number.NaN);
  coreInvariant(Number.isFinite(normalizedDelta) && normalizedDelta >= 0, 'timeline delta must be finite and non-negative');
  const nextTime = finiteNumber(state.time, 0) + normalizedDelta;
  const due = [];
  const pending = [];
  for (const entry of state.entries) {
    if (entry.at <= nextTime) due.push(entry);
    else pending.push(entry);
  }
  return Object.freeze({
    state: freezeTimelineState(nextTime, state.nextSequence, pending),
    due: Object.freeze(due.map((entry) => entry.value)),
    pending: Object.freeze(pending.map((entry) => entry.value)),
  });
}

function normalizeTimedEffect(effect = {}) {
  const id = String(effect.id ?? '');
  coreInvariant(id.length > 0, 'timed effect id is required');
  const duration = Math.max(0, finiteNumber(effect.duration, 0));
  const stacks = Math.max(1, Math.floor(finiteNumber(effect.stacks, 1)));
  const maxStacks = Math.max(stacks, Math.floor(finiteNumber(effect.maxStacks, stacks)));
  const tickInterval = Number.isFinite(effect.tickInterval) && effect.tickInterval > 0
    ? Number(effect.tickInterval)
    : undefined;
  return {
    ...effect,
    id,
    kind: String(effect.kind ?? id),
    duration,
    remaining: Math.max(0, finiteNumber(effect.remaining, duration)),
    stacks,
    maxStacks,
    magnitude: finiteNumber(effect.magnitude, 0),
    tickInterval,
    tickTimer: tickInterval === undefined
      ? undefined
      : finiteNumber(effect.tickTimer, tickInterval),
  };
}

function timedEffectMatches(effect, incoming, match) {
  if (match === 'kind') return effect.kind === incoming.kind;
  if (match === 'id-or-kind') return effect.id === incoming.id || effect.kind === incoming.kind;
  return effect.id === incoming.id;
}

export function applyTimedEffect(effects, incoming, options = {}) {
  coreInvariant(Array.isArray(effects), 'timed effects must be an array');
  const normalized = normalizeTimedEffect(incoming);
  const match = options.match ?? 'id';
  const index = effects.findIndex((effect) => timedEffectMatches(effect, normalized, match));
  if (index < 0) {
    const next = [...effects.map(normalizeTimedEffect), normalized];
    return Object.freeze({
      effects: Object.freeze(next),
      event: Object.freeze({ kind: 'applied', effect: Object.freeze({ ...normalized }) }),
    });
  }

  const current = normalizeTimedEffect(effects[index]);
  const merge = options.merge ?? 'replace';
  let nextEffect = normalized;
  let eventKind = 'replaced';
  if (merge === 'stack') {
    const maxStacks = Math.max(current.maxStacks, normalized.maxStacks);
    const remaining = options.refreshDuration === 'incoming'
      ? normalized.duration
      : Math.max(current.remaining, normalized.duration);
    const duration = options.refreshDuration === 'incoming'
      ? normalized.duration
      : Math.max(current.duration, normalized.duration);
    const magnitude = options.magnitude === 'add'
      ? current.magnitude + normalized.magnitude
      : options.magnitude === 'incoming'
        ? normalized.magnitude
        : Math.max(current.magnitude, normalized.magnitude);
    nextEffect = {
      ...current,
      duration,
      remaining,
      stacks: Math.min(maxStacks, current.stacks + normalized.stacks),
      maxStacks,
      magnitude,
      sourceId: normalized.sourceId ?? current.sourceId,
      tickInterval: normalized.tickInterval ?? current.tickInterval,
      tickTimer: current.tickTimer ?? normalized.tickTimer,
    };
    eventKind = 'stacked';
  }

  const next = effects.map(normalizeTimedEffect);
  if (options.position === 'append') {
    next.splice(index, 1);
    next.push(nextEffect);
  } else {
    next[index] = nextEffect;
  }
  return Object.freeze({
    effects: Object.freeze(next),
    event: Object.freeze({ kind: eventKind, effect: Object.freeze({ ...nextEffect }) }),
  });
}

export function stepTimedEffects(effects, delta) {
  coreInvariant(Array.isArray(effects), 'timed effects must be an array');
  const normalizedDelta = finiteNumber(delta, Number.NaN);
  coreInvariant(Number.isFinite(normalizedDelta) && normalizedDelta >= 0, 'timed effect delta must be finite and non-negative');
  const surviving = [];
  const advanced = [];
  const events = [];
  for (const rawEffect of effects) {
    const effect = normalizeTimedEffect(rawEffect);
    const remaining = Math.max(0, effect.remaining - normalizedDelta);
    let tickTimer = effect.tickTimer;
    const tickInterval = effect.tickInterval;
    if (tickInterval !== undefined) {
      tickTimer = finiteNumber(tickTimer, tickInterval) - normalizedDelta;
      let tickIndex = 0;
      while (tickTimer <= 0 && remaining > 0) {
        tickIndex += 1;
        const tickEffect = Object.freeze({ ...effect, remaining, tickTimer });
        events.push(Object.freeze({ kind: 'tick', effect: tickEffect, tickIndex }));
        tickTimer += tickInterval;
        coreInvariant(tickIndex < 10000, 'timed effect produced too many ticks in one step');
      }
    }
    const stepped = Object.freeze({ ...effect, remaining, tickTimer });
    advanced.push(stepped);
    if (remaining > 0) surviving.push(stepped);
    else events.push(Object.freeze({ kind: 'expired', effect: stepped }));
  }
  return Object.freeze({
    effects: Object.freeze(surviving),
    advanced: Object.freeze(advanced),
    events: Object.freeze(events),
  });
}

export function hasTimedEffect(effects, value, options = {}) {
  coreInvariant(Array.isArray(effects), 'timed effects must be an array');
  const field = options.field ?? 'id';
  return effects.some((effect) => effect?.[field] === value && finiteNumber(effect.remaining, 0) > 0);
}

export const ARCADE_ACTION_PHASES = Object.freeze(['startup', 'active', 'recovery', 'done']);
export const ARCADE_ACTION_OUTCOMES = Object.freeze(['none', 'hit', 'block', 'whiff']);

function normalizeActionPhaseDuration(value, name) {
  const duration = finiteNumber(value, Number.NaN);
  coreInvariant(Number.isFinite(duration) && duration >= 0, `action ${name} must be finite and non-negative`);
  return duration;
}

function normalizeActionPhaseDefinition(definition = {}) {
  const id = String(definition.id ?? '');
  coreInvariant(id.length > 0, 'action phase definition id is required');
  return {
    ...definition,
    id,
    startup: normalizeActionPhaseDuration(definition.startup, 'startup'),
    active: normalizeActionPhaseDuration(definition.active, 'active'),
    recovery: normalizeActionPhaseDuration(definition.recovery, 'recovery'),
  };
}

function normalizeActionOutcome(outcome) {
  const normalized = String(outcome ?? 'none');
  coreInvariant(ARCADE_ACTION_OUTCOMES.includes(normalized), `unknown action outcome "${normalized}"`);
  return normalized;
}

function actionPhaseSequence(definition) {
  const phases = [];
  if (definition.startup > 0) phases.push('startup');
  if (definition.active > 0) phases.push('active');
  if (definition.recovery > 0) phases.push('recovery');
  phases.push('done');
  return phases;
}

export function getActionPhase(definition, elapsed) {
  const normalized = normalizeActionPhaseDefinition(definition);
  const time = Math.max(0, finiteNumber(elapsed, Number.NaN));
  coreInvariant(Number.isFinite(time), 'action elapsed time must be finite and non-negative');
  if (time < normalized.startup) return 'startup';
  if (time < normalized.startup + normalized.active) return 'active';
  if (time < normalized.startup + normalized.active + normalized.recovery) return 'recovery';
  return 'done';
}

function actionPhaseBounds(definition, phase) {
  const activeStart = definition.startup;
  const recoveryStart = activeStart + definition.active;
  const doneStart = recoveryStart + definition.recovery;
  if (phase === 'startup') return { start: 0, end: activeStart };
  if (phase === 'active') return { start: activeStart, end: recoveryStart };
  if (phase === 'recovery') return { start: recoveryStart, end: doneStart };
  return { start: doneStart, end: doneStart };
}

export function getActionPhaseProgress(definition, stateOrElapsed) {
  const normalized = normalizeActionPhaseDefinition(definition);
  const elapsed = typeof stateOrElapsed === 'number'
    ? Math.max(0, finiteNumber(stateOrElapsed, Number.NaN))
    : Math.max(0, finiteNumber(stateOrElapsed?.elapsed, Number.NaN));
  coreInvariant(Number.isFinite(elapsed), 'action elapsed time must be finite and non-negative');
  const phase = getActionPhase(normalized, elapsed);
  const bounds = actionPhaseBounds(normalized, phase);
  const duration = Math.max(0, bounds.end - bounds.start);
  const elapsedInPhase = phase === 'done'
    ? 0
    : Math.max(0, Math.min(duration, elapsed - bounds.start));
  return Object.freeze({
    phase,
    elapsed,
    elapsedInPhase,
    duration,
    progress: phase === 'done' ? 1 : duration === 0 ? 1 : elapsedInPhase / duration,
    phaseStart: bounds.start,
    phaseEnd: bounds.end,
    totalDuration: normalized.startup + normalized.active + normalized.recovery,
  });
}

export function createActionPhaseState(definition, options = {}) {
  const normalized = normalizeActionPhaseDefinition(definition);
  const elapsed = Math.max(0, finiteNumber(options.elapsed, 0));
  const lastOutcome = normalizeActionOutcome(options.lastOutcome);
  return Object.freeze({
    actionId: normalized.id,
    elapsed,
    phase: getActionPhase(normalized, elapsed),
    hitConfirmed: options.hitConfirmed === true || lastOutcome === 'hit',
    lastOutcome,
  });
}

export function markActionOutcome(state, outcome = 'hit') {
  coreInvariant(state && typeof state.actionId === 'string', 'action phase state is required');
  const lastOutcome = normalizeActionOutcome(outcome);
  coreInvariant(lastOutcome !== 'none', 'resolved action outcome cannot be none');
  return Object.freeze({
    ...state,
    hitConfirmed: state.hitConfirmed === true || lastOutcome === 'hit',
    lastOutcome,
  });
}

function actionOutcomeRoutes(definition, outcome) {
  if (outcome === 'hit') return definition.onHitCancelInto;
  if (outcome === 'block') return definition.onBlockCancelInto;
  if (outcome === 'whiff') return definition.onWhiffCancelInto;
  return undefined;
}

function appendActionRoutes(target, routes) {
  for (const route of routes ?? []) {
    const normalized = String(route);
    if (normalized.length > 0) target.add(normalized);
  }
}

export function getActionCancelRoutes(definition, state) {
  const normalized = normalizeActionPhaseDefinition(definition);
  coreInvariant(state && state.actionId === normalized.id, `action state does not match definition "${normalized.id}"`);
  const routes = new Set();
  let phaseMatched = false;
  let hitConfirmBlocked = false;

  if (state.phase === 'recovery') {
    phaseMatched = true;
    if (normalized.requiresHitConfirm && !state.hitConfirmed) {
      hitConfirmBlocked = true;
    } else {
      appendActionRoutes(routes, normalized.cancelInto);
      appendActionRoutes(routes, actionOutcomeRoutes(normalized, state.lastOutcome));
    }
  }

  for (const rule of normalized.cancelRules ?? []) {
    const fromPhase = rule.fromPhase ?? 'recovery';
    coreInvariant(ARCADE_ACTION_PHASES.includes(fromPhase), `unknown cancel phase "${fromPhase}"`);
    if (fromPhase !== state.phase) continue;
    phaseMatched = true;
    if (rule.requiresHitConfirm && !state.hitConfirmed) {
      hitConfirmBlocked = true;
      continue;
    }
    const outcomeRoutes = actionOutcomeRoutes(rule, state.lastOutcome);
    if (outcomeRoutes !== undefined) appendActionRoutes(routes, outcomeRoutes);
    else if (rule.into !== undefined) appendActionRoutes(routes, [rule.into]);
  }

  const ordered = [...routes].sort((left, right) => left.localeCompare(right));
  if (ordered.length > 0) return Object.freeze({ allowed: true, routes: Object.freeze(ordered) });
  if (!phaseMatched) return Object.freeze({ allowed: false, routes: Object.freeze([]), reason: 'phase' });
  if (hitConfirmBlocked) {
    return Object.freeze({ allowed: false, routes: Object.freeze([]), reason: 'requires-hit-confirm' });
  }
  return Object.freeze({ allowed: false, routes: Object.freeze([]), reason: 'not-routed' });
}

export function canCancelActionInto(definition, state, nextActionId) {
  return getActionCancelRoutes(definition, state).routes.includes(String(nextActionId));
}

export function isActionPhaseActive(state) {
  return state?.phase === 'active';
}

export function stepActionPhase(definition, state, delta) {
  const normalized = normalizeActionPhaseDefinition(definition);
  coreInvariant(state && state.actionId === normalized.id, `action state does not match definition "${normalized.id}"`);
  const normalizedDelta = finiteNumber(delta, Number.NaN);
  coreInvariant(Number.isFinite(normalizedDelta) && normalizedDelta >= 0, 'action phase delta must be finite and non-negative');
  const previousPhase = getActionPhase(normalized, state.elapsed);
  const elapsed = state.elapsed + normalizedDelta;
  const phase = getActionPhase(normalized, elapsed);
  const sequence = actionPhaseSequence(normalized);
  const previousIndex = sequence.indexOf(previousPhase);
  const nextIndex = sequence.indexOf(phase);
  coreInvariant(previousIndex >= 0 && nextIndex >= previousIndex, 'action phase state cannot move backwards');
  const enteredPhases = sequence.slice(previousIndex + 1, nextIndex + 1);
  const events = enteredPhases.map((enteredPhase) => {
    const bounds = actionPhaseBounds(normalized, enteredPhase);
    return Object.freeze({
      kind: enteredPhase === 'done' ? 'completed' : 'phase-enter',
      phase: enteredPhase,
      actionId: normalized.id,
      elapsed: bounds.start,
    });
  });
  const nextState = Object.freeze({ ...state, elapsed, phase });
  return Object.freeze({
    state: nextState,
    previousPhase,
    enteredPhases: Object.freeze(enteredPhases),
    events: Object.freeze(events),
    becameActive: previousPhase !== 'active' && enteredPhases.includes('active'),
    canCancel: getActionCancelRoutes(normalized, nextState).allowed,
    finished: phase === 'done',
  });
}

function normalizeSystemDependencyList(value) {
  if (value === undefined) return [];
  const entries = Array.isArray(value) ? value : [value];
  return [...new Set(entries.map((entry) => String(entry)).filter(Boolean))];
}

function freezeSystemDescriptor(system) {
  return Object.freeze({
    name: system.name,
    phase: system.phase,
    order: system.order,
    priority: system.priority,
    enabled: system.enabled,
    before: Object.freeze([...system.before]),
    after: Object.freeze([...system.after]),
    sequence: system.sequence,
  });
}

export function createSystemPipeline(options = {}) {
  const phaseNames = options.phases?.length ? [...options.phases] : ['update'];
  coreInvariant(
    phaseNames.every((phase) => typeof phase === 'string' && phase.length > 0),
    'system pipeline phases must be non-empty strings',
  );
  coreInvariant(new Set(phaseNames).size === phaseNames.length, 'system pipeline phases must be unique');
  const phaseOrder = new Map(phaseNames.map((phase, index) => [phase, index]));
  const systems = new Map();
  let registrationSequence = 0;
  let runCount = 0;
  let executionCount = 0;

  const compareSystems = (left, right) => (
    left.order - right.order
    || right.priority - left.priority
    || left.sequence - right.sequence
    || left.name.localeCompare(right.name)
  );

  const orderedPhaseSystems = (phase) => {
    const candidates = [...systems.values()]
      .filter((system) => system.phase === phase)
      .sort(compareSystems);
    const byName = new Map(candidates.map((system) => [system.name, system]));
    const outgoing = new Map(candidates.map((system) => [system.name, new Set()]));
    const indegree = new Map(candidates.map((system) => [system.name, 0]));
    const addEdge = (from, to) => {
      if (from === to || outgoing.get(from)?.has(to)) return;
      coreInvariant(
        byName.has(from),
        `system dependency references unknown system "${from}" in phase "${phase}"`,
      );
      coreInvariant(
        byName.has(to),
        `system dependency references unknown system "${to}" in phase "${phase}"`,
      );
      outgoing.get(from).add(to);
      indegree.set(to, indegree.get(to) + 1);
    };
    for (const system of candidates) {
      for (const target of system.before) addEdge(system.name, target);
      for (const source of system.after) addEdge(source, system.name);
    }
    const ready = candidates.filter((system) => indegree.get(system.name) === 0).sort(compareSystems);
    const ordered = [];
    while (ready.length > 0) {
      const system = ready.shift();
      ordered.push(system);
      for (const target of outgoing.get(system.name)) {
        indegree.set(target, indegree.get(target) - 1);
        if (indegree.get(target) === 0) {
          ready.push(byName.get(target));
          ready.sort(compareSystems);
        }
      }
    }
    coreInvariant(
      ordered.length === candidates.length,
      `system dependency cycle detected in phase "${phase}"`,
    );
    return ordered;
  };

  const orderedSystems = () => phaseNames.flatMap(orderedPhaseSystems);
  const pipeline = {
    add(name, update, systemOptions = {}) {
      coreInvariant(typeof name === 'string' && name.length > 0, 'system name is required');
      coreInvariant(typeof update === 'function', `system "${name}" must be a function`);
      coreInvariant(!systems.has(name), `system "${name}" already exists`);
      const phase = systemOptions.phase ?? phaseNames[0];
      coreInvariant(phaseOrder.has(phase), `unknown system phase "${phase}"`);
      systems.set(name, {
        name,
        update,
        phase,
        order: finiteNumber(systemOptions.order, 0),
        priority: finiteNumber(systemOptions.priority, 0),
        enabled: systemOptions.enabled !== false,
        when: systemOptions.when,
        before: normalizeSystemDependencyList(systemOptions.before),
        after: normalizeSystemDependencyList(systemOptions.after),
        sequence: registrationSequence++,
        executions: 0,
      });
      return () => pipeline.remove(name);
    },
    remove(name) {
      return systems.delete(String(name));
    },
    has(name) {
      return systems.has(String(name));
    },
    setEnabled(name, enabled) {
      const system = systems.get(String(name));
      coreInvariant(system, `unknown system "${name}"`);
      system.enabled = Boolean(enabled);
      return pipeline;
    },
    run(context, runOptions = {}) {
      const selectedPhases = runOptions.phases === undefined
        ? null
        : new Set(Array.isArray(runOptions.phases) ? runOptions.phases : [runOptions.phases]);
      if (selectedPhases) {
        for (const phase of selectedPhases) {
          coreInvariant(phaseOrder.has(phase), `unknown system phase "${phase}"`);
        }
      }
      const skippedPhases = new Set();
      const executed = [];
      const results = [];
      let halted = false;
      runCount += 1;
      for (const system of orderedSystems()) {
        if (selectedPhases && !selectedPhases.has(system.phase)) continue;
        if (skippedPhases.has(system.phase) || !system.enabled) continue;
        if (typeof system.when === 'function' && !system.when(context)) continue;
        const frame = Object.freeze({
          pipeline,
          run: runCount,
          index: executed.length,
          name: system.name,
          phase: system.phase,
        });
        const result = system.update(context, frame);
        system.executions += 1;
        executionCount += 1;
        executed.push(system.name);
        results.push(Object.freeze({ name: system.name, phase: system.phase, result }));
        if (result?.skipPhase === true) skippedPhases.add(system.phase);
        else if (typeof result?.skipPhase === 'string') skippedPhases.add(result.skipPhase);
        for (const phase of result?.skipPhases ?? []) {
          coreInvariant(phaseOrder.has(phase), `unknown skipped system phase "${phase}"`);
          skippedPhases.add(phase);
        }
        if (result?.halt === true) {
          halted = true;
          break;
        }
      }
      return Object.freeze({
        context,
        halted,
        executed: Object.freeze(executed),
        skippedPhases: Object.freeze([...skippedPhases]),
        results: Object.freeze(results),
      });
    },
    names() {
      return orderedSystems().map((system) => system.name);
    },
    snapshot() {
      return Object.freeze({
        phases: Object.freeze([...phaseNames]),
        runs: runCount,
        executions: executionCount,
        systems: Object.freeze(orderedSystems().map((system) => Object.freeze({
          ...freezeSystemDescriptor(system),
          executions: system.executions,
        }))),
      });
    },
  };
  return pipeline;
}

function requireEntityId(value, label = 'entity id') {
  const id = String(value ?? '');
  coreInvariant(id.length > 0, `${label} is required`);
  return id;
}

const ENTITY_COMMAND_KINDS = Object.freeze(['spawn', 'despawn', 'replace', 'patch']);

function requireEntityCommandPolicy(value, allowed, label) {
  const policy = String(value);
  coreInvariant(allowed.includes(policy), `unknown ${label} policy "${policy}"`);
  return policy;
}

function freezeEntityWorldState(revision, nextSequence, entries) {
  return Object.freeze({
    revision,
    nextSequence,
    entities: Object.freeze(entries
      .slice()
      .sort((left, right) => left.sequence - right.sequence || left.id.localeCompare(right.id))
      .map((entry) => Object.freeze({ ...entry }))),
  });
}

function freezeEntityCommandBuffer(nextSequence, commands) {
  return Object.freeze({
    nextSequence,
    commands: Object.freeze(commands
      .slice()
      .sort((left, right) => left.sequence - right.sequence)
      .map((command) => Object.freeze({ ...command }))),
  });
}

function entityIdFor(entity, options = {}) {
  const getId = options.getId ?? ((value) => value?.id);
  coreInvariant(typeof getId === 'function', 'entity getId must be a function');
  return requireEntityId(options.id ?? getId(entity), 'entity id');
}

export function createEntityWorld(entities = [], options = {}) {
  coreInvariant(Array.isArray(entities), 'entity world values must be an array');
  const seen = new Set();
  const entries = entities.map((entity, sequence) => {
    const id = entityIdFor(entity, options);
    coreInvariant(!seen.has(id), `duplicate entity id "${id}"`);
    seen.add(id);
    return { id, sequence, entity };
  });
  return freezeEntityWorldState(
    Math.max(0, Math.floor(finiteNumber(options.revision, 0))),
    entries.length,
    entries,
  );
}

export function createEntityCommandBuffer(commands = [], options = {}) {
  coreInvariant(Array.isArray(commands), 'entity commands must be an array');
  const sequences = new Set();
  const normalized = commands.map((command, index) => {
    coreInvariant(command && typeof command === 'object', 'entity command must be an object');
    coreInvariant(ENTITY_COMMAND_KINDS.includes(command.kind), `unknown entity command kind "${command.kind}"`);
    const sequence = Math.max(0, Math.floor(finiteNumber(command.sequence, index)));
    coreInvariant(!sequences.has(sequence), `duplicate entity command sequence ${sequence}`);
    sequences.add(sequence);
    return {
      ...command,
      sequence,
      id: requireEntityId(command.id, 'entity command id'),
    };
  });
  const nextSequence = Math.max(
    Math.floor(finiteNumber(options.nextSequence, normalized.length)),
    normalized.reduce((maximum, command) => Math.max(maximum, command.sequence + 1), 0),
  );
  return freezeEntityCommandBuffer(nextSequence, normalized);
}

function enqueueEntityCommand(buffer, command) {
  coreInvariant(buffer && Array.isArray(buffer.commands), 'entity command buffer is required');
  const sequence = Math.max(0, Math.floor(finiteNumber(buffer.nextSequence, buffer.commands.length)));
  return freezeEntityCommandBuffer(sequence + 1, [...buffer.commands, { ...command, sequence }]);
}

export function queueEntitySpawn(buffer, entity, options = {}) {
  return enqueueEntityCommand(buffer, {
    kind: 'spawn',
    id: entityIdFor(entity, options),
    entity,
    onDuplicate: requireEntityCommandPolicy(
      options.onDuplicate ?? 'error',
      ['error', 'replace', 'ignore'],
      'duplicate entity',
    ),
  });
}

export function queueEntityDespawn(buffer, id, options = {}) {
  return enqueueEntityCommand(buffer, {
    kind: 'despawn',
    id: requireEntityId(id),
    onMissing: requireEntityCommandPolicy(
      options.onMissing ?? 'ignore',
      ['error', 'ignore'],
      'missing entity',
    ),
  });
}

export function queueEntityReplace(buffer, id, entity, options = {}) {
  return enqueueEntityCommand(buffer, {
    kind: 'replace',
    id: requireEntityId(id),
    entity,
    onMissing: requireEntityCommandPolicy(
      options.onMissing ?? 'error',
      ['error', 'ignore', 'spawn'],
      'missing entity',
    ),
  });
}

export function queueEntityPatch(buffer, id, patch, options = {}) {
  coreInvariant(
    patch && typeof patch === 'object' && !Array.isArray(patch),
    'entity patch must be an object',
  );
  return enqueueEntityCommand(buffer, {
    kind: 'patch',
    id: requireEntityId(id),
    patch: Object.freeze({ ...patch }),
    onMissing: requireEntityCommandPolicy(
      options.onMissing ?? 'error',
      ['error', 'ignore'],
      'missing entity',
    ),
  });
}

function entityCommandEvent(kind, command, values = {}) {
  return Object.freeze({
    kind,
    id: command.id,
    commandKind: command.kind,
    commandSequence: command.sequence,
    ...values,
  });
}

export function flushEntityCommands(world, buffer) {
  coreInvariant(world && Array.isArray(world.entities), 'entity world is required');
  coreInvariant(buffer && Array.isArray(buffer.commands), 'entity command buffer is required');
  const entries = world.entities.map((entry) => ({ ...entry }));
  let nextSequence = Math.max(0, Math.floor(finiteNumber(world.nextSequence, entries.length)));
  let changed = false;
  const events = [];

  const findIndex = (id) => entries.findIndex((entry) => entry.id === id);
  for (const command of buffer.commands) {
    const index = findIndex(command.id);
    if (command.kind === 'spawn') {
      if (index >= 0) {
        if (command.onDuplicate === 'ignore') {
          events.push(entityCommandEvent('ignored', command, { reason: 'duplicate' }));
          continue;
        }
        coreInvariant(command.onDuplicate === 'replace', `duplicate entity id "${command.id}"`);
        const previous = entries[index].entity;
        entries[index] = { ...entries[index], entity: command.entity };
        events.push(entityCommandEvent('replaced', command, { previous, entity: command.entity }));
        changed = true;
        continue;
      }
      entries.push({ id: command.id, sequence: nextSequence++, entity: command.entity });
      events.push(entityCommandEvent('spawned', command, { entity: command.entity }));
      changed = true;
      continue;
    }

    if (command.kind === 'despawn') {
      if (index < 0) {
        coreInvariant(command.onMissing !== 'error', `missing entity id "${command.id}"`);
        events.push(entityCommandEvent('ignored', command, { reason: 'missing' }));
        continue;
      }
      const [removed] = entries.splice(index, 1);
      events.push(entityCommandEvent('despawned', command, { previous: removed.entity }));
      changed = true;
      continue;
    }

    if (index < 0) {
      if (command.onMissing === 'ignore') {
        events.push(entityCommandEvent('ignored', command, { reason: 'missing' }));
        continue;
      }
      if (command.kind === 'replace' && command.onMissing === 'spawn') {
        const entity = command.entity;
        entries.push({ id: command.id, sequence: nextSequence++, entity });
        events.push(entityCommandEvent('spawned', command, { entity }));
        changed = true;
        continue;
      }
      coreInvariant(false, `missing entity id "${command.id}"`);
    }

    const previous = entries[index].entity;
    const entity = command.kind === 'patch'
      ? { ...previous, ...command.patch }
      : command.entity;
    entries[index] = { ...entries[index], entity };
    events.push(entityCommandEvent(command.kind === 'patch' ? 'patched' : 'replaced', command, {
      previous,
      entity,
    }));
    changed = true;
  }

  return Object.freeze({
    world: freezeEntityWorldState(
      Math.max(0, Math.floor(finiteNumber(world.revision, 0))) + (changed ? 1 : 0),
      nextSequence,
      entries,
    ),
    buffer: freezeEntityCommandBuffer(buffer.nextSequence, []),
    events: Object.freeze(events),
    changed,
  });
}

export function getEntityWorldEntry(world, id) {
  coreInvariant(world && Array.isArray(world.entities), 'entity world is required');
  return world.entities.find((entry) => entry.id === String(id));
}

export function getEntityWorldValue(world, id) {
  return getEntityWorldEntry(world, id)?.entity;
}

export function hasEntityWorldValue(world, id) {
  return getEntityWorldEntry(world, id) !== undefined;
}

export function entityWorldIds(world) {
  coreInvariant(world && Array.isArray(world.entities), 'entity world is required');
  return Object.freeze(world.entities.map((entry) => entry.id));
}

export function entityWorldValues(world) {
  coreInvariant(world && Array.isArray(world.entities), 'entity world is required');
  return Object.freeze(world.entities.map((entry) => entry.entity));
}

export function queryEntityWorld(world, options = {}) {
  coreInvariant(world && Array.isArray(world.entities), 'entity world is required');
  const ids = options.ids === undefined ? null : new Set(options.ids.map(String));
  const predicate = options.predicate;
  coreInvariant(predicate === undefined || typeof predicate === 'function', 'entity query predicate must be a function');
  return Object.freeze(world.entities
    .filter((entry) => (!ids || ids.has(entry.id)) && (!predicate || predicate(entry.entity, entry)))
    .map((entry) => entry.entity));
}

export function createEntityRegistry(entities = [], options = {}) {
  let world = createEntityWorld(entities, options);
  let buffer = createEntityCommandBuffer();
  const registry = {
    queueSpawn(entity, commandOptions = {}) {
      buffer = queueEntitySpawn(buffer, entity, { ...commandOptions, getId: options.getId });
      return registry;
    },
    queueDespawn(id, commandOptions = {}) {
      buffer = queueEntityDespawn(buffer, id, commandOptions);
      return registry;
    },
    queueReplace(id, entity, commandOptions = {}) {
      buffer = queueEntityReplace(buffer, id, entity, commandOptions);
      return registry;
    },
    queuePatch(id, patch, commandOptions = {}) {
      buffer = queueEntityPatch(buffer, id, patch, commandOptions);
      return registry;
    },
    flush() {
      const result = flushEntityCommands(world, buffer);
      world = result.world;
      buffer = result.buffer;
      return result;
    },
    reset(nextEntities = []) {
      world = createEntityWorld(nextEntities, options);
      buffer = createEntityCommandBuffer();
      return registry;
    },
    get(id) {
      return getEntityWorldValue(world, id);
    },
    has(id) {
      return hasEntityWorldValue(world, id);
    },
    ids() {
      return entityWorldIds(world);
    },
    values() {
      return entityWorldValues(world);
    },
    query(queryOptions = {}) {
      return queryEntityWorld(world, queryOptions);
    },
    snapshot() {
      return world;
    },
    pending() {
      return buffer;
    },
  };
  return registry;
}

function arcadeGameplayInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

function arcadeGameplayFinite(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function arcadeGameplayNonNegative(value, label) {
  const resolved = arcadeGameplayFinite(value, Number.NaN);
  arcadeGameplayInvariant(Number.isFinite(resolved) && resolved >= 0, `${label} must be non-negative`);
  return resolved;
}

function arcadeGameplayPrecision(value, fallback = 6) {
  const resolved = Math.floor(arcadeGameplayFinite(value, fallback));
  return Math.max(0, Math.min(12, resolved));
}

function arcadeGameplayRound(value, precision = 6) {
  const resolvedPrecision = arcadeGameplayPrecision(precision);
  const factor = 10 ** resolvedPrecision;
  return Number((Math.round((value + Number.EPSILON) * factor) / factor).toFixed(resolvedPrecision));
}

function arcadeGameplayResourceId(value, label = 'resource id') {
  const id = String(value ?? '').trim();
  arcadeGameplayInvariant(id.length > 0, `${label} is required`);
  return id;
}

function normalizeArcadeResourcePool(pool, index = 0) {
  arcadeGameplayInvariant(pool && typeof pool === 'object', `resource pool ${index} must be an object`);
  const id = arcadeGameplayResourceId(pool.id ?? pool.kind, `resource pool ${index} id`);
  const minimum = arcadeGameplayFinite(pool.min ?? pool.minimum, 0);
  const maximum = arcadeGameplayFinite(pool.max ?? pool.maximum, Number.NaN);
  arcadeGameplayInvariant(Number.isFinite(maximum) && maximum >= minimum, `resource pool "${id}" maximum must be at least its minimum`);
  const precision = arcadeGameplayPrecision(pool.precision, 6);
  const value = clampNumber(arcadeGameplayFinite(pool.value, minimum), minimum, maximum);
  return Object.freeze({
    id,
    value: arcadeGameplayRound(value, precision),
    min: minimum,
    max: maximum,
    regenPerUnit: arcadeGameplayNonNegative(pool.regenPerUnit ?? pool.regenPerSecond ?? 0, `resource pool "${id}" regeneration`),
    decayPerUnit: arcadeGameplayNonNegative(pool.decayPerUnit ?? pool.decayPerSecond ?? 0, `resource pool "${id}" decay`),
    precision,
    ...(pool.metadata === undefined ? {} : { metadata: pool.metadata }),
  });
}

function freezeArcadeResourceState(ownerId, revision, pools) {
  return Object.freeze({
    ownerId: String(ownerId ?? ''),
    revision: Math.max(0, Math.floor(arcadeGameplayFinite(revision, 0))),
    pools: Object.freeze(pools.map((pool, index) => normalizeArcadeResourcePool(pool, index))),
  });
}

function normalizeArcadeResourceState(state) {
  arcadeGameplayInvariant(state && Array.isArray(state.pools), 'resource pool state is required');
  const seen = new Set();
  const pools = state.pools.map((pool, index) => {
    const normalized = normalizeArcadeResourcePool(pool, index);
    arcadeGameplayInvariant(!seen.has(normalized.id), `duplicate resource pool "${normalized.id}"`);
    seen.add(normalized.id);
    return normalized;
  });
  return freezeArcadeResourceState(state.ownerId, state.revision, pools);
}

function arcadeResourceEvent(kind, state, pool, amount, before, after, extra = {}) {
  return Object.freeze({
    kind,
    ownerId: state.ownerId,
    resourceId: pool.id,
    amount: arcadeGameplayRound(amount, pool.precision),
    before: arcadeGameplayRound(before, pool.precision),
    after: arcadeGameplayRound(after, pool.precision),
    ...extra,
  });
}

export function createResourcePoolState(ownerId, pools = [], options = {}) {
  arcadeGameplayInvariant(Array.isArray(pools), 'resource pools must be an array');
  return normalizeArcadeResourceState({ ownerId, pools, revision: options.revision ?? 0 });
}

export function getResourcePool(state, resourceId) {
  const normalized = normalizeArcadeResourceState(state);
  const id = arcadeGameplayResourceId(resourceId);
  return normalized.pools.find((pool) => pool.id === id) ?? null;
}

export function getResourceRatio(state, resourceId) {
  const pool = getResourcePool(state, resourceId);
  if (!pool) return 0;
  const span = pool.max - pool.min;
  return span <= 0 ? 1 : clampNumber((pool.value - pool.min) / span, 0, 1);
}

export function stepResourcePools(state, delta, options = {}) {
  const normalized = normalizeArcadeResourceState(state);
  const elapsed = arcadeGameplayNonNegative(delta, 'resource step delta');
  arcadeGameplayInvariant(
    options.canRegenerate === undefined || typeof options.canRegenerate === 'function',
    'resource regeneration predicate must be a function',
  );
  arcadeGameplayInvariant(
    options.canDecay === undefined || typeof options.canDecay === 'function',
    'resource decay predicate must be a function',
  );
  const events = [];
  let changed = false;
  const pools = normalized.pools.map((pool) => {
    let value = pool.value;
    if (pool.regenPerUnit > 0 && value < pool.max && options.canRegenerate?.(pool, normalized) !== false) {
      const before = value;
      value = arcadeGameplayRound(clampNumber(value + pool.regenPerUnit * elapsed, pool.min, pool.max), pool.precision);
      if (value !== before) {
        events.push(arcadeResourceEvent('regenerated', normalized, pool, value - before, before, value));
        changed = true;
      }
    }
    if (pool.decayPerUnit > 0 && value > pool.min && options.canDecay?.(pool, normalized) !== false) {
      const before = value;
      value = arcadeGameplayRound(clampNumber(value - pool.decayPerUnit * elapsed, pool.min, pool.max), pool.precision);
      if (value !== before) {
        events.push(arcadeResourceEvent('decayed', normalized, pool, before - value, before, value));
        changed = true;
      }
    }
    return Object.freeze({ ...pool, value });
  });
  return Object.freeze({
    state: freezeArcadeResourceState(normalized.ownerId, normalized.revision + (changed ? 1 : 0), pools),
    events: Object.freeze(events),
    changed,
  });
}

function normalizeArcadeResourceCosts(costs) {
  arcadeGameplayInvariant(Array.isArray(costs), 'resource costs must be an array');
  return costs.map((cost, index) => {
    arcadeGameplayInvariant(cost && typeof cost === 'object', `resource cost ${index} must be an object`);
    return Object.freeze({
      resourceId: arcadeGameplayResourceId(cost.resourceId ?? cost.id ?? cost.kind, `resource cost ${index} id`),
      amount: arcadeGameplayNonNegative(cost.amount, `resource cost ${index} amount`),
    });
  });
}

function aggregateArcadeResourceCosts(costs) {
  const totals = new Map();
  for (const cost of normalizeArcadeResourceCosts(costs)) {
    totals.set(cost.resourceId, (totals.get(cost.resourceId) ?? 0) + cost.amount);
  }
  return totals;
}

export function canPayResourceCosts(state, costs) {
  const normalized = normalizeArcadeResourceState(state);
  const totals = aggregateArcadeResourceCosts(costs);
  return [...totals].every(([resourceId, amount]) => {
    const pool = normalized.pools.find((candidate) => candidate.id === resourceId);
    return pool !== undefined && pool.value - amount >= pool.min;
  });
}

export function payResourceCosts(state, costs, options = {}) {
  const normalized = normalizeArcadeResourceState(state);
  const normalizedCosts = normalizeArcadeResourceCosts(costs);
  const totals = aggregateArcadeResourceCosts(normalizedCosts);
  const blocked = normalizedCosts.find((cost) => {
    const pool = normalized.pools.find((candidate) => candidate.id === cost.resourceId);
    return pool === undefined || pool.value - (totals.get(cost.resourceId) ?? 0) < pool.min;
  });
  if (blocked) {
    const pool = normalized.pools.find((candidate) => candidate.id === blocked.resourceId);
    const before = pool?.value ?? 0;
    const eventPool = pool ?? normalizeArcadeResourcePool({ id: blocked.resourceId, value: 0, min: 0, max: 0 });
    return Object.freeze({
      state: normalized,
      events: Object.freeze([
        arcadeResourceEvent('blocked', normalized, eventPool, totals.get(blocked.resourceId) ?? blocked.amount, before, before, {
          reason: options.reason ?? 'insufficient-resource',
        }),
      ]),
      ok: false,
    });
  }
  const events = [];
  const pools = normalized.pools.map((pool) => {
    const amount = totals.get(pool.id) ?? 0;
    if (amount <= 0) return pool;
    const before = pool.value;
    const value = arcadeGameplayRound(clampNumber(before - amount, pool.min, pool.max), pool.precision);
    events.push(arcadeResourceEvent('spent', normalized, pool, before - value, before, value, {
      reason: options.reason ?? 'cost',
    }));
    return Object.freeze({ ...pool, value });
  });
  return Object.freeze({
    state: freezeArcadeResourceState(normalized.ownerId, normalized.revision + (events.length > 0 ? 1 : 0), pools),
    events: Object.freeze(events),
    ok: true,
  });
}

export function gainResource(state, resourceId, amount, options = {}) {
  const normalized = normalizeArcadeResourceState(state);
  const id = arcadeGameplayResourceId(resourceId);
  const gain = arcadeGameplayNonNegative(amount, 'resource gain');
  let event = null;
  const pools = normalized.pools.map((pool) => {
    if (pool.id !== id) return pool;
    const before = pool.value;
    const value = arcadeGameplayRound(clampNumber(before + gain, pool.min, pool.max), pool.precision);
    if (value !== before) {
      event = arcadeResourceEvent('gained', normalized, pool, value - before, before, value, {
        reason: options.reason ?? 'gain',
      });
    }
    return Object.freeze({ ...pool, value });
  });
  arcadeGameplayInvariant(normalized.pools.some((pool) => pool.id === id), `unknown resource pool "${id}"`);
  return Object.freeze({
    state: freezeArcadeResourceState(normalized.ownerId, normalized.revision + (event ? 1 : 0), pools),
    events: Object.freeze(event ? [event] : []),
    changed: event !== null,
  });
}

export function setResourceValue(state, resourceId, value, options = {}) {
  const normalized = normalizeArcadeResourceState(state);
  const id = arcadeGameplayResourceId(resourceId);
  const requested = arcadeGameplayFinite(value, Number.NaN);
  arcadeGameplayInvariant(Number.isFinite(requested), 'resource value must be finite');
  let event = null;
  const pools = normalized.pools.map((pool) => {
    if (pool.id !== id) return pool;
    const before = pool.value;
    const next = arcadeGameplayRound(clampNumber(requested, pool.min, pool.max), pool.precision);
    if (next !== before) {
      event = arcadeResourceEvent('set', normalized, pool, Math.abs(next - before), before, next, {
        reason: options.reason ?? 'set',
      });
    }
    return Object.freeze({ ...pool, value: next });
  });
  arcadeGameplayInvariant(normalized.pools.some((pool) => pool.id === id), `unknown resource pool "${id}"`);
  return Object.freeze({
    state: freezeArcadeResourceState(normalized.ownerId, normalized.revision + (event ? 1 : 0), pools),
    events: Object.freeze(event ? [event] : []),
    changed: event !== null,
  });
}

function freezeGameplayActionState(state) {
  return Object.freeze({
    ownerId: String(state.ownerId ?? ''),
    cooldowns: Object.freeze({ ...createCooldownState(state.cooldowns) }),
    resources: normalizeArcadeResourceState(state.resources),
    queuedActionId: state.queuedActionId === undefined || state.queuedActionId === null
      ? null
      : String(state.queuedActionId),
    queueRemaining: arcadeGameplayNonNegative(state.queueRemaining ?? 0, 'gameplay action queue remaining'),
    revision: Math.max(0, Math.floor(arcadeGameplayFinite(state.revision, 0))),
  });
}

export function createGameplayActionState(ownerId, resources, options = {}) {
  return freezeGameplayActionState({
    ownerId,
    resources,
    cooldowns: options.cooldowns ?? {},
    queuedActionId: options.queuedActionId ?? null,
    queueRemaining: options.queueRemaining ?? 0,
    revision: options.revision ?? 0,
  });
}

function arcadeGameplayActionEvent(kind, state, actionId, extra = {}) {
  return Object.freeze({
    kind,
    ownerId: state.ownerId,
    ...(actionId === undefined || actionId === null ? {} : { actionId: String(actionId) }),
    ...extra,
  });
}

function normalizeGameplayActionDefinition(action) {
  arcadeGameplayInvariant(action && typeof action === 'object', 'gameplay action definition is required');
  const id = String(action.id ?? '').trim();
  arcadeGameplayInvariant(id.length > 0, 'gameplay action id is required');
  return Object.freeze({
    id,
    cooldown: arcadeGameplayNonNegative(action.cooldown ?? 0, `gameplay action "${id}" cooldown`),
    costs: Object.freeze(normalizeArcadeResourceCosts(action.costs ?? [])),
    queueWindow: arcadeGameplayNonNegative(action.queueWindow ?? 0, `gameplay action "${id}" queue window`),
    ...(action.metadata === undefined ? {} : { metadata: action.metadata }),
  });
}

export function stepGameplayActionState(state, delta, options = {}) {
  const normalized = freezeGameplayActionState(state);
  const elapsed = arcadeGameplayNonNegative(delta, 'gameplay action delta');
  const resourceStep = stepResourcePools(normalized.resources, elapsed, options.resources);
  const cooldowns = stepCooldownState(normalized.cooldowns, elapsed);
  const previousQueue = normalized.queueRemaining;
  const queueRemaining = Math.max(0, previousQueue - elapsed);
  const queueExpired = normalized.queuedActionId !== null && previousQueue > 0 && queueRemaining === 0;
  const events = [
    ...resourceStep.events.map((resourceEvent) =>
      arcadeGameplayActionEvent('resource', normalized, null, { resourceEvent })),
    ...(queueExpired
      ? [arcadeGameplayActionEvent('queue-expired', normalized, normalized.queuedActionId)]
      : []),
  ];
  const changed =
    resourceStep.changed ||
    Object.keys(cooldowns).length !== Object.keys(normalized.cooldowns).length ||
    Object.entries(cooldowns).some(([id, value]) => value !== normalized.cooldowns[id]) ||
    queueRemaining !== normalized.queueRemaining ||
    queueExpired;
  return Object.freeze({
    state: freezeGameplayActionState({
      ownerId: normalized.ownerId,
      cooldowns,
      resources: resourceStep.state,
      queuedActionId: queueExpired ? null : normalized.queuedActionId,
      queueRemaining: queueExpired ? 0 : queueRemaining,
      revision: normalized.revision + (changed ? 1 : 0),
    }),
    events: Object.freeze(events),
    changed,
  });
}

export function tryStartGameplayAction(state, rawAction, options = {}) {
  const normalized = freezeGameplayActionState(state);
  const action = normalizeGameplayActionDefinition(rawAction);
  const cooldownRemaining = normalized.cooldowns[action.id] ?? 0;
  if (cooldownRemaining > 0) {
    if (options.queueIfBlocked === true && action.queueWindow > 0) {
      return Object.freeze({
        state: freezeGameplayActionState({
          ...normalized,
          queuedActionId: action.id,
          queueRemaining: action.queueWindow,
          revision: normalized.revision + 1,
        }),
        events: Object.freeze([arcadeGameplayActionEvent('queued', normalized, action.id, {
          remaining: cooldownRemaining,
        })]),
        ok: false,
        reason: 'cooldown',
      });
    }
    return Object.freeze({
      state: normalized,
      events: Object.freeze([arcadeGameplayActionEvent('cooldown', normalized, action.id, {
        remaining: cooldownRemaining,
      })]),
      ok: false,
      reason: 'cooldown',
    });
  }

  const paid = payResourceCosts(normalized.resources, action.costs, {
    reason: options.reason ?? `action:${action.id}`,
  });
  if (!paid.ok) {
    return Object.freeze({
      state: freezeGameplayActionState({ ...normalized, resources: paid.state }),
      events: Object.freeze([
        arcadeGameplayActionEvent('blocked', normalized, action.id),
        ...paid.events.map((resourceEvent) =>
          arcadeGameplayActionEvent('resource', normalized, action.id, { resourceEvent })),
      ]),
      ok: false,
      reason: 'resource',
    });
  }

  const cooldowns = action.cooldown > 0
    ? startCooldown(normalized.cooldowns, action.id, action.cooldown)
    : createCooldownState(normalized.cooldowns);
  return Object.freeze({
    state: freezeGameplayActionState({
      ownerId: normalized.ownerId,
      cooldowns,
      resources: paid.state,
      queuedActionId: null,
      queueRemaining: 0,
      revision: normalized.revision + 1,
    }),
    events: Object.freeze([
      arcadeGameplayActionEvent('started', normalized, action.id),
      ...paid.events.map((resourceEvent) =>
        arcadeGameplayActionEvent('resource', normalized, action.id, { resourceEvent })),
    ]),
    ok: true,
    reason: null,
  });
}

function freezeActionGraceState(state) {
  return Object.freeze({
    graceDuration: arcadeGameplayNonNegative(state.graceDuration, 'action grace duration'),
    bufferDuration: arcadeGameplayNonNegative(state.bufferDuration, 'action buffer duration'),
    graceRemaining: arcadeGameplayNonNegative(state.graceRemaining, 'action grace remaining'),
    bufferRemaining: arcadeGameplayNonNegative(state.bufferRemaining, 'action buffer remaining'),
    revision: Math.max(0, Math.floor(arcadeGameplayFinite(state.revision, 0))),
  });
}

export function createActionGraceState(options = {}) {
  const graceDuration = arcadeGameplayNonNegative(options.graceDuration ?? 0, 'action grace duration');
  const bufferDuration = arcadeGameplayNonNegative(options.bufferDuration ?? 0, 'action buffer duration');
  return freezeActionGraceState({
    graceDuration,
    bufferDuration,
    graceRemaining: Math.min(graceDuration, arcadeGameplayNonNegative(options.graceRemaining ?? 0, 'action grace remaining')),
    bufferRemaining: Math.min(bufferDuration, arcadeGameplayNonNegative(options.bufferRemaining ?? 0, 'action buffer remaining')),
    revision: options.revision ?? 0,
  });
}

export function stepActionGrace(state, input = {}) {
  const normalized = freezeActionGraceState(state);
  const delta = arcadeGameplayNonNegative(input.delta ?? 1, 'action grace delta');
  const graceDuration = arcadeGameplayNonNegative(input.graceDuration ?? normalized.graceDuration, 'action grace duration');
  const bufferDuration = arcadeGameplayNonNegative(input.bufferDuration ?? normalized.bufferDuration, 'action buffer duration');
  const previousGrace = normalized.graceRemaining;
  const previousBuffer = normalized.bufferRemaining;
  let graceRemaining = Math.max(0, previousGrace - delta);
  let bufferRemaining = Math.max(0, previousBuffer - delta);
  const events = [];
  if (previousGrace > 0 && graceRemaining === 0 && input.available !== true) events.push(Object.freeze({ kind: 'grace-expired' }));
  if (previousBuffer > 0 && bufferRemaining === 0 && input.requested !== true) events.push(Object.freeze({ kind: 'buffer-expired' }));
  if (input.available === true) graceRemaining = graceDuration;
  if (input.requested === true) {
    bufferRemaining = bufferDuration;
    events.push(Object.freeze({ kind: 'buffered' }));
  }
  const available = input.available === true || graceRemaining > 0;
  const requested = input.requested === true || bufferRemaining > 0;
  const activated = input.enabled !== false && available && requested;
  if (activated) {
    events.push(Object.freeze({ kind: 'activated' }));
    if (input.consumeOnActivate !== false) {
      graceRemaining = 0;
      bufferRemaining = 0;
    }
  }
  const changed =
    graceDuration !== normalized.graceDuration ||
    bufferDuration !== normalized.bufferDuration ||
    graceRemaining !== normalized.graceRemaining ||
    bufferRemaining !== normalized.bufferRemaining;
  return Object.freeze({
    state: freezeActionGraceState({
      graceDuration,
      bufferDuration,
      graceRemaining,
      bufferRemaining,
      revision: normalized.revision + (changed ? 1 : 0),
    }),
    activated,
    available,
    requested,
    events: Object.freeze(events),
  });
}

export function resolveHudGauge(input = {}) {
  const minimum = arcadeGameplayFinite(input.min ?? input.minimum, 0);
  const maximum = arcadeGameplayFinite(input.max ?? input.maximum, 1);
  arcadeGameplayInvariant(maximum >= minimum, 'HUD gauge maximum must be at least its minimum');
  const value = clampNumber(arcadeGameplayFinite(input.value, minimum), minimum, maximum);
  const span = maximum - minimum;
  const ratio = span <= 0 ? 1 : clampNumber((value - minimum) / span, 0, 1);
  const criticalThreshold = clampNumber(arcadeGameplayFinite(input.criticalThreshold, 0.15), 0, 1);
  const lowThreshold = clampNumber(arcadeGameplayFinite(input.lowThreshold, 0.35), criticalThreshold, 1);
  const state = ratio <= 0
    ? 'empty'
    : ratio <= criticalThreshold
      ? 'critical'
      : ratio <= lowThreshold
        ? 'low'
        : ratio >= 1
          ? 'full'
          : 'normal';
  const segmentCount = Math.max(0, Math.floor(arcadeGameplayFinite(input.segments, 0)));
  const segments = [];
  for (let index = 0; index < segmentCount; index += 1) {
    const start = index / segmentCount;
    const fill = arcadeGameplayRound(clampNumber((ratio - start) * segmentCount, 0, 1), 6);
    segments.push(Object.freeze({ index, fill, active: fill > 0, full: fill >= 1 }));
  }
  const pulsePeriod = Math.max(Number.EPSILON, arcadeGameplayFinite(input.pulsePeriod, 1));
  const pulseAmount = clampNumber(arcadeGameplayFinite(input.pulseAmount, 0.3), 0, 1);
  const time = arcadeGameplayFinite(input.time, 0);
  const warning = state === 'critical' || state === 'low';
  const pulse = warning
    ? 1 - pulseAmount / 2 + Math.sin((time / pulsePeriod) * Math.PI * 2) * (pulseAmount / 2)
    : 1;
  return Object.freeze({
    value,
    min: minimum,
    max: maximum,
    ratio,
    missingRatio: 1 - ratio,
    state,
    warning,
    pulse,
    direction: input.direction === 'reverse' ? 'reverse' : 'forward',
    segments: Object.freeze(segments),
  });
}

function normalizeHitContactRecord(record = {}) {
  return {
    hits: Math.max(0, Math.floor(finiteNumber(record.hits, 0))),
    lastHitTick: finiteNumber(record.lastHitTick ?? record.lastHitFrame, -1),
  };
}

function hitContactTargetId(value) {
  coreInvariant(value !== null && value !== undefined, 'hit contact target id is required');
  const id = String(value);
  coreInvariant(id.length > 0, 'hit contact target id is required');
  return id;
}

export function createHitContactLedger(options = {}) {
  const records = new Map();
  const initialRecords = options.records;
  if (initialRecords instanceof Map) {
    for (const [targetId, record] of initialRecords) records.set(hitContactTargetId(targetId), normalizeHitContactRecord(record));
  } else if (Array.isArray(initialRecords)) {
    for (const entry of initialRecords) {
      if (typeof entry === 'string') records.set(hitContactTargetId(entry), { hits: 1, lastHitTick: -1 });
      else if (entry?.targetId !== undefined) records.set(hitContactTargetId(entry.targetId), normalizeHitContactRecord(entry));
    }
  } else if (initialRecords && typeof initialRecords === 'object') {
    for (const [targetId, record] of Object.entries(initialRecords)) records.set(targetId, normalizeHitContactRecord(record));
  }

  const ledger = {
    canRegister(targetId, tick, policy = {}) {
      const id = hitContactTargetId(targetId);
      const currentTick = finiteNumber(tick, 0);
      const maxHitsPerTarget = Math.max(1, Math.floor(finiteNumber(policy.maxHitsPerTarget, 1)));
      const rehitDelayTicks = Math.max(0, finiteNumber(policy.rehitDelayTicks ?? policy.rehitDelayFrames, 0));
      const record = records.get(id);
      if (!record) return true;
      if (record.hits >= maxHitsPerTarget) return false;
      return currentTick - record.lastHitTick >= rehitDelayTicks;
    },
    register(targetId, tick, amount = 1) {
      const id = hitContactTargetId(targetId);
      const current = records.get(id) ?? { hits: 0, lastHitTick: -1 };
      const next = {
        hits: current.hits + Math.max(1, Math.floor(finiteNumber(amount, 1))),
        lastHitTick: finiteNumber(tick, 0),
      };
      records.set(id, next);
      return Object.freeze({ ...next });
    },
    get(targetId) {
      const record = records.get(hitContactTargetId(targetId));
      return record ? Object.freeze({ ...record }) : undefined;
    },
    has(targetId) {
      return records.has(hitContactTargetId(targetId));
    },
    clear(targetId) {
      if (targetId !== undefined) return records.delete(hitContactTargetId(targetId));
      const count = records.size;
      records.clear();
      return count;
    },
    targetIds() {
      return [...records.keys()].sort();
    },
    snapshot() {
      const entries = [...records.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([targetId, record]) => Object.freeze({ targetId, ...record }));
      return Object.freeze({ size: entries.length, records: Object.freeze(entries) });
    },
  };
  return ledger;
}

function cameraBlendFactor(delta, blend, rate, mode = 'linear') {
  if (Number.isFinite(blend)) return clampNumber(blend, 0, 1);
  const normalizedRate = Math.max(0, finiteNumber(rate, 0));
  const normalizedDelta = Math.max(0, finiteNumber(delta, 0));
  return mode === 'exponential'
    ? 1 - Math.exp(-normalizedRate * normalizedDelta)
    : Math.min(1, normalizedRate * normalizedDelta);
}

export function createCameraRig(initial = {}) {
  const state = {
    x: finiteNumber(initial.x, 0),
    y: finiteNumber(initial.y, 0),
    zoom: positiveNumber(initial.zoom, 1),
    targetX: finiteNumber(initial.targetX, initial.x ?? 0),
    targetY: finiteNumber(initial.targetY, initial.y ?? 0),
    lookaheadX: finiteNumber(initial.lookaheadX, 0),
    lookaheadY: finiteNumber(initial.lookaheadY, 0),
    shake: Math.max(0, finiteNumber(initial.shake, 0)),
    shakeX: finiteNumber(initial.shakeX ?? initial.shakeOffsetX, 0),
    shakeY: finiteNumber(initial.shakeY ?? initial.shakeOffsetY, 0),
  };

  const snapshot = () => Object.freeze({ ...state });
  const rig = {
    set(patch = {}) {
      for (const key of ['x', 'y', 'targetX', 'targetY', 'lookaheadX', 'lookaheadY', 'shake', 'shakeX', 'shakeY']) {
        if (key in patch) state[key] = finiteNumber(patch[key], state[key]);
      }
      if ('shakeOffsetX' in patch) state.shakeX = finiteNumber(patch.shakeOffsetX, state.shakeX);
      if ('shakeOffsetY' in patch) state.shakeY = finiteNumber(patch.shakeOffsetY, state.shakeY);
      if ('zoom' in patch) state.zoom = positiveNumber(patch.zoom, state.zoom);
      state.shake = Math.max(0, state.shake);
      return rig;
    },
    follow(targets, options = {}) {
      const available = [...(targets ?? [])].filter((target) => Number.isFinite(target?.x) && Number.isFinite(target?.y));
      if (available.length === 0) return rig;
      let totalWeight = 0;
      let x = 0;
      let y = 0;
      for (const target of available) {
        const weight = Math.max(0, finiteNumber(target.weight, 1));
        totalWeight += weight;
        x += target.x * weight;
        y += target.y * weight;
      }
      if (totalWeight <= 0) return rig;
      state.targetX = x / totalWeight + finiteNumber(options.offsetX, 0);
      state.targetY = y / totalWeight + finiteNumber(options.offsetY, 0);
      return rig;
    },
    target(x, y = state.targetY) {
      state.targetX = finiteNumber(x, state.targetX);
      state.targetY = finiteNumber(y, state.targetY);
      return rig;
    },
    addShake(intensity) {
      state.shake = Math.max(state.shake, Math.max(0, finiteNumber(intensity, 0)));
      return rig;
    },
    step(delta = 1, options = {}) {
      const velocityX = finiteNumber(options.velocityX, 0);
      const velocityY = finiteNumber(options.velocityY, 0);
      const desiredLookaheadX = clampNumber(
        velocityX * finiteNumber(options.lookaheadScaleX, 0),
        finiteNumber(options.lookaheadMinX, Number.NEGATIVE_INFINITY),
        finiteNumber(options.lookaheadMaxX, Number.POSITIVE_INFINITY),
      );
      const desiredLookaheadY = clampNumber(
        velocityY * finiteNumber(options.lookaheadScaleY, 0),
        finiteNumber(options.lookaheadMinY, Number.NEGATIVE_INFINITY),
        finiteNumber(options.lookaheadMaxY, Number.POSITIVE_INFINITY),
      );
      const sameDirectionX = Math.sign(desiredLookaheadX) === Math.sign(state.lookaheadX);
      const sameDirectionY = Math.sign(desiredLookaheadY) === Math.sign(state.lookaheadY);
      const lookaheadFactorX = cameraBlendFactor(
        delta,
        options.lookaheadBlendX ?? options.lookaheadBlend,
        sameDirectionX
          ? options.lookaheadRateSameX ?? options.lookaheadRateSame ?? options.lookaheadRateX ?? options.lookaheadRate
          : options.lookaheadRateOppositeX ?? options.lookaheadRateOpposite ?? options.lookaheadRateX ?? options.lookaheadRate,
        options.rateMode,
      );
      const lookaheadFactorY = cameraBlendFactor(
        delta,
        options.lookaheadBlendY ?? options.lookaheadBlend,
        sameDirectionY
          ? options.lookaheadRateSameY ?? options.lookaheadRateSame ?? options.lookaheadRateY ?? options.lookaheadRate
          : options.lookaheadRateOppositeY ?? options.lookaheadRateOpposite ?? options.lookaheadRateY ?? options.lookaheadRate,
        options.rateMode,
      );
      state.lookaheadX += (desiredLookaheadX - state.lookaheadX) * lookaheadFactorX;
      state.lookaheadY += (desiredLookaheadY - state.lookaheadY) * lookaheadFactorY;

      const desiredX = state.targetX + state.lookaheadX + finiteNumber(options.offsetX, 0);
      const desiredY = state.targetY + state.lookaheadY + finiteNumber(options.offsetY, 0);
      const diffX = desiredX - state.x;
      const diffY = desiredY - state.y;
      const farThreshold = Math.max(0, finiteNumber(options.farThreshold, Number.POSITIVE_INFINITY));
      const followRateX = Math.abs(diffX) > farThreshold
        ? options.followRateFarX ?? options.followRateFar ?? options.followRateX ?? options.followRate
        : options.followRateX ?? options.followRate;
      const followRateY = Math.abs(diffY) > farThreshold
        ? options.followRateFarY ?? options.followRateFar ?? options.followRateY ?? options.followRate
        : options.followRateY ?? options.followRate;
      const followFactorX = cameraBlendFactor(delta, options.followBlendX ?? options.followBlend, followRateX, options.rateMode);
      const followFactorY = cameraBlendFactor(delta, options.followBlendY ?? options.followBlend, followRateY, options.rateMode);
      state.x += diffX * followFactorX;
      state.y += diffY * followFactorY;

      state.x = clampNumber(
        state.x,
        finiteNumber(options.minX, Number.NEGATIVE_INFINITY),
        finiteNumber(options.maxX, Number.POSITIVE_INFINITY),
      );
      state.y = clampNumber(
        state.y,
        finiteNumber(options.minY, Number.NEGATIVE_INFINITY),
        finiteNumber(options.maxY, Number.POSITIVE_INFINITY),
      );

      const zoomTarget = positiveNumber(options.zoomTarget, state.zoom);
      const zoomFactor = cameraBlendFactor(delta, options.zoomBlend, options.zoomRate, options.rateMode);
      state.zoom += (zoomTarget - state.zoom) * zoomFactor;

      if (state.shake > 0) {
        if (Number.isFinite(options.shakeDecayMultiplier)) state.shake *= clampNumber(options.shakeDecayMultiplier, 0, 1);
        else if (Number.isFinite(options.shakeDecayRate)) state.shake *= Math.exp(-Math.max(0, options.shakeDecayRate) * Math.max(0, delta));
        const random = options.random ?? Math.random;
        const scale = Math.max(0, finiteNumber(options.shakeScale, 1));
        state.shakeX = (random() - 0.5) * state.shake * 2 * scale;
        state.shakeY = (random() - 0.5) * state.shake * 2 * scale;
        if (state.shake < Math.max(0, finiteNumber(options.shakeEpsilon, 0.1))) {
          state.shake = 0;
          state.shakeX = 0;
          state.shakeY = 0;
        }
      } else {
        state.shakeX = 0;
        state.shakeY = 0;
      }
      return snapshot();
    },
    snapshot,
  };

  for (const key of Object.keys(state)) {
    Object.defineProperty(rig, key, {
      enumerable: true,
      get: () => state[key],
      set: (value) => {
        state[key] = key === 'zoom' ? positiveNumber(value, state[key]) : finiteNumber(value, state[key]);
        if (key === 'shake') state.shake = Math.max(0, state.shake);
      },
    });
  }
  return rig;
}

export function createArcadeCameraTransform(initial = {}) {
  const state = {
    x: finiteNumber(initial.x, 0),
    y: finiteNumber(initial.y, 0),
    zoom: positiveNumber(initial.zoom, 1),
    shakeX: finiteNumber(initial.shakeX, 0),
    shakeY: finiteNumber(initial.shakeY, 0),
    viewportWidth: positiveNumber(initial.viewportWidth, 1),
    viewportHeight: positiveNumber(initial.viewportHeight, 1),
    anchorX: finiteNumber(initial.anchorX, 0),
    anchorY: finiteNumber(initial.anchorY, 0),
  };

  const snapshot = () => Object.freeze({ ...state });
  const anchorPixels = () => ({
    x: state.viewportWidth * state.anchorX,
    y: state.viewportHeight * state.anchorY,
  });

  const camera = {
    set(next = {}) {
      if ('x' in next) state.x = finiteNumber(next.x, state.x);
      if ('y' in next) state.y = finiteNumber(next.y, state.y);
      if ('zoom' in next) state.zoom = positiveNumber(next.zoom, state.zoom);
      if ('shakeX' in next) state.shakeX = finiteNumber(next.shakeX, state.shakeX);
      if ('shakeY' in next) state.shakeY = finiteNumber(next.shakeY, state.shakeY);
      if ('viewportWidth' in next) state.viewportWidth = positiveNumber(next.viewportWidth, state.viewportWidth);
      if ('viewportHeight' in next) state.viewportHeight = positiveNumber(next.viewportHeight, state.viewportHeight);
      if ('anchorX' in next) state.anchorX = finiteNumber(next.anchorX, state.anchorX);
      if ('anchorY' in next) state.anchorY = finiteNumber(next.anchorY, state.anchorY);
      return camera;
    },
    resize(viewportWidth, viewportHeight) {
      return camera.set({ viewportWidth, viewportHeight });
    },
    snapshot,
    worldToScreen(point) {
      const anchor = anchorPixels();
      return {
        x: (finiteNumber(point?.x, 0) - state.x) * state.zoom + anchor.x + state.shakeX,
        y: (finiteNumber(point?.y, 0) - state.y) * state.zoom + anchor.y + state.shakeY,
      };
    },
    screenToWorld(point) {
      const anchor = anchorPixels();
      return {
        x: (finiteNumber(point?.x, 0) - anchor.x - state.shakeX) / state.zoom + state.x,
        y: (finiteNumber(point?.y, 0) - anchor.y - state.shakeY) / state.zoom + state.y,
      };
    },
    applyToCanvas(context) {
      invariant(context?.translate && context?.scale, 'camera canvas target requires translate and scale');
      const anchor = anchorPixels();
      context.translate(anchor.x + state.shakeX, anchor.y + state.shakeY);
      context.scale(state.zoom, state.zoom);
      context.translate(-state.x, -state.y);
      return camera;
    },
    applyToContainer(container) {
      invariant(container, 'camera container target is required');
      const anchor = anchorPixels();
      if (container.position?.set) container.position.set(anchor.x + state.shakeX, anchor.y + state.shakeY);
      else {
        container.x = anchor.x + state.shakeX;
        container.y = anchor.y + state.shakeY;
      }
      if (container.pivot?.set) container.pivot.set(state.x, state.y);
      else {
        container.pivot = container.pivot ?? {};
        container.pivot.x = state.x;
        container.pivot.y = state.y;
      }
      if (container.scale?.set) container.scale.set(state.zoom);
      else {
        container.scale = container.scale ?? {};
        container.scale.x = state.zoom;
        container.scale.y = state.zoom;
      }
      return camera;
    },
  };

  return camera;
}

function percentile(sorted, ratio) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index];
}

export function createArcadeFrameProfiler(options = {}) {
  const sampleSize = Math.max(1, Math.floor(finiteNumber(options.sampleSize, 240)));
  const clock = options.now
    ?? globalThis.performance?.now?.bind(globalThis.performance)
    ?? Date.now;
  invariant(typeof clock === 'function', 'profile clock must be a function');
  const samples = new Map();

  const record = (name, durationMs) => {
    invariant(typeof name === 'string' && name.length > 0, 'profile sample name is required');
    const duration = Math.max(0, finiteNumber(durationMs, 0));
    const bucket = samples.get(name) ?? [];
    bucket.push(duration);
    if (bucket.length > sampleSize) bucket.splice(0, bucket.length - sampleSize);
    samples.set(name, bucket);
    return duration;
  };

  const summarize = (bucket = []) => {
    if (!bucket.length) {
      return Object.freeze({ count: 0, lastMs: 0, meanMs: 0, p50Ms: 0, p95Ms: 0, maxMs: 0 });
    }
    const sorted = [...bucket].sort((a, b) => a - b);
    const total = bucket.reduce((sum, value) => sum + value, 0);
    return Object.freeze({
      count: bucket.length,
      lastMs: bucket[bucket.length - 1],
      meanMs: total / bucket.length,
      p50Ms: percentile(sorted, 0.5),
      p95Ms: percentile(sorted, 0.95),
      maxMs: sorted[sorted.length - 1],
    });
  };

  return {
    record,
    measure(name, callback) {
      invariant(typeof callback === 'function', 'profile callback must be a function');
      const startedAt = clock();
      try {
        return callback();
      } finally {
        record(name, clock() - startedAt);
      }
    },
    async measureAsync(name, callback) {
      invariant(typeof callback === 'function', 'async profile callback must be a function');
      const startedAt = clock();
      try {
        return await callback();
      } finally {
        record(name, clock() - startedAt);
      }
    },
    snapshot(name) {
      if (name !== undefined) return summarize(samples.get(name));
      return Object.freeze(Object.fromEntries(
        [...samples.entries()].map(([sampleName, bucket]) => [sampleName, summarize(bucket)]),
      ));
    },
    compare(baselineName, candidateName) {
      const baseline = summarize(samples.get(baselineName));
      const candidate = summarize(samples.get(candidateName));
      return Object.freeze({
        baseline,
        candidate,
        meanRatio: baseline.meanMs > 0 ? candidate.meanMs / baseline.meanMs : 0,
        p95Ratio: baseline.p95Ms > 0 ? candidate.p95Ms / baseline.p95Ms : 0,
      });
    },
    reset(name) {
      if (name === undefined) samples.clear();
      else samples.delete(name);
    },
  };
}

export function defineArcadeRenderPlan(entries, options = {}) {
  invariant(Array.isArray(entries) && entries.length > 0, 'render plan requires at least one pass');
  const allowedLayers = new Set(options.layers ?? DEFAULT_ARCADE_LAYERS);
  const names = new Set();
  const normalized = entries.map((entry, index) => {
    invariant(entry && typeof entry === 'object', `render plan entry ${index} must be an object`);
    invariant(typeof entry.name === 'string' && entry.name.length > 0, `render plan entry ${index} requires a name`);
    invariant(!names.has(entry.name), `render plan pass "${entry.name}" is duplicated`);
    invariant(typeof entry.layer === 'string' && allowedLayers.has(entry.layer), `render plan pass "${entry.name}" uses unknown layer "${entry.layer}"`);
    names.add(entry.name);
    const order = Number(entry.order ?? index);
    const priority = Number(entry.priority ?? 0);
    invariant(Number.isFinite(order), `render plan pass "${entry.name}" order must be finite`);
    invariant(Number.isFinite(priority), `render plan pass "${entry.name}" priority must be finite`);
    return Object.freeze({
      ...entry,
      order,
      priority,
      enabled: entry.enabled !== false,
    });
  });
  return Object.freeze(normalized);
}

export function installArcadeRenderPlan(runtime, plan, implementations = {}) {
  invariant(runtime?.addPass, 'a runtime instance is required to install a render plan');
  invariant(Array.isArray(plan), 'render plan must be an array');
  const handles = {};
  for (const descriptor of plan) {
    const implementation = implementations[descriptor.name];
    if (!implementation) {
      if (descriptor.required) throw new Error(`@arcade/runtime: required render pass "${descriptor.name}" has no implementation`);
      continue;
    }
    const options = typeof implementation === 'function'
      ? implementation(descriptor, runtime)
      : implementation;
    invariant(options && typeof options === 'object', `render pass "${descriptor.name}" implementation must return options`);
    handles[descriptor.name] = runtime.addPass(descriptor.name, {
      ...options,
      layer: descriptor.layer,
      order: descriptor.order,
      priority: descriptor.priority,
      enabled: descriptor.enabled && options.enabled !== false,
    });
  }
  return Object.freeze(handles);
}

function invariant(value, message) {
  if (!value) throw new Error(`@arcade/runtime: ${message}`);
}

function resolveMount(mount) {
  return typeof mount === 'function' ? mount() : mount;
}

function applyNearestSampling(PIXI) {
  if (PIXI.TextureStyle?.defaultOptions) {
    PIXI.TextureStyle.defaultOptions.scaleMode = 'nearest';
  }
}

function copyTelemetry(telemetry) {
  return {
    ...telemetry,
    layerNames: [...telemetry.layerNames],
    systemNames: [...telemetry.systemNames],
    passNames: [...telemetry.passNames],
    activePassNames: [...telemetry.activePassNames],
    performance: { ...telemetry.performance },
  };
}

function createScheduler(options = {}) {
  const requestFrame = options.requestFrame
    ?? globalThis.requestAnimationFrame?.bind(globalThis)
    ?? ((callback) => globalThis.setTimeout(() => callback(Date.now()), 16));
  const cancelFrame = options.cancelFrame
    ?? globalThis.cancelAnimationFrame?.bind(globalThis)
    ?? globalThis.clearTimeout?.bind(globalThis);
  return { requestFrame, cancelFrame };
}

export async function createArcadePixiRuntime(options) {
  const {
    PIXI,
    mount,
    logicalWidth,
    logicalHeight,
    layers = DEFAULT_ARCADE_LAYERS,
    background = 0x05070d,
    backgroundAlpha = 1,
    canvasId,
    resolution = Math.min(2, globalThis.devicePixelRatio || 1),
    preference = 'webgl',
    antialias = false,
    autoStart = false,
    autoRender = true,
    observeResize = false,
    pauseWhenHidden = true,
    onTelemetry,
    onResize,
    performanceSampleSize = 240,
  } = options ?? {};

  invariant(PIXI?.Application && PIXI?.Container, 'a PixiJS 8 namespace is required');
  invariant(Number.isFinite(logicalWidth) && logicalWidth > 0, 'logicalWidth must be positive');
  invariant(Number.isFinite(logicalHeight) && logicalHeight > 0, 'logicalHeight must be positive');
  invariant(Array.isArray(layers) && layers.length > 0, 'at least one layer is required');
  invariant(new Set(layers).size === layers.length, 'layer names must be unique');

  applyNearestSampling(PIXI);
  const app = new PIXI.Application();
  await app.init({
    width: logicalWidth,
    height: logicalHeight,
    background,
    backgroundAlpha,
    antialias,
    autoDensity: true,
    resolution,
    preference,
    powerPreference: 'high-performance',
    autoStart: false,
  });

  const canvas = app.canvas;
  if (canvasId) canvas.id = canvasId;
  canvas.dataset.arcadeRuntime = ARCADE_RUNTIME_VERSION;
  canvas.dataset.arcadePixiRuntime = ARCADE_PIXI_RUNTIME_VERSION; // compatibility probe
  canvas.dataset.arcadeLogicalSize = `${logicalWidth}x${logicalHeight}`;
  canvas.dataset.arcadeState = 'ready';
  canvas.dataset.contextState = 'ready';
  canvas.style.imageRendering = antialias ? 'auto' : 'pixelated';
  canvas.style.display = 'block';

  const target = resolveMount(mount);
  if (target && canvas.parentElement !== target) {
    if (typeof target.append === 'function') target.append(canvas);
    else target.appendChild?.(canvas);
  }

  const layerMap = new Map();
  for (const [index, name] of layers.entries()) {
    const container = new PIXI.Container();
    container.label = name;
    container.zIndex = index;
    layerMap.set(name, container);
    app.stage.addChild(container);
  }
  app.stage.sortableChildren = true;

  const systems = new Map();
  const passes = new Map();
  const listeners = new Map();
  const disposers = new Set();
  const scheduler = createScheduler(options);
  const profiler = createArcadeFrameProfiler({
    sampleSize: performanceSampleSize,
    now: options.performanceNow,
  });
  let resizeObserver = null;
  let frameHandle = null;
  let lastFrameTime = null;
  let destroyed = false;
  let running = false;
  let contextLost = false;
  let resumeAfterContextRestore = false;
  let registrationSequence = 0;

  const telemetry = {
    version: ARCADE_PIXI_RUNTIME_VERSION,
    backend: app.renderer?.type ?? preference,
    contextLosses: 0,
    contextRestores: 0,
    contextState: 'ready',
    assetsLoaded: 0,
    framesRendered: 0,
    ticks: 0,
    elapsedMs: 0,
    lastDeltaMs: 0,
    resizeCount: 0,
    logicalWidth,
    logicalHeight,
    running: false,
    paused: true,
    destroyed: false,
    layerNames: [...layers],
    systemNames: [],
    passNames: [],
    activePassNames: [],
    performance: {},
  };

  const emitTelemetry = () => onTelemetry?.(copyTelemetry(telemetry));

  const updatePerformanceTelemetry = () => {
    telemetry.performance = profiler.snapshot();
    const frame = telemetry.performance.frame ?? telemetry.performance.render;
    if (frame) {
      canvas.dataset.arcadeFrameMeanMs = frame.meanMs.toFixed(3);
      canvas.dataset.arcadeFrameP95Ms = frame.p95Ms.toFixed(3);
    }
  };

  const emit = (eventName, payload) => {
    const callbacks = listeners.get(eventName);
    if (!callbacks) return;
    for (const callback of [...callbacks]) callback(payload);
  };

  const handleContextLost = (event) => {
    event.preventDefault?.();
    if (contextLost || destroyed) return;
    contextLost = true;
    resumeAfterContextRestore = running;
    telemetry.contextLosses += 1;
    telemetry.contextState = 'lost';
    canvas.dataset.contextState = 'lost';
    if (running) runtime.pause('context-lost');
    emit('context-lost', event);
    emitTelemetry();
  };

  const handleContextRestored = () => {
    if (!contextLost || destroyed) return;
    contextLost = false;
    telemetry.contextRestores += 1;
    telemetry.contextState = 'ready';
    canvas.dataset.contextState = 'ready';
    emit('context-restored');
    emitTelemetry();
    if (resumeAfterContextRestore) {
      resumeAfterContextRestore = false;
      runtime.resume('context-restored');
    }
  };

  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);

  const sortedSystems = () => [...systems.values()].sort(
    (a, b) => b.priority - a.priority || a.sequence - b.sequence,
  );
  const sortedPasses = () => [...passes.values()].sort(
    (a, b) => a.order - b.order || b.priority - a.priority || a.sequence - b.sequence,
  );

  const updatePassTelemetry = () => {
    telemetry.passNames = sortedPasses().map((pass) => pass.name);
    telemetry.activePassNames = sortedPasses()
      .filter((pass) => pass.enabled)
      .map((pass) => pass.name);
    canvas.dataset.arcadePasses = telemetry.passNames.join(',');
    canvas.dataset.arcadeActivePasses = telemetry.activePassNames.join(',');
    emitTelemetry();
  };

  const passContext = (pass) => ({
    runtime,
    name: pass.name,
    layerName: pass.layerName,
    layer: pass.layer,
    container: pass.container,
    get state() { return pass.state; },
  });

  const tick = (deltaMs, timeMs = Date.now(), render = autoRender) => {
    if (destroyed || contextLost) return;
    const boundedDelta = Math.max(0, Math.min(250, Number.isFinite(deltaMs) ? deltaMs : 0));
    telemetry.ticks += 1;
    telemetry.elapsedMs += boundedDelta;
    telemetry.lastDeltaMs = boundedDelta;

    const frame = {
      runtime,
      deltaMs: boundedDelta,
      deltaSeconds: boundedDelta / 1000,
      timeMs,
      tick: telemetry.ticks,
    };
    profiler.measure('frame', () => {
      profiler.measure('update', () => {
        for (const system of sortedSystems()) {
          if (system.enabled) profiler.measure(`system:${system.name}`, () => system.update(frame));
        }
        for (const pass of sortedPasses()) {
          if (pass.enabled && pass.update) {
            profiler.measure(`pass:${pass.name}`, () => pass.update(frame, passContext(pass)));
          }
        }
        emit('tick', frame);
      });

      if (render) {
        profiler.measure('render', () => app.renderer.render(app.stage));
        telemetry.framesRendered += 1;
      }
    });
    updatePerformanceTelemetry();
  };

  const loop = (timeMs) => {
    if (!running || destroyed) return;
    const deltaMs = lastFrameTime === null ? 1000 / 60 : timeMs - lastFrameTime;
    lastFrameTime = timeMs;
    tick(deltaMs, timeMs, autoRender);
    frameHandle = scheduler.requestFrame(loop);
  };

  const resize = (width, height) => {
    invariant(Number.isFinite(width) && width > 0, 'resize width must be positive');
    invariant(Number.isFinite(height) && height > 0, 'resize height must be positive');
    if (destroyed) return;
    app.renderer.resize(width, height);
    telemetry.logicalWidth = width;
    telemetry.logicalHeight = height;
    telemetry.resizeCount += 1;
    canvas.dataset.arcadeLogicalSize = `${width}x${height}`;
    const payload = { width, height, runtime };
    for (const pass of sortedPasses()) {
      pass.resize?.(payload, passContext(pass));
    }
    onResize?.(payload);
    emit('resize', payload);
    emitTelemetry();
  };

  const resizeFromTarget = () => {
    const resizeTarget = resolveMount(observeResize === true ? mount : observeResize) ?? target;
    const width = resizeTarget?.clientWidth;
    const height = resizeTarget?.clientHeight;
    if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
      resize(width, height);
    }
  };

  const handleVisibilityChange = () => {
    if (!pauseWhenHidden || destroyed) return;
    if (globalThis.document?.hidden) runtime.pause('document-hidden');
    else runtime.resume('document-visible');
  };

  const runtime = {
    version: ARCADE_PIXI_RUNTIME_VERSION,
    app,
    canvas,
    stage: app.stage,
    layers: layerMap,
    get running() { return running; },
    get destroyed() { return destroyed; },
    layer(name) {
      const layer = layerMap.get(name);
      invariant(layer, `unknown layer "${name}"`);
      return layer;
    },
    clearLayer(name, options = { children: true }) {
      const layer = runtime.layer(name);
      const children = typeof layer.removeChildren === 'function' ? layer.removeChildren() : [...(layer.children ?? [])];
      if (typeof layer.removeChildren !== 'function' && Array.isArray(layer.children)) layer.children.length = 0;
      if (options?.destroy !== false) {
        for (const child of children) child.destroy?.(options);
      }
      return children.length;
    },
    addPass(name, passOptions = {}) {
      invariant(typeof name === 'string' && name.length > 0, 'pass name is required');
      invariant(!passes.has(name), `pass "${name}" already exists`);
      invariant(typeof passOptions.layer === 'string' && passOptions.layer.length > 0, `pass "${name}" requires a layer`);
      invariant(passOptions.update === undefined || typeof passOptions.update === 'function', `pass "${name}" update must be a function`);
      invariant(passOptions.create === undefined || typeof passOptions.create === 'function', `pass "${name}" create must be a function`);
      invariant(passOptions.resize === undefined || typeof passOptions.resize === 'function', `pass "${name}" resize must be a function`);
      invariant(passOptions.destroy === undefined || typeof passOptions.destroy === 'function', `pass "${name}" destroy must be a function`);
      const order = Number(passOptions.order ?? 0);
      const priority = Number(passOptions.priority ?? 0);
      invariant(Number.isFinite(order), `pass "${name}" order must be finite`);
      invariant(Number.isFinite(priority), `pass "${name}" priority must be finite`);

      const layer = runtime.layer(passOptions.layer);
      layer.sortableChildren = true;
      const container = new PIXI.Container();
      container.label = `pass:${name}`;
      container.zIndex = order;
      container.visible = passOptions.enabled !== false;
      layer.addChild(container);

      const pass = {
        name,
        layerName: passOptions.layer,
        layer,
        container,
        order,
        priority,
        sequence: registrationSequence++,
        enabled: passOptions.enabled !== false,
        update: passOptions.update,
        resize: passOptions.resize,
        destroy: passOptions.destroy,
        destroyChildren: passOptions.destroyChildren !== false,
        state: undefined,
        handle: null,
      };

      pass.handle = Object.freeze({
        name,
        layerName: pass.layerName,
        container,
        get state() { return pass.state; },
        get enabled() { return pass.enabled; },
        setEnabled(enabled) { runtime.setPassEnabled(name, enabled); },
        clear(options) { return runtime.clearPass(name, options); },
        remove() { return runtime.removePass(name); },
      });
      passes.set(name, pass);

      try {
        pass.state = passOptions.create?.(passContext(pass));
      } catch (error) {
        passes.delete(name);
        container.removeFromParent?.();
        container.destroy?.({ children: true });
        throw error;
      }

      updatePassTelemetry();
      return pass.handle;
    },
    pass(name) {
      const pass = passes.get(name);
      invariant(pass, `unknown pass "${name}"`);
      return pass.handle;
    },
    clearPass(name, options = { children: true }) {
      const pass = passes.get(name);
      invariant(pass, `unknown pass "${name}"`);
      const children = typeof pass.container.removeChildren === 'function'
        ? pass.container.removeChildren()
        : [...(pass.container.children ?? [])];
      if (typeof pass.container.removeChildren !== 'function' && Array.isArray(pass.container.children)) {
        pass.container.children.length = 0;
      }
      if (options?.destroy !== false) {
        for (const child of children) child.destroy?.(options);
      }
      return children.length;
    },
    removePass(name) {
      const pass = passes.get(name);
      if (!pass) return false;
      passes.delete(name);
      try {
        pass.destroy?.(passContext(pass));
      } finally {
        pass.container.removeFromParent?.();
        pass.container.destroy?.({ children: pass.destroyChildren });
      }
      updatePassTelemetry();
      return true;
    },
    setPassEnabled(name, enabled) {
      const pass = passes.get(name);
      invariant(pass, `unknown pass "${name}"`);
      pass.enabled = Boolean(enabled);
      pass.container.visible = pass.enabled;
      updatePassTelemetry();
    },
    addSystem(name, update, systemOptions = {}) {
      invariant(typeof name === 'string' && name.length > 0, 'system name is required');
      invariant(typeof update === 'function', `system "${name}" must be a function`);
      invariant(!systems.has(name), `system "${name}" already exists`);
      const priority = Number(systemOptions.priority ?? 0);
      invariant(Number.isFinite(priority), `system "${name}" priority must be finite`);
      systems.set(name, {
        name,
        update,
        priority,
        sequence: registrationSequence++,
        enabled: systemOptions.enabled !== false,
      });
      telemetry.systemNames = [...systems.keys()];
      emitTelemetry();
      return () => runtime.removeSystem(name);
    },
    removeSystem(name) {
      const removed = systems.delete(name);
      telemetry.systemNames = [...systems.keys()];
      if (removed) emitTelemetry();
      return removed;
    },
    setSystemEnabled(name, enabled) {
      const system = systems.get(name);
      invariant(system, `unknown system "${name}"`);
      system.enabled = Boolean(enabled);
      emitTelemetry();
    },
    on(eventName, callback) {
      invariant(typeof callback === 'function', 'event callback must be a function');
      const callbacks = listeners.get(eventName) ?? new Set();
      callbacks.add(callback);
      listeners.set(eventName, callbacks);
      return () => {
        callbacks.delete(callback);
        if (callbacks.size === 0) listeners.delete(eventName);
      };
    },
    emit,
    track(disposer) {
      invariant(typeof disposer === 'function', 'tracked disposer must be a function');
      disposers.add(disposer);
      return () => disposers.delete(disposer);
    },
    async loadTexture(alias, src) {
      invariant(typeof alias === 'string' && alias.length > 0, 'asset alias is required');
      invariant(typeof src === 'string' && src.length > 0, 'asset source is required');
      const texture = await PIXI.Assets.load({ alias, src, data: { scaleMode: 'nearest' } });
      if (texture?.source) {
        texture.source.scaleMode = 'nearest';
        if (texture.source.style) {
          texture.source.style.scaleMode = 'nearest';
          texture.source.style.update?.();
        }
      }
      telemetry.assetsLoaded += 1;
      emit('asset-loaded', { alias, src, texture });
      emitTelemetry();
      return texture;
    },
    async loadTextures(manifest) {
      invariant(manifest && typeof manifest === 'object', 'texture manifest is required');
      const entries = Array.isArray(manifest)
        ? manifest.map((entry) => [entry.alias, entry.src])
        : Object.entries(manifest);
      const loaded = await Promise.all(entries.map(async ([alias, src]) => [alias, await runtime.loadTexture(alias, src)]));
      return Object.fromEntries(loaded);
    },
    texture(alias) {
      return PIXI.Assets.get(alias);
    },
    resize,
    resizeFromTarget,
    render() {
      if (destroyed || contextLost) return;
      profiler.measure('render', () => app.renderer.render(app.stage));
      telemetry.framesRendered += 1;
      updatePerformanceTelemetry();
    },
    step(deltaMs = 1000 / 60, timeMs = Date.now(), render = autoRender) {
      tick(deltaMs, timeMs, render);
    },
    start(reason = 'manual') {
      if (destroyed || running) return;
      if (contextLost) {
        resumeAfterContextRestore = true;
        return;
      }
      running = true;
      telemetry.running = true;
      telemetry.paused = false;
      canvas.dataset.arcadeState = 'running';
      lastFrameTime = null;
      emit('start', { reason });
      emitTelemetry();
      frameHandle = scheduler.requestFrame(loop);
    },
    pause(reason = 'manual') {
      if (!running || destroyed) return;
      running = false;
      telemetry.running = false;
      telemetry.paused = true;
      canvas.dataset.arcadeState = 'paused';
      if (frameHandle !== null) scheduler.cancelFrame?.(frameHandle);
      frameHandle = null;
      emit('pause', { reason });
      emitTelemetry();
    },
    resume(reason = 'manual') {
      if (contextLost) {
        resumeAfterContextRestore = true;
        return;
      }
      runtime.start(reason);
    },
    snapshot() {
      updatePerformanceTelemetry();
      return copyTelemetry(telemetry);
    },
    performanceSnapshot(name) {
      return profiler.snapshot(name);
    },
    resetPerformance(name) {
      profiler.reset(name);
      updatePerformanceTelemetry();
    },
    destroy(removeCanvas = true) {
      if (destroyed) return;
      runtime.pause('destroy');
      destroyed = true;
      contextLost = false;
      resumeAfterContextRestore = false;
      telemetry.destroyed = true;
      telemetry.running = false;
      telemetry.paused = true;
      canvas.dataset.arcadeState = 'destroyed';
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      globalThis.document?.removeEventListener?.('visibilitychange', handleVisibilityChange);
      resizeObserver?.disconnect?.();
      resizeObserver = null;
      for (const disposer of [...disposers]) {
        try { disposer(); } catch { /* best-effort application cleanup */ }
      }
      disposers.clear();
      for (const name of [...passes.keys()]) {
        try { runtime.removePass(name); } catch { /* best-effort pass cleanup */ }
      }
      systems.clear();
      telemetry.systemNames = [];
      listeners.clear();
      layerMap.clear();
      try {
        app.destroy({ removeView: removeCanvas }, { children: true, texture: false, textureSource: false });
      } catch {
        app.destroy?.(removeCanvas, { children: true, texture: false, textureSource: false });
      }
      if (removeCanvas) canvas.remove?.();
      emitTelemetry();
    },
  };

  if (observeResize) {
    const resizeTarget = resolveMount(observeResize === true ? mount : observeResize) ?? target;
    if (resizeTarget && globalThis.ResizeObserver) {
      resizeObserver = new globalThis.ResizeObserver(() => resizeFromTarget());
      resizeObserver.observe(resizeTarget);
    }
    resizeFromTarget();
  }

  if (pauseWhenHidden) {
    globalThis.document?.addEventListener?.('visibilitychange', handleVisibilityChange);
  }

  emitTelemetry();
  if (autoStart) runtime.start('auto-start');
  return runtime;
}

export function createCanvasTexturePassOptions(options = {}) {
  const {
    PIXI,
    draw,
    width,
    height,
    priority = 0,
    order = 0,
    enabled = true,
    clear = true,
    resizeWithRuntime = true,
    shouldDraw,
    canvasFactory,
    onResize,
  } = options;

  invariant(PIXI?.Texture && PIXI?.Sprite, 'PixiJS Texture and Sprite constructors are required for a canvas texture pass');
  invariant(typeof draw === 'function', 'canvas texture pass requires a draw function');
  invariant(shouldDraw === undefined || typeof shouldDraw === 'function', 'canvas texture pass shouldDraw must be a function');
  invariant(width === undefined || (Number.isFinite(width) && width > 0), 'canvas texture pass width must be positive');
  invariant(height === undefined || (Number.isFinite(height) && height > 0), 'canvas texture pass height must be positive');

  const makeCanvas = (passName, canvasWidth, canvasHeight) => (canvasFactory ?? ((factoryWidth, factoryHeight) => {
    const canvas = globalThis.document?.createElement?.('canvas');
    invariant(canvas, `canvas texture pass "${passName}" requires document.createElement or canvasFactory`);
    canvas.width = factoryWidth;
    canvas.height = factoryHeight;
    return canvas;
  }))(canvasWidth, canvasHeight);

  const resizeState = (state, nextWidth, nextHeight) => {
    if (state.width === nextWidth && state.height === nextHeight) return false;
    state.canvas.width = nextWidth;
    state.canvas.height = nextHeight;
    state.width = nextWidth;
    state.height = nextHeight;
    state.sprite.width = nextWidth;
    state.sprite.height = nextHeight;
    state.dirty = true;
    state.texture.source?.update?.();
    state.texture.update?.();
    return true;
  };

  return {
    priority,
    order,
    enabled,
    create(pass) {
      const snapshot = pass.runtime.snapshot();
      const resolvedWidth = width ?? snapshot.logicalWidth;
      const resolvedHeight = height ?? snapshot.logicalHeight;
      const canvas = makeCanvas(pass.name, resolvedWidth, resolvedHeight);
      canvas.width = resolvedWidth;
      canvas.height = resolvedHeight;
      const context = canvas.getContext?.('2d');
      invariant(context, `canvas texture pass "${pass.name}" could not create a 2D context`);
      const texture = PIXI.Texture.from(canvas);
      if (texture.source) texture.source.scaleMode = 'nearest';
      const sprite = new PIXI.Sprite(texture);
      sprite.label = `canvas-pass:${pass.name}`;
      sprite.width = resolvedWidth;
      sprite.height = resolvedHeight;
      pass.container.addChild(sprite);
      const state = {
        canvas,
        context,
        texture,
        sprite,
        width: resolvedWidth,
        height: resolvedHeight,
        dirty: true,
        redraws: 0,
        skippedFrames: 0,
        invalidate() {
          state.dirty = true;
        },
      };
      return state;
    },
    update(frame, pass) {
      const state = pass.state;
      const requested = shouldDraw ? shouldDraw(frame, pass) : true;
      if (!state.dirty && requested === false) {
        state.skippedFrames += 1;
        return;
      }
      if (clear) state.context.clearRect(0, 0, state.width, state.height);
      draw(state.context, frame, pass);
      if (state.texture.source?.update) state.texture.source.update();
      else state.texture.update?.();
      state.dirty = false;
      state.redraws += 1;
    },
    resize(payload, pass) {
      if (resizeWithRuntime) resizeState(pass.state, payload.width, payload.height);
      onResize?.(payload, pass);
    },
    destroy(pass) {
      pass.state.texture.destroy?.(true);
    },
  };
}

export function createCanvasTexturePass(runtime, options = {}) {
  const { name, layer } = options;
  invariant(runtime?.addPass, 'a runtime instance is required for a canvas texture pass');
  invariant(typeof name === 'string' && name.length > 0, 'canvas texture pass name is required');
  invariant(typeof layer === 'string' && layer.length > 0, `canvas texture pass "${name}" requires a layer`);
  return runtime.addPass(name, {
    ...createCanvasTexturePassOptions(options),
    layer,
  });
}
// BEGIN MERGED ARCADE CORE
export const ARCADE_CORE_VERSION = ARCADE_RUNTIME_VERSION;

function coreInvariant(condition, message) {
  if (!condition) throw new Error(message);
}

function finite(value, fallback) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function defaultNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}



export function clampNumber(value, minimum = -Infinity, maximum = Infinity) {
  coreInvariant(minimum <= maximum, 'minimum must not exceed maximum');
  return Math.max(minimum, Math.min(maximum, finite(value, 0)));
}

export function approach(current, target, maxDelta) {
  const delta = Math.max(0, finite(maxDelta, 0));
  const from = finite(current, 0);
  const to = finite(target, 0);
  if (from < to) return Math.min(from + delta, to);
  if (from > to) return Math.max(from - delta, to);
  return from;
}

export function integrateAcceleration(value, acceleration, dt = 1, minimum = -Infinity, maximum = Infinity) {
  coreInvariant(Number.isFinite(dt) && dt >= 0, `invalid integration dt: ${dt}`);
  return clampNumber(finite(value, 0) + finite(acceleration, 0) * dt, minimum, maximum);
}

export function integrateBody(body, dt = 1, acceleration = {}) {
  coreInvariant(Number.isFinite(dt) && dt >= 0, `invalid body integration dt: ${dt}`);
  const vx = integrateAcceleration(body.vx ?? body.velocityX ?? 0, acceleration.x ?? 0, dt,
    acceleration.minX ?? -Infinity, acceleration.maxX ?? Infinity);
  const vy = integrateAcceleration(body.vy ?? body.velocityY ?? 0, acceleration.y ?? 0, dt,
    acceleration.minY ?? -Infinity, acceleration.maxY ?? Infinity);
  return Object.freeze({
    ...body,
    x: finite(body.x, 0) + vx * dt,
    y: finite(body.y, 0) + vy * dt,
    ...('vx' in body ? { vx } : {}),
    ...('vy' in body ? { vy } : {}),
    ...('velocityX' in body ? { velocityX: vx } : {}),
    ...('velocityY' in body ? { velocityY: vy } : {}),
  });
}

function rectWidth(rect) {
  return finite(rect.w ?? rect.width, 0);
}

function rectHeight(rect) {
  return finite(rect.h ?? rect.height, 0);
}

export function aabbOverlap(a, b) {
  const aw = rectWidth(a);
  const ah = rectHeight(a);
  const bw = rectWidth(b);
  const bh = rectHeight(b);
  return a.x < b.x + bw && a.x + aw > b.x && a.y < b.y + bh && a.y + ah > b.y;
}

export function resolveOneWayPlatforms(options) {
  const body = options.body;
  const previous = options.previous;
  const velocityY = finite(options.velocityY ?? body.vy ?? body.velocityY, 0);
  const downwardSign = finite(options.downwardSign, 1) >= 0 ? 1 : -1;
  const tolerance = Math.max(0, finite(options.tolerance, 0));
  const bodyHeight = rectHeight(body);
  const previousBottom = previous.y + bodyHeight;
  const nextBottom = body.y + bodyHeight;
  const falling = velocityY * downwardSign >= 0;
  if (!falling) return null;
  let best = null;
  for (const platform of options.platforms ?? []) {
    const platformWidth = rectWidth(platform);
    const horizontal = body.x + rectWidth(body) > platform.x && body.x < platform.x + platformWidth;
    if (!horizontal) continue;
    const platformTop = platform.y;
    const crossed = previousBottom <= platformTop + tolerance && nextBottom >= platformTop;
    if (!crossed) continue;
    if (!best || platformTop < best.platform.y) {
      best = Object.freeze({
        platform,
        x: body.x,
        y: platformTop - bodyHeight,
        velocityY: 0,
      });
    }
  }
  return best;
}

export function createFixedStepLoop(options) {
  coreInvariant(typeof options?.update === 'function', 'fixed-step loop requires update');
  coreInvariant(typeof options?.render === 'function', 'fixed-step loop requires render');
  const unitScale = options.timeUnit === 'milliseconds' ? 1 : 0.001;
  const fixedStep = finite(options.fixedStep, options.timeUnit === 'milliseconds' ? 1000 / 60 : 1 / 60);
  const maxFrame = finite(options.maxFrame, options.timeUnit === 'milliseconds' ? 100 : 0.1);
  coreInvariant(fixedStep > 0, 'fixedStep must be positive');
  coreInvariant(maxFrame >= fixedStep, 'maxFrame must be at least fixedStep');

  const now = options.now ?? defaultNow;
  const requestFrame = options.requestFrame ?? globalThis.requestAnimationFrame?.bind(globalThis);
  const cancelFrame = options.cancelFrame ?? globalThis.cancelAnimationFrame?.bind(globalThis);
  const state = {
    running: false,
    paused: false,
    lastTimestamp: 0,
    accumulator: 0,
    frameCount: 0,
    renderCount: 0,
    fps: 60,
    fpsFrames: 0,
    fpsTimestamp: 0,
    droppedTime: 0,
  };
  let frameId = null;

  const advance = (elapsed) => {
    const clamped = Math.max(0, Math.min(maxFrame, finite(elapsed, 0)));
    state.droppedTime += Math.max(0, finite(elapsed, 0) - clamped);
    if (state.paused) return { updates: 0, alpha: state.accumulator / fixedStep };
    state.accumulator += clamped;
    let updates = 0;
    while (state.accumulator >= fixedStep) {
      options.update(fixedStep);
      state.accumulator -= fixedStep;
      state.frameCount += 1;
      updates += 1;
    }
    const alpha = state.accumulator / fixedStep;
    options.render(alpha);
    state.renderCount += 1;
    return { updates, alpha };
  };

  const tick = (timestamp) => {
    if (!state.running) return;
    const elapsed = (timestamp - state.lastTimestamp) * unitScale;
    state.lastTimestamp = timestamp;
    state.fpsFrames += 1;
    if (timestamp - state.fpsTimestamp >= 1000) {
      state.fps = state.fpsFrames;
      state.fpsFrames = 0;
      state.fpsTimestamp = timestamp;
    }
    advance(elapsed);
    frameId = requestFrame?.(tick) ?? null;
  };

  return {
    start() {
      if (state.running) return;
      coreInvariant(typeof requestFrame === 'function', 'requestAnimationFrame is unavailable');
      state.running = true;
      state.lastTimestamp = now();
      state.fpsTimestamp = state.lastTimestamp;
      frameId = requestFrame(tick);
    },
    stop() {
      state.running = false;
      if (frameId !== null && cancelFrame) cancelFrame(frameId);
      frameId = null;
    },
    pause() {
      state.paused = true;
    },
    resume() {
      state.paused = false;
      state.lastTimestamp = now();
    },
    advance,
    resetClock() {
      state.lastTimestamp = now();
      state.accumulator = 0;
    },
    snapshot() {
      return Object.freeze({ ...state, alpha: state.accumulator / fixedStep });
    },
    getFPS: () => state.fps,
    getFrameCount: () => state.frameCount,
    isPaused: () => state.paused,
    isRunning: () => state.running,
  };
}

export function createKeyboardDevice(options = {}) {
  const target = options.target ?? globalThis.window;
  coreInvariant(target?.addEventListener, 'keyboard target must support addEventListener');
  const now = options.now ?? defaultNow;
  const preventDefault = new Set(options.preventDefaultCodes ?? []);
  const held = new Set();
  const pendingPressed = new Set();
  const pendingReleased = new Set();
  const pressed = new Set();
  const released = new Set();
  const pressTimes = new Map();
  const releaseTimes = new Map();
  const latest = [];
  let destroyed = false;

  const onKeyDown = (event) => {
    if (destroyed) return;
    if (!held.has(event.code)) {
      pendingPressed.add(event.code);
      pressTimes.set(event.code, now());
      latest.push(event.code);
    }
    held.add(event.code);
    if (preventDefault.has(event.code)) event.preventDefault?.();
  };
  const onKeyUp = (event) => {
    if (destroyed) return;
    held.delete(event.code);
    releaseTimes.set(event.code, now());
    pendingReleased.add(event.code);
    if (preventDefault.has(event.code)) event.preventDefault?.();
  };
  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);

  const device = {
    advance() {
      pressed.clear();
      released.clear();
      for (const code of pendingPressed) pressed.add(code);
      for (const code of pendingReleased) released.add(code);
      pendingPressed.clear();
      pendingReleased.clear();
    },
    clearEdges() {
      pressed.clear();
      released.clear();
    },
    isHeld: (code) => held.has(code),
    isPressed: (code) => pressed.has(code),
    isReleased: (code) => released.has(code),
    getState(code) {
      return Object.freeze({
        isPressed: held.has(code),
        wasJustPressed: pressed.has(code),
        wasJustReleased: released.has(code),
        pressTime: pressTimes.get(code) ?? 0,
        releaseTime: releaseTimes.get(code) ?? 0,
      });
    },
    getHoldDuration(code) {
      return held.has(code) ? Math.max(0, now() - (pressTimes.get(code) ?? now())) : 0;
    },
    consumeLatestPressed(exclusions = []) {
      const excluded = new Set(exclusions);
      while (latest.length) {
        const code = latest.shift();
        if (code && !excluded.has(code)) return code;
      }
      return null;
    },
    reset() {
      held.clear();
      pendingPressed.clear();
      pendingReleased.clear();
      pressed.clear();
      released.clear();
      pressTimes.clear();
      releaseTimes.clear();
      latest.length = 0;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      device.reset();
    },
  };
  return device;
}

function normalizeBindingEntry(entry) {
  if (typeof entry === 'string') return { type: 'key', code: entry };
  return entry;
}

function gamepadValue(gamepad, binding) {
  if (!gamepad || !binding) return 0;
  if (binding.type === 'button') {
    const button = gamepad.buttons?.[binding.index];
    return button?.pressed ? Math.max(1, finite(button.value, 1)) : finite(button?.value, 0);
  }
  if (binding.type === 'axis') {
    const value = finite(gamepad.axes?.[binding.index], 0) * finite(binding.direction, 1);
    return value >= finite(binding.threshold, 0.45) ? value : 0;
  }
  return 0;
}

export function cloneActionBindings(actions, bindings = {}) {
  return Object.fromEntries(actions.map((action) => [action, [...(bindings[action] ?? [])].map(normalizeBindingEntry)]));
}

export function updateActionBinding(actions, bindings, action, binding, options = {}) {
  coreInvariant(actions.includes(action), `unknown action "${action}"`);
  const next = cloneActionBindings(actions, bindings);
  const normalized = normalizeBindingEntry(binding);
  if (options.removeConflicts !== false && normalized.type === 'key') {
    for (const candidate of actions) {
      next[candidate] = next[candidate].filter((entry) => !(entry.type === 'key' && entry.code === normalized.code));
    }
  }
  next[action] = options.replace === false ? [...next[action], normalized] : [normalized];
  return next;
}

export function createActionInput(options) {
  const actions = [...options.actions];
  const keyboard = options.keyboard ?? createKeyboardDevice(options.keyboardOptions);
  const getGamepads = options.getGamepads ?? (() => globalThis.navigator?.getGamepads?.() ?? []);
  let bindings = cloneActionBindings(actions, options.bindings);
  let previousHeld = Object.fromEntries(actions.map((action) => [action, false]));
  let current = null;

  const read = () => {
    const gamepad = getGamepads()?.[options.gamepadIndex ?? 0] ?? null;
    const snapshot = {};
    for (const action of actions) {
      let value = 0;
      let source = null;
      for (const entry of bindings[action] ?? []) {
        if (entry.type === 'key') {
          if (keyboard.isHeld(entry.code)) {
            value = 1;
            source = `key:${entry.code}`;
            break;
          }
        } else {
          const candidate = gamepadValue(gamepad, entry);
          if (candidate > value) {
            value = candidate;
            source = `gamepad:${entry.type}:${entry.index}`;
          }
        }
      }
      const held = value > 0;
      const keyboardPressed = (bindings[action] ?? []).some((entry) => entry.type === 'key' && keyboard.isPressed(entry.code));
      const keyboardReleased = (bindings[action] ?? []).some((entry) => entry.type === 'key' && keyboard.isReleased(entry.code));
      snapshot[action] = Object.freeze({
        held,
        pressed: keyboardPressed || (held && !previousHeld[action]),
        released: keyboardReleased || (!held && previousHeld[action]),
        value,
        source,
      });
    }
    previousHeld = Object.fromEntries(actions.map((action) => [action, snapshot[action].held]));
    current = Object.freeze(snapshot);
    return current;
  };

  return {
    advance() {
      keyboard.advance();
      return read();
    },
    refresh() {
      return read();
    },
    snapshot() {
      return current ?? read();
    },
    clearEdges() {
      keyboard.clearEdges();
      current = null;
    },
    setBindings(next) {
      bindings = cloneActionBindings(actions, next);
      current = null;
    },
    getBindings: () => cloneActionBindings(actions, bindings),
    reset() {
      keyboard.reset();
      previousHeld = Object.fromEntries(actions.map((action) => [action, false]));
      current = null;
    },
    destroy() {
      if (!options.keyboard) keyboard.destroy();
    },
    keyboard,
  };
}

export function createSceneStack(options = {}) {
  const stack = [];
  const context = options.context;
  return {
    push(scene) {
      coreInvariant(scene && typeof scene.name === 'string', 'scene must have a name');
      stack.push(scene);
      scene.onEnter?.(context);
      return scene;
    },
    pop() {
      const scene = stack.pop();
      scene?.onExit?.();
      return scene;
    },
    replace(scene) {
      const previous = stack.pop();
      previous?.onExit?.();
      stack.push(scene);
      scene.onEnter?.(context);
      return scene;
    },
    clear() {
      while (stack.length) stack.pop()?.onExit?.();
    },
    current: () => stack.at(-1),
    depth: () => stack.length,
    update(delta) {
      stack.at(-1)?.update?.(delta);
    },
    render(...args) {
      stack.at(-1)?.render?.(...args);
    },
    snapshot: () => Object.freeze(stack.map((scene) => scene.name)),
  };
}

export function createTransitionSceneManager(options) {
  const sceneMap = new Map(options.scenes.map((scene) => [scene.name, scene]));
  let current = null;
  let params;
  let transitioning = false;
  let renderContext = options.renderContext ?? null;

  const canTransitionTo = (target) => {
    if (!sceneMap.has(target)) return false;
    if (!current) return target === options.initialScene;
    const allowed = options.transitions?.[current.name];
    return !allowed || allowed.includes(target);
  };

  const manager = {
    init(context) {
      renderContext = context;
    },
    async start() {
      if (current) return true;
      return manager.transitionTo(options.initialScene);
    },
    getCurrentScene: () => current?.name ?? null,
    getCurrent: () => current,
    getParams: () => params,
    isTransitioning: () => transitioning,
    canTransitionTo,
    async transitionTo(target, nextParams) {
      if (transitioning || !canTransitionTo(target)) return false;
      const next = sceneMap.get(target);
      transitioning = true;
      try {
        await current?.exit?.();
        current = next;
        params = nextParams;
        await current.enter?.(nextParams);
        return true;
      } finally {
        transitioning = false;
      }
    },
    update(delta) {
      if (!transitioning) current?.update?.(delta);
    },
    render() {
      if (!renderContext) return;
      options.clear?.(renderContext, current?.name ?? null);
      current?.render?.(renderContext);
    },
  };
  return manager;
}

export function createLifecycleController(options = {}) {
  const documentTarget = options.documentTarget ?? globalThis.document;
  const windowTarget = options.windowTarget ?? globalThis.window;
  if (!documentTarget || !windowTarget) return { destroy() {} };
  const onVisibility = () => {
    if (documentTarget.hidden) {
      options.loop?.pause?.();
      options.input?.reset?.();
      options.onSuspend?.('hidden');
    } else {
      options.loop?.resume?.();
      options.onResume?.('visible');
    }
  };
  const onBlur = () => {
    options.input?.reset?.();
    options.onSuspend?.('blur');
  };
  documentTarget.addEventListener('visibilitychange', onVisibility);
  windowTarget.addEventListener('blur', onBlur);
  return {
    destroy() {
      documentTarget.removeEventListener('visibilitychange', onVisibility);
      windowTarget.removeEventListener('blur', onBlur);
    },
  };
}
// END MERGED ARCADE CORE


// BEGIN ARCADE SERVICES 0.13-0.16

function arcadeRectSize(rect) {
  return {
    width: finiteNumber(rect?.w ?? rect?.width, 0),
    height: finiteNumber(rect?.h ?? rect?.height, 0),
  };
}

function arcadeClone(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function createArcadeRuntimeHost(options = {}) {
  const events = options.events ?? createEventBus();
  const services = new Map();
  const disposers = [];
  let destroyed = false;
  let state = 'idle';
  let tick = 0;

  const host = {
    version: ARCADE_RUNTIME_VERSION,
    events,
    register(name, service, disposer) {
      coreInvariant(typeof name === 'string' && name.length > 0, 'host service name is required');
      coreInvariant(!services.has(name), `host service already exists: ${name}`);
      services.set(name, service);
      if (typeof disposer === 'function') disposers.push(disposer);
      else if (service && typeof service.destroy === 'function') disposers.push(() => service.destroy());
      return service;
    },
    service(name) {
      coreInvariant(services.has(name), `unknown host service: ${name}`);
      return services.get(name);
    },
    has(name) {
      return services.has(name);
    },
    track(disposer) {
      coreInvariant(typeof disposer === 'function', 'host disposer must be a function');
      disposers.push(disposer);
      return disposer;
    },
    start(reason = 'start') {
      coreInvariant(!destroyed, 'arcade host is destroyed');
      if (state === 'running') return false;
      state = 'running';
      options.loop?.start?.();
      events.emit('host:start', Object.freeze({ reason, host }));
      return true;
    },
    pause(reason = 'pause') {
      if (destroyed || state === 'paused') return false;
      state = 'paused';
      options.loop?.pause?.();
      events.emit('host:pause', Object.freeze({ reason, host }));
      return true;
    },
    resume(reason = 'resume') {
      coreInvariant(!destroyed, 'arcade host is destroyed');
      if (state === 'running') return false;
      state = 'running';
      options.loop?.resume?.();
      events.emit('host:resume', Object.freeze({ reason, host }));
      return true;
    },
    stop(reason = 'stop') {
      if (destroyed || state === 'stopped') return false;
      state = 'stopped';
      options.loop?.stop?.();
      events.emit('host:stop', Object.freeze({ reason, host }));
      return true;
    },
    step(delta, command) {
      coreInvariant(!destroyed, 'arcade host is destroyed');
      tick += 1;
      const frame = Object.freeze({ tick, delta, command, host });
      events.emit('host:before-step', frame);
      options.update?.(delta, command, frame);
      events.emit('host:after-step', frame);
      return frame;
    },
    render(alpha = 0) {
      coreInvariant(!destroyed, 'arcade host is destroyed');
      const frame = Object.freeze({ tick, alpha, host });
      options.render?.(alpha, frame);
      events.emit('host:render', frame);
      return frame;
    },
    snapshot() {
      return Object.freeze({
        version: ARCADE_RUNTIME_VERSION,
        state,
        tick,
        destroyed,
        services: Object.freeze([...services.keys()].sort()),
        events: events.snapshot?.(),
      });
    },
    destroy() {
      if (destroyed) return false;
      host.stop('destroy');
      destroyed = true;
      for (const disposer of disposers.splice(0).reverse()) disposer();
      services.clear();
      events.emit('host:destroy', Object.freeze({ host }));
      events.clear?.();
      state = 'destroyed';
      return true;
    },
  };

  for (const [name, service] of Object.entries(options.services ?? {})) host.register(name, service);
  return host;
}

function arcadeCellRange(rect, cellSize) {
  const { width, height } = arcadeRectSize(rect);
  return {
    minX: Math.floor(rect.x / cellSize),
    maxX: Math.floor((rect.x + width) / cellSize),
    minY: Math.floor(rect.y / cellSize),
    maxY: Math.floor((rect.y + height) / cellSize),
  };
}

function arcadeCellKey(x, y) {
  return `${x}:${y}`;
}

export function collisionLayersMatch(a, b) {
  if (a.layer && Array.isArray(b.mask) && !b.mask.includes(a.layer)) return false;
  if (b.layer && Array.isArray(a.mask) && !a.mask.includes(b.layer)) return false;
  return true;
}

function arcadePairKey(a, b) {
  return a.id < b.id ? `${a.id}\u0000${b.id}` : `${b.id}\u0000${a.id}`;
}

export function buildSpatialIndex(bodies, cellSize = 64) {
  coreInvariant(Number.isFinite(cellSize) && cellSize > 0, `Invalid spatial cell size: ${cellSize}`);
  const sortedBodies = [...bodies]
    .filter((body) => body?.enabled !== false)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const cells = new Map();
  for (const body of sortedBodies) {
    coreInvariant(typeof body.id === 'string' && body.id.length > 0, 'spatial body id is required');
    const range = arcadeCellRange(body, cellSize);
    for (let y = range.minY; y <= range.maxY; y += 1) {
      for (let x = range.minX; x <= range.maxX; x += 1) {
        const key = arcadeCellKey(x, y);
        const cell = cells.get(key) ?? [];
        cell.push(body);
        cells.set(key, cell);
      }
    }
  }
  for (const [key, cell] of cells) cells.set(key, cell.sort((a, b) => a.id.localeCompare(b.id)));
  return Object.freeze({ cellSize, cells, bodies: Object.freeze(sortedBodies) });
}

export function querySpatialIndex(index, rect, options = {}) {
  const range = arcadeCellRange(rect, index.cellSize);
  const seen = new Map();
  const layers = options.layers ? new Set(options.layers) : null;
  for (let y = range.minY; y <= range.maxY; y += 1) {
    for (let x = range.minX; x <= range.maxX; x += 1) {
      for (const body of index.cells.get(arcadeCellKey(x, y)) ?? []) {
        if (layers && !layers.has(body.layer)) continue;
        if (options.predicate && !options.predicate(body)) continue;
        if (aabbOverlap(rect, body)) seen.set(body.id, body);
      }
    }
  }
  return [...seen.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function spatialCollisionPairs(index) {
  const pairs = new Map();
  for (const cell of index.cells.values()) {
    for (let left = 0; left < cell.length; left += 1) {
      for (let right = left + 1; right < cell.length; right += 1) {
        const a = cell[left];
        const b = cell[right];
        if (!collisionLayersMatch(a, b) || !aabbOverlap(a, b)) continue;
        const first = a.id < b.id ? a : b;
        const second = a.id < b.id ? b : a;
        pairs.set(arcadePairKey(first, second), Object.freeze({ a: first, b: second }));
      }
    }
  }
  return [...pairs.values()].sort((a, b) => arcadePairKey(a.a, a.b).localeCompare(arcadePairKey(b.a, b.b)));
}

export function computeCollisionManifold(aBody, bBody) {
  const [a, b] = aBody.id <= bBody.id ? [aBody, bBody] : [bBody, aBody];
  if (!aabbOverlap(a, b)) return null;
  const aSize = arcadeRectSize(a);
  const bSize = arcadeRectSize(b);
  const aCenterX = a.x + aSize.width / 2;
  const aCenterY = a.y + aSize.height / 2;
  const bCenterX = b.x + bSize.width / 2;
  const bCenterY = b.y + bSize.height / 2;
  const overlapX = Math.min(a.x + aSize.width, b.x + bSize.width) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + aSize.height, b.y + bSize.height) - Math.max(a.y, b.y);
  if (overlapX <= 0 || overlapY <= 0) return null;
  const horizontal = overlapX < overlapY;
  return Object.freeze({
    a: a.id,
    b: b.id,
    normalX: horizontal ? (aCenterX <= bCenterX ? 1 : -1) : 0,
    normalY: horizontal ? 0 : (aCenterY <= bCenterY ? 1 : -1),
    penetration: Number((horizontal ? overlapX : overlapY).toFixed(6)),
    overlapX: Number(overlapX.toFixed(6)),
    overlapY: Number(overlapY.toFixed(6)),
  });
}

export function manifoldsFromSpatialPairs(pairs) {
  return pairs
    .map((pair) => computeCollisionManifold(pair.a, pair.b))
    .filter(Boolean)
    .sort((a, b) => `${a.a}\u0000${a.b}`.localeCompare(`${b.a}\u0000${b.b}`));
}

function arcadeSweptTime(body, obstacle, vx, vy, dt) {
  if (obstacle.oneWay && vy <= 0) return null;
  if (aabbOverlap(body, obstacle)) {
    return Object.freeze({ obstacle, time: 0, normalX: 0, normalY: -1, remainingTime: dt });
  }
  const bodySize = arcadeRectSize(body);
  const obstacleSize = arcadeRectSize(obstacle);
  const dxEntry = vx > 0 ? obstacle.x - (body.x + bodySize.width) : obstacle.x + obstacleSize.width - body.x;
  const dxExit = vx > 0 ? obstacle.x + obstacleSize.width - body.x : obstacle.x - (body.x + bodySize.width);
  const dyEntry = vy > 0 ? obstacle.y - (body.y + bodySize.height) : obstacle.y + obstacleSize.height - body.y;
  const dyExit = vy > 0 ? obstacle.y + obstacleSize.height - body.y : obstacle.y - (body.y + bodySize.height);
  const txEntry = vx === 0 ? Number.NEGATIVE_INFINITY : dxEntry / (vx * dt);
  const txExit = vx === 0 ? Number.POSITIVE_INFINITY : dxExit / (vx * dt);
  const tyEntry = vy === 0 ? Number.NEGATIVE_INFINITY : dyEntry / (vy * dt);
  const tyExit = vy === 0 ? Number.POSITIVE_INFINITY : dyExit / (vy * dt);
  const entryTime = Math.max(Math.min(txEntry, txExit), Math.min(tyEntry, tyExit));
  const exitTime = Math.min(Math.max(txEntry, txExit), Math.max(tyEntry, tyExit));
  if (entryTime > exitTime || entryTime < 0 || entryTime > 1) return null;
  if (obstacle.oneWay && body.y + bodySize.height > obstacle.y + 0.001) return null;
  let normalX = 0;
  let normalY = 0;
  if (Math.min(txEntry, txExit) > Math.min(tyEntry, tyExit)) normalX = vx > 0 ? -1 : 1;
  else normalY = vy > 0 ? -1 : 1;
  return Object.freeze({ obstacle, time: entryTime, normalX, normalY, remainingTime: dt * (1 - entryTime) });
}

export function sweepAabb(input) {
  coreInvariant(Number.isFinite(input.dt) && input.dt >= 0, `Invalid sweep dt: ${input.dt}`);
  const hits = (input.obstacles ?? [])
    .map((obstacle) => arcadeSweptTime(input.body, obstacle, input.vx, input.vy, input.dt))
    .filter(Boolean)
    .sort((a, b) => a.time - b.time || a.obstacle.id.localeCompare(b.obstacle.id));
  const hit = hits[0] ?? null;
  if (!hit) {
    return Object.freeze({
      x: input.body.x + input.vx * input.dt,
      y: input.body.y + input.vy * input.dt,
      vx: input.vx,
      vy: input.vy,
      hit: null,
    });
  }
  const epsilon = finiteNumber(input.epsilon, 0.0001);
  return Object.freeze({
    x: input.body.x + input.vx * input.dt * hit.time + hit.normalX * epsilon,
    y: input.body.y + input.vy * input.dt * hit.time + hit.normalY * epsilon,
    vx: hit.normalX !== 0 ? 0 : input.vx,
    vy: hit.normalY !== 0 ? 0 : input.vy,
    hit,
  });
}

export function createCollisionWorld(options = {}) {
  const cellSize = finiteNumber(options.cellSize, 64);
  const events = options.events ?? createEventBus();
  const bodies = new Map();
  let previousContacts = new Map();
  let lastIndex = buildSpatialIndex([], cellSize);

  const world = {
    events,
    upsert(body) {
      coreInvariant(typeof body?.id === 'string' && body.id.length > 0, 'collision body id is required');
      const normalized = Object.freeze({ enabled: true, isTrigger: false, ...body });
      bodies.set(normalized.id, normalized);
      return normalized;
    },
    remove(id) {
      return bodies.delete(id);
    },
    get(id) {
      return bodies.get(id);
    },
    clear() {
      const count = bodies.size;
      bodies.clear();
      previousContacts.clear();
      lastIndex = buildSpatialIndex([], cellSize);
      return count;
    },
    query(rect, queryOptions) {
      return querySpatialIndex(lastIndex, rect, queryOptions);
    },
    step() {
      lastIndex = buildSpatialIndex([...bodies.values()], cellSize);
      const pairs = spatialCollisionPairs(lastIndex);
      const current = new Map();
      for (const pair of pairs) {
        const key = arcadePairKey(pair.a, pair.b);
        const contact = Object.freeze({
          id: key,
          a: pair.a,
          b: pair.b,
          trigger: Boolean(pair.a.isTrigger || pair.b.isTrigger),
          manifold: computeCollisionManifold(pair.a, pair.b),
        });
        current.set(key, contact);
        events.emit(previousContacts.has(key) ? 'contact:stay' : 'contact:begin', contact);
      }
      for (const [key, contact] of previousContacts) {
        if (!current.has(key)) events.emit('contact:end', contact);
      }
      previousContacts = current;
      return Object.freeze({
        index: lastIndex,
        pairs: Object.freeze(pairs),
        contacts: Object.freeze([...current.values()]),
      });
    },
    snapshot() {
      return Object.freeze({
        bodyCount: bodies.size,
        contactCount: previousContacts.size,
        cellSize,
        bodyIds: Object.freeze([...bodies.keys()].sort()),
      });
    },
  };
  return world;
}

export function resolveHitboxContacts(input = {}) {
  const hits = [];
  const hurtboxes = [...(input.hurtboxes ?? [])].sort((a, b) => a.id.localeCompare(b.id));
  for (const hitbox of [...(input.hitboxes ?? [])].sort((a, b) => a.id.localeCompare(b.id))) {
    if (hitbox.active === false) continue;
    for (const hurtbox of hurtboxes) {
      if (hurtbox.active === false || hitbox.ownerId === hurtbox.actorId) continue;
      if (hitbox.team !== undefined && hurtbox.team !== undefined && hitbox.team === hurtbox.team) continue;
      if (!collisionLayersMatch(hitbox, hurtbox) || !aabbOverlap(hitbox, hurtbox)) continue;
      hits.push(Object.freeze({
        hitboxId: hitbox.id,
        hurtboxId: hurtbox.id,
        attackerId: hitbox.ownerId,
        targetId: hurtbox.actorId,
        damage: finiteNumber(hitbox.damage, 0),
        tags: Object.freeze([...(hitbox.tags ?? [])]),
      }));
    }
  }
  return Object.freeze(hits);
}

export function createProjectilePool(options = {}) {
  const pool = createRecyclingPool({
    capacity: options.capacity,
    create: options.create,
    reset: options.reset,
  });
  return {
    spawn(initializer) {
      return pool.acquire(initializer);
    },
    despawn(projectile) {
      return pool.release(projectile);
    },
    step(delta, update, shouldDespawn = (projectile) => projectile.active === false) {
      coreInvariant(typeof update === 'function', 'projectile pool update must be a function');
      const expired = [];
      pool.forEachActive((projectile, index, generation) => {
        update(projectile, delta, Object.freeze({ index, generation }));
        if (shouldDespawn(projectile)) expired.push(projectile);
      });
      for (const projectile of expired) pool.release(projectile);
      return expired.length;
    },
    activeValues: () => pool.activeValues(),
    clear: () => pool.clear(),
    snapshot: () => pool.snapshot(),
    pool,
  };
}

export function createPixiSceneGraph(options = {}) {
  const PIXI = options.PIXI;
  coreInvariant(PIXI?.Container, 'Pixi scene graph requires PIXI.Container');
  coreInvariant(options.stage?.addChild, 'Pixi scene graph requires a stage');
  const root = new PIXI.Container();
  root.label = options.label ?? 'arcade-root';
  const world = new PIXI.Container();
  const hud = new PIXI.Container();
  const overlay = new PIXI.Container();
  world.label = 'world';
  hud.label = 'hud';
  overlay.label = 'overlay';
  root.addChild(world, hud, overlay);
  options.stage.addChild(root);
  const parallax = new Map();
  let destroyed = false;

  const graph = {
    root,
    world,
    hud,
    overlay,
    addParallaxLayer(name, layerOptions = {}) {
      coreInvariant(!parallax.has(name), `parallax layer already exists: ${name}`);
      const container = layerOptions.container ?? new PIXI.Container();
      container.label = name;
      const entry = {
        name,
        container,
        factorX: finiteNumber(layerOptions.factorX, 1),
        factorY: finiteNumber(layerOptions.factorY, 1),
      };
      parallax.set(name, entry);
      world.addChild(container);
      if (Number.isFinite(layerOptions.order)) world.setChildIndex?.(container, Math.max(0, Math.floor(layerOptions.order)));
      return container;
    },
    layer(name) {
      if (name === 'world') return world;
      if (name === 'hud') return hud;
      if (name === 'overlay') return overlay;
      const entry = parallax.get(name);
      coreInvariant(entry, `unknown scene graph layer: ${name}`);
      return entry.container;
    },
    applyCamera(cameraState = {}) {
      const zoom = positiveNumber(cameraState.zoom, 1);
      const anchorX = finiteNumber(cameraState.anchorX, 0) * positiveNumber(cameraState.viewportWidth, 1);
      const anchorY = finiteNumber(cameraState.anchorY, 0) * positiveNumber(cameraState.viewportHeight, 1);
      const x = finiteNumber(cameraState.x, 0);
      const y = finiteNumber(cameraState.y, 0);
      const shakeX = finiteNumber(cameraState.shakeX, 0);
      const shakeY = finiteNumber(cameraState.shakeY, 0);
      world.position?.set?.(anchorX + shakeX, anchorY + shakeY);
      world.pivot?.set?.(x, y);
      world.scale?.set?.(zoom);
      for (const entry of parallax.values()) {
        entry.container.pivot?.set?.(x * entry.factorX, y * entry.factorY);
      }
      return graph;
    },
    snapshot() {
      return Object.freeze({
        destroyed,
        parallax: Object.freeze([...parallax.values()].map((entry) => Object.freeze({
          name: entry.name,
          factorX: entry.factorX,
          factorY: entry.factorY,
        }))),
      });
    },
    destroy() {
      if (destroyed) return false;
      destroyed = true;
      root.removeFromParent?.();
      root.destroy?.({ children: true });
      parallax.clear();
      return true;
    },
  };
  return graph;
}

export function createPixiSpritePool(options = {}) {
  coreInvariant(options.container?.addChild, 'Pixi sprite pool requires a container');
  const pool = createRecyclingPool({
    capacity: options.capacity,
    create(index) {
      const sprite = options.createSprite(index);
      sprite.visible = false;
      sprite.renderable = false;
      options.container.addChild(sprite);
      return sprite;
    },
    reset(sprite, context) {
      sprite.visible = context.reason === 'acquire';
      sprite.renderable = context.reason === 'acquire';
      options.reset?.(sprite, context);
    },
  });
  return {
    acquire: (initializer) => pool.acquire(initializer),
    release: (sprite) => pool.release(sprite),
    clear: () => pool.clear(),
    activeValues: () => pool.activeValues(),
    snapshot: () => pool.snapshot(),
    destroy() {
      pool.clear();
      for (const sprite of pool.values()) sprite.destroy?.();
    },
  };
}

function normalizeAssetManifest(manifest) {
  coreInvariant(manifest && typeof manifest === 'object', 'asset manifest is required');
  const assets = [...(manifest.assets ?? [])].map((asset) => Object.freeze({
    dependencies: [],
    groups: asset.group ? [asset.group] : [],
    ...asset,
    groups: Object.freeze([...(asset.groups ?? (asset.group ? [asset.group] : []))]),
    dependencies: Object.freeze([...(asset.dependencies ?? [])]),
  }));
  const byId = new Map();
  for (const asset of assets) {
    coreInvariant(typeof asset.id === 'string' && asset.id.length > 0, 'asset id is required');
    coreInvariant(typeof asset.type === 'string' && asset.type.length > 0, `asset type is required: ${asset.id}`);
    coreInvariant(typeof asset.src === 'string' && asset.src.length > 0, `asset src is required: ${asset.id}`);
    coreInvariant(!byId.has(asset.id), `duplicate asset id: ${asset.id}`);
    byId.set(asset.id, asset);
  }
  for (const asset of assets) {
    for (const dependency of asset.dependencies) coreInvariant(byId.has(dependency), `missing asset dependency ${dependency} for ${asset.id}`);
    if (asset.fallbackId) coreInvariant(byId.has(asset.fallbackId), `missing fallback asset ${asset.fallbackId} for ${asset.id}`);
  }
  const visiting = new Set();
  const visited = new Set();
  const visit = (id) => {
    if (visited.has(id)) return;
    coreInvariant(!visiting.has(id), `asset dependency cycle at ${id}`);
    visiting.add(id);
    const asset = byId.get(id);
    for (const dependency of [...asset.dependencies, ...(asset.fallbackId ? [asset.fallbackId] : [])]) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  for (const asset of assets) visit(asset.id);
  return Object.freeze({ version: manifest.version ?? 1, assets: Object.freeze(assets), byId });
}

export function validateAssetManifest(manifest) {
  const normalized = normalizeAssetManifest(manifest);
  return Object.freeze({ version: normalized.version, assets: normalized.assets });
}

export function createResourceScope(options = {}) {
  const entries = [];
  const children = [];
  let released = false;
  const scope = {
    name: options.name ?? 'scope',
    track(resource, disposer) {
      coreInvariant(!released, 'resource scope is released');
      const resolvedDisposer = disposer ?? ((value) => {
        if (typeof value?.destroy === 'function') return value.destroy();
        if (typeof value?.close === 'function') return value.close();
        if (typeof value?.stop === 'function') return value.stop();
        return undefined;
      });
      entries.push({ resource, disposer: resolvedDisposer });
      return resource;
    },
    child(name) {
      coreInvariant(!released, 'resource scope is released');
      const child = createResourceScope({ name });
      children.push(child);
      return child;
    },
    async release() {
      if (released) return false;
      released = true;
      const errors = [];
      for (const child of children.splice(0).reverse()) {
        try {
          await child.release();
        } catch (error) {
          errors.push(error);
        }
      }
      for (const entry of entries.splice(0).reverse()) {
        try {
          await entry.disposer?.(entry.resource);
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length > 0) {
        throw new AggregateError(errors, `resource scope "${scope.name}" release failed`);
      }
      return true;
    },
    snapshot() {
      return Object.freeze({ name: scope.name, released, resources: entries.length, children: children.length });
    },
  };
  return scope;
}

function selectManifestAssets(normalized, options = {}) {
  const selected = new Set(options.ids ?? []);
  const groups = new Set(options.groups ?? []);
  if (selected.size === 0 && groups.size === 0) for (const asset of normalized.assets) selected.add(asset.id);
  for (const asset of normalized.assets) {
    if (asset.groups.some((group) => groups.has(group))) selected.add(asset.id);
  }
  const includeDependencies = (id) => {
    const asset = normalized.byId.get(id);
    coreInvariant(asset, `unknown asset id: ${id}`);
    for (const dependency of [...asset.dependencies, ...(asset.fallbackId ? [asset.fallbackId] : [])]) {
      if (!selected.has(dependency)) selected.add(dependency);
      includeDependencies(dependency);
    }
  };
  for (const id of [...selected]) includeDependencies(id);
  const order = [];
  const visited = new Set();
  const visit = (id) => {
    if (visited.has(id)) return;
    const asset = normalized.byId.get(id);
    for (const dependency of asset.dependencies) visit(dependency);
    visited.add(id);
    order.push(asset);
  };
  for (const id of [...selected].sort()) visit(id);
  return order;
}

function abortAssetLoadError() {
  const error = new Error('asset loading aborted');
  error.name = 'AbortError';
  return error;
}

export function createAssetLoader(options = {}) {
  const loaders = { ...(options.loaders ?? {}) };
  const cache = new Map();
  const defaultRetries = Math.max(0, Math.floor(finiteNumber(options.retries, 1)));

  const loader = {
    cache,
    has(id) {
      return cache.has(id);
    },
    get(id) {
      return cache.get(id);
    },
    clear(id) {
      if (id === undefined) {
        const count = cache.size;
        cache.clear();
        return count;
      }
      return cache.delete(id);
    },
    async loadManifest(manifest, loadOptions = {}) {
      const normalized = normalizeAssetManifest(manifest);
      const plan = selectManifestAssets(normalized, loadOptions);
      const budget = loadOptions.budgetBytes ?? Number.POSITIVE_INFINITY;
      const declaredBytes = plan.reduce((total, asset) => total + Math.max(0, finiteNumber(asset.bytes, 0)), 0);
      coreInvariant(declaredBytes <= budget, `asset preload budget exceeded: ${declaredBytes} > ${budget}`);
      const scope = loadOptions.scope ?? createResourceScope({ name: loadOptions.scopeName ?? 'assets' });
      const result = new Map();
      let loadedBytes = 0;
      let loadedCount = 0;

      const loadOne = async (asset) => {
        if (loadOptions.signal?.aborted) throw abortAssetLoadError();
        if (cache.has(asset.id)) return cache.get(asset.id);
        const typeLoader = loadOptions.loaders?.[asset.type] ?? loaders[asset.type] ?? options.load;
        coreInvariant(typeof typeLoader === 'function', `no loader registered for asset type: ${asset.type}`);
        let lastError;
        const retries = Math.max(0, Math.floor(finiteNumber(asset.retries, defaultRetries)));
        for (let attempt = 0; attempt <= retries; attempt += 1) {
          if (loadOptions.signal?.aborted) throw abortAssetLoadError();
          try {
            const value = await typeLoader(asset, Object.freeze({ attempt, signal: loadOptions.signal, loader }));
            cache.set(asset.id, value);
            scope.track(value, asset.dispose);
            return value;
          } catch (error) {
            lastError = error;
          }
        }
        if (asset.fallbackId) {
          const fallback = await loadOne(normalized.byId.get(asset.fallbackId));
          cache.set(asset.id, fallback);
          return fallback;
        }
        throw lastError;
      };

      for (const asset of plan) {
        const value = await loadOne(asset);
        result.set(asset.id, value);
        loadedCount += 1;
        loadedBytes += Math.max(0, finiteNumber(asset.bytes, 0));
        loadOptions.onProgress?.(Object.freeze({
          id: asset.id,
          loadedCount,
          totalCount: plan.length,
          loadedBytes,
          declaredBytes,
          progress: plan.length ? loadedCount / plan.length : 1,
        }));
      }
      return Object.freeze({
        assets: result,
        scope,
        get: (id) => result.get(id) ?? cache.get(id),
        loadedBytes,
        declaredBytes,
      });
    },
  };
  return loader;
}

export function createAudioMixer(options = {}) {
  const context = options.context ?? options.createContext?.();
  coreInvariant(context?.createGain, 'audio mixer requires an audio context');
  const master = context.createGain();
  master.connect(context.destination);
  const busNames = options.buses ?? ['music', 'sfx', 'ui', 'voice'];
  const buses = new Map();
  const active = new Set();
  const masterState = { volume: clampNumber(options.masterVolume ?? 1, 0, 1), muted: false, ducks: new Map() };

  const effectiveVolume = (state) => {
    const duck = [...state.ducks.values()].reduce((value, factor) => value * factor, 1);
    return state.muted ? 0 : clampNumber(state.volume * duck, 0, 1);
  };
  const applyMaster = () => { master.gain.value = effectiveVolume(masterState); };
  applyMaster();
  for (const name of busNames) {
    const node = context.createGain();
    node.connect(master);
    const state = { name, node, volume: 1, muted: false, ducks: new Map() };
    node.gain.value = 1;
    buses.set(name, state);
  }
  const requireBus = (name) => {
    const bus = buses.get(name);
    coreInvariant(bus, `unknown audio bus: ${name}`);
    return bus;
  };
  const applyBus = (bus) => { bus.node.gain.value = effectiveVolume(bus); };

  const mixer = {
    context,
    master,
    setMasterVolume(volume) {
      masterState.volume = clampNumber(volume, 0, 1);
      applyMaster();
    },
    setVolume(name, volume) {
      const bus = requireBus(name);
      bus.volume = clampNumber(volume, 0, 1);
      applyBus(bus);
    },
    mute(name, muted = true) {
      const target = name === 'master' ? masterState : requireBus(name);
      target.muted = Boolean(muted);
      name === 'master' ? applyMaster() : applyBus(target);
    },
    duck(name, factor, token = Symbol(name)) {
      const target = name === 'master' ? masterState : requireBus(name);
      target.ducks.set(token, clampNumber(factor, 0, 1));
      name === 'master' ? applyMaster() : applyBus(target);
      return () => {
        const removed = target.ducks.delete(token);
        name === 'master' ? applyMaster() : applyBus(target);
        return removed;
      };
    },
    playBuffer(buffer, playOptions = {}) {
      const bus = requireBus(playOptions.bus ?? 'sfx');
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      source.loop = Boolean(playOptions.loop);
      gain.gain.value = clampNumber(playOptions.volume ?? 1, 0, 1);
      source.connect(gain);
      let tail = gain;
      if (Number.isFinite(playOptions.pan) && context.createStereoPanner) {
        const panner = context.createStereoPanner();
        panner.pan.value = clampNumber(playOptions.pan, -1, 1);
        gain.connect(panner);
        tail = panner;
      }
      tail.connect(bus.node);
      const handle = {
        source,
        stop() {
          if (!active.has(handle)) return false;
          active.delete(handle);
          source.stop?.();
          return true;
        },
      };
      source.onended = () => active.delete(handle);
      active.add(handle);
      source.start(playOptions.when ?? 0, playOptions.offset ?? 0);
      return handle;
    },
    async resume() {
      await context.resume?.();
    },
    async suspend() {
      await context.suspend?.();
    },
    snapshot() {
      return Object.freeze({
        state: context.state,
        master: effectiveVolume(masterState),
        buses: Object.freeze(Object.fromEntries([...buses].map(([name, bus]) => [name, effectiveVolume(bus)]))),
        activeSources: active.size,
      });
    },
    async destroy() {
      for (const handle of [...active]) handle.stop();
      await context.close?.();
    },
  };
  return mixer;
}

export function resolveSafeAreaLayout(input = {}) {
  const viewportWidth = positiveNumber(input.viewportWidth, 1);
  const viewportHeight = positiveNumber(input.viewportHeight, 1);
  const safe = {
    top: Math.max(0, finiteNumber(input.safeArea?.top, 0)),
    right: Math.max(0, finiteNumber(input.safeArea?.right, 0)),
    bottom: Math.max(0, finiteNumber(input.safeArea?.bottom, 0)),
    left: Math.max(0, finiteNumber(input.safeArea?.left, 0)),
  };
  const availableWidth = Math.max(1, viewportWidth - safe.left - safe.right);
  const availableHeight = Math.max(1, viewportHeight - safe.top - safe.bottom);
  const designWidth = positiveNumber(input.designWidth, availableWidth);
  const designHeight = positiveNumber(input.designHeight, availableHeight);
  const scaleX = availableWidth / designWidth;
  const scaleY = availableHeight / designHeight;
  const mode = input.mode ?? 'contain';
  const scale = mode === 'cover' ? Math.max(scaleX, scaleY) : mode === 'stretch' ? 1 : Math.min(scaleX, scaleY);
  const width = mode === 'stretch' ? availableWidth : designWidth * scale;
  const height = mode === 'stretch' ? availableHeight : designHeight * scale;
  return Object.freeze({
    viewport: Object.freeze({ x: 0, y: 0, width: viewportWidth, height: viewportHeight }),
    safeArea: Object.freeze(safe),
    available: Object.freeze({ x: safe.left, y: safe.top, width: availableWidth, height: availableHeight }),
    content: Object.freeze({
      x: safe.left + (availableWidth - width) / 2,
      y: safe.top + (availableHeight - height) / 2,
      width,
      height,
    }),
    scale: Object.freeze({ x: mode === 'stretch' ? scaleX : scale, y: mode === 'stretch' ? scaleY : scale }),
  });
}

function focusableItems(items) {
  return items.filter((item) => item.disabled !== true && item.hidden !== true);
}

export function createFocusNavigator(options = {}) {
  let items = [...(options.items ?? [])];
  let focusedId = options.initialId ?? focusableItems(items)[0]?.id ?? null;
  const wrap = options.wrap !== false;
  const events = options.events ?? createEventBus();

  const navigator = {
    events,
    setItems(nextItems) {
      items = [...nextItems];
      if (!focusableItems(items).some((item) => item.id === focusedId)) focusedId = focusableItems(items)[0]?.id ?? null;
      return navigator.current();
    },
    current() {
      return items.find((item) => item.id === focusedId) ?? null;
    },
    focus(id, reason = 'programmatic') {
      const item = focusableItems(items).find((candidate) => candidate.id === id);
      if (!item || item.id === focusedId) return false;
      const previousId = focusedId;
      focusedId = item.id;
      events.emit('focus:change', Object.freeze({ previousId, id: focusedId, reason, item }));
      return true;
    },
    move(direction) {
      const available = focusableItems(items);
      if (!available.length) return null;
      const currentIndex = Math.max(0, available.findIndex((item) => item.id === focusedId));
      let next = null;
      if (direction === 'next' || direction === 'right' || direction === 'down') next = currentIndex + 1;
      else if (direction === 'previous' || direction === 'left' || direction === 'up') next = currentIndex - 1;
      else throw new Error(`unknown focus direction: ${direction}`);
      if (wrap) next = (next + available.length) % available.length;
      else next = clampNumber(next, 0, available.length - 1);
      navigator.focus(available[next].id, direction);
      return navigator.current();
    },
    activate() {
      const item = navigator.current();
      if (!item) return false;
      item.onActivate?.(item);
      events.emit('focus:activate', Object.freeze({ id: item.id, item }));
      return true;
    },
    snapshot() {
      return Object.freeze({ focusedId, items: Object.freeze(items.map((item) => Object.freeze({ id: item.id, disabled: Boolean(item.disabled), hidden: Boolean(item.hidden) }))) });
    },
  };
  return navigator;
}

export function createInputHintTracker(options = {}) {
  let device = options.initialDevice ?? 'keyboard';
  let changedAt = finiteNumber(options.now?.(), 0);
  const events = options.events ?? createEventBus();
  return {
    events,
    note(nextDevice, timestamp = options.now?.() ?? Date.now()) {
      coreInvariant(['keyboard', 'gamepad', 'pointer', 'touch'].includes(nextDevice), `unknown input device: ${nextDevice}`);
      if (nextDevice === device) return false;
      const previous = device;
      device = nextDevice;
      changedAt = timestamp;
      events.emit('input-device:change', Object.freeze({ previous, device, changedAt }));
      return true;
    },
    noteActionState(state, timestamp) {
      const sources = Object.values(state ?? {}).map((entry) => entry?.source).filter(Boolean);
      if (sources.some((source) => source.startsWith('gamepad:'))) return this.note('gamepad', timestamp);
      if (sources.some((source) => source.startsWith('key:'))) return this.note('keyboard', timestamp);
      return false;
    },
    snapshot: () => Object.freeze({ device, changedAt }),
  };
}

export function createAccessibilityPreferences(initial = {}) {
  const events = createEventBus();
  let state = {
    reducedMotion: false,
    highContrast: false,
    captions: true,
    screenReader: false,
    textScale: 1,
    ...initial,
  };
  state.textScale = clampNumber(state.textScale, 0.75, 2);
  return {
    events,
    set(patch, reason = 'user') {
      const previous = Object.freeze({ ...state });
      state = { ...state, ...patch, textScale: clampNumber(patch.textScale ?? state.textScale, 0.75, 2) };
      const next = Object.freeze({ ...state });
      events.emit('accessibility:change', Object.freeze({ previous, next, reason }));
      return next;
    },
    snapshot: () => Object.freeze({ ...state }),
    motion(duration) {
      return state.reducedMotion ? 0 : Math.max(0, finiteNumber(duration, 0));
    },
  };
}

function messageAt(messages, locale, key) {
  const parts = key.split('.');
  let value = messages?.[locale];
  for (const part of parts) value = value?.[part];
  return value;
}

function formatMessage(template, variables) {
  return String(template).replace(/\{([A-Za-z0-9_]+)\}/g, (_, key) => variables[key] ?? `{${key}}`);
}

export function createMessageCatalog(options = {}) {
  let locale = options.locale ?? options.fallbackLocale ?? 'en';
  const fallbackLocale = options.fallbackLocale ?? locale;
  let messages = { ...(options.messages ?? {}) };
  return {
    setLocale(nextLocale) {
      locale = nextLocale;
    },
    addMessages(nextLocale, nextMessages) {
      messages = { ...messages, [nextLocale]: { ...(messages[nextLocale] ?? {}), ...nextMessages } };
    },
    translate(key, variables = {}) {
      let value = messageAt(messages, locale, key) ?? messageAt(messages, fallbackLocale, key);
      if (value && typeof value === 'object') {
        const count = Number(variables.count);
        value = count === 1 ? value.one ?? value.other : value.other ?? value.one;
      }
      if (value === undefined) return options.missing?.(key, locale) ?? key;
      return formatMessage(value, variables);
    },
    has(key) {
      return messageAt(messages, locale, key) !== undefined || messageAt(messages, fallbackLocale, key) !== undefined;
    },
    snapshot: () => Object.freeze({ locale, fallbackLocale, locales: Object.freeze(Object.keys(messages).sort()) }),
  };
}

export function createTextMeasureCache(options = {}) {
  coreInvariant(typeof options.measure === 'function', 'text measure cache requires a measure function');
  const cache = new Map();
  return {
    measure(text, style = {}) {
      const key = stableSnapshotString({ text, style }, { precision: 6 });
      if (!cache.has(key)) cache.set(key, options.measure(text, style));
      return cache.get(key);
    },
    clear() {
      const count = cache.size;
      cache.clear();
      return count;
    },
    snapshot: () => Object.freeze({ size: cache.size }),
  };
}

export function createMemoryStorageAdapter(seed = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { return data.delete(key); },
    keys: () => [...data.keys()].sort(),
    snapshot: () => Object.freeze(Object.fromEntries([...data.entries()].sort(([a], [b]) => a.localeCompare(b)))),
  };
}

export function createStorageAdapter(storage) {
  coreInvariant(storage?.getItem && storage?.setItem, 'storage adapter requires getItem and setItem');
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem?.(key),
    keys() {
      const keys = [];
      for (let index = 0; index < (storage.length ?? 0); index += 1) {
        const key = storage.key?.(index);
        if (key !== null && key !== undefined) keys.push(key);
      }
      return keys.sort();
    },
  };
}

function parseStoreEnvelope(raw) {
  const envelope = JSON.parse(raw);
  coreInvariant(envelope?.format === 1, 'unsupported store envelope');
  coreInvariant(Number.isInteger(envelope.version) && envelope.version >= 0, 'invalid store version');
  coreInvariant(envelope.checksum === deterministicHash(envelope.data), 'store checksum mismatch');
  return envelope;
}

export function createVersionedStore(options = {}) {
  const adapter = options.adapter ?? createMemoryStorageAdapter();
  const key = options.key;
  const version = Math.floor(finiteNumber(options.version, 1));
  coreInvariant(typeof key === 'string' && key.length > 0, 'versioned store key is required');
  coreInvariant(version >= 1, 'versioned store version must be positive');
  const backupKey = options.backupKey ?? `${key}.backup`;
  const tempKey = `${key}.tmp`;
  const defaults = () => arcadeClone(typeof options.defaults === 'function' ? options.defaults() : options.defaults ?? {});
  const validate = (data) => options.validate ? options.validate(data) !== false : true;

  const migrate = (envelope) => {
    let currentVersion = envelope.version;
    let data = arcadeClone(envelope.data);
    while (currentVersion < version) {
      const nextVersion = currentVersion + 1;
      const migration = options.migrations?.[nextVersion];
      coreInvariant(typeof migration === 'function', `missing migration to version ${nextVersion}`);
      data = migration(data, Object.freeze({ from: currentVersion, to: nextVersion }));
      currentVersion = nextVersion;
    }
    coreInvariant(currentVersion === version, `stored version ${currentVersion} is newer than ${version}`);
    coreInvariant(validate(data), 'stored data failed validation');
    return { data, migrated: envelope.version !== version };
  };

  const currentRevision = () => {
    const raw = adapter.getItem(key);
    if (raw === null) return -1;
    try {
      return Math.max(-1, Math.floor(finiteNumber(parseStoreEnvelope(raw).revision, -1)));
    } catch {
      return -1;
    }
  };

  const commit = (data, metadata = {}, commitOptions = {}) => {
      coreInvariant(validate(data), 'save data failed validation');
      const revision = metadata.revision === undefined
        ? currentRevision() + 1
        : Math.max(0, Math.floor(finiteNumber(metadata.revision, 0)));
      const envelope = {
        format: 1,
        version,
        savedAt: finiteNumber(metadata.savedAt, options.now?.() ?? Date.now()),
        revision: Math.max(0, revision),
        data: arcadeClone(data),
      };
      envelope.checksum = deterministicHash(envelope.data);
      const serialized = JSON.stringify(envelope);
      const previous = adapter.getItem(key);
      if (commitOptions.backupPrevious !== false && previous !== null) adapter.setItem(backupKey, previous);
      adapter.setItem(tempKey, serialized);
      adapter.setItem(key, serialized);
      adapter.removeItem?.(tempKey);
      return Object.freeze({ ...envelope, data: arcadeClone(envelope.data) });
  };

  const store = {
    save(data, metadata = {}) {
      return commit(data, metadata);
    },
    load() {
      const candidates = [
        ['primary', adapter.getItem(key)],
        ['temporary', adapter.getItem(tempKey)],
        ['backup', adapter.getItem(backupKey)],
      ];
      for (const [source, raw] of candidates) {
        if (raw === null) continue;
        try {
          const envelope = parseStoreEnvelope(raw);
          const result = migrate(envelope);
          if (result.migrated || source !== 'primary') {
            commit(
              result.data,
              { savedAt: envelope.savedAt, revision: envelope.revision + 1 },
              { backupPrevious: source === 'primary' },
            );
          }
          return Object.freeze({ data: arcadeClone(result.data), source, migrated: result.migrated, recovered: source !== 'primary', version });
        } catch (error) {
          options.onCorruption?.(Object.freeze({ source, error }));
        }
      }
      return Object.freeze({ data: defaults(), source: 'default', migrated: false, recovered: false, version });
    },
    clear() {
      adapter.removeItem?.(key);
      adapter.removeItem?.(backupKey);
      adapter.removeItem?.(tempKey);
    },
    inspect() {
      return Object.freeze({ key, backupKey, tempKey, version, hasPrimary: adapter.getItem(key) !== null, hasBackup: adapter.getItem(backupKey) !== null });
    },
  };
  return store;
}

export function createProfileStore(options = {}) {
  const adapter = options.adapter ?? createMemoryStorageAdapter();
  const indexKey = `${options.key}.profiles`;
  const maxSlots = Math.max(1, Math.floor(finiteNumber(options.maxSlots, 4)));
  const profileId = (id) => {
    coreInvariant(typeof id === 'string' && id.length > 0, 'profile id is required');
    return id;
  };
  const readIndex = () => {
    try {
      const parsed = JSON.parse(adapter.getItem(indexKey) ?? '[]');
      if (!Array.isArray(parsed)) return [];
      return [...new Set(parsed.filter((id) => typeof id === 'string' && id.length > 0))]
        .sort()
        .slice(0, maxSlots);
    } catch {
      return [];
    }
  };
  const writeIndex = (ids) => adapter.setItem(indexKey, JSON.stringify([...new Set(ids)].sort().slice(0, maxSlots)));
  const slot = (id) => createVersionedStore({ ...options, adapter, key: `${options.key}.profile.${profileId(id)}` });
  return {
    list: () => Object.freeze(readIndex().sort()),
    load(id) {
      return slot(profileId(id)).load();
    },
    save(id, data, metadata) {
      profileId(id);
      const ids = readIndex();
      if (!ids.includes(id)) {
        coreInvariant(ids.length < maxSlots, `profile slot limit reached: ${maxSlots}`);
        writeIndex([...ids, id]);
      }
      return slot(id).save(data, metadata);
    },
    remove(id) {
      const resolvedId = profileId(id);
      slot(resolvedId).clear();
      writeIndex(readIndex().filter((candidate) => candidate !== resolvedId));
    },
  };
}

export function resolveStorageConflict(local, remote, options = {}) {
  if (!local) return Object.freeze({ winner: 'remote', value: remote });
  if (!remote) return Object.freeze({ winner: 'local', value: local });
  if (typeof options.merge === 'function') return Object.freeze({ winner: 'merged', value: options.merge(local, remote) });
  const strategy = options.strategy ?? 'newer';
  if (strategy === 'local') return Object.freeze({ winner: 'local', value: local });
  if (strategy === 'remote') return Object.freeze({ winner: 'remote', value: remote });
  const localTime = finiteNumber(local.savedAt, 0);
  const remoteTime = finiteNumber(remote.savedAt, 0);
  if (localTime === remoteTime) {
    return deterministicHash(local) <= deterministicHash(remote)
      ? Object.freeze({ winner: 'local', value: local })
      : Object.freeze({ winner: 'remote', value: remote });
  }
  return localTime > remoteTime
    ? Object.freeze({ winner: 'local', value: local })
    : Object.freeze({ winner: 'remote', value: remote });
}

export function createStatisticsService(initial = {}) {
  const values = new Map(Object.entries(initial).map(([key, value]) => [key, finiteNumber(value, 0)]));
  return {
    increment(key, amount = 1) {
      const next = finiteNumber(values.get(key), 0) + finiteNumber(amount, 0);
      values.set(key, next);
      return next;
    },
    set(key, value) {
      values.set(key, finiteNumber(value, 0));
      return values.get(key);
    },
    max(key, value) {
      return this.set(key, Math.max(finiteNumber(values.get(key), Number.NEGATIVE_INFINITY), finiteNumber(value, 0)));
    },
    min(key, value) {
      return this.set(key, Math.min(finiteNumber(values.get(key), Number.POSITIVE_INFINITY), finiteNumber(value, 0)));
    },
    get: (key) => values.get(key) ?? 0,
    snapshot: () => Object.freeze(Object.fromEntries([...values.entries()].sort(([a], [b]) => a.localeCompare(b)))),
    reset() { values.clear(); },
  };
}

export function createAchievementService(options = {}) {
  const definitions = new Map((options.definitions ?? []).map((definition) => [definition.id, Object.freeze({ target: 1, ...definition })]));
  const progress = new Map(Object.entries(options.initial?.progress ?? {}).map(([id, value]) => [id, finiteNumber(value, 0)]));
  const unlocked = new Set(options.initial?.unlocked ?? []);
  const events = options.events ?? createEventBus();
  const service = {
    events,
    record(id, amount = 1, context) {
      const definition = definitions.get(id);
      coreInvariant(definition, `unknown achievement: ${id}`);
      if (unlocked.has(id)) return false;
      const current = progress.get(id) ?? 0;
      const next = definition.reduce ? definition.reduce(current, amount, context) : current + finiteNumber(amount, 0);
      progress.set(id, next);
      events.emit('achievement:progress', Object.freeze({ id, current, progress: next, target: definition.target }));
      if (next >= definition.target) return service.unlock(id, context);
      return false;
    },
    consume(event, payload) {
      let changed = 0;
      for (const definition of [...definitions.values()].sort((a, b) => a.id.localeCompare(b.id))) {
        if (definition.event !== event || unlocked.has(definition.id)) continue;
        const amount = definition.select ? definition.select(payload) : 1;
        if (service.record(definition.id, amount, payload)) changed += 1;
      }
      return changed;
    },
    unlock(id, context) {
      const definition = definitions.get(id);
      coreInvariant(definition, `unknown achievement: ${id}`);
      if (unlocked.has(id)) return false;
      unlocked.add(id);
      progress.set(id, Math.max(progress.get(id) ?? 0, definition.target));
      events.emit('achievement:unlocked', Object.freeze({ id, definition, context }));
      return true;
    },
    isUnlocked: (id) => unlocked.has(id),
    snapshot() {
      return Object.freeze({
        progress: Object.freeze(Object.fromEntries([...progress.entries()].sort(([a], [b]) => a.localeCompare(b)))),
        unlocked: Object.freeze([...unlocked].sort()),
      });
    },
  };
  return service;
}

export function createRunSummary(input = {}) {
  const startedAt = finiteNumber(input.startedAt, 0);
  const endedAt = Math.max(startedAt, finiteNumber(input.endedAt, startedAt));
  const summary = {
    version: 1,
    game: input.game ?? 'unknown',
    mode: input.mode ?? 'unknown',
    seed: input.seed ?? 0,
    startedAt,
    endedAt,
    duration: endedAt - startedAt,
    result: input.result ?? null,
    score: finiteNumber(input.score, 0),
    stats: stableSnapshot(input.stats ?? {}),
    achievements: Object.freeze([...(input.achievements ?? [])].sort()),
    commandHash: input.commands ? deterministicHash(typeof input.commands === 'string' ? parseCommandStream(input.commands) : input.commands) : null,
    stateHash: input.finalState === undefined ? null : deterministicHash(input.finalState),
    metadata: stableSnapshot(input.metadata ?? {}),
  };
  return Object.freeze({ ...summary, summaryHash: deterministicHash(summary) });
}

export function verifyRunSummary(summary) {
  const { summaryHash, ...payload } = summary;
  return summaryHash === deterministicHash(payload);
}

// END ARCADE SERVICES 0.13-0.16

// BEGIN ARCADE SERVICES 0.17-1.0

export const ARCADE_RUNTIME_API_LEVEL = 1;

export const ARCADE_RUNTIME_CAPABILITIES = Object.freeze([
  'action-phases',
  'assets',
  'audio',
  'collision',
  'deterministic-replay',
  'entity-world',
  'gameplay-modules',
  'input',
  'localization',
  'netcode-adapters',
  'performance-budgets',
  'persistence',
  'pixi-rendering',
  'runtime-host',
  'runtime-inspector',
  'scenes',
  'system-pipeline',
  'ui-accessibility',
]);

export function getArcadeRuntimeCapabilities() {
  return Object.freeze({
    package: '@arcade/runtime',
    version: ARCADE_RUNTIME_VERSION,
    apiLevel: ARCADE_RUNTIME_API_LEVEL,
    capabilities: ARCADE_RUNTIME_CAPABILITIES,
  });
}

export function assertArcadeRuntimeCompatibility(requirements = {}) {
  const minimumApiLevel = Math.max(0, Math.floor(finiteNumber(requirements.apiLevel, 0)));
  coreInvariant(
    ARCADE_RUNTIME_API_LEVEL >= minimumApiLevel,
    `arcade runtime API level ${ARCADE_RUNTIME_API_LEVEL} does not satisfy ${minimumApiLevel}`,
  );
  const available = new Set(ARCADE_RUNTIME_CAPABILITIES);
  const missing = [...(requirements.capabilities ?? [])].filter((capability) => !available.has(capability));
  coreInvariant(missing.length === 0, `missing arcade runtime capabilities: ${missing.join(', ')}`);
  if (requirements.major !== undefined) {
    const major = Number.parseInt(ARCADE_RUNTIME_VERSION.split('.')[0], 10);
    coreInvariant(major === requirements.major, `arcade runtime major ${major} does not satisfy ${requirements.major}`);
  }
  return getArcadeRuntimeCapabilities();
}

function requireFrame(frame, label = 'frame') {
  const resolved = Math.floor(finiteNumber(frame, -1));
  coreInvariant(resolved >= 0, `${label} must be a non-negative integer`);
  return resolved;
}

export function createInputDelayBuffer(options = {}) {
  const delayFrames = Math.max(0, Math.floor(finiteNumber(options.delayFrames, 0)));
  const clone = options.clone ?? arcadeClone;
  const frames = new Map();
  let writes = 0;

  const buffer = {
    delayFrames,
    put(playerId, inputFrame, input) {
      coreInvariant(typeof playerId === 'string' && playerId.length > 0, 'input player id is required');
      const frame = requireFrame(inputFrame, 'input frame');
      const entries = frames.get(frame) ?? new Map();
      entries.set(playerId, clone(input));
      frames.set(frame, entries);
      writes += 1;
      return frame + delayFrames;
    },
    has(playerId, inputFrame) {
      return frames.get(requireFrame(inputFrame, 'input frame'))?.has(playerId) ?? false;
    },
    get(playerId, inputFrame) {
      const value = frames.get(requireFrame(inputFrame, 'input frame'))?.get(playerId);
      return value === undefined ? undefined : clone(value);
    },
    resolve(simulationFrame, playerIds, fallback) {
      const frame = requireFrame(simulationFrame, 'simulation frame');
      const sourceFrame = frame - delayFrames;
      const inputs = {};
      const missing = [];
      for (const playerId of playerIds) {
        const value = sourceFrame >= 0 ? frames.get(sourceFrame)?.get(playerId) : undefined;
        if (value === undefined) {
          missing.push(playerId);
          inputs[playerId] = clone(typeof fallback === 'function' ? fallback(playerId, sourceFrame) : fallback);
        } else {
          inputs[playerId] = clone(value);
        }
      }
      return Object.freeze({
        simulationFrame: frame,
        sourceFrame,
        inputs: Object.freeze(inputs),
        missing: Object.freeze(missing),
        predicted: missing.length > 0,
      });
    },
    prune(beforeInputFrame) {
      const threshold = requireFrame(beforeInputFrame, 'prune frame');
      let removed = 0;
      for (const frame of [...frames.keys()]) {
        if (frame < threshold) {
          frames.delete(frame);
          removed += 1;
        }
      }
      return removed;
    },
    snapshot() {
      return Object.freeze({
        delayFrames,
        writes,
        frames: Object.freeze([...frames.keys()].sort((a, b) => a - b)),
      });
    },
  };
  return buffer;
}

export function createStateHistory(options = {}) {
  const capacity = Math.max(2, Math.floor(finiteNumber(options.capacity, 120)));
  const clone = options.clone ?? arcadeClone;
  const snapshotState = options.snapshot ?? ((state) => state);
  const hashState = options.hash ?? ((state) => deterministicHash(snapshotState(state)));
  const entries = new Map();

  const history = {
    capacity,
    save(frame, state, metadata = {}) {
      const resolvedFrame = requireFrame(frame);
      const entry = Object.freeze({
        frame: resolvedFrame,
        state: clone(state),
        hash: hashState(state),
        metadata: stableSnapshot(metadata),
      });
      entries.set(resolvedFrame, entry);
      while (entries.size > capacity) entries.delete(Math.min(...entries.keys()));
      return entry;
    },
    has(frame) {
      return entries.has(requireFrame(frame));
    },
    get(frame) {
      const entry = entries.get(requireFrame(frame));
      return entry ? Object.freeze({ ...entry, state: clone(entry.state) }) : null;
    },
    nearestAtOrBefore(frame) {
      const target = requireFrame(frame);
      const candidate = [...entries.keys()].filter((value) => value <= target).sort((a, b) => b - a)[0];
      return candidate === undefined ? null : history.get(candidate);
    },
    pruneAfter(frame) {
      const threshold = requireFrame(frame);
      let removed = 0;
      for (const candidate of [...entries.keys()]) {
        if (candidate > threshold) {
          entries.delete(candidate);
          removed += 1;
        }
      }
      return removed;
    },
    clear() {
      const count = entries.size;
      entries.clear();
      return count;
    },
    frames() {
      return Object.freeze([...entries.keys()].sort((a, b) => a - b));
    },
    snapshot() {
      const frames = history.frames();
      return Object.freeze({
        capacity,
        size: entries.size,
        firstFrame: frames[0] ?? null,
        lastFrame: frames.at(-1) ?? null,
      });
    },
  };
  return history;
}

function rollbackInputsEqual(left, right) {
  if (left === undefined || right === undefined) return left === right;
  return stableSnapshotString(left) === stableSnapshotString(right);
}

export function createRollbackSession(options = {}) {
  coreInvariant(typeof options.step === 'function', 'rollback session requires a step function');
  const players = Object.freeze([...(options.players ?? [])]);
  coreInvariant(players.length > 0, 'rollback session requires at least one player');
  coreInvariant(players.every((playerId) => typeof playerId === 'string' && playerId.length > 0), 'rollback player ids must be non-empty strings');
  coreInvariant(new Set(players).size === players.length, 'rollback player ids must be unique');
  const cloneState = options.cloneState ?? options.clone ?? arcadeClone;
  const cloneInput = options.cloneInput ?? arcadeClone;
  const events = options.events ?? createEventBus();
  const delay = options.inputBuffer ?? createInputDelayBuffer({
    delayFrames: options.inputDelayFrames,
    clone: cloneInput,
  });
  const history = options.history ?? createStateHistory({
    capacity: options.historyFrames,
    clone: cloneState,
    snapshot: options.snapshot,
  });
  const usedInputs = new Map();
  const remoteChecksums = new Map();
  let state = cloneState(options.initialState);
  let frame = 0;
  let rollbackCount = 0;
  let resimulatedFrames = 0;
  let rejectedLateInputs = 0;
  history.save(0, state, { initial: true });

  const pruneRetainedFrames = () => {
    const oldestFrame = history.snapshot().firstFrame;
    if (oldestFrame === null) return;
    for (const candidate of [...usedInputs.keys()]) {
      if (candidate < oldestFrame) usedInputs.delete(candidate);
    }
    delay.prune(Math.max(0, oldestFrame - delay.delayFrames));
    for (const [key, report] of remoteChecksums) {
      if (report.frame < oldestFrame) remoteChecksums.delete(key);
    }
  };

  const defaultInput = (playerId, inputFrame) => {
    if (typeof options.defaultInput === 'function') return options.defaultInput(playerId, inputFrame);
    return options.defaultInput ?? null;
  };

  const inputsForFrame = (simulationFrame) => {
    const resolved = delay.resolve(simulationFrame, players, (playerId, inputFrame) => {
      const previous = usedInputs.get(simulationFrame - 1)?.inputs?.[playerId];
      return previous === undefined ? defaultInput(playerId, inputFrame) : previous;
    });
    return resolved;
  };

  const simulate = (simulationFrame, resimulation = false) => {
    const inputFrame = inputsForFrame(simulationFrame);
    const context = Object.freeze({
      frame: simulationFrame,
      sourceFrame: inputFrame.sourceFrame,
      predictedPlayers: inputFrame.missing,
      resimulation,
      session,
    });
    state = options.step(cloneState(state), inputFrame.inputs, context);
    frame = simulationFrame;
    usedInputs.set(frame, inputFrame);
    history.save(frame, state, {
      sourceFrame: inputFrame.sourceFrame,
      predictedPlayers: inputFrame.missing,
    });
    pruneRetainedFrames();
    if (resimulation) resimulatedFrames += 1;
    events.emit(resimulation ? 'rollback:resimulate' : 'rollback:advance', Object.freeze({ frame, state: cloneState(state), inputFrame }));
    return cloneState(state);
  };

  const rollbackAndReplay = (targetFrame, finalFrame) => {
    const base = history.get(targetFrame);
    coreInvariant(base, `rollback history does not contain frame ${targetFrame}`);
    state = cloneState(base.state);
    frame = targetFrame;
    history.pruneAfter(targetFrame);
    for (const candidate of [...usedInputs.keys()]) if (candidate > targetFrame) usedInputs.delete(candidate);
    rollbackCount += 1;
    events.emit('rollback:begin', Object.freeze({ targetFrame, finalFrame }));
    while (frame < finalFrame) simulate(frame + 1, true);
    events.emit('rollback:end', Object.freeze({ frame, rollbackCount, resimulatedFrames }));
  };

  const session = {
    events,
    players,
    delay,
    history,
    submitInput(playerId, inputFrame, input) {
      coreInvariant(players.includes(playerId), `unknown rollback player: ${playerId}`);
      const simulationFrame = delay.put(playerId, inputFrame, input);
      if (simulationFrame > 0 && simulationFrame <= frame) {
        const used = usedInputs.get(simulationFrame)?.inputs?.[playerId];
        if (!rollbackInputsEqual(used, input)) {
          const finalFrame = frame;
          const targetFrame = Math.max(0, simulationFrame - 1);
          if (!history.has(targetFrame)) {
            rejectedLateInputs += 1;
            const report = Object.freeze({
              playerId,
              inputFrame: requireFrame(inputFrame, 'input frame'),
              simulationFrame,
              currentFrame: frame,
              oldestFrame: history.snapshot().firstFrame,
            });
            events.emit('rollback:input-too-old', report);
            pruneRetainedFrames();
          } else {
            rollbackAndReplay(targetFrame, finalFrame);
          }
        }
      }
      return simulationFrame;
    },
    receiveInput(playerId, inputFrame, input) {
      return session.submitInput(playerId, inputFrame, input);
    },
    advance(inputs = {}) {
      const inputFrame = frame + 1;
      for (const [playerId, input] of Object.entries(inputs)) session.submitInput(playerId, inputFrame, input);
      return simulate(frame + 1, false);
    },
    advanceTo(targetFrame, inputProvider) {
      const target = requireFrame(targetFrame, 'target frame');
      while (frame < target) session.advance(inputProvider?.(frame + 1, session) ?? {});
      return cloneState(state);
    },
    rollbackTo(targetFrame) {
      const target = requireFrame(targetFrame, 'rollback frame');
      coreInvariant(target <= frame, `cannot roll forward to frame ${target}`);
      rollbackAndReplay(target, target);
      return cloneState(state);
    },
    checksum(targetFrame = frame) {
      return history.get(targetFrame)?.hash ?? null;
    },
    compareRemoteChecksum(peerId, targetFrame, checksum) {
      const resolvedFrame = requireFrame(targetFrame);
      const local = session.checksum(resolvedFrame);
      const match = local === checksum;
      const report = Object.freeze({ peerId, frame: resolvedFrame, local, remote: checksum, match });
      remoteChecksums.set(`${peerId}\u0000${resolvedFrame}`, report);
      events.emit(match ? 'checksum:match' : 'checksum:mismatch', report);
      return report;
    },
    getState() {
      return cloneState(state);
    },
    snapshot() {
      return Object.freeze({
        frame,
        checksum: session.checksum(),
        rollbackCount,
        resimulatedFrames,
        rejectedLateInputs,
        inputDelayFrames: delay.delayFrames,
        history: history.snapshot(),
        retainedInputFrames: usedInputs.size,
        bufferedInputFrames: delay.snapshot().frames.length,
        remoteChecksums: remoteChecksums.size,
      });
    },
  };
  return session;
}

export function createLocalTransportPair(options = {}) {
  const schedule = options.schedule ?? ((deliver) => queueMicrotask(deliver));
  const clone = options.clone ?? arcadeClone;
  const makeEndpoint = (name) => {
    const listeners = new Set();
    const stats = { sent: 0, received: 0, dropped: 0 };
    let peer = null;
    let closed = false;
    const endpoint = {
      name,
      send(message) {
        if (closed || !peer || peer.closed) return false;
        stats.sent += 1;
        if (options.drop?.(message, Object.freeze({ from: name, sent: stats.sent }))) {
          stats.dropped += 1;
          return false;
        }
        const payload = clone(message);
        schedule(() => peer.deliver(payload), options.latencyMs ?? 0);
        return true;
      },
      onMessage(listener) {
        coreInvariant(typeof listener === 'function', 'transport listener must be a function');
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      close() {
        if (closed) return false;
        closed = true;
        listeners.clear();
        return true;
      },
      snapshot: () => Object.freeze({ name, closed, ...stats }),
      get closed() {
        return closed;
      },
      setPeer(nextPeer) {
        peer = nextPeer;
      },
      deliver(message) {
        if (closed) return;
        stats.received += 1;
        for (const listener of [...listeners]) listener(clone(message));
      },
    };
    return endpoint;
  };
  const first = makeEndpoint(options.firstName ?? 'a');
  const second = makeEndpoint(options.secondName ?? 'b');
  first.setPeer(second);
  second.setPeer(first);
  return Object.freeze([first, second]);
}

export function createRuntimeInspector(options = {}) {
  const sources = new Map();
  const captures = [];
  const capacity = Math.max(1, Math.floor(finiteNumber(options.capacity, 120)));
  const now = options.now ?? (() => Date.now());
  let nextCaptureIndex = 0;

  const inspector = {
    register(name, source) {
      coreInvariant(typeof name === 'string' && name.length > 0, 'inspector source name is required');
      coreInvariant(!sources.has(name), `inspector source already exists: ${name}`);
      sources.set(name, source);
      return () => sources.delete(name);
    },
    inspect(name) {
      const source = sources.get(name);
      coreInvariant(source !== undefined, `unknown inspector source: ${name}`);
      const value = typeof source === 'function' ? source() : source?.snapshot ? source.snapshot() : source;
      return stableSnapshot(value);
    },
    capture(label = 'capture', metadata = {}) {
      const values = {};
      for (const name of [...sources.keys()].sort()) values[name] = inspector.inspect(name);
      const capture = Object.freeze({
        index: nextCaptureIndex,
        label,
        time: now(),
        metadata: stableSnapshot(metadata),
        values: Object.freeze(values),
        hash: deterministicHash({ label, metadata, values }),
      });
      captures.push(capture);
      nextCaptureIndex += 1;
      if (captures.length > capacity) captures.shift();
      options.onCapture?.(capture);
      return capture;
    },
    history() {
      return Object.freeze([...captures]);
    },
    export() {
      return JSON.stringify({ version: 1, captures }, null, 2);
    },
    clear() {
      const count = captures.length;
      captures.length = 0;
      return count;
    },
    snapshot() {
      return Object.freeze({ sources: Object.freeze([...sources.keys()].sort()), captures: captures.length, capacity, nextCaptureIndex });
    },
  };
  for (const [name, source] of Object.entries(options.sources ?? {})) inspector.register(name, source);
  if (options.host) inspector.register('host', options.host);
  return inspector;
}

export function createReplayTimeline(options = {}) {
  const stream = typeof options.stream === 'string' ? parseCommandStream(options.stream) : options.stream;
  coreInvariant(stream?.entries, 'replay timeline requires a command stream');
  const entries = Object.freeze([...stream.entries].sort((a, b) => a.tick - b.tick || a.sequence - b.sequence));
  const frames = options.frames ? Object.freeze([...options.frames]) : Object.freeze([]);
  let cursor = entries.length ? 0 : -1;

  const timeline = {
    stream,
    entries,
    frames,
    current() {
      return cursor < 0 ? null : entries[cursor] ?? null;
    },
    seekIndex(index) {
      if (!entries.length) {
        cursor = -1;
        return null;
      }
      cursor = clampNumber(Math.floor(finiteNumber(index, 0)), 0, entries.length - 1);
      return timeline.current();
    },
    seekTick(tick) {
      const target = requireFrame(tick, 'replay tick');
      let index = entries.findIndex((entry) => entry.tick >= target);
      if (index < 0) index = entries.length - 1;
      return timeline.seekIndex(index);
    },
    next() {
      return timeline.seekIndex(cursor + 1);
    },
    previous() {
      return timeline.seekIndex(cursor - 1);
    },
    frameAtCursor() {
      const current = timeline.current();
      if (!current) return null;
      return frames.find((frame) => frame.tick === current.tick && frame.sequence === current.sequence) ?? null;
    },
    range(fromTick, toTick) {
      return Object.freeze(entries.filter((entry) => entry.tick >= fromTick && entry.tick <= toTick));
    },
    snapshot() {
      return Object.freeze({ cursor, size: entries.length, current: timeline.current(), frame: timeline.frameAtCursor() });
    },
  };
  return timeline;
}

export function createPerformanceBudgetMonitor(options = {}) {
  const profiler = options.profiler ?? createArcadeFrameProfiler({
    sampleSize: options.sampleSize,
    now: options.now,
  });
  const budgets = new Map(Object.entries(options.budgets ?? {}));

  const monitor = {
    profiler,
    setBudget(name, budget) {
      budgets.set(name, Object.freeze({ ...budget }));
    },
    record(name, durationMs) {
      return profiler.record(name, durationMs);
    },
    measure(name, callback) {
      return profiler.measure(name, callback);
    },
    measureAsync(name, callback) {
      return profiler.measureAsync(name, callback);
    },
    evaluate(name) {
      const summary = profiler.snapshot(name);
      const budget = budgets.get(name) ?? {};
      const violations = [];
      if (Number.isFinite(budget.meanMs) && summary.meanMs > budget.meanMs) violations.push({ metric: 'meanMs', budget: budget.meanMs, actual: summary.meanMs });
      if (Number.isFinite(budget.p95Ms) && summary.p95Ms > budget.p95Ms) violations.push({ metric: 'p95Ms', budget: budget.p95Ms, actual: summary.p95Ms });
      if (Number.isFinite(budget.maxMs) && summary.maxMs > budget.maxMs) violations.push({ metric: 'maxMs', budget: budget.maxMs, actual: summary.maxMs });
      if (Number.isFinite(budget.minimumSamples) && summary.count < budget.minimumSamples) violations.push({ metric: 'count', budget: budget.minimumSamples, actual: summary.count });
      return Object.freeze({ name, pass: violations.length === 0, summary, budget: Object.freeze({ ...budget }), violations: Object.freeze(violations.map(Object.freeze)) });
    },
    evaluateAll() {
      return Object.freeze([...budgets.keys()].sort().map((name) => monitor.evaluate(name)));
    },
    assert(name) {
      const result = monitor.evaluate(name);
      coreInvariant(result.pass, `performance budget failed for ${name}: ${result.violations.map((entry) => `${entry.metric} ${entry.actual} > ${entry.budget}`).join(', ')}`);
      return result;
    },
    snapshot() {
      const results = monitor.evaluateAll();
      return Object.freeze({ pass: results.every((result) => result.pass), results });
    },
  };
  return monitor;
}

export async function runHeadlessScenario(options = {}) {
  coreInvariant(typeof options.step === 'function', 'headless scenario requires a step function');
  const ticks = Math.max(0, Math.floor(finiteNumber(options.ticks, 0)));
  let state = arcadeClone(typeof options.setup === 'function' ? await options.setup() : options.initialState);
  const frames = [];
  for (let tick = 1; tick <= ticks; tick += 1) {
    const command = options.command?.(tick, state) ?? null;
    state = await options.step(state, command, Object.freeze({ tick }));
    const snapshot = stableSnapshot(options.snapshot ? options.snapshot(state, tick) : state);
    const frame = Object.freeze({ tick, command: stableSnapshot(command), snapshot, hash: deterministicHash(snapshot) });
    frames.push(frame);
    options.assert?.(frame, state);
  }
  const result = Object.freeze({
    name: options.name ?? 'scenario',
    ticks,
    state,
    frames: Object.freeze(frames),
    finalHash: frames.at(-1)?.hash ?? deterministicHash(options.snapshot ? options.snapshot(state, 0) : state),
  });
  options.teardown?.(state, result);
  return result;
}

// END ARCADE SERVICES 0.17-1.0
