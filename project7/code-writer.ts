import {
  arithmeticInstructionMap,
  jumpInstructionMap,
  segmentMap,
  type Arithmetic,
  type Segment,
} from "./constant";

export class CodeWriter {
  private filename: string;
  private buffer: string[] = [];
  private arithmeticCounter: number = 0;

  constructor({ filename }: { filename: string }) {
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
    this.buffer.push(`// push ${segment} ${index}`);

    const appendValueToStack = ["@SP", "A=M", "M=D", "@SP", "M=M+1"];

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

    this.buffer.push(...getSegmentValue(), ...appendValueToStack);
  }

  private writePop({
    segment,
    index,
  }: {
    segment: Segment;
    index: number;
  }): void {
    this.buffer.push(`// pop ${segment} ${index}`);

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
      this.writePush({ segment, index });
      return;
    }

    this.writePop({ segment, index });
  }

  close(): void {
    Bun.write(
      `${import.meta.dir}/asm/${this.filename}.asm`,
      this.buffer.join("\n"),
    );
  }
}
