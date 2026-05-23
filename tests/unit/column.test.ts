import { describe, it, expect } from "@jest/globals";
import { boolean, integer, text } from "../../src/core/column";

describe("Column", () => {
  it("Deve inicializar uma coluna com as configurações padrão corretas", () => {
    const userName = text("user_name");

    // verifica se o objeto config foi definida
    expect(userName.config).toBeDefined();

    expect(userName.config.dataType).toBe("text"); // Garante que o tipo foi setado certo
    expect(userName.config.keySchema).toBe("");
    expect(userName.config.name).toBe("user_name");

    // Garante que as restrições começam desativadas
    expect(userName.config.primaryKey).toBe(false);
    expect(userName.config.unique).toBe(false);
    expect(userName.config.notNull).toBe(false);
  });

  describe("dataTypes", () => {
    it("Deve definir o dataType correto para cada função inicializadora", () => {
        const userName = text("user_name");
        const userAge = integer("user_age")
        const userIsActive = boolean("user_is_active")

        expect(userName.config.dataType).toBe("text")
        expect(userAge.config.dataType).toBe("integer")
        expect(userIsActive.config.dataType).toBe("boolean")
    })
  })

  describe("Constraints", () => {
    it("deve definir notNull como true", () => {
      const userName = text("user_name").notNull();

      expect(userName.config.notNull).toBe(true);
    });

    it("deve definir unique como true", () => {
      const userName = text("user_name").unique();

      expect(userName.config.unique).toBe(true);
    });

    it("deve definir primaryKey, unique e notNull como true", () => {
      const userId = integer("user_id").primaryKey();

      expect(userId.config.primaryKey).toBe(true);
      expect(userId.config.notNull).toBe(true);
      expect(userId.config.unique).toBe(true);
    });
  });
});
