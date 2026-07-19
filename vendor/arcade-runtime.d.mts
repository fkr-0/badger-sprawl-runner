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
export declare const ARCADE_PIXI_RUNTIME_VERSION: string;
export declare const ARCADE_CORE_VERSION: string;
export declare const DEFAULT_ARCADE_LAYERS: readonly string[];

export declare function clampArcadeValue(value: number, minimum: number, maximum: number): number;
export declare function approachArcadeValue(current: number, target: number, maximumDelta: number): number;
export declare function applyArcadeDrag(value: number, drag: number, delta?: number): number;

export type ArcadeKinematicBody2D = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

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
