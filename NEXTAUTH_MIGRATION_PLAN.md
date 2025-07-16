# NextAuth.js Migration Plan

## Current State
- ✅ NextAuth.js partially configured with Google OAuth
- ✅ Environment variables set up
- ❌ Still using Supabase Auth for credentials (email/password)
- ❌ User management still through Supabase Auth

## Migration Strategy

### Phase 1: Database Schema Updates
**Goal**: Prepare database to work with NextAuth.js

#### 1.1 Update Users Table
```sql
-- Add NextAuth.js required fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Make password optional (for OAuth users)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

#### 1.2 Create NextAuth.js Tables (Optional)
NextAuth.js can work with existing users table, but we can also create dedicated tables:
```sql
-- Accounts table for OAuth providers
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- Sessions table (if using database sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verification tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);
```

### Phase 2: Update NextAuth Configuration
**Goal**: Replace Supabase Auth with proper NextAuth.js providers

#### 2.1 Replace Credentials Provider
**Current (using Supabase Auth):**
```typescript
// Uses supabase.auth.signInWithPassword()
```

**New (using database directly):**
```typescript
Credentials({
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) return null;
    
    // Query users table directly
    const { data: user } = await supabase
      .from('users')
      .select('id, email, password, active_role')
      .eq('email', credentials.email)
      .single();
    
    if (!user) return null;
    
    // Verify password with bcrypt
    const isValid = await bcrypt.compare(credentials.password, user.password);
    if (!isValid) return null;
    
    return {
      id: user.id,
      email: user.email,
      active_role: user.active_role,
    };
  }
})
```

#### 2.2 Enable Apple Provider
```typescript
Apple({
  clientId: process.env.APPLE_CLIENT_ID!,
  clientSecret: process.env.APPLE_CLIENT_SECRET!,
}),
```

### Phase 3: Replace Auth Helper Functions
**Goal**: Replace all Supabase Auth calls with NextAuth.js

#### 3.1 Replace Authentication Functions
**Files to update:**
- `lib/auth-helpers.ts`
- `lib/supabase-client.ts` 
- `lib/supabase.ts`
- `lib/supabase/client.ts`

**Replace:**
```typescript
// OLD: Supabase Auth
const { data: { user } } = await supabase.auth.getUser()

// NEW: NextAuth.js
import { auth } from '@/app/api/auth/[...nextauth]/auth'
const session = await auth()
const user = session?.user
```

#### 3.2 Replace Sign In/Out Functions
**Replace:**
```typescript
// OLD: Supabase Auth
await supabase.auth.signInWithOAuth({ provider: 'google' })
await supabase.auth.signOut()

// NEW: NextAuth.js
import { signIn, signOut } from 'next-auth/react'
await signIn('google')
await signOut()
```

### Phase 4: User Registration System
**Goal**: Create new user registration without Supabase Auth

#### 4.1 Create Registration API
```typescript
// app/api/auth/register/route.ts
export async function POST(request: NextRequest) {
  const { email, password } = await request.json()
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)
  
  // Insert into users table
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password: hashedPassword,
      active_role: USER_ROLES.CUSTOMER,
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 400 })
  }
  
  return NextResponse.json({ success: true })
}
```

#### 4.2 Update Registration Forms
Replace Supabase Auth registration with API calls to new endpoint.

### Phase 5: Clean Up
**Goal**: Remove all Supabase Auth dependencies

#### 5.1 Remove Supabase Auth Calls
- Remove all `supabase.auth.*` calls
- Remove auth-related functions from Supabase client files
- Update components to use NextAuth.js hooks

#### 5.2 Update Dependencies
```json
// Remove if not needed for other features:
"@supabase/auth-helpers-nextjs": "^0.x.x",
"@supabase/auth-helpers-react": "^0.x.x",
```

## Implementation Order

### Step 1: Database Schema (Safe)
- Add new columns to users table
- Create NextAuth.js tables if needed

### Step 2: Update NextAuth Config (Safe)
- Fix credentials provider to use database directly
- Enable Apple provider
- Test OAuth flows

### Step 3: Replace Auth Helpers (Breaking)
- Update one file at a time
- Test each change
- Ensure session management works

### Step 4: User Registration (New Feature)
- Create registration API
- Update registration forms
- Test new user creation

### Step 5: Clean Up (Final)
- Remove unused Supabase Auth code
- Update dependencies
- Final testing

## Benefits After Migration

1. **Simplified Auth Flow**: Single auth system (NextAuth.js)
2. **Better OAuth Support**: Native Google/Apple integration
3. **Flexible Session Management**: JWT or database sessions
4. **Better TypeScript Support**: Native NextAuth.js types
5. **Reduced Dependencies**: Less Supabase Auth code
6. **Better Security**: Industry-standard auth patterns

## Risks & Considerations

1. **User Data Migration**: Existing users need to work seamlessly
2. **Password Handling**: Need bcrypt for password verification
3. **Session Compatibility**: Ensure existing sessions don't break
4. **OAuth Provider IDs**: Handle existing OAuth users properly
5. **RLS Policies**: Update database policies for new auth system

## Testing Strategy

1. **OAuth Testing**: Google/Apple sign-in flows
2. **Credentials Testing**: Email/password login
3. **Registration Testing**: New user creation
4. **Session Testing**: Session persistence and expiration
5. **Role Testing**: User roles and permissions
6. **Migration Testing**: Existing users can still log in