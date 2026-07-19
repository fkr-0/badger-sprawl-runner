// GENERATED FILE — DO NOT EDIT DIRECTLY.
// Edit source/types/*.d.ts.inc and run `npm run source:build`.

import type { Application, Container, Texture } from 'pixi.js';

export type ArcadePixiNamespace = {
  Application: typeof import('pixi.js').Application;
  Container: typeof import('pixi.js').Container;
  Assets: typeof import('pixi.js').Assets;
  TextureStyle?: typeof import('pixi.js').TextureStyle;
  Texture?: typeof import('pixi.js').Texture;
  Sprite?: typeof import('pixi.js').Sprite;
};

export declare const ARCADE_RUNTIME_VERSION: string;
/** @deprecated Use ARCADE_RUNTIME_VERSION. */
export declare const ARCADE_PIXI_RUNTIME_VERSION: string;
/** @deprecated Use ARCADE_RUNTIME_VERSION. */
export declare const ARCADE_CORE_VERSION: string;
export declare const DEFAULT_ARCADE_LAYERS: readonly string[];

/** @deprecated Use clampNumber. */
export declare function clampArcadeValue(value: number, minimum: number, maximum: number): number;
/** @deprecated Use approach. */
export declare function approachArcadeValue(current: number, target: number, maximumDelta: number): number;
/** @deprecated Use approach(value, 0, drag * delta). */
export declare function applyArcadeDrag(value: number, drag: number, delta?: number): number;

export type ArcadeKinematicBody2D = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

/** @deprecated Use integrateBody. */
export declare function integrateArcadeBody2D<T extends ArcadeKinematicBody2D>(
  body: T,
  delta?: number,
): T;

export type ArcadeAnimationMode = 'loop' | 'once' | 'pingpong';

export type ArcadeAnimationClock = {
  frame: number;
  elapsed: number;
  direction: 1 | -1;
  playing: boolean;
  paused: boolean;
  completed: boolean;
  frameAdvances: number;
  advancedFrames: readonly number[];
};

export type ArcadeAnimationTimeline = {
  frameCount: number;
  frameDuration: number | readonly number[] | ((frame: number) => number);
  mode?: ArcadeAnimationMode;
  speed?: number;
  maxAdvances?: number;
  singleFrameMode?: 'hold' | 'complete';
};

export declare function createArcadeAnimationClock(
  initial?: Partial<ArcadeAnimationClock>,
): ArcadeAnimationClock;

export declare function playArcadeAnimationClock(
  state?: Partial<ArcadeAnimationClock>,
  options?: { restart?: boolean; frame?: number; direction?: 1 | -1 },
): ArcadeAnimationClock;

export declare function advanceArcadeAnimationClock(
  state: Partial<ArcadeAnimationClock>,
  deltaTime: number,
  timeline: ArcadeAnimationTimeline,
): ArcadeAnimationClock;

export type DeterministicRngState = {
  seed: number;
  calls: number;
};

export type DeterministicRngResult = {
  state: DeterministicRngState;
  value: number;
};

export declare function hashSeed(seed: string): number;
export declare function createDeterministicRng(seed?: number | string): DeterministicRngState;
export declare function nextRng(state: DeterministicRngState): DeterministicRngResult;
export declare function rngRange(
  state: DeterministicRngState,
  minimum: number,
  maximum: number,
): DeterministicRngResult;
export declare function rngInt(
  state: DeterministicRngState,
  minimumInclusive: number,
  maximumInclusive: number,
): DeterministicRngResult;
export declare function rngPick<T>(
  state: DeterministicRngState,
  values: readonly T[],
): { state: DeterministicRngState; value: T; index: number };
export declare function rngWeightedPick<T>(
  state: DeterministicRngState,
  values: readonly T[],
  weightOf?: (value: T, index: number) => number,
): {
  state: DeterministicRngState;
  value: T;
  index: number;
  roll: number;
  totalWeight: number;
};
export declare function rngShuffle<T>(
  state: DeterministicRngState,
  values: readonly T[],
): { state: DeterministicRngState; value: T[] };

export type SeededRandomSource = (() => number) & {
  snapshot(): DeterministicRngState;
  restore(state: DeterministicRngState): SeededRandomSource;
};

export declare function createSeededRandom(seed?: number | string): SeededRandomSource;

export type CooldownState = Readonly<Record<string, number>>;

export declare function createCooldownState(initial?: CooldownState): Record<string, number>;
export declare function startCooldown(
  state: CooldownState,
  key: string,
  duration: number,
): Record<string, number>;
export declare function clearCooldown(
  state: CooldownState,
  key?: string,
): Record<string, number>;
export declare function stepCooldownState(
  state: CooldownState,
  delta?: number,
): Record<string, number>;
export declare function cooldownRemaining(state: CooldownState, key: string): number;
export declare function isCooldownReady(state: CooldownState, key: string): boolean;
export declare function tryStartCooldown(
  state: CooldownState,
  key: string,
  duration: number,
): {
  started: boolean;
  state: Record<string, number>;
  remaining: number;
};
export declare function getElapsedCooldownStatus(
  now: number,
  lastTriggeredAt: number,
  duration: number,
): {
  ready: boolean;
  elapsed: number;
  remaining: number;
  progress: number;
};

export interface ArcadeSpriteBox {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}

export interface ArcadeSpriteAnimationEvent {
  frame: number;
  kind: string;
  name?: string;
  payload?: Readonly<Record<string, unknown>>;
}

export interface ArcadeSpriteGrid {
  columns: number;
  rows: number;
}

export interface ArcadeSpriteAnimation {
  frames: number;
  fps: number;
  order?: readonly number[];
  loop?: boolean;
  anchor?: readonly [number, number];
  hitboxes?: readonly ArcadeSpriteBox[];
  hurtboxes?: readonly ArcadeSpriteBox[];
  events?: readonly ArcadeSpriteAnimationEvent[];
  tags?: readonly string[];
}

export interface ArcadeSpriteSheet {
  id: string;
  file: string;
  frameSize: readonly [number, number];
  grid?: ArcadeSpriteGrid;
  animations: Readonly<Record<string, ArcadeSpriteAnimation>>;
  source?: Readonly<Record<string, unknown>>;
}

export interface ArcadeSpriteManifest {
  version: string;
  sheets: readonly ArcadeSpriteSheet[];
}

export interface ArcadeSpriteManifestSource {
  version?: string;
  schemaVersion?: string | number;
  sheets?: readonly ArcadeSpriteSheet[];
  spriteSheets?: readonly ArcadeSpriteSheet[];
  baseGrid?: number;
}

export interface ArcadeSpriteFrameAddress {
  sheetId: string;
  animationName: string;
  localFrame: number;
  absoluteFrame: number;
  sourceX: number;
  sourceY: number;
  frameWidth: number;
  frameHeight: number;
  anchorX: number;
  anchorY: number;
  pivotX: number;
  pivotY: number;
  anchorUnits: 'pixels';
}

export interface ArcadeSpriteCompiledFrame {
  frameIndex: number;
  duration: number;
  address: ArcadeSpriteFrameAddress;
}

export interface ArcadeSpriteClip {
  id: string;
  sheetId: string;
  animationName: string;
  frameCount: number;
  fps: number;
  frameDuration: number;
  frameDurationMs: number;
  mode: 'loop' | 'once';
  anchor: readonly [number, number];
  hitboxes: readonly ArcadeSpriteBox[];
  hurtboxes: readonly ArcadeSpriteBox[];
  tags: readonly string[];
  frames: readonly ArcadeSpriteCompiledFrame[];
}

export interface ArcadeSpriteManifestIndex {
  manifest: ArcadeSpriteManifest;
  size: number;
  ids: readonly string[];
  has(id: string): boolean;
  get(id: string): ArcadeSpriteSheet | null;
}

export declare function validateArcadeSpriteManifest(value: unknown): value is ArcadeSpriteManifestSource;
export declare function normalizeArcadeSpriteManifest(value: unknown): ArcadeSpriteManifest;
export declare function resolveArcadeSpriteFrame(
  sheet: ArcadeSpriteSheet,
  animationName: string,
  frameIndex: number,
): ArcadeSpriteFrameAddress | null;
export declare function compileArcadeSpriteClip(
  sheet: ArcadeSpriteSheet,
  animationName: string,
): ArcadeSpriteClip | null;
export declare function collectArcadeSpriteAnimationEvents(
  animation: ArcadeSpriteAnimation | null | undefined,
  advancedFrames?: readonly number[],
): readonly ArcadeSpriteAnimationEvent[];
export declare function createArcadeSpriteManifestIndex(value: unknown): ArcadeSpriteManifestIndex;

