import type { Kind, Segment, SymbolType } from "./constant";
import { JackTokenizer } from "./jack-tokenizer";
import { SymbolTable } from "./symbol-table";
import { VMWriter } from "./vm-writer";

const kindToSegment: Record<Kind, Segment> = {
  STATIC: "STATIC",
  FIELD: "THIS",
  ARG: "ARGUMENT",
  VAR: "LOCAL",
};

export class CompilationEngine {
  private tokenizer: JackTokenizer;
  private vmWriter: VMWriter;
  private symbolTable: SymbolTable;
  private className: string = "";
  private ifLabelCount: number = 0;
  private whileLabelCount: number = 0;

  constructor({
    content,
    outputFilePath,
  }: {
    content: string;
    outputFilePath: string;
  }) {
    this.tokenizer = new JackTokenizer({ content });
    this.vmWriter = new VMWriter({ outputFilePath });
    this.symbolTable = new SymbolTable();
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

  private readType(): string {
    const tokenType = this.tokenizer.tokenType();
    if (tokenType === "KEYWORD") {
      return this.tokenizer.keyword();
    }
    return this.tokenizer.identifier();
  }

  compileClass(): void {
    this.tokenizer.advance(); // 'class'
    this.className = this.tokenizer.identifier();
    this.tokenizer.advance(); // className
    this.tokenizer.advance(); // '{'

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

    this.tokenizer.advance(); // '}'
    this.vmWriter.close();
  }

  compileClassVarDec(): void {
    const kind = this.tokenizer.keyword().toUpperCase() as Kind; // 'STATIC' | 'FIELD'
    this.tokenizer.advance(); // 'static' | 'field'
    const type = this.readType();
    this.tokenizer.advance(); // type
    const name = this.tokenizer.identifier();
    this.tokenizer.advance(); // varName
    this.symbolTable.define({ name, type, kind });

    while (this.isSymbol(",")) {
      this.tokenizer.advance(); // ','
      const name = this.tokenizer.identifier();
      this.tokenizer.advance(); // varName
      this.symbolTable.define({ name, type, kind });
    }

    this.tokenizer.advance(); // ';'
  }

  compileSubroutine(): void {
    this.symbolTable.reset();
    const subroutineType = this.tokenizer.keyword();
    this.tokenizer.advance(); // 'constructor' | 'function' | 'method'

    if (subroutineType === "method") {
      this.symbolTable.define({
        name: "this",
        type: this.className,
        kind: "ARG",
      });
    }

    this.tokenizer.advance(); // 'void' | type
    const subroutineName = this.tokenizer.identifier();
    this.tokenizer.advance(); // subroutineName
    this.tokenizer.advance(); // '('

    this.compileParameterList();

    this.tokenizer.advance(); // ')'

    this.compileSubroutineBody(subroutineType, subroutineName);
  }

  compileParameterList(): void {
    if (this.isSymbol(")")) {
      return;
    }

    const type = this.readType();
    this.tokenizer.advance(); // type
    const name = this.tokenizer.identifier();
    this.tokenizer.advance(); // varName
    this.symbolTable.define({ name, type, kind: "ARG" });

    while (this.isSymbol(",")) {
      this.tokenizer.advance(); // ','
      const type = this.readType();
      this.tokenizer.advance(); // type
      const name = this.tokenizer.identifier();
      this.tokenizer.advance(); // varName
      this.symbolTable.define({ name, type, kind: "ARG" });
    }
  }

  compileSubroutineBody(subroutineType: string, subroutineName: string): void {
    this.tokenizer.advance(); // '{'

    while (this.isKeyword("var")) {
      this.compileVarDec();
    }

    const nLocals = this.symbolTable.varCount("VAR");
    this.vmWriter.writeFunction({
      name: `${this.className}.${subroutineName}`,
      nVars: nLocals,
    });

    if (subroutineType === "constructor") {
      const nFields = this.symbolTable.varCount("FIELD");
      this.vmWriter.writePush({ segment: "CONSTANT", index: nFields });
      this.vmWriter.writeCall({ name: "Memory.alloc", nArgs: 1 });
      this.vmWriter.writePop({ segment: "POINTER", index: 0 });
    } else if (subroutineType === "method") {
      this.vmWriter.writePush({ segment: "ARGUMENT", index: 0 });
      this.vmWriter.writePop({ segment: "POINTER", index: 0 });
    }

    this.compileStatements();
    this.tokenizer.advance(); // '}'
  }

  compileVarDec(): void {
    this.tokenizer.advance(); // 'var'
    const type = this.readType();
    this.tokenizer.advance(); // type
    const name = this.tokenizer.identifier();
    this.tokenizer.advance(); // varName
    this.symbolTable.define({ name, type, kind: "VAR" });

    while (this.isSymbol(",")) {
      this.tokenizer.advance(); // ','
      const name = this.tokenizer.identifier();
      this.tokenizer.advance(); // varName
      this.symbolTable.define({ name, type, kind: "VAR" });
    }

    this.tokenizer.advance(); // ';'
  }

  compileStatements(): void {
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
          return;
      }
    }
  }

  compileLet(): void {
    this.tokenizer.advance(); // 'let'
    const varName = this.tokenizer.identifier();
    this.tokenizer.advance(); // varName
    const kind = this.symbolTable.kindOf(varName) as Kind;
    const segment = kindToSegment[kind];
    const index = this.symbolTable.indexOf(varName);

    if (this.isSymbol("[")) {
      // array assignment: let arr[i] = expr;
      this.vmWriter.writePush({ segment, index });
      this.tokenizer.advance(); // '['
      this.compileExpression();
      this.tokenizer.advance(); // ']'
      this.vmWriter.writeArithmetic({ command: "ADD" });

      this.tokenizer.advance(); // '='
      this.compileExpression();
      this.tokenizer.advance(); // ';'

      this.vmWriter.writePop({ segment: "TEMP", index: 0 });
      this.vmWriter.writePop({ segment: "POINTER", index: 1 });
      this.vmWriter.writePush({ segment: "TEMP", index: 0 });
      this.vmWriter.writePop({ segment: "THAT", index: 0 });
    } else {
      // simple assignment: let x = expr;
      this.tokenizer.advance(); // '='
      this.compileExpression();
      this.tokenizer.advance(); // ';'
      this.vmWriter.writePop({ segment, index });
    }
  }

  compileIf(): void {
    const labelIndex = this.ifLabelCount++;

    this.tokenizer.advance(); // 'if'
    this.tokenizer.advance(); // '('
    this.compileExpression();
    this.tokenizer.advance(); // ')'

    this.vmWriter.writeIf({ label: `IF_TRUE${labelIndex}` });
    this.vmWriter.writeGoto({ label: `IF_FALSE${labelIndex}` });
    this.vmWriter.writeLabel({ label: `IF_TRUE${labelIndex}` });

    this.tokenizer.advance(); // '{'
    this.compileStatements();
    this.tokenizer.advance(); // '}'

    if (this.isKeyword("else")) {
      this.vmWriter.writeGoto({ label: `IF_END${labelIndex}` });
      this.vmWriter.writeLabel({ label: `IF_FALSE${labelIndex}` });
      this.tokenizer.advance(); // 'else'
      this.tokenizer.advance(); // '{'
      this.compileStatements();
      this.tokenizer.advance(); // '}'
      this.vmWriter.writeLabel({ label: `IF_END${labelIndex}` });
    } else {
      this.vmWriter.writeLabel({ label: `IF_FALSE${labelIndex}` });
    }
  }

  compileWhile(): void {
    const labelIndex = this.whileLabelCount++;

    this.vmWriter.writeLabel({ label: `WHILE_EXP${labelIndex}` });

    this.tokenizer.advance(); // 'while'
    this.tokenizer.advance(); // '('
    this.compileExpression();
    this.tokenizer.advance(); // ')'

    this.vmWriter.writeArithmetic({ command: "NOT" });
    this.vmWriter.writeIf({ label: `WHILE_END${labelIndex}` });

    this.tokenizer.advance(); // '{'
    this.compileStatements();
    this.tokenizer.advance(); // '}'

    this.vmWriter.writeGoto({ label: `WHILE_EXP${labelIndex}` });
    this.vmWriter.writeLabel({ label: `WHILE_END${labelIndex}` });
  }

  compileDo(): void {
    this.tokenizer.advance(); // 'do'
    this.compileSubroutineCall();
    this.tokenizer.advance(); // ';'
    this.vmWriter.writePop({ segment: "TEMP", index: 0 });
  }

  private compileSubroutineCall(): void {
    const name = this.tokenizer.identifier();
    this.tokenizer.advance(); // subroutineName | className | varName

    if (this.isSymbol(".")) {
      this.tokenizer.advance(); // '.'
      const subroutineName = this.tokenizer.identifier();
      this.tokenizer.advance(); // subroutineName

      const kind = this.symbolTable.kindOf(name);
      if (kind !== "NONE") {
        // method call on object: obj.method(args)
        const segment = kindToSegment[kind as Kind];
        const index = this.symbolTable.indexOf(name);
        const type = this.symbolTable.typeOf(name);
        this.vmWriter.writePush({ segment, index });
        this.tokenizer.advance(); // '('
        const nArgs = this.compileExpressionList();
        this.tokenizer.advance(); // ')'
        this.vmWriter.writeCall({
          name: `${type}.${subroutineName}`,
          nArgs: nArgs + 1,
        });
      } else {
        // function/constructor call: Class.func(args)
        this.tokenizer.advance(); // '('
        const nArgs = this.compileExpressionList();
        this.tokenizer.advance(); // ')'
        this.vmWriter.writeCall({
          name: `${name}.${subroutineName}`,
          nArgs,
        });
      }
    } else {
      // method call on this: foo(args)
      this.vmWriter.writePush({ segment: "POINTER", index: 0 });
      this.tokenizer.advance(); // '('
      const nArgs = this.compileExpressionList();
      this.tokenizer.advance(); // ')'
      this.vmWriter.writeCall({
        name: `${this.className}.${name}`,
        nArgs: nArgs + 1,
      });
    }
  }

  compileReturn(): void {
    this.tokenizer.advance(); // 'return'

    if (!this.isSymbol(";")) {
      this.compileExpression();
    } else {
      this.vmWriter.writePush({ segment: "CONSTANT", index: 0 });
    }

    this.tokenizer.advance(); // ';'
    this.vmWriter.writeReturn();
  }

  compileExpression(): void {
    this.compileTerm();

    while (
      this.tokenizer.tokenType() === "SYMBOL" &&
      ["+", "-", "*", "/", "&", "|", "<", ">", "="].includes(
        this.tokenizer.symbol(),
      )
    ) {
      const op = this.tokenizer.symbol();
      this.tokenizer.advance(); // op
      this.compileTerm();

      switch (op) {
        case "+":
          this.vmWriter.writeArithmetic({ command: "ADD" });
          break;
        case "-":
          this.vmWriter.writeArithmetic({ command: "SUB" });
          break;
        case "=":
          this.vmWriter.writeArithmetic({ command: "EQ" });
          break;
        case ">":
          this.vmWriter.writeArithmetic({ command: "GT" });
          break;
        case "<":
          this.vmWriter.writeArithmetic({ command: "LT" });
          break;
        case "&":
          this.vmWriter.writeArithmetic({ command: "AND" });
          break;
        case "|":
          this.vmWriter.writeArithmetic({ command: "OR" });
          break;
        case "*":
          this.vmWriter.writeCall({ name: "Math.multiply", nArgs: 2 });
          break;
        case "/":
          this.vmWriter.writeCall({ name: "Math.divide", nArgs: 2 });
          break;
      }
    }
  }

  compileTerm(): void {
    if (this.tokenizer.tokenType() === "INT_CONST") {
      this.vmWriter.writePush({
        segment: "CONSTANT",
        index: this.tokenizer.intVal(),
      });
      this.tokenizer.advance();
      return;
    }

    if (this.tokenizer.tokenType() === "STRING_CONST") {
      const str = this.tokenizer.stringVal();
      this.vmWriter.writePush({ segment: "CONSTANT", index: str.length });
      this.vmWriter.writeCall({ name: "String.new", nArgs: 1 });
      for (const char of str) {
        this.vmWriter.writePush({
          segment: "CONSTANT",
          index: char.charCodeAt(0),
        });
        this.vmWriter.writeCall({ name: "String.appendChar", nArgs: 2 });
      }
      this.tokenizer.advance();
      return;
    }

    if (this.tokenizer.tokenType() === "KEYWORD") {
      const keyword = this.tokenizer.keyword();
      switch (keyword) {
        case "true":
          this.vmWriter.writePush({ segment: "CONSTANT", index: 0 });
          this.vmWriter.writeArithmetic({ command: "NOT" });
          break;
        case "false":
        case "null":
          this.vmWriter.writePush({ segment: "CONSTANT", index: 0 });
          break;
        case "this":
          this.vmWriter.writePush({ segment: "POINTER", index: 0 });
          break;
      }
      this.tokenizer.advance();
      return;
    }

    if (this.isSymbol("(")) {
      this.tokenizer.advance(); // '('
      this.compileExpression();
      this.tokenizer.advance(); // ')'
      return;
    }

    if (this.isSymbol("-") || this.isSymbol("~")) {
      const op = this.tokenizer.symbol();
      this.tokenizer.advance(); // unaryOp
      this.compileTerm();
      if (op === "-") {
        this.vmWriter.writeArithmetic({ command: "NEG" });
      } else {
        this.vmWriter.writeArithmetic({ command: "NOT" });
      }
      return;
    }

    // identifier: variable, array access, or subroutine call
    const name = this.tokenizer.identifier();
    this.tokenizer.advance();

    if (this.isSymbol("[")) {
      // array access: arr[expr]
      const kind = this.symbolTable.kindOf(name) as Kind;
      const segment = kindToSegment[kind];
      const index = this.symbolTable.indexOf(name);
      this.vmWriter.writePush({ segment, index });
      this.tokenizer.advance(); // '['
      this.compileExpression();
      this.tokenizer.advance(); // ']'
      this.vmWriter.writeArithmetic({ command: "ADD" });
      this.vmWriter.writePop({ segment: "POINTER", index: 1 });
      this.vmWriter.writePush({ segment: "THAT", index: 0 });
      return;
    }

    if (this.isSymbol("(")) {
      // method call on this: foo(args)
      this.vmWriter.writePush({ segment: "POINTER", index: 0 });
      this.tokenizer.advance(); // '('
      const nArgs = this.compileExpressionList();
      this.tokenizer.advance(); // ')'
      this.vmWriter.writeCall({
        name: `${this.className}.${name}`,
        nArgs: nArgs + 1,
      });
      return;
    }

    if (this.isSymbol(".")) {
      this.tokenizer.advance(); // '.'
      const subroutineName = this.tokenizer.identifier();
      this.tokenizer.advance(); // subroutineName

      const kind = this.symbolTable.kindOf(name);
      if (kind !== "NONE") {
        // method call on object: obj.method(args)
        const segment = kindToSegment[kind as Kind];
        const index = this.symbolTable.indexOf(name);
        const type = this.symbolTable.typeOf(name);
        this.vmWriter.writePush({ segment, index });
        this.tokenizer.advance(); // '('
        const nArgs = this.compileExpressionList();
        this.tokenizer.advance(); // ')'
        this.vmWriter.writeCall({
          name: `${type}.${subroutineName}`,
          nArgs: nArgs + 1,
        });
      } else {
        // function/constructor call: Class.func(args)
        this.tokenizer.advance(); // '('
        const nArgs = this.compileExpressionList();
        this.tokenizer.advance(); // ')'
        this.vmWriter.writeCall({
          name: `${name}.${subroutineName}`,
          nArgs,
        });
      }
      return;
    }

    // simple variable
    const kind = this.symbolTable.kindOf(name) as Kind;
    const segment = kindToSegment[kind];
    const index = this.symbolTable.indexOf(name);
    this.vmWriter.writePush({ segment, index });
  }

  compileExpressionList(): number {
    if (this.isSymbol(")")) {
      return 0;
    }

    this.compileExpression();
    let count = 1;

    while (this.isSymbol(",")) {
      this.tokenizer.advance(); // ','
      this.compileExpression();
      count++;
    }

    return count;
  }
}
