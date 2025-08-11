#!/bin/bash

# Government Invoice Form - Docker Build Helper Script
# This script helps you build and test the Android APK using Docker locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
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

# Function to show usage
show_usage() {
    echo "Government Invoice Form - Docker Build Helper"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  build-image     Build the Android Docker image"
    echo "  build-apk       Build APK using Docker (requires keystore setup)"
    echo "  dev             Start development environment"
    echo "  web-dev         Start web development server"
    echo "  clean           Clean Docker images and containers"
    echo "  setup-keystore  Setup keystore for release builds"
    echo "  help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build-image                    # Build Docker image"
    echo "  $0 build-apk                      # Build release APK"
    echo "  $0 dev                            # Start development environment"
    echo "  $0 web-dev                        # Start web development server"
    echo ""
}

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_warning "docker-compose not found. Using 'docker compose' instead."
    fi
}

# Function to build Docker image
build_image() {
    print_info "Building Android Docker image..."
    
    docker build -f Dockerfile.android -t govt-invoice-android:latest . \
        --progress=plain \
        --no-cache

    print_success "Docker image built successfully!"
    docker images govt-invoice-android:latest
}

# Function to setup keystore
setup_keystore() {
    print_info "Setting up keystore for release builds..."
    
    if [ ! -d ".docker-build" ]; then
        mkdir -p .docker-build
    fi

    echo ""
    print_warning "You need to provide the following for release builds:"
    echo "1. Keystore file (release-key.jks)"
    echo "2. Keystore properties (store password, key alias, key password)"
    echo ""

    # Check if keystore file exists
    if [ ! -f ".docker-build/release-key.jks" ]; then
        print_info "Please place your keystore file at: .docker-build/release-key.jks"
        read -p "Press Enter when you've placed the keystore file..."
    fi

    # Create keystore.properties if it doesn't exist
    if [ ! -f ".docker-build/keystore.properties" ]; then
        print_info "Creating keystore.properties..."
        
        read -p "Enter store password: " -s STORE_PASSWORD
        echo ""
        read -p "Enter key alias: " KEY_ALIAS
        read -p "Enter key password: " -s KEY_PASSWORD
        echo ""

        cat > .docker-build/keystore.properties << EOF
storeFile=release-key.jks
storePassword=$STORE_PASSWORD
keyAlias=$KEY_ALIAS
keyPassword=$KEY_PASSWORD
EOF

        print_success "Keystore properties created!"
    else
        print_success "Keystore properties already exist!"
    fi
}

# Function to build APK
build_apk() {
    print_info "Building APK using Docker..."

    # Check if keystore is setup
    if [ ! -f ".docker-build/release-key.jks" ] || [ ! -f ".docker-build/keystore.properties" ]; then
        print_warning "Keystore not found. Setting up keystore first..."
        setup_keystore
    fi

    # Create output directory
    mkdir -p ./docker-outputs

    print_info "Starting Docker container to build APK..."

    # Run Docker container to build APK
    docker run --rm \
        -v $(pwd)/.docker-build/release-key.jks:/app/android/app/release-key.jks:ro \
        -v $(pwd)/.docker-build/keystore.properties:/app/android/keystore.properties:ro \
        -v $(pwd)/docker-outputs:/app/android/app/build/outputs \
        --name apk-builder-$(date +%s) \
        govt-invoice-android:latest

    # Verify APK was created
    if [ -f "docker-outputs/apk/release/app-release.apk" ]; then
        # Get current version from package.json
        VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")
        
        # Copy and rename APK
        cp docker-outputs/apk/release/app-release.apk docker-outputs/apk/release/Govt-Invoice-Docker-v${VERSION}.apk
        
        # Get APK info
        APK_SIZE=$(du -h docker-outputs/apk/release/Govt-Invoice-Docker-v${VERSION}.apk | cut -f1)
        
        print_success "APK built successfully!"
        echo "📁 APK Location: docker-outputs/apk/release/Govt-Invoice-Docker-v${VERSION}.apk"
        echo "📊 APK Size: $APK_SIZE"
    else
        print_error "APK build failed!"
        exit 1
    fi
}

# Function to start development environment
start_dev() {
    print_info "Starting development environment..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.android.yml up android-dev
    else
        docker compose -f docker-compose.android.yml up android-dev
    fi
}

# Function to start web development
start_web_dev() {
    print_info "Starting web development server..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.android.yml up web-dev
    else
        docker compose -f docker-compose.android.yml up web-dev
    fi
}

# Function to clean Docker resources
clean_docker() {
    print_info "Cleaning Docker resources..."
    
    # Remove containers
    docker ps -a | grep govt-invoice | awk '{print $1}' | xargs -r docker rm -f
    
    # Remove images
    docker images | grep govt-invoice-android | awk '{print $3}' | xargs -r docker rmi -f
    
    # Clean build outputs
    rm -rf docker-outputs
    
    # Prune system
    docker system prune -f
    
    print_success "Docker cleanup completed!"
}

# Main script logic
main() {
    # Check if Docker is available
    check_docker

    # Handle commands
    case "${1:-help}" in
        "build-image")
            build_image
            ;;
        "build-apk")
            build_apk
            ;;
        "dev")
            start_dev
            ;;
        "web-dev")
            start_web_dev
            ;;
        "clean")
            clean_docker
            ;;
        "setup-keystore")
            setup_keystore
            ;;
        "help"|"--help"|"-h")
            show_usage
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
