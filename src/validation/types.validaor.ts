import { ColumnType } from "../types";

export function checkColumnType(key: string, value: any, columnType: ColumnType): void {
    switch (columnType) {
      case "integer":
        if (typeof value !== "number" || !Number.isInteger(value)) {
          throw new Error(`Erro de tipo: A coluna '${key}' espera um integer, mas recebeu ${typeof value}`);
        }
        break

      case "text":
        if (typeof value !== "string") {
          throw new Error(`Erro de tipo: A coluna '${key}' espera um text, mas recebeu ${typeof value}`);
        }
        break

      case "boolean":
        if (typeof value !== "boolean") {
          throw new Error(`Erro de tipo: A coluna '${key}' espera um boolean, mas recebeu ${typeof value}`);
        }
        break

      case "decimal":
        // Se o valor não for "number" ou se ele for um inteiro, retorna erro
        if (typeof value !== "number" || Number.isInteger(value)) {
          throw new Error(`Erro de tipo: A coluna '${key}' espera um decimal, mas recebeu ${typeof value !== "number" ? typeof value : "integer"}`);
        }
        break

      case "date":
        if (typeof value !== "string" || isNaN(Date.parse(value))) {
          throw new Error(`Erro de tipo: A coluna '${key}' espera um date valido, mas recebeu ${typeof value}`);
        }
      break
    }
  }