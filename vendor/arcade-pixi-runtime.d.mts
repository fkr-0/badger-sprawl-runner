import type { Application, Container, Texture } from 'pixi.js';

export type ArcadePixiNamespace = {
  Application: typeof import('pixi.js').Application;
  Container: typeof import('pixi.js').Container;
  Assets: typeof import('pixi.js').Assets;
  TextureStyle?: typeof import('pixi.js').TextureStyle;
  Texture?: typeof import('pixi.js').Texture;
  Sprite?: typeof import('pixi.js').Sprite;
};

export declare const ARCADE_PIXI_RUNTIME_VERSION: string;
export declare const DEFAULT_ARCADE_LAYERS: readonly string[];

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