export type ArcadeSpritePixelData = Readonly<{
  data: ArrayLike<number>;
  width: number;
  height: number;
}>;

export type ArcadeSpritePixelRectangle = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type ArcadeSpriteInspectableFrame = Readonly<{
  absoluteFrame?: number;
  index?: number;
  sourceX?: number;
  sourceY?: number;
  x?: number;
  y?: number;
  frameWidth?: number;
  frameHeight?: number;
  width?: number;
  height?: number;
  anchorX?: number;
  anchorY?: number;
  pivotX?: number;
  pivotY?: number;
  anchorUnits?: 'pixels' | 'normalized';
  anchor?: readonly [number, number] | Readonly<{ x: number; y: number }>;
  pivot?: readonly [number, number] | Readonly<{ x: number; y: number }>;
}>;

export type ArcadeSpritePixelSource = Readonly<{
  width: number;
  height: number;
  data?: ArrayLike<number>;
  id?: PropertyKey;
  cacheKey?: PropertyKey;
  readPixels?(
    rectangle: ArcadeSpritePixelRectangle,
    frame: ArcadeSpriteInspectableFrame,
  ): ArcadeSpritePixelData;
  getImageData?(x: number, y: number, width: number, height: number): ArcadeSpritePixelData;
}>;

export type ArcadeSpriteFrameInspection = Readonly<{
  frameIndex: number;
  width: number;
  height: number;
  sourceRect: ArcadeSpritePixelRectangle;
  opaqueBounds: ArcadeSpritePixelRectangle;
  opaquePixels: number;
  opaqueCoverage: number;
  topAndSideEdgeCoverage: number;
  boundsValid: true;
  pivotValid: boolean;
  transparent: boolean;
  opaque: boolean;
  blank: boolean;
  backgroundLeak: boolean;
  diagnostics: readonly string[];
}>;

export type ArcadeSpriteFrameCache<Value> = {
  get(key: string): Value | undefined;
  set(key: string, value: Value): unknown;
};

export type ArcadeSpriteInspectionOptions = {
  alphaThreshold?: number;
  edgeWidth?: number;
  blankCoverageThreshold?: number;
  backgroundLeakCoverageThreshold?: number;
  backgroundLeakEdgeThreshold?: number;
  cacheKey?: PropertyKey | ((source: ArcadeSpritePixelSource, frame: ArcadeSpriteInspectableFrame) => PropertyKey | null | undefined);
  cache?: ArcadeSpriteFrameCache<ArcadeSpriteFrameInspection>;
  processedFrameCache?: ArcadeSpriteFrameCache<ArcadeSpritePixelData>;
  readPixels?(
    source: ArcadeSpritePixelSource | unknown,
    rectangle: ArcadeSpritePixelRectangle,
    frame: ArcadeSpriteInspectableFrame,
  ): ArcadeSpritePixelData;
  processPixels?(
    pixels: ArcadeSpritePixelData,
    context: Readonly<{
      source: ArcadeSpritePixelSource | unknown;
      frame: ArcadeSpriteInspectableFrame;
      rectangle: ArcadeSpritePixelRectangle;
    }>,
  ): ArcadeSpritePixelData | void;
};

export declare function inspectArcadeSpriteFrame(
  source: ArcadeSpritePixelSource | unknown,
  frame: ArcadeSpriteInspectableFrame,
  options?: ArcadeSpriteInspectionOptions,
): ArcadeSpriteFrameInspection;

export type ArcadeSpriteInspectableAtlas = Readonly<{
  source?: ArcadeSpritePixelSource | unknown;
  image?: ArcadeSpritePixelSource | unknown;
  frames: readonly ArcadeSpriteInspectableFrame[];
  frameHeight?: number;
}>;

export type ArcadeSpriteVisibleScaleOptions = {
  source?: ArcadeSpritePixelSource | unknown;
  frames?: readonly ArcadeSpriteInspectableFrame[];
  frameIndexes?: readonly number[];
  targetVisibleHeight?: number;
  fallbackVisibleHeight?: number;
  multiplier?: number;
  minimum?: number;
  maximum?: number;
  representative?: 'median' | 'mean' | 'min' | 'max' | ((orderedHeights: readonly number[]) => number);
  inspectionOptions?: ArcadeSpriteInspectionOptions;
  inspect?: (
    source: ArcadeSpritePixelSource | unknown,
    frame: ArcadeSpriteInspectableFrame,
    options?: ArcadeSpriteInspectionOptions,
  ) => ArcadeSpriteFrameInspection;
};

export declare function resolveArcadeSpriteVisibleScale(
  atlas: ArcadeSpriteInspectableAtlas,
  options?: ArcadeSpriteVisibleScaleOptions,
): number;

export type ArcadeSpriteFrameTransform = Readonly<{
  x?: number;
  y?: number;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  flipX?: boolean;
}>;

export type ArcadeSpriteFrameGeometry = Readonly<{
  source: ArcadeSpritePixelRectangle;
  local: ArcadeSpritePixelRectangle;
  destination: ArcadeSpritePixelRectangle;
  pivot: Readonly<{
    sourceX: number;
    sourceY: number;
    x: number;
    y: number;
    destinationX: number;
    destinationY: number;
  }>;
  matrix: Readonly<{
    a: number;
    b: 0;
    c: 0;
    d: number;
    tx: number;
    ty: number;
  }>;
  flipX: boolean;
  scaleX: number;
  scaleY: number;
}>;

export declare function createArcadeSpriteFrameGeometry(
  frame: ArcadeSpriteInspectableFrame,
  transform?: ArcadeSpriteFrameTransform,
): ArcadeSpriteFrameGeometry;

export type SnapshotValue =
  | null
  | boolean
  | number
  | string
  | SnapshotValue[]
  | { [key: string]: SnapshotValue | undefined };

export type SnapshotHashOptions = {
  precision?: number;
  ignoreKeys?: readonly string[];
};

export declare function stableSnapshot(
  value: SnapshotValue,
  options?: SnapshotHashOptions,
): SnapshotValue;
export declare function stableSnapshotString(
  value: SnapshotValue,
  options?: SnapshotHashOptions,
): string;
export declare function fnv1a32(input: string): string;
export declare function deterministicHash(
  value: SnapshotValue,
  options?: SnapshotHashOptions,
): string;

export type ArcadeCommandEntry<Command extends SnapshotValue = SnapshotValue> = {
  tick: number;
  sequence: number;
  command: Command;
};

export type ArcadeCommandStream<Command extends SnapshotValue = SnapshotValue> = {
  version: 1;
  startTick: number;
  endTick: number;
  metadata: SnapshotValue;
  entries: ArcadeCommandEntry<Command>[];
};

export type ArcadeCommandRecorder<Command extends SnapshotValue = SnapshotValue> = {
  record(command: Command, atTick?: number): ArcadeCommandEntry<Command>;
  advance(amount?: number): number;
  setTick(nextTick: number): number;
  snapshot(): ArcadeCommandStream<Command>;
  serialize(): string;
  clear(nextTick?: number): ArcadeCommandRecorder<Command>;
  readonly tick: number;
  readonly size: number;
};

export declare function createCommandRecorder<Command extends SnapshotValue = SnapshotValue>(
  options?: {
    startTick?: number;
    capacity?: number;
    metadata?: SnapshotValue;
  },
): ArcadeCommandRecorder<Command>;

export declare function serializeCommandStream<Command extends SnapshotValue>(
  stream: ArcadeCommandStream<Command>,
): string;
export declare function parseCommandStream(serialized: string): ArcadeCommandStream;

export type ArcadeReplayContext<Command extends SnapshotValue = SnapshotValue> = Readonly<{
  index: number;
  tick: number;
  sequence: number;
  command: Command | null;
  stream: ArcadeCommandStream<Command>;
}>;

export type ArcadeReplayFrame = {
  index: number;
  tick: number;
  sequence: number;
  hash: string;
  snapshot?: SnapshotValue;
};

