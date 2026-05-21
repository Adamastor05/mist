import { Column, SchemaTable } from "../types"

export function createTable<TColumn extends Record<string, Column>>(
  nameTable: string,
  columns: TColumn
): SchemaTable<TColumn> {

  const table: SchemaTable<TColumn> = {
    __nameTable: nameTable,
    __nameColumns: Object.keys(columns),
    ...columns
  }

  const primaryKeyColumns = Object.values(columns).filter(
    (column) => column.config.primaryKey === true
  )
  // verifica se a tabela tem mais de uma coluna primaryKey
  if (primaryKeyColumns.length > 1) {
    throw new Error(`ERRO: não são permitidas múltiplas chaves primárias na tabela '${nameTable}'.`)
  }

  for (let column in columns) {
    if (!columns[column]) throw new Error(`[Mist] Erro Interno: A coluna não existe.`);
    columns[column].config.keySchema = column
  }

  return table
}