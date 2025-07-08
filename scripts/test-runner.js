#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${description}`, 'cyan');
  log(`Running: ${command}`, 'yellow');
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit', 
      cwd: path.join(__dirname, '..') 
    });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

function showHelp() {
  log('\n🎭 Playwright Test Runner for AQUI Application', 'bright');
  log('\nUsage: node scripts/test-runner.js [command]', 'cyan');
  log('\nAvailable commands:', 'yellow');
  log('  all          - Run all tests');
  log('  homepage     - Run homepage tests only');
  log('  admin        - Run admin panel tests only');
  log('  navigation   - Run navigation tests only');
  log('  performance  - Run performance tests only');
  log('  accessibility- Run accessibility tests only');
  log('  headed       - Run tests with visible browser');
  log('  debug        - Run tests in debug mode');
  log('  report       - Show test report');
  log('  install      - Install Playwright browsers');
  log('  help         - Show this help message');
  log('');
}

function main() {
  const command = process.argv[2] || 'help';
  
  log('🎭 AQUI Playwright Test Runner', 'bright');
  
  switch (command.toLowerCase()) {
    case 'all':
      runCommand('npx playwright test', 'Running all tests');
      break;
      
    case 'homepage':
      runCommand('npx playwright test tests/e2e/homepage.spec.ts', 'Running homepage tests');
      break;
      
    case 'admin':
      runCommand('npx playwright test tests/e2e/admin.spec.ts', 'Running admin panel tests');
      break;
      
    case 'navigation':
      runCommand('npx playwright test tests/e2e/navigation.spec.ts', 'Running navigation tests');
      break;
      
    case 'performance':
      runCommand('npx playwright test tests/e2e/performance.spec.ts', 'Running performance tests');
      break;
      
    case 'accessibility':
      runCommand('npx playwright test tests/e2e/accessibility.spec.ts', 'Running accessibility tests');
      break;
      
    case 'headed':
      runCommand('npx playwright test --headed', 'Running tests with visible browser');
      break;
      
    case 'debug':
      runCommand('npx playwright test --debug', 'Running tests in debug mode');
      break;
      
    case 'report':
      runCommand('npx playwright show-report', 'Opening test report');
      break;
      
    case 'install':
      runCommand('npx playwright install', 'Installing Playwright browsers');
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = { runCommand, log };