export type ArcadeReplayResult<State, Command extends SnapshotValue = SnapshotValue> = {
  stream: ArcadeCommandStream<Command>;
  finalState: State;
  frames: ArcadeReplayFrame[];
  finalHash: string;
};

export declare function replayCommandStream<State, Command extends SnapshotValue>(options: {
  initialState: State;
  stream: ArcadeCommandStream<Command> | string;
  reduce: (
    state: State,
    command: Command,
    context: ArcadeReplayContext<Command>,
  ) => State;
  snapshot?: (state: State, context: ArcadeReplayContext<Command>) => SnapshotValue;
  cloneInitialState?: (state: State) => State;
  hashOptions?: SnapshotHashOptions;
  includeSnapshots?: boolean;
}): ArcadeReplayResult<State, Command>;

export type ReplayHashFrame = {
  hash?: string;
  frameHash?: string;
};

export type ReplayMismatch = {
  index: number;
  expected: string;
  actual: string;
};

export declare function verifyReplayHashes(
  actual: readonly ReplayHashFrame[] | { frames: readonly ReplayHashFrame[] },
  expectedHashes: readonly string[],
): ReplayMismatch[];

export type SnapshotDiffEntry = {
  path: string;
  left: SnapshotValue | undefined;
  right: SnapshotValue | undefined;
};

export declare function diffSnapshots(input: {
  left: SnapshotValue;
  right: SnapshotValue;
  ignorePaths?: readonly string[];
  hashOptions?: SnapshotHashOptions;
}): SnapshotDiffEntry[];

export type ArcadeEventHandler<Payload> = (payload: Payload) => void;

export type ArcadeEventBusSnapshot<EventKey = PropertyKey> = Readonly<{
  eventCount: number;
  listenerCount: number;
  emittedEvents: number;
  events: readonly Readonly<{ event: EventKey; listeners: number }>[];
}>;

export type ArcadeEventBus<Events extends object> = {
  on<Key extends keyof Events>(
    event: Key,
    handler: ArcadeEventHandler<Events[Key]>,
  ): () => void;
  once<Key extends keyof Events>(
    event: Key,
    handler: ArcadeEventHandler<Events[Key]>,
  ): () => void;
  off<Key extends keyof Events>(event?: Key, handler?: ArcadeEventHandler<Events[Key]>): boolean;
  clear<Key extends keyof Events>(event?: Key): boolean;
  emit<Key extends keyof Events>(event: Key, payload: Events[Key]): number;
  hasListeners<Key extends keyof Events>(event: Key): boolean;
  listenerCount<Key extends keyof Events>(event?: Key): number;
  snapshot(): ArcadeEventBusSnapshot<keyof Events>;
};

export declare function createEventBus<Events extends object>(): ArcadeEventBus<Events>;

export type RecyclingPoolResetReason = 'acquire' | 'release' | 'clear';

export type RecyclingPoolResetContext = Readonly<{
  index: number;
  reason: RecyclingPoolResetReason;
  recycled: boolean;
  generation: number;
}>;

export type RecyclingPoolAcquireContext = Readonly<{
  index: number;
  recycled: boolean;
  generation: number;
}>;

export type RecyclingPoolSnapshot = Readonly<{
  capacity: number;
  active: number;
  acquired: number;
  released: number;
  recycled: number;
}>;

export type RecyclingPool<Value> = {
  acquire(initializer?: (value: Value, context: RecyclingPoolAcquireContext) => void): Value;
  release(value: Value): boolean;
  clear(): number;
  forEachActive(callback: (value: Value, index: number, generation: number) => void): void;
  activeValues(): Value[];
  values(): Value[];
  isActive(value: Value): boolean;
  snapshot(): RecyclingPoolSnapshot;
  readonly capacity: number;
};

export declare function createRecyclingPool<Value>(options: {
  capacity: number;
  create: (index: number) => Value;
  reset?: (value: Value, context: RecyclingPoolResetContext) => void;
}): RecyclingPool<Value>;

export type TimelineQueueEntry<Value> = Readonly<{
  at: number;
  sequence: number;
  value: Value;
}>;
export type TimelineQueueState<Value> = Readonly<{
  time: number;
  nextSequence: number;
  entries: readonly TimelineQueueEntry<Value>[];
}>;
export declare function createTimelineQueue<Value>(
  values?: readonly Value[],
  options?: { time?: number; getAt?: (value: Value, time: number, sequence: number) => number },
): TimelineQueueState<Value>;
export declare function enqueueTimelineEntry<Value>(
  state: TimelineQueueState<Value>,
  value: Value,
  options?: { at?: number; getAt?: (value: Value, time: number, sequence: number) => number },
): TimelineQueueState<Value>;
export declare function stepTimelineQueue<Value>(
  state: TimelineQueueState<Value>,
  delta: number,
): Readonly<{
  state: TimelineQueueState<Value>;
  due: readonly Value[];
  pending: readonly Value[];
}>;

export type TimedEffectState<Kind extends string = string, Payload = unknown> = {
  id: string;
  kind: Kind;
  sourceId?: string;
  duration: number;
  remaining: number;
  stacks: number;
  maxStacks: number;
  magnitude: number;
  tickInterval?: number;
  tickTimer?: number;
  payload?: Payload;
};
export type TimedEffectEvent<Effect extends TimedEffectState = TimedEffectState> = Readonly<
  | { kind: 'tick'; effect: Readonly<Effect>; tickIndex: number }
  | { kind: 'expired'; effect: Readonly<Effect> }
>;
export declare function applyTimedEffect<Effect extends TimedEffectState>(
  effects: readonly Effect[],
  incoming: Effect,
  options?: {
    match?: 'id' | 'kind' | 'id-or-kind';
    merge?: 'replace' | 'stack';
    refreshDuration?: 'max' | 'incoming';
    magnitude?: 'max' | 'incoming' | 'add';
    position?: 'replace' | 'append';
  },
): Readonly<{
  effects: readonly Effect[];
  event: Readonly<{ kind: 'applied' | 'replaced' | 'stacked'; effect: Readonly<Effect> }>;
}>;
export declare function stepTimedEffects<Effect extends TimedEffectState>(
  effects: readonly Effect[],
  delta: number,
): Readonly<{
  effects: readonly Effect[];
  advanced: readonly Readonly<Effect>[];
  events: readonly TimedEffectEvent<Effect>[];
}>;
export declare function hasTimedEffect<Effect extends TimedEffectState>(
  effects: readonly Effect[],
  value: string,
  options?: { field?: 'id' | 'kind' },
): boolean;

export type SystemPipelineControl = Readonly<{
  halt?: boolean;
  skipPhase?: boolean | string;
  skipPhases?: readonly string[];
}>;
export type SystemPipelineFrame<Context> = Readonly<{
  pipeline: SystemPipeline<Context>;
  run: number;
  index: number;
  name: string;
  phase: string;
}>;
export type SystemPipelineOptions<Context> = {
  phase?: string;
  order?: number;
  priority?: number;
  enabled?: boolean;
  before?: string | readonly string[];
  after?: string | readonly string[];
  when?: (context: Context) => boolean;
};
export type SystemPipelineSnapshot = Readonly<{
  phases: readonly string[];
  runs: number;
  executions: number;
  systems: readonly Readonly<{
    name: string;
    phase: string;
    order: number;
    priority: number;
    enabled: boolean;
    before: readonly string[];
    after: readonly string[];
    sequence: number;
    executions: number;
  }>[];
}>;
export type SystemPipelineRunResult<Context> = Readonly<{
  context: Context;
  halted: boolean;
  executed: readonly string[];
  skippedPhases: readonly string[];
  results: readonly Readonly<{ name: string; phase: string; result: unknown }>[];
}>;
export type SystemPipeline<Context> = {
  add(
    name: string,
    update: (context: Context, frame: SystemPipelineFrame<Context>) => void | SystemPipelineControl,
    options?: SystemPipelineOptions<Context>,
  ): () => boolean;
  remove(name: string): boolean;
  has(name: string): boolean;
  setEnabled(name: string, enabled: boolean): SystemPipeline<Context>;
  run(context: Context, options?: { phases?: string | readonly string[] }): SystemPipelineRunResult<Context>;
  names(): string[];
  snapshot(): SystemPipelineSnapshot;
};
export declare function createSystemPipeline<Context = unknown>(options?: {
  phases?: readonly string[];
}): SystemPipeline<Context>;

