import {
  type Keyword,
  keywords,
  type SymbolType,
  symbols,
  type TokenType,
} from "./constant";

export class JackTokenizer {
  private tokens: string[];
  private currentIndex: number = 0;

  constructor({ content }: { content: string }) {
    const pattern =
      /\/\/.*|\/\*[\s\S]*?\*\/|"[^"]*"|\d+|[{}()[\].,;+\-*/&|<>=~]|[a-zA-Z_]\w*/g;

    this.tokens =
      content
        .match(pattern)
        ?.filter(
          (token) => !token.startsWith("//") && !token.startsWith("/*"),
        ) ?? [];
  }

  hasMoreTokens(): boolean {
    return this.tokens.length > this.currentIndex;
  }

  advance(): void {
    this.currentIndex++;
  }

  tokenType(): TokenType {
    const token = this.tokens[this.currentIndex];

    if (!token) throw new Error("No token found");

    if (keywords.includes(token as Keyword)) return "KEYWORD";

    if (symbols.includes(token as SymbolType)) return "SYMBOL";

    if (/^[a-zA-Z_]\w*$/.test(token)) return "IDENTIFIER";

    if (/^\d+$/.test(token)) return "INT_CONST";

    if (/^"[^"\n]*"$/.test(token)) return "STRING_CONST";

    throw new Error(`Unknown token: ${token}`);
  }

  keyword(): Keyword {
    if (this.tokenType() === "KEYWORD") {
      return this.tokens[this.currentIndex] as Keyword;
    }
    throw new Error("Invalid tokenType");
  }

  symbol(): SymbolType {
    if (this.tokenType() === "SYMBOL") {
      return this.tokens[this.currentIndex] as SymbolType;
    }
    throw new Error("Invalid tokenType");
  }

  identifier(): string {
    if (this.tokenType() === "IDENTIFIER") {
      return this.tokens[this.currentIndex] ?? "";
    }
    throw new Error("Invalid tokenType");
  }

  intVal(): number {
    if (this.tokenType() === "INT_CONST") {
      return Number(this.tokens[this.currentIndex]);
    }
    throw new Error("Invalid tokenType");
  }

  stringVal(): string {
    if (this.tokenType() === "STRING_CONST") {
      return (this.tokens[this.currentIndex] as string).slice(1, -1);
    }
    throw new Error("Invalid tokenType");
  }
}
