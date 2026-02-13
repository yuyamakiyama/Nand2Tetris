export const filenames = [
  "BasicTest.vm",
  "PointerTest.vm",
  "SimpleAdd.vm",
  "StackTest.vm",
  "StaticTest.vm",
];

export const segments = [
  "constant",
  "local",
  "argument",
  "this",
  "that",
  "temp",
  "pointer",
  "static",
] as const;

export const segmentMap = {
  local: "LCL",
  argument: "ARG",
  this: "THIS",
  that: "THAT",
} as const;

export type Segment = (typeof segments)[number];

export const arithmetic = [
  "add",
  "sub",
  "neg",
  "eq",
  "gt",
  "lt",
  "and",
  "or",
  "not",
] as const;

export const jumpInstructionMap = {
  eq: "JEQ",
  gt: "JGT",
  lt: "JLT",
} as const;

export const arithmeticInstructionMap = {
  add: "D+M",
  sub: "M-D",
  and: "D&M",
  or: "D|M",
} as const;

export type Arithmetic = (typeof arithmetic)[number];
