import { describe, it, expect, beforeEach } from "@jest/globals";
import { integer, text } from "../../../src/core/column";
import { gte } from "../../../src/core/operators";
import { createTable } from "../../../src/core/table";
import { createDatabase } from "../../../src/core/database";
import { Query } from "../../../src/commands";

describe("delete", () => {
  const users = createTable("users", {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    age: integer("age"),
    email: text("email").unique().notNull(),
  });

  let database = createDatabase({ users });
  let db = new Query(database);

  // Reseta o estado do banco
  beforeEach(() => {
    database = createDatabase({ users });
    db = new Query(database);
  });

  beforeEach(() => {
    db.insert(users).values({ id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" }).execute();
    db.insert(users).values({ id: 2, name: "João", age: 20, email: "joao@gmail.com" }).execute();
    db.insert(users).values({ id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" }).execute();
    db.insert(users).values({ id: 4, name: "Paulo", age: 25, email: "Paulo@gmail.com" }).execute();
    db.insert(users).values({ id: 5, name: "Lucas", age: 27, email: "Lucas@gmail.com" }).execute();
  });

  describe("Casos de Sucesso", () => {
    it("deve deletar todos os valores corretamente", () => {
      const res = db.delete(users).execute();

      expect(res).toEqual([]);
      expect(database.tables.users.data).toEqual([]);
    });

    it("deve deletar os valores que satisfazerem a condição", () => {
      const res = db.delete(users).where(gte(users.age, 20)).execute();

      expect(res).toEqual([]);
      expect(database.tables.users.data).toEqual([
        { id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" },
      ]);
    });
  });

  describe("Casos de Erro", () => {
    it("deve lançar erro se delete() for chamado sem schemaTable", () => {
      expect(() => {
        // @ts-ignore: Ignora o TypeScript para forçar o erro em tempo de execução
        db.delete().execute();
      }).toThrow("Erro: Nenhuma tabela foi especificada no 'delete'");
    });
  });
});
