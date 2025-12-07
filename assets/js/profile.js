document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    setupProfileModals();
    setupProfileActions();
});

// 1. Load Data from LocalStorage (fast) then refresh from DB (accurate)
async function loadProfileData() {
    const user = JSON.parse(localStorage.getItem('m2m_user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Update UI immediately
    document.getElementById('display-name').innerText = user.name;
    document.getElementById('display-email').innerText = user.email;

    // Fill Modal Inputs
    document.getElementById('edit-name').value = user.name;
    document.getElementById('edit-email').value = user.email;
}


// 2. Setup Modals
function setupProfileModals() {
    const editModal = document.getElementById('edit-profile-modal');
    const passModal = document.getElementById('password-modal');

    // Open Buttons
    document.getElementById('btn-edit-profile').addEventListener('click', () => {
        editModal.style.display = 'flex';
    });
    
    document.getElementById('btn-change-password').addEventListener('click', () => {
        passModal.style.display = 'flex';
    });

    // Close Buttons
    document.getElementById('close-edit-profile').addEventListener('click', () => {
        editModal.style.display = 'none';
    });
    
    document.getElementById('close-password').addEventListener('click', () => {
        passModal.style.display = 'none';
    });

    // Close on Outside Click
    window.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.style.display = 'none';
        if (e.target === passModal) passModal.style.display = 'none';
    });
}

// 3. Handle Form Submissions
function setupProfileActions() {
    
    // --- UPDATE PROFILE ---
    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = JSON.parse(localStorage.getItem('m2m_user'));
        const newName = document.getElementById('edit-name').value;
        const newEmail = document.getElementById('edit-email').value;

        try {
            const response = await fetch('api/user/update_profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    name: newName,
                    email: newEmail
                })
            });
            const result = await response.json();

            if (result.success) {
                // Update Local Storage
                user.name = newName;
                user.email = newEmail;
                localStorage.setItem('m2m_user', JSON.stringify(user));
                
                // Refresh UI
                loadProfileData();
                document.getElementById('edit-profile-modal').style.display = 'none';
                
                Swal.fire('Success', 'Profile updated!', 'success');
            } else {
                Swal.fire('Error', result.message, 'error');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to update profile', 'error');
        }
    });

    // --- CHANGE PASSWORD ---
    document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = JSON.parse(localStorage.getItem('m2m_user'));
        const currentPass = document.getElementById('current-pass').value;
        const newPass = document.getElementById('new-pass').value;
        const confirmPass = document.getElementById('confirm-new-pass').value;

        if (newPass !== confirmPass) {
            Swal.fire('Warning', 'New passwords do not match', 'warning');
            return;
        }

        try {
            const response = await fetch('api/user/change_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    current_password: currentPass,
                    new_password: newPass
                })
            });
            const result = await response.json();

            if (result.success) {
                document.getElementById('password-modal').style.display = 'none';
                document.getElementById('changePasswordForm').reset();
                Swal.fire('Success', 'Password changed successfully', 'success');
            } else {
                Swal.fire('Error', result.message, 'error');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Failed to change password', 'error');
        }
    });
}