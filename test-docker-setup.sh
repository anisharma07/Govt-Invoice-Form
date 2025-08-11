#!/bin/bash

# Docker Setup Test Script
# This script tests the Docker-based Android build setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo "===========================================" 
    echo "🐳 Docker Setup Test"
    echo "==========================================="
    echo ""
}

# Test Docker installation
test_docker() {
    print_info "Testing Docker installation..."
    
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker found: $DOCKER_VERSION"
    else
        print_error "Docker not found! Please install Docker first."
        return 1
    fi

    # Test Docker daemon
    if docker info &> /dev/null; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running!"
        return 1
    fi
}

# Test Docker Compose
test_docker_compose() {
    print_info "Testing Docker Compose..."
    
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose found: $COMPOSE_VERSION"
    elif docker compose version &> /dev/null; then
        COMPOSE_VERSION=$(docker compose version)
        print_success "Docker Compose (plugin) found: $COMPOSE_VERSION"
    else
        print_warning "Docker Compose not found, but not required for basic builds"
    fi
}

# Test Node.js in Docker
test_node_docker() {
    print_info "Testing Node.js in Docker..."
    
    NODE_VERSION=$(docker run --rm node:20-alpine node --version 2>/dev/null || echo "failed")
    if [ "$NODE_VERSION" != "failed" ]; then
        print_success "Node.js Docker image works: $NODE_VERSION"
    else
        print_error "Failed to run Node.js Docker image"
        return 1
    fi
}

# Test building the Android Docker image
test_android_image_build() {
    print_info "Testing Android Docker image build..."
    print_warning "This will take several minutes on first run..."
    
    # Build only the first stage to save time
    if docker build -f Dockerfile.android --target android-builder -t govt-invoice-android-test:latest . &> /dev/null; then
        print_success "Android Docker image builds successfully"
        
        # Clean up test image
        docker rmi govt-invoice-android-test:latest &> /dev/null || true
    else
        print_error "Android Docker image build failed"
        print_info "Run 'docker build -f Dockerfile.android --target android-builder -t test .' to see detailed error"
        return 1
    fi
}

# Test project structure
test_project_structure() {
    print_info "Testing project structure..."
    
    REQUIRED_FILES=(
        "package.json"
        "android/app/build.gradle"
        "capacitor.config.ts"
        "Dockerfile.android"
        "docker-build.sh"
        ".dockerignore"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "$file" ]; then
            print_success "Found: $file"
        else
            print_error "Missing: $file"
            return 1
        fi
    done
}

# Test helper script
test_helper_script() {
    print_info "Testing docker-build.sh helper script..."
    
    if [ -x "docker-build.sh" ]; then
        print_success "docker-build.sh is executable"
        
        # Test help command
        if ./docker-build.sh help &> /dev/null; then
            print_success "docker-build.sh help command works"
        else
            print_error "docker-build.sh help command failed"
            return 1
        fi
    else
        print_error "docker-build.sh is not executable"
        print_info "Run: chmod +x docker-build.sh"
        return 1
    fi
}

# Test workflow file
test_workflow() {
    print_info "Testing GitHub Actions workflow..."
    
    WORKFLOW_FILE=".github/workflows/docker-release-apk.yml"
    if [ -f "$WORKFLOW_FILE" ]; then
        print_success "Docker release workflow found"
        
        # Basic syntax check
        if grep -q "docker-release" "$WORKFLOW_FILE"; then
            print_success "Workflow has correct trigger label"
        else
            print_error "Workflow missing docker-release trigger"
            return 1
        fi
    else
        print_error "Docker release workflow not found"
        return 1
    fi
}

# Main test function
run_tests() {
    print_header
    
    TESTS=(
        "test_docker"
        "test_docker_compose" 
        "test_project_structure"
        "test_helper_script"
        "test_workflow"
        "test_node_docker"
    )
    
    # Add comprehensive test if --full flag is passed
    if [ "$1" = "--full" ]; then
        TESTS+=("test_android_image_build")
        print_warning "Running full tests including Android image build (this will take a while)..."
    fi
    
    PASSED=0
    TOTAL=${#TESTS[@]}
    
    for test in "${TESTS[@]}"; do
        echo ""
        if $test; then
            ((PASSED++))
        fi
    done
    
    echo ""
    echo "==========================================="
    echo "📊 Test Results"
    echo "==========================================="
    print_info "Passed: $PASSED/$TOTAL tests"
    
    if [ $PASSED -eq $TOTAL ]; then
        print_success "All tests passed! 🎉"
        echo ""
        print_info "Next steps:"
        echo "1. ./docker-build.sh build-image    # Build Android Docker image"
        echo "2. ./docker-build.sh setup-keystore # Setup keystore for release builds"
        echo "3. ./docker-build.sh build-apk      # Build APK using Docker"
        return 0
    else
        print_error "Some tests failed. Please fix the issues above."
        return 1
    fi
}

# Show usage
show_usage() {
    echo "Docker Setup Test Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --full    Run comprehensive tests including Docker image build"
    echo "  --help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0           # Run basic tests"
    echo "  $0 --full    # Run all tests including image build"
}

# Handle command line arguments
case "${1:-}" in
    "--help"|"-h")
        show_usage
        exit 0
        ;;
    "--full")
        run_tests --full
        ;;
    "")
        run_tests
        ;;
    *)
        print_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac
