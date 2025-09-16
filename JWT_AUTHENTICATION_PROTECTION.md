# JWT Token Expiration Protection System

## Overview

This system provides comprehensive protection against data loss due to JWT token expiration. It implements automatic token refresh, proactive user warnings, and form submission protection to ensure users never lose their work due to silent authentication failures.

## Architecture

The system consists of four main components:

1. **`authInterceptor.js`** - Core axios interceptor service
2. **`useAuthProtection.js`** - React hook for form protection
3. **`AuthStatusNotification.jsx`** - User notification component
4. **Integration code** - App-wide initialization and layout integration

## Features

### ✅ Automatic Token Refresh
- Intercepts 401 responses and automatically attempts token refresh
- Queues simultaneous requests during refresh to prevent race conditions
- Updates Redux state and localStorage automatically

### ✅ Proactive Monitoring
- Monitors token expiration time
- Automatically refreshes tokens before they expire (default: 5 minutes early)
- Provides real-time session countdown

### ✅ User Warnings
- Floating notification when session is about to expire
- Countdown timer showing time until expiration
- Manual refresh button for immediate token renewal

### ✅ Form Protection
- Checks authentication before form submission
- Prevents data loss by blocking submissions with expired tokens
- Provides graceful error handling and user feedback

## Quick Start

### 1. Initialize the System (Already Done)

The system is automatically initialized in `App.js`:

```javascript
import { initializeAuthInterceptor } from './auth';

// Initialize authentication interceptors
initializeAuthInterceptor();
```

### 2. Add to Your Forms

Use the `useAuthProtection` hook in any form component:

```javascript
import { useAuthProtection } from '../auth';

const MyForm = () => {
  const { protectedSubmit, checkAuthBeforeSubmit } = useAuthProtection();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await protectedSubmit(async () => {
        // Your form submission logic here
        await submitFormData(formData);
      });
    } catch (error) {
      setError(error.message);
    }
  };

  // Rest of your component...
};
```

### 3. User Notifications (Already Added)

The `AuthStatusNotification` component is automatically displayed in the app layout for authenticated users.

## Configuration Options

### authInterceptor.js Options

```javascript
const CONFIG = {
  PROACTIVE_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_REFRESH_RETRIES: 3,
  REFRESH_TIMEOUT: 10000, // 10 seconds
};
```

### useAuthProtection Hook Options

```javascript
const {
  protectedSubmit,
  checkAuthBeforeSubmit,
  isAuthenticated,
  needsRefresh
} = useAuthProtection({
  enableProactiveRefresh: true,    // Auto-refresh before expiry
  warnBeforeSubmit: true,          // Show warnings before submission
  onAuthLost: () => {              // Callback when auth is lost
    console.log('Authentication lost');
  }
});
```

## API Reference

### useAuthProtection Hook

#### Returns

- `isAuthenticated` (boolean) - Current authentication status
- `needsRefresh` (boolean) - Whether token needs refresh soon
- `timeUntilExpiry` (number) - Milliseconds until token expires
- `formatTimeUntilExpiry()` - Human-readable expiry countdown
- `protectedSubmit(fn)` - Wrapper for protected form submissions
- `checkAuthBeforeSubmit(options)` - Manual authentication check

#### Methods

##### `protectedSubmit(asyncFunction)`

Wraps your form submission function with authentication protection:

```javascript
await protectedSubmit(async () => {
  // Your submission logic
  await api.submitForm(data);
});
```

##### `checkAuthBeforeSubmit(options)`

Manually check authentication before submission:

```javascript
const canSubmit = await checkAuthBeforeSubmit({
  onAuthFail: () => {
    setError('Please log in again');
  }
});

if (canSubmit) {
  // Safe to submit
}
```

### AuthStatusNotification Component

Automatically displays when:
- User is authenticated
- Token expires within 10 minutes
- User hasn't dismissed the notification

Features:
- Real-time countdown
- Manual refresh button
- Dismissible alert
- Responsive design

## Integration Examples

### Example 1: Simple Form Protection

```javascript
import React, { useState } from 'react';
import { useAuthProtection } from '../auth';

const SimpleForm = () => {
  const [data, setData] = useState('');
  const { protectedSubmit } = useAuthProtection();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await protectedSubmit(async () => {
        await api.saveData(data);
        alert('Saved successfully!');
      });
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={data} onChange={(e) => setData(e.target.value)} />
      <button type="submit">Save</button>
    </form>
  );
};
```

### Example 2: Advanced Form with Status Display

```javascript
import React, { useState } from 'react';
import { Alert } from 'react-bootstrap';
import { useAuthProtection } from '../auth';

const AdvancedForm = () => {
  const [data, setData] = useState('');
  const {
    protectedSubmit,
    isAuthenticated,
    needsRefresh,
    formatTimeUntilExpiry
  } = useAuthProtection({
    onAuthLost: () => {
      alert('Session expired. Please save your work and log in again.');
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await protectedSubmit(async () => {
        await api.saveData(data);
        alert('Saved successfully!');
      });
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div>
      {/* Session Status */}
      <Alert variant={needsRefresh ? 'warning' : 'info'}>
        Session expires in: {formatTimeUntilExpiry()}
      </Alert>
      
      <form onSubmit={handleSubmit}>
        <input value={data} onChange={(e) => setData(e.target.value)} />
        <button type="submit" disabled={!isAuthenticated}>
          Save
        </button>
      </form>
    </div>
  );
};
```

## Troubleshooting

### Common Issues

1. **Tokens not refreshing automatically**
   - Check that `initializeAuthInterceptor()` is called in `App.js`
   - Verify Redux store is properly configured
   - Check browser console for errors

2. **Form submissions still failing**
   - Ensure you're using `protectedSubmit` or `checkAuthBeforeSubmit`
   - Verify the hook is imported correctly
   - Check that your API calls use the configured axios instance

3. **Notifications not showing**
   - Verify `AuthStatusNotification` is added to your layout
   - Check that user is authenticated
   - Ensure token expiry time is within the warning threshold

### Debug Mode

Enable debug logging by setting localStorage:

```javascript
localStorage.setItem('auth_debug', 'true');
```

This will log authentication events to the browser console.

## Security Considerations

1. **Token Storage**: Tokens are stored in both Redux state and localStorage
2. **Refresh Tokens**: The system uses refresh tokens to obtain new access tokens
3. **Automatic Cleanup**: Failed refresh attempts clear stored tokens
4. **Request Queuing**: Prevents multiple simultaneous refresh attempts

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

## Performance Impact

- **Bundle Size**: ~8KB additional JavaScript
- **Runtime**: Minimal overhead from interceptors
- **Network**: Reduces failed requests through proactive refresh
- **Memory**: Small Redux state additions for auth status

## Future Enhancements

- [ ] Offline support and queue management
- [ ] Configurable warning thresholds per form
- [ ] Enhanced analytics and monitoring
- [ ] Multi-tab synchronization
- [ ] Background refresh workers

## Support

For issues or questions about the authentication system:

1. Check the browser console for error messages
2. Verify your Redux store configuration
3. Review the example components in `src/components/ExampleProtectedForm.jsx`
4. Enable debug mode for detailed logging

## Changelog

### v1.0.0 (Current)
- Initial implementation
- Automatic token refresh via axios interceptors
- Form protection hooks
- User notification system
- App-wide integration
- Comprehensive documentation and examples
