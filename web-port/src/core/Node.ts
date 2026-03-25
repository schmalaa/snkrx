type MixinFunction<T> = (node: T, ...args: any[]) => void;

export class GameNode {
  id: string;
  tag?: string;
  parent: GameNode | null = null;
  children: GameNode[] = [];
  components: Map<string, any> = new Map();
  
  active: boolean = true;
  dead: boolean = false;

  constructor(id?: string, tag?: string) {
    this.id = id || Math.random().toString(36).substr(2, 9);
    this.tag = tag;
  }

  setTag(tag: string): this {
    this.tag = tag;
    return this;
  }

  append(child: GameNode): GameNode {
    child.parent = this;
    this.children.push(child);
    return this;
  }

  remove(child: GameNode) {
    this.children = this.children.filter(c => c !== child);
    child.parent = null;
  }

  addComponent<T>(name: string, component: T): T {
    this.components.set(name, component);
    return component;
  }

  getComponent<T>(name: string): T | undefined {
    return this.components.get(name) as T;
  }

  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  destroy() {
    this.dead = true;
    for (const c of this.children) c.destroy();
  }

  applyMixin(mixin: MixinFunction<this>, ...args: any[]): this {
    mixin(this, ...args);
    return this;
  }
}
