function showSuccess(message) {
    const successField = document.getElementById('success')
    successField.innerText = message
}
function showError(message) {
    const errorField = document.getElementById('error')
    errorField.innerText = message
}
function redirect(link) {
    window.location.href = `${window.location.protocol}//${link}`;
}