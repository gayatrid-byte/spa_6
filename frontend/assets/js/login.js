// Login page logic
document.addEventListener('DOMContentLoaded', function () {
  // Check if already authenticated
  auth.requireGuest();

  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      // Basic validation
      if (!email || !password) {
        utils.showToast('Please enter email and password', 'error');
        return;
      }

      // Email validation
      if (!utils.isValidEmail(email)) {
        utils.showToast('Please enter a valid email', 'error');
        return;
      }

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Signing in...';
      submitBtn.disabled = true;

      try {
        const response = await api.auth.login(email, password);

        // Store token and user
        api.setToken(response.token);
        auth.setCurrentUser(response.user);

        utils.showToast('Login successful!', 'success');

        // Redirect to app
        setTimeout(() => {
          window.location.href = '/app.html';
        }, 500);
      } catch (error) {
        utils.showToast(error.message || 'Login failed', 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});