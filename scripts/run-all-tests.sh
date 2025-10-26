#!/bin/bash

# Run All Tests Script
# This script runs the complete test suite in sequence

set -e  # Exit on error

echo "🧪 Running Complete Test Suite"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED_TESTS=()

# Function to run a test suite
run_test_suite() {
  local name=$1
  local command=$2
  
  echo -e "${YELLOW}▶ Running ${name}...${NC}"
  if eval "$command"; then
    echo -e "${GREEN}✓ ${name} passed${NC}"
    echo ""
  else
    echo -e "${RED}✗ ${name} failed${NC}"
    FAILED_TESTS+=("$name")
    echo ""
  fi
}

# Start timer
START_TIME=$(date +%s)

# Run test suites
run_test_suite "Lint" "npm run lint"
run_test_suite "TypeScript Check" "npm run typecheck"
run_test_suite "Unit Tests" "npm run test:unit -- --coverage --maxWorkers=2"
run_test_suite "Integration Tests" "npm run test:integration -- --maxWorkers=2"

# Optional: E2E tests (comment out if not needed)
# echo -e "${YELLOW}▶ Building app for E2E tests...${NC}"
# npm run test:e2e:build
# run_test_suite "E2E Tests" "npm run test:e2e"

# End timer
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo "================================"
echo ""

# Summary
if [ ${#FAILED_TESTS[@]} -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo "Total time: ${MINUTES}m ${SECONDS}s"
  exit 0
else
  echo -e "${RED}❌ Some tests failed:${NC}"
  for test in "${FAILED_TESTS[@]}"; do
    echo -e "${RED}  - ${test}${NC}"
  done
  echo "Total time: ${MINUTES}m ${SECONDS}s"
  exit 1
fi
