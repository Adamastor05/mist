import { InsertCommand } from "../commands/insert.command";
import { SelectCommand } from "../commands/select.command";
import { UpdateCommand } from "../commands/update.command";
import { Database as IDatabase, Column, SchemaTable, ColumnType, Condition } from "../types";

export class Query {
  private database: IDatabase;
  private queryType: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | ""; 
  private tempKeys: string[];
  private tempSchemaTable: SchemaTable | null;
  private tempColumns: string[];
  private tempValuesToInsert: Record<string, any>;
  private tempValuesToUpdate: Record<string, any>;
  private tempWhereCondition: Condition | null;
  private tempData: any[];

  constructor(database: IDatabase) {
    this.database = database,
    this.queryType = "",
    this.tempKeys = [],
    this.tempSchemaTable = null;
    this.tempColumns = [],
    this.tempValuesToInsert = {}
    this.tempValuesToUpdate = {}
    this.tempWhereCondition = null;
    this.tempData = []
  }

   select(columns?: Record<string, Column>): SelectCommand {
      this.queryType = "SELECT"
  
      
  
      return new SelectCommand(this.database, columns)
    }
  

  from(schemaTable: SchemaTable): Query {
    if (!schemaTable) throw new Error("Erro: O schema da table não foi especificado no 'from'");

    this.tempSchemaTable = schemaTable

    return this
  }

  insert(schemaTable: SchemaTable): InsertCommand {
    if (!schemaTable) throw new Error("Erro: Nenhuma tabela foi especificada no 'insert'");

    return new InsertCommand(this.database, schemaTable)
  }

  values(values: Record<string, any>): Query {
    if (!values) throw new Error("Erro: Nenhum valor foi passado no 'values'");
    if (!this.tempSchemaTable) throw new Error("[Mist] Erro interno: O tempSchemaTable não existe ou é null");

    // verifica se as chaves de values exitem na tabela
    for (const key in values) {
      if (!this.tempSchemaTable.__nameColumns.includes(key)) {
        throw new Error(`ERRO: A coluna ${key} não existe no tabela`)
      }
    }

    this.assertConstraints(values)

    this.tempValuesToInsert = values
    return this
  }

  /*/////////////////////////////
    METODOS PRIVADOS DE VALIDAÇÃO
  */
  
  private assertConstraints(values: Record<string, any>): void {
    if (!values) throw new Error("[Mist] Erro Interno: Objeto de valores ausente na validação.");
    if (!this.tempSchemaTable) throw new Error("[Mist] Erro Interno: O contexto da tabela (schemaTable) foi perdido.");

    const tableName = this.tempSchemaTable.__nameTable
    const table = this.database.tables[tableName]

    if (!table) throw new Error("[Mist] Erro Interno: Tabela não existe");

    // Verifica se as colunas com notNull estão sendo preechidas
    this.checkNotNull(values)

    // Um único loop para validar tipos e unicidade dos valores enviados
    for (const [key, value] of Object.entries(values)) {
      const schemaColumn = this.tempSchemaTable[key as keyof typeof this.tempSchemaTable]

      if (!schemaColumn || typeof schemaColumn !== "object" || !("config" in schemaColumn)) {
        throw new Error(`A coluna '${key}' não existe`)
      }
      
      const column = schemaColumn as Column
      const { config } = column

      // Valida o tipo do dado
      this.checkColumnType(key, value, config.columnType)

      // Valida a restrição de unicidade
      if (config.unique) {
        if (!table.indexes[key]) throw new Error(`[Mist] Erro Interno: A coluna '${key}' não possui indices.`);

        if (this.queryType === "INSERT") {
          this.checkUnique(key, value, table.indexes[key])
        }
      }
    }
  }

