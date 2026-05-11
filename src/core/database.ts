import { Database as IDatabase, SchemaTable } from "../types"

export function createDatabase(schemasTables: { [key: string]: SchemaTable }): IDatabase {
  const database: IDatabase = {
    tables: {}
  }

  for (let schemaTable of Object.values(schemasTables)) {
    database.tables[schemaTable.__nameTable] = {
      config: schemaTable,
      data: []
    }
  }

  return database
}
