import { describe, it, expect, beforeEach } from "@jest/globals";
import { boolean, date, decimal, integer, text } from "../../src/core/column";
import { createTable } from "../../src/core/table";
import { createDatabase } from "../../src/core/database";
import { Query } from "../../src/core/query";
import { eq, ne, gt, gte, lt, lte, and, or, not } from "../../src/core/operators"

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
  
        expect(res).toBe("Dados inseridos com sucesso!");
        expect(database.tables.users.data[0]).toEqual({
          id: 1,
          name: "lucas",
          age: null,
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

      it("deve lançar erro se coluna do tipo boolean receber valor diferente", () => {
        const players = createTable("players", {
          id: integer("id").primaryKey(),
          nickName: text("nick_name").notNull(),
          points: decimal("points").notNull(),
          isChampion: boolean("is_champion").notNull()
        })
        const database = createDatabase({ players })
        const db = new Query(database)
        
        expect(() => {
          db.insert(players)
          .values({ 
            id: 1,
            nickName: "adan23",
            points: 8.5,
            // (ERRO) coluna de tipo boolean recebendo um string 
            isChampion: "string"
          })
        }).toThrow(`Erro de tipo: A coluna 'isChampion' espera um boolean, mas recebeu string`)
      })

      it("deve lançar erro se coluna do tipo decimal receber valor diferente", () => {
        const players = createTable("players", {
          id: integer("id").primaryKey(),
          nickName: text("nick_name").notNull(),
          points: decimal("points").notNull(),
          isChampion: boolean("is_champion").notNull()
        })
        const database = createDatabase({ players })
        const db = new Query(database)
        
        expect(() => {
          db.insert(players)
          .values({ 
            id: 1,
            nickName: "adan23",
            // (ERRO) coluna de tipo boolean recebendo um integer 
            points: 8,
            isChampion: true
          })
        }).toThrow(`Erro de tipo: A coluna 'points' espera um decimal, mas recebeu integer`)

        expect(() => {
          db.insert(players)
          .values({ 
            id: 2,
            nickName: "adan23",
            // (ERRO) coluna de tipo boolean recebendo um string 
            points: "string",
            isChampion: true
          })
        }).toThrow(`Erro de tipo: A coluna 'points' espera um decimal, mas recebeu string`)
      })

      it("deve lançar erro se coluna do tipo date receber valor diferente", () => {
        const players = createTable("players", {
          id: integer("id").primaryKey(),
          name: text("name").notNull(),
          createdAt: date("created_at").notNull()
        })
        const database = createDatabase({ players })
        const db = new Query(database)

        expect(() => {
          db.insert(players)
          .values({ 
            id: 2,
            name: "Miguel",
            // (ERRO) coluna de tipo dete recebendo um integer 
            createdAt: 10
          })
        }).toThrow(`Erro de tipo: A coluna 'createdAt' espera um date valido, mas recebeu number`)
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

  describe("where", () => {
    beforeEach(() => {
      db.insert(users).values({ id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" }).execute()
      db.insert(users).values({ id: 2, name: "João", age: 20, email: "joao@gmail.com" }).execute()
      db.insert(users).values({ id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" }).execute()
      db.insert(users).values({ id: 4, name: "Paulo", age: 25, email: "Paulo@gmail.com" }).execute()
      db.insert(users).values({ id: 5, name: "Lucas", age: 27, email: "Lucas@gmail.com" }).execute()
    })
    
    describe("Cenários de Sucesso", () => {
      
      it("deve buscar filtrando para idade igual que 20", () => {
        const res = db.select()
        .from(users)
        .where(eq(users.age, 20))
        .execute()

        expect(res).toEqual([
          { id: 2, name: "João", age: 20, email: "joao@gmail.com" },
          { id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" }
        ])
      })

      it("deve buscar filtrando para idade diferente de 20", () => {
        const res = db.select()
        .from(users)
        .where(ne(users.age, 20))
        .execute()

        expect(res).toEqual([
          { id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" },
          { id: 4, name: "Paulo", age: 25, email: "Paulo@gmail.com" },
          { id: 5, name: "Lucas", age: 27, email: "Lucas@gmail.com" }
        ])
      })

      it("deve buscar filtrando para idade maior que 20", () => {
        const res = db.select()
        .from(users)
        .where(gt(users.age, 20))
        .execute()

        expect(res).toEqual([
          { id: 4, name: "Paulo", age: 25, email: "Paulo@gmail.com" },
          { id: 5, name: "Lucas", age: 27, email: "Lucas@gmail.com" }
        ])
      })

      it("deve buscar filtrando para idade maior ou Igual a 20", () => {
        const res = db.select()
        .from(users)
        .where(gte(users.age, 20))
        .execute()

        expect(res).toEqual([
          { id: 2, name: "João", age: 20, email: "joao@gmail.com" },
          { id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" },
          { id: 4, name: "Paulo", age: 25, email: "Paulo@gmail.com" },
          { id: 5, name: "Lucas", age: 27, email: "Lucas@gmail.com" }
        ])
      })

      it("deve buscar filtrando para idade menor que 20", () => {
        const res = db.select()
        .from(users)
        .where(lt(users.age, 20))
        .execute()

        expect(res).toEqual([
          { id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" },
        ])
      })

      it("deve buscar filtrando para idade menor ou igual a 20", () => {
        const res = db.select()
        .from(users)
        .where(lte(users.age, 20))
        .execute()

        expect(res).toEqual([
          { id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" },
          { id: 2, name: "João", age: 20, email: "joao@gmail.com" },
          { id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" }
        ])
      })

      it("deve buscar filtrando para idade igual a 20 e nome igual 'Pedro'", () => {
        const res = db.select()
        .from(users)
        .where(and(
          eq(users.age, 20), 
          eq(users.name, "Pedro")
        ))
        .execute()

        expect(res).toEqual([
          { id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" }
        ])
      })

      it("deve buscar filtrando para idade igual a 20 ou nome igual 'Miguel'", () => {
        const res = db.select()
        .from(users)
        .where(or(
          eq(users.age, 20), 
          eq(users.name, "Miguel")
        ))
        .execute()

        expect(res).toEqual([
          { id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" },
          { id: 2, name: "João", age: 20, email: "joao@gmail.com" },
          { id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" }
        ])
      })

      it("deve buscar filtrando para idade que não igual a 20", () => {
        const res = db.select()
        .from(users)
        .where(not(
          eq(users.age, 20) 
        ))
        .execute()

        expect(res).toEqual([
          { id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" },
          { id: 4, name: "Paulo", age: 25, email: "Paulo@gmail.com" },
          { id: 5, name: "Lucas", age: 27, email: "Lucas@gmail.com" }
        ])
      })
    })

    describe("Cenarios de Erro", () => {
      
      it("deve retornar se o tipo da coluna for diferente do tipo do valor passado", () => {
        expect(() => {
          db.select().from(users).where(gt(users.age, "abc")).execute()
        }).toThrow("Erro de tipo: Não é possível comparar number com string")

        expect(() => {
          db.select().from(users).where(gte(users.age, "abc")).execute()
        }).toThrow("Erro de tipo: Não é possível comparar number com string")

        expect(() => {
          db.select().from(users).where(lt(users.age, "abc")).execute()
        }).toThrow("Erro de tipo: Não é possível comparar number com string")

        expect(() => {
          db.select().from(users).where(lte(users.age, "abc")).execute()
        }).toThrow("Erro de tipo: Não é possível comparar number com string")
      })
    })
  })

  describe("update e set", () => {

    beforeEach(() => {
      db.insert(users).values({ id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" }).execute()
      db.insert(users).values({ id: 2, name: "Paulo", age: 25, email: "Paulo@gmail.com" }).execute()
    })

    describe("Casos de sucesso", () => {
      it("deve atualizar o nome do usuario que tiver id igual a 1", () => {
        const res = db
        .update(users)
        .set({ name: "Pedro" })
        .where(eq(users.id, 1))
        .execute()

        expect(res).toBe("Dados atualizados com sucesso!")
        expect(database.tables.users.data[0]).toEqual({ id: 1, name: "Pedro", age: 18, email: "miguel@gmail.com" })
      })

      it("deve atualizar o nome e o email do usuario que tiver id igual a 1", () => {
        const res = db
        .update(users)
        .set({ name: "Pedro", email: "pedro@gmail.com" })
        .where(eq(users.id, 1))
        .execute()

        expect(res).toBe("Dados atualizados com sucesso!")
        expect(database.tables.users.data[0]).toEqual({ id: 1, name: "Pedro", age: 18, email: "pedro@gmail.com" })
      })

      it("deve atualizar o nome de todos os usuarios", () => {
       const res = db
        .update(users)
        .set({ name: "Pedro" })
        .execute()

        expect(res).toBe("Dados atualizados com sucesso!")
        expect(database.tables.users.data).toEqual([
          { id: 1, name: "Pedro", age: 18, email: "miguel@gmail.com" },
          { id: 2, name: "Pedro", age: 25, email: "Paulo@gmail.com" }
        ])
      })
    })

    describe("Cenarios de Erro", () => {

      it("deve lançar erro se updade() for chamado sem schemaTable", () => {
        expect(() => {
          // @ts-ignore: Ignora o TypeScript para forçar o erro em tempo de execução
          db.update().set({ name: "Pedro" }).execute()
        }).toThrow("Erro: O schema da table não foi especificado no 'update'");
        
      })

      it("deve lançar erro se set() for chamado sem values", () => {
        expect(() => {
          // @ts-ignore: Ignora o TypeScript para forçar o erro em tempo de execução
          db.update(users).set().execute()
        }).toThrow("Erro: Nenhum valor foi passado no 'set'")
      })
    })
  })

  describe("delete", () => {
    beforeEach(() => {
      db.insert(users).values({ id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" }).execute()
      db.insert(users).values({ id: 2, name: "João", age: 20, email: "joao@gmail.com" }).execute()
      db.insert(users).values({ id: 3, name: "Pedro", age: 20, email: "Pedro@gmail.com" }).execute()
      db.insert(users).values({ id: 4, name: "Paulo", age: 25, email: "Paulo@gmail.com" }).execute()
      db.insert(users).values({ id: 5, name: "Lucas", age: 27, email: "Lucas@gmail.com" }).execute()
    })

    describe("Casos de Sucesso", () => {
      
      it("deve deletar todos os valores corretamente", () => {
        const res = db.delete(users).execute()

        expect(res).toBe("Valores removidos com sucesso!")
        expect(database.tables.users.data).toEqual([])
      })

      it("deve deletar os valores que satisfazerem a condição", () => {
        const res = db.delete(users).where(gte(users.age, 20)).execute()

        expect(res).toBe("Valor(es) removido(s) com sucesso!")
        expect(database.tables.users.data).toEqual([
          { id: 1, name: "Miguel", age: 18, email: "miguel@gmail.com" }
        ])
      })
    })

    describe("Casos de Erro", () => {
      it("deve lançar erro se delete() for chamado sem schemaTable", () => {
        expect(() => {
          // @ts-ignore: Ignora o TypeScript para forçar o erro em tempo de execução
          db.delete().execute()
        }).toThrow("Erro: O schema da table não foi especificado no 'delete'");
      })
    })
  })
});
