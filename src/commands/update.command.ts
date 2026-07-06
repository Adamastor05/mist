import { Database as IDatabase, SchemaTable } from "../types";
import { assertConstraints } from "../validation/constraints";
import { WhereCommand } from "./where.command";

export class UpdateCommand extends WhereCommand {
  private database: IDatabase;
  private tempSchemaTable: SchemaTable | null;
  private tempValuesToUpdate: Record<string, any>;

  constructor(database: IDatabase, tempSchemaTable: SchemaTable) {
    super();
    this.database = database;
    this.tempSchemaTable = tempSchemaTable;
    this.tempValuesToUpdate = {};
  }

  set(values: Record<string, any>): UpdateCommand {
    if (!values) throw new Error("Erro: Nenhum valor foi passado no 'set'");
    if (!this.tempSchemaTable)
      throw new Error(
        "[Mist] Erro interno: O tempSchemaTable não existe ou é null",
      );

    // verifica se as chaves de values exitem na tabela
    for (const key in values) {
      if (!this.tempSchemaTable.__nameColumns.includes(key)) {
        throw new Error(`ERRO: A coluna ${key} não existe no tabela`);
      }
    }

    assertConstraints(values, this.tempSchemaTable, this.database, "UPDATE");

    this.tempValuesToUpdate = values;
    return this;
  }

  execute<TModel = any>(): TModel[] {
    let result: TModel[] = [];

    if (!this.tempSchemaTable)
      throw new Error(
        "[Mist] Erro interno: O tempSchemaTable não existe ou é null",
      );

    const tableName = this.tempSchemaTable.__nameTable;
    const table = this.database.tables[tableName];

    // Verifica se a tabela existe no banco
    if (!table) throw new Error(`Erro: Tabela ${tableName} não existe`);

    // -------------------------------------------------------------
    // FASE 1: VALIDAÇÃO (Garante que a operação é segura para TODAS as linhas)
    // -------------------------------------------------------------
    // Criar um Set temporário para simular as adições desta query e evitar colisões no mesmo comando
    const futureUniqueValues = new Set<string>();

    for (const line of table.data) {
      if (this.tempWhereCondition && !this.evalCondition(line, this.tempWhereCondition)) {
        continue;
      }

      for (const columnName of Object.keys(this.tempValuesToUpdate)) {
        const newValue = this.tempValuesToUpdate[columnName];
        const oldValue = line[columnName];

        if (newValue !== oldValue && table.indexes[columnName]) {
          // Se o valor já existe no banco OU se outra linha neste mesmo UPDATE já tentou usar este valor
          if (table.indexes[columnName].has(newValue) || futureUniqueValues.has(`${columnName}:${newValue}`)) {
            throw new Error(`Erro: duplicar valor da chave viola a restrição de unicidade, coluna: '${columnName}' já tem o valor: '${newValue}'`);
          }

          // Registra que esta query vai passar a usar este valor nesta coluna
          futureUniqueValues.add(`${columnName}:${newValue}`);
        }
      }
    }

    // -------------------------------------------------------------
    // FASE 2: MUTAÇÃO (Só chega aqui se NENHUMA linha falhou na Fase 1)
    // -------------------------------------------------------------
    for (const line of table.data) {
      // Se existir um WHERE e a linha NÃO bater com a condição, pula para a próxima imediatamente
      if (this.tempWhereCondition && !this.evalCondition(line, this.tempWhereCondition)) {
        continue;
      }

      // Antes de atualizar a linha, validam e atualiza os índices das colunas unique
      for (const columnName of Object.keys(this.tempValuesToUpdate)) {
        const newValue = this.tempValuesToUpdate[columnName];
        const oldValue = line[columnName];

        // Se o valor tiver mudado, garante que o novo vaor não exista nos indeces
        if (newValue !== oldValue && table.indexes[columnName]) {
          // remove o valor antigo e adiciona o novo
          table.indexes[columnName].delete(oldValue);
          table.indexes[columnName].add(newValue);
        }
      }

      for (const columnName of Object.keys(this.tempValuesToUpdate)) {
        const newValue = this.tempValuesToUpdate[columnName];

        line[columnName] = newValue;
      }
    }

    return result;
  }
}
