# Voice Features Documentation

## Overview

The app now supports voice-driven interaction through Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities, enhancing accessibility and user experience.

## Features

### Speech-to-Text (STT)
- **Voice Input in Chat**: Users can dictate questions using the microphone button
- **Real-time Transcription**: Live feedback as speech is being recognized
- **Error Handling**: Graceful error messages for permission issues or recognition failures
- **Offline Support**: Voice recognition works offline when device capabilities allow

### Text-to-Speech (TTS)
- **Read Aloud Solutions**: Solutions can be read aloud with natural-sounding voices
- **Adjustable Controls**:
  - Speed (Rate): 0.5x to 2.0x
  - Pitch: 0.5 to 2.0
- **Playback Controls**: Play, stop (pause/resume work by stopping and restarting)
- **Offline Support**: TTS works offline using device's built-in voices

## Implementation

### VoiceService
Central service managing all voice functionality:
- `startRecording()`: Start speech recognition
- `stopRecording()`: Stop and finalize transcript
- `cancelRecording()`: Cancel ongoing recording
- `speak()`: Convert text to speech
- `pauseSpeaking()`, `resumeSpeaking()`, `stopSpeaking()`: Playback controls
- `isAvailable()`: Check if voice features are available

### UI Components

#### VoiceRecordingOverlay
Modal overlay for voice input with:
- Animated microphone icon during recording
- Real-time transcript display
- Error messages
- Cancel and stop controls
- Full accessibility support

#### TTSControls
Bottom sheet modal for TTS with:
- Text preview
- Play/pause/stop/resume controls
- Speed and pitch sliders
- Settings persistence
- Accessibility labels and hints

### Integration Points

#### ChatScreen
- Microphone button in input container (when voice available)
- Voice recording overlay
- Transcript populates input field
- Analytics tracking for voice usage

#### SolutionScreen
- "Read Aloud" button in footer
- TTS controls modal
- Reads all solution steps and final answer
- Analytics tracking for TTS usage

## Accessibility

### VoiceOver Support
- All voice UI elements have proper accessibility labels
- Accessibility hints explain button actions
- Live regions announce state changes
- Voice input works alongside VoiceOver

### Features
- `accessibilityLabel`: Clear button/control descriptions
- `accessibilityRole`: Proper role identification
- `accessibilityHint`: Additional context for actions
- `accessibilityLiveRegion`: Dynamic content updates
- `AccessibilityInfo.announceForAccessibility()`: State change announcements

## Analytics

### Tracked Events

#### Voice Input
```typescript
trackVoiceInput(screen, transcriptLength, duration, success)
```
- Screen where voice was used
- Length of transcribed text
- Recording duration
- Success/failure status

#### TTS Usage
```typescript
trackTTSUsage(screen, textLength, rate, pitch, action)
```
- Screen where TTS was used
- Length of text being read
- Speed and pitch settings
- Action: play, pause, stop, resume

#### Accessibility
```typescript
trackVoiceAccessibility(feature, timeSaved, usedWithVoiceOver)
```
- Feature type: STT or TTS
- Estimated time saved
- Whether used with VoiceOver enabled

## Error Handling

### Common Errors
1. **Microphone Permission Denied**: User-friendly message prompting permission grant
2. **Voice Recognition Unavailable**: Feature gracefully hidden on unsupported devices
3. **Network Issues**: Offline fallback where possible
4. **Recognition Timeout**: Auto-stop with current transcript

### Graceful Degradation
- Voice button only shown when feature available
- TTS uses device voices when online voices unavailable
- Error messages provide clear next steps
- App remains fully functional without voice features

## Testing

### Unit Tests
- VoiceService methods mocked in jest.setup.js
- Component rendering with voice states
- Analytics tracking verification

### Manual Testing
1. Voice Input:
   - Tap microphone button
   - Speak clearly
   - Verify transcript accuracy
   - Check input field population

2. TTS:
   - Tap "Read Aloud"
   - Verify audio playback
   - Test speed/pitch adjustments
   - Test pause/resume/stop

3. Accessibility:
   - Enable VoiceOver
   - Navigate to voice features
   - Verify announcements
   - Test with voice controls

## Performance

### Optimizations
- Voice service cleanup on unmount
- Efficient state updates
- Memoized callbacks
- Minimal re-renders during recording

### Memory Management
- Stop all voice operations on screen unmount
- Cancel pending operations on error
- Clear references in cleanup

## Platform Support

### iOS
- Uses Apple Speech framework via @react-native-voice/voice
- AVFoundation for TTS via expo-speech
- Native voice quality

### Android
- Uses Android Speech APIs
- Google TTS engine
- May require Google app for best results

## Future Enhancements

### Potential Additions
1. Voice language selection
2. Custom voice profiles
3. Voice commands (hands-free navigation)
4. Transcript history
5. Voice biometrics
6. Multi-language support
7. Accent/dialect optimization
8. Background TTS playback

### Performance Improvements
1. Streaming TTS for long text
2. Cached voice models
3. Reduced latency
4. Better offline support

## Dependencies

```json
{
  "@react-native-voice/voice": "^3.2.4",
  "react-native-tts": "^4.1.0",
  "@react-native-community/slider": "^4.4.3"
}
```

## Configuration

### iOS Setup (Podfile)
```ruby
# Already handled by React Native auto-linking
```

### Android Setup (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
```

### Permissions
Request microphone permissions at runtime:
- iOS: NSMicrophoneUsageDescription in Info.plist
- Android: RECORD_AUDIO permission

## Troubleshooting

### Voice Input Not Working
1. Check microphone permissions
2. Verify device has speech recognition capability
3. Check network connection (for cloud-based recognition)
4. Restart app

### TTS Not Working
1. Check device volume
2. Verify TTS engine installed (Android)
3. Check device language settings
4. Restart app

### Poor Recognition Accuracy
1. Speak clearly and at normal pace
2. Reduce background noise
3. Check microphone positioning
4. Verify correct language setting

## Resources

- [React Native Voice Documentation](https://github.com/react-native-voice/voice)
- [React Native TTS Documentation](https://github.com/ak1394/react-native-tts)
- [Accessibility Guidelines](https://reactnative.dev/docs/accessibility)
- [Voice UX Best Practices](https://developers.google.com/assistant/voice-design)
