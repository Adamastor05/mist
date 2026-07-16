import {
  Column,
  Database as IDatabase,
  SchemaTable,
} from "../types";
import { WhereCommand } from "./where.command";

export class SelectCommand extends WhereCommand {
  private database: IDatabase;
  private tempKeys: string[];
  private tempColumns: string[];
  private tempData: any[];
  private tempSchemaTable: SchemaTable | null;
  private tempLimit: number

  constructor(database: IDatabase, columns?: Record<string, Column>) {
    super()
    this.database = database;
    this.tempKeys = [];
    this.tempColumns = [];
    this.tempData = [];
    this.tempSchemaTable = null;
    this.tempLimit = Infinity

    if (columns) {
      this.tempKeys = Object.keys(columns);

      for (const column of Object.values(columns)) {
        this.tempColumns.push(column.config.keySchema);
      }
    }
  }

  from(schemaTable: SchemaTable): SelectCommand {
    if (!schemaTable)
      throw new Error("Erro: O schema da table não foi especificado no 'from'");

    this.tempSchemaTable = schemaTable;

    return this;
  }

  limit(limit: number): SelectCommand {
    if(!limit) throw new Error("Erro: Nenhum valor foi passado no 'limit'")
    if (limit < 0) throw new Error("Erro: O valor do 'limit' não pode ser negativo");

    this.tempLimit = limit

    return this 
  }

  execute<TModel = any>(): TModel[] {
    if (!this.tempSchemaTable) throw new Error("[Mist] Erro interno: O tempSchemaTable não existe ou é null");

    let result: TModel[] = []

    const tableName = this.tempSchemaTable.__nameTable;
    const table = this.database.tables[tableName];

    // Verifica se a tabela existe no banco
    if (!table) throw new Error(`Erro: Tabela ${tableName} não existe`);

    // Envia uma copia de todas as linhas da tabela se nenhuma coluna tiver sido especificada
    if (this.tempColumns.length === 0) {
      for (const line of table.data) {
        // Se existir um WHERE e a linha NÃO bater com a condição, pula para a próxima imediatamente
        if (
          this.tempWhereCondition &&
          !this.evalCondition(line, this.tempWhereCondition)
        ) {
          continue;
        }

        this.tempData.push({ ...line });
      }

      // Aplica o limite. Caso o limite seja infinito, envia todos os dados
      result = this.tempData.slice(0, this.tempLimit);

      return result as TModel[];
    }


    // Monta as novas linhas
    for (const line of table.data) {
      
      // Se o limite for igual a zero, retorna os valores
      if (this.tempLimit === 0) {
        break
      }

      // Se existir um WHERE e a linha NÃO bater com a condição, pula para a próxima imediatamente
      if (
        this.tempWhereCondition &&
        !this.evalCondition(line, this.tempWhereCondition)
      ) {
        continue;
      }

      const newLine: Record<string, any> = {};

      for (let i = 0; i < this.tempColumns.length; i++) {
        const key = this.tempKeys[i];
        const tempColumn = this.tempColumns[i];

        if (key !== undefined && tempColumn !== undefined) {
          newLine[key] = line[tempColumn];
        }
      }

      this.tempData.push({ ...newLine }); // envia uma copia da linha

      this.tempLimit-- // Diminou o limit em 1. Caso ele seja Infinity, continua Infinity
    }

    result = this.tempData;

    return result as TModel[]
  }
}