export type HitContactRecord = Readonly<{ hits: number; lastHitTick: number }>;
export type HitContactPolicy = Readonly<{ maxHitsPerTarget?: number; rehitDelayTicks?: number; rehitDelayFrames?: number }>;
export type HitContactLedger = {
  canRegister(targetId: string, tick: number, policy?: HitContactPolicy): boolean;
  register(targetId: string, tick: number, amount?: number): HitContactRecord;
  get(targetId: string): HitContactRecord | undefined;
  has(targetId: string): boolean;
  clear(targetId?: string): number | boolean;
  targetIds(): string[];
  snapshot(): Readonly<{ size: number; records: readonly Readonly<{ targetId: string; hits: number; lastHitTick: number }>[] }>;
};
export declare function createHitContactLedger(options?: {
  records?: Map<string, Partial<HitContactRecord> & { lastHitFrame?: number }> | readonly (string | ({ targetId: string } & Partial<HitContactRecord> & { lastHitFrame?: number }))[] | Record<string, Partial<HitContactRecord> & { lastHitFrame?: number }>;
}): HitContactLedger;

export type CameraRigState = {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  lookaheadX: number;
  lookaheadY: number;
  shake: number;
  shakeX: number;
  shakeY: number;
};
export type CameraRig = CameraRigState & {
  set(patch?: Partial<CameraRigState> & { shakeOffsetX?: number; shakeOffsetY?: number }): CameraRig;
  follow(targets: readonly { x: number; y: number; weight?: number }[], options?: { offsetX?: number; offsetY?: number }): CameraRig;
  target(x: number, y?: number): CameraRig;
  addShake(intensity: number): CameraRig;
  step(delta?: number, options?: {
    velocityX?: number;
    velocityY?: number;
    lookaheadScaleX?: number;
    lookaheadScaleY?: number;
    lookaheadMinX?: number;
    lookaheadMaxX?: number;
    lookaheadMinY?: number;
    lookaheadMaxY?: number;
    lookaheadBlend?: number;
    lookaheadBlendX?: number;
    lookaheadBlendY?: number;
    lookaheadRate?: number;
    lookaheadRateX?: number;
    lookaheadRateY?: number;
    lookaheadRateSame?: number;
    lookaheadRateOpposite?: number;
    lookaheadRateSameX?: number;
    lookaheadRateOppositeX?: number;
    lookaheadRateSameY?: number;
    lookaheadRateOppositeY?: number;
    offsetX?: number;
    offsetY?: number;
    followBlend?: number;
    followBlendX?: number;
    followBlendY?: number;
    followRate?: number;
    followRateX?: number;
    followRateY?: number;
    followRateFar?: number;
    followRateFarX?: number;
    followRateFarY?: number;
    farThreshold?: number;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    zoomTarget?: number;
    zoomBlend?: number;
    zoomRate?: number;
    rateMode?: 'linear' | 'exponential';
    shakeDecayMultiplier?: number;
    shakeDecayRate?: number;
    shakeScale?: number;
    shakeEpsilon?: number;
    random?: () => number;
  }): Readonly<CameraRigState>;
  snapshot(): Readonly<CameraRigState>;
};
export declare function createCameraRig(initial?: Partial<CameraRigState> & { shakeOffsetX?: number; shakeOffsetY?: number }): CameraRig;

export type ArcadeCameraState = {
  x: number;
  y: number;
  zoom: number;
  shakeX: number;
  shakeY: number;
  viewportWidth: number;
  viewportHeight: number;
  anchorX: number;
  anchorY: number;
};

export type ArcadeCameraTransform = {
  set(next?: Partial<ArcadeCameraState>): ArcadeCameraTransform;
  resize(viewportWidth: number, viewportHeight: number): ArcadeCameraTransform;
  snapshot(): Readonly<ArcadeCameraState>;
  worldToScreen(point: { x: number; y: number }): { x: number; y: number };
  screenToWorld(point: { x: number; y: number }): { x: number; y: number };
  applyToCanvas(context: CanvasRenderingContext2D): ArcadeCameraTransform;
  applyToContainer(container: Container): ArcadeCameraTransform;
};

export declare function createArcadeCameraTransform(
  initial?: Partial<ArcadeCameraState>,
): ArcadeCameraTransform;

export type ArcadePerformanceSummary = {
  count: number;
  lastMs: number;
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
};

export type ArcadeFrameProfiler = {
  record(name: string, durationMs: number): number;
  measure<T>(name: string, callback: () => T): T;
  measureAsync<T>(name: string, callback: () => Promise<T>): Promise<T>;
  snapshot(name: string): ArcadePerformanceSummary;
  snapshot(): Readonly<Record<string, ArcadePerformanceSummary>>;
  compare(baselineName: string, candidateName: string): Readonly<{
    baseline: ArcadePerformanceSummary;
    candidate: ArcadePerformanceSummary;
    meanRatio: number;
    p95Ratio: number;
  }>;
  reset(name?: string): void;
};

export declare function createArcadeFrameProfiler(options?: {
  sampleSize?: number;
  now?: () => number;
}): ArcadeFrameProfiler;

export type ArcadeRenderPlanEntry = {
  name: string;
  layer: string;
  order?: number;
  priority?: number;
  enabled?: boolean;
  required?: boolean;
  [key: string]: unknown;
};

export declare function defineArcadeRenderPlan<T extends ArcadeRenderPlanEntry>(
  entries: readonly T[],
  options?: { layers?: readonly string[] },
): readonly Readonly<T & { order: number; priority: number; enabled: boolean }>[];

export declare function installArcadeRenderPlan(
  runtime: ArcadePixiRuntime,
  plan: readonly ArcadeRenderPlanEntry[],
  implementations: Record<
    string,
    | ArcadePixiPassOptions<any>
    | ((descriptor: ArcadeRenderPlanEntry, runtime: ArcadePixiRuntime) => ArcadePixiPassOptions<any>)
  >,
): Readonly<Record<string, ArcadePixiPassHandle<any>>>;

export type ArcadePixiFrame = {
  runtime: ArcadePixiRuntime;
  deltaMs: number;
  deltaSeconds: number;
  timeMs: number;
  tick: number;
};

export type ArcadePixiTelemetry = {
  version: string;
  backend: unknown;
  contextLosses: number;
  contextRestores: number;
  contextState: 'ready' | 'lost';
  assetsLoaded: number;
  framesRendered: number;
  ticks: number;
  elapsedMs: number;
  lastDeltaMs: number;
  resizeCount: number;
  logicalWidth: number;
  logicalHeight: number;
  running: boolean;
  paused: boolean;
  destroyed: boolean;
  layerNames: string[];
  systemNames: string[];
  passNames: string[];
  activePassNames: string[];
  performance: Record<string, ArcadePerformanceSummary>;
};

export type ArcadePixiPassContext<State = unknown> = {
  runtime: ArcadePixiRuntime;
  name: string;
  layerName: string;
  layer: Container;
  container: Container;
  readonly state: State;
};

export type ArcadePixiPassOptions<State = unknown> = {
  layer: string;
  priority?: number;
  order?: number;
  enabled?: boolean;
  destroyChildren?: boolean;
  create?: (pass: ArcadePixiPassContext<State>) => State;
  update?: (frame: ArcadePixiFrame, pass: ArcadePixiPassContext<State>) => void;
  resize?: (
    size: { width: number; height: number; runtime: ArcadePixiRuntime },
    pass: ArcadePixiPassContext<State>,
  ) => void;
  destroy?: (pass: ArcadePixiPassContext<State>) => void;
};

export type ArcadePixiPassHandle<State = unknown> = {
  readonly name: string;
  readonly layerName: string;
  readonly container: Container;
  readonly state: State;
  readonly enabled: boolean;
  setEnabled(enabled: boolean): void;
  clear(options?: { destroy?: boolean; children?: boolean; texture?: boolean; textureSource?: boolean }): number;
  remove(): boolean;
};

