# AQUI Platform Database Scripts

This directory contains database setup and management scripts for the AQUI platform.

## 🚨 IMPORTANT: Database Setup

### Primary Setup Script

**Use ONLY this script for new database setup:**
- `V2_database_setup.sql` - **Single authoritative script** for complete database initialization

This script creates all necessary tables, indexes, triggers, and RLS policies. It should be the only script used for setting up a new database.

### Deprecated/Legacy Scripts

The following scripts have been **REMOVED** as they are now redundant:
- `database-setup.sql` - Replaced by `V2_database_setup.sql`
- `create-missing-tables.js` - Replaced by `V2_database_setup.sql`
- `create-remaining-tables.js` - Replaced by `V2_database_setup.sql`
- `database-recovery.sql` - Replaced by `V2_database_setup.sql`
- `create-admin-table.js` - Replaced by `V2_database_setup.sql`
- `fix-favorites-rls.js` - Replaced by `V2_database_setup.sql`
- `create-admin-direct.js` - Replaced by `V2_database_setup.sql`
- `create-admin.js` - Replaced by `V2_database_setup.sql`
- `setup-admin-auth.js` - Replaced by `V2_database_setup.sql`

## 🔧 Setup Instructions

### For New Databases

1. Run the consolidated setup script:
   ```sql
   -- Copy and paste the contents of V2_database_setup.sql into Supabase SQL Editor
   -- Or run via psql:
   psql -h your-host -U your-user -d your-database -f scripts/V2_database_setup.sql
   ```

2. Verify tables were created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

### For Existing Databases

⚠️ **CAUTION**: Review the `V2_database_setup.sql` script carefully before running on existing databases. The script uses `CREATE TABLE IF NOT EXISTS` to avoid conflicts, but you should verify compatibility with your existing schema.

## 🔐 Security Requirements

### JWT Secret Configuration

**CRITICAL**: The application now requires a proper JWT_SECRET environment variable. The insecure fallback has been removed.

1. Generate a secure JWT secret:
   ```bash
   openssl rand -base64 32
   ```

2. Set the environment variable:
   ```bash
   # In .env.local
   JWT_SECRET=your-generated-secret-here
   ```

3. **Never use the old fallback value** (`your-super-secret-jwt-key-change-this-in-production`)

## 📊 Data Management Scripts

### Mock Data Generation
- `create-mock-users-and-vendors.ts` - Generate test users and vendors
- `correct-vendors.js` - Insert sample vendor data (now uses correct schema)
- `simple-mock-data.js` - Basic mock data insertion

### Testing and Utilities
- `test-manual-join.js` - Test efficient database queries (now optimized)
- `inspect-tables.js` - Inspect database table structure
- `refresh-schema.js` - Refresh schema information

### Admin Management
- `create-admin-user.js` - Create admin users
- `list-admin-users.js` - List existing admin users

## 🐛 Fixed Issues

This update addresses several critical issues:

1. **Database Script Redundancy**: Consolidated multiple redundant table creation scripts into a single authoritative script
2. **JWT Security**: Removed insecure hardcoded JWT fallback values
3. **Schema Consistency**: Fixed incorrect foreign key references (`customer_id` → `user_id`)
4. **Query Optimization**: Replaced inefficient manual joins with Supabase embedded relationships

## 📝 Best Practices

1. **Always use the consolidated setup script** for new databases
2. **Set proper environment variables** before running the application
3. **Test scripts in development** before running in production
4. **Use efficient queries** with Supabase's built-in relationship support
5. **Follow the principle of least privilege** for database access

## 🔍 Troubleshooting

### Common Issues

1. **JWT_SECRET not set**: Application will throw an error on startup
   - Solution: Set the JWT_SECRET environment variable

2. **Table already exists errors**: When running setup on existing database
   - Solution: The script uses `IF NOT EXISTS` - review and run selectively

3. **Foreign key constraint errors**: When inserting test data
   - Solution: Ensure referenced tables (users, vendors) exist first

4. **Permission denied errors**: When running RLS-enabled queries
   - Solution: Use service role key for admin operations

## 📞 Support

For issues with database setup or script execution, check:
1. Supabase dashboard for error logs
2. Application console for detailed error messages
3. Database logs for constraint violations