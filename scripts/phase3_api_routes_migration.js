#!/usr/bin/env node

/**
 * Phase 3: API Routes Migration
 * 
 * This script identifies and helps migrate API routes from Supabase Auth to NextAuth.
 * It analyzes the current API routes and provides migration guidance.
 */

const fs = require('fs');
const path = require('path');

function findAPIRoutes() {
  const apiDir = path.join(__dirname, '..', 'app', 'api');
  const routes = [];
  
  function scanDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativeItemPath = path.join(relativePath, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        scanDirectory(fullPath, relativeItemPath);
      } else if (item === 'route.ts' || item === 'route.js') {
        routes.push({
          path: relativeItemPath.replace('/route.ts', '').replace('/route.js', ''),
          file: fullPath,
          relativePath: path.join('app', 'api', relativeItemPath)
        });
      }
    }
  }
  
  if (fs.existsSync(apiDir)) {
    scanDirectory(apiDir);
  }
  
  return routes;
}

function analyzeRoute(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  const analysis = {
    hasSupabaseAuth: false,
    hasNextAuth: false,
    hasCreateSupabaseClient: false,
    hasAuthCheck: false,
    needsMigration: false,
    issues: []
  };
  
  // Check for Supabase Auth usage
  if (content.includes('supabase.auth.') || content.includes('auth.uid()') || content.includes('auth.role()')) {
    analysis.hasSupabaseAuth = true;
    analysis.needsMigration = true;
    analysis.issues.push('Uses Supabase Auth functions');
  }
  
  // Check for NextAuth usage
  if (content.includes('import { auth }') || content.includes('useSession') || content.includes('getSession')) {
    analysis.hasNextAuth = true;
  }
  
  // Check for Supabase client creation
  if (content.includes('createSupabaseServerClient') || content.includes('createClient')) {
    analysis.hasCreateSupabaseClient = true;
  }
  
  // Check for authentication checks
  if (content.includes('session') || content.includes('user') || content.includes('auth')) {
    analysis.hasAuthCheck = true;
  }
  
  // Check if it needs user context setting
  if (analysis.hasCreateSupabaseClient && analysis.hasAuthCheck && !content.includes('set_current_user_context')) {
    analysis.needsMigration = true;
    analysis.issues.push('Needs user context setting for RLS');
  }
  
  return analysis;
}

function generateMigrationPlan() {
  console.log('🔍 ANALYZING API ROUTES FOR NEXTAUTH MIGRATION...\n');
  
  const routes = findAPIRoutes();
  const migrationPlan = {
    total: routes.length,
    needsMigration: 0,
    completed: 0,
    routes: []
  };
  
  console.log(`📋 Found ${routes.length} API routes to analyze:\n`);
  
  for (const route of routes) {
    const analysis = analyzeRoute(route.file);
    
    const routeInfo = {
      ...route,
      ...analysis,
      priority: 'low'
    };
    
    // Determine priority
    if (route.path.startsWith('/admin')) {
      routeInfo.priority = 'high';
    } else if (route.path.startsWith('/user') || route.path.startsWith('/auth')) {
      routeInfo.priority = 'medium';
    }
    
    if (analysis.needsMigration) {
      migrationPlan.needsMigration++;
    } else {
      migrationPlan.completed++;
    }
    
    migrationPlan.routes.push(routeInfo);
    
    // Display analysis
    const status = analysis.needsMigration ? '❌ NEEDS MIGRATION' : '✅ OK';
    const priority = routeInfo.priority.toUpperCase();
    
    console.log(`${status} [${priority}] ${route.path}`);
    console.log(`   File: ${route.relativePath}`);
    
    if (analysis.issues.length > 0) {
      analysis.issues.forEach(issue => {
        console.log(`   ⚠️  ${issue}`);
      });
    }
    
    console.log('');
  }
  
  return migrationPlan;
}

function displayMigrationSummary(plan) {
  console.log('📊 MIGRATION SUMMARY:');
  console.log('='.repeat(50));
  console.log(`Total API Routes: ${plan.total}`);
  console.log(`Need Migration: ${plan.needsMigration}`);
  console.log(`Already Compatible: ${plan.completed}`);
  
  const highPriority = plan.routes.filter(r => r.priority === 'high' && r.needsMigration);
  const mediumPriority = plan.routes.filter(r => r.priority === 'medium' && r.needsMigration);
  const lowPriority = plan.routes.filter(r => r.priority === 'low' && r.needsMigration);
  
  console.log(`\n🔥 HIGH PRIORITY (${highPriority.length}):`);
  highPriority.forEach(route => {
    console.log(`   - ${route.path}`);
  });
  
  console.log(`\n⚡ MEDIUM PRIORITY (${mediumPriority.length}):`);
  mediumPriority.forEach(route => {
    console.log(`   - ${route.path}`);
  });
  
  console.log(`\n📝 LOW PRIORITY (${lowPriority.length}):`);
  lowPriority.forEach(route => {
    console.log(`   - ${route.path}`);
  });
}

function generateMigrationSteps(plan) {
  console.log('\n🚀 MIGRATION STEPS:');
  console.log('='.repeat(50));
  
  console.log('\n1. CREATE USER CONTEXT HELPER:');
  console.log('   Create lib/nextauth-context.ts for setting user context in RLS');
  
  console.log('\n2. UPDATE HIGH PRIORITY ROUTES:');
  const highPriority = plan.routes.filter(r => r.priority === 'high' && r.needsMigration);
  highPriority.forEach((route, index) => {
    console.log(`   ${index + 1}. ${route.path}`);
    console.log(`      - Remove Supabase Auth dependencies`);
    console.log(`      - Add NextAuth session handling`);
    console.log(`      - Set user context for RLS`);
  });
  
  console.log('\n3. UPDATE MEDIUM PRIORITY ROUTES:');
  const mediumPriority = plan.routes.filter(r => r.priority === 'medium' && r.needsMigration);
  mediumPriority.forEach((route, index) => {
    console.log(`   ${index + 1}. ${route.path}`);
  });
  
  console.log('\n4. UPDATE LOW PRIORITY ROUTES:');
  const lowPriority = plan.routes.filter(r => r.priority === 'low' && r.needsMigration);
  lowPriority.forEach((route, index) => {
    console.log(`   ${index + 1}. ${route.path}`);
  });
  
  console.log('\n5. TEST ALL ROUTES:');
  console.log('   - Verify authentication works');
  console.log('   - Test RLS policies');
  console.log('   - Validate user permissions');
}

// Run the analysis
function runPhase3Analysis() {
  console.log('🚀 PHASE 3: API ROUTES MIGRATION ANALYSIS\n');
  
  const plan = generateMigrationPlan();
  displayMigrationSummary(plan);
  generateMigrationSteps(plan);
  
  // Save migration plan
  const planFile = path.join(__dirname, '..', 'api_migration_plan.json');
  fs.writeFileSync(planFile, JSON.stringify(plan, null, 2));
  console.log(`\n💾 Migration plan saved to: api_migration_plan.json`);
  
  console.log('\n🎯 NEXT ACTIONS:');
  console.log('1. Review the migration plan above');
  console.log('2. Start with creating the user context helper');
  console.log('3. Migrate high priority routes first');
  console.log('4. Test each route after migration');
  
  return plan;
}

// Run the analysis
runPhase3Analysis();