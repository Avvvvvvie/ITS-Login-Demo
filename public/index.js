let loginMode = 'login'

window.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login')
    const registerButton = document.getElementById('registerButton')
    const loginButton = document.getElementById('loginButton')
    const emailField = document.querySelector('.emailField')

    loginForm?.addEventListener('submit', function (e) {
        e.preventDefault()
        const username = loginForm.querySelector('#username').value
        const password = loginForm.querySelector('#password').value
        if(!username || (typeof username !== 'string')) return showError("Username needed")
        if(!password || (typeof password !== 'string')) return showError("Password needed")
        if(loginMode === 'login') {
            login(username, password)
        } else {
            const email = loginForm.querySelector('#email').value
            if(!email) return showError("Email needed")
            register(username, email, password)
        }
    });
    registerButton?.addEventListener('click', function () {
        loginMode = 'register'
        registerButton.classList.add('hidden')
        loginButton.classList.remove('hidden')
        emailField.classList.remove('hidden')
    });
    loginButton?.addEventListener('click', function () {
        registerButton.classList.remove('hidden')
        loginButton.classList.add('hidden')
        emailField.classList.add('hidden')
    });
});

async function register(username, email, password) {
  try {
    const response = await fetch('/register', {
        method: 'POST',
        body: JSON.stringify({
            username: username, 
            email: email,
            password: password
        }),
        headers: {
            "Content-Type": "application/json",
        }
    })
    let result;
    try {
        result = await response.json()
    } catch (error) {
        if(!response.ok) throw new Error(response.statusText)
        throw new Error()
    }
    if (!result.success) {
        throw new Error(result.error)
    }
    redirect(result.redirect)
  } catch (error) {
    showError(error.message || 'Registration failed. Please try again.')
  }
}

async function login(username, password) {
  try {
    const response = await fetch('/login', {
        method: 'POST',
        body: JSON.stringify({
            username: username, 
            password: password
        }),
        headers: {
            "Content-Type": "application/json",
        }
    });
    let result;
    try {
        result = await response.json()
    } catch (error) {
        if(!response.ok) throw new Error(response.statusText)
        throw new Error()
    }
    if (!result.success) {
        throw new Error(result.error);
    }
    redirect(result.redirect)
  } catch (error) {
    showError(error.message);
  }
}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      console.log('User signed out.');
    });
  }

window.onSignIn = async (googleUser) => {
    try {
    const response = await fetch('/googlelogin', {
        method: 'POST',
        body: JSON.stringify({
            googleUser
        }),
        headers: {
            "Content-Type": "application/json",
        }
    });
    let result;
    try {
        result = await response.json()
    } catch (error) {
        if(!response.ok) throw new Error(response.statusText)
        throw new Error()
    }
    if (!result.success) {
        throw new Error(result.error);
    }
    redirect(result.redirect)
  } catch (error) {
    showError(error.message);
  }
}