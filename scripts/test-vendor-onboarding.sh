#!/bin/bash

# Test Runner Script for Vendor Onboarding Redirect Fix
# This script runs all tests related to the vendor onboarding redirect functionality

set -e  # Exit on any error

echo "🧪 Running Vendor Onboarding Redirect Tests"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if test files exist
print_status "Checking test files..."

UNIT_TEST_FILE="tests/unit/vendor-onboarding-redirect.test.ts"
INTEGRATION_TEST_FILE="tests/integration/vendor-onboarding-redirect-integration.test.ts"
TEST_CONFIG_FILE="tests/setup/test-config.ts"

if [ ! -f "$UNIT_TEST_FILE" ]; then
    print_error "Unit test file not found: $UNIT_TEST_FILE"
    exit 1
fi

if [ ! -f "$INTEGRATION_TEST_FILE" ]; then
    print_error "Integration test file not found: $INTEGRATION_TEST_FILE"
    exit 1
fi

if [ ! -f "$TEST_CONFIG_FILE" ]; then
    print_error "Test config file not found: $TEST_CONFIG_FILE"
    exit 1
fi

print_success "All test files found"

# Parse command line arguments
RUN_UNIT=true
RUN_INTEGRATION=true
RUN_HEADED=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --unit-only)
            RUN_INTEGRATION=false
            shift
            ;;
        --integration-only)
            RUN_UNIT=false
            shift
            ;;
        --headed)
            RUN_HEADED=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --unit-only         Run only unit tests"
            echo "  --integration-only  Run only integration tests"
            echo "  --headed           Run integration tests in headed mode (visible browser)"
            echo "  --verbose          Enable verbose output"
            echo "  --help             Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Install dependencies if needed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Check if required test dependencies are installed
if ! npm list @playwright/test > /dev/null 2>&1; then
    print_warning "Playwright not found. Installing..."
    npm install --save-dev @playwright/test
    npx playwright install
fi

if ! npm list jest > /dev/null 2>&1; then
    print_warning "Jest not found. Installing..."
    npm install --save-dev jest @types/jest ts-jest
fi

# Run unit tests
if [ "$RUN_UNIT" = true ]; then
    print_status "Running unit tests..."
    echo "----------------------------------------"
    
    if [ "$VERBOSE" = true ]; then
        npm test -- "$UNIT_TEST_FILE" --verbose
    else
        npm test -- "$UNIT_TEST_FILE"
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Unit tests passed!"
    else
        print_error "Unit tests failed!"
        exit 1
    fi
    echo ""
fi

# Run integration tests
if [ "$RUN_INTEGRATION" = true ]; then
    print_status "Running integration tests..."
    echo "----------------------------------------"
    
    # Build the application first
    print_status "Building application for integration tests..."
    npm run build
    
    if [ $? -ne 0 ]; then
        print_error "Build failed! Cannot run integration tests."
        exit 1
    fi
    
    # Start the application in the background
    print_status "Starting application server..."
    npm run start &
    SERVER_PID=$!
    
    # Wait for server to start
    print_status "Waiting for server to start..."
    sleep 10
    
    # Check if server is running
    if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_error "Server failed to start or is not responding"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    
    print_success "Server started successfully"
    
    # Run Playwright tests
    PLAYWRIGHT_ARGS=""
    if [ "$RUN_HEADED" = true ]; then
        PLAYWRIGHT_ARGS="--headed"
    fi
    
    if [ "$VERBOSE" = true ]; then
        PLAYWRIGHT_ARGS="$PLAYWRIGHT_ARGS --reporter=verbose"
    fi
    
    npx playwright test "$INTEGRATION_TEST_FILE" $PLAYWRIGHT_ARGS
    TEST_RESULT=$?
    
    # Stop the server
    print_status "Stopping application server..."
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    
    if [ $TEST_RESULT -eq 0 ]; then
        print_success "Integration tests passed!"
    else
        print_error "Integration tests failed!"
        exit 1
    fi
    echo ""
fi

# Generate test report
print_status "Generating test report..."
echo "==========================================="
echo "📊 Test Summary"
echo "==========================================="

if [ "$RUN_UNIT" = true ]; then
    echo "✅ Unit tests: PASSED"
fi

if [ "$RUN_INTEGRATION" = true ]; then
    echo "✅ Integration tests: PASSED"
fi

echo ""
print_success "All vendor onboarding redirect tests completed successfully!"
print_status "The redirect fix is working correctly:"
echo "  • Users are redirected to /vendor/dashboard after vendor creation"
echo "  • Users are NOT redirected to /vendor/onboarding/confirmation"
echo "  • Session data is properly updated with vendor information"
echo "  • Error handling works as expected"
echo ""
print_status "You can now deploy the fix with confidence! 🚀"