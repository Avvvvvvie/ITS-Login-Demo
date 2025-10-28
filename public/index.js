let loginMode = 'login'

window.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login')
    const registerButton = document.getElementById('registerButton')
    const loginButton = document.getElementById('loginButton')
    const usernameField = document.querySelector('.usernameField')

    loginForm?.addEventListener('submit', function (e) {
        e.preventDefault()
        const email = loginForm.querySelector('#email').value
        const password = loginForm.querySelector('#password').value
        if(!email || (typeof email !== 'string')) return showError("Email needed")
        if(!password || (typeof password !== 'string')) return showError("Password needed")
        if(loginMode === 'login') {
            login(email, password)
        } else {
            const username = loginForm.querySelector('#username').value
            if(!username) return showError("usrename needed")
            register(username, email, password)
        }
    });
    registerButton?.addEventListener('click', function () {
        loginMode = 'register'
        registerButton.parentElement.classList.add('hidden')
        loginButton.parentElement.classList.remove('hidden')
        usernameField.classList.remove('hidden')
    });
    loginButton?.addEventListener('click', function () {
        registerButton.parentElement.classList.remove('hidden')
        loginButton.parentElement.classList.add('hidden')
        usernameField.classList.add('hidden')
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

async function login(email, password) {
  try {
    const response = await fetch('/login', {
        method: 'POST',
        body: JSON.stringify({
            email: email, 
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