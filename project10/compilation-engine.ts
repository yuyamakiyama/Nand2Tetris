import type { SymbolType, TokenType } from "./constant";
import { JackTokenizer } from "./jack-tokenizer";

export class CompilationEngine {
  private tokenizer: JackTokenizer;
  private elements: string[] = [];
  private indent: number = 0;

  constructor({ tokenizer }: { tokenizer: JackTokenizer }) {
    this.tokenizer = tokenizer;
  }

  private isSymbol(s: SymbolType): boolean {
    return (
      this.tokenizer.tokenType() === "SYMBOL" && this.tokenizer.symbol() === s
    );
  }

  private isKeyword(k: string): boolean {
    return (
      this.tokenizer.tokenType() === "KEYWORD" && this.tokenizer.keyword() === k
    );
  }

  getXMLTemplate(): string {
    return this.elements.join("\n");
  }

  writeTag(tag: string) {
    if (tag.startsWith("</")) {
      this.indent--;
      this.elements.push(`${"  ".repeat(this.indent)}${tag}`);
    } else {
      this.elements.push(`${"  ".repeat(this.indent)}${tag}`);
      this.indent++;
    }
  }

  private escapeXml(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  private writeToken() {
    const pad = "  ".repeat(this.indent);
    const tokenType = this.tokenizer.tokenType();
    switch (tokenType) {
      case "KEYWORD": {
        this.elements.push(`${pad}<keyword> ${this.tokenizer.keyword()} </keyword>`);
        break;
      }
      case "SYMBOL": {
        const val = this.escapeXml(this.tokenizer.symbol());
        this.elements.push(`${pad}<symbol> ${val} </symbol>`);
        break;
      }
      case "IDENTIFIER": {
        this.elements.push(`${pad}<identifier> ${this.tokenizer.identifier()} </identifier>`);
        break;
      }
      case "INT_CONST": {
        this.elements.push(`${pad}<integerConstant> ${this.tokenizer.intVal()} </integerConstant>`);
        break;
      }
      case "STRING_CONST": {
        this.elements.push(`${pad}<stringConstant> ${this.tokenizer.stringVal()} </stringConstant>`);
        break;
      }
    }
    this.tokenizer.advance();
  }

  compileClass(): void {
    this.writeTag("<class>");

    this.writeToken(); // 'class'
    this.writeToken(); // className
    this.writeToken(); // '{'

    while (this.isKeyword("static") || this.isKeyword("field")) {
      this.compileClassVarDec();
    }

    while (
      this.isKeyword("constructor") ||
      this.isKeyword("function") ||
      this.isKeyword("method")
    ) {
      this.compileSubroutine();
    }

    this.writeToken(); // '}'

    this.writeTag("</class>");
  }

  compileClassVarDec(): void {
    this.writeTag("<classVarDec>");
    this.writeToken(); // 'static' | 'field'
    this.writeToken(); // type
    this.writeToken(); // varName

    while (this.isSymbol(",")) {
      this.writeToken(); // ','
      this.writeToken(); // varName
    }

    this.writeToken(); // ';'

    this.writeTag("</classVarDec>");
  }

  compileSubroutine(): void {
    this.writeTag("<subroutineDec>");

    this.writeToken(); // 'constructor' | 'function' | 'method'
    this.writeToken(); // 'void' | type
    this.writeToken(); // subroutineName
    this.writeToken(); // '('

    this.compileParameterList();

    this.writeToken(); // ')'

    this.compileSubroutineBody();

    this.writeTag("</subroutineDec>");
  }

  compileParameterList(): void {
    this.writeTag("<parameterList>");

    if (this.isSymbol(")")) {
      this.writeTag("</parameterList>");
      return;
    }

    this.writeToken(); // type
    this.writeToken(); // varName

    while (this.isSymbol(",")) {
      this.writeToken(); // ','
      this.writeToken(); // type
      this.writeToken(); // varName
    }

    this.writeTag("</parameterList>");
  }

  compileSubroutineBody(): void {
    this.writeTag("<subroutineBody>");

    this.writeToken(); // '{'

    while (this.isKeyword("var")) {
      this.compileVarDec();
    }

    this.compileStatements();
    this.writeToken(); // '}'

    this.writeTag("</subroutineBody>");
  }

  compileVarDec(): void {
    this.writeTag("<varDec>");

    this.writeToken(); // 'var'
    this.writeToken(); // type
    this.writeToken(); // varName

    while (this.isSymbol(",")) {
      this.writeToken(); // ','
      this.writeToken(); // varName
    }

    this.writeToken(); // ';'

    this.writeTag("</varDec>");
  }

  compileStatements(): void {
    this.writeTag("<statements>");

    while (this.tokenizer.tokenType() === "KEYWORD") {
      switch (this.tokenizer.keyword()) {
        case "let":
          this.compileLet();
          break;
        case "if":
          this.compileIf();
          break;
        case "while":
          this.compileWhile();
          break;
        case "do":
          this.compileDo();
          break;
        case "return":
          this.compileReturn();
          break;
        default:
          this.writeTag("</statements>");
          return;
      }
    }

    this.writeTag("</statements>");
  }

  compileLet(): void {
    this.writeTag("<letStatement>");

    this.writeToken(); // 'let'
    this.writeToken(); // varName

    if (this.isSymbol("[")) {
      this.writeToken(); // '['
      this.compileExpression();
      this.writeToken(); // ']'
    }

    this.writeToken(); // '='
    this.compileExpression();
    this.writeToken(); // ';'

    this.writeTag("</letStatement>");
  }

  compileIf(): void {
    this.writeTag("<ifStatement>");

    this.writeToken(); // 'if'
    this.writeToken(); // '('
    this.compileExpression();
    this.writeToken(); // ')'
    this.writeToken(); // '{'
    this.compileStatements();
    this.writeToken(); // '}'

    if (this.isKeyword("else")) {
      this.writeToken(); // 'else'
      this.writeToken(); // '{'
      this.compileStatements();
      this.writeToken(); // '}'
    }

    this.writeTag("</ifStatement>");
  }

  compileWhile(): void {
    this.writeTag("<whileStatement>");

    this.writeToken(); // 'while'
    this.writeToken(); // '('
    this.compileExpression();
    this.writeToken(); // ')'
    this.writeToken(); // '{'
    this.compileStatements();
    this.writeToken(); // '}'

    this.writeTag("</whileStatement>");
  }

  compileDo(): void {
    this.writeTag("<doStatement>");

    this.writeToken(); // 'do'
    this.writeToken(); // subroutineName | className | varName

    if (this.isSymbol(".")) {
      this.writeToken(); // '.'
      this.writeToken(); // subroutineName
    }

    this.writeToken(); // '('
    this.compileExpressionList();
    this.writeToken(); // ')'
    this.writeToken(); // ';'

    this.writeTag("</doStatement>");
  }

  compileReturn(): void {
    this.writeTag("<returnStatement>");

    this.writeToken(); // 'return'

    if (!this.isSymbol(";")) {
      this.compileExpression();
    }

    this.writeToken(); // ';'

    this.writeTag("</returnStatement>");
  }

  compileExpression(): void {
    this.writeTag("<expression>");

    this.compileTerm();

    while (
      this.tokenizer.tokenType() === "SYMBOL" &&
      ["+", "-", "*", "/", "&", "|", "<", ">", "="].includes(
        this.tokenizer.symbol(),
      )
    ) {
      this.writeToken(); // op
      this.compileTerm();
    }

    this.writeTag("</expression>");
  }

  compileTerm(): void {
    this.writeTag("<term>");

    if (
      this.tokenizer.tokenType() === "INT_CONST" ||
      this.tokenizer.tokenType() === "STRING_CONST"
    ) {
      this.writeToken();
      this.writeTag("</term>");
      return;
    }

    if (this.tokenizer.tokenType() === "KEYWORD") {
      this.writeToken(); // 'true' | 'false' | 'null' | 'this'
      this.writeTag("</term>");
      return;
    }

    if (this.isSymbol("(")) {
      this.writeToken(); // '('
      this.compileExpression();
      this.writeToken(); // ')'
      this.writeTag("</term>");
      return;
    }

    if (this.isSymbol("-") || this.isSymbol("~")) {
      this.writeToken(); // unaryOp
      this.compileTerm();
      this.writeTag("</term>");
      return;
    }

    this.writeToken(); // varName | subroutineName | className

    if (this.isSymbol("[")) {
      this.writeToken(); // '['
      this.compileExpression();
      this.writeToken(); // ']'
      this.writeTag("</term>");
      return;
    }

    if (this.isSymbol("(")) {
      this.writeToken(); // '('
      this.compileExpressionList();
      this.writeToken(); // ')'
      this.writeTag("</term>");
      return;
    }

    if (this.isSymbol(".")) {
      this.writeToken(); // '.'
      this.writeToken(); // subroutineName
      this.writeToken(); // '('
      this.compileExpressionList();
      this.writeToken(); // ')'
      this.writeTag("</term>");
      return;
    }

    this.writeTag("</term>");
  }

  compileExpressionList(): number {
    this.writeTag("<expressionList>");

    if (this.isSymbol(")")) {
      this.writeTag("</expressionList>");
      return 0;
    }

    this.compileExpression();
    let count = 1;

    while (this.isSymbol(",")) {
      this.writeToken(); // ','
      this.compileExpression();
      count++;
    }

    this.writeTag("</expressionList>");
    return count;
  }
}
