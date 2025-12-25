// ---------------- Password Show/Hide ----------------
const passwordInput = document.getElementById("login_password");
const togglePassword = document.getElementById("togglePassword");
const eyeIcon = document.getElementById("eyeIcon");

togglePassword.addEventListener("click", () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeIcon.src = "../images/eye_close.png"; // password visible
        eyeIcon.alt = "Hide Password";
    } else {
        passwordInput.type = "password";
        eyeIcon.src = "../images/eye_open.png"; // password hidden
        eyeIcon.alt = "Show Password";
    }
});



// 🔒 HARDCODED (ONLY HERE)
const HARDCODED_USER = {
    mobile: "9999999999",
    password: "admin123"
};

document.getElementById("login_submitbtn").addEventListener("click", async () => {

    const mobile = document.getElementById("login_mobile").value.trim();
    const password = document.getElementById("login_password").value.trim();

    let valid = true;

    if (!/^[0-9]{10}$/.test(mobile)) {
        document.getElementById("mobile_error").textContent =
            "Enter valid 10-digit mobile number";
        valid = false;
    } else {
        document.getElementById("mobile_error").textContent = "";
    }

    if (password.length < 4) {
        document.getElementById("password_error").textContent =
            "Password must be at least 4 characters";
        valid = false;
    } else {
        document.getElementById("password_error").textContent = "";
    }

    if (!valid) return;

    // 🔍 CHECK DB HAS USER OR NOT
    const userExists = await window.api.checkUserExists();

    // ✅ FIRST TIME ONLY (DB EMPTY)
    if (!userExists) {
        if (
            mobile === HARDCODED_USER.mobile &&
            password === HARDCODED_USER.password
        ) {
            await window.api.saveUser({ mobile, password });

            localStorage.setItem("loggedInUsername", mobile);
            window.location.href = "sidebar.html";
            return;
        } else {
            document.getElementById("password_error").textContent =
                "Invalid first-time login credentials";
            return;
        }
    }

    // 🔐 NORMAL LOGIN (DB ONLY)
    const loginCheck = await window.api.checkLogin({ mobile, password });

    if (!loginCheck.success) {
        document.getElementById("password_error").textContent =
            "Incorrect mobile number or password";
        document.getElementById("password_error").style.color = "red";
        return;
    }

    localStorage.setItem("loggedInUsername", mobile);
    window.location.href = "sidebar.html";
});
