### Task
Implement a web application with the following functionality:
- User Registration, Login/Logout functionality
- User can select whether he wants to create an account or whether he wants to use a social login provider
- Storage and modification of a nickname per user.
- Passwords shall be stored securely
- A user can view and modify his Nickname

### Implemented Security Measures
- Content Security Policy
- Cross Origin Opener Policy
- Hashing, Salting and Peppering
- Public/Private Resources
- Nonce for inline javascript
- Password validation to enforce strong passwords
- .env file for sensitive data
- Google sign in
- Input sanitazation
- Strong error handling to prevent server information to appear on the frontend

### How to set up:

Create a .env file with this content:

```
# .env
SESSION_SECRET=super_long_random_session_secret_here
PEPPER=some_random_pepper_string_here
WEB_CLIENT_ID=your_google_client_id
```

Start the server with node server.js
