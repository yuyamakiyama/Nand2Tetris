import { segmentMap, type Arithmetic, type Segment } from "./constant";

export class VMWriter {
  private outputFilePath: string;
  private outputBuffer: string[] = [];
  constructor({ outputFilePath }: { outputFilePath: string }) {
    this.outputFilePath = outputFilePath;
  }

  writePush({ segment, index }: { segment: Segment; index: number }) {
    this.outputBuffer.push(`push ${segmentMap[segment]} ${index}`);
  }

  writePop({ segment, index }: { segment: Segment; index: number }) {
    if (segment === "CONSTANT") throw new Error("Invalid segment");
    this.outputBuffer.push(`pop ${segmentMap[segment]} ${index}`);
  }

  writeArithmetic({ command }: { command: Arithmetic }) {
    this.outputBuffer.push(command.toLowerCase());
  }

  writeLabel({ label }: { label: string }) {
    this.outputBuffer.push(`label ${label}`);
  }

  writeGoto({ label }: { label: string }) {
    this.outputBuffer.push(`goto ${label}`);
  }

  writeIf({ label }: { label: string }) {
    this.outputBuffer.push(`if-goto ${label}`);
  }

  writeCall({ name, nArgs }: { name: string; nArgs: number }) {
    this.outputBuffer.push(`call ${name} ${nArgs}`);
  }

  writeFunction({ name, nVars }: { name: string; nVars: number }) {
    this.outputBuffer.push(`function ${name} ${nVars}`);
  }

  writeReturn() {
    this.outputBuffer.push("return");
  }

  close() {
    Bun.write(this.outputFilePath, this.outputBuffer.join("\n"));
  }
}
