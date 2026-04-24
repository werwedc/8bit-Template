import type { Container } from 'pixi.js';

export class Camera {
  private shakeIntensityX = 0;
  private shakeIntensityY = 0;
  private shakeIntensityRot = 0;
  private shakeDuration = 0;
  private shakeElapsed = 0;

  constructor(private readonly target: Container) {}

  shake(intensityX: number, intensityY: number, intensityRot: number, duration: number): void {
    this.shakeIntensityX = intensityX;
    this.shakeIntensityY = intensityY;
    this.shakeIntensityRot = intensityRot;
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
  }

  update(dt: number): void {
    if (this.shakeElapsed < this.shakeDuration) {
      this.shakeElapsed += dt;
      const progress = this.shakeElapsed / this.shakeDuration;
      // Exponential decay or linear
      const strength = 1 - progress;
      
      this.target.x = (Math.random() * 2 - 1) * this.shakeIntensityX * strength;
      this.target.y = (Math.random() * 2 - 1) * this.shakeIntensityY * strength;
      this.target.angle = (Math.random() * 2 - 1) * this.shakeIntensityRot * strength;
    } else if (this.target.x !== 0 || this.target.y !== 0 || this.target.angle !== 0) {
      this.target.position.set(0, 0);
      this.target.angle = 0;
    }
  }
}
