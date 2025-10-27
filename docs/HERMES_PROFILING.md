# Hermes Profiling Guide

This guide explains how to profile your React Native app using the Hermes JavaScript engine.

## Prerequisites

- Hermes must be enabled in your app
- Chrome browser for DevTools
- React Native app running in development mode

## Enable Hermes

### Android

In `android/app/build.gradle`:

```gradle
project.ext.react = [
    enableHermes: true,
]
```

### iOS

In `ios/Podfile`:

```ruby
use_react_native!(
  :path => config[:reactNativePath],
  :hermes_enabled => true
)
```

Then run:
```bash
cd ios && pod install && cd ..
```

## Profiling with Chrome DevTools

### 1. Start the App

```bash
npm run android
# or
npm run ios
```

### 2. Open Chrome DevTools

1. Open Chrome and navigate to: `chrome://inspect`
2. Click "Configure" and add `localhost:8081`
3. Your app should appear in the list
4. Click "inspect" under your app

### 3. Profile JavaScript Performance

1. Go to the "Profiler" tab in Chrome DevTools
2. Click the "Record" button
3. Interact with your app
4. Click "Stop" to finish recording
5. Analyze the flame chart

### 4. Memory Profiling

1. Go to the "Memory" tab
2. Select "Heap snapshot"
3. Click "Take snapshot"
4. Compare snapshots to detect memory leaks

## Performance Markers

Use Performance API to add custom markers:

```javascript
import PerformanceMonitor from './utils/PerformanceMonitor';

// Start marker
PerformanceMonitor.startMeasure('operation_name');

// Your code here

// End marker
PerformanceMonitor.endMeasure('operation_name');
```

## Analyzing Results

### Flame Chart

- **Width**: Time spent in function
- **Color**: Different colors represent different functions
- **Height**: Call stack depth

Look for:
- Wide bars (long-running functions)
- Repeated patterns (potential optimizations)
- Unexpected function calls

### Memory Snapshots

Compare snapshots to find:
- Memory leaks (growing heap)
- Retained objects
- Detached DOM nodes

## Common Performance Issues

### 1. Excessive Renders

**Symptoms:**
- Multiple re-renders in profiler
- Wide render bars

**Solutions:**
- Use React.memo
- Optimize props
- Use useMemo/useCallback

### 2. Heavy Computations

**Symptoms:**
- Long JavaScript execution
- Blocked main thread

**Solutions:**
- Move to background thread
- Use Web Workers
- Implement debouncing

### 3. Memory Leaks

**Symptoms:**
- Growing heap size
- Retained objects

**Solutions:**
- Clean up subscriptions
- Remove event listeners
- Clear caches

## Flipper Integration

Flipper provides additional profiling tools:

1. Install Flipper: https://fbflipper.com/
2. Start your app
3. Flipper should auto-detect it

Available plugins:
- React DevTools
- Network inspector
- Layout inspector
- Databases
- Shared Preferences
- Crash Reporter

## Performance Testing Checklist

- [ ] Enable Hermes
- [ ] Profile key user flows
- [ ] Check for memory leaks
- [ ] Verify FPS during animations
- [ ] Test with production build
- [ ] Profile on low-end devices
- [ ] Review bundle size
- [ ] Check startup time

## Resources

- [Hermes Documentation](https://hermesengine.dev/)
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Flipper](https://fbflipper.com/)
