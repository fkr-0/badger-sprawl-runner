export const ARCADE_CORE_VERSION = '0.1.0';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function finite(value, fallback) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function defaultNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}

export function createFixedStepLoop(options) {
  invariant(typeof options?.update === 'function', 'fixed-step loop requires update');
  invariant(typeof options?.render === 'function', 'fixed-step loop requires render');
  const unitScale = options.timeUnit === 'milliseconds' ? 1 : 0.001;
  const fixedStep = finite(options.fixedStep, options.timeUnit === 'milliseconds' ? 1000 / 60 : 1 / 60);
  const maxFrame = finite(options.maxFrame, options.timeUnit === 'milliseconds' ? 100 : 0.1);
  invariant(fixedStep > 0, 'fixedStep must be positive');
  invariant(maxFrame >= fixedStep, 'maxFrame must be at least fixedStep');

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
      invariant(typeof requestFrame === 'function', 'requestAnimationFrame is unavailable');
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
  invariant(target?.addEventListener, 'keyboard target must support addEventListener');
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
  invariant(actions.includes(action), `unknown action "${action}"`);
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
      invariant(scene && typeof scene.name === 'string', 'scene must have a name');
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
