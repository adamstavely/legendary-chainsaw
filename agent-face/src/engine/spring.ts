export interface SpringConfig {
  stiffness: number;
  damping: number;
}

const REST_EPSILON = 0.001;

export class Spring {
  value: number;
  velocity = 0;
  target: number;

  constructor(
    initial: number,
    private readonly config: SpringConfig,
  ) {
    this.value = initial;
    this.target = initial;
  }

  /** One semi-implicit Euler step, which stays stable at the engine's fixed time step */
  step(dtSeconds: number): void {
    const accel = this.config.stiffness * (this.target - this.value) - this.config.damping * this.velocity;
    this.velocity += accel * dtSeconds;
    this.value += this.velocity * dtSeconds;
  }

  snap(): void {
    this.value = this.target;
    this.velocity = 0;
  }

  get atRest(): boolean {
    return Math.abs(this.velocity) < REST_EPSILON && Math.abs(this.target - this.value) < REST_EPSILON;
  }
}