  private checkColumnType(key: string, value: any, columnType: ColumnType): void {
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

  private checkUnique(key: string, value: any, columnIndexes: Set<any>): void {
    if (!columnIndexes) throw new Error(`[Mist] Erro Interno: O índice para a coluna '${key}' não foi inicializado.`)
      
    const valueExistiInColumn = columnIndexes.has(value)
    if (valueExistiInColumn) {
      throw new Error(`Erro: duplicar valor da chave viola a restrição de unicidade, coluna: '${key}' já tem o valor: '${value}'`);
    }

    columnIndexes.add(value)
  }

  private checkNotNull(values: Record<string, any>): void {
    if (!values) throw new Error("[Mist] Erro Interno: Objeto de valores ausente na validação.");
    if (!this.tempSchemaTable) throw new Error("[Mist] Erro Interno: O contexto da tabela (schemaTable) foi perdido.");

    for (const columnName of this.tempSchemaTable.__nameColumns) {
      const column = this.tempSchemaTable[columnName] as Column;
      
      if (column.config.notNull) {
        const value = values[columnName];

        if (this.queryType === "INSERT") {
          if (value === undefined || value === null) {
            throw new Error(`Erro: A coluna '${columnName}' é obrigatória e não pode ser nula.`);
          }
        }

        if (this.queryType === "UPDATE") {
          // Verifica se a coluna foi passada para set()
          const columnExistInValues = columnName in values

          if (columnExistInValues && (value === undefined || value === null)) {
            throw new Error(`Erro: A coluna '${columnName}' é obrigatória e não pode ser nula.`);
          }
        }
      }
    }
  }
  
  /*
    ///////////
  *//////////////////////////////////

  /*//////////////////////
    UPDATE e SET
  */

  update(schemaTable: SchemaTable): UpdateCommand {
      if (!schemaTable) throw new Error("Erro: O schema da table não foi especificado no 'update'");
  
      
  
      return new  UpdateCommand(this.database, schemaTable)
    }

  set(values: Record<string, any>): Query {
    if (!values) throw new Error("Erro: Nenhum valor foi passado no 'set'");
    if (!this.tempSchemaTable) throw new Error("[Mist] Erro interno: O tempSchemaTable não existe ou é null");

    // verifica se as chaves de values exitem na tabela
    for (const key in values) {
      if (!this.tempSchemaTable.__nameColumns.includes(key)) {
        throw new Error(`ERRO: A coluna ${key} não existe no tabela`)
      }
    }

    this.assertConstraints(values)

    this.tempValuesToUpdate = values
    return this
  }

  /*
    ///////////
  *//////////////////////////////////

  /*//////////////////////
    DELETE
  */

   delete(schemaTable: SchemaTable): Query {
    if (!schemaTable) throw new Error("Erro: O schema da table não foi especificado no 'delete'");

    this.queryType = "DELETE"
    this.tempSchemaTable = schemaTable

    return this
  }

  /*
    ///////////
  *//////////////////////////////////

  /*//////////////////////
    WHERE
  */

  where(condition: Condition): Query {
    if (!condition) throw new Error("Erro: Nenhuma condição foi passada para where.");

    this.tempWhereCondition = condition
    return this
  }

  private evalCondition(line: Record<string, any>, condition: Condition): boolean {
    if (!this.tempWhereCondition) throw new Error("[Mist] Erro interno: A condição temporária 'tempWhereCondition' não existe");
    
    if (condition.type === "binary") {
    const { columnName, operator, value } = condition
    const columnValue = line[columnName]

      switch (operator) {
        case "eq": return columnValue === value
        case "ne": return columnValue !== value 

        case "gt":
          // Retorna erro se os tipos forem diferentes
          if (typeof columnValue !== typeof value) { 
            throw new Error(`Erro de tipo: Não é possível comparar ${typeof columnValue} com ${typeof value}`)
          }
          return columnValue > value

        case "gte":
          if (typeof columnValue !== typeof value) { 
            throw new Error(`Erro de tipo: Não é possível comparar ${typeof columnValue} com ${typeof value}`)
          }
          return columnValue >= value

        case "lt": 
           if (typeof columnValue !== typeof value) { 
            throw new Error(`Erro de tipo: Não é possível comparar ${typeof columnValue} com ${typeof value}`)
          }
          return columnValue < value

        case "lte": 
           if (typeof columnValue !== typeof value) { 
            throw new Error(`Erro de tipo: Não é possível comparar ${typeof columnValue} com ${typeof value}`)
          }
          return columnValue <= value

        default: return false
      }
    }

    if (condition.type === "logical") {
      if (condition.operator === "and") {
        // .every() garante que TODAS as sub-condições retornem true, se não ele retorna false
        return condition.conditions.every(subCond => this.evalCondition(line, subCond)) 
      }

      if (condition.operator === "or") {
        // .some() garante que pelo menos UMA sub-condição retorne true, se não ele retorna false
        return condition.conditions.some(subCond => this.evalCondition(line, subCond))
      }

      if (condition.operator === "not") {
        return !this.evalCondition(line, condition.condition)
      }
    }

    return false
  }

  /*
    ///////////
  *//////////////////////////////////

  private clearState(): void {
    this.tempKeys = []
    this.tempColumns = []
    this.tempSchemaTable = null
    this.tempValuesToInsert = {}
    this.tempValuesToUpdate = {}
    this.queryType = ""
    this.tempWhereCondition = null
    this.tempData = []
  }

  execute<T = any>(): T[] {
    let result: T[] = [];

    if (this.queryType === "SELECT") {
      if (!this.tempSchemaTable) throw new Error("[Mist] Erro interno: O tempSchemaTable não existe ou é null");

      const tableName = this.tempSchemaTable.__nameTable
      const table = this.database.tables[tableName]

      // Verifica se a tabela existe no banco
      if (!table) throw new Error(`Erro: Tabela ${tableName} não existe`);

      // Envia uma copia de todas as linhas da tabela se nenhuma coluna tiver sido especificada
      if (this.tempColumns.length === 0) {
        for (const line of table.data) {
          // Se existir um WHERE e a linha NÃO bater com a condição, pula para a próxima imediatamente
          if (this.tempWhereCondition && !this.evalCondition(line, this.tempWhereCondition)) {
            continue
          }

          this.tempData.push({ ...line })
        }

        result = this.tempData

        this.clearState()
        return result as T[]
      }

      // Monta as novas linhas
      for (const line of table.data) {
        // Se existir um WHERE e a linha NÃO bater com a condição, pula para a próxima imediatamente
        if (this.tempWhereCondition && !this.evalCondition(line, this.tempWhereCondition)) {
          continue
        }

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

      result = this.tempData as T[]
      this.clearState()
    }


    if (this.queryType === "INSERT") {
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

      result = []
      this.clearState()
    }


    if (this.queryType === "UPDATE") {
      if (!this.tempSchemaTable) throw new Error("[Mist] Erro interno: O tempSchemaTable não existe ou é null");

      const tableName = this.tempSchemaTable.__nameTable
      const table = this.database.tables[tableName]

      // Verifica se a tabela existe no banco
      if (!table) throw new Error(`Erro: Tabela ${tableName} não existe`);

      // -------------------------------------------------------------
      // FASE 1: VALIDAÇÃO (Garante que a operação é segura para TODAS as linhas)
      // -------------------------------------------------------------
      // Criar um Set temporário para simular as adições desta query e evitar colisões no mesmo comando
      const futurosValoresUnicos = new Set<string>();

      for (const line of table.data) {
        if (this.tempWhereCondition && !this.evalCondition(line, this.tempWhereCondition)) {
          continue;
        }

        for (const columnName of Object.keys(this.tempValuesToUpdate)) {
          const newValue = this.tempValuesToUpdate[columnName];
          const oldValue = line[columnName];

          if (newValue !== oldValue && table.indexes[columnName]) {
            // Se o valor já existe no banco OU se outra linha neste mesmo UPDATE já tentou usar este valor
            if (table.indexes[columnName].has(newValue) || futurosValoresUnicos.has(`${columnName}:${newValue}`)) {
              throw new Error(`Erro: duplicar valor da chave viola a restrição de unicidade, coluna: '${columnName}' já tem o valor: '${newValue}'`);
            }
            
            // Registra que esta query vai passar a usar este valor nesta coluna
            futurosValoresUnicos.add(`${columnName}:${newValue}`);
          }
        }
      }

      // -------------------------------------------------------------
      // FASE 2: MUTAÇÃO (Só chega aqui se NENHUMA linha falhou na Fase 1)
      // -------------------------------------------------------------
      for (const line of table.data) {
        // Se existir um WHERE e a linha NÃO bater com a condição, pula para a próxima imediatamente
        if (this.tempWhereCondition && !this.evalCondition(line, this.tempWhereCondition)) {
          continue
        }

        // Antes de atualizar a linha, validam e atualiza os índices das colunas unique
        for (const columnName of Object.keys(this.tempValuesToUpdate)) {
          const newValue = this.tempValuesToUpdate[columnName];
          const oldValue = line[columnName];

          // Se o valor tiver mudado, garante que o novo vaor não exista nos indeces
          if (newValue !== oldValue && table.indexes[columnName]) {

            // remove o valor antigo e adiciona o novo
            table.indexes[columnName].delete(oldValue)
            table.indexes[columnName].add(newValue)
          }
        }

        for (const columnName of Object.keys(this.tempValuesToUpdate)) {
          const newValue = this.tempValuesToUpdate[columnName]

          line[columnName] = newValue
        }
      }

      this.clearState()
      result = []
    }


    if (this.queryType === "DELETE") {
      if (!this.tempSchemaTable) throw new Error("[Mist] Erro interno: O tempSchemaTable não existe ou é null");

      const tableName = this.tempSchemaTable.__nameTable
      const table = this.database.tables[tableName]

      // Verifica se a tabela existe no banco
      if (!table) throw new Error(`Erro: Tabela ${tableName} não existe`);

      // -------------------------------------------------------------
      // CASO 1: SEM WHERE (Apagar a tabela toda)
      // -------------------------------------------------------------
      if (!this.tempWhereCondition) {
        table.data = [];
        for (const indexKey of Object.keys(table.indexes)) {
          table.indexes[indexKey]?.clear(); // Esvazia o Set sem destruir a sua instância, se a coluna realmente tiver indices
        }

        this.clearState();
        result = []
        return result;
      }

      // -------------------------------------------------------------
      // CASO 2: COM WHERE (Filtragem Eficiente In-Place)
      // -------------------------------------------------------------
      let nextValidPosition = 0;

      for (let i = 0; i < table.data.length; i++) {
        const linha = table.data[i];

        if (!linha) throw new Error("[Mist] Erro interno: A linha não existe")

        if (this.evalCondition(linha, this.tempWhereCondition)) {
          // Se a linha bate com o WHERE, ela DEVE SER APAGADA.
          // Removemos os valores desta linha dos índices únicos do banco.
          for (const columnKey of Object.keys(linha)) {
            if (table.indexes[columnKey]) {
              table.indexes[columnKey].delete(linha[columnKey]);
            }
          }
          // Pula a linha: nextValidPosition não avança, então esta linha será sobrescrita.
        } else {
          // Se a linha NÃO bate com o WHERE, ela DEVE SER MANTIDA.
          // Movemos o registro para a "frente" do array, consolidando os sobreviventes.
          table.data[nextValidPosition] = linha;
          nextValidPosition++;
        }
      }

      // CORTE FINAL: Remove do array, de uma só vez, os registros duplicados que sobraram no fim.
      // Exemplo: Se tínhamos 8000 linhas e 2 foram apagadas, nextValidPosition terminou em 7998.
      // O splice(7998) vai cortar as últimas 2 posições excedentes com máxima performance.
      table.data.splice(nextValidPosition);

      this.clearState();
      result = []
    }

    return result
  }
}