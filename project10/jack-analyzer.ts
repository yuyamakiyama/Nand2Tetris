import { readdir } from "node:fs/promises";
import { CompilationEngine } from "./compilation-engine";
import { fileOrFolderNames } from "./constant";
import { JackTokenizer } from "./jack-tokenizer";

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

const analyzeFile = (content: string) => {
  const tokenizer = new JackTokenizer({ content });
  const engine = new CompilationEngine({ tokenizer });

  engine.compileClass();

  return engine.getXMLTemplate();
};

if (isFolder) {
  const folderPath = `${import.meta.dir}/jack/${fileOrFolderName}`;
  const files = await readdir(folderPath);
  const jackFiles = files.filter((f) => f.endsWith(".jack"));

  for (const jackFile of jackFiles) {
    const content = await Bun.file(`${folderPath}/${jackFile}`).text();
    const xmlTemplate = analyzeFile(content);

    Bun.write(
      `${import.meta.dir}/xml/${fileOrFolderName}/${jackFile.replace(".jack", ".xml")}`,
      xmlTemplate,
    );
  }
} else {
  const content = await Bun.file(
    `${import.meta.dir}/jack/${fileOrFolderName}`,
  ).text();

  const xmlTemplate = analyzeFile(content);
  Bun.write(
    `${import.meta.dir}/xml/${fileOrFolderName.replace(".jack", ".xml")}`,
    xmlTemplate,
  );
}
