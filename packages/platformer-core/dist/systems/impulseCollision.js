function inverseMass(body) {
    if (body.invMass !== undefined)
        return Math.max(0, body.invMass);
    return body.mass === 0 ? 0 : 1 / Math.max(0.0001, body.mass ?? 1);
}
function normalize(x, y) {
    const length = Math.hypot(x, y);
    if (length === 0)
        return { x: 1, y: 0 };
    return { x: x / length, y: y / length };
}
function contactKey(contact) {
    return contact.a < contact.b ? `${contact.a}\u0000${contact.b}` : `${contact.b}\u0000${contact.a}`;
}
export function resolveImpulseCollisions(bodies, contacts) {
    const next = bodies.map((body) => ({ ...body }));
    const byId = new Map(next.map((body) => [body.id, body]));
    const events = [];
    for (const contact of [...contacts].sort((a, b) => contactKey(a).localeCompare(contactKey(b)))) {
        const a = byId.get(contact.a);
        const b = byId.get(contact.b);
        if (!a || !b)
            continue;
        const normal = normalize(contact.normalX, contact.normalY);
        const invA = inverseMass(a);
        const invB = inverseMass(b);
        const invSum = invA + invB;
        if (invSum === 0)
            continue;
        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const velAlongNormal = rvx * normal.x + rvy * normal.y;
        let impulse = 0;
        if (velAlongNormal < 0) {
            const restitution = Math.min(a.restitution ?? 0, b.restitution ?? 0);
            impulse = (-(1 + restitution) * velAlongNormal) / invSum;
            const impulseX = impulse * normal.x;
            const impulseY = impulse * normal.y;
            a.vx -= impulseX * invA;
            a.vy -= impulseY * invA;
            b.vx += impulseX * invB;
            b.vy += impulseY * invB;
        }
        const tangent = normalize(rvx - velAlongNormal * normal.x, rvy - velAlongNormal * normal.y);
        const relTangent = rvx * tangent.x + rvy * tangent.y;
        const friction = Math.sqrt(Math.max(0, a.friction ?? 0) * Math.max(0, b.friction ?? 0));
        const frictionImpulse = invSum === 0 ? 0 : Math.max(-impulse * friction, Math.min(impulse * friction, -relTangent / invSum));
        if (frictionImpulse !== 0) {
            const fx = frictionImpulse * tangent.x;
            const fy = frictionImpulse * tangent.y;
            a.vx -= fx * invA;
            a.vy -= fy * invA;
            b.vx += fx * invB;
            b.vy += fy * invB;
        }
        const penetration = Math.max(0, contact.penetration ?? 0);
        const correctionMagnitude = penetration > 0 ? (Math.max(0, penetration - 0.001) / invSum) * 0.8 : 0;
        const correctionX = correctionMagnitude * normal.x;
        const correctionY = correctionMagnitude * normal.y;
        if (correctionMagnitude > 0) {
            a.x -= correctionX * invA;
            a.y -= correctionY * invA;
            b.x += correctionX * invB;
            b.y += correctionY * invB;
        }
        events.push({
            contactId: contactKey(contact),
            impulse: Number(impulse.toFixed(6)),
            frictionImpulse: Number(frictionImpulse.toFixed(6)),
            correctionX: Number(correctionX.toFixed(6)),
            correctionY: Number(correctionY.toFixed(6)),
        });
    }
    return { bodies: next, events };
}
//# sourceMappingURL=impulseCollision.js.map