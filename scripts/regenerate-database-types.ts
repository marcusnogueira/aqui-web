#!/usr/bin/env tsx
/**
 * Script to regenerate types/database.ts from schema.json
 * This ensures TypeScript types are always in sync with the actual database schema
 */

import * as fs from 'fs';
import * as path from 'path';

interface SchemaColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface TableDefinition {
  [columnName: string]: {
    data_type: string;
    is_nullable: boolean;
    column_default: string | null;
  };
}

interface TablesDefinition {
  [tableName: string]: TableDefinition;
}

// Type mapping from PostgreSQL to TypeScript
const typeMapping: { [key: string]: string } = {
  'uuid': 'string',
  'text': 'string',
  'character varying': 'string',
  'varchar': 'string',
  'integer': 'number',
  'bigint': 'number',
  'smallint': 'number',
  'numeric': 'number',
  'real': 'number',
  'double precision': 'number',
  'boolean': 'boolean',
  'timestamp with time zone': 'string',
  'timestamp without time zone': 'string',
  'time without time zone': 'string',
  'date': 'string',
  'jsonb': 'Json',
  'json': 'Json',
  'ARRAY': 'string[]',
  'name': 'string',
  'USER-DEFINED': 'unknown', // For PostGIS and other custom types
};

// Tables to exclude (system tables, PostGIS tables, etc.)
const excludedTables = new Set([
  'geography_columns',
  'geometry_columns', 
  'spatial_ref_sys',
  'vendors_old' // Legacy table
]);

function mapDataType(dataType: string): string {
  return typeMapping[dataType] || 'unknown';
}

function generateTableInterface(tableName: string, columns: TableDefinition): string {
  const generateFields = (mode: 'Row' | 'Insert' | 'Update') => {
    return Object.entries(columns)
      .map(([columnName, columnInfo]) => {
        const tsType = mapDataType(columnInfo.data_type);
        const isNullable = columnInfo.is_nullable;
        const hasDefault = columnInfo.column_default !== null;
        
        let fieldType = tsType;
        
        // Handle nullability
        if (isNullable) {
          fieldType += ' | null';
        }
        
        // Handle optionality for Insert and Update
        let isOptional = false;
        if (mode === 'Insert') {
          // Fields with defaults or nullable fields can be optional in inserts
          isOptional = hasDefault || isNullable;
        } else if (mode === 'Update') {
          // All fields are optional in updates
          isOptional = true;
        }
        
        const optionalMarker = isOptional ? '?' : '';
        
        return `          ${columnName}${optionalMarker}: ${fieldType}`;
      })
      .join('\n');
  };

  return `      ${tableName}: {
        Row: {
${generateFields('Row')}
        }
        Insert: {
${generateFields('Insert')}
        }
        Update: {
${generateFields('Update')}
        }
      }`;
}

function generateDatabaseTypes(): string {
  // Read and parse schema.json
  const schemaPath = path.join(process.cwd(), 'schema.json');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  const schemaData: SchemaColumn[] = JSON.parse(schemaContent);
  
  // Group columns by table
  const tables: TablesDefinition = {};
  
  schemaData.forEach(column => {
    if (excludedTables.has(column.table_name)) {
      return; // Skip excluded tables
    }
    
    if (!tables[column.table_name]) {
      tables[column.table_name] = {};
    }
    
    tables[column.table_name][column.column_name] = {
      data_type: column.data_type,
      is_nullable: column.is_nullable === 'YES',
      column_default: column.column_default
    };
  });
  
  // Generate the TypeScript interface
  const tableInterfaces = Object.keys(tables)
    .sort() // Sort tables alphabetically
    .map(tableName => generateTableInterface(tableName, tables[tableName]))
    .join('\n');
  
  return `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
${tableInterfaces}
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
`;
}

function main() {
  try {
    console.log('🔄 Regenerating database types from schema.json...');
    
    const databaseTypes = generateDatabaseTypes();
    const outputPath = path.join(process.cwd(), 'types', 'database.ts');
    
    // Ensure types directory exists
    const typesDir = path.dirname(outputPath);
    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir, { recursive: true });
    }
    
    // Write the generated types
    fs.writeFileSync(outputPath, databaseTypes);
    
    console.log('✅ Successfully regenerated types/database.ts');
    console.log('📊 Generated types for the following tables:');
    
    // Read schema again to show which tables were processed
    const schemaPath = path.join(process.cwd(), 'schema.json');
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
    const schemaData: SchemaColumn[] = JSON.parse(schemaContent);
    
    const tableNames = [...new Set(schemaData.map(col => col.table_name))]
      .filter(name => !excludedTables.has(name))
      .sort();
    
    tableNames.forEach(tableName => {
      console.log(`   - ${tableName}`);
    });
    
    console.log('\n🚨 IMPORTANT: The isUserAdmin function needs to be fixed manually.');
    console.log('   It should check the users.is_admin column instead of admin_users.user_id');
    
  } catch (error) {
    console.error('❌ Error regenerating database types:', error);
    process.exit(1);
  }
}

main();