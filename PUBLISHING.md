# Publishing Guide for electron-audio-screenshot-kit

This guide explains how to publish the `electron-audio-screenshot-kit` npm package.

## 📋 Prerequisites

1. **NPM Account**: You need an npm account with publish permissions
2. **GitHub Repository**: The package should be hosted on GitHub
3. **Build Tools**: Ensure all build tools are working

## 🚀 Publishing Steps

### 1. Prepare the Package

```bash
# Navigate to the package directory
cd electron-audio-screenshot-kit

# Install dependencies
npm install

# Build the package
npm run build

# Run tests (if available)
npm test

# Check the package contents
npm pack --dry-run
```

### 2. Update Version

```bash
# Update version (patch, minor, or major)
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### 3. Login to NPM

```bash
# Login to npm
npm login

# Verify you're logged in
npm whoami
```

### 4. Publish the Package

```bash
# Publish to npm
npm publish

# Or publish with specific tag
npm publish --tag beta
```

### 5. Verify Publication

```bash
# Check the published package
npm view electron-audio-screenshot-kit

# Install and test locally
npm install electron-audio-screenshot-kit@latest
```

## 📦 Package Structure

The published package should include:

```
electron-audio-screenshot-kit/
├── dist/                    # Compiled TypeScript
├── assets/                  # Binary files (SystemAudioDump)
├── README.md               # Documentation
├── LICENSE                 # MIT License
├── package.json            # Package metadata
└── tsconfig.json          # TypeScript config
```

## 🔧 Build Configuration

### TypeScript Build

The `tsconfig.json` is configured to:
- Output to `dist/` directory
- Generate declaration files (`.d.ts`)
- Include source maps
- Target ES2020 for compatibility

### Package.json Configuration

Key fields:
- `main`: Points to `dist/index.js`
- `types`: Points to `dist/index.d.ts`
- `files`: Specifies what gets published
- `peerDependencies`: Electron as peer dependency

## 🏷️ Versioning Strategy

### Semantic Versioning

- **Patch** (1.0.0 → 1.0.1): Bug fixes, minor improvements
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Major** (1.0.0 → 2.0.0): Breaking changes

### Release Tags

- `latest`: Stable releases
- `beta`: Pre-release versions
- `alpha`: Early development versions

## 📝 Release Notes

For each release, update:

1. **CHANGELOG.md** (if you create one)
2. **README.md** if needed
3. **GitHub Releases** with detailed notes

### Example Release Notes

```markdown
## [1.0.0] - 2024-01-15

### Added
- Cross-platform audio capture support
- Platform-specific permission handling
- Echo cancellation for macOS and Windows
- Screenshot capture functionality
- React components for easy integration

### Fixed
- macOS system audio capture stability
- Windows loopback audio quality
- Linux permission handling

### Changed
- Improved error handling and logging
- Enhanced TypeScript definitions
- Updated documentation
```

## 🔄 Continuous Publishing

### GitHub Actions Workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build package
        run: npm run build
      
      - name: Run tests
        run: npm test
      
      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### NPM Token Setup

1. Generate NPM token: `npm token create`
2. Add to GitHub Secrets as `NPM_TOKEN`
3. Tag releases: `git tag v1.0.0 && git push --tags`

## 🧪 Testing Before Publishing

### Local Testing

```bash
# Build and pack locally
npm run build
npm pack

# Install in a test project
cd ../test-project
npm install ../electron-audio-screenshot-kit/contextor-electron-audio-screenshot-kit-1.0.0.tgz

# Test the integration
npm test
```

### Integration Testing

Test with:
- [ ] macOS (system audio + permissions)
- [ ] Windows (loopback audio)
- [ ] Linux (basic functionality)
- [ ] Different Electron versions
- [ ] React integration

## 📊 Post-Publishing

### Monitor Usage

```bash
# Check download statistics
npm stats electron-audio-screenshot-kit

# Monitor for issues
npm bugs electron-audio-screenshot-kit
```

### Update Documentation

- Update README with new features
- Add migration guides for breaking changes
- Update examples and tutorials

## 🚨 Troubleshooting

### Common Issues

**"Package name already exists"**
- Check if the name is available: `npm search electron-audio-screenshot-kit`
- Consider scoped package: `@contextor/electron-audio-screenshot-kit`

**"Build fails"**
- Check TypeScript errors: `npm run build`
- Verify all dependencies are installed
- Check Node.js version compatibility

**"Binary not found"**
- Ensure `assets/SystemAudioDump` is included
- Check file permissions on macOS
- Verify binary is executable

### Rollback Strategy

```bash
# Unpublish (within 72 hours)
npm unpublish electron-audio-screenshot-kit@1.0.0

# Or deprecate
npm deprecate electron-audio-screenshot-kit@1.0.0 "Use v1.0.1 instead"
```

## 📞 Support

For publishing issues:
- Check npm documentation
- Review npm policies
- Contact npm support if needed

## 🎯 Next Steps

After publishing:
1. Announce on social media
2. Update project documentation
3. Monitor for issues and feedback
4. Plan next release features 