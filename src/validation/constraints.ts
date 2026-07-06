import { Column, SchemaTable, Database as IDatabase } from "../types";
import { checkColumnType } from "./types.validaor";

export function checkUnique(
    key: string, 
    value: any, 
    columnIndexes: Set<any>
): void {
    
  const valueExistiInColumn = columnIndexes.has(value)
  
  if (valueExistiInColumn) {
    throw new Error(`Erro: duplicar valor da chave viola a restrição de unicidade, coluna: '${key}' já tem o valor: '${value}'`);
  }

  columnIndexes.add(value)
}


export function checkNotNull(
    values: Record<string, any>, 
    schemaTable: SchemaTable, 
    queryType: "INSERT" | "UPDATE" 
): void {

  if (!values) throw new Error("[Mist] Erro Interno: Objeto de valores ausente na validação.");

  for (const columnName of schemaTable.__nameColumns) {
    const column = schemaTable[columnName] as Column;
    
    if (column.config.notNull) {
      const value = values[columnName];

      if (queryType === "INSERT") {
        if (value === undefined || value === null) {
          throw new Error(`Erro: A coluna '${columnName}' é obrigatória e não pode ser nula.`);
        }
      }

      if (queryType === "UPDATE") {
        // Verifica se a coluna foi passada para set()
        const columnExistInValues = columnName in values

        if (columnExistInValues && (value === undefined || value === null)) {
          throw new Error(`Erro: A coluna '${columnName}' é obrigatória e não pode ser nula.`);
        }
      }
    }
  }
}


export function assertConstraints(
    values: Record<string, any>, 
    schemaTable: SchemaTable,
    database: IDatabase,
    queryType: "INSERT" | "UPDATE" 
): void {

  if (!values) throw new Error("[Mist] Erro Interno: Objeto de valores ausente na validação.");

  const tableName = schemaTable.__nameTable
  const table = database.tables[tableName]

  if (!table) throw new Error("[Mist] Erro Interno: Tabela não existe");

  // Verifica se as colunas com notNull estão sendo preechidas
  checkNotNull(values, schemaTable, queryType)

  // Um único loop para validar tipos e unicidade dos valores enviados
  for (const [key, value] of Object.entries(values)) {
    const schemaColumn = schemaTable[key as keyof typeof schemaTable]

    if (!schemaColumn || typeof schemaColumn !== "object" || !("config" in schemaColumn)) {
      throw new Error(`A coluna '${key}' não existe`)
    }
    
    const column = schemaColumn as Column
    const { config } = column

    // Valida o tipo do dado
    checkColumnType(key, value, config.columnType)

    // Valida a restrição de unicidade
    if (config.unique) {
      if (!table.indexes[key]) throw new Error(`[Mist] Erro Interno: A coluna '${key}' não possui indices.`);

      if (queryType === "INSERT") {
        checkUnique(key, value, table.indexes[key])
      }
    }
  }
}