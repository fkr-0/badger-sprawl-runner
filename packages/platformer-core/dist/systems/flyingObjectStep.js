const VACUUM_SAMPLE = {
    density: 0,
    flowX: 0,
    flowY: 0,
    drag: 0,
    buoyancy: 0,
    viscosity: 0,
    lift: 0,
};
function finiteOr(value, fallback) {
    return Number.isFinite(value) ? value : fallback;
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function normalizeSample(sample) {
    return {
        density: Math.max(0, finiteOr(sample.density, 0)),
        flowX: finiteOr(sample.flowX, 0),
        flowY: finiteOr(sample.flowY, 0),
        drag: Math.max(0, finiteOr(sample.drag, 0)),
        buoyancy: Math.max(0, finiteOr(sample.buoyancy, 0)),
        viscosity: Math.max(0, finiteOr(sample.viscosity, sample.drag)),
        lift: Math.max(0, finiteOr(sample.lift, 0)),
    };
}
export function createUniformFluid(id, sample) {
    const normalized = normalizeSample(sample);
    return {
        id,
        sample: () => ({ ...normalized }),
    };
}
export function createLayeredFluid(id, layers, fallback = VACUUM_SAMPLE) {
    const normalizedLayers = layers.map((layer) => ({
        ...layer,
        sample: normalizeSample(layer.sample),
    }));
    const normalizedFallback = normalizeSample(fallback);
    return {
        id,
        sample: (_x, y) => {
            const layer = normalizedLayers.find((candidate) => y >= candidate.minY && y < candidate.maxY);
            return { ...(layer?.sample ?? normalizedFallback) };
        },
    };
}
export function combineFluidFields(id, fields) {
    return {
        id,
        sample: (x, y) => {
            if (fields.length === 0)
                return { ...VACUUM_SAMPLE };
            let density = 0;
            let flowX = 0;
            let flowY = 0;
            let drag = 0;
            let buoyancy = 0;
            let viscosity = 0;
            let lift = 0;
            for (const field of fields) {
                const sample = normalizeSample(field.sample(x, y));
                const weight = Math.max(0.0001, sample.density);
                density += sample.density;
                flowX += sample.flowX * weight;
                flowY += sample.flowY * weight;
                drag = Math.max(drag, sample.drag);
                buoyancy = Math.max(buoyancy, sample.buoyancy ?? 0);
                viscosity = Math.max(viscosity, sample.viscosity ?? 0);
                lift = Math.max(lift, sample.lift ?? 0);
            }
            const flowWeight = fields.reduce((sum, field) => sum + Math.max(0.0001, normalizeSample(field.sample(x, y)).density), 0);
            return {
                density,
                flowX: flowX / flowWeight,
                flowY: flowY / flowWeight,
                drag,
                buoyancy,
                viscosity,
                lift,
            };
        },
    };
}
export function flyingObjectStep(input) {
    if (!Number.isFinite(input.dt) || input.dt < 0) {
        throw new Error(`Invalid flying object dt: ${input.dt}`);
    }
    const dt = input.dt;
    const object = input.object;
    const mass = Math.max(0.001, finiteOr(object.mass, 1));
    const fluid = normalizeSample(input.fluid?.sample(object.x, object.y) ?? VACUUM_SAMPLE);
    const gravityScale = finiteOr(input.gravityScale, 1);
    let ax = finiteOr(input.thrustX, 0) / mass;
    let ay = (input.params.gravity * gravityScale + finiteOr(input.thrustY, 0)) / mass;
    const dragStrength = (fluid.drag * fluid.density) / mass;
    ax += (fluid.flowX - object.vx) * dragStrength;
    ay += (fluid.flowY - object.vy) * dragStrength;
    ay -= (input.params.gravity * (fluid.buoyancy ?? 0) * fluid.density) / mass;
    ay -= (Math.abs(fluid.flowX - object.vx) * (fluid.lift ?? 0) * fluid.density) / mass;
    const vx = object.vx + ax * dt;
    const vy = clamp(object.vy + ay * dt, -input.params.maxFallSpeed, input.params.maxFallSpeed);
    const angularDamping = clamp(1 - (fluid.viscosity ?? fluid.drag) * fluid.density * dt, 0, 1);
    const angularVelocity = (object.angularVelocity + (finiteOr(input.torque, 0) / mass) * dt) * angularDamping;
    return {
        ...object,
        x: object.x + vx * dt,
        y: object.y + vy * dt,
        vx,
        vy,
        angle: object.angle + angularVelocity * dt,
        angularVelocity,
        life: object.life === undefined ? undefined : Math.max(0, object.life - dt),
    };
}
//# sourceMappingURL=flyingObjectStep.js.map