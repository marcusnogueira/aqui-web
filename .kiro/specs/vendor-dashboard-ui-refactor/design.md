# Design Document

## Overview

This design refactors the vendor dashboard UI from a tab-based navigation system to a modern sidebar layout while adding gallery image upload functionality. The refactor focuses on improving user experience through better visual hierarchy, responsive design, and enhanced content organization. The design maintains all existing functionality while introducing a new gallery management system for vendor offerings.

The current dashboard uses horizontal tabs for navigation and lacks visual gallery capabilities. The new design will provide a more intuitive navigation experience with a persistent sidebar and add comprehensive image management features.

## Architecture

### Current State Analysis

The existing vendor dashboard (`app/vendor/dashboard/page.tsx`) has:
- **Navigation**: Horizontal tab-based navigation with 5 sections (Overview, Profile, Locations, Announcements, Live)
- **Layout**: Single-page component with conditional rendering based on active tab
- **Image Support**: Basic profile and banner image upload functionality
- **Responsive Design**: Basic responsive behavior with fluid containers
- **State Management**: React hooks for form states, loading states, and data management
- **Database Integration**: Direct Supabase client usage for CRUD operations

### Proposed Architecture Changes

1. **Layout Structure**: Transform from tab-based to sidebar + main content area layout
2. **Navigation System**: Implement collapsible sidebar with responsive behavior
3. **Gallery System**: Add comprehensive image gallery management with drag-and-drop reordering
4. **Database Schema**: Extend vendors table with gallery_images and gallery_titles fields
5. **Component Architecture**: Modularize dashboard sections into separate components
6. **Responsive Design**: Enhanced mobile-first responsive design with sidebar collapse

## Components and Interfaces

### 1. Database Schema (Current State)

#### Vendors Table Structure
The vendors table already includes the gallery fields:
```sql
CREATE TABLE "public"."vendors" (
    -- ... existing fields ...
    "gallery_images" "text"[] DEFAULT '{}'::"text"[],
    "gallery_titles" "text"[] DEFAULT '{}'::"text"[]
);
```

The gallery system uses:
- `gallery_images`: Array of image URLs (max 10 images) - **Already exists**
- `gallery_titles`: Array of optional captions corresponding to gallery_images by index - **Already exists**

No database schema changes are required for this refactor.

### 2. Component Architecture

#### Main Dashboard Layout
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode
  vendor: Vendor
  user: User
  sidebarCollapsed: boolean
  onSidebarToggle: () => void
}

// New modular structure
components/
├── VendorDashboard/
│   ├── DashboardLayout.tsx          // Main layout with sidebar
│   ├── DashboardSidebar.tsx         // Navigation sidebar
│   ├── DashboardHeader.tsx          // Top header with actions
│   ├── sections/
│   │   ├── OverviewSection.tsx      // Dashboard overview
│   │   ├── ProfileSection.tsx       // Profile management
│   │   ├── GallerySection.tsx       // New gallery management
│   │   ├── LocationsSection.tsx     // Location management
│   │   ├── AnnouncementsSection.tsx // Announcements
│   │   └── LiveSessionSection.tsx   // Live session controls
│   └── components/
│       ├── ImageUploader.tsx        // Reusable image upload
│       ├── ImageGallery.tsx         // Gallery display/management
│       └── DragDropReorder.tsx      // Drag-and-drop functionality
```

#### Sidebar Navigation Structure
```typescript
interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType
  path?: string
  badge?: string | number
  disabled?: boolean
}

const sidebarItems: SidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: HomeIcon },
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'gallery', label: 'Gallery', icon: PhotoIcon },
  { id: 'locations', label: 'Locations', icon: MapPinIcon },
  { id: 'announcements', label: 'Announcements', icon: SpeakerphoneIcon },
  { id: 'live', label: 'Live Session', icon: VideoCameraIcon, badge: liveSession ? 'LIVE' : undefined }
]
```

### 3. Gallery Management System

#### Image Upload Interface
```typescript
interface GalleryImage {
  id: string
  url: string
  title?: string
  order: number
  uploadedAt: Date
}

interface GalleryManagerProps {
  images: GalleryImage[]
  onUpload: (files: File[]) => Promise<void>
  onDelete: (imageId: string) => Promise<void>
  onReorder: (images: GalleryImage[]) => Promise<void>
  onUpdateTitle: (imageId: string, title: string) => Promise<void>
  maxImages: number // 10
}
```

#### Image Processing Pipeline
1. **Client-side Validation**: File type (JPEG, PNG, WebP), size limits
2. **Image Compression**: Automatic resize/compress before upload
3. **Duplicate Detection**: Hash-based duplicate prevention
4. **Upload to Supabase Storage**: Organized by vendor ID
5. **Database Update**: Update gallery_images and gallery_titles arrays

### 4. Responsive Design System

#### Breakpoint Strategy
```css
/* Mobile First Approach */
.dashboard-layout {
  /* Mobile: Sidebar overlay */
  @media (max-width: 768px) {
    .sidebar { position: fixed; transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); }
    .main-content { margin-left: 0; }
  }
  
  /* Tablet: Collapsible sidebar */
  @media (min-width: 769px) and (max-width: 1024px) {
    .sidebar { width: 64px; }
    .sidebar.expanded { width: 240px; }
  }
  
  /* Desktop: Full sidebar */
  @media (min-width: 1025px) {
    .sidebar { width: 240px; }
    .main-content { margin-left: 240px; }
  }
}
```

#### Grid System for Content
```typescript
// Responsive grid for different sections
const gridConfigs = {
  overview: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  gallery: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  locations: 'grid-cols-1 lg:grid-cols-2'
}
```

## Data Models

### Enhanced Vendor Model
```typescript
// The Vendor type already includes gallery fields from the database
interface Vendor extends Database['public']['Tables']['vendors']['Row'] {
  // gallery_images: string[]   // Already included in database type
  // gallery_titles: string[]   // Already included in database type
}

