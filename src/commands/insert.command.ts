import { Database as IDatabase, SchemaTable } from "../types";
import { WhereCommand } from "./where.command";
import { assertConstraints } from "../validation/constraints";

export class InsertCommand extends WhereCommand {
  private database: IDatabase;
  private tempSchemaTable: SchemaTable | null;
  private tempValuesToInsert: Record<string, any>

  constructor(database: IDatabase, tempSchemaTable: SchemaTable) {
    super()
    this.database = database;
    this.tempSchemaTable = tempSchemaTable;
    this.tempValuesToInsert = {}
  }

  

  values(values: Record<string, any>): InsertCommand {
    if (!values) throw new Error("Erro: Nenhum valor foi passado no 'values'");
    if (!this.tempSchemaTable) throw new Error("[Mist] Erro interno: O tempSchemaTable não existe ou é null");

    // verifica se as chaves de values exitem na tabela
    for (const key in values) {
      if (!this.tempSchemaTable.__nameColumns.includes(key)) {
        throw new Error(`ERRO: A coluna ${key} não existe no tabela`)
      }
    }

    assertConstraints(
      values,
      this.tempSchemaTable,
      this.database,
      "INSERT"
    )

    this.tempValuesToInsert = values
    return this
  }

  execute<TModel = any>() {
    let result: TModel[] = []

    if (!this.tempSchemaTable) throw new Error("[Mist] Erro interno: O tempSchemaTable não existe ou é null");
    if (!this.tempValuesToInsert) throw new Error("[Mist] Erro interno: O tempValuesToInsert não existe");

    const tableName = this.tempSchemaTable.__nameTable
    const table = this.database.tables[tableName]

    if (!table) throw new Error(`[Mist] Erro interno: A tabela ${tableName} não foi encontrada no banco`);

    const newLine: Record<string, any> = {}

    for (const nameColumn of table.config.__nameColumns) {
      const value = this.tempValuesToInsert[nameColumn]

      newLine[nameColumn] = value ?? null // Se uma coluna que não é obrigatória não receber nenhum valor, colocamos null
    }

    table.data.push({ ...newLine })
    
    return result
  }
}
