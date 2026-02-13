import { CodeWriter } from "./code-writer";
import { filenames, segments, type Arithmetic, type Segment } from "./constant";
import { Parser } from "./parser";

const filename = process.argv[2];

if (!filename) {
  console.error("Filename is required");
  process.exit(1);
}

if (!filenames.includes(filename)) {
  console.error(`Invalid filename: ${filename}`);
  process.exit(1);
}

const isSegment = (arg: string): arg is Segment =>
  segments.includes(arg as Segment);

const getSegment = (arg: string): Segment => {
  if (isSegment(arg)) return arg;

  throw new Error(`Invalid segment: ${arg}`);
};

const isArithmetic = (arg: string): arg is Arithmetic =>
  arg.includes(arg as Arithmetic);

const getArithmetic = (arg: string): Arithmetic => {
  if (isArithmetic(arg)) return arg;

  throw new Error(`Invalid arithmetic: ${arg}`);
};

const fileContent = await Bun.file(`${import.meta.dir}/vm/${filename}`);
const content = await fileContent.text();

const parser = new Parser({ content });
const codeWriter = new CodeWriter({
  filename: filename.replace(".vm", ""),
});

while (parser.hasMoreLines()) {
  const commandType = parser.commandType();

  switch (commandType) {
    case "C_ARITHMETIC": {
      codeWriter.writeArithmetic(getArithmetic(parser.arg1()));
      break;
    }
    case "C_PUSH":
    case "C_POP": {
      codeWriter.writePushPop({
        command: commandType,
        segment: getSegment(parser.arg1()),
        index: parser.arg2(),
      });
      break;
    }
    default: {
      throw new Error(`Invalid command type: ${commandType}`);
    }
  }

  parser.advance();
}

codeWriter.close();
