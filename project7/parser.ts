export type CommandType =
  | "C_ARITHMETIC"
  | "C_PUSH"
  | "C_POP"
  | "C_LABEL"
  | "C_GOTO"
  | "C_IF"
  | "C_FUNCTION"
  | "C_RETURN"
  | "C_CALL";

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

  private getCommand(): string {
    const command = this.lines[this.currentLine];
    if (!command) throw new Error("No command found");
    return command;
  }

  hasMoreLines(): boolean {
    return this.currentLine < this.lines.length;
  }

  advance(): void {
    this.currentLine++;
  }

  commandType(): CommandType {
    const command = this.getCommand();

    if (command.startsWith("push")) return "C_PUSH";
    if (command.startsWith("pop")) return "C_POP";
    if (command.startsWith("label")) return "C_LABEL";
    if (command.startsWith("goto")) return "C_GOTO";
    if (command.startsWith("if-goto")) return "C_IF";
    if (command.startsWith("function")) return "C_FUNCTION";
    if (command.startsWith("return")) return "C_RETURN";
    return "C_ARITHMETIC";
  }

  arg1(): string {
    const command = this.getCommand();
    const commandType = this.commandType();

    if (commandType === "C_RETURN") {
      throw new Error("Cannot get arg1 for return command");
    }

    if (commandType === "C_ARITHMETIC") {
      return command;
    }

    const arg1 = command.split(" ")[1];
    if (!arg1) throw new Error("Invalid command");

    return arg1;
  }

  arg2(): number {
    const command = this.getCommand();
    const commandType = this.commandType();

    if (!["C_PUSH", "C_POP", "C_FUNCTION", "C_CALL"].includes(commandType)) {
      throw new Error(`Cannot get arg2 for ${commandType} command`);
    }

    const arg2 = command.split(" ")[2];
    if (!arg2) throw new Error("Invalid command");

    return parseInt(arg2);
  }
}
