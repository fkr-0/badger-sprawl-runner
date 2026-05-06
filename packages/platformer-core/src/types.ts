export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Transform extends Rect {
  dir: number; // -1 or 1
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface MovementState {
  onGround: boolean;
  coyoteLeft: number;
  jumpBuffered: number;
}

export interface Collider extends Rect {
  layer: number; // bit mask
}

export interface Health {
  hp: number;
  maxHp: number;
  greyHp: number;
  invuln: number; // invincibility timer
}

export interface HitboxSet {
  hurt: Rect | null; // always present but nullable
  attack: Rect | null;
  parry: Rect | null;
}

export interface ActorFlags {
  hasRailgun: boolean;
  hasRocket: boolean;
  hasKatana: boolean;
}
