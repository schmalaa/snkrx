import { GameNode } from './Node';

export abstract class System {
  abstract update(dt: number, root: GameNode): void;
  abstract render(ctx: CanvasRenderingContext2D, root: GameNode): void;

  /**
   * Returns a flat array of all alive nodes starting from the given root node.
   */
  protected getNodes(node: GameNode): GameNode[] {
    if (node.dead || !node.active) return [];
    let list = [node];
    for (const child of node.children) {
      list.push(...this.getNodes(child));
    }
    return list;
  }

  /**
   * Filters the node tree for nodes having all the specified component names.
   */
  protected getNodesWith(node: GameNode, componentNames: string[]): GameNode[] {
    return this.getNodes(node).filter(n => 
      componentNames.every(name => n.hasComponent(name))
    );
  }
}
