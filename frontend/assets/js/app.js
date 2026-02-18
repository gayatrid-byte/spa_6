// Main application logic
document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  auth.requireAuth();

  const currentUser = auth.getCurrentUser();
  const userRole = currentUser?.role;

  // Update user info in sidebar
  if (currentUser) {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userRole').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
  }

  // Update current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  document.getElementById('currentDate').textContent = currentDate;

  // Load company logo
  loadCompanyLogo();

  // Handle navigation
  handleNavigation();

  // Handle logout
  handleLogout();

  // Handle modal
  handleModal();

  // Load initial module
  const initialHash = window.location.hash.slice(1) || 'dashboard';
  loadModule(initialHash);
});

// Load company logo from settings
async function loadCompanyLogo() {
  try {
    const settings = await api.call('/settings', 'GET');
    const logoContainer = document.getElementById('appLogo');

    if (settings.salon && logoContainer) {
      if (settings.salon.logoUrl) {
        // Display logo with salon name below
        logoContainer.innerHTML = `
          <img src="${settings.salon.logoUrl}" alt="Company Logo" style="max-height: 40px; max-width: 200px; object-fit: contain; display: block; margin: 0 auto;">
          <h3 style="margin: 5px 0 0 0; text-align: center; font-size: 14px; font-weight: 500;">${settings.salon.name || 'Salon Manager'}</h3>
        `;
      } else {
        // Display salon name only if no logo
        logoContainer.innerHTML = `<h2>${settings.salon.name || 'Salon Manager'}</h2>`;
      }
    }
  } catch (error) {
    console.log('Could not load company logo:', error);
    // Keep default text if logo loading fails
  }
}

// Handle navigation
function handleNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const module = this.dataset.module;

      // Update active state
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');

      // Update hash
      window.location.hash = module;

      // Load module
      loadModule(module);
    });
  });

  // Handle back/forward browser navigation
  window.addEventListener('hashchange', function () {
    const hash = window.location.hash.slice(1) || 'dashboard';
    loadModule(hash);
  });
}

// Load module
async function loadModule(moduleName) {
  const contentArea = document.getElementById('contentArea');
  const pageTitle = document.getElementById('pageTitle');

  // 🔥 NORMALIZE (/bookings → bookings)
  moduleName = moduleName.replace(/^\/+/, '');


  // Check permissions
  const currentUser = auth.getCurrentUser();
  const userRole = currentUser?.role;

  if (!permissions.canAccessModule(userRole, moduleName)) {
    utils.showToast('Access denied', 'error');
    return;
  }

  // Update page title
  pageTitle.textContent = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

  // Show loading
  contentArea.innerHTML = '<div class="text-center"><div class="spinner"></div></div>';

  try {
    // Load module content
    let loadModuleName = moduleName;
    if (moduleName === 'membership-billing') loadModuleName = 'memberships';
    const modulePath = `/assets/js/modules/${loadModuleName}/${loadModuleName}.js`;
    const module = await import(modulePath);
    if (module.render) {
      await module.render(contentArea);
    }
  } catch (error) {
    console.error('Error loading module:', error);
    contentArea.innerHTML = `
      <div class="text-center">
        <h3>Module not found</h3>
        <p>The ${moduleName} module could not be loaded.</p>
      </div>
    `;
  }
}

// Handle logout
function handleLogout() {
  const logoutBtn = document.getElementById('logoutBtn');

  logoutBtn.addEventListener('click', async function () {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear session and redirect
      auth.clearSession();
      api.removeToken();
      window.location.href = '/';
    }
  });
}

// Handle modal
function handleModal() {
  const modal = document.getElementById('modal');
  // Closure handled by window.appUtils.closeModal called via inline onclick
}

// Show modal
function showModal(title, content, size = null) {
  const modal = document.getElementById('modal');
  if (!modal) return;

  // Reset modal content and use template literals to ensure evaluation
  const sizeClass = size === 'large' ? 'modal-large' : (size === 'full' || size === 'xl' ? 'modal-full' : '');

  modal.innerHTML = `
    <div class="modal-content ${sizeClass}">
      <div class="modal-header">
        <h3 id="modalTitle">${title}</h3>
        <button class="modal-close" onclick="window.appUtils.closeModal()">&times;</button>
      </div>
      <div class="modal-body" id="modalBody">
        ${content}
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// Close modal
function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('active');
}

// Export functions for modules
window.appUtils = {
  showModal,
  closeModal
};