import { describe, it, expect } from "@jest/globals";
import { integer, text } from "../../src/core/column";
import { createTable } from "../../src/core/table";

describe("table", () => {
  it("deve criar um schemaTable simples corretamente", () => {
    const userTable = createTable("user", {
      name: text("name"),
      age: integer("age"),
    });

    expect(userTable.__nameTable).toBe("user");
    expect(userTable.__nameColumns).toEqual(["name", "age"]);
    expect(userTable.name).toBeDefined();
    expect(userTable.age).toBeDefined();

    expect(userTable.name.config.keySchema).toBe("name");
    expect(userTable.age.config.keySchema).toBe("age");
  });

  it("deve lançar erro se tiver mais de uma coluna com primaryKey", () => {
    expect(() => {
      createTable("user", {
        id: integer("id").primaryKey(),
        name: text("name").primaryKey(),
        age: integer("age"),
      });
    }).toThrow("ERRO: não são permitidas múltiplas chaves primárias na tabela 'user'.");
  });
});
