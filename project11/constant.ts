export const fileOrFolderNames = [
  "Average",
  "ComplexArrays",
  "ConvertToBin",
  "Pong",
  "Seven",
  "Square",
];

export const keywords = [
  "class",
  "constructor",
  "function",
  "method",
  "field",
  "static",
  "var",
  "int",
  "char",
  "boolean",
  "void",
  "true",
  "false",
  "null",
  "this",
  "let",
  "do",
  "if",
  "else",
  "while",
  "return",
] as const;

export type Keyword = (typeof keywords)[number];

export const symbols = [
  "{",
  "}",
  "(",
  ")",
  "[",
  "]",
  ".",
  ",",
  ";",
  "+",
  "-",
  "*",
  "/",
  "&",
  "|",
  "<",
  ">",
  "=",
  "~",
] as const;

export type SymbolType = (typeof symbols)[number];

export type TokenType =
  | "KEYWORD"
  | "SYMBOL"
  | "IDENTIFIER"
  | "INT_CONST"
  | "STRING_CONST";

export type Kind = "STATIC" | "FIELD" | "ARG" | "VAR";

export type Segment =
  | "CONSTANT"
  | "ARGUMENT"
  | "LOCAL"
  | "STATIC"
  | "THIS"
  | "THAT"
  | "POINTER"
  | "TEMP";

export const segmentMap: Record<Segment, string> = {
  CONSTANT: "constant",
  ARGUMENT: "argument",
  LOCAL: "local",
  STATIC: "static",
  THIS: "this",
  THAT: "that",
  POINTER: "pointer",
  TEMP: "temp",
};

export type Arithmetic =
  | "ADD"
  | "SUB"
  | "NEG"
  | "EQ"
  | "GT"
  | "LT"
  | "AND"
  | "OR"
  | "NOT";

export const defaultIndexMap = {
  STATIC: 0,
  FIELD: 0,
  ARG: 0,
  VAR: 0,
};
