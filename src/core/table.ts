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

  for (let column in columns) {
    if (columns[column]) {
      columns[column].config.keySchema = column
    }
  }

  return table
}