# 🐳 Docker-based Android Build Setup

This document explains how to use Docker for building the Government Invoice Form Android APK. The Docker setup provides a consistent, reproducible build environment that eliminates the common "works on my machine" problems.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Docker Setup Files](#docker-setup-files)
- [GitHub Actions Workflow](#github-actions-workflow)
- [Local Development](#local-development)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)

## 🎯 Overview

The Docker setup includes:

- **Dockerfile.android**: Multi-stage Dockerfile for Android builds
- **docker-compose.android.yml**: Docker Compose configuration
- **docker-build.sh**: Helper script for local development
- **.github/workflows/docker-release-apk.yml**: Automated Docker-based releases

### Benefits of Docker Build

✅ **Reproducible**: Same build environment every time  
✅ **Isolated**: No conflicts with host system dependencies  
✅ **Consistent**: All team members use identical build tools  
✅ **Portable**: Can be built on any Docker-capable system  
✅ **Automated**: Integrates seamlessly with CI/CD

## 📦 Prerequisites

### Required Software

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher (optional, for convenience)
- **Git**: For version control

### Installation

#### Ubuntu/Debian

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Add user to docker group (logout/login required)
sudo usermod -aG docker $USER
```

#### macOS

```bash
# Install Docker Desktop
brew install --cask docker

# Or download from: https://www.docker.com/products/docker-desktop
```

#### Windows

Download Docker Desktop from: https://www.docker.com/products/docker-desktop

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Govt-Invoice-Form
```

### 2. Build Docker Image

```bash
# Using helper script (recommended)
./docker-build.sh build-image

# Or manually
docker build -f Dockerfile.android -t govt-invoice-android:latest .
```

### 3. Setup Keystore (for release builds)

```bash
./docker-build.sh setup-keystore
```

### 4. Build APK

```bash
# Build release APK using Docker
./docker-build.sh build-apk
```

The APK will be available in `docker-outputs/apk/release/`

## 📁 Docker Setup Files

### Dockerfile.android

Multi-stage Dockerfile optimized for Android builds:

```dockerfile
# Key features:
- Ubuntu 22.04 base image
- Android SDK with necessary components
- Node.js 20.x and Yarn
- Java OpenJDK 17
- Capacitor CLI and build tools
- Automated build script
```

**Stages:**

- `android-builder`: Production build environment
- `android-dev`: Development environment with additional tools

### docker-compose.android.yml

Provides convenient service definitions:

- `android-builder`: For building APKs
- `android-dev`: For development with volume mounts
- `web-dev`: For web development
- `web-prod`: For production web builds

### docker-build.sh

Helper script with commands:

- `build-image`: Build Docker image
- `build-apk`: Build APK using Docker
- `dev`: Start development environment
- `web-dev`: Start web development server
- `clean`: Clean Docker resources
- `setup-keystore`: Setup release keystore

## 🔄 GitHub Actions Workflow

### Trigger

The Docker-based workflow triggers when:

- A PR is merged to `main` AND has the `docker-release` label
- The `docker-release` label is added to a merged PR

### Workflow Features

- **Version Management**: Automatic semantic versioning
- **Docker Build**: Builds APK in isolated container
- **Release Creation**: Creates GitHub release with Docker-built APK
- **Cleanup**: Removes sensitive data and Docker resources
- **Error Handling**: Comprehensive error reporting

### Usage

1. Create a PR with your changes
2. Add the `docker-release` label to the PR
3. Merge the PR
4. The workflow will automatically build and release

## 💻 Local Development

### Development Environment

Start the development environment:

```bash
# Start Android development container
./docker-build.sh dev

# Or start web development server
./docker-build.sh web-dev
```

### Building APKs Locally

1. **Setup keystore** (first time only):

   ```bash
   ./docker-build.sh setup-keystore
   ```

2. **Build APK**:

   ```bash
   ./docker-build.sh build-apk
   ```

3. **Find your APK**:
   ```bash
   ls -la docker-outputs/apk/release/
   ```

### Volume Mounts

The development setup uses volume mounts for:

- Source code changes (live reload)
- Gradle cache (faster builds)
- Build outputs (persistent artifacts)

## 🔧 Troubleshooting

### Common Issues

#### Docker Image Build Fails

**Problem**: Android SDK download fails

```bash
# Solution: Check internet connection and retry
./docker-build.sh build-image
```

**Problem**: Out of disk space

```bash
# Solution: Clean Docker resources
./docker-build.sh clean
docker system prune -a
```

#### APK Build Fails

**Problem**: Keystore not found

```bash
# Solution: Setup keystore properly
./docker-build.sh setup-keystore
```

**Problem**: Permission denied

```bash
# Solution: Fix file permissions
sudo chown -R $USER:$USER docker-outputs/
```

#### Container Won't Start

**Problem**: Port already in use

```bash
# Solution: Kill processes using the port
sudo lsof -ti:5173 | xargs kill -9
```

**Problem**: Docker daemon not running

```bash
# Solution: Start Docker service
sudo systemctl start docker
```

### Debug Mode

Run containers in debug mode:

```bash
# Run container interactively
docker run -it --rm govt-invoice-android:latest bash

# Check container logs
docker logs <container-name>
```

### Logs and Debugging

View build logs:

```bash
# During build
docker build -f Dockerfile.android -t govt-invoice-android:latest . --progress=plain

# Container logs
docker run --rm govt-invoice-android:latest 2>&1 | tee build.log
```

## 🔄 Advanced Usage

### Custom Build Configuration

#### Environment Variables

Set custom environment variables:

```bash
docker run --rm \
  -e ANDROID_HOME=/opt/android-sdk \
  -e JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
  -v $(pwd)/docker-outputs:/app/android/app/build/outputs \
  govt-invoice-android:latest
```

#### Custom Gradle Configuration

Mount custom gradle configuration:

```bash
docker run --rm \
  -v $(pwd)/custom-gradle.properties:/app/android/gradle.properties \
  -v $(pwd)/docker-outputs:/app/android/app/build/outputs \
  govt-invoice-android:latest
```

### Multi-Platform Builds

Build for multiple architectures:

```bash
# Setup buildx
docker buildx create --use

# Build multi-platform image
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile.android \
  -t govt-invoice-android:latest \
  --push .
```

### CI/CD Integration

#### Jenkins

```groovy
pipeline {
    agent any
    stages {
        stage('Build APK') {
            steps {
                sh './docker-build.sh build-image'
                sh './docker-build.sh build-apk'
                archiveArtifacts 'docker-outputs/apk/release/*.apk'
            }
        }
    }
}
```

#### GitLab CI

```yaml
build_apk:
  image: docker:20.10
  services:
    - docker:20.10-dind
  script:
    - ./docker-build.sh build-image
    - ./docker-build.sh build-apk
  artifacts:
    paths:
      - docker-outputs/apk/release/*.apk
```

## 📊 Performance Optimization

### Build Cache

Use Docker build cache:

```bash
# Build with cache mount
docker build \
  --cache-from govt-invoice-android:latest \
  -f Dockerfile.android \
  -t govt-invoice-android:latest .
```

### Layer Optimization

The Dockerfile is optimized for caching:

1. System packages (rarely change)
2. Android SDK (rarely change)
3. Node.js dependencies (change occasionally)
4. Source code (change frequently)

### Resource Limits

Limit Docker resources:

```bash
docker run --rm \
  --memory=4g \
  --cpus=2 \
  govt-invoice-android:latest
```

## 🔒 Security Considerations

### Keystore Security

- Never commit keystore files to git
- Use `.docker-build/` directory (gitignored)
- Keystore files are mounted read-only in containers
- Cleanup removes all keystore files

### Secrets Management

For CI/CD, use encrypted secrets:

- `RELEASE_KEYSTORE_BASE64`: Base64 encoded keystore
- `RELEASE_STORE_PASSWORD`: Keystore password
- `RELEASE_KEY_ALIAS`: Key alias
- `RELEASE_KEY_PASSWORD`: Key password

## 📝 Contributing

### Adding New Dependencies

1. Update `package.json`
2. Rebuild Docker image
3. Test build process
4. Update documentation

### Modifying Build Process

1. Edit `Dockerfile.android`
2. Test locally with `./docker-build.sh`
3. Update GitHub Actions workflow
4. Update this documentation

## 🆘 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review container logs
3. Verify Docker installation
4. Check file permissions
5. Create an issue with:
   - Docker version
   - Host OS
   - Error logs
   - Steps to reproduce

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Android Developer Guide](https://developer.android.com/)
- [Capacitor Documentation](https://capacitorjs.com/)
- [Ionic Framework](https://ionicframework.com/)

---

_This documentation is maintained as part of the Government Invoice Form project._
