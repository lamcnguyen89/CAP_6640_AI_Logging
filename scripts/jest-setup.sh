#!/bin/bash
# Jest setup script for VS Code extension
# Ensures Docker environment is ready before Jest runs

# Function to check if Docker is running
check_docker() {
    if ! docker-compose -f docker-compose.dev.yml ps -q api | grep -q .; then
        return 1
    else
        return 0
    fi
}

# Check if Docker is running, start if not
if ! check_docker; then
    echo "Starting Docker development environment for Jest..."
    docker-compose -f docker-compose.dev.yml up -d
    
    # Wait for services to be ready
    echo "Waiting for services to start..."
    sleep 5
    
    # Check again
    if ! check_docker; then
        echo "Error: Failed to start Docker environment"
        exit 1
    fi
    
    echo "Docker environment ready!"
fi

echo "Docker environment is running, Jest can proceed"
