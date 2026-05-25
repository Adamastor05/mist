import { describe, it, expect } from "@jest/globals";
import { integer, text } from "../../src/core/column";
import { createTable } from "../../src/core/table";
import { createDatabase } from "../../src/core/database";

describe("Database", () => {

  it("deve criar um banco de dados com suas tabelas corretamente", () => {
    const users = createTable("users", {
      id: integer("id").primaryKey(),
      name: text("name").notNull(),
      age: integer("age"),
    });
    const sales = createTable("sales", {
      id: integer("id").primaryKey(),
      productName: text("product_name").notNull(),
      total: integer("total").notNull()
    });

    const database = createDatabase({ users, sales });

    expect(database.tables).toBeDefined();
    
    // verifica se as tabelas foram craidas corretamente
    expect(database.tables.users).toBeDefined();
    expect(database.tables.sales).toBeDefined();
    
    // verifica se 'config' foi criado corretamente 
    expect(database.tables.users.config).toBeDefined()
    expect(database.tables.sales.config).toBeDefined()

    // verifica se o array 'data'
    expect(database.tables.users.data).toBeDefined()
    expect(database.tables.sales.data).toBeDefined()

    // verifica se os indices são criados corretamente
    expect(database.tables.users.indexes).toEqual({ id: new Set() })
    expect(database.tables.sales.indexes).toEqual({ id: new Set() })
  });

  it("Deve lançar erro ao tentar criar o banco de dados sem passar os esquemas", () => {
    expect(() => {
      // @ts-ignore: Ignora o TypeScript para forçar o erro em tempo de execução
      createDatabase(undefined);
    }).toThrow("ERRO: Nenhum esquema foi passado para função 'createDatabase'");
  });

});