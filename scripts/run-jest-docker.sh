#!/bin/bash
# Jest runner script for VS Code Jest extension
# This script runs Jest tests in the Docker container

set -e

# Check if Docker development environment is running
if ! docker-compose -f docker-compose.dev.yml ps -q api | grep -q .; then
    echo "Starting Docker development environment..."
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for services to be ready
    echo "Waiting for services to start..."
    sleep 10
fi

# Forward all arguments to Jest in the Docker container
docker-compose -f docker-compose.dev.yml exec -T api npm test -- "$@"
