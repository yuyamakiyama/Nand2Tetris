export class SymbolTable {
  private nextAddress: number = 16;
  private symbolTable: Record<string, number> = {
    R0: 0,
    R1: 1,
    R2: 2,
    R3: 3,
    R4: 4,
    R5: 5,
    R6: 6,
    R7: 7,
    R8: 8,
    R9: 9,
    R10: 10,
    R11: 11,
    R12: 12,
    R13: 13,
    R14: 14,
    R15: 15,
    SP: 0,
    LCL: 1,
    ARG: 2,
    THIS: 3,
    THAT: 4,
    SCREEN: 16384,
    KBD: 24576,
  };

  addEntry({ symbol, address }: { symbol: string; address?: number }): void {
    if (address) {
      this.symbolTable[symbol] = address;
      return;
    }
    this.symbolTable[symbol] = this.nextAddress;
    this.nextAddress++;
  }

  contains({ symbol }: { symbol: string }): boolean {
    return this.symbolTable[symbol] !== undefined;
  }

  getAddress({ symbol }: { symbol: string }): number {
    return this.symbolTable[symbol] ?? Number(symbol);
  }

  getSymbolTable(): Record<string, number> {
    return this.symbolTable;
  }
}
