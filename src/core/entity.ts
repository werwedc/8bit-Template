/**
 * Entity — component-bag base class.
 *
 * Deliberately minimal. Avoids the learning tax of a full ECS framework
 * while still preventing each team from rolling incompatible entity bases.
 *
 * Usage:
 *   class Player extends Entity {
 *     constructor() {
 *       super();
 *       this.set('velocity', { x: 0, y: 0 });
 *       this.set('health', 100);
 *       this.view.addChild(new Sprite(...));
 *     }
 *   }
 *
 *   const vel = player.get<{ x: number; y: number }>('velocity');
 *   vel.x += 10;
 *
 * `view` is the Pixi Container. Add it to scene.container:
 *   scene.container.addChild(player.view);
 */

import { Container } from 'pixi.js';

export class Entity {
  /**
   * The display container for this entity.
   * Add child sprites/graphics here. Position via view.x / view.y.
   */
  readonly view: Container = new Container();

  private readonly components = new Map<string, unknown>();

  /** Attach a component. Fluent — returns `this` for chaining. */
  set<T>(key: string, component: T): this {
    this.components.set(key, component);
    return this;
  }

  /** Retrieve a component. Throws if missing (use has() to guard if needed). */
  get<T>(key: string): T {
    const c = this.components.get(key);
    if (c === undefined) throw new Error(`Entity: missing component "${key}"`);
    return c as T;
  }

  has(key: string): boolean {
    return this.components.has(key);
  }

  remove(key: string): this {
    this.components.delete(key);
    return this;
  }

  /** Destroy the entity's display container and all its children. */
  destroy(): void {
    this.view.destroy({ children: true });
    this.components.clear();
  }
}
