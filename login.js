document.addEventListener("DOMContentLoaded", () => {

const auth = firebase.auth();

// ===== Firebase Auth Helper =====
function makeEmail(username) {
    return username.trim().toLowerCase() + "@cashxcel.app";
}

// ===== FORM SWITCHING =====
const signUpForm = document.querySelector('.signup_form');
const loginForm = document.querySelector('.login_form');
const container = document.querySelector(".login_container");


function showSignUp() {
    container.classList.remove("show-login");
    container.classList.add("show-signup");
}

function showLogin() {
    container.classList.remove("show-signup");
    container.classList.add("show-login");
}

document.getElementById("new_user").addEventListener("click", showSignUp);
document.getElementById("old_user").addEventListener("click", showLogin);







//SIGNUP

const signUpButton = document.querySelector("#signup_button");
const signUpName = document.querySelector("#set_user_name");
const signUpPassword = document.querySelector("#set_user_password");
signUpButton.addEventListener("click", async function (event) {
    event.preventDefault();

    const setUsername = signUpName.value.trim();
    const setPassword = signUpPassword.value;
    const confirmPassword = document.querySelector("#confirm_user_password").value;

    if (!setUsername || !setPassword || !confirmPassword) {
        alert("Please fill out all the fields");
        return;
    }

    if (setPassword.length !== 6 || isNaN(setPassword)) {
        alert("Password must be a 6-digit number.");
        return;
    }

    if (setPassword != confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    const email = makeEmail(setUsername);

    try {
        await auth.createUserWithEmailAndPassword(email,setPassword);
        await auth.signOut(); // force logout after signup
        alert("Account created! Please login now");
        
        signUpForm.reset();
    }
    catch (error) {
        alert(error.message);
    }
});

//LOGIN
const loginButton = document.querySelector("#login_button");
loginButton.addEventListener("click", async function (event) {
    event.preventDefault();

    const loginName = document.querySelector("#user_name").value.trim();
    const loginPassword = document.querySelector("#user_password").value;

    if (!loginName || !loginPassword) {
        alert("Please fill all the fields");
        return;
    }

    const email = makeEmail(loginName);

    try {
        await auth.signInWithEmailAndPassword(email, loginPassword);
        window.location.href = "index.html";
    }
    catch (error) {
        alert("Invalid username or password!");
        loginForm.reset();
    }
});
auth.onAuthStateChanged(user => {
    if (user) {
        window.location.href = "index.html";
    } else {
        showLogin(); // only show login AFTER firebase finishes checking
    }
});


});