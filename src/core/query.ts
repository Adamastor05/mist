import { Database as IDatabase, Column, SchemaTable } from "../types";

export class Query {
  private database: IDatabase;
  private queryType: "SELECT" | "INSERT" | ""; 
  private tempKeys: string[];
  private tempSchemaTable: SchemaTable | null;
  private tempColumns: string[];
  private tempData: any[];

  constructor(database: IDatabase) {
    this.database = database,
    this.queryType = "",
    this.tempKeys = [],
    this.tempSchemaTable = null;
    this.tempColumns = [],
    this.tempData = []
  }

  select(columns?: Record<string, Column>): Query {
    this.queryType = "SELECT"

    if (columns) {
      this.tempKeys = Object.keys(columns)

      for (const column of Object.values(columns)) {
        this.tempColumns.push(column.config.keySchema)
      }
    }

    return this
  }

  from(schemaTable: SchemaTable): Query {
    if (!schemaTable) throw new Error("O schema da table não foi especificado no 'from'");

    const tableName = schemaTable.__nameTable
    const table = this.database.tables[tableName]

    // Verifica se a tabela existe no banco
    if (!table) throw new Error(`Tabela ${tableName} não existe`);

    // Envia uma copia de todas as linhas da tabela se nenhuma coluna tiver sido especificada
    if (this.tempColumns.length === 0) {
      table.data.forEach(line => {
        this.tempData.push({ ...line })
      })

      return this
    }

    // Monta as novas linhas
    for (const line of table.data) {
      const newLine: Record<string, any> = {}

      for (let i = 0; i < this.tempColumns.length; i++) {
        const key = this.tempKeys[i]
        const tempColumn = this.tempColumns[i]
        
        if (key !== undefined && tempColumn !== undefined) {
          newLine[key] = line[tempColumn]
        }
      }

      this.tempData.push({ ...newLine }) // envia uma copia da linha
    }

    // reseta os valores
    this.tempKeys = []
    this.tempColumns = []

    return this
  }

  insert(schemaTable: SchemaTable): Query {
    if (!schemaTable) throw new Error("Nenhuma tabela foi especificada");

    // Verifica se a tabela existe no banco
    const tableName = schemaTable.__nameTable
    if (!this.database.tables[tableName]) throw new Error(`A tabela ${tableName} não existe no banco`);
    
    this.tempSchemaTable = schemaTable
    this.queryType = "INSERT"

    return this
  }

  values(values: Record<string, any>): Query {
    if (!values) throw new Error("Faltando os valores");
    if (!this.tempSchemaTable) throw new Error("[Erro interno]: O tempSchemaTable não existe ou é null");

    // verifica se as chaves de values exitem na tabela
    for (const key in values) {
      if (!this.tempSchemaTable.__nameColumns.includes(key)) {
        throw new Error(`A coluna ${key} não existe no tabela`)
      }
    }

    // Verifica se os tipos dos dados passados são os mesmos que foram definidos no schema
    this.checkDataType(values)

    const tableName = this.tempSchemaTable.__nameTable
    const table = this.database.tables[tableName]

    if (!table) throw new Error(`[Erro intero]: A tabela ${tableName} não foi encontrada no banco`)

    table.data.push({ ...values })

    return this
  }

  private checkDataType(values: Record<string, any>): void {
    if (!values) throw new Error("[Mist] Erro Interno: Objeto de valores ausente na validação.");
    if (!this.tempSchemaTable) throw new Error("[Mist] Erro Interno: O contexto da tabela (schemaTable) foi perdido.");

    for (const [key, value] of Object.entries(values)) {
      const schemaColumn = this.tempSchemaTable[key] as Column | undefined
      
      if (!schemaColumn) throw new Error(`A coluna '${key}' não existe na tabela '${this.tempSchemaTable.__nameTable}'`);
      
      const { dataType } = schemaColumn.config

      switch (dataType) {
        case "integer":
          if (typeof value !== "number" || !Number.isInteger(value)) {
            throw new Error(`Erro de tipo: A coluna '${key}' espera um integer, mas recebeu ${typeof value}`);
          }
          break

        case "text":
          if (typeof value !== "string") {
            throw new Error(`Erro de tipo: A coluna '${key}' espera um integer, mas recebeu ${typeof value}`);
          }
          break
      }
    }
  }

  execute() {
    let result: unknown; 

    if (this.queryType === "SELECT") {
      result = this.tempData

      this.tempData = []
      this.queryType = ""
    }

    if (this.queryType === "INSERT") {
      result = "Dados inseridos com sucesso!"

      this.queryType = ""
    }
    return result
  }
}