export type ArcadePixiRuntimeOptions = {
  PIXI: ArcadePixiNamespace;
  mount?: HTMLElement | (() => HTMLElement | null) | null;
  logicalWidth: number;
  logicalHeight: number;
  layers?: readonly string[];
  background?: number | string;
  backgroundAlpha?: number;
  canvasId?: string;
  resolution?: number;
  preference?: 'webgl' | 'webgpu';
  antialias?: boolean;
  autoStart?: boolean;
  autoRender?: boolean;
  observeResize?: boolean | HTMLElement | (() => HTMLElement | null);
  pauseWhenHidden?: boolean;
  onTelemetry?: (telemetry: ArcadePixiTelemetry) => void;
  onResize?: (size: { width: number; height: number; runtime: ArcadePixiRuntime }) => void;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (handle: number) => void;
  performanceNow?: () => number;
  performanceSampleSize?: number;
};

export type ArcadePixiRuntime = {
  readonly version: string;
  readonly app: Application;
  readonly canvas: HTMLCanvasElement;
  readonly stage: Container;
  readonly layers: Map<string, Container>;
  readonly running: boolean;
  readonly destroyed: boolean;
  layer(name: string): Container;
  clearLayer(name: string, options?: { destroy?: boolean; children?: boolean; texture?: boolean; textureSource?: boolean }): number;
  addPass<State = unknown>(name: string, options: ArcadePixiPassOptions<State>): ArcadePixiPassHandle<State>;
  pass<State = unknown>(name: string): ArcadePixiPassHandle<State>;
  clearPass(name: string, options?: { destroy?: boolean; children?: boolean; texture?: boolean; textureSource?: boolean }): number;
  removePass(name: string): boolean;
  setPassEnabled(name: string, enabled: boolean): void;
  addSystem(name: string, update: (frame: ArcadePixiFrame) => void, options?: { priority?: number; enabled?: boolean }): () => boolean;
  removeSystem(name: string): boolean;
  setSystemEnabled(name: string, enabled: boolean): void;
  on(eventName: string, callback: (payload: unknown) => void): () => void;
  emit(eventName: string, payload?: unknown): void;
  track(disposer: () => void): () => boolean;
  loadTexture(alias: string, src: string): Promise<Texture>;
  loadTextures(manifest: Record<string, string> | Array<{ alias: string; src: string }>): Promise<Record<string, Texture>>;
  texture(alias: string): Texture | undefined;
  resize(width: number, height: number): void;
  resizeFromTarget(): void;
  render(): void;
  step(deltaMs?: number, timeMs?: number, render?: boolean): void;
  start(reason?: string): void;
  pause(reason?: string): void;
  resume(reason?: string): void;
  snapshot(): ArcadePixiTelemetry;
  performanceSnapshot(name: string): ArcadePerformanceSummary;
  performanceSnapshot(): Readonly<Record<string, ArcadePerformanceSummary>>;
  resetPerformance(name?: string): void;
  destroy(removeCanvas?: boolean): void;
};

export declare function createArcadePixiRuntime(options: ArcadePixiRuntimeOptions): Promise<ArcadePixiRuntime>;

export type CanvasTexturePassState = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  texture: Texture;
  sprite: import('pixi.js').Sprite;
  width: number;
  height: number;
  dirty: boolean;
  redraws: number;
  skippedFrames: number;
  invalidate(): void;
};

export type CanvasTexturePassOptions = {
  PIXI: ArcadePixiNamespace;
  name?: string;
  layer?: string;
  draw: (
    context: CanvasRenderingContext2D,
    frame: ArcadePixiFrame,
    pass: ArcadePixiPassContext<CanvasTexturePassState>,
  ) => void;
  width?: number;
  height?: number;
  priority?: number;
  order?: number;
  enabled?: boolean;
  clear?: boolean;
  resizeWithRuntime?: boolean;
  shouldDraw?: (
    frame: ArcadePixiFrame,
    pass: ArcadePixiPassContext<CanvasTexturePassState>,
  ) => boolean;
  canvasFactory?: (width: number, height: number) => HTMLCanvasElement;
  onResize?: (
    size: { width: number; height: number; runtime: ArcadePixiRuntime },
    pass: ArcadePixiPassContext<CanvasTexturePassState>,
  ) => void;
};

export declare function createCanvasTexturePassOptions(
  options: CanvasTexturePassOptions,
): ArcadePixiPassOptions<CanvasTexturePassState>;

export declare function createCanvasTexturePass(
  runtime: ArcadePixiRuntime,
  options: CanvasTexturePassOptions & { name: string; layer: string },
): ArcadePixiPassHandle<CanvasTexturePassState>;
// BEGIN MERGED ARCADE CORE TYPES

export declare function clampNumber(value: number, minimum?: number, maximum?: number): number;
export declare function approach(current: number, target: number, maxDelta: number): number;
export declare function integrateAcceleration(
  value: number, acceleration: number, dt?: number, minimum?: number, maximum?: number
): number;
export declare function integrateBody<T extends { x: number; y: number; vx?: number; vy?: number; velocityX?: number; velocityY?: number }>(
  body: T,
  dt?: number,
  acceleration?: { x?: number; y?: number; minX?: number; maxX?: number; minY?: number; maxY?: number },
): Readonly<T>;
export type ArcadeRect = { x: number; y: number; w?: number; h?: number; width?: number; height?: number };
export declare function aabbOverlap(a: ArcadeRect, b: ArcadeRect): boolean;
export declare function resolveOneWayPlatforms<T extends ArcadeRect>(options: {
  body: ArcadeRect & { vx?: number; vy?: number; velocityX?: number; velocityY?: number };
  previous: ArcadeRect;
  velocityY?: number;
  downwardSign?: 1 | -1;
  tolerance?: number;
  platforms: readonly T[];
}): Readonly<{ platform: T; x: number; y: number; velocityY: 0 }> | null;

export type TimeUnit = 'seconds' | 'milliseconds';
export type FixedStepLoop = {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  advance(elapsed: number): { updates: number; alpha: number };
  resetClock(): void;
  snapshot(): Readonly<Record<string, number | boolean>>;
  getFPS(): number;
  getFrameCount(): number;
  isPaused(): boolean;
  isRunning(): boolean;
};
export declare function createFixedStepLoop(options: {
  update(delta: number): void;
  render(alpha: number): void;
  fixedStep?: number;
  maxFrame?: number;
  timeUnit?: TimeUnit;
  now?: () => number;
  requestFrame?: (callback: (timestamp: number) => void) => number;
  cancelFrame?: (id: number) => void;
}): FixedStepLoop;

export type KeyboardDevice = {
  advance(): void;
  clearEdges(): void;
  isHeld(code: string): boolean;
  isPressed(code: string): boolean;
  isReleased(code: string): boolean;
  getState(code: string): Readonly<{ isPressed: boolean; wasJustPressed: boolean; wasJustReleased: boolean; pressTime: number; releaseTime: number }>;
  getHoldDuration(code: string): number;
  consumeLatestPressed(exclusions?: string[]): string | null;
  reset(): void;
  destroy(): void;
};
export declare function createKeyboardDevice(options?: {
  target?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
  now?: () => number;
  preventDefaultCodes?: string[];
}): KeyboardDevice;

export type KeyBinding = { type: 'key'; code: string };
export type ButtonBinding = { type: 'button'; index: number };
export type AxisBinding = { type: 'axis'; index: number; direction?: number; threshold?: number };
export type ActionBinding = string | KeyBinding | ButtonBinding | AxisBinding;
export type ActionBindings<Action extends string> = Record<Action, ActionBinding[]>;
export type ActionState = Readonly<{
  held: boolean;
  pressed: boolean;
  released: boolean;
  value: number;
  source: string | null;
}>;
export declare function cloneActionBindings<Action extends string>(
  actions: readonly Action[], bindings?: Partial<ActionBindings<Action>>
): ActionBindings<Action>;
export declare function updateActionBinding<Action extends string>(
  actions: readonly Action[], bindings: Partial<ActionBindings<Action>>, action: Action,
  binding: ActionBinding, options?: { replace?: boolean; removeConflicts?: boolean }
): ActionBindings<Action>;
export declare function createActionInput<Action extends string>(options: {
  actions: readonly Action[];
  bindings: Partial<ActionBindings<Action>>;
  keyboard?: KeyboardDevice;
  keyboardOptions?: Parameters<typeof createKeyboardDevice>[0];
  gamepadIndex?: number;
  getGamepads?: () => ArrayLike<Gamepad | null>;
}): {
  advance(): Readonly<Record<Action, ActionState>>;
  refresh(): Readonly<Record<Action, ActionState>>;
  snapshot(): Readonly<Record<Action, ActionState>>;
  clearEdges(): void;
  setBindings(bindings: Partial<ActionBindings<Action>>): void;
  getBindings(): ActionBindings<Action>;
  reset(): void;
  destroy(): void;
  keyboard: KeyboardDevice;
};

