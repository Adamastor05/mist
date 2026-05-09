
export type SchemaTable = {
  __nameTable: string;
  __nameColumns: string[];
} & {
  [key: string]: Column | any;
};

export type DataType = "integer" | "text";

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
}

export interface Database {
  tables: { [key: string]: Table };
}
