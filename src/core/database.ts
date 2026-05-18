import { Column, Database as IDatabase, SchemaTable } from "../types"

export function createDatabase(schemasTables: { [key: string]: SchemaTable }): IDatabase {
  const database: IDatabase = {
    tables: {}
  }

  for (const schemaTable of Object.values(schemasTables)) {
    const indexes: Record<string, Set<any>> = {}

    for (const key of schemaTable.__nameColumns) {
      
      const column = schemaTable[key] as Column | undefined

      if (!column) throw new Error("[Mist] Erro Interno: column não existe");

      const { config } = column

      if (config.primaryKey || config.unique) {
        indexes[key] = new Set()
      }
    }
    database.tables[schemaTable.__nameTable] = {
      config: schemaTable,
      data: [],
      indexes: indexes
    }
  }

  return database
}
