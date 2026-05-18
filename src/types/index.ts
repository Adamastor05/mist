
export type SchemaTable<TColumn = {}> = {
  __nameTable: string;
  __nameColumns: string[];
} & TColumn  & {
  [key: string]: Column
}

export type DataType = "integer" | "text" | "boolean";

export interface ConfigColumn {
    name: string;
    dataType:  DataType;
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
