import { Database as IDatabase, SchemaTable } from "../types";
import { WhereCommand } from "./where.command";

export class DeleteCommand extends WhereCommand {
  private database: IDatabase;
  private tempSchemaTable: SchemaTable | null;

  constructor(database: IDatabase, tempSchemaTable: SchemaTable) {
    super();
    this.database = database;
    this.tempSchemaTable = tempSchemaTable;
  }

  execute<TModel = any>() {
    const result: TModel[] = [];

    if (!this.tempSchemaTable)throw new Error("[Mist] Erro interno: O tempSchemaTable não existe ou é null");

    const tableName = this.tempSchemaTable.__nameTable;
    const table = this.database.tables[tableName];

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

      return result;
    }

    // -------------------------------------------------------------
    // CASO 2: COM WHERE (Filtragem Eficiente In-Place)
    // -------------------------------------------------------------
    let nextValidPosition = 0;

    for (let i = 0; i < table.data.length; i++) {
      const linha = table.data[i];

      if (!linha) throw new Error("[Mist] Erro interno: A linha não existe");

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

    return result;
  }
}
