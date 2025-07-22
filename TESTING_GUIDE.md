# Testing Guide for Enhanced User Profile System

This guide provides comprehensive testing instructions for the enhanced user profile system implemented in Phase 1 Foundation.

## Quick Start

### Run All Tests
```bash
# Run all automated tests
npm test

# Run specific test files
npm test ProfileService.test.ts
npm test user-types.test.ts
npm test AuthProvider.test.tsx

# Run tests in watch mode
npm test -- --watch
```

### Type Checking
```bash
# Check TypeScript compilation
npm run type-check
```

### Linting
```bash
# Check code style
npm run lint
```

---

## 1. Automated Testing

### Unit Tests

#### ProfileService Tests (`__tests__/ProfileService.test.ts`)
Tests the core profile management functionality:

- ✅ Profile creation with defaults
- ✅ Profile retrieval and caching
- ✅ Profile updates and completion scoring
- ✅ User preferences management
- ✅ Statistics initialization
- ✅ Error handling and validation
- ✅ Cache management

**Run specific tests:**
```bash
npm test ProfileService.test.ts
```

#### User Types Tests (`__tests__/user-types.test.ts`)
Tests utility functions and type validation:

- ✅ Profile completion checking
- ✅ Completion score calculation
- ✅ Default settings generation
- ✅ Constants validation
- ✅ Type safety enforcement

**Run specific tests:**
```bash
npm test user-types.test.ts
```

#### AuthProvider Tests (`__tests__/AuthProvider.test.tsx`)
Tests authentication and profile integration:

- ✅ Authentication flow
- ✅ Profile loading on sign-in
- ✅ Profile creation for new users
- ✅ Profile updates through context
- ✅ Error handling
- ✅ Cache management

**Run specific tests:**
```bash
npm test AuthProvider.test.tsx
```

### Integration Tests

#### Firestore Security Rules Tests (`__tests__/firestore-rules.test.js`)
Tests database security and access controls:

- ✅ User profile access permissions
- ✅ Privacy settings enforcement
- ✅ Data validation rules
- ✅ Cross-user access restrictions

**Prerequisites for Firestore Rules Testing:**
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Start Firestore emulator
firebase emulators:start --only firestore

# Run rules tests
npm test firestore-rules.test.js
```

---

## 2. Manual Testing Scenarios

### Scenario 1: New User Registration

**Test Email Registration:**
1. Navigate to sign-up page
2. Enter email: `test@example.com`, password: `testpass123`, name: `Test User`
3. Click "Sign Up"

**Expected Results:**
- ✅ User account created successfully
- ✅ Basic profile created with default values
- ✅ Redirected to profile completion page or dashboard
- ✅ Profile completion score shows > 0%

**Test Google Registration:**
1. Click "Sign in with Google"
2. Complete Google OAuth flow
3. Grant necessary permissions

**Expected Results:**
- ✅ User account created with Google info
- ✅ Profile populated with Google display name and email
- ✅ Default preferences created

### Scenario 2: Existing User Sign-In

**Test Email Sign-In:**
1. Navigate to sign-in page
2. Enter existing user credentials
3. Click "Sign In"

**Expected Results:**
- ✅ User authenticated successfully
- ✅ Existing profile data loaded
- ✅ Last login timestamp updated
- ✅ Preferences and statistics accessible

**Test Auto-Login:**
1. Sign in once
2. Close browser
3. Reopen and navigate to app

**Expected Results:**
- ✅ User remains signed in
- ✅ Profile data loads automatically

### Scenario 3: Profile Management

**Test Profile Completion:**
1. Sign in as new user
2. Navigate to Profile Settings
3. Complete each section:
   - **Personal Info**: Add bio, pronouns
   - **Professional Info**: Add current role, experience, industry, target roles
   - **Preferences**: Set interview types, difficulty, session length
   - **Privacy**: Set visibility, consent preferences

**Expected Results:**
- ✅ Profile completion score increases with each section
- ✅ Changes save automatically or with save button
- ✅ Validation errors show for invalid data
- ✅ Profile marked as complete when all required fields filled

**Test Profile Updates:**
1. Change bio from "Software engineer" to "Senior software engineer"
2. Update years of experience from 2 to 3
3. Add new target company "Google"

**Expected Results:**
- ✅ Updates persist after page refresh
- ✅ Updated timestamp changes
- ✅ Completion score recalculated if applicable

### Scenario 4: Privacy Settings

**Test Visibility Settings:**
1. Set profile visibility to "Public"
2. Have another user search for your profile
3. Change to "Peers Only"
4. Test access again
5. Change to "Private"
6. Verify no access

**Expected Results:**
- ✅ Public profiles visible to all authenticated users
- ✅ Peers-only profiles visible to users with profiles
- ✅ Private profiles only visible to owner

**Test Notification Preferences:**
1. Enable/disable email notifications
2. Enable/disable push notifications
3. Test reminder settings

**Expected Results:**
- ✅ Settings save correctly
- ✅ Notifications respect user preferences

### Scenario 5: Data Consistency

**Test Cache Behavior:**
1. Update profile in one browser tab
2. Check profile in another tab
3. Sign out and sign back in

**Expected Results:**
- ✅ Changes reflect across all tabs
- ✅ Data persists after sign out/in
- ✅ No stale cached data displayed

**Test Offline Behavior:**
1. Disconnect internet
2. Try to update profile
3. Reconnect internet

**Expected Results:**
- ✅ Appropriate error messages shown
- ✅ Updates retry when connection restored
- ✅ No data corruption

### Scenario 6: Error Handling

**Test Invalid Data:**
1. Try to set years of experience to -1
2. Try to set session length to 300 minutes
3. Try to submit empty required fields

**Expected Results:**
- ✅ Validation errors displayed clearly
- ✅ Form prevents submission of invalid data
- ✅ User guided to fix errors

**Test Network Errors:**
1. Simulate network failure during profile update
2. Test with slow connection

**Expected Results:**
- ✅ Loading states shown appropriately
- ✅ Error messages displayed
- ✅ Retry mechanisms available

---

## 3. Performance Testing

### Profile Loading Performance
1. Create user with complete profile
2. Measure initial profile load time
3. Test subsequent loads (should use cache)

**Expected Results:**
- ✅ Initial load < 2 seconds
- ✅ Cached loads < 500ms
- ✅ No unnecessary API calls

### Cache Efficiency
1. Load profile multiple times
2. Check browser network tab for API calls
3. Verify cache hit/miss behavior

**Expected Results:**
- ✅ Profile cached for 5 minutes
- ✅ Cache invalidated on updates
- ✅ Memory usage reasonable

---

## 4. Security Testing

### Authentication Security
1. Try to access profile data without authentication
2. Try to access other users' profile data
3. Test session expiration

**Expected Results:**
- ✅ Unauthenticated requests rejected
- ✅ Cross-user access denied
- ✅ Expired sessions require re-authentication

### Data Validation
1. Try to submit malformed profile data via browser dev tools
2. Test SQL injection attempts in text fields
3. Test XSS attempts in profile fields

**Expected Results:**
- ✅ Invalid data rejected by Firestore rules
- ✅ No script execution from user input
- ✅ Data sanitized properly

---

## 5. Browser Compatibility Testing

### Supported Browsers
Test in each of the following:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

### Mobile Testing
- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Responsive design works correctly

---

## 6. Database Testing with Firebase Emulator

### Setup Firebase Emulator (Manual Setup Required)

**Note**: Firestore rules testing requires manual setup to avoid deployment dependency conflicts.

```bash
# 1. Install Java Runtime (required for Firebase emulator)
# Download from: https://www.java.com/download/