export declare function createSceneStack<Context, Scene extends {
  name: string;
  onEnter?(context: Context): void;
  onExit?(): void;
  update?(delta: number): void;
  render?(...args: any[]): void;
}>(options?: { context?: Context }): {
  push(scene: Scene): Scene;
  pop(): Scene | undefined;
  replace(scene: Scene): Scene;
  clear(): void;
  current(): Scene | undefined;
  depth(): number;
  update(delta: number): void;
  render(...args: any[]): void;
  snapshot(): readonly string[];
};

export declare function createTransitionSceneManager<Name extends string, RenderContext, Params = Record<string, unknown>>(options: {
  scenes: Array<{
    name: Name;
    enter?(params?: Params): void | Promise<void>;
    exit?(): void | Promise<void>;
    update?(delta: number): void;
    render?(context: RenderContext): void;
  }>;
  initialScene: Name;
  transitions?: Partial<Record<Name, readonly Name[]>>;
  renderContext?: RenderContext;
  clear?(context: RenderContext, scene: Name | null): void;
}): {
  init(context: RenderContext): void;
  start(): Promise<boolean>;
  getCurrentScene(): Name | null;
  getCurrent(): unknown;
  getParams(): Params | undefined;
  isTransitioning(): boolean;
  canTransitionTo(target: Name): boolean;
  transitionTo(target: Name, params?: Params): Promise<boolean>;
  update(delta: number): void;
  render(): void;
};

export declare function createLifecycleController(options?: {
  documentTarget?: Document;
  windowTarget?: Window;
  loop?: Pick<FixedStepLoop, 'pause' | 'resume'>;
  input?: { reset(): void };
  onSuspend?(reason: 'hidden' | 'blur'): void;
  onResume?(reason: 'visible'): void;
}): { destroy(): void };
// END MERGED ARCADE CORE TYPES


// BEGIN ARCADE SERVICES 0.13-0.16 TYPES

export type ArcadeRuntimeHost = {
  readonly version: string;
  readonly events: ArcadeEventBus<any>;
  register<T>(name: string, service: T, disposer?: () => void): T;
  service<T = unknown>(name: string): T;
  has(name: string): boolean;
  track(disposer: () => void): () => void;
  start(reason?: string): boolean;
  pause(reason?: string): boolean;
  resume(reason?: string): boolean;
  stop(reason?: string): boolean;
  step(delta: number, command?: unknown): Readonly<{ tick: number; delta: number; command: unknown; host: ArcadeRuntimeHost }>;
  render(alpha?: number): Readonly<{ tick: number; alpha: number; host: ArcadeRuntimeHost }>;
  snapshot(): Readonly<{ version: string; state: string; tick: number; destroyed: boolean; services: readonly string[] }>;
  destroy(): boolean;
};
export declare function createArcadeRuntimeHost(options?: {
  events?: ArcadeEventBus<any>;
  services?: Record<string, unknown>;
  loop?: { start?(): void; stop?(): void; pause?(): void; resume?(): void };
  update?(delta: number, command: unknown, frame: unknown): void;
  render?(alpha: number, frame: unknown): void;
}): ArcadeRuntimeHost;

export type SpatialBody = ArcadeRect & {
  id: string;
  layer?: string;
  mask?: readonly string[];
  enabled?: boolean;
  isTrigger?: boolean;
};
export type SpatialIndex = Readonly<{ cellSize: number; cells: Map<string, SpatialBody[]>; bodies: readonly SpatialBody[] }>;
export type SpatialPair = Readonly<{ a: SpatialBody; b: SpatialBody }>;
export declare function collisionLayersMatch(a: SpatialBody, b: SpatialBody): boolean;
export declare function buildSpatialIndex(bodies: readonly SpatialBody[], cellSize?: number): SpatialIndex;
export declare function querySpatialIndex(index: SpatialIndex, rect: ArcadeRect, options?: { layers?: readonly string[]; predicate?: (body: SpatialBody) => boolean }): SpatialBody[];
export declare function spatialCollisionPairs(index: SpatialIndex): SpatialPair[];
export type CollisionManifold = Readonly<{ a: string; b: string; normalX: number; normalY: number; penetration: number; overlapX: number; overlapY: number }>;
export declare function computeCollisionManifold(a: SpatialBody, b: SpatialBody): CollisionManifold | null;
export declare function manifoldsFromSpatialPairs(pairs: readonly SpatialPair[]): CollisionManifold[];
export type SweptObstacle = ArcadeRect & { id: string; oneWay?: boolean };
export declare function sweepAabb(input: { body: ArcadeRect; vx: number; vy: number; dt: number; epsilon?: number; obstacles: readonly SweptObstacle[] }): Readonly<{ x: number; y: number; vx: number; vy: number; hit: null | Readonly<{ obstacle: SweptObstacle; time: number; normalX: number; normalY: number; remainingTime: number }> }>;
export declare function createCollisionWorld(options?: { cellSize?: number; events?: ArcadeEventBus<any> }): {
  events: ArcadeEventBus<any>;
  upsert<T extends SpatialBody>(body: T): Readonly<T>;
  remove(id: string): boolean;
  get(id: string): SpatialBody | undefined;
  clear(): number;
  query(rect: ArcadeRect, options?: { layers?: readonly string[]; predicate?: (body: SpatialBody) => boolean }): SpatialBody[];
  step(): Readonly<{ index: SpatialIndex; pairs: readonly SpatialPair[]; contacts: readonly unknown[] }>;
  snapshot(): Readonly<{ bodyCount: number; contactCount: number; cellSize: number; bodyIds: readonly string[] }>;
};
export type HitboxBody<OwnerId = string, Team = unknown> = SpatialBody & { ownerId: OwnerId; team?: Team; damage?: number; tags?: readonly string[]; active?: boolean };
export type HurtboxBody<ActorId = string, Team = unknown> = SpatialBody & { actorId: ActorId; team?: Team; active?: boolean };
export declare function resolveHitboxContacts<OwnerId = string, ActorId = string, Team = unknown>(input: { hitboxes: readonly HitboxBody<OwnerId, Team>[]; hurtboxes: readonly HurtboxBody<ActorId, Team>[] }): readonly Readonly<{ hitboxId: string; hurtboxId: string; attackerId: OwnerId; targetId: ActorId; damage: number; tags: readonly string[] }>[];
export declare function createProjectilePool<T>(options: { capacity: number; create(index: number): T; reset?(value: T, context: RecyclingPoolResetContext): void }): {
  spawn(initializer?: (value: T, context: RecyclingPoolAcquireContext) => void): T;
  despawn(projectile: T): boolean;
  step(delta: number, update: (projectile: T, delta: number, context: Readonly<{ index: number; generation: number }>) => void, shouldDespawn?: (projectile: T) => boolean): number;
  activeValues(): T[];
  clear(): number;
  snapshot(): RecyclingPoolSnapshot;
  pool: RecyclingPool<T>;
};

export declare function createPixiSceneGraph(options: { PIXI: ArcadePixiNamespace; stage: Container; label?: string }): {
  root: Container;
  world: Container;
  hud: Container;
  overlay: Container;
  addParallaxLayer(name: string, options?: { container?: Container; factorX?: number; factorY?: number; order?: number }): Container;
  layer(name: string): Container;
  applyCamera(camera: Partial<ArcadeCameraState>): unknown;
  snapshot(): Readonly<{ destroyed: boolean; parallax: readonly unknown[] }>;
  destroy(): boolean;
};
export declare function createPixiSpritePool<T extends { visible: boolean; renderable: boolean; destroy?(): void }>(options: {
  container: { addChild(sprite: T): void };
  capacity: number;
  createSprite(index: number): T;
  reset?(sprite: T, context: RecyclingPoolResetContext): void;
}): {
  acquire(initializer?: (sprite: T, context: RecyclingPoolAcquireContext) => void): T;
  release(sprite: T): boolean;
  clear(): number;
  activeValues(): T[];
  snapshot(): RecyclingPoolSnapshot;
  destroy(): void;
};

