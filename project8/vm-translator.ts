import { readdir } from "node:fs/promises";
import { CodeWriter } from "./code-writer";
import {
  fileOrFolderNames,
  segments,
  type Arithmetic,
  type Segment,
} from "./constant";
import { Parser } from "./parser";

const fileOrFolderName = process.argv[2];

if (!fileOrFolderName) {
  console.error("Filename is required");
  process.exit(1);
}

if (!fileOrFolderNames.includes(fileOrFolderName)) {
  console.error(`Invalid filename: ${fileOrFolderName}`);
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

const isFolder = !fileOrFolderName.endsWith(".vm");

const codeWriter = new CodeWriter({
  filename: fileOrFolderName.replace(".vm", ""),
});

const translateFile = (content: string) => {
  const parser = new Parser({ content });

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
      case "C_LABEL": {
        codeWriter.writeLabel(parser.arg1());
        break;
      }
      case "C_GOTO": {
        codeWriter.writeGoto(parser.arg1());
        break;
      }
      case "C_IF": {
        codeWriter.writeIf(parser.arg1());
        break;
      }
      case "C_FUNCTION": {
        codeWriter.writeFunction({
          functionName: parser.arg1(),
          nVars: parser.arg2(),
        });
        break;
      }
      case "C_CALL": {
        codeWriter.writeCall({
          functionName: parser.arg1(),
          nArgs: parser.arg2(),
        });
        break;
      }
      case "C_RETURN": {
        codeWriter.writeReturn();
        break;
      }
      default: {
        throw new Error(`Invalid command type: ${commandType}`);
      }
    }

    parser.advance();
  }
};

if (isFolder) {
  codeWriter.writeBootstrap();
  const folderPath = `${import.meta.dir}/vm/${fileOrFolderName}`;
  const files = await readdir(folderPath);
  const vmFiles = files.filter((f) => f.endsWith(".vm"));

  for (const vmFile of vmFiles) {
    codeWriter.setFileName(vmFile.replace(".vm", ""));
    const content = await Bun.file(`${folderPath}/${vmFile}`).text();
    translateFile(content);
  }
} else {
  const content = await Bun.file(`${import.meta.dir}/vm/${fileOrFolderName}`).text();
  translateFile(content);
}

codeWriter.close();
