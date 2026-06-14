
export type SchemaTable<TColumn = {}> = {
  __nameTable: string;
  __nameColumns: string[];
} & TColumn  & {
  [key: string]: Column
}

export type ColumnType = "integer" | "text" | "boolean" | "decimal" | "date";

export interface ConfigColumn {
    name: string;
    columnType:  ColumnType;
    primaryKey: boolean;
    notNull: boolean;
    unique: boolean;
    keySchema: string;
}

export interface Column {
  config: ConfigColumn
}

export interface LineTable {
  [key: string]: any;
}

export interface Table {
  config: SchemaTable;
  data: LineTable[];
  indexes: Record<string, Set<any>>
}

export interface Database {
  tables: { [key: string]: Table };
}


export type Condition = 
  | {
      type: "binary",
      columnName: string,
      operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte",
      value: any
    }
  | {
      type: "logical",
      operator: "and" | "or",
      conditions: Condition[]
    }
  | {
    type: "logical",
    operator: "not",
    condition: Condition
  }