export type ArcadeAssetDefinition = Readonly<{ id: string; type: string; src: string; groups?: readonly string[]; group?: string; dependencies?: readonly string[]; fallbackId?: string; bytes?: number; retries?: number; dispose?: (value: unknown) => void }>;
export type ArcadeAssetManifest = Readonly<{ version?: number; assets: readonly ArcadeAssetDefinition[] }>;
export declare function validateAssetManifest(manifest: ArcadeAssetManifest): Readonly<{ version: number; assets: readonly ArcadeAssetDefinition[] }>;
export declare function createResourceScope(options?: { name?: string }): {
  readonly name: string;
  track<T>(resource: T, disposer?: (resource: T) => void | Promise<void>): T;
  child(name: string): ReturnType<typeof createResourceScope>;
  release(): Promise<boolean>;
  snapshot(): Readonly<{ name: string; released: boolean; resources: number; children: number }>;
};
export declare function createAssetLoader(options?: { retries?: number; loaders?: Record<string, (asset: ArcadeAssetDefinition, context: unknown) => unknown | Promise<unknown>>; load?: (asset: ArcadeAssetDefinition, context: unknown) => unknown | Promise<unknown> }): {
  cache: Map<string, unknown>;
  has(id: string): boolean;
  get(id: string): unknown;
  clear(id?: string): number | boolean;
  loadManifest(manifest: ArcadeAssetManifest, options?: { ids?: readonly string[]; groups?: readonly string[]; budgetBytes?: number; signal?: AbortSignal; scope?: ReturnType<typeof createResourceScope>; scopeName?: string; loaders?: Record<string, Function>; onProgress?: (progress: unknown) => void }): Promise<Readonly<{ assets: Map<string, unknown>; scope: ReturnType<typeof createResourceScope>; get(id: string): unknown; loadedBytes: number; declaredBytes: number }>>;
};
export declare function createAudioMixer(options: { context?: AudioContext; createContext?: () => AudioContext; buses?: readonly string[]; masterVolume?: number }): {
  context: AudioContext;
  master: GainNode;
  setMasterVolume(volume: number): void;
  setVolume(name: string, volume: number): void;
  mute(name: string, muted?: boolean): void;
  duck(name: string, factor: number, token?: PropertyKey): () => boolean;
  playBuffer(buffer: AudioBuffer, options?: { bus?: string; volume?: number; loop?: boolean; pan?: number; when?: number; offset?: number }): { source: AudioBufferSourceNode; stop(): boolean };
  resume(): Promise<void>;
  suspend(): Promise<void>;
  snapshot(): Readonly<{ state: string; master: number; buses: Readonly<Record<string, number>>; activeSources: number }>;
  destroy(): Promise<void>;
};

export declare function resolveSafeAreaLayout(input: { viewportWidth: number; viewportHeight: number; designWidth?: number; designHeight?: number; safeArea?: Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>; mode?: 'contain' | 'cover' | 'stretch' }): Readonly<{ viewport: Readonly<ArcadeRect>; safeArea: Readonly<Record<'top' | 'right' | 'bottom' | 'left', number>>; available: Readonly<ArcadeRect>; content: Readonly<ArcadeRect>; scale: Readonly<{ x: number; y: number }> }>;
export type FocusItem = { id: string; disabled?: boolean; hidden?: boolean; onActivate?(item: FocusItem): void };
export declare function createFocusNavigator(options?: { items?: readonly FocusItem[]; initialId?: string; wrap?: boolean; events?: ArcadeEventBus<any> }): {
  events: ArcadeEventBus<any>;
  setItems(items: readonly FocusItem[]): FocusItem | null;
  current(): FocusItem | null;
  focus(id: string, reason?: string): boolean;
  move(direction: 'next' | 'previous' | 'left' | 'right' | 'up' | 'down'): FocusItem | null;
  activate(): boolean;
  snapshot(): Readonly<{ focusedId: string | null; items: readonly unknown[] }>;
};
export declare function createInputHintTracker(options?: { initialDevice?: 'keyboard' | 'gamepad' | 'pointer' | 'touch'; now?: () => number; events?: ArcadeEventBus<any> }): {
  events: ArcadeEventBus<any>;
  note(device: 'keyboard' | 'gamepad' | 'pointer' | 'touch', timestamp?: number): boolean;
  noteActionState(state: Record<string, ActionState>, timestamp?: number): boolean;
  snapshot(): Readonly<{ device: string; changedAt: number }>;
};
export declare function createAccessibilityPreferences(initial?: { reducedMotion?: boolean; highContrast?: boolean; captions?: boolean; screenReader?: boolean; textScale?: number }): {
  events: ArcadeEventBus<any>;
  set(patch: Record<string, unknown>, reason?: string): Readonly<Record<string, unknown>>;
  snapshot(): Readonly<Record<string, unknown>>;
  motion(duration: number): number;
};
export declare function createMessageCatalog(options: { locale?: string; fallbackLocale?: string; messages?: Record<string, unknown>; missing?: (key: string, locale: string) => string }): {
  setLocale(locale: string): void;
  addMessages(locale: string, messages: Record<string, unknown>): void;
  translate(key: string, variables?: Record<string, unknown>): string;
  has(key: string): boolean;
  snapshot(): Readonly<{ locale: string; fallbackLocale: string; locales: readonly string[] }>;
};
export declare function createTextMeasureCache<T>(options: { measure(text: string, style: Record<string, unknown>): T }): { measure(text: string, style?: Record<string, unknown>): T; clear(): number; snapshot(): Readonly<{ size: number }> };

export type ArcadeStorageAdapter = { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem?(key: string): unknown; keys?(): string[] };
export declare function createMemoryStorageAdapter(seed?: Record<string, string>): ArcadeStorageAdapter & { snapshot(): Readonly<Record<string, string>> };
export declare function createStorageAdapter(storage: Storage): ArcadeStorageAdapter;
export declare function createVersionedStore<T>(options: { adapter?: ArcadeStorageAdapter; key: string; version: number; defaults?: T | (() => T); migrations?: Record<number, (data: unknown, context: Readonly<{ from: number; to: number }>) => unknown>; validate?: (data: unknown) => boolean; backupKey?: string; now?: () => number; onCorruption?: (context: unknown) => void }): {
  save(data: T, metadata?: { savedAt?: number; revision?: number }): Readonly<{ format: 1; version: number; savedAt: number; revision: number; data: T; checksum: string }>;
  load(): Readonly<{ data: T; source: string; migrated: boolean; recovered: boolean; version: number }>;
  clear(): void;
  inspect(): Readonly<Record<string, unknown>>;
};
export declare function createProfileStore<T>(options: { adapter?: ArcadeStorageAdapter; key: string; version: number; maxSlots?: number; defaults?: T | (() => T); migrations?: Record<number, Function>; validate?: (data: unknown) => boolean }): {
  list(): readonly string[];
  load(id: string): Readonly<{ data: T; source: string; migrated: boolean; recovered: boolean; version: number }>;
  save(id: string, data: T, metadata?: { savedAt?: number; revision?: number }): unknown;
  remove(id: string): void;
};
export declare function resolveStorageConflict<T extends { savedAt?: number }>(local: T | null, remote: T | null, options?: { strategy?: 'newer' | 'local' | 'remote'; merge?: (local: T, remote: T) => T }): Readonly<{ winner: 'local' | 'remote' | 'merged'; value: T }>;
export declare function createStatisticsService(initial?: Record<string, number>): { increment(key: string, amount?: number): number; set(key: string, value: number): number; max(key: string, value: number): number; min(key: string, value: number): number; get(key: string): number; snapshot(): Readonly<Record<string, number>>; reset(): void };
export type AchievementDefinition = { id: string; target?: number; event?: PropertyKey; select?: (payload: unknown) => number; reduce?: (current: number, amount: number, context: unknown) => number };
export declare function createAchievementService(options?: { definitions?: readonly AchievementDefinition[]; initial?: { progress?: Record<string, number>; unlocked?: readonly string[] }; events?: ArcadeEventBus<any> }): {
  events: ArcadeEventBus<any>;
  record(id: string, amount?: number, context?: unknown): boolean;
  consume(event: PropertyKey, payload?: unknown): number;
  unlock(id: string, context?: unknown): boolean;
  isUnlocked(id: string): boolean;
  snapshot(): Readonly<{ progress: Readonly<Record<string, number>>; unlocked: readonly string[] }>;
};
export declare function createRunSummary(input?: { game?: string; mode?: string; seed?: string | number; startedAt?: number; endedAt?: number; result?: SnapshotValue; score?: number; stats?: SnapshotValue; achievements?: readonly string[]; commands?: ArcadeCommandStream | string; finalState?: SnapshotValue; metadata?: SnapshotValue }): Readonly<Record<string, SnapshotValue>> & { summaryHash: string };
export declare function verifyRunSummary(summary: Record<string, SnapshotValue> & { summaryHash: string }): boolean;

