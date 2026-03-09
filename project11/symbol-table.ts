import { defaultIndexMap, type Kind } from "./constant";

export class SymbolTable {
  private classTable: Record<
    string,
    { type: string; kind: Kind; index: number }
  > = {};
  private subroutineTable: Record<
    string,
    { type: string; kind: Kind; index: number }
  > = {};
  private classIndexMap: Record<Kind, number> = { ...defaultIndexMap };
  private subroutineIndexMap: Record<Kind, number> = { ...defaultIndexMap };

  private getScope(kind: Kind): "class" | "subroutine" {
    switch (kind) {
      case "STATIC":
      case "FIELD": {
        return "class";
      }
      case "ARG":
      case "VAR": {
        return "subroutine";
      }
      default:
        throw new Error("Invalid kind");
    }
  }

  reset() {
    this.subroutineTable = {};
    this.subroutineIndexMap = { ...defaultIndexMap };
  }

  define({ name, type, kind }: { name: string; type: string; kind: Kind }) {
    const scope = this.getScope(kind);
    if (scope === "class") {
      this.classTable[name] = {
        type,
        kind,
        index: this.classIndexMap[kind],
      };
      this.classIndexMap[kind] = this.classIndexMap[kind] + 1;
    } else {
      this.subroutineTable[name] = {
        type,
        kind,
        index: this.subroutineIndexMap[kind],
      };
      this.subroutineIndexMap[kind] = this.subroutineIndexMap[kind] + 1;
    }
  }

  varCount(kind: Kind): number {
    const scope = this.getScope(kind);
    if (scope === "class") {
      return this.classIndexMap[kind];
    } else {
      return this.subroutineIndexMap[kind];
    }
  }

  kindOf(name: string) {
    const kind =
      this.subroutineTable[name]?.kind ?? this.classTable[name]?.kind ?? "NONE";
    return kind;
  }

  typeOf(name: string): string {
    const type =
      this.subroutineTable[name]?.type ?? this.classTable[name]?.type;
    if (!type) throw new Error("Unregistered name");
    return type;
  }

  indexOf(name: string): number {
    const index =
      this.subroutineTable[name]?.index ?? this.classTable[name]?.index;
    if (index === undefined) throw new Error("Unregistered name");
    return index;
  }
}
