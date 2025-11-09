import { readdir } from "node:fs/promises";

const files = await readdir(`${import.meta.dir}/../asm`);

const destMap: Record<string, string> = {
  "": "000",
  M: "001",
  D: "010",
  DM: "011",
  MD: "011",
  A: "100",
  AM: "101",
  MA: "101",
  AD: "110",
  DA: "110",
  ADM: "111",
};

const jumpMap: Record<string, string> = {
  "": "000",
  JGT: "001",
  JEQ: "010",
  JGE: "011",
  JLT: "100",
  JNE: "101",
  JLE: "110",
  JMP: "111",
};

const compMap: Record<string, string> = {
  "0": "0101010",
  "1": "0111111",
  "-1": "0111010",
  D: "0001100",
  A: "0110000",
  M: "1110000",
  "!D": "0001101",
  "!A": "0110001",
  "!M": "1110001",
  "-D": "0001111",
  "-A": "0110011",
  "-M": "1110011",
  "D+1": "0011111",
  "A+1": "0110111",
  "M+1": "1110111",
  "D-1": "0001110",
  "A-1": "0110010",
  "M-1": "1110010",
  "D+A": "0000010",
  "D+M": "1000010",
  "D-A": "0010011",
  "D-M": "1010011",
  "A-D": "0000111",
  "M-D": "1000111",
  "D&A": "0000000",
  "D&M": "1000000",
  "D|A": "0010101",
  "D|M": "1010101",
};

for (const file of files) {
  const symbols: Record<string, string> = {
    R0: "0",
    R1: "1",
    R2: "2",
    R3: "3",
    R4: "4",
    R5: "5",
    R6: "6",
    R7: "7",
    R8: "8",
    R9: "9",
    R10: "10",
    R11: "11",
    R12: "12",
    R13: "13",
    R14: "14",
    R15: "15",
    SP: "0",
    LCL: "1",
    ARG: "2",
    THIS: "3",
    THAT: "4",
    SCREEN: "16384",
    KBD: "24576",
  };

  const fileContent = await Bun.file(`${import.meta.dir}/../asm/${file}`);
  const content = await fileContent.text();
  console.log(`------------${file}------------`);

  let lineNumber = 0;
  const trimmedContent = content
    .split("\n")
    .map((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine === "" || trimmedLine.startsWith("//")) return;
      return trimmedLine;
    })
    .filter((line) => line !== undefined)
    .map((line) => {
      if (line.startsWith("(")) {
        const value = line.slice(1, -1);
        symbols[value] = lineNumber.toString();
        return;
      }
      lineNumber++;
      return line;
    })
    .filter((line) => line !== undefined);

  let memory = 16;
  trimmedContent.forEach((line) => {
    const firstChar = line.at(0);

    if (firstChar !== "@") return;

    const value = line.slice(1);
    if (!Number.isNaN(Number(value))) {
      return;
    }

    if (Object.keys(symbols).includes(value)) {
      return;
    }

    symbols[value] = memory.toString();
    memory++;
  });

  // console.log(symbols);

  const binary = trimmedContent
    .map((line) => {
      const firstChar = line.at(0);

      // A instruction
      if (firstChar === "@") {
        const value = Number.isNaN(Number(line.slice(1)))
          ? Number(symbols[line.slice(1)])
          : Number(line.slice(1));
        const binaryString: string = value.toString(2);

        if (binaryString.length > 16) {
          console.log("line: ", line);
          console.log("value: ", value);
          console.log("binaryString: ", binaryString);
        }

        return `0${binaryString.padStart(15, "0")}`;
      }

      // Symbol
      if (firstChar === "(") {
        return line;
      }

      // C instruction
      let dest: string = "";
      let comp: string = "";
      let jump: string = "";
      const a = line.split("=");
      if (a.length === 2) {
        dest = a[0] ?? "";
        comp = a[1] ?? "";
      }
      const b = line.split(";");
      if (b.length === 2) {
        comp = b[0] ?? "";
        jump = b[1] ?? "";
      }

      return `111${compMap[comp]}${destMap[dest]}${jumpMap[jump]}`;
    })
    .join("\n");
  console.log(binary);

  await Bun.write(
    `${import.meta.dir}/../${file.replace(".asm", ".hack")}`,
    binary
  );
}
