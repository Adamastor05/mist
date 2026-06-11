import { ConfigColumn, DataType } from "../types";

class Column {
  config: ConfigColumn;

  constructor (name: string, dataType: DataType) {
    this.config = {
      name: name,
      dataType: dataType,
      notNull: false,
      unique: false,
      primaryKey: false,
      keySchema: ""
    }
  }
  
  primaryKey() {
    this.config.primaryKey = true
    this.config.unique = true
    this.config.notNull = true
    return this
  }

  notNull() {
    this.config.notNull = true
    return this
  }

  unique() {
    this.config.unique = true
    return this
  }
}

export const integer = (name: string) => new Column(name, "integer")
export const text = (name: string) => new Column(name, "text")
export const boolean = (name: string) => new Column(name, "boolean")
export const decimal = (name: string) => new Column(name, "decimal")