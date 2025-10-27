### How to set up

Create a .env file with this content:

```
# .env
SESSION_SECRET=super_long_random_session_secret_here
PEPPER=some_random_pepper_string_here
```

Start the server with node server.js

If there are module errors, probably install the stuff in package.json with a magic command

### Todos:

#### Add pepper and salt:
- Pepper is already a constant
- See the line `const password_hash = await bcrypt.hash(password, 10)` and also the database accesses
- Go through the lecture slides and lab assignment to check if there is anything else

#### Verify the google login:
- See the line `app.post("/googlelogin", (req, res) => { ... `
- This line is sent by the client on our website after they successfully logged in on google
- The data that google sent us is in the request variable
- Tutorial by google: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token#node.js
- At the moment only whitelisted test users can log in, so I/you have to add your email in the google cloud console
- It seems like i could give other google accounts access to the project on the google cloud console

#### Store the google login people?
- The people who logged in with google should be able to do something on our site (?)
- They should be granted a session (see `req.session.userId = user.id`)

#### Be able to sign out as google users
- https://developers.google.com/identity/gsi/web/guides/automatic-sign-in-sign-out#without-fedcm

#### Style the site :)