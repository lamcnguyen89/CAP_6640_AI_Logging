#!/bin/bash
# Script to run server tests in Docker container

# Ensure script exits on error
set -e

# Parse command line arguments
TEST_PATH="tests"
WATCH=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --path=*)
      TEST_PATH="${1#*=}"
      shift
      ;;
    --watch)
      WATCH=true
      shift
      ;;
    *)
      echo "Unknown parameter: $1"
      echo "Usage: ./run-server-tests.sh [--path=tests/Routes] [--watch]"
      exit 1
      ;;
  esac
done

# Build the test command
TEST_CMD="npm test"

if [ "$WATCH" = true ]; then
  TEST_CMD="$TEST_CMD -- --watchAll"
fi

if [ "$TEST_PATH" != "tests" ]; then
  TEST_CMD="$TEST_CMD -- $TEST_PATH"
fi

echo "Running tests with command: $TEST_CMD"
echo "Executing in Docker container..."

# Run the tests in the Docker container
docker-compose -f docker-compose.dev.yml exec api $TEST_CMD

# Report success
echo "Test execution complete!"
