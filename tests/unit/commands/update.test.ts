import { describe, it, expect, beforeEach } from "@jest/globals";
import { integer, text } from "../../../src/core/column";
import { eq } from "../../../src/core/operators";
import { createTable } from "../../../src/core/table";
import { createDatabase } from "../../../src/core/database";
import { Query } from "../../../src/commands";

describe("update e set", () => {
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
    db.insert(users).values({ id: 2, name: "Paulo", age: 25, email: "Paulo@gmail.com" }).execute();
  });

  describe("Casos de sucesso", () => {
    it("deve atualizar o nome do usuario que tiver id igual a 1", () => {
      const res = db
        .update(users)
        .set({ name: "Pedro" })
        .where(eq(users.id, 1))
        .execute();

      expect(res).toEqual([]);
      expect(database.tables.users.data[0]).toEqual({
        id: 1,
        name: "Pedro",
        age: 18,
        email: "miguel@gmail.com",
      });
    });

    it("deve atualizar o nome e o email do usuario que tiver id igual a 1", () => {
      const res = db
        .update(users)
        .set({ name: "Pedro", email: "pedro@gmail.com" })
        .where(eq(users.id, 1))
        .execute();

      expect(res).toEqual([]);
      expect(database.tables.users.data[0]).toEqual({
        id: 1,
        name: "Pedro",
        age: 18,
        email: "pedro@gmail.com",
      });
    });

    it("deve atualizar o nome de todos os usuarios", () => {
      const res = db.update(users).set({ name: "Pedro" }).execute();

      expect(res).toEqual([]);
      expect(database.tables.users.data).toEqual([
        { id: 1, name: "Pedro", age: 18, email: "miguel@gmail.com" },
        { id: 2, name: "Pedro", age: 25, email: "Paulo@gmail.com" },
      ]);
    });
  });

  describe("Cenarios de Erro", () => {
    it("deve lançar erro se updade() for chamado sem schemaTable", () => {
      expect(() => {
        // @ts-ignore: Ignora o TypeScript para forçar o erro em tempo de execução
        db.update().set({ name: "Pedro" }).execute();
      }).toThrow("Erro: Nenhuma tabela foi especificada no 'update'");
    });

    it("deve lançar erro se set() for chamado sem values", () => {
      expect(() => {
        // @ts-ignore: Ignora o TypeScript para forçar o erro em tempo de execução
        db.update(users).set().execute();
      }).toThrow("Erro: Nenhum valor foi passado no 'set'");
    });
  });
});
