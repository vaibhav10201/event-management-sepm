/**
 * Hospitality and Event Management System (HEMS)
 * Utilities Module - Formatting, Notifications, Modal Controls, Query Params
 */

const Utils = {
  /**
   * Formats a numeric value into INR currency string with symbol (₹)
   */
  formatCurrency(value) {
    const num = Number(value) || 0;
    return '₹' + num.toLocaleString('en-IN');
  },

  /**
   * Formats a date string (YYYY-MM-DD or ISO) into readable '25 Oct 2026'
   */
  formatDate(dateString) {
    if (!dateString) return '—';
    try {
      const parts = dateString.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day} ${months[monthIndex]} ${year}`;
      }
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  },

  /**
   * Displays a temporary notification toast (success, error, warning, info)
   */
  showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon badge based on type
    let icon = 'ℹ';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠';

    toast.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-weight:bold; font-size:1rem;">${icon}</span>
        <span>${this.escapeHtml(message)}</span>
      </div>
      <button style="background:none; border:none; color:rgba(255,255,255,0.7); cursor:pointer; font-size:1.1rem; padding:0 4px;" aria-label="Dismiss">&times;</button>
    `;

    toast.querySelector('button').onclick = () => {
      toast.remove();
    };

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        toast.style.transition = 'all 0.2s ease';
        setTimeout(() => toast.remove(), 200);
      }
    }, duration);
  },

  /**
   * Opens a modal by ID
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      const firstInput = modal.querySelector('input, select, textarea');
      if (firstInput) firstInput.focus();
    }
  },

  /**
   * Closes a modal by ID
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  /**
   * Retrieves a URL query parameter
   */
  getUrlParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  },

  /**
   * Updates or pushes a URL query parameter without full reload
   */
  setUrlParam(key, value) {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
    window.history.replaceState({}, '', url.toString());
  },

  /**
   * Simple non-blocking confirmation dialog to replace window.confirm
   */
  confirmAction(message, onConfirm, onCancel = null) {
    // Check if a confirmation modal already exists
    let modal = document.getElementById('hems-confirm-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hems-confirm-modal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width: 400px;">
          <div class="modal-header">
            <h3 class="modal-title">Confirm Action</h3>
            <button type="button" class="modal-close" id="hems-confirm-close">&times;</button>
          </div>
          <div class="modal-body">
            <p id="hems-confirm-message"></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline btn-sm" id="hems-confirm-cancel">Cancel</button>
            <button type="button" class="btn btn-danger btn-sm" id="hems-confirm-ok">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    document.getElementById('hems-confirm-message').textContent = message;
    
    const cancelBtn = document.getElementById('hems-confirm-cancel');
    const okBtn = document.getElementById('hems-confirm-ok');
    const closeBtn = document.getElementById('hems-confirm-close');

    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };

    cancelBtn.onclick = () => {
      closeModal();
      if (onCancel) onCancel();
    };

    closeBtn.onclick = () => closeModal();
    
    okBtn.onclick = () => {
      closeModal();
      onConfirm();
    };

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  /**
   * Simple HTML escaping to avoid XSS
   */
  escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Truncate long strings
   */
  truncate(str, length = 60) {
    if (!str) return '';
    return str.length > length ? str.substring(0, length) + '...' : str;
  }
};
