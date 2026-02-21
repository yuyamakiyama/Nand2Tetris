import {
  arithmeticInstructionMap,
  jumpInstructionMap,
  segmentMap,
  type Arithmetic,
  type Segment,
} from "./constant";

export class CodeWriter {
  private outputName: string;
  private filename: string;
  private buffer: string[] = [];
  private arithmeticCounter: number = 0;
  private returnCounter = 0;

  constructor({ filename }: { filename: string }) {
    this.outputName = filename;
    this.filename = filename;
  }

  writeBootstrap(): void {
    this.buffer.push("// bootstrap", "@256", "D=A", "@SP", "M=D");
    this.writeCall({ functionName: "Sys.init", nArgs: 0 });
  }

  setFileName(filename: string): void {
    this.filename = filename;
  }

  writeArithmetic(arithmetic: Arithmetic): void {
    switch (arithmetic) {
      case "add":
      case "sub":
      case "and":
      case "or": {
        const arithmeticInstruction = arithmeticInstructionMap[arithmetic];
        this.buffer.push(
          `// ${arithmetic}`,
          "@SP",
          "M=M-1",
          "A=M",
          "D=M",
          "A=A-1",
          `M=${arithmeticInstruction}`,
        );
        return;
      }
      case "not":
      case "neg": {
        this.buffer.push(
          `// ${arithmetic}`,
          "@SP",
          "A=M-1",
          arithmetic === "neg" ? "M=-M" : "M=!M",
        );
        return;
      }
      case "gt":
      case "lt":
      case "eq": {
        const jumpInstruction = jumpInstructionMap[arithmetic];
        const counter = this.arithmeticCounter;

        this.buffer.push(
          `// ${arithmetic}`,
          "@SP",
          "M=M-1",
          "A=M",
          "D=M",
          "A=A-1",
          "D=M-D",
          `@${jumpInstruction}.TRUE.${counter}`,
          `D;${jumpInstruction}`,
          "@SP",
          "A=M-1",
          "M=0",
          `@${jumpInstruction}.END.${counter}`,
          "0;JMP",
          `(${jumpInstruction}.TRUE.${counter})`,
          "@SP",
          "A=M-1",
          "M=-1",
          `(${jumpInstruction}.END.${counter})`,
        );
        this.arithmeticCounter++;
        return;
      }
    }
  }

  private writePush({
    segment,
    index,
  }: {
    segment: Segment;
    index: number;
  }): void {
    const getSegmentValue = (): string[] => {
      switch (segment) {
        case "constant": {
          return [`@${index}`, "D=A"];
        }
        case "temp": {
          return [`@${index + 5}`, "D=M"];
        }
        case "local":
        case "argument":
        case "this":
        case "that": {
          return [
            `@${index}`,
            "D=A",
            `@${segmentMap[segment]}`,
            "D=D+M",
            "A=D",
            "D=M",
          ];
        }
        case "pointer": {
          return [`@${index === 0 ? "THIS" : "THAT"}`, "D=M"];
        }
        case "static": {
          return [`@${this.filename}.${index}`, "D=M"];
        }
        default: {
          throw new Error(`Invalid segment: ${segment}`);
        }
      }
    };

    const appendValueToStack = ["@SP", "A=M", "M=D", "@SP", "M=M+1"];

    this.buffer.push(...getSegmentValue(), ...appendValueToStack);
  }

  private writePop({
    segment,
    index,
  }: {
    segment: Segment;
    index: number;
  }): void {
    const popValueFromStack = ["@SP", "M=M-1", "A=M", "D=M"];

    const setSegmentValue = (): string[] => {
      switch (segment) {
        case "temp": {
          return [`@${index + 5}`, "M=D"];
        }
        case "local":
        case "argument":
        case "this":
        case "that": {
          return [
            `@${segmentMap[segment]}`,
            "A=M",
            ...Array(index).fill("A=A+1"),
            "M=D",
          ];
        }
        case "pointer": {
          return [`@${index === 0 ? "THIS" : "THAT"}`, "M=D"];
        }
        case "static": {
          return [`@${this.filename}.${index}`, "M=D"];
        }
        default: {
          throw new Error(`Invalid segment: ${segment}`);
        }
      }
    };

    this.buffer.push(...popValueFromStack, ...setSegmentValue());
  }

