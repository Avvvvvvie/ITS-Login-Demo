### How to set up:

Create a .env file with this content:

```
# .env
SESSION_SECRET=super_long_random_session_secret_here
PEPPER=some_random_pepper_string_here
WEB_CLIENT_ID=your_google_client_id
```

Start the server with node server.js

If there are module errors, probably install the stuff in package.json with a magic command

### Todos:

#### Add pepper and salt:
- Pepper is already a constant
- See the line `const password_hash = await bcrypt.hash(password, 10)` and also the database accesses
- Go through the lecture slides and lab assignment to check if there is anything else

#### Verify the google login:
- Is it possible to receive a request by google if we are a localhost?
- Tutorial by google: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token#node.js
- At the moment only whitelisted test users can log in, so I/you have to add your email in the google cloud console
- It seems like i could give other google accounts access to the project on the google cloud console

#### Style the site :)

#### Optional: Minimize the amount of errors google throws :')
- while also minimizing what our contentSecurityPolicy allows
