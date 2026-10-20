/**
 * Hospitality and Event Management System (HEMS)
 * Application Core - Shared UI Layout, User Profile & Navigation
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 0. Attach sign-out handlers early
  // We do this first so it works even if auth init takes time
  function attachLogout() {
    document.querySelectorAll('.btn-logout').forEach(btn => {
      // Check if already attached to avoid multiple prompts
      if (btn.dataset.logoutAttached) return;
      btn.dataset.logoutAttached = 'true';
      
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        // Remove confirm() as it can be blocked in some environments
        if (typeof AuthService !== 'undefined') {
          await AuthService.logout();
        } else {
          localStorage.removeItem('hems_active_user');
          window.location.href = 'login.html';
        }
      });
    });
  }
  attachLogout();

  // 1. Initialize auth & config
  try {
    if (typeof ApiConfig !== 'undefined') {
      await ApiConfig.init();
    }
    
    if (typeof AuthService !== 'undefined') {
      await AuthService.init();
      const user = AuthService.getCurrentUser();

      if (user) {
        const nameElements = document.querySelectorAll('.topbar-user-name');
        const roleElements = document.querySelectorAll('.topbar-user-role');
        const avatarElements = document.querySelectorAll('.topbar-user-avatar');

        nameElements.forEach(el => { el.textContent = user.name; });
        roleElements.forEach(el => { el.textContent = user.role || 'Event Planner'; });
        avatarElements.forEach(el => {
          const initials = user.name.split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'U';
          el.textContent = initials;
        });
        
        // Re-attach in case UI was rendered dynamically
        attachLogout();
      } else {
        const isAuthPage = window.location.pathname.includes('login.html') || 
                          window.location.pathname.includes('register.html') ||
                          (window.location.pathname.endsWith('index.html') && !window.location.pathname.includes('/04_Source_Code/frontend/'));
        
        if (!isAuthPage) {
          // Require sign-in on protected pages
          await AuthService.requireAuth();
          return;
        }
      }
    }
  } catch (err) {
    console.error('Core app initialization error:', err);
  }

  // 2. Highlight current page in sidebar
  const currentPath = window.location.pathname;
  const currentFilename = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'dashboard.html';

  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentFilename || href.endsWith(currentFilename))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 3. Mobile sidebar toggle
  const toggleBtn = document.querySelector('.sidebar-toggle-btn');
  const sidebar = document.querySelector('.app-sidebar');
  const overlay = document.querySelector('.mobile-overlay');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
      if (overlay) overlay.classList.toggle('active');
    });
  }

  if (overlay && sidebar) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    });
  }

  // 4. Close modals on backdrop click or ESC key
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        Utils.closeModal(modal.id);
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(modal => {
        Utils.closeModal(modal.id);
      });
    }
  });
});
