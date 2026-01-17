import { compMap, destMap, filenames, jumpMap } from "./constant";
import { Parser } from "./parser";
import { SymbolTable } from "./symbol-table";

const filename = process.argv[2];

if (!filename) {
  console.error("Filename is required");
  process.exit(1);
}

if (!filenames.includes(filename)) {
  console.error(`Invalid filename: ${filename}`);
  process.exit(1);
}

const fileContent = await Bun.file(`${import.meta.dir}/asm/${filename}`);
const content = await fileContent.text();

const parser = new Parser({ content });
const symbolTable = new SymbolTable();

let symbolCount = 0;

while (parser.hasMoreLines()) {
  const instructionType = parser.instructionType();

  if (instructionType === "L_INSTRUCTION") {
    symbolTable.addEntry({
      symbol: parser.symbol(),
      address: parser.lineNumber() - symbolCount,
    });
    symbolCount++;
  }

  parser.advance();
}

parser.reset();

const binary: string[] = [];

while (parser.hasMoreLines()) {
  switch (parser.instructionType()) {
    case "A_INSTRUCTION": {
      const symbol = parser.symbol();

      if (Number.isFinite(Number(symbol))) {
        binary.push(`0${Number(symbol).toString(2).padStart(15, "0")}`);
        break;
      }

      if (!symbolTable.contains({ symbol })) {
        symbolTable.addEntry({ symbol });
      }
      const address = symbolTable.getAddress({ symbol });

      binary.push(`0${address.toString(2).padStart(15, "0")}`);
      break;
    }
    case "C_INSTRUCTION": {
      const dest = parser.dest();
      const comp = parser.comp();
      const jump = parser.jump();

      binary.push(`111${compMap[comp]}${destMap[dest]}${jumpMap[jump]}`);
      break;
    }
  }
  parser.advance();
}

await Bun.write(
  `${import.meta.dir}/hack/${filename.replace(".asm", ".hack")}`,
  binary.join("\n"),
);
