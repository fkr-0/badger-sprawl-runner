export const ARCADE_PIXI_RUNTIME_VERSION = '0.5.0';

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
    return Object.freeze({
      ...entry,
      order: Number(entry.order ?? index),
      priority: Number(entry.priority ?? 0),
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
      if (descriptor.required) throw new Error(`@arcade/pixi-runtime: required render pass "${descriptor.name}" has no implementation`);
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
  if (!value) throw new Error(`@arcade/pixi-runtime: ${message}`);
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
  canvas.dataset.arcadePixiRuntime = ARCADE_PIXI_RUNTIME_VERSION;
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

  const telemetry = {
    version: ARCADE_PIXI_RUNTIME_VERSION,
    backend: app.renderer?.type ?? preference,
    contextLosses: 0,
    contextRestores: 0,
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
    telemetry.contextLosses += 1;
    canvas.dataset.contextState = 'lost';
    emit('context-lost', event);
    emitTelemetry();
  };

  const handleContextRestored = () => {
    telemetry.contextRestores += 1;
    canvas.dataset.contextState = 'ready';
    emit('context-restored');
    emitTelemetry();
  };

  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);

  const sortedSystems = () => [...systems.values()].sort((a, b) => b.priority - a.priority);
  const sortedPasses = () => [...passes.values()].sort((a, b) => b.priority - a.priority);

  const updatePassTelemetry = () => {
    telemetry.passNames = [...passes.keys()];
    telemetry.activePassNames = [...passes.values()]
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
    if (destroyed) return;
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

      const layer = runtime.layer(passOptions.layer);
      layer.sortableChildren = true;
      const container = new PIXI.Container();
      container.label = `pass:${name}`;
      container.zIndex = Number(passOptions.order ?? 0);
      container.visible = passOptions.enabled !== false;
      layer.addChild(container);

      const pass = {
        name,
        layerName: passOptions.layer,
        layer,
        container,
        priority: Number(passOptions.priority ?? 0),
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
      systems.set(name, {
        name,
        update,
        priority: Number(systemOptions.priority ?? 0),
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
      if (destroyed) return;
      profiler.measure('render', () => app.renderer.render(app.stage));
      telemetry.framesRendered += 1;
      updatePerformanceTelemetry();
    },
    step(deltaMs = 1000 / 60, timeMs = Date.now(), render = autoRender) {
      tick(deltaMs, timeMs, render);
    },
    start(reason = 'manual') {
      if (destroyed || running) return;
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
    canvasFactory,
    onResize,
  } = options;

  invariant(PIXI?.Texture && PIXI?.Sprite, 'PixiJS Texture and Sprite constructors are required for a canvas texture pass');
  invariant(typeof draw === 'function', 'canvas texture pass requires a draw function');
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
    state.canvas.width = nextWidth;
    state.canvas.height = nextHeight;
    state.width = nextWidth;
    state.height = nextHeight;
    state.sprite.width = nextWidth;
    state.sprite.height = nextHeight;
    state.texture.source?.update?.();
    state.texture.update?.();
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
      return {
        canvas,
        context,
        texture,
        sprite,
        width: resolvedWidth,
        height: resolvedHeight,
      };
    },
    update(frame, pass) {
      const state = pass.state;
      if (clear) state.context.clearRect(0, 0, state.width, state.height);
      draw(state.context, frame, pass);
      if (state.texture.source?.update) state.texture.source.update();
      else state.texture.update?.();
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
