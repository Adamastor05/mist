import { Database as IDatabase, Column, SchemaTable } from "../types";
import { DeleteCommand } from "./delete.command";
import { InsertCommand } from "./insert.command";
import { SelectCommand } from "./select.command";
import { UpdateCommand } from "./update.command";

export class Query {
  private database: IDatabase;

  constructor(database: IDatabase) {
    this.database = database
  }

  select(columns?: Record<string, Column>): SelectCommand {
    return new SelectCommand(this.database, columns)
  }

  insert(schemaTable: SchemaTable): InsertCommand {
    if (!schemaTable) throw new Error("Erro: Nenhuma tabela foi especificada no 'insert'");

    return new InsertCommand(this.database, schemaTable)
  }

  update(schemaTable: SchemaTable): UpdateCommand {
    if (!schemaTable) throw new Error("Erro: Nenhuma tabela foi especificada no 'update'");

    return new UpdateCommand(this.database, schemaTable)
  }

  delete(schemaTable: SchemaTable): DeleteCommand {
    if (!schemaTable) throw new Error("Erro: Nenhuma tabela foi especificada no 'delete'");

    return new DeleteCommand(this.database, schemaTable)
  }
}