import { Column, Condition } from "../types";

// OPERADORES BINÁRIOS

// Igual a (valor)
export function eq(column: Column, value: any): Condition {
  return {
    type: "binary",
    columnName: column.config.keySchema,
    operator: "eq",
    value: value,
  };
}

// Não é igual a (valor)
export function ne(column: Column, value: any): Condition {
  return {
    type: "binary",
    columnName: column.config.keySchema,
    operator: "ne",
    value: value,
  };
}

// Maior que (valor)
export function gt(column: Column, value: any): Condition {
  return {
    type: "binary",
    columnName: column.config.keySchema,
    operator: "gt",
    value: value,
  };
}

// Maior ou igual a (valor)
export function gte(column: Column, value: any): Condition {
  return {
    type: "binary",
    columnName: column.config.keySchema,
    operator: "gte",
    value: value,
  };
}

// Menor que (valor)
export function lt(column: Column, value: any): Condition {
  return {
    type: "binary",
    columnName: column.config.keySchema,
    operator: "lt",
    value: value,
  };
}

// Menos ou igual a (valor)
export function lte(column: Column, value: any): Condition {
  return {
    type: "binary",
    columnName: column.config.keySchema,
    operator: "lte",
    value: value,
  };
}

// OPERADORES LÓGICOS

export function and(...conditions: Condition[]): Condition {
  return {
    type: "logical",
    operator: "and",
    conditions,
  }
}

export function or(...conditions: Condition[]): Condition {
  return {
    type: "logical",
    operator: "or",
    conditions,
  }
}

export function not(condition: Condition): Condition {
  return {
    type: "logical",
    operator: "not",
    condition,
  }
}