# Document Import Feature Guide

## Overview

The Document Import feature allows users to import PDF documents, Word files (DOCX), and images to extract text content for summarization, quiz generation, and batch processing. All processing is done client-side with proper memory management and progress tracking.

## Features

### Document Types Supported
- **PDF** - Multi-page PDF documents with text extraction
- **DOCX** - Microsoft Word documents
- **Images** - JPG, PNG (OCR support planned)

### Core Capabilities
1. **Document Picker** - Native file picker with permission handling
2. **Text Extraction** - Extracts text from documents client-side
3. **Chunking** - Splits large documents into manageable chunks for AI processing
4. **Progress Tracking** - Real-time progress indicators during processing
5. **Local Caching** - Extracted text cached locally for reuse
6. **Background Support** - Processing continues in background and can be resumed
7. **Memory Efficient** - Lazy loading and automatic memory management

## Architecture

### Services

#### DocumentService
Main service for document management:
- `pickDocument()` - Opens native document picker
- `importDocument()` - Imports a document from URI
- `processDocument()` - Extracts text and creates chunks
- `generateSummary()` - Creates AI-powered summary
- `generateQuiz()` - Creates quiz questions from content
- `subscribeToProgress()` - Subscribe to processing progress

#### GeminiService Extensions
New methods for document processing:
- `summarizeText()` - Summarize document text
- `generateQuestionsFromText()` - Generate quiz from text

### Screens

#### DocumentImportScreen
Main document library view:
- List of imported documents
- Import button to add new documents
- Status indicators (pending, processing, completed, failed)
- Progress bars for active processing
- Delete documents on long press

#### DocumentDetailScreen
Document viewer and actions:
- View extracted text content
- Generate and view summaries
- Create and take quizzes
- Tabbed interface (Content, Summary, Quiz)

### Utilities

#### PDFProcessor
- Lazy loading of PDF pages
- Memory-efficient page management
- Chunk-based processing

#### BackgroundTaskManager
- Registers processing tasks
- Handles app state changes
- Auto-pause/resume on background/foreground

#### PermissionsHelper
- Storage permission requests
- iOS/Android compatibility
- Settings redirect for denied permissions

## Usage

### Basic Import Flow

```typescript
// 1. Import a document
const doc = await DocumentService.pickDocument();

// 2. Process the document
await DocumentService.processDocument(doc.id);

// 3. Get document chunks
const chunks = await DocumentService.getDocumentChunks(doc.id);

// 4. Generate summary
const summary = await DocumentService.generateSummary(doc.id, GeminiService);

// 5. Generate quiz
const quiz = await DocumentService.generateQuiz(doc.id, GeminiService, 5);
```

### Subscribing to Progress

```typescript
const unsubscribe = DocumentService.subscribeToProgress(
  documentId,
  (progress) => {
    console.log(`Progress: ${progress.progress}%`);
    console.log(`Status: ${progress.status}`);
    console.log(`Page: ${progress.currentPage}/${progress.totalPages}`);
  }
);

// Later, unsubscribe
unsubscribe();
```

### Background Task Management

```typescript
// Tasks are automatically registered during processing
// and managed by BackgroundTaskManager

// Manual pause
await DocumentService.pauseProcessing(documentId);

// Resume (happens automatically when app returns to foreground)
await DocumentService.processDocument(documentId, { resume: true });
```

## Testing

### Unit Tests
Located in `src/services/__tests__/DocumentService.test.ts`

Run tests:
```bash
npm test DocumentService
```

### Manual Testing Checklist
- [ ] Import PDF with <10 pages
- [ ] Import PDF with >50 pages
- [ ] Import DOCX file
- [ ] Import image file
- [ ] View document content
- [ ] Generate summary
- [ ] Generate quiz
- [ ] Background app during processing
- [ ] Resume processing after returning
- [ ] Delete document
- [ ] Handle permission denial
- [ ] Handle large files (>10MB)

## Performance Considerations

### Memory Management
1. **Lazy Loading** - PDF pages loaded on demand
2. **Chunking** - Documents split into ~2000 word chunks
3. **Caching** - Extracted text cached to avoid reprocessing
4. **Cleanup** - Automatic memory cleanup when documents unloaded

### Processing Optimization
1. **Concurrent Limits** - Maximum 5 pages processed concurrently
2. **Progress Updates** - Throttled to avoid UI blocking
3. **Background Tasks** - Long operations continue in background
4. **Abort Controllers** - Allow cancellation of in-progress operations

## Limitations

### Current Implementation
1. **OCR** - Image OCR not yet implemented (placeholder only)
2. **PDF Size** - Very large PDFs (>100MB) may cause memory issues
3. **Complex PDFs** - Tables, images, and complex layouts may not extract well
4. **Network** - Gemini API calls require network connection

### Future Enhancements
1. Implement proper OCR for images (Tesseract.js)
2. Add PDF thumbnail generation
3. Support more file formats (TXT, RTF, HTML)
4. Offline mode with queued AI operations
5. Document annotations and highlighting
6. Export processed documents
7. Share summaries and quizzes

## Dependencies

```json
{
  "react-native-document-picker": "^9.1.1",
  "react-native-fs": "^2.20.0",
  "react-native-blob-util": "^0.19.4",
  "react-native-pdf": "^6.7.3",
  "pdfjs-dist": "^3.11.174",
  "mammoth": "^1.6.0"
}
```

### Platform Setup

#### iOS
Add to `Info.plist`:
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to import documents and images</string>
<key>UIFileSharingEnabled</key>
<true/>
```

#### Android
Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
```

## Troubleshooting

### Common Issues

**Documents not importing**
- Check storage permissions
- Verify file type is supported
- Check file isn't corrupted

**Processing stuck**
- Check network connection for Gemini API
- Verify API key is configured
- Try pausing and resuming

**Out of memory errors**
- Try smaller documents
- Close other apps
- Restart the app

**Background processing stopped**
- Check app battery optimization settings
- Verify background modes enabled (iOS)
- Try keeping app in foreground for large files

## API Reference

See inline TypeScript documentation in:
- `src/services/DocumentService.ts`
- `src/types/index.ts` (Document-related interfaces)
- `src/utils/PDFProcessor.ts`
- `src/utils/BackgroundTaskManager.ts`
