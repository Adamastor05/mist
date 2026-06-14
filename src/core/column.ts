import { ConfigColumn, ColumnType } from "../types";

class Column {
  config: ConfigColumn;

  constructor (name: string, columnType: ColumnType) {
    this.config = {
      name: name,
      columnType: columnType,
      notNull: false,
      unique: false,
      primaryKey: false,
      keySchema: ""
    }
  }
  
  primaryKey() {
    this.config.primaryKey = true
    this.config.unique = true
    this.config.notNull = true
    return this
  }

  notNull() {
    this.config.notNull = true
    return this
  }

  unique() {
    this.config.unique = true
    return this
  }
}

export const integer = (name: string) => new Column(name, "integer")
export const text = (name: string) => new Column(name, "text")
export const boolean = (name: string) => new Column(name, "boolean")
export const decimal = (name: string) => new Column(name, "decimal")
export const date = (name: string) => new Column(name, "date")


export function mistDate(value?: Date | string): string {
  // Cenário 1: Usuário chamou apenas mistDate() -> gera a data atual
  if (!value) {
    return new Date().toISOString();
  }

  // Cenário 2: Usuário passou um objeto Date nativo -> converte para ISO
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      throw new Error("[Mist] O objeto Date fornecido para mistDate é inválido.");
    }
    return value.toISOString();
  }

  // Cenário 3: Usuário passou uma string -> valida se é uma data ISO válida antes de aceitar
  if (typeof value === "string") {
    if (isNaN(Date.parse(value))) {
      throw new Error(`[Mist] A string fornecida para mistDate não é uma data válida: ${value}`);
    }
    return value; // Já está no formato correto
  }

  throw new Error("[Mist] Tipo inválido passado para mistDate. Use Date ou string ISO.");
}