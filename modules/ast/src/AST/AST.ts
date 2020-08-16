import { DebugInfoProvider } from 'error';
import { PSIDataType } from 'data-types';

export default abstract class AST extends DebugInfoProvider {
  private readonly _children: AST[] = [];
  public parent: AST | null = null;

  get children() {
    return this._children;
  }

  public addChild(...children: AST[]) {
    children.forEach(child => {
      child.parent = this;
      this._children.push(child);
    });
  }

  public replace(node: AST): AST {
    if (this.parent === null) {
      throw new Error('Invalid tree configuration');
    }
    const index = this.parent._children.findIndex(node => node === this);

    if (index == -1) {
      throw new Error('Invalid tree configuration');
    }

    this.parent._children[index] = node;
    this.parent = null;
    return this;
  }
}
