import { describe, it, expect, beforeEach } from "@jest/globals";
import { integer, text } from "../../../src/core/column";
import { eq, ne, gt, gte, lt, lte, and, or, not } from "../../../src/core/operators";
import { createTable } from "../../../src/core/table";
import { createDatabase } from "../../../src/core/database";
import { Query } from "../../../src/commands";

describe("select e from", () => {
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
    it("deve buscar todas as linhas da tabela corretamente", () => {
      db.insert(users)
        .values({ id: 1, name: "lucas", age: 20, email: "lucas@gmail.com" })
        .execute();

      db.insert(users)
        .values({ id: 2, name: "Daniel", age: 22, email: "daniel@gmail.com" })
        .execute();

      const res = db.select().from(users).execute();

      expect(res).toEqual([
        { id: 1, name: "lucas", age: 20, email: "lucas@gmail.com" },
        { id: 2, name: "Daniel", age: 22, email: "daniel@gmail.com" },
      ]);
    });

    it("deve buscar apenas nome e email na tabela", () => {
      db.insert(users)
        .values({ id: 1, name: "lucas", age: 20, email: "lucas@gmail.com" })
        .execute();

      db.insert(users)
        .values({ id: 2, name: "Daniel", age: 22, email: "daniel@gmail.com" })
        .execute();

      const res = db
        .select({
          name: users.name,
          email: users.email,
        })
        .from(users)
        .execute();

      expect(res).toEqual([
        { name: "lucas", email: "lucas@gmail.com" },
        { name: "Daniel", email: "daniel@gmail.com" },
      ]);
    });

    it("deve mapear os resultados usando aliases (apelidos) para as colunas selecionadas", () => {
      db.insert(users)
        .values({ id: 1, name: "lucas", age: 20, email: "lucas@gmail.com" })
        .execute();

      db.insert(users)
        .values({ id: 2, name: "Daniel", age: 22, email: "daniel@gmail.com" })
        .execute();

      const res = db
        .select({
          // chaves passadas com nomes diferente da coluna
          userName: users.name,
          userEmail: users.email,
        })
        .from(users)
        .execute();

      expect(res).toEqual([
        { userName: "lucas", userEmail: "lucas@gmail.com" },
        { userName: "Daniel", userEmail: "daniel@gmail.com" },
      ]);
    });
  });

  describe("Cenários de Erro", () => {
    it("deve lançar erro se from() for chamado sem o schema da tabela", () => {
      expect(() => {
        db.insert(users)
          .values({ id: 1, name: "lucas", age: 20, email: "lucas@gmail.com" })
          .execute();

        // @ts-ignore: Ignora o TypeScript para forçar o erro em tempo de execução
        db.select().from(undefined).execute();
      }).toThrow("Erro: O schema da table não foi especificado no 'from'");
    });
  });



  describe("where", () => {
    beforeEach(() => {
      db.insert(users).values({ id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" }).execute();
      db.insert(users).values({ id: 2, name: "João", age: 20, email: "joao@gmail.com" }).execute();
      db.insert(users).values({ id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" }).execute();
      db.insert(users).values({ id: 4, name: "Paulo", age: 25, email: "Paulo@gmail.com" }).execute();
      db.insert(users).values({ id: 5, name: "Lucas", age: 27, email: "Lucas@gmail.com" }).execute();
    });

    describe("Cenários de Sucesso", () => {
      it("deve buscar filtrando para idade igual que 20", () => {
        const res = db.select().from(users).where(eq(users.age, 20)).execute();

        expect(res).toEqual([
          { id: 2, name: "João", age: 20, email: "joao@gmail.com" },
          { id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" },
        ]);
      });

      it("deve buscar filtrando para idade diferente de 20", () => {
        const res = db.select().from(users).where(ne(users.age, 20)).execute();

        expect(res).toEqual([
          { id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" },
          { id: 4, name: "Paulo", age: 25, email: "Paulo@gmail.com" },
          { id: 5, name: "Lucas", age: 27, email: "Lucas@gmail.com" },
        ]);
      });

      it("deve buscar filtrando para idade maior que 20", () => {
        const res = db.select().from(users).where(gt(users.age, 20)).execute();

        expect(res).toEqual([
          { id: 4, name: "Paulo", age: 25, email: "Paulo@gmail.com" },
          { id: 5, name: "Lucas", age: 27, email: "Lucas@gmail.com" },
        ]);
      });

      it("deve buscar filtrando para idade maior ou Igual a 20", () => {
        const res = db.select().from(users).where(gte(users.age, 20)).execute();

        expect(res).toEqual([
          { id: 2, name: "João", age: 20, email: "joao@gmail.com" },
          { id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" },
          { id: 4, name: "Paulo", age: 25, email: "Paulo@gmail.com" },
          { id: 5, name: "Lucas", age: 27, email: "Lucas@gmail.com" },
        ]);
      });

      it("deve buscar filtrando para idade menor que 20", () => {
        const res = db.select().from(users).where(lt(users.age, 20)).execute();

        expect(res).toEqual([
          { id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" },
        ]);
      });

      it("deve buscar filtrando para idade menor ou igual a 20", () => {
        const res = db.select().from(users).where(lte(users.age, 20)).execute();

        expect(res).toEqual([
          { id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" },
          { id: 2, name: "João", age: 20, email: "joao@gmail.com" },
          { id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" },
        ]);
      });

      it("deve buscar filtrando para idade igual a 20 e nome igual 'Pedro'", () => {
        const res = db
          .select()
          .from(users)
          .where(and(eq(users.age, 20), eq(users.name, "Pedro")))
          .execute();

        expect(res).toEqual([
          { id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" },
        ]);
      });

      it("deve buscar filtrando para idade igual a 20 ou nome igual 'Miguel'", () => {
        const res = db
          .select()
          .from(users)
          .where(or(eq(users.age, 20), eq(users.name, "Miguel")))
          .execute();

        expect(res).toEqual([
          { id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" },
          { id: 2, name: "João", age: 20, email: "joao@gmail.com" },
          { id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" },
        ]);
      });

      it("deve buscar filtrando para idade que não igual a 20", () => {
        const res = db
          .select()
          .from(users)
          .where(not(eq(users.age, 20)))
          .execute();

        expect(res).toEqual([
          { id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" },
          { id: 4, name: "Paulo", age: 25, email: "Paulo@gmail.com" },
          { id: 5, name: "Lucas", age: 27, email: "Lucas@gmail.com" },
        ]);
      });
    });

    describe("Cenarios de Erro", () => {
      it("deve retornar se o tipo da coluna for diferente do tipo do valor passado", () => {
        expect(() => {
          db.select().from(users).where(gt(users.age, "abc")).execute();
        }).toThrow("Erro de tipo: Não é possível comparar number com string");

        expect(() => {
          db.select().from(users).where(gte(users.age, "abc")).execute();
        }).toThrow("Erro de tipo: Não é possível comparar number com string");

        expect(() => {
          db.select().from(users).where(lt(users.age, "abc")).execute();
        }).toThrow("Erro de tipo: Não é possível comparar number com string");

        expect(() => {
          db.select().from(users).where(lte(users.age, "abc")).execute();
        }).toThrow("Erro de tipo: Não é possível comparar number com string");
      });
    });
  });


  describe("limit", () => {
    beforeEach(() => {
      db.insert(users).values({ id: 1, name: "João", age: 20, email: "joao@gmail.com" }).execute()
      db.insert(users).values({ id: 2, name: "Marcos", age: 25, email: "marcos@gmail.com" }).execute()
      db.insert(users).values({ id: 3, name: "Pedro", age: 21, email: "pedro@gmail.com" }).execute()
      db.insert(users).values({ id: 4, name: "Tiago", age: 30, email: "tiago@gmail.com" }).execute()
    })

    describe("Cenários de Sucesso", () => {
      it("deve buscar dados com um limite de duas linhas", () => {
        const res = db.select().from(users).limit(2).execute()

        expect(res).toHaveLength(2)
        expect(res).toEqual([
          { id: 1, name: "João", age: 20, email: "joao@gmail.com" },
          { id: 2, name: "Marcos", age: 25, email: "marcos@gmail.com" }
        ])
      })

      it("deve buscar dados fazendo mapeamento de coluna com um limite de duas linhas", () => {
        const res = db
        .select({ nameUser: users.name })
        .from(users)
        .limit(2)
        .execute()

        expect(res).toHaveLength(2)
        expect(res).toEqual([
          { nameUser: "João" },
          { nameUser: "Marcos" }
        ])
      })

      it("deve buscar dados filtrando, com um limite de duas linhas", () => {
        const res = db
        .select()
        .from(users)
        .where(gt(users.age, 20))
        .limit(2)
        .execute()

        expect(res).toHaveLength(2)
        expect(res).toEqual([
          { id: 2, name: "Marcos", age: 25, email: "marcos@gmail.com" },
          { id: 3, name: "Pedro", age: 21, email: "pedro@gmail.com" }
        ])
      })
    })

    describe("Cenários de Erro", () => {
      it("deve lançar erro se nenhum valor for passado para limit()", () => {
         expect(() => {
          // @ts-ignore
          db.select().from(users).limit(/* vazio */).execute()
        })
        .toThrow("Erro: Nenhum valor foi passado no 'limit'")
      })

      it("deve lançar erro se o valor passado para limit() for menor que 0", () => {
        expect(() => {
          db.select().from(users).limit(-1).execute()
        })
        .toThrow("Erro: O valor do 'limit' não pode ser negativo")
      })
    })
  })
});