// END ARCADE SERVICES 0.13-0.16 TYPES

// BEGIN ARCADE SERVICES 0.17-1.0 TYPES

export declare const ARCADE_RUNTIME_API_LEVEL: number;
export declare const ARCADE_RUNTIME_CAPABILITIES: readonly string[];
export declare function getArcadeRuntimeCapabilities(): Readonly<{ package: string; version: string; apiLevel: number; capabilities: readonly string[] }>;
export declare function assertArcadeRuntimeCompatibility(requirements?: { apiLevel?: number; capabilities?: readonly string[]; major?: number }): ReturnType<typeof getArcadeRuntimeCapabilities>;

export declare function createInputDelayBuffer<Input>(options?: { delayFrames?: number; clone?: (input: Input) => Input }): {
  readonly delayFrames: number;
  put(playerId: string, inputFrame: number, input: Input): number;
  has(playerId: string, inputFrame: number): boolean;
  get(playerId: string, inputFrame: number): Input | undefined;
  resolve(simulationFrame: number, playerIds: readonly string[], fallback?: Input | ((playerId: string, inputFrame: number) => Input)): Readonly<{ simulationFrame: number; sourceFrame: number; inputs: Readonly<Record<string, Input>>; missing: readonly string[]; predicted: boolean }>;
  prune(beforeInputFrame: number): number;
  snapshot(): Readonly<{ delayFrames: number; writes: number; frames: readonly number[] }>;
};

export type ArcadeStateHistoryEntry<State> = Readonly<{ frame: number; state: State; hash: string; metadata: SnapshotValue }>;
export declare function createStateHistory<State>(options?: { capacity?: number; clone?: (state: State) => State; snapshot?: (state: State) => SnapshotValue; hash?: (state: State) => string }): {
  readonly capacity: number;
  save(frame: number, state: State, metadata?: SnapshotValue): ArcadeStateHistoryEntry<State>;
  has(frame: number): boolean;
  get(frame: number): ArcadeStateHistoryEntry<State> | null;
  nearestAtOrBefore(frame: number): ArcadeStateHistoryEntry<State> | null;
  pruneAfter(frame: number): number;
  clear(): number;
  frames(): readonly number[];
  snapshot(): Readonly<{ capacity: number; size: number; firstFrame: number | null; lastFrame: number | null }>;
};

export declare function createRollbackSession<State, Input>(options: {
  initialState: State;
  players: readonly string[];
  step(state: State, inputs: Readonly<Record<string, Input>>, context: Readonly<{ frame: number; sourceFrame: number; predictedPlayers: readonly string[]; resimulation: boolean }>): State;
  inputDelayFrames?: number;
  historyFrames?: number;
  defaultInput?: Input | ((playerId: string, inputFrame: number) => Input);
  /** @deprecated Use cloneState. */
  clone?: (state: State) => State;
  cloneState?: (state: State) => State;
  cloneInput?: (input: Input) => Input;
  snapshot?: (state: State) => SnapshotValue;
  events?: ArcadeEventBus<any>;
}): {
  events: ArcadeEventBus<any>;
  players: readonly string[];
  delay: ReturnType<typeof createInputDelayBuffer<Input>>;
  history: ReturnType<typeof createStateHistory<State>>;
  submitInput(playerId: string, inputFrame: number, input: Input): number;
  receiveInput(playerId: string, inputFrame: number, input: Input): number;
  advance(inputs?: Partial<Record<string, Input>>): State;
  advanceTo(targetFrame: number, inputProvider?: (frame: number, session: unknown) => Partial<Record<string, Input>>): State;
  rollbackTo(targetFrame: number): State;
  checksum(frame?: number): string | null;
  compareRemoteChecksum(peerId: string, frame: number, checksum: string): Readonly<{ peerId: string; frame: number; local: string | null; remote: string; match: boolean }>;
  getState(): State;
  snapshot(): Readonly<{
    frame: number;
    checksum: string | null;
    rollbackCount: number;
    resimulatedFrames: number;
    rejectedLateInputs: number;
    inputDelayFrames: number;
    history: Readonly<{ capacity: number; size: number; firstFrame: number | null; lastFrame: number | null }>;
    retainedInputFrames: number;
    bufferedInputFrames: number;
    remoteChecksums: number;
  }>;
};

export type ArcadeLocalTransport = {
  readonly name: string;
  readonly closed: boolean;
  send(message: unknown): boolean;
  onMessage(listener: (message: unknown) => void): () => boolean;
  close(): boolean;
  snapshot(): Readonly<{ name: string; closed: boolean; sent: number; received: number; dropped: number }>;
};
export declare function createLocalTransportPair(options?: { firstName?: string; secondName?: string; latencyMs?: number; clone?: (message: unknown) => unknown; schedule?: (deliver: () => void, latencyMs: number) => void; drop?: (message: unknown, context: Readonly<{ from: string; sent: number }>) => boolean }): readonly [ArcadeLocalTransport, ArcadeLocalTransport];

export declare function createRuntimeInspector(options?: { capacity?: number; now?: () => number; sources?: Record<string, unknown>; host?: ArcadeRuntimeHost; onCapture?: (capture: unknown) => void }): {
  register(name: string, source: unknown): () => boolean;
  inspect(name: string): SnapshotValue;
  capture(label?: string, metadata?: SnapshotValue): Readonly<Record<string, unknown>>;
  history(): readonly unknown[];
  export(): string;
  clear(): number;
  snapshot(): Readonly<{ sources: readonly string[]; captures: number; capacity: number; nextCaptureIndex: number }>;
};
export declare function createReplayTimeline(options: { stream: ArcadeCommandStream | string; frames?: readonly ArcadeReplayFrame[] }): {
  stream: ArcadeCommandStream;
  entries: readonly ArcadeCommandEntry[];
  frames: readonly ArcadeReplayFrame[];
  current(): ArcadeCommandEntry | null;
  seekIndex(index: number): ArcadeCommandEntry | null;
  seekTick(tick: number): ArcadeCommandEntry | null;
  next(): ArcadeCommandEntry | null;
  previous(): ArcadeCommandEntry | null;
  frameAtCursor(): ArcadeReplayFrame | null;
  range(fromTick: number, toTick: number): readonly ArcadeCommandEntry[];
  snapshot(): Readonly<Record<string, unknown>>;
};
export type PerformanceBudget = { meanMs?: number; p95Ms?: number; maxMs?: number; minimumSamples?: number };
export declare function createPerformanceBudgetMonitor(options?: { budgets?: Record<string, PerformanceBudget>; profiler?: ArcadeFrameProfiler; sampleSize?: number; now?: () => number }): {
  profiler: ArcadeFrameProfiler;
  setBudget(name: string, budget: PerformanceBudget): void;
  record(name: string, durationMs: number): number;
  measure<T>(name: string, callback: () => T): T;
  measureAsync<T>(name: string, callback: () => Promise<T>): Promise<T>;
  evaluate(name: string): Readonly<Record<string, unknown>>;
  evaluateAll(): readonly Readonly<Record<string, unknown>>[];
  assert(name: string): Readonly<Record<string, unknown>>;
  snapshot(): Readonly<{ pass: boolean; results: readonly unknown[] }>;
};
export declare function runHeadlessScenario<State, Command>(options: { name?: string; ticks: number; initialState?: State; setup?: () => State | Promise<State>; command?: (tick: number, state: State) => Command; step(state: State, command: Command | null, context: Readonly<{ tick: number }>): State | Promise<State>; snapshot?: (state: State, tick: number) => SnapshotValue; assert?: (frame: unknown, state: State) => void; teardown?: (state: State, result: unknown) => void }): Promise<Readonly<{ name: string; ticks: number; state: State; frames: readonly unknown[]; finalHash: string }>>;

// END ARCADE SERVICES 0.17-1.0 TYPES