# 2. Install Firebase CLI
npm install -g firebase-tools

# 3. Initialize Firebase project (if not done)
firebase init firestore

# 4. Install Firebase rules testing package (manual step)
npm install --save-dev @firebase/rules-unit-testing --legacy-peer-deps

# 5. Start emulator
firebase emulators:start --only firestore
```

### Test Data Migration
1. Create test data in emulator
2. Test profile migration scripts
3. Verify data integrity

### Test Security Rules (Manual Setup Required)
```bash
# Run security rules tests (requires manual setup above)
npm test firestore-rules.test.js
```

**Important**: The `@firebase/rules-unit-testing` package is not installed by default because it requires Firebase v12, while this project uses Firebase v11. This prevents deployment conflicts. Install it manually when you need to test Firestore security rules.

---

## 7. Troubleshooting Common Issues

### Test Failures

**"Firebase/Firestore is not available"**
- Ensure Firebase config is correct
- Check if emulator is running (for rules tests)
- Verify mocks are properly set up

**"Profile service tests failing"**
- Clear Jest cache: `npx jest --clearCache`
- Check mock implementations
- Verify test data structure

**"Component tests not finding elements"**
- Check test IDs are correct
- Ensure components render properly
- Verify async operations complete

### Performance Issues

**Slow profile loading**
- Check network tab for excessive API calls
- Verify cache is working
- Check for memory leaks

**High memory usage**
- Check cache size limits
- Verify proper cleanup
- Look for event listener leaks

### Data Issues

**Profile data not persisting**
- Check Firestore rules
- Verify authentication state
- Check network connectivity

**Inconsistent data across tabs**
- Verify cache invalidation
- Check real-time listeners
- Test sign out/in flow

---

## 8. Testing Checklist

### Before Each Release

#### Automated Tests
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] TypeScript compilation successful
- [ ] Linting rules pass
- [ ] Security rules tests pass

#### Manual Testing
- [ ] New user registration (email & Google)
- [ ] Existing user sign-in
- [ ] Profile creation and completion
- [ ] Profile updates and validation
- [ ] Privacy settings enforcement
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness
- [ ] Performance within acceptable limits

#### Security Testing
- [ ] Unauthenticated access denied
- [ ] Cross-user access restricted
- [ ] Data validation working
- [ ] XSS/injection prevention

#### Database Testing
- [ ] Firestore rules enforced
- [ ] Data migrations working
- [ ] Backup and restore tested

---

## 9. Reporting Issues

When reporting bugs or issues:

1. **Environment Details**
   - Browser and version
   - Operating system
   - Screen resolution (for UI issues)

2. **Steps to Reproduce**
   - Exact sequence of actions
   - Test data used
   - Expected vs actual behavior

3. **Error Information**
   - Console errors
   - Network request failures
   - Stack traces (if applicable)

4. **Screenshots/Videos**
   - Visual proof of issues
   - Annotated screenshots highlighting problems

---

This comprehensive testing guide ensures the enhanced user profile system is thoroughly validated before production deployment. Regular testing following these procedures will maintain system reliability and user experience quality.