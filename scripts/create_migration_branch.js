#!/usr/bin/env node

/**
 * Creates a dedicated migration branch for NextAuth implementation
 * Sets up tracking files and provides migration guidance
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  console.log(`${description}...`);
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`${description} completed`);
    return result.trim();
  } catch (error) {
    console.error(`${description} failed:`, error.message);
    throw error;
  }
}

async function createMigrationBranch() {
  try {
    console.log('CREATING MIGRATION BRANCH...\n');
    
    // 1. Check git status and commit any changes
    console.log('Checking git status...');
    try {
      const status = runCommand('git status --porcelain', 'Getting git status');
      if (status) {
        console.log('WARNING: Uncommitted changes found:');
        console.log(status);
        console.log('\nCommitting changes before creating migration branch...');
        runCommand('git add .', 'Staging changes');
        runCommand('git commit -m "Pre-migration: Save current state before NextAuth migration"', 'Committing changes');
      }
    } catch (error) {
      // Ignore git errors for now
    }

    // 2. Create and switch to migration branch
    const branchName = 'feature/nextauth-migration';
    console.log(`\nCreating branch: ${branchName}`);
    
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
    console.log(`Migration status file created: ${statusFile}`);

    // 4. Create migration README
    const migrationReadme = `# NextAuth Migration Progress

## Current Status: Phase 1 - Validation & Backup

### Migration Phases:
1. **Phase 1: Validation & Backup** (Current)
   - Validate current auth system
   - Backup admin users and policies
   - Document current state

2. **Phase 2: Database Schema**
   - Update user tables for NextAuth compatibility
   - Migrate existing user data
   - Test data integrity

3. **Phase 3: API Routes**
   - Implement NextAuth API routes
   - Update authentication middleware
   - Test API endpoints

4. **Phase 4: Frontend Integration**
   - Update login/signup components
   - Implement session management
   - Test user flows

5. **Phase 5: Cleanup & Testing**
   - Remove old auth code
   - Comprehensive testing
   - Performance validation

### Rollback Plan:
- All changes are tracked in git
- Database backups are created before each phase
- Each phase can be rolled back independently

### Current Branch: ${branchName}

### Next Steps:
1. Run validation: \`node scripts/pre_migration_validation.js\`
2. Backup admin users: \`node scripts/backup_admin_users.js\`
3. Begin Phase 2: Database Schema Migration

### Important Files:
- \`MIGRATION_STATUS.json\` - Track progress
- \`MIGRATION_README.md\` - This file
- \`scripts/\` - Migration scripts

### Emergency Contacts:
- Lead Developer: [Add contact info]
- Database Admin: [Add contact info]

---
*Migration started: ${new Date().toISOString()}*
`;

    const readmeFile = path.join(__dirname, '..', 'MIGRATION_README.md');
    fs.writeFileSync(readmeFile, migrationReadme);
    console.log(`Migration README created: ${readmeFile}`);

    // 5. Commit migration setup
    runCommand('git add .', 'Staging migration files');
    runCommand('git commit -m "feat: Setup NextAuth migration branch and tracking"', 'Committing migration setup');

    // 6. Display summary
    console.log('\nMIGRATION BRANCH SETUP COMPLETE!');
    console.log('='.repeat(50));
    console.log(`Branch: ${branchName}`);
    console.log(`Status File: MIGRATION_STATUS.json`);
    console.log(`README: MIGRATION_README.md`);
    
    console.log('\nNEXT STEPS:');
    console.log('1. Run validation: node scripts/pre_migration_validation.js');
    console.log('2. Backup admin users: node scripts/backup_admin_users.js');
    console.log('3. Begin Phase 2: Database Schema Migration');
    
    console.log('\nBRANCH COMMANDS:');
    console.log(`Current branch: ${runCommand('git branch --show-current', 'Get current branch')}`);
    console.log('Switch to main: git checkout main');
    console.log(`Switch back: git checkout ${branchName}`);

  } catch (error) {
    console.error('Migration branch setup failed:', error.message);
    throw error;
  }
}

// Run setup
createMigrationBranch()
  .then(() => {
    console.log('\nReady to begin NextAuth migration!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });