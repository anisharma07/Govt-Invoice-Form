# 🐳 Docker Build Strategies for Government Invoice Form

This document explains the different Docker strategies available for building Android APKs and when to use each approach.

## 📋 Available Strategies

### 1. 🚀 **Lightweight Docker Release** (Recommended for CI/CD)

**File:** `.github/workflows/lite-docker-release-apk.yml`  
**Trigger:** `lite-docker-release` label

**✅ Pros:**

- Uses pre-built images (much faster)
- Configurable strategy (build vs. pre-built)
- Optimized for repeated builds
- Minimal GitHub Actions runtime

**⚠️ Cons:**

- Requires initial image build
- Need to manage image updates

**Best for:** Production releases, when you have a stable build environment

### 2. 🔨 **Full Docker Release** (Complete but slower)

**File:** `.github/workflows/docker-release-apk.yml`  
**Trigger:** `docker-release` label

**✅ Pros:**

- Always builds fresh image
- No dependencies on pre-built images
- Guaranteed reproducible builds

**⚠️ Cons:**

- Takes 15-20 minutes per build
- Uses more GitHub Actions minutes
- Rebuilds everything each time

**Best for:** When you need guaranteed fresh builds, testing new dependencies

### 3. 🏠 **Local Development**

**File:** `docker-build.sh`

**✅ Pros:**

- Full control over build process
- Can reuse images across builds
- Great for development and testing

**Best for:** Local development, testing, initial setup

## 🎯 Recommended Workflow

### For Regular Releases (Recommended)

1. **One-time setup:** Build the Docker image locally or in CI

   ```bash
   ./docker-build.sh build-image
   ```

2. **For releases:** Use the lightweight workflow
   - Add `lite-docker-release` label to your PR
   - Builds will be much faster (2-5 minutes vs 15-20 minutes)

### For New Dependencies or Major Changes

1. **Use full Docker workflow:**

   - Add `docker-release` label to your PR
   - This ensures all dependencies are fresh

2. **Update local image:**
   ```bash
   ./docker-build.sh build-image
   ```

## ⚙️ Configuration Options

### Lightweight Docker Release Configuration

Edit the environment variables in `.github/workflows/lite-docker-release-apk.yml`:

```yaml
env:
  USE_PREBUILT_IMAGE: true  # Use existing images
  DOCKER_IMAGE: "govt-invoice-android"
  DOCKER_TAG: "latest"
  # DOCKER_REGISTRY: "ghcr.io/anisharma07"  # Uncomment for registry
```

**Options:**

- `USE_PREBUILT_IMAGE: true` - Use existing images (fast)
- `USE_PREBUILT_IMAGE: false` - Build on demand (slower but fresh)

### Image Registry Setup (Optional)

To use a container registry for shared images:

1. **Push to GitHub Container Registry:**

   ```bash
   # Build and tag
   ./docker-build.sh build-image
   docker tag govt-invoice-android:latest ghcr.io/anisharma07/govt-invoice-android:latest

   # Login and push
   echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u anisharma07 --password-stdin
   docker push ghcr.io/anisharma07/govt-invoice-android:latest
   ```

2. **Update workflow:**
   ```yaml
   env:
     USE_PREBUILT_IMAGE: true
     DOCKER_REGISTRY: "ghcr.io/anisharma07"
     DOCKER_IMAGE: "govt-invoice-android"
   ```

## 🔧 Local Commands

### Check if image exists

```bash
./docker-build.sh check-image
```

### Build image (one-time, takes 15-20 minutes)

```bash
./docker-build.sh build-image
```

### Build APK (fast if image exists)

```bash
./docker-build.sh build-apk
```

### Development environment

```bash
./docker-build.sh dev
```

## 📊 Performance Comparison

| Strategy        | First Build | Subsequent Builds | GitHub Actions Time |
| --------------- | ----------- | ----------------- | ------------------- |
| **Lightweight** | 15-20 min   | 2-5 min           | ⭐ Low              |
| **Full Docker** | 15-20 min   | 15-20 min         | ❌ High             |
| **Local**       | 15-20 min   | 2-5 min           | N/A                 |

## 🛠️ Troubleshooting

### "Docker image not found"

```bash
# Check if image exists
./docker-build.sh check-image

# Build if needed
./docker-build.sh build-image
```

### "APK build failed"

```bash
# Check Docker logs
docker logs <container-name>

# Rebuild image
./docker-build.sh clean
./docker-build.sh build-image
```

### GitHub Actions fails to find image

1. Set `USE_PREBUILT_IMAGE: false` in the workflow
2. Or build and push to a registry

## 💡 Tips for Optimal Performance

### 1. Use Lightweight Strategy for Regular Releases

- Build image once locally or in CI
- Use `lite-docker-release` label for subsequent releases
- 4x faster than full rebuilds

### 2. Update Images Periodically

- Rebuild image when dependencies change
- Update monthly for security patches
- Use full Docker strategy after major updates

### 3. Local Development

- Build image once: `./docker-build.sh build-image`
- Reuse for multiple APK builds: `./docker-build.sh build-apk`
- Clean when needed: `./docker-build.sh clean`

### 4. CI/CD Best Practices

- Use lightweight strategy for feature releases
- Use full strategy for dependency updates
- Consider using container registry for team sharing

## 🚀 Quick Start

**For immediate APK building:**

```bash
# 1. Check setup
./test-docker-setup.sh

# 2. Build image (one-time)
./docker-build.sh build-image

# 3. Build APK (repeatable)
./docker-build.sh build-apk
```

**For CI/CD releases:**

1. Build image locally once
2. Use `lite-docker-release` label on PRs
3. Enjoy fast builds! 🚀

---

_Choose the strategy that best fits your needs. For most users, the lightweight strategy provides the best balance of speed and reliability._
