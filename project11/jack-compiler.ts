import { readdir } from "node:fs/promises";
import { CompilationEngine } from "./compilation-engine";
import { fileOrFolderNames } from "./constant";

const fileOrFolderName = process.argv[2];

if (!fileOrFolderName) {
  console.error("Filename is required");
  process.exit(1);
}

if (!fileOrFolderNames.includes(fileOrFolderName)) {
  console.error(`Invalid filename: ${fileOrFolderName}`);
  process.exit(1);
}

const isFolder = !fileOrFolderName.endsWith(".jack");

const compileFile = async ({
  inputFilePath,
  outputFilePath,
}: {
  inputFilePath: string;
  outputFilePath: string;
}) => {
  const inputContent = await Bun.file(inputFilePath).text();
  const engine = new CompilationEngine({
    content: inputContent,
    outputFilePath,
  });

  engine.compileClass();
};

if (isFolder) {
  const folderPath = `${import.meta.dir}/jack/${fileOrFolderName}`;
  const files = await readdir(folderPath);
  const jackFiles = files.filter((f) => f.endsWith(".jack"));

  for (const jackFile of jackFiles) {
    compileFile({
      inputFilePath: `${folderPath}/${jackFile}`,
      outputFilePath: `${import.meta.dir}/xml/${fileOrFolderName}/${jackFile.replace(".jack", ".xml")}`,
    });
  }
} else {
  compileFile({
    inputFilePath: `${import.meta.dir}/jack/${fileOrFolderName}`,
    outputFilePath: `${import.meta.dir}/xml/${fileOrFolderName.replace(".jack", ".xml")}`,
  });
}
