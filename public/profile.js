window.addEventListener('DOMContentLoaded', () => {
    const profileDataForm = document.getElementById('profiledata')
    if(profileDataForm) {
        getProfileData()
        profileDataForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const username = profileDataForm.querySelector('#username').value
        const email = profileDataForm.querySelector('#email').value
        if(!username) return showError("Username needed")
        if(!email) return showError("Email needed")
        editProfile(username, email)
    })
    }
    document.getElementById('logout').addEventListener('click', () => {
        logout()
    })
})

async function getProfileData() {
    try {
        const response = await fetch('/profiledata', {
            method: 'GET'
        })
        let result;
        try {
            result = await response.json()
        } catch (error) {
            if(!response.ok) throw new Error(response.statusText)
            throw new Error()
        }
        document.getElementById('username').value = result.username
        document.getElementById('email').value = result.email
    } catch (error) {
        showError(error.message)
    }
}

async function logout() {
  try {
    const response = await fetch('/logout', {
        method: 'GET'
    })
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
    showError(error.message)
  }
}

async function editProfile(username, email) {
  try {
    const response = await fetch('/profiledata', {
        method: 'POST',
        body: JSON.stringify({
            username: username, 
            email: email
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
  } catch (error) {
    showError(error.message || 'Registration failed. Please try again.')
  }
}