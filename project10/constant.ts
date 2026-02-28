export const fileOrFolderNames = [
  "ArrayTest.jack",
  "Square",
  "ExpressionLessSquare",
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
