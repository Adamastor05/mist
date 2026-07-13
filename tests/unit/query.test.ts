import { describe, expect, it } from "@jest/globals"
import { 
  SelectCommand,
  InsertCommand,
  UpdateCommand,
  DeleteCommand,
  Query
} from "../../src/commands"
import { createTable } from "../../src/core/table"
import { integer, text } from "../../src/core/column"
import { createDatabase } from "../../src/core/database"

describe("Query (Despachante)", () => {
  const usersSchema = createTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull()
  })
  const database = createDatabase({ usersSchema })
  const query = new Query(database)

  describe("Instanciação de comandos", () => {
    it("deve retornar uma instância de SelectCommand ao chamar o método select", () => {
      const result = query.select();
      expect(result).toBeInstanceOf(SelectCommand)
    })

    it("deve retornar uma instância de InsertCommand ao chamar o método insert", () => {
      const result = query.insert(usersSchema);
      expect(result).toBeInstanceOf(InsertCommand)
    })

    it("deve retornar uma instância de UpdateCommand ao chamar o método update", () => {
      const result = query.update(usersSchema);
      expect(result).toBeInstanceOf(UpdateCommand)
    })

    it("deve retornar uma instância de DeleteCommand ao chamar o método delete", () => {
      const result = query.delete(usersSchema);
      expect(result).toBeInstanceOf(DeleteCommand)
    })
  })

  describe("Validações de Entrada", () => {
    it("deve lançar erro ao tentar chamar o insert sem passar uma tabela", () => {
      expect(() => query.insert(undefined as any)).toThrow(
        "Erro: Nenhuma tabela foi especificada no 'insert'"
      )
    })

    it("deve lançar erro ao tentar chamar o update sem passar uma tabela", () => {
      expect(() => query.update(undefined as any)).toThrow(
        "Erro: Nenhuma tabela foi especificada no 'update'"
      )
    })

    it("deve lançar erro ao tentar chamar o delete sem passar uma tabela", () => {
      expect(() => query.delete(undefined as any)).toThrow(
        "Erro: Nenhuma tabela foi especificada no 'delete'"
      )
    })
  })
})