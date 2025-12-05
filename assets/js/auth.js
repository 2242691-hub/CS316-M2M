document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. GATEKEEPER LOGIC (Redirects) ---
    const currentUser = JSON.parse(localStorage.getItem('m2m_user'));
    
    // Determine if we are on a "Public" page (Login or Signup)
    // We check for specific elements that only exist on these pages
    const isLoginPage = !!document.getElementById('loginForm');
    const isSignupPage = !!document.getElementById('signupForm');
    const isPublicPage = isLoginPage || isSignupPage;

    // CASE A: User is logged in, but tries to go to Login/Signup -> Redirect to Dashboard
    if (currentUser && isPublicPage) {
        if (currentUser.role === 'admin') window.location.href = 'admin.html';
        else if (currentUser.role === 'driver') window.location.href = 'driver.html';
        else window.location.href = 'map.html';
    }

    // CASE B: User is NOT logged in, but tries to go to a Protected Page -> Redirect to Login
    // (If we are NOT on a public page and NOT logged in)
    if (!currentUser && !isPublicPage) {
        window.location.href = 'index.html';
    }


    // --- 2. PASSWORD TOGGLE (Peek) ---
    const toggleIcons = document.querySelectorAll('.password-toggle');
    toggleIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const wrapper = this.closest('.input-wrapper');
            const input = wrapper.querySelector('input');
            
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.replace('fa-eye-slash', 'fa-eye');
            } else {
                input.type = 'password';
                this.classList.replace('fa-eye', 'fa-eye-slash');
            }
        });
    });


    // --- 3. MODALS (TOS & Privacy) ---
    setupModal('link-tos', 'tos-modal', 'close-tos');
    setupModal('link-pp', 'pp-modal', 'close-pp');


    // --- 4. HANDLE LOGIN ---
    if (isLoginPage) {
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-login');
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            btn.innerText = 'Logging in...';
            btn.disabled = true;

            try {
                const response = await fetch('api/auth/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const result = await response.json();

                if (result.success) {
                    localStorage.setItem('m2m_user', JSON.stringify(result.user));
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Welcome back!',
                        text: 'Redirecting...',
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        window.location.reload(); // Reload triggers the Gatekeeper check above
                    });
                } else {
                    Swal.fire('Error', result.message, 'error');
                    btn.innerText = 'Log in';
                    btn.disabled = false;
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Server connection failed', 'error');
                btn.innerText = 'Log in';
                btn.disabled = false;
            }
        });
    }


    // --- 5. HANDLE SIGNUP ---
    if (isSignupPage) {
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirm-password').value;

            if (password !== confirm) {
                Swal.fire('Error', 'Passwords do not match', 'warning');
                return;
            }

            try {
                const response = await fetch('api/auth/signup.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const result = await response.json();

                if (result.success) {
                    Swal.fire('Success', 'Account created! Please log in.', 'success').then(() => {
                        window.location.href = 'index.html';
                    });
                } else {
                    Swal.fire('Error', result.message, 'error');
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Server connection failed', 'error');
            }
        });
    }
});

function setupModal(triggerId, modalId, closeId) {
    const trigger = document.getElementById(triggerId);
    const modal = document.getElementById(modalId);
    const closeBtn = document.getElementById(closeId);

    if (trigger && modal) {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            modal.style.display = 'flex';
        });
    }
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    if (modal) {
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
}