import { Column, SchemaTable, Database } from "../types"
import { integer, text } from "./column"

export function createTable(
  nameTable: string, 
  columns: { [key: string]: Column }
): SchemaTable {
  const table: SchemaTable = {
    __nameTable: nameTable,
    __nameColumns: Object.keys(columns)
  }

  for (let column in columns) {
    if (columns[column]) {
      columns[column].config.keySchema = column
    }
    
    table[column] = columns[column]
  }

  return table
}
