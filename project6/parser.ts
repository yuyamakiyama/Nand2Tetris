type InstructionType = "A_INSTRUCTION" | "C_INSTRUCTION" | "L_INSTRUCTION";

export class Parser {
  private lines: string[];
  private currentLine: number = 0;

  constructor({ content }: { content: string }) {
    this.lines = content
      .split("\n")
      .map((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine === "" || trimmedLine.startsWith("//")) return;
        return trimmedLine;
      })
      .filter((line): line is string => line !== undefined);
  }

  private getInstruction(): string {
    const instruction = this.lines[this.currentLine];
    if (!instruction) throw new Error("No instruction found");
    return instruction;
  }

  hasMoreLines(): boolean {
    return this.currentLine < this.lines.length;
  }

  advance(): void {
    this.currentLine++;
  }

  lineNumber(): number {
    return this.currentLine;
  }

  reset(): void {
    this.currentLine = 0;
  }

  instructionType(): InstructionType {
    const instruction = this.getInstruction();
    if (!instruction) throw new Error("No instruction found");
    if (instruction.startsWith("@")) return "A_INSTRUCTION";
    if (instruction.startsWith("(")) return "L_INSTRUCTION";
    if (/^[DMA0]/.test(instruction)) {
      return "C_INSTRUCTION";
    }
    throw new Error(`Invalid instruction: ${instruction}`);
  }

  symbol(): string {
    const instruction = this.getInstruction();
    switch (this.instructionType()) {
      case "A_INSTRUCTION":
        return instruction.replace(/^@(.+)$/, "$1");
      case "L_INSTRUCTION":
        return instruction.replace(/^\((.+)\)$/, "$1");
      default:
        throw new Error(`Invalid instruction: ${instruction}`);
    }
  }

  dest(): string {
    const instruction = this.getInstruction();
    if (this.instructionType() !== "C_INSTRUCTION") {
      throw new Error(`Invalid instructionType: ${this.instructionType()}`);
    }
    // Extract dest part before = (e.g., "M=D+1" => "M")
    const match = instruction.match(/^([^=;]+)=/);
    return match ? (match[1] ?? "") : "";
  }

  comp(): string {
    const instruction = this.getInstruction();
    if (this.instructionType() !== "C_INSTRUCTION") {
      throw new Error(`Invalid instructionType: ${this.instructionType()}`);
    }
    // Extract comp part: between = and ;, or everything if no = or ;
    // Examples: "M=D+1;JGT" => "D+1", "0;JMP" => "0", "D" => "D"
    const match = instruction.match(/(?:^|=)([^;=]+)(?:;|$)/);
    return match ? (match[1] ?? "") : "";
  }

  jump(): string {
    const instruction = this.getInstruction();
    if (this.instructionType() !== "C_INSTRUCTION") {
      throw new Error(`Invalid instructionType: ${this.instructionType()}`);
    }
    // Extract jump part after ; (e.g., "D=M;JGT" => "JGT")
    const match = instruction.match(/;(.+)$/);
    return match ? (match[1] ?? "") : "";
  }
}