  writePushPop({
    command,
    segment,
    index,
  }: {
    command: "C_PUSH" | "C_POP";
    segment: Segment;
    index: number;
  }): void {
    if (command === "C_PUSH") {
      this.buffer.push(`// push ${segment} ${index}`);
      this.writePush({ segment, index });
      return;
    }

    this.buffer.push(`// pop ${segment} ${index}`);
    this.writePop({ segment, index });
  }

  writeLabel(label: string): void {
    this.buffer.push(`// label ${label}`, `(${label})`);
  }

  writeGoto(label: string): void {
    this.buffer.push(`// goto ${label}`, `@${label}`, "0;JMP");
  }

  writeIf(label: string): void {
    this.buffer.push(
      `// if-goto ${label}`,
      "@SP",
      "M=M-1",
      "A=M",
      "D=M",
      `@${label}`,
      "D;JNE",
    );
  }

  writeFunction({
    functionName,
    nVars,
  }: {
    functionName: string;
    nVars: number;
  }): void {
    this.buffer.push(
      `// function ${functionName} ${nVars}`,
      `(${functionName})`,
    );

    Array.from({ length: nVars }).forEach(() => {
      this.writePush({ segment: "constant", index: 0 });
    });
  }

  writeCall({
    functionName,
    nArgs,
  }: {
    functionName: string;
    nArgs: number;
  }): void {
    this.buffer.push(
      `// call ${functionName} ${nArgs}`,

      // Return Address
      `@${functionName}$ret.${this.returnCounter}`,
      "D=A",
      "@SP",
      "A=M",
      "M=D",
      "@SP",
      "M=M+1",

      ...["LCL", "ARG", "THIS", "THAT"].flatMap((segment) => [
        `@${segment}`,
        "D=M",
        "@SP",
        "A=M",
        "M=D",
        "@SP",
        "M=M+1",
      ]),

      // Reposition ARG
      "@5",
      "D=A",
      `@${nArgs}`,
      "D=D+A",
      "@SP",
      "D=M-D",
      "@ARG",
      "M=D",

      // Reposition LCL
      "@SP",
      "D=M",
      "@LCL",
      "M=D",

      `@${functionName}`,
      "0;JMP",
      `(${functionName}$ret.${this.returnCounter})`,
    );

    this.returnCounter++;
  }

  writeReturn(): void {
    this.buffer.push(
      "// return",

      // endFrame (R13) = LCL
      "@LCL",
      "D=M",
      "@R13",
      "M=D",

      // retAddr (R14) = *(endFrame - 5)
      "@5",
      "A=D-A",
      "D=M",
      "@R14",
      "M=D",

      // *ARG = pop()
      "@SP",
      "M=M-1",
      "A=M",
      "D=M",
      "@ARG",
      "A=M",
      "M=D",

      "@ARG",
      "D=M+1",
      "@SP",
      "M=D",

      // THAT = *(endFrame - 1)
      "@R13",
      "AM=M-1",
      "D=M",
      "@THAT",
      "M=D",

      // THIS = *(endFrame - 2)
      "@R13",
      "AM=M-1",
      "D=M",
      "@THIS",
      "M=D",

      // ARG = *(endFrame - 3)
      "@R13",
      "AM=M-1",
      "D=M",
      "@ARG",
      "M=D",

      // LCL = *(endFrame - 4)
      "@R13",
      "AM=M-1",
      "D=M",
      "@LCL",
      "M=D",

      "@R14",
      "A=M",
      "0;JMP",
    );
  }

  close(): void {
    Bun.write(
      `${import.meta.dir}/asm/${this.outputName}.asm`,
      this.buffer.join("\n"),
    );
  }
}