interface GalleryImage {
  url: string
  title?: string
  order: number
}
```

### Gallery Management State
```typescript
interface GalleryState {
  images: GalleryImage[]
  uploading: boolean
  uploadProgress: number
  draggedItem: string | null
  selectedImages: string[]
}
```

## Error Handling

### Image Upload Errors
```typescript
enum GalleryErrorType {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  MAX_IMAGES_EXCEEDED = 'MAX_IMAGES_EXCEEDED',
  DUPLICATE_IMAGE = 'DUPLICATE_IMAGE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  COMPRESSION_FAILED = 'COMPRESSION_FAILED'
}

interface GalleryError {
  type: GalleryErrorType
  message: string
  fileName?: string
}
```

### Responsive Layout Errors
- **Sidebar State Persistence**: Handle sidebar collapse state across page refreshes
- **Mobile Navigation**: Ensure proper overlay behavior and touch interactions
- **Content Overflow**: Prevent horizontal scrolling on mobile devices

## Testing Strategy

### Unit Tests
- **Gallery Components**: Test image upload, deletion, reordering functionality
- **Responsive Utilities**: Test breakpoint detection and sidebar behavior
- **Image Processing**: Test compression and validation logic

### Integration Tests
- **Gallery Workflow**: Test complete image upload to display workflow
- **Sidebar Navigation**: Test navigation between sections with state preservation
- **Mobile Responsive**: Test sidebar collapse/expand behavior

### Visual Regression Tests
- **Layout Consistency**: Test sidebar and content area layouts across breakpoints
- **Gallery Display**: Test image grid layouts and responsive behavior
- **Component Styling**: Test visual consistency of refactored components

## Implementation Phases

### Phase 1: Layout Infrastructure
1. Create new dashboard layout components (DashboardLayout, DashboardSidebar)
2. Implement responsive sidebar with collapse functionality
3. Migrate existing tab content to new section components
4. Update routing and navigation logic

### Phase 2: Gallery Backend (Database Ready)
1. ~~Add gallery_images and gallery_titles columns to vendors table~~ **Already exists**
2. Create image upload API endpoints with validation
3. Implement image compression and storage logic
4. Add gallery CRUD operations

### Phase 3: Gallery UI Components
1. Build ImageUploader component with drag-and-drop
2. Create ImageGallery component with reordering
3. Implement gallery management interface
4. Add image title/caption editing

### Phase 4: Integration and Polish
1. Integrate gallery section into dashboard
2. Update customer-facing vendor profiles to show gallery
3. Implement responsive optimizations
4. Add loading states and error handling

### Phase 5: Testing and Deployment
1. Comprehensive testing across all breakpoints
2. Performance optimization for image loading
3. Accessibility improvements
4. Production deployment and monitoring

## Security Considerations

### Image Upload Security
- **File Type Validation**: Server-side validation of image types
- **Size Limits**: Enforce maximum file size (5MB per image)
- **Content Scanning**: Basic image content validation
- **Storage Permissions**: Proper Supabase storage bucket permissions

### Access Control
- **Vendor Ownership**: Ensure vendors can only manage their own galleries
- **Authentication**: Verify user session for all gallery operations
- **Rate Limiting**: Prevent abuse of upload endpoints

## Performance Considerations

### Image Optimization
- **Lazy Loading**: Implement lazy loading for gallery images
- **Progressive Loading**: Show low-quality placeholders while loading
- **CDN Integration**: Leverage Supabase CDN for image delivery
- **Responsive Images**: Serve appropriate image sizes for different viewports

### Layout Performance
- **Virtual Scrolling**: For large galleries (future enhancement)
- **Component Memoization**: Optimize re-renders with React.memo
- **Bundle Splitting**: Code-split gallery components for faster initial load

## Accessibility

### Keyboard Navigation
- **Sidebar Navigation**: Full keyboard accessibility for sidebar items
- **Gallery Management**: Keyboard support for image selection and reordering
- **Focus Management**: Proper focus handling in modal dialogs

### Screen Reader Support
- **ARIA Labels**: Comprehensive labeling for all interactive elements
- **Live Regions**: Announce upload progress and status changes
- **Semantic HTML**: Use proper heading hierarchy and landmarks

### Visual Accessibility
- **Color Contrast**: Ensure WCAG AA compliance for all text
- **Focus Indicators**: Clear focus indicators for all interactive elements
- **Responsive Text**: Scalable text that works with browser zoom

## Migration Strategy

### Backward Compatibility
- **Gradual Rollout**: Feature flag for new dashboard layout
- **Data Migration**: Safe migration of existing vendor data
- **Fallback Support**: Graceful degradation if new features fail

### User Communication
- **Change Notification**: Inform vendors about new dashboard features
- **Tutorial/Onboarding**: Brief walkthrough of new gallery features
- **Support Documentation**: Updated help documentation for new interface