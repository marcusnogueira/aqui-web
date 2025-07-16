#!/usr/bin/env node

/**
 * Migration Branch Setup Script
 * 
 * This script creates a new git branch for the NextAuth migration
 * and sets up the development environment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  try {
    console.log(`🔄 ${description}...`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return output.trim();
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

async function createMigrationBranch() {
  console.log('🌿 CREATING MIGRATION BRANCH...\n');

  try {
    // 1. Check git status
    console.log('📋 Checking git status...');
    const status = runCommand('git status --porcelain', 'Git status check');
    
    if (status) {
      console.log('⚠️  Uncommitted changes found:');
      console.log(status);
      console.log('\\nCommitting current changes before creating branch...');
      
      runCommand('git add .', 'Staging changes');
      runCommand('git commit -m "Pre-migration: Save current state before NextAuth migration"', 'Committing changes');
    }

    // 2. Create and switch to migration branch
    const branchName = 'feature/nextauth-migration';
    console.log(`\\n🌿 Creating branch: ${branchName}`);
    
    try {
      runCommand(`git checkout -b ${branchName}`, 'Creating migration branch');
    } catch (error) {
      // Branch might already exist
      console.log('Branch might already exist, switching to it...');
      runCommand(`git checkout ${branchName}`, 'Switching to migration branch');
    }

    // 3. Create migration tracking file
    const migrationStatus = {
      created: new Date().toISOString(),
      branch: branchName,
      phases: {
        'phase1_validation': { status: 'in_progress', started: new Date().toISOString() },
        'phase2_database': { status: 'pending' },
        'phase3_api_routes': { status: 'pending' },
        'phase4_frontend': { status: 'pending' },
        'phase5_cleanup': { status: 'pending' }
      },
      backups: {
        admin_users: null,
        database_policies: null
      },
      rollback_available: true
    };

    const statusFile = path.join(__dirname, '..', 'MIGRATION_STATUS.json');
    fs.writeFileSync(statusFile, JSON.stringify(migrationStatus, null, 2));
    console.log(`✅ Migration status file created: ${statusFile}`);

    // 4. Create migration README
    const migrationReadme = `# NextAuth Migration Progress

## Current Status: Phase 1 - Validation & Backup

### Migration Branch: \`${branchName}\`
Created: ${new Date().toISOString()}

## Phase Progress
- [x] Phase 1: Pre-Migration Validation & Backup (IN PROGRESS)
- [ ] Phase 2: Database Schema Migration
- [ ] Phase 3: API Routes Migration  
- [ ] Phase 4: Frontend Component Migration
- [ ] Phase 5: Cleanup & Optimization

## Quick Commands

### Validation & Backup
\`\`\`bash
# Run pre-migration validation
node scripts/pre_migration_validation.js

# Backup admin users
node scripts/backup_admin_users.js

# Check migration status
cat MIGRATION_STATUS.json
\`\`\`

### Testing
\`\`\`bash
# Test current build
npm run build

# Run development server
npm run dev
\`\`\`

### Rollback (if needed)
\`\`\`bash
# Switch back to main branch
git checkout main

# Delete migration branch (if needed)
git branch -D ${branchName}
\`\`\`

## Migration Notes
- Starting fresh with users (except admin users)
- Admin users will be migrated from current system
- All Supabase Auth dependencies will be removed
- RLS policies will be updated for NextAuth compatibility

## Files Modified During Migration
- Database RLS policies
- API route authentication
- Frontend authentication components
- Environment configuration

## Backup Locations
- Admin users: \`backups/admin_users_backup_*.json\`
- Database policies: \`backups/rls_policies_backup_*.sql\`
- Migration scripts: \`scripts/\`
`;

    const readmeFile = path.join(__dirname, '..', 'MIGRATION_README.md');
    fs.writeFileSync(readmeFile, migrationReadme);
    console.log(`✅ Migration README created: ${readmeFile}`);

    // 5. Commit migration setup
    runCommand('git add .', 'Staging migration files');
    runCommand('git commit -m "feat: Setup NextAuth migration branch and tracking"', 'Committing migration setup');

    // 6. Display summary
    console.log('\\n🎉 MIGRATION BRANCH SETUP COMPLETE!');
    console.log('='.repeat(50));
    console.log(`Branch: ${branchName}`);
    console.log(`Status File: MIGRATION_STATUS.json`);
    console.log(`README: MIGRATION_README.md`);
    
    console.log('\\n🚀 NEXT STEPS:');
    console.log('1. Run validation: node scripts/pre_migration_validation.js');
    console.log('2. Backup admin users: node scripts/backup_admin_users.js');
    console.log('3. Begin Phase 2: Database Schema Migration');
    
    console.log('\\n📋 BRANCH COMMANDS:');
    console.log(`Current branch: ${runCommand('git branch --show-current', 'Get current branch')}`);
    console.log('Switch to main: git checkout main');
    console.log(`Switch back: git checkout ${branchName}`);

  } catch (error) {
    console.error('💥 Migration branch setup failed:', error.message);
    throw error;
  }
}

// Run setup
createMigrationBranch()
  .then(() => {
    console.log('\\n✅ Ready to begin NextAuth migration!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });