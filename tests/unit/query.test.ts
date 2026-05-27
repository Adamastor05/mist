import { describe, it, expect, beforeEach } from "@jest/globals";
import { integer, text } from "../../src/core/column";
import { createTable } from "../../src/core/table";
import { createDatabase } from "../../src/core/database";
import { Query } from "../../src/core/query";

describe("Query", () => {
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

  describe("insert e values", () => {

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
  
        expect(res).toBe("Dados inseridos com sucesso!");
        expect(database.tables.users.data[0]).toEqual({
          id: 1,
          name: "lucas",
          age: 20,
          email: "lucas@gmail.com",
        });
      });
    })

    describe("Cenários de Erro", () => {

      it("deve lançar erro se tentar inserir um id duplicado (primaryKey)", () => {
        db.insert(users)
        .values({ id: 1, name: "lucas", age: 20, email: "lucas@gmail.com" })
        .execute();
  
        expect(() => {
          db.insert(users)
          .values({ id: 1, name: "Daniel", age: 22, email: "daniel@gmail.com" })
          .execute()
        }).toThrow("Erro: duplicar valor da chave viola a restrição de unicidade, coluna: 'id' já tem o valor: '1'")
      })
  
      it("deve lançar erro se tentar inserir um registro sem uma coluna obrigatória (notNull)", () => {
        expect(() => {
          db.insert(users)
          .values({
            id: 1,
            // name ausente
            age: 20,
            email: "lucas@gmail.com"
          })
          .execute()
        }).toThrow("Erro: A coluna 'name' é obrigatória e não pode ser nula.")
      })
  
      it("deve lançar erro se tentar inserir um email duplicado (unique)", () => {
        db.insert(users)
        .values({ id: 1, name: "lucas", age: 20, email: "lucas@gmail.com" })
        .execute();
  
        expect(() => {
          db.insert(users)
          .values({ id: 2, name: "Daniel", age: 22, email: "lucas@gmail.com" }) // Mesmo email
          .execute()
        }).toThrow("Erro: duplicar valor da chave viola a restrição de unicidade, coluna: 'email' já tem o valor: 'lucas@gmail.com'")
      })

      it("deve lançar erro se insert() for chamado sem o schema da tabela", () => {
        expect(() => {
          // @ts-ignore: Ignora o TypeScript para forçar o erro em tempo de execução
          db.insert(undefined)
          .values({ id: 1, name: "lucas", age: 20, email: "lucas@gmail.com" })
          .execute();
        }).toThrow("Erro: Nenhuma tabela foi especificada no 'insert'")
      })

      it("deve lançar erro se values() for chamado sem nenhum valor", () => {
        expect(() => {
          db.insert(users)
          // @ts-ignore: Ignora o TypeScript para forçar o erro em tempo de execução
          .values(undefined)
          .execute();
        }).toThrow("Erro: Nenhum valor foi passado no 'values'")
      })

      it("deve lançar erro se alguma coluna passada para values() não existir na tabela", () => {
        expect(() => {
          db.insert(users)
          .values({
            id: 1,
            name: "Lucas",
            age: 20,
            email: "lucas@gmail.com",
            isActive: true // essa coluna não existe
          })
          .execute()
        }).toThrow("ERRO: A coluna isActive não existe no tabela")
      })

      it("deve lançar erro se o tipo do valor inserido for diferente do tipo da coluna", () => {
        expect(() => {
          db.insert(users)
          .values({
            id: "1",
            name: "Lucas",
            age: 20,
            email: "lucas@gmail.com",
          })
          .execute()
        }).toThrow("Erro de tipo: A coluna 'id' espera um integer, mas recebeu string")

         expect(() => {
          db.insert(users)
          .values({
            id: 1,
            name: true,
            age: 20,
            email: "lucas@gmail.com",
          })
          .execute()
        }).toThrow("Erro de tipo: A coluna 'name' espera um text, mas recebeu boolean")
      })
    })
  })

  describe("select e from", () => {

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
    })

    describe("Cenários de Erro", () => {

     it("deve lançar erro se from() for chamado sem o schema da tabela", () => {
       expect(() => {
        db.insert(users)
        .values({ id: 1, name: "lucas", age: 20, email: "lucas@gmail.com" })
        .execute();

        // @ts-ignore: Ignora o TypeScript para forçar o erro em tempo de execução
        db.select().from(undefined).execute()
      }).toThrow("Erro: O schema da table não foi especificado no 'from'")
     })
    })
  })
});
