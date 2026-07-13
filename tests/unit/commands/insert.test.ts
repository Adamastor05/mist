import { describe, it, expect, beforeEach } from "@jest/globals";
import { boolean, date, decimal, integer, text, } from "../../../src/core/column";
import { createTable } from "../../../src/core/table";
import { createDatabase } from "../../../src/core/database";
import { Query } from "../../../src/commands";

describe("insert e values", () => {
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

  describe("Cenários de Sucesso", () => {
    it("deve inserir dados na tabela corretamente", () => {
      const res = db
        .insert(users)
        .values({
          id: 1,
          name: "lucas",
          age: 20,
          email: "lucas@gmail.com",
        })
        .execute();

      expect(res).toEqual([]);
      expect(database.tables.users.data[0]).toEqual({
        id: 1,
        name: "lucas",
        age: 20,
        email: "lucas@gmail.com",
      });
    });

    it("deve inserir null em uma coluna não obrigatória que não foi passada para valeus()", () => {
      const res = db
        .insert(users)
        .values({
          id: 1,
          name: "lucas",
          // age não é passado, mas também não é obrigatório
          email: "lucas@gmail.com",
        })
        .execute();

      expect(res).toEqual([]);
      expect(database.tables.users.data[0]).toEqual({
        id: 1,
        name: "lucas",
        age: null,
        email: "lucas@gmail.com",
      });
    });
  });

  describe("Cenários de Erro", () => {
    it("deve lançar erro se tentar inserir um id duplicado (primaryKey)", () => {
      db.insert(users)
        .values({ id: 1, name: "lucas", age: 20, email: "lucas@gmail.com" })
        .execute();

      expect(() => {
        db.insert(users)
          .values({ id: 1, name: "Daniel", age: 22, email: "daniel@gmail.com" })
          .execute();
      }).toThrow(
        "Erro: duplicar valor da chave viola a restrição de unicidade, coluna: 'id' já tem o valor: '1'",
      );
    });

    it("deve lançar erro se tentar inserir um registro sem uma coluna obrigatória (notNull)", () => {
      expect(() => {
        db.insert(users)
          .values({
            id: 1,
            // name ausente
            age: 20,
            email: "lucas@gmail.com",
          })
          .execute();
      }).toThrow("Erro: A coluna 'name' é obrigatória e não pode ser nula.");
    });

    it("deve lançar erro se tentar inserir um email duplicado (unique)", () => {
      db.insert(users)
        .values({ id: 1, name: "lucas", age: 20, email: "lucas@gmail.com" })
        .execute();

      expect(() => {
        db.insert(users)
          .values({ id: 2, name: "Daniel", age: 22, email: "lucas@gmail.com" }) // Mesmo email
          .execute();
      }).toThrow(
        "Erro: duplicar valor da chave viola a restrição de unicidade, coluna: 'email' já tem o valor: 'lucas@gmail.com'",
      );
    });

    it("deve lançar erro se insert() for chamado sem o schema da tabela", () => {
      expect(() => {
        // @ts-ignore: Ignora o TypeScript para forçar o erro em tempo de execução
        db.insert(undefined)
          .values({ id: 1, name: "lucas", age: 20, email: "lucas@gmail.com" })
          .execute();
      }).toThrow("Erro: Nenhuma tabela foi especificada no 'insert'");
    });

    it("deve lançar erro se values() for chamado sem nenhum valor", () => {
      expect(() => {
        db.insert(users)
        // @ts-ignore: Ignora o TypeScript para forçar o erro em tempo de execução
        .values(undefined)
        .execute();
      }).toThrow("Erro: Nenhum valor foi passado no 'values'");
    });

    it("deve lançar erro se alguma coluna passada para values() não existir na tabela", () => {
      expect(() => {
        db.insert(users)
          .values({
            id: 1,
            name: "Lucas",
            age: 20,
            email: "lucas@gmail.com",
            isActive: true, // essa coluna não existe
          })
          .execute();
      }).toThrow("ERRO: A coluna isActive não existe no tabela");
    });

    it("deve lançar erro se o tipo do valor inserido for diferente do tipo da coluna", () => {
      expect(() => {
        db.insert(users)
          .values({
            id: "1",
            name: "Lucas",
            age: 20,
            email: "lucas@gmail.com",
          })
          .execute();
      }).toThrow(
        "Erro de tipo: A coluna 'id' espera um integer, mas recebeu string",
      );

      expect(() => {
        db.insert(users)
          .values({
            id: 1,
            name: true,
            age: 20,
            email: "lucas@gmail.com",
          })
          .execute();
      }).toThrow(
        "Erro de tipo: A coluna 'name' espera um text, mas recebeu boolean",
      );
    });

    it("deve lançar erro se coluna do tipo boolean receber valor diferente", () => {
      const players = createTable("players", {
        id: integer("id").primaryKey(),
        nickName: text("nick_name").notNull(),
        points: decimal("points").notNull(),
        isChampion: boolean("is_champion").notNull(),
      });
      const database = createDatabase({ players });
      const db = new Query(database);

      expect(() => {
        db.insert(players).values({
          id: 1,
          nickName: "adan23",
          points: 8.5,
          // (ERRO) coluna de tipo boolean recebendo um string
          isChampion: "string",
        });
      }).toThrow(
        `Erro de tipo: A coluna 'isChampion' espera um boolean, mas recebeu string`,
      );
    });

    it("deve lançar erro se coluna do tipo decimal receber valor diferente", () => {
      const players = createTable("players", {
        id: integer("id").primaryKey(),
        nickName: text("nick_name").notNull(),
        points: decimal("points").notNull(),
        isChampion: boolean("is_champion").notNull(),
      });
      const database = createDatabase({ players });
      const db = new Query(database);

      expect(() => {
        db.insert(players).values({
          id: 1,
          nickName: "adan23",
          // (ERRO) coluna de tipo boolean recebendo um integer
          points: 8,
          isChampion: true,
        });
      }).toThrow(
        `Erro de tipo: A coluna 'points' espera um decimal, mas recebeu integer`,
      );

      expect(() => {
        db.insert(players).values({
          id: 2,
          nickName: "adan23",
          // (ERRO) coluna de tipo boolean recebendo um string
          points: "string",
          isChampion: true,
        });
      }).toThrow(
        `Erro de tipo: A coluna 'points' espera um decimal, mas recebeu string`,
      );
    });

    it("deve lançar erro se coluna do tipo date receber valor diferente", () => {
      const players = createTable("players", {
        id: integer("id").primaryKey(),
        name: text("name").notNull(),
        createdAt: date("created_at").notNull(),
      });
      const database = createDatabase({ players });
      const db = new Query(database);

      expect(() => {
        db.insert(players).values({
          id: 2,
          name: "Miguel",
          // (ERRO) coluna de tipo dete recebendo um integer
          createdAt: 10,
        });
      }).toThrow(
        `Erro de tipo: A coluna 'createdAt' espera um date valido, mas recebeu number`,
      );
    });
  });
});
