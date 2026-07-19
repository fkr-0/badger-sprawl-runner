export declare const ARCADE_CORE_VERSION: string;


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
