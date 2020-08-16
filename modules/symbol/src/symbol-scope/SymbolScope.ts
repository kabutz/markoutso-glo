import PSISymbol from '../symbol/PSISymbol';
import CaseInsensitiveMap from 'case-insensitive-map';
import LocalSymbolScope from './LocalSymbolScope';
import { PSIDataType, PSIArrayLike } from 'data-types';
import PSIError from 'error';
import { VariableSymbol } from '../symbol';

class ScopeChildren extends CaseInsensitiveMap<string, LocalSymbolScope> {
  public add(scope: LocalSymbolScope) {
    this.set(scope.name, scope);
  }

  public get(scopeName: string): LocalSymbolScope | null {
    const childScope = CaseInsensitiveMap.prototype.get.call(this, scopeName);
    if (childScope) {
      return childScope;
    } else {
      return null;
    }
  }
}

export default abstract class SymbolScope {
  private scope: CaseInsensitiveMap<string, PSISymbol>;
  private value: CaseInsensitiveMap<string, PSIDataType>;
  public readonly children: ScopeChildren;
  protected abstract readonly parent: SymbolScope | null;
  public readonly name: string;

  constructor(name: string) {
    this.scope = new CaseInsensitiveMap();
    this.value = new CaseInsensitiveMap();
    this.children = new ScopeChildren();
    this.name = name;
  }

  public resolveValue<T extends PSIDataType>(
    name: string,
    type?: new (...a: any[]) => T,
  ): T | null {
    const result = this.value.get(name);
    if (result && type ? result instanceof type : true) {
      return result;
    } else if (this.parent) {
      return this.parent.resolveValue(name, type);
    } else {
      return null;
    }
  }

  public resolveValueThisScopeOnly<T extends PSIDataType>(
    name: string,
  ): T | null {
    const result = this.value.get(name);
    return result || null;
  }

  public changeArrayValue(
    arrayName: string,
    accessors: PSIDataType[],
    value: PSIDataType,
  ) {
    const scope = this.findScope(arrayName)!;
    const array = scope.resolveValueThisScopeOnly(arrayName)! as PSIDataType &
      PSIArrayLike;

    array.changeValue(accessors, value);
  }

  public changeValue(name: string, value: PSIDataType) {
    this.findScope(name)!.value.set(name, value);
  }

  private findScope(name: string): SymbolScope | null {
    const result = this.scope.get(name);
    if (result) {
      return this;
    } else if (this.parent) {
      return this.parent.findScope(name);
    } else {
      return null;
    }
  }

  public getParent() {
    return this.parent;
  }

  public insert(symbol: PSISymbol) {
    if (this.has(symbol)) {
      throw new PSIError(symbol, `Symbol ${symbol.name} is being redeclared`);
    }

    this.scope.set(symbol.name, symbol);
    if (
      symbol instanceof VariableSymbol &&
      ((symbol.type as unknown) as typeof PSIDataType).defaultValue
    ) {
      this.value.set(
        symbol.name,
        ((symbol.type as unknown) as typeof PSIDataType).defaultValue!,
      );
    }
  }

  public has(symbol: PSISymbol) {
    return this.scope.has(symbol.name);
  }

  public resolve<T extends PSISymbol>(
    name: string,
    symbolType?: new (...a: any[]) => T,
  ): T | null {
    const result = this.scope.get(name);
    if (result && (symbolType ? result instanceof symbolType : true)) {
      return result;
    } else if (this.parent) {
      return this.parent.resolve(name, symbolType);
    } else {
      return null;
    }
  }
}
