import { Condition } from "../types";

export abstract class WhereCommand {
    protected tempWhereCondition: Condition | null = null;
    
    where(condition: Condition): this {
    if (!condition) throw new Error("Erro: Nenhuma condição foi passada para where.");

    this.tempWhereCondition = condition;
    return this;
  }

  protected evalCondition(line: Record<string, any>, condition: Condition): boolean {
    if (!this.tempWhereCondition) throw new Error("[Mist] Erro interno: A condição temporária 'tempWhereCondition' não existe");
    
    if (condition.type === "binary") {
    const { columnName, operator, value } = condition
    const columnValue = line[columnName]

      switch (operator) {
        case "eq": return columnValue === value
        case "ne": return columnValue !== value 

        case "gt":
          // Retorna erro se os tipos forem diferentes
          if (typeof columnValue !== typeof value) { 
            throw new Error(`Erro de tipo: Não é possível comparar ${typeof columnValue} com ${typeof value}`)
          }
          return columnValue > value

        case "gte":
          if (typeof columnValue !== typeof value) { 
            throw new Error(`Erro de tipo: Não é possível comparar ${typeof columnValue} com ${typeof value}`)
          }
          return columnValue >= value

        case "lt": 
           if (typeof columnValue !== typeof value) { 
            throw new Error(`Erro de tipo: Não é possível comparar ${typeof columnValue} com ${typeof value}`)
          }
          return columnValue < value

        case "lte": 
           if (typeof columnValue !== typeof value) { 
            throw new Error(`Erro de tipo: Não é possível comparar ${typeof columnValue} com ${typeof value}`)
          }
          return columnValue <= value

        default: return false
      }
    }

    if (condition.type === "logical") {
      if (condition.operator === "and") {
        // .every() garante que TODAS as sub-condições retornem true, se não ele retorna false
        return condition.conditions.every(subCond => this.evalCondition(line, subCond)) 
      }

      if (condition.operator === "or") {
        // .some() garante que pelo menos UMA sub-condição retorne true, se não ele retorna false
        return condition.conditions.some(subCond => this.evalCondition(line, subCond))
      }

      if (condition.operator === "not") {
        return !this.evalCondition(line, condition.condition)
      }
    }

    return false
  }
}