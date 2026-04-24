import type { Application } from 'pixi.js';

export class UIManager {
  private readonly root: HTMLDivElement;
  private readonly layers = new Map<string, HTMLDivElement>();
  private readonly listeners = new Map<string, { el: Element; event: string; fn: EventListener }>();

  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'game-ui';
    document.body.appendChild(this.root);
  }

  addLayer(id: string, html?: string): HTMLDivElement {
    const el = document.createElement('div');
    el.classList.add('ui-layer');
    el.dataset.layer = id;
    if (html) el.innerHTML = html;
    this.root.appendChild(el);
    this.layers.set(id, el);
    return el;
  }

  getLayer(id: string): HTMLDivElement | undefined {
    return this.layers.get(id);
  }

  show(id: string): void {
    const el = this.layers.get(id);
    if (el) el.style.display = 'flex';
  }

  hide(id: string): void {
    const el = this.layers.get(id);
    if (el) el.style.display = '';
  }

  hideAll(): void {
    for (const el of this.layers.values()) {
      el.style.display = '';
    }
  }

  setText(selector: string, text: string): void {
    const el = this.root.querySelector(selector) as HTMLElement | null;
    if (el) el.textContent = text;
  }

  onClick(selector: string, handler: () => void): void {
    this.on(selector, 'click', handler);
  }

  on(selector: string, event: string, handler: EventListener): void {
    const el = this.root.querySelector(selector);
    if (!el) return;

    const key = `${selector}::${event}`;
    const prev = this.listeners.get(key);
    if (prev) prev.el.removeEventListener(prev.event, prev.fn);

    el.addEventListener(event, handler);
    this.listeners.set(key, { el, event, fn: handler });
  }

  removeAllListeners(): void {
    for (const { el, event, fn } of this.listeners.values()) {
      el.removeEventListener(event, fn);
    }
    this.listeners.clear();
  }

  query<T extends Element = Element>(selector: string): T | null {
    return this.root.querySelector<T>(selector);
  }

  destroy(): void {
    this.removeAllListeners();
    this.root.remove();
    this.layers.clear();
  }
}
