/* PulseGym - Core Single Page Application Engine */

document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------------------
  // 1. STATE MANAGEMENT
  // ----------------------------------------------------
  const state = {
    token: null,
    user: null,
    currentView: 'dashboard',
    stats: null,
    customers: [],
    pagination: {
      totalRecords: 0,
      totalPages: 1,
      currentPage: 1,
      limit: 10
    },
    filters: {
      search: '',
      status: '',
      membership: '',
      treadmill: '',
      sortBy: 'newest'
    },
    activeCustomerId: null, // For single customer view/edit
    charts: {
      dashRevenue: null,
      dashMembership: null,
      salesRevenue: null,
      salesMembership: null,
      salesTrend: null
    }
  };

  // ----------------------------------------------------
  // 2. DOM ELEMENT CACHING
  // ----------------------------------------------------
  const DOM = {
    // Top-Level Screens
    loginContainer: document.getElementById('login-container'),
    dashboardContainer: document.getElementById('dashboard-container'),
    
    // Auth Form
    loginForm: document.getElementById('login-form'),
    loginUsername: document.getElementById('login-username'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
    loginErrorText: document.getElementById('login-error-text'),
    btnLogout: document.getElementById('btn-logout'),
    adminDisplayName: document.getElementById('admin-display-name'),
    
    // Sidebar & Navigation Links
    navItems: document.querySelectorAll('.nav-item'),
    badgeExpiring: document.getElementById('badge-expiring'),
    badgeExpired: document.getElementById('badge-expired'),
    badgeInactive: document.getElementById('badge-inactive'),
    
    // Global Header Items
    currentDateText: document.getElementById('current-date-text'),
    globalSearch: document.getElementById('global-search'),
    searchDropdown: document.getElementById('search-dropdown'),
    btnNotifications: document.getElementById('btn-notifications'),
    notificationDot: document.getElementById('notification-dot'),
    notificationPopover: document.getElementById('notification-popover'),
    notificationList: document.getElementById('notification-list'),
    btnClearNotif: document.getElementById('btn-clear-notif'),
    mobileSidebarToggle: document.getElementById('mobile-sidebar-toggle'),
    mobileSidebarClose: document.getElementById('mobile-sidebar-close'),
    appSidebar: document.getElementById('app-sidebar'),
    
    // Views
    views: {
      dashboard: document.getElementById('view-dashboard'),
      customers: document.getElementById('view-customers'),
      expiring: document.getElementById('view-expiring'),
      expired: document.getElementById('view-expired'),
      inactive: document.getElementById('view-inactive'),
      sales: document.getElementById('view-sales'),
      settings: document.getElementById('view-settings')
    },
    
    // View Buttons
    btnDashAddCustomer: document.getElementById('btn-dash-add-customer'),
    btnCustomersAddCustomer: document.getElementById('btn-customers-add-customer'),
    
    // Stats Cards
    statTotal: document.getElementById('stat-total'),
    statActive: document.getElementById('stat-active'),
    statExpiring: document.getElementById('stat-expiring'),
    statExpired: document.getElementById('stat-expired'),
    statNewToday: document.getElementById('stat-new-today'),
    statRevenue: document.getElementById('stat-revenue'),
    
    // Customers Table Filter Controls
    custSearch: document.getElementById('cust-search'),
    custFilterStatus: document.getElementById('cust-filter-status'),
    custFilterMembership: document.getElementById('cust-filter-membership'),
    custFilterTreadmill: document.getElementById('cust-filter-treadmill'),
    custSortBy: document.getElementById('cust-sort-by'),
    customerTableBody: document.getElementById('customer-table-body'),
    tableSkeleton: document.getElementById('table-skeleton'),
    tableEmptyState: document.getElementById('table-empty-state'),
    
    // Pagination Controls
    pagStart: document.getElementById('pag-start'),
    pagEnd: document.getElementById('pag-end'),
    pagTotalRecords: document.getElementById('pag-total-records'),
    btnPagPrev: document.getElementById('btn-pag-prev'),
    btnPagNext: document.getElementById('btn-pag-next'),
    paginationPages: document.getElementById('pagination-pages'),

    // Expiring & Expired & Inactive Table Bodies
    tableExpiring3: document.getElementById('table-expiring-3'),
    tableExpiring7: document.getElementById('table-expiring-7'),
    tableExpiredBody: document.getElementById('table-expired-body'),
    tableInactiveBody: document.getElementById('table-inactive-body'),
    
    // Sales Analytical metrics & Charts
    salesFilterRange: document.getElementById('sales-filter-range'),
    salesStatRevenue: document.getElementById('sales-stat-revenue'),
    salesStatHighest: document.getElementById('sales-stat-highest'),
    salesStatLowest: document.getElementById('sales-stat-lowest'),
    salesStatRenewals: document.getElementById('sales-stat-renewals'),
    salesStatNew: document.getElementById('sales-stat-new'),
    
    // Settings Items
    settingsProfileForm: document.getElementById('settings-profile-form'),
    settingsUsername: document.getElementById('settings-username'),
    settingsCurrentPassword: document.getElementById('settings-current-password'),
    settingsNewPassword: document.getElementById('settings-new-password'),
    settingsConfirmPassword: document.getElementById('settings-confirm-password'),
    btnSettingsBackup: document.getElementById('btn-settings-backup'),
    inputSettingsRestore: document.getElementById('input-settings-restore'),
    btnTriggerRestore: document.getElementById('btn-trigger-restore'),
    btnExportExcel: document.getElementById('btn-export-excel'),
    btnExportCsv: document.getElementById('btn-export-csv'),
    btnExportPdf: document.getElementById('btn-export-pdf'),
    inputImportExcel: document.getElementById('input-import-excel'),
    btnTriggerImport: document.getElementById('btn-trigger-import'),
    
    // Customer Modal (Add/Edit)
    customerModal: document.getElementById('customer-modal'),
    customerForm: document.getElementById('customer-form'),
    custFormId: document.getElementById('cust-form-id'),
    custModalTitle: document.getElementById('cust-modal-title'),
    custFormName: document.getElementById('cust-form-name'),
    custFormPhone: document.getElementById('cust-form-phone'),
    custFormReg: document.getElementById('cust-form-reg'),
    custFormDate: document.getElementById('cust-form-date'),
    custFormMembership: document.getElementById('cust-form-membership'),
    custFormTreadmill: document.getElementById('cust-form-treadmill'),
    treadmillDurationGroup: document.getElementById('treadmill-duration-group'),
    custFormTreadmillDuration: document.getElementById('cust-form-treadmill-duration'),
    btnCustSubmit: document.getElementById('btn-cust-submit'),
    valCustName: document.getElementById('val-cust-name'),
    valCustPhone: document.getElementById('val-cust-phone'),
    
    // View Customer Profile Modal
    viewCustomerModal: document.getElementById('view-customer-modal'),
    viewProfileName: document.getElementById('view-profile-name'),
    viewProfileStatus: document.getElementById('view-profile-status'),
    viewProfileReg: document.getElementById('view-profile-reg'),
    viewProfilePhone: document.getElementById('view-profile-phone'),
    viewProfileJoin: document.getElementById('view-profile-join'),
    viewProfileMembership: document.getElementById('view-profile-membership'),
    viewProfileExpiry: document.getElementById('view-profile-expiry'),
    viewProfileDays: document.getElementById('view-profile-days'),
    viewProfileTreadmill: document.getElementById('view-profile-treadmill'),
    viewProfileTreadmillDurationWrapper: document.getElementById('view-profile-treadmill-duration-wrapper'),
    viewProfileTreadmillDuration: document.getElementById('view-profile-treadmill-duration'),
    viewProfilePayments: document.getElementById('view-profile-payments'),
    viewBtnDelete: document.getElementById('view-btn-delete'),
    viewBtnEdit: document.getElementById('view-btn-edit'),
    viewBtnRenew: document.getElementById('view-btn-renew'),
    
    // Renewal Modal
    renewModal: document.getElementById('renew-modal'),
    renewForm: document.getElementById('renew-form'),
    renewFormId: document.getElementById('renew-form-id'),
    renewCustomerDisplayName: document.getElementById('renew-customer-display-name'),
    renewFormMembership: document.getElementById('renew-form-membership'),
    renewFormTreadmill: document.getElementById('renew-form-treadmill'),
    renewTreadmillDurationGroup: document.getElementById('renew-treadmill-duration-group'),
    renewFormTreadmillDuration: document.getElementById('renew-form-treadmill-duration'),
    
    // Delete Confirmation
    deleteModal: document.getElementById('delete-modal'),
    deleteCustomerName: document.getElementById('delete-customer-name'),
    btnDeleteCancel: document.getElementById('btn-delete-cancel'),
    btnDeleteConfirm: document.getElementById('btn-delete-confirm'),
    
    // PWA Install elements
    pwaBanner: document.getElementById('pwa-install-banner'),
    pwaBtnLater: document.getElementById('pwa-btn-later'),
    pwaBtnInstall: document.getElementById('pwa-btn-install'),
    pwaInstructionsModal: document.getElementById('pwa-instructions-modal'),
    pwaInstructionsClose: document.getElementById('pwa-instructions-close'),
    pwaStepDetails: document.getElementById('pwa-step-details'),
    togglePushNotifications: document.getElementById('toggle-push-notifications'),
    pushStatusText: document.getElementById('push-status-text'),
    btnPushTest: document.getElementById('btn-push-test')
  };

  // ----------------------------------------------------
  // 3. TOAST & NOTIFICATION HELPERS
  // ----------------------------------------------------
  function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconName = 'check-circle';
    if (type === 'danger') iconName = 'alert-triangle';
    if (type === 'warning') iconName = 'alert-circle';
    
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="toast-icon"></i>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close"><i data-lucide="x"></i></button>
    `;
    
    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    lucide.createIcons();
    
    // Close Event
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 4000);
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  // ----------------------------------------------------
  // 4. ROUTER / NAV ROUTINE
  // ----------------------------------------------------
  function switchView(viewName) {
    state.currentView = viewName;
    
    // Hide all view panels
    Object.keys(DOM.views).forEach(key => {
      DOM.views[key].classList.add('hidden');
    });

    // Show selected view panel
    DOM.views[viewName].classList.remove('hidden');

    // Update active nav link classes
    DOM.navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      }
    });

    // Close mobile side drawer on selection
    DOM.appSidebar.classList.remove('active');

    // Load data specific to the view
    loadViewData(viewName);
    
    // Refresh push notification toggle state
    if (viewName === 'settings') {
      updatePushToggleState();
    }
  }

  async function loadViewData(viewName) {
    if (!state.token) return;
    
    try {
      // Global header details refresh
      updateGlobalHeader();
      
      switch (viewName) {
        case 'dashboard':
          await refreshDashboardStats();
          break;
        case 'customers':
          state.pagination.currentPage = 1;
          await refreshCustomersList();
          break;
        case 'expiring':
          await loadExpiringView();
          break;
        case 'expired':
          await loadExpiredView();
          break;
        case 'inactive':
          await loadInactiveView();
          break;
        case 'sales':
          await loadSalesAnalytics();
          break;
        case 'settings':
          loadSettingsView();
          break;
      }
    } catch (err) {
      console.error(`Error entering view ${viewName}:`, err);
      showToast('Data Error', 'Failed to retrieve views data.', 'danger');
    }
  }

  function updateGlobalHeader() {
    // Current date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    DOM.currentDateText.textContent = new Date().toLocaleDateString('en-US', options);
    
    // Profile name
    if (state.user) {
      DOM.adminDisplayName.textContent = state.user.username;
      DOM.settingsUsername.value = state.user.username;
    }
  }

  // ----------------------------------------------------
  // 5. AUTH / LOGIN ENGINE
  // ----------------------------------------------------
  async function checkAuthSession() {
    const token = api.getToken();
    if (token) {
      state.token = token;
      try {
        const user = await api.getMe();
        state.user = user;
        
        DOM.loginContainer.classList.add('hidden');
        DOM.dashboardContainer.classList.remove('hidden');
        
        switchView('dashboard');
      } catch (err) {
        // Token is invalid/expired
        api.setToken(null);
        state.token = null;
        state.user = null;
        DOM.loginContainer.classList.remove('hidden');
        DOM.dashboardContainer.classList.add('hidden');
      }
    } else {
      DOM.loginContainer.classList.remove('hidden');
      DOM.dashboardContainer.classList.add('hidden');
    }
    lucide.createIcons();
  }

  DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = DOM.loginUsername.value.trim();
    const password = DOM.loginPassword.value;

    DOM.loginForm.classList.remove('animate-shake');
    DOM.loginError.classList.add('hidden');

    try {
      const data = await api.login(username, password);
      showToast('Login Success', `Welcome back, ${data.user.username}!`);
      
      api.setToken(data.token);
      state.token = data.token;
      state.user = data.user;
      
      DOM.loginContainer.classList.add('hidden');
      DOM.dashboardContainer.classList.remove('hidden');
      
      DOM.loginUsername.value = '';
      DOM.loginPassword.value = '';
      
      switchView('dashboard');
    } catch (err) {
      console.error('Login failure:', err);
      DOM.loginErrorText.textContent = err.message || 'Connection failure.';
      DOM.loginError.classList.remove('hidden');
      DOM.loginForm.classList.add('animate-shake');
      showToast('Access Denied', err.message || 'Authentication error', 'danger');
    }
  });

  DOM.btnLogout.addEventListener('click', () => {
    api.setToken(null);
    state.token = null;
    state.user = null;
    showToast('Signed Out', 'You have successfully signed out.');
    DOM.loginContainer.classList.remove('hidden');
    DOM.dashboardContainer.classList.add('hidden');
    lucide.createIcons();
  });

  window.addEventListener('unauthorized', () => {
    state.token = null;
    state.user = null;
    DOM.loginContainer.classList.remove('hidden');
    DOM.dashboardContainer.classList.add('hidden');
    showToast('Session Expired', 'Please login again.', 'warning');
  });

  // ----------------------------------------------------
  // 6. DASHBOARD HOME
  // ----------------------------------------------------
  async function refreshDashboardStats() {
    try {
      const stats = await api.getStats();
      state.stats = stats;

      // Populate dashboard statistics counters
      DOM.statTotal.textContent = stats.totalMembers;
      DOM.statActive.textContent = stats.activeMembers;
      DOM.statExpiring.textContent = stats.expiringSoon;
      DOM.statExpired.textContent = stats.expiredMembers;
      DOM.statNewToday.textContent = stats.newMembersToday;
      DOM.statRevenue.textContent = formatCurrency(stats.revenueThisMonth);

      // Populate Side Navigation warning badges
      updateNavBadges(stats);
      
      // Update Topnav Notification alerts
      updateNotificationSystem(stats);

      // Fetch sales reports data for dashboard charts (Default 3 Months)
      const salesData = await api.getSalesReport('past_3_months');
      renderDashboardCharts(salesData);

    } catch (err) {
      console.error('Stats rendering error:', err);
      showToast('Dashboard Error', 'Failed to retrieve analytics metrics.', 'danger');
    }
  }

  function updateNavBadges(stats) {
    // Expiring Soon
    if (stats.expiringSoon > 0) {
      DOM.badgeExpiring.textContent = stats.expiringSoon;
      DOM.badgeExpiring.classList.remove('hidden');
    } else {
      DOM.badgeExpiring.classList.add('hidden');
    }

    // Expired
    if (stats.expiredMembers > 0) {
      DOM.badgeExpired.textContent = stats.expiredMembers;
      DOM.badgeExpired.classList.remove('hidden');
    } else {
      DOM.badgeExpired.classList.add('hidden');
    }

    // Inactive (expired > 14 days)
    if (stats.inactiveMembers > 0) {
      DOM.badgeInactive.textContent = stats.inactiveMembers;
      DOM.badgeInactive.classList.remove('hidden');
    } else {
      DOM.badgeInactive.classList.add('hidden');
    }
  }

  function updateNotificationSystem(stats) {
    const list = DOM.notificationList;
    list.innerHTML = '';
    
    let totalAlerts = 0;
    const alerts = [];

    if (stats.notifications.expiresTomorrow > 0) {
      alerts.push({
        type: 'danger',
        title: 'Critical Expiry',
        desc: `${stats.notifications.expiresTomorrow} membership(s) expire tomorrow.`
      });
      totalAlerts++;
    }

    if (stats.notifications.expiresThisWeek > 0) {
      alerts.push({
        type: 'warning',
        title: 'Expiries Impending',
        desc: `${stats.notifications.expiresThisWeek} membership(s) expire this week.`
      });
      totalAlerts++;
    }

    if (stats.notifications.inactiveAlerts > 0) {
      alerts.push({
        type: 'gray',
        title: 'Inactive members',
        desc: `${stats.notifications.inactiveAlerts} expired members remain unrenewed (>14 days).`
      });
      totalAlerts++;
    }

    if (totalAlerts > 0) {
      DOM.notificationDot.classList.remove('hidden');
      alerts.forEach(alert => {
        const item = document.createElement('div');
        item.className = 'popover-item';
        
        let iconColor = 'primary-text';
        let iconName = 'bell';
        if (alert.type === 'danger') { iconColor = 'danger-text'; iconName = 'alert-triangle'; }
        if (alert.type === 'warning') { iconColor = 'warning-text'; iconName = 'clock'; }
        if (alert.type === 'gray') { iconColor = 'text-sub'; iconName = 'user-x'; }

        item.innerHTML = `
          <i data-lucide="${iconName}" class="${iconColor}"></i>
          <div class="popover-item-text">
            <span class="popover-item-title">${alert.title}</span>
            <span class="popover-item-desc">${alert.desc}</span>
          </div>
        `;
        list.appendChild(item);
      });
    } else {
      DOM.notificationDot.classList.add('hidden');
      list.innerHTML = `<div class="popover-empty">All clean. No pending notifications.</div>`;
    }
    
    lucide.createIcons();
  }

  // ----------------------------------------------------
  // CHART RENDERING (CHART.JS)
  // ----------------------------------------------------
  function renderDashboardCharts(salesData) {
    // 1. Revenue monthly Bar Chart
    if (state.charts.dashRevenue) {
      state.charts.dashRevenue.destroy();
    }
    
    const ctxBar = document.getElementById('chart-monthly-revenue').getContext('2d');
    state.charts.dashRevenue = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: salesData.charts.barChart.labels,
        datasets: [{
          label: 'Monthly Sales (₹)',
          data: salesData.charts.barChart.data,
          backgroundColor: '#2563eb',
          borderColor: '#1d4ed8',
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { family: 'Inter', size: 10 },
              callback: function(value) { return '₹' + value; }
            }
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 10 } }
          }
        }
      }
    });

    // 2. Membership Distribution Pie/Doughnut Chart
    if (state.charts.dashMembership) {
      state.charts.dashMembership.destroy();
    }
    
    const ctxPie = document.getElementById('chart-membership-distribution').getContext('2d');
    state.charts.dashMembership = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: salesData.charts.pieChart.labels,
        datasets: [{
          data: salesData.charts.pieChart.data,
          backgroundColor: ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#6b7280'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { family: 'Inter', size: 11 } }
          }
        },
        cutout: '65%'
      }
    });
  }

  // ----------------------------------------------------
  // 7. CUSTOMERS LIST & PAGINATION
  // ----------------------------------------------------
  async function refreshCustomersList() {
    DOM.customerTableBody.innerHTML = '';
    DOM.tableSkeleton.classList.remove('hidden');
    DOM.tableEmptyState.classList.add('hidden');
    
    // Build query params
    const query = {
      search: state.filters.search,
      status: state.filters.status,
      membership: state.filters.membership,
      treadmill: state.filters.treadmill,
      sortBy: state.filters.sortBy,
      page: state.pagination.currentPage,
      limit: state.pagination.limit
    };

    try {
      const data = await api.getCustomers(query);
      state.customers = data.customers;
      state.pagination = data.pagination;

      DOM.tableSkeleton.classList.add('hidden');

      if (state.customers.length === 0) {
        DOM.tableEmptyState.classList.remove('hidden');
        updatePaginationUI();
        return;
      }

      state.customers.forEach(cust => {
        const tr = document.createElement('tr');
        
        let statusClass = 'active';
        if (cust.status === 'Expiring Soon') statusClass = 'expiring';
        if (cust.status === 'Expired') statusClass = 'expired';
        if (cust.status === 'Inactive') statusClass = 'inactive';

        tr.innerHTML = `
          <td><strong class="font-outfit text-main">${cust.register_number}</strong></td>
          <td>
            <div class="result-main">
              <span class="result-name">${cust.name}</span>
              <span class="result-meta">Registered: ${formatDate(cust.join_date)}</span>
            </div>
          </td>
          <td>${cust.phone}</td>
          <td>${formatDate(cust.join_date)}</td>
          <td>
            <div class="result-main">
              <span>${cust.membership_type}</span>
              <span class="result-meta">${cust.treadmill_access === 1 ? 'Treadmill Enabled' : 'No Treadmill'}</span>
            </div>
          </td>
          <td>${formatDate(cust.membership_expiry)}</td>
          <td>
            <span class="badge-status ${statusClass}">${cust.status}</span>
          </td>
          <td class="text-right">
            <button class="btn btn-outline btn-sm action-view-btn" data-id="${cust.id}"><i data-lucide="eye" style="width:14px;height:14px"></i>View</button>
            <button class="btn btn-outline btn-sm action-edit-btn" data-id="${cust.id}"><i data-lucide="edit-3" style="width:14px;height:14px"></i>Edit</button>
            <button class="btn btn-primary btn-sm action-renew-btn" data-id="${cust.id}"><i data-lucide="rotate-ccw" style="width:14px;height:14px"></i>Renew</button>
            <button class="btn btn-outline btn-sm btn-danger-hover action-delete-btn" data-id="${cust.id}"><i data-lucide="trash-2" style="width:14px;height:14px"></i>Delete</button>
          </td>
        `;
        DOM.customerTableBody.appendChild(tr);
      });
      
      lucide.createIcons();
      updatePaginationUI();
      attachTableActionListeners();

    } catch (err) {
      console.error('Customer fetch list error:', err);
      DOM.tableSkeleton.classList.add('hidden');
      showToast('Error', 'Failed to reload customer list.', 'danger');
    }
  }

  function updatePaginationUI() {
    const { currentPage, totalPages, totalRecords, limit } = state.pagination;
    
    const start = totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalRecords);

    DOM.pagStart.textContent = start;
    DOM.pagEnd.textContent = end;
    DOM.pagTotalRecords.textContent = totalRecords;

    DOM.btnPagPrev.disabled = (currentPage === 1);
    DOM.btnPagNext.disabled = (currentPage === totalPages || totalPages === 0);

    // Generate numeric pages
    DOM.paginationPages.innerHTML = '';
    
    // Add page numbers intelligently
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let p = startPage; p <= endPage; p++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-num ${p === currentPage ? 'active' : ''}`;
      pageBtn.textContent = p;
      pageBtn.addEventListener('click', () => {
        state.pagination.currentPage = p;
        refreshCustomersList();
      });
      DOM.paginationPages.appendChild(pageBtn);
    }
  }

  function attachTableActionListeners() {
    // View customer profile
    document.querySelectorAll('.action-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openViewCustomerModal(id);
      });
    });

    // Edit customer info
    document.querySelectorAll('.action-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openEditCustomerModal(id);
      });
    });

    // Quick renew membership
    document.querySelectorAll('.action-renew-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openRenewalModal(id);
      });
    });

    // Delete customer profile
    document.querySelectorAll('.action-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openDeleteModal(id);
      });
    });
  }

  // ----------------------------------------------------
  // FILTER TRIGGERS
  // ----------------------------------------------------
  let searchTimeout = null;
  DOM.custSearch.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    state.filters.search = e.target.value;
    searchTimeout = setTimeout(() => {
      state.pagination.currentPage = 1;
      refreshCustomersList();
    }, 300); // 300ms debounce
  });

  DOM.custFilterStatus.addEventListener('change', (e) => {
    state.filters.status = e.target.value;
    state.pagination.currentPage = 1;
    refreshCustomersList();
  });

  DOM.custFilterMembership.addEventListener('change', (e) => {
    state.filters.membership = e.target.value;
    state.pagination.currentPage = 1;
    refreshCustomersList();
  });

  DOM.custFilterTreadmill.addEventListener('change', (e) => {
    state.filters.treadmill = e.target.value;
    state.pagination.currentPage = 1;
    refreshCustomersList();
  });

  DOM.custSortBy.addEventListener('change', (e) => {
    state.filters.sortBy = e.target.value;
    state.pagination.currentPage = 1;
    refreshCustomersList();
  });

  // Prev / Next Page clicks
  DOM.btnPagPrev.addEventListener('click', () => {
    if (state.pagination.currentPage > 1) {
      state.pagination.currentPage--;
      refreshCustomersList();
    }
  });

  DOM.btnPagNext.addEventListener('click', () => {
    if (state.pagination.currentPage < state.pagination.totalPages) {
      state.pagination.currentPage++;
      refreshCustomersList();
    }
  });

  // ----------------------------------------------------
  // ADD & EDIT MODAL & REACTIVE FORM LOGIC
  // ----------------------------------------------------
  DOM.btnDashAddCustomer.addEventListener('click', () => openAddCustomerModal());
  DOM.btnCustomersAddCustomer.addEventListener('click', () => openAddCustomerModal());

  function openAddCustomerModal() {
    DOM.customerForm.reset();
    DOM.custFormId.value = '';
    DOM.custModalTitle.textContent = 'Add New Gym Member';
    
    // Automatically pre-fill Joining Date with today
    DOM.custFormDate.value = new Date().toISOString().split('T')[0];
    
    // Hide treadmill duration dropdown on start
    DOM.treadmillDurationGroup.classList.add('hidden');
    DOM.custFormTreadmill.checked = false;

    // Reset validations
    DOM.valCustName.classList.add('hidden');
    DOM.valCustPhone.classList.add('hidden');
    DOM.custFormName.classList.remove('danger-border');
    DOM.custFormPhone.classList.remove('danger-border');

    DOM.customerModal.classList.remove('hidden');
    DOM.custFormName.focus();
    lucide.createIcons();
  }

  // Reactive Treadmill duration: Default selected value matches Membership select!
  DOM.custFormMembership.addEventListener('change', (e) => {
    if (DOM.custFormTreadmill.checked) {
      DOM.custFormTreadmillDuration.value = e.target.value;
    }
  });

  DOM.custFormTreadmill.addEventListener('change', (e) => {
    if (e.target.checked) {
      DOM.treadmillDurationGroup.classList.remove('hidden');
      DOM.custFormTreadmillDuration.value = DOM.custFormMembership.value;
    } else {
      DOM.treadmillDurationGroup.classList.add('hidden');
    }
  });

  async function openEditCustomerModal(id) {
    try {
      const data = await api.getCustomer(id);
      const cust = data.customer;

      DOM.custFormId.value = cust.id;
      DOM.custModalTitle.textContent = `Edit Profile: ${cust.name}`;
      DOM.custFormName.value = cust.name;
      DOM.custFormPhone.value = cust.phone;
      DOM.custFormReg.value = cust.register_number;
      DOM.custFormDate.value = cust.join_date;
      DOM.custFormMembership.value = cust.membership_type;
      
      if (cust.treadmill_access === 1) {
        DOM.custFormTreadmill.checked = true;
        DOM.treadmillDurationGroup.classList.remove('hidden');
        DOM.custFormTreadmillDuration.value = cust.treadmill_duration || cust.membership_type;
      } else {
        DOM.custFormTreadmill.checked = false;
        DOM.treadmillDurationGroup.classList.add('hidden');
      }

      // Reset validations
      DOM.valCustName.classList.add('hidden');
      DOM.valCustPhone.classList.add('hidden');

      DOM.customerModal.classList.remove('hidden');
      lucide.createIcons();
    } catch (err) {
      console.error('Error fetching member details for edit:', err);
      showToast('Error', 'Failed to retrieve profile edit form details.', 'danger');
    }
  }

  // Submit Handler for Add/Edit Form
  DOM.customerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Front-end validations
    const name = DOM.custFormName.value.trim();
    const phone = DOM.custFormPhone.value.trim();
    const cleanPhone = phone.replace(/\D/g, '');

    let isValid = true;

    if (name === '') {
      DOM.valCustName.classList.remove('hidden');
      DOM.custFormName.classList.add('danger-border');
      isValid = false;
    } else {
      DOM.valCustName.classList.add('hidden');
      DOM.custFormName.classList.remove('danger-border');
    }

    if (cleanPhone.length !== 10) {
      DOM.valCustPhone.classList.remove('hidden');
      DOM.custFormPhone.classList.add('danger-border');
      isValid = false;
    } else {
      DOM.valCustPhone.classList.add('hidden');
      DOM.custFormPhone.classList.remove('danger-border');
    }

    if (!isValid) return;

    // Build payload
    const payload = {
      name,
      phone: cleanPhone,
      register_number: DOM.custFormReg.value.trim(),
      join_date: DOM.custFormDate.value,
      membership_type: DOM.custFormMembership.value,
      treadmill_access: DOM.custFormTreadmill.checked ? 1 : 0,
      treadmill_duration: DOM.custFormTreadmill.checked ? DOM.custFormTreadmillDuration.value : null
    };

    const editId = DOM.custFormId.value;

    try {
      if (editId) {
        // Edit Action
        await api.updateCustomer(editId, payload);
        showToast('Profile Saved', `${name}'s profile has been updated.`);
      } else {
        // Add Action
        const result = await api.createCustomer(payload);
        showToast('Member Added', `Registered ${name} with ID ${result.registerNumber}.`);
      }
      
      DOM.customerModal.classList.add('hidden');
      
      // Refresh current screen
      if (state.currentView === 'customers') {
        refreshCustomersList();
      } else {
        switchView('customers');
      }
      
      refreshDashboardStats(); // update counters

    } catch (err) {
      console.error('Customer form submit error:', err);
      showToast('Action Failed', err.message || 'Operation error.', 'danger');
    }
  });

  // Modal Closers
  document.querySelectorAll('.btn-modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.customerModal.classList.add('hidden');
    });
  });

  // ----------------------------------------------------
  // 8. VIEW MEMBER PROFILE DETAILS (MODAL)
  // ----------------------------------------------------
  async function openViewCustomerModal(id) {
    try {
      const data = await api.getCustomer(id);
      const cust = data.customer;
      const payments = data.payments;

      state.activeCustomerId = cust.id;

      // Populate details
      DOM.viewProfileName.textContent = cust.name;
      DOM.viewProfileReg.textContent = cust.register_number;
      DOM.viewProfilePhone.textContent = cust.phone;
      DOM.viewProfileJoin.textContent = formatDate(cust.join_date);
      DOM.viewProfileMembership.textContent = cust.membership_type;
      DOM.viewProfileExpiry.textContent = formatDate(cust.membership_expiry);
      
      // Treadmill
      if (cust.treadmill_access === 1) {
        DOM.viewProfileTreadmill.textContent = 'Enabled';
        DOM.viewProfileTreadmillDurationWrapper.classList.remove('hidden');
        DOM.viewProfileTreadmillDuration.textContent = cust.treadmill_duration || cust.membership_type;
      } else {
        DOM.viewProfileTreadmill.textContent = 'Disabled';
        DOM.viewProfileTreadmillDurationWrapper.classList.add('hidden');
      }

      // Status Badge Styling
      DOM.viewProfileStatus.className = 'badge-large';
      let badgeClass = 'active-bg';
      if (cust.status === 'Expiring Soon') badgeClass = 'expiring-bg';
      if (cust.status === 'Expired') badgeClass = 'expired-bg';
      if (cust.status === 'Inactive') badgeClass = 'inactive-bg';
      DOM.viewProfileStatus.classList.add(badgeClass);
      DOM.viewProfileStatus.textContent = cust.status;

      // Remaining Days Calculation
      if (cust.remaining_days >= 0) {
        DOM.viewProfileDays.innerHTML = `<strong>${cust.remaining_days}</strong> Days Remaining`;
      } else {
        DOM.viewProfileDays.innerHTML = `<strong>${cust.expired_since || Math.abs(cust.remaining_days)}</strong> Days Expired`;
      }

      // Populate payment logs
      const tbody = DOM.viewProfilePayments;
      tbody.innerHTML = '';

      if (payments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#94a3b8">No payments recorded.</td></tr>`;
      } else {
        payments.forEach(pay => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${formatDate(pay.payment_date)}</td>
            <td><span class="badge ${pay.type === 'New' ? 'success-bg' : 'warning-bg'}">${pay.type}</span></td>
            <td>Gym Membership: ${pay.membership_type}</td>
            <td>${pay.treadmill_access === 1 ? `Treadmill: ${pay.treadmill_duration}` : 'None'}</td>
            <td class="text-right"><strong>${formatCurrency(pay.amount)}</strong></td>
          `;
          tbody.appendChild(tr);
        });
      }

      DOM.viewCustomerModal.classList.remove('hidden');
      lucide.createIcons();

    } catch (err) {
      console.error('Fetch customer profile error:', err);
      showToast('Load Error', 'Failed to retrieve profile view logs.', 'danger');
    }
  }

  document.querySelectorAll('.btn-view-modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.viewCustomerModal.classList.add('hidden');
    });
  });

  // Action links from Profile view modal
  DOM.viewBtnEdit.addEventListener('click', () => {
    DOM.viewCustomerModal.classList.add('hidden');
    openEditCustomerModal(state.activeCustomerId);
  });

  DOM.viewBtnRenew.addEventListener('click', () => {
    DOM.viewCustomerModal.classList.add('hidden');
    openRenewalModal(state.activeCustomerId);
  });

  DOM.viewBtnDelete.addEventListener('click', () => {
    DOM.viewCustomerModal.classList.add('hidden');
    openDeleteModal(state.activeCustomerId);
  });

  // ----------------------------------------------------
  // 9. RENEW MEMBERSHIP POPUP
  // ----------------------------------------------------
  async function openRenewalModal(id) {
    try {
      const data = await api.getCustomer(id);
      const cust = data.customer;
      
      state.activeCustomerId = cust.id;
      DOM.renewFormId.value = cust.id;
      DOM.renewCustomerDisplayName.textContent = cust.name;
      DOM.renewFormMembership.value = cust.membership_type;
      
      if (cust.treadmill_access === 1) {
        DOM.renewFormTreadmill.checked = true;
        DOM.renewTreadmillDurationGroup.classList.remove('hidden');
        DOM.renewFormTreadmillDuration.value = cust.treadmill_duration || cust.membership_type;
      } else {
        DOM.renewFormTreadmill.checked = false;
        DOM.renewTreadmillDurationGroup.classList.add('hidden');
      }

      DOM.renewModal.classList.remove('hidden');
      lucide.createIcons();

    } catch (err) {
      console.error('Error fetching details for renewal:', err);
      showToast('Error', 'Failed to load customer renewal form.', 'danger');
    }
  }

  // Reactive renew treadmill access checkbox
  DOM.renewFormMembership.addEventListener('change', (e) => {
    if (DOM.renewFormTreadmill.checked) {
      DOM.renewFormTreadmillDuration.value = e.target.value;
    }
  });

  DOM.renewFormTreadmill.addEventListener('change', (e) => {
    if (e.target.checked) {
      DOM.renewTreadmillDurationGroup.classList.remove('hidden');
      DOM.renewFormTreadmillDuration.value = DOM.renewFormMembership.value;
    } else {
      DOM.renewTreadmillDurationGroup.classList.add('hidden');
    }
  });

  DOM.renewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = DOM.renewFormId.value;

    const payload = {
      membership_type: DOM.renewFormMembership.value,
      treadmill_access: DOM.renewFormTreadmill.checked ? 1 : 0,
      treadmill_duration: DOM.renewFormTreadmill.checked ? DOM.renewFormTreadmillDuration.value : null
    };

    try {
      const result = await api.renewCustomer(id, payload);
      showToast('Membership Renewed', `Successfully renewed membership. New expiry: ${formatDate(result.newExpiry)}`);
      DOM.renewModal.classList.add('hidden');

      // Refresh view states
      if (state.currentView === 'customers') refreshCustomersList();
      if (state.currentView === 'expiring') loadExpiringView();
      if (state.currentView === 'expired') loadExpiredView();
      if (state.currentView === 'inactive') loadInactiveView();
      
      refreshDashboardStats();

    } catch (err) {
      console.error('Renewal processing error:', err);
      showToast('Renewal Failed', err.message || 'Operation error.', 'danger');
    }
  });

  document.querySelectorAll('.btn-renew-close').forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.renewModal.classList.add('hidden');
    });
  });

  // ----------------------------------------------------
  // 10. DELETE MODAL & CONFIRMATION
  // ----------------------------------------------------
  async function openDeleteModal(id) {
    try {
      const data = await api.getCustomer(id);
      state.activeCustomerId = id;
      DOM.deleteCustomerName.textContent = data.customer.name;
      DOM.deleteModal.classList.remove('hidden');
      lucide.createIcons();
    } catch (err) {
      console.error('Error fetching customer info for delete:', err);
      showToast('Error', 'Failed to retrieve profile metadata.', 'danger');
    }
  }

  DOM.btnDeleteCancel.addEventListener('click', () => {
    DOM.deleteModal.classList.add('hidden');
  });

  DOM.btnDeleteConfirm.addEventListener('click', async () => {
    const id = state.activeCustomerId;
    try {
      await api.deleteCustomer(id);
      showToast('Member Deleted', 'Successfully deleted the customer profile.');
      DOM.deleteModal.classList.add('hidden');

      // Refresh layout views
      if (state.currentView === 'customers') refreshCustomersList();
      if (state.currentView === 'expiring') loadExpiringView();
      if (state.currentView === 'expired') loadExpiredView();
      if (state.currentView === 'inactive') loadInactiveView();
      
      refreshDashboardStats();
    } catch (err) {
      console.error('Failed to delete customer:', err);
      showToast('Delete Failed', err.message || 'Error occurred.', 'danger');
    }
  });

  // ----------------------------------------------------
  // 11. EXPIRING / EXPIRED / INACTIVE MEMBERS VIEWS
  // ----------------------------------------------------
  async function loadExpiringView() {
    DOM.tableExpiring3.innerHTML = '<tr><td colspan="6" style="text-align:center"><div class="skeleton-row"></div></td></tr>';
    DOM.tableExpiring7.innerHTML = '<tr><td colspan="6" style="text-align:center"><div class="skeleton-row"></div></td></tr>';

    try {
      const result3 = await api.getCustomers({ status: 'Expiring Soon', sortBy: 'expiry', limit: 50 });
      const expiringCustomers = result3.customers;
      
      // Segregate into Within 3 Days & Within 7 Days
      const within3 = [];
      const within7 = [];

      expiringCustomers.forEach(cust => {
        if (cust.remaining_days <= 3) {
          within3.push(cust);
        } else {
          within7.push(cust);
        }
      });

      renderExpiringTable(DOM.tableExpiring3, within3);
      renderExpiringTable(DOM.tableExpiring7, within7);

    } catch (err) {
      console.error('Error loading expiring view lists:', err);
      showToast('Load Error', 'Failed to populate expiring tables.', 'danger');
    }
  }

  function renderExpiringTable(container, customersList) {
    container.innerHTML = '';
    
    if (customersList.length === 0) {
      container.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:24px">No expiring members found in this category.</td></tr>`;
      return;
    }

    customersList.forEach(cust => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong class="font-outfit">${cust.register_number}</strong></td>
        <td>${cust.name}</td>
        <td>${cust.phone}</td>
        <td>${formatDate(cust.membership_expiry)}</td>
        <td><span class="badge warning-bg">${cust.remaining_days} Day(s)</span></td>
        <td class="text-right">
          <button class="btn btn-outline btn-sm action-view-btn" data-id="${cust.id}">View</button>
          <button class="btn btn-primary btn-sm action-renew-btn" data-id="${cust.id}">Renew</button>
        </td>
      `;
      container.appendChild(tr);
    });

    lucide.createIcons();
    attachSectionActionListeners(container);
  }

  async function loadExpiredView() {
    const tbody = DOM.tableExpiredBody;
    tbody.innerHTML = '<tr><td colspan="6"><div class="skeleton-row"></div></td></tr>';

    try {
      const result = await api.getCustomers({ status: 'Expired', limit: 100 });
      tbody.innerHTML = '';

      if (result.customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:40px">No members expired within the last 14 days.</td></tr>`;
        return;
      }

      result.customers.forEach(cust => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong class="font-outfit">${cust.register_number}</strong></td>
          <td>${cust.name}</td>
          <td>${cust.phone}</td>
          <td>${formatDate(cust.membership_expiry)}</td>
          <td><span class="badge danger-bg">${cust.expired_since || Math.abs(cust.remaining_days)} Days ago</span></td>
          <td class="text-right">
            <button class="btn btn-outline btn-sm action-view-btn" data-id="${cust.id}">View</button>
            <button class="btn btn-primary btn-sm action-renew-btn" data-id="${cust.id}">Renew</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      lucide.createIcons();
      attachSectionActionListeners(tbody);
    } catch (err) {
      console.error('Error loading expired view:', err);
      showToast('Error', 'Failed to retrieve expired list.', 'danger');
    }
  }

  async function loadInactiveView() {
    const tbody = DOM.tableInactiveBody;
    tbody.innerHTML = '<tr><td colspan="6"><div class="skeleton-row"></div></td></tr>';

    try {
      const result = await api.getCustomers({ status: 'Inactive', limit: 100 });
      tbody.innerHTML = '';

      if (result.customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:40px">No inactive members found (>14 days unrenewed).</td></tr>`;
        return;
      }

      result.customers.forEach(cust => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong class="font-outfit">${cust.register_number}</strong></td>
          <td>${cust.name}</td>
          <td>${cust.phone}</td>
          <td>${formatDate(cust.membership_expiry)}</td>
          <td><span class="badge gray-bg">${cust.expired_since || Math.abs(cust.remaining_days)} Days</span></td>
          <td class="text-right">
            <button class="btn btn-outline btn-sm action-view-btn" data-id="${cust.id}">View</button>
            <button class="btn btn-primary btn-sm action-renew-btn" data-id="${cust.id}">Renew</button>
            <button class="btn btn-outline btn-sm btn-danger-hover action-delete-btn" data-id="${cust.id}">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      lucide.createIcons();
      attachSectionActionListeners(tbody);
    } catch (err) {
      console.error('Error loading inactive view:', err);
      showToast('Error', 'Failed to retrieve inactive members.', 'danger');
    }
  }

  function attachSectionActionListeners(parentContainer) {
    parentContainer.querySelectorAll('.action-view-btn').forEach(btn => {
      btn.addEventListener('click', () => openViewCustomerModal(btn.getAttribute('data-id')));
    });

    parentContainer.querySelectorAll('.action-renew-btn').forEach(btn => {
      btn.addEventListener('click', () => openRenewalModal(btn.getAttribute('data-id')));
    });

    parentContainer.querySelectorAll('.action-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => openDeleteModal(btn.getAttribute('data-id')));
    });
  }

  // ----------------------------------------------------
  // 12. SALES REPORT VIEW & CHARTS
  // ----------------------------------------------------
  DOM.salesFilterRange.addEventListener('change', () => {
    loadSalesAnalytics();
  });

  async function loadSalesAnalytics() {
    const range = DOM.salesFilterRange.value;
    try {
      const data = await api.getSalesReport(range);
      const sum = data.summary;

      // Fill analytic values
      DOM.salesStatRevenue.textContent = formatCurrency(sum.totalRevenue);
      DOM.salesStatHighest.textContent = sum.highestSalesMonth.name === 'N/A' 
        ? 'N/A' 
        : `${sum.highestSalesMonth.name} (${formatCurrency(sum.highestSalesMonth.amount)})`;
      DOM.salesStatLowest.textContent = sum.lowestSalesMonth.name === 'N/A' 
        ? 'N/A' 
        : `${sum.lowestSalesMonth.name} (${formatCurrency(sum.lowestSalesMonth.amount)})`;
      DOM.salesStatRenewals.textContent = sum.totalRenewals;
      DOM.salesStatNew.textContent = sum.newCustomers;

      renderSalesCharts(data.charts);

    } catch (err) {
      console.error('Error loading sales analytical report:', err);
      showToast('Analytics Error', 'Failed to load sales analytics reports.', 'danger');
    }
  }

  function renderSalesCharts(chartData) {
    // 1. Monthly Revenue Bar Chart
    if (state.charts.salesRevenue) state.charts.salesRevenue.destroy();
    
    const ctxBar = document.getElementById('chart-sales-monthly').getContext('2d');
    state.charts.salesRevenue = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: chartData.barChart.labels,
        datasets: [{
          label: 'Revenue (₹)',
          data: chartData.barChart.data,
          backgroundColor: '#2563eb',
          borderColor: '#1d4ed8',
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: '#f1f5f9' }, ticks: { callback: v => '₹' + v } },
          x: { grid: { display: false } }
        }
      }
    });

    // 2. Membership Distribution Pie/Doughnut Chart
    if (state.charts.salesMembership) state.charts.salesMembership.destroy();
    
    const ctxPie = document.getElementById('chart-sales-membership').getContext('2d');
    state.charts.salesMembership = new Chart(ctxPie, {
      type: 'pie',
      data: {
        labels: chartData.pieChart.labels,
        datasets: [{
          data: chartData.pieChart.data,
          backgroundColor: ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#6b7280'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 12, font: { size: 10 } }
          }
        }
      }
    });

    // 3. Renewal vs New Line Chart
    if (state.charts.salesTrend) state.charts.salesTrend.destroy();
    
    const ctxLine = document.getElementById('chart-sales-trend').getContext('2d');
    state.charts.salesTrend = new Chart(ctxLine, {
      type: 'line',
      data: {
        labels: chartData.lineChart.labels,
        datasets: [
          {
            label: 'Renewals (Count)',
            data: chartData.lineChart.renewalsCount,
            borderColor: '#16a34a',
            backgroundColor: '#16a34a',
            borderWidth: 2.5,
            tension: 0.35,
            fill: false
          },
          {
            label: 'New Registrations (Count)',
            data: chartData.lineChart.newCount,
            borderColor: '#2563eb',
            backgroundColor: '#2563eb',
            borderWidth: 2.5,
            tension: 0.35,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 20, font: { size: 11 } } }
        },
        scales: {
          y: { grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // ----------------------------------------------------
  // 13. SETTINGS & UTILITIES (BACKUP / RESTORE / SHEET EXPORT)
  // ----------------------------------------------------
  function loadSettingsView() {
    updateGlobalHeader();
    DOM.settingsCurrentPassword.value = '';
    DOM.settingsNewPassword.value = '';
    DOM.settingsConfirmPassword.value = '';
  }

  // Update Username and Password profile
  DOM.settingsProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = DOM.settingsUsername.value.trim();
    const curPassword = DOM.settingsCurrentPassword.value;
    const newPassword = DOM.settingsNewPassword.value;
    const confPassword = DOM.settingsConfirmPassword.value;

    if (newPassword && newPassword !== confPassword) {
      showToast('Validation Error', 'New passwords do not match.', 'danger');
      return;
    }

    const payload = {
      username: newUsername,
      currentPassword: curPassword || null,
      newPassword: newPassword || null
    };

    try {
      await api.updateProfile(payload);
      showToast('Success', 'Profile settings updated successfully.');
      
      // Update state locally
      state.user.username = newUsername.toLowerCase();
      updateGlobalHeader();

      // Clear password boxes
      DOM.settingsCurrentPassword.value = '';
      DOM.settingsNewPassword.value = '';
      DOM.settingsConfirmPassword.value = '';

    } catch (err) {
      console.error('Failed to update admin profile:', err);
      showToast('Profile Update Failed', err.message || 'Operation error.', 'danger');
    }
  });

  // DB Backup
  DOM.btnSettingsBackup.addEventListener('click', async () => {
    try {
      showToast('Processing', 'Assembling database backup binary...', 'warning');
      const blob = await api.downloadBackup();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `PulseGym_Backup_${new Date().toISOString().split('T')[0]}.db`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      showToast('Backup Completed', 'SQLite database file saved successfully.');
    } catch (err) {
      console.error('Backup fail:', err);
      showToast('Backup Error', 'Failed to generate database download.', 'danger');
    }
  });

  // DB Restore File Selection
  DOM.btnTriggerRestore.addEventListener('click', () => {
    DOM.inputSettingsRestore.click();
  });

  DOM.inputSettingsRestore.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.db')) {
      showToast('Invalid File', 'Only .db SQLite database files are accepted.', 'danger');
      return;
    }

    if (!confirm('CAUTION: Restoring the database will overwrite ALL current members, registrations and payments. Are you sure you want to proceed?')) {
      DOM.inputSettingsRestore.value = '';
      return;
    }

    try {
      showToast('Restoring', 'Uploading backup and resetting connections...', 'warning');
      await api.restoreBackup(file);
      showToast('Restore Successful', 'The database has been fully restored.');
      
      // Clear value and redirect to dashboard
      DOM.inputSettingsRestore.value = '';
      refreshDashboardStats();
      switchView('dashboard');
    } catch (err) {
      console.error('Restore database failure:', err);
      DOM.inputSettingsRestore.value = '';
      showToast('Restore Failed', err.message || 'Verification failed.', 'danger');
    }
  });

  // Excel Batch Import using SheetJS
  DOM.btnTriggerImport.addEventListener('click', () => {
    DOM.inputImportExcel.click();
  });

  DOM.inputImportExcel.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(evt) {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet);

        if (rawJson.length === 0) {
          showToast('Empty Sheet', 'No data rows found inside the spreadsheet.', 'danger');
          DOM.inputImportExcel.value = '';
          return;
        }

        // Map column variations to DB payloads
        const formattedCustomers = rawJson.map(row => {
          return {
            name: row['Name'] || row['Customer Name'] || row['CustomerName'] || row['name'] || '',
            phone: String(row['Phone'] || row['Mobile'] || row['Mobile Number'] || row['phone'] || ''),
            register_number: row['Register Number'] || row['Reg ID'] || row['register_number'] || row['RegID'] || null,
            join_date: parseExcelDate(row['Join Date'] || row['Joining Date'] || row['join_date'] || row['date']),
            membership_type: row['Membership Type'] || row['Membership'] || row['membership_type'] || '1 Month',
            treadmill_access: row['Treadmill Access'] || row['Treadmill'] || row['treadmill_access'] || 0,
            treadmill_duration: row['Treadmill Duration'] || row['treadmill_duration'] || null
          };
        });

        showToast('Processing', `Importing ${formattedCustomers.length} members...`, 'warning');
        const importRes = await api.importCustomers(formattedCustomers);

        if (importRes.importedCount > 0) {
          showToast('Import Complete', `Successfully imported ${importRes.importedCount} gym members.`);
        }

        if (importRes.errors.length > 0) {
          console.warn('Import warnings:', importRes.errors);
          alert('Some rows could not be imported:\n' + importRes.errors.slice(0, 10).join('\n') + (importRes.errors.length > 10 ? `\n...and ${importRes.errors.length - 10} more errors.` : ''));
        }

        DOM.inputImportExcel.value = '';
        refreshDashboardStats();
        switchView('customers');

      } catch (err) {
        console.error('Import parse error:', err);
        DOM.inputImportExcel.value = '';
        showToast('Import Error', 'Failed to parse Excel file content.', 'danger');
      }
    };

    reader.readAsArrayBuffer(file);
  });

  // SheetJS Excel date parser helper
  function parseExcelDate(val) {
    if (!val) return null;
    // SheetJS sometimes imports dates as serial numbers (e.g. 45000 = year 2023 approx)
    if (typeof val === 'number') {
      const utc_days  = Math.floor(val - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return date_info.toISOString().split('T')[0];
    }
    
    // Attempt standard JS Date parsing
    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return val;
  }

  // Export SheetJS Excel file
  DOM.btnExportExcel.addEventListener('click', async () => {
    try {
      showToast('Exporting', 'Retrieving database records...', 'warning');
      const rawData = await api.getExportData();

      const wb = XLSX.utils.book_new();
      
      // Format customers sheet
      const customersData = rawData.customers.map(c => ({
        'Register ID': c.register_number,
        'Name': c.name,
        'Mobile Number': c.phone,
        'Join Date': c.join_date,
        'Membership Plan': c.membership_type,
        'Membership Expiry': c.membership_expiry,
        'Treadmill Access': c.treadmill_access === 1 ? 'Yes' : 'No',
        'Treadmill Expiry': c.treadmill_expiry || 'N/A',
        'Current Status': c.status
      }));

      // Format payments sheet
      const paymentsData = rawData.payments.map(p => ({
        'Payment Date': p.payment_date,
        'Register ID': p.register_number,
        'Customer Name': p.customer_name,
        'Transaction Type': p.type,
        'Plan Duration': p.membership_type,
        'Treadmill Added': p.treadmill_access === 1 ? `Yes (${p.treadmill_duration})` : 'No',
        'Amount Paid': p.amount
      }));

      const wsCust = XLSX.utils.json_to_sheet(customersData);
      const wsPay = XLSX.utils.json_to_sheet(paymentsData);

      XLSX.utils.book_append_sheet(wb, wsCust, 'Gym Customers');
      XLSX.utils.book_append_sheet(wb, wsPay, 'Payment Logs');

      XLSX.writeFile(wb, `PulseGym_Records_${new Date().toISOString().split('T')[0]}.xlsx`);
      showToast('Export Completed', 'Excel worksheet downloaded successfully.');
    } catch (err) {
      console.error('Excel export fail:', err);
      showToast('Export Error', 'Failed to generate Excel download.', 'danger');
    }
  });

  // Export CSV file (Customers table)
  DOM.btnExportCsv.addEventListener('click', async () => {
    try {
      showToast('Exporting', 'Generating CSV stream...', 'warning');
      const rawData = await api.getExportData();

      const customersData = rawData.customers.map(c => ({
        'Register ID': c.register_number,
        'Name': c.name,
        'Phone': c.phone,
        'JoinDate': c.join_date,
        'Membership': c.membership_type,
        'ExpiryDate': c.membership_expiry,
        'TreadmillAccess': c.treadmill_access === 1 ? 'Yes' : 'No',
        'Status': c.status
      }));

      const ws = XLSX.utils.json_to_sheet(customersData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PulseGym_Members_${new Date().toISOString().split('T')[0]}.csv`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      showToast('Export Completed', 'CSV file downloaded successfully.');
    } catch (err) {
      console.error('CSV export failure:', err);
      showToast('Export Error', 'Failed to generate CSV data.', 'danger');
    }
  });

  // Print PDF Generator
  DOM.btnExportPdf.addEventListener('click', async () => {
    try {
      showToast('Preparing', 'Compiling report printable layout...', 'warning');
      const rawData = await api.getExportData();

      // Open new tab and write structured HTML
      const printWindow = window.open('', '_blank');
      
      let customerRowsHtml = '';
      rawData.customers.forEach(c => {
        customerRowsHtml += `
          <tr>
            <td>${c.register_number}</td>
            <td>${c.name}</td>
            <td>${c.phone}</td>
            <td>${c.join_date}</td>
            <td>${c.membership_type}</td>
            <td>${c.membership_expiry}</td>
            <td>${c.status}</td>
          </tr>
        `;
      });

      let paymentRowsHtml = '';
      rawData.payments.slice(0, 30).forEach(p => {
        paymentRowsHtml += `
          <tr>
            <td>${p.payment_date}</td>
            <td>${p.register_number}</td>
            <td>${p.customer_name}</td>
            <td>${p.type}</td>
            <td>${p.membership_type}</td>
            <td>₹${p.amount}</td>
          </tr>
        `;
      });

      printWindow.document.write(`
        <html>
        <head>
          <title>PulseGym - Systems Data Summary Report</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; }
            h1 { font-family: 'Outfit', sans-serif; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 40px; }
            h2 { font-size: 1.25rem; margin-top: 30px; margin-bottom: 15px; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #f1f5f9; padding: 10px; text-align: left; font-size: 0.75rem; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            td { padding: 10px; font-size: 0.85rem; border-bottom: 1px solid #e2e8f0; }
            .badge { display: inline-block; padding: 2px 8px; font-size: 0.725rem; font-weight: bold; border-radius: 10px; background-color: #f1f5f9; }
            .footer { margin-top: 60px; font-size: 0.75rem; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <button onclick="window.print()" class="no-print" style="margin-bottom: 20px; padding: 10px 20px; background-color: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Report / Save as PDF</button>
          
          <h1>PulseGym - Executive Summary Report</h1>
          <p>Generated Date: ${new Date().toLocaleDateString()}</p>

          <h2>Active & Registered Members Database</h2>
          <table>
            <thead>
              <tr>
                <th>Reg ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Join Date</th>
                <th>Membership</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${customerRowsHtml}
            </tbody>
          </table>

          <h2>Recent Payments & Revenue Logs (Last 30 Logs)</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reg ID</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Membership</th>
                <th>Paid Amount</th>
              </tr>
            </thead>
            <tbody>
              ${paymentRowsHtml}
            </tbody>
          </table>

          <div class="footer">
            PulseGym Management Dashboard System. All rights reserved. &copy; ${new Date().getFullYear()}
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      showToast('Export Completed', 'Report printable opened in a new tab.');

    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('Export Error', 'Failed to generate PDF document layout.', 'danger');
    }
  });

  // ----------------------------------------------------
  // 14. GLOBAL LIVE SEARCH FUNCTIONALITY
  // ----------------------------------------------------
  let globalSearchTimeout = null;
  DOM.globalSearch.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    clearTimeout(globalSearchTimeout);

    if (val === '') {
      DOM.searchDropdown.classList.add('hidden');
      return;
    }

    globalSearchTimeout = setTimeout(async () => {
      try {
        const result = await api.getCustomers({ search: val, limit: 5 });
        DOM.searchDropdown.innerHTML = '';
        
        if (result.customers.length === 0) {
          DOM.searchDropdown.innerHTML = `<div style="padding:10px 16px;font-size:0.8rem;color:#94a3b8">No matching members found.</div>`;
        } else {
          result.customers.forEach(cust => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.setAttribute('data-id', cust.id);
            
            let badgeClass = 'success-bg';
            if (cust.status === 'Expiring Soon') badgeClass = 'warning-bg';
            if (cust.status === 'Expired') badgeClass = 'danger-bg';
            if (cust.status === 'Inactive') badgeClass = 'gray-bg';

            item.innerHTML = `
              <div class="result-main">
                <span class="result-name">${cust.name}</span>
                <span class="result-meta">${cust.register_number} &bull; ${cust.phone}</span>
              </div>
              <span class="badge ${badgeClass}">${cust.status}</span>
            `;
            
            item.addEventListener('click', () => {
              DOM.searchDropdown.classList.add('hidden');
              DOM.globalSearch.value = '';
              openViewCustomerModal(cust.id);
            });

            DOM.searchDropdown.appendChild(item);
          });
        }
        DOM.searchDropdown.classList.remove('hidden');
      } catch (err) {
        console.error('Global search err:', err);
      }
    }, 200); // 200ms debounce
  });

  // Close dropdown on clicking outside
  document.addEventListener('click', (e) => {
    if (!DOM.globalSearch.contains(e.target) && !DOM.searchDropdown.contains(e.target)) {
      DOM.searchDropdown.classList.add('hidden');
    }
  });

  // ----------------------------------------------------
  // 15. NOTIFICATION POPUP AND GENERAL INTERACTIVE LISTENERS
  // ----------------------------------------------------
  DOM.btnNotifications.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.notificationPopover.classList.toggle('hidden');
  });

  DOM.btnClearNotif.addEventListener('click', () => {
    DOM.notificationPopover.classList.add('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!DOM.btnNotifications.contains(e.target) && !DOM.notificationPopover.contains(e.target)) {
      DOM.notificationPopover.classList.add('hidden');
    }
  });

  // Mobile sidebar burger toggles
  DOM.mobileSidebarToggle.addEventListener('click', () => {
    DOM.appSidebar.classList.add('active');
  });

  DOM.mobileSidebarClose.addEventListener('click', () => {
    DOM.appSidebar.classList.remove('active');
  });

  // Set default view triggers from links
  DOM.navItems.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.getAttribute('data-view');
      switchView(view);
    });
  });

  // Customer Modal toggle handlers
  document.querySelectorAll('.btn-modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.customerModal.classList.add('hidden');
    });
  });

  // Init checks on startup
  checkAuthSession();

  // ----------------------------------------------------
  // 16. PWA INSTALLATION BANNER & SERVICE WORKER
  // ----------------------------------------------------
  
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('ServiceWorker registered successfully with scope: ', reg.scope))
        .catch((err) => console.error('ServiceWorker registration failed: ', err));
    });
  }

  let deferredPrompt = null;
  const DISMISSAL_KEY = 'pwa_dismissed_until';
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  // Check if app is running in standalone mode (already installed)
  const isAppInstalled = () => {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  };

  // Check if banner is currently silenced by user dismissal
  const isBannerDismissed = () => {
    const dismissedUntil = localStorage.getItem(DISMISSAL_KEY);
    if (!dismissedUntil) return false;
    return Date.now() < parseInt(dismissedUntil, 10);
  };

  // Initialize PWA installation events
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default browser banner
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    
    // Check if we should display the banner
    if (!isAppInstalled() && !isBannerDismissed()) {
      showPWABanner();
    }
  });

  // Handle successful app installation
  window.addEventListener('appinstalled', (e) => {
    console.log('PulseGym App installed successfully!');
    hidePWABanner(true); // instant hide
    showToast('🎉 Gym Management App installed successfully!', 'You can now access PulseGym directly from your home screen.');
    deferredPrompt = null;
  });

  function showPWABanner() {
    if (!DOM.pwaBanner) return;
    DOM.pwaBanner.classList.remove('hidden');
    DOM.pwaBanner.classList.remove('pwa-banner-slide-up');
    DOM.pwaBanner.classList.add('pwa-banner-slide-down');
    
    // Activate glowing pulse animation on install button
    if (DOM.pwaBtnInstall) {
      DOM.pwaBtnInstall.classList.add('pwa-btn-glowing');
    }
  }

  function hidePWABanner(instant = false) {
    if (!DOM.pwaBanner) return;
    if (instant) {
      DOM.pwaBanner.classList.add('hidden');
      DOM.pwaBanner.classList.remove('pwa-banner-slide-down');
    } else {
      DOM.pwaBanner.classList.remove('pwa-banner-slide-down');
      DOM.pwaBanner.classList.add('pwa-banner-slide-up');
      setTimeout(() => {
        DOM.pwaBanner.classList.add('hidden');
      }, 400); // match CSS slide-up transition duration
    }
  }

  // Detect platform and return custom installation steps
  function getPlatformInstructions() {
    const ua = navigator.userAgent.toLowerCase();
    
    // iOS detection
    if (/iphone|ipad|ipod/.test(ua)) {
      return {
        platform: 'iPhone (Safari)',
        steps: [
          'Tap the <strong>Share</strong> button <i data-lucide="share" class="inline-icon"></i> (at the bottom or top of Safari).',
          'Scroll down and select <strong>Add to Home Screen</strong>.',
          'Tap <strong>Add</strong> in the top right corner to install.'
        ]
      };
    }
    
    // Samsung Browser detection
    if (/samsungbrowser/.test(ua)) {
      return {
        platform: 'Samsung Internet',
        steps: [
          'Tap the <strong>Menu</strong> button <i data-lucide="menu" class="inline-icon"></i> (three horizontal lines).',
          'Select <strong>Add Page To</strong>.',
          'Choose <strong>Home Screen</strong> from the list.'
        ]
      };
    }
    
    // Android Chrome detection
    if (/android/.test(ua) && /chrome/.test(ua)) {
      return {
        platform: 'Android (Chrome)',
        steps: [
          'Tap the <strong>Menu</strong> button <i data-lucide="more-vertical" class="inline-icon"></i> (three vertical dots).',
          'Select <strong>Install App</strong> or <strong>Add to Home Screen</strong>.',
          'Confirm by tapping <strong>Install</strong>.'
        ]
      };
    }
    
    // Default Desktop Chrome/Edge fallback
    return {
      platform: 'Desktop (Chrome/Edge)',
      steps: [
        'Look at the address bar at the top of your browser.',
        'Click the <strong>Install</strong> icon <i data-lucide="plus-circle" class="inline-icon"></i> (computer/download icon) inside the address bar.',
        'Click <strong>Install</strong> in the confirmation popup.'
      ]
    };
  }

  // Later button click handler
  if (DOM.pwaBtnLater) {
    DOM.pwaBtnLater.addEventListener('click', () => {
      hidePWABanner();
      // Dismiss for 7 days
      const dismissUntil = Date.now() + SEVEN_DAYS_MS;
      localStorage.setItem(DISMISSAL_KEY, dismissUntil.toString());
    });
  }

  // Install button click handler
  if (DOM.pwaBtnInstall) {
    DOM.pwaBtnInstall.addEventListener('click', async () => {
      if (deferredPrompt) {
        // Trigger native prompt
        deferredPrompt.prompt();
        // Wait for user choice
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA install outcome: ${outcome}`);
        if (outcome === 'accepted') {
          hidePWABanner(true);
        }
        deferredPrompt = null;
      } else {
        // Display custom instructions modal
        showInstructionsModal();
      }
    });
  }

  // Instructions Modal controls
  function showInstructionsModal() {
    if (!DOM.pwaInstructionsModal || !DOM.pwaStepDetails) return;
    
    const { platform, steps } = getPlatformInstructions();
    document.getElementById('pwa-instructions-title').textContent = `Install on ${platform}`;
    
    DOM.pwaStepDetails.innerHTML = steps.map((step, idx) => `
      <div class="pwa-step-item animate-fade-in">
        <div class="pwa-step-num">${idx + 1}</div>
        <p class="pwa-step-text">${step}</p>
      </div>
    `).join('');
    
    // Refresh lucide icons inside the modal dynamic HTML
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    DOM.pwaInstructionsModal.classList.remove('hidden');
  }

  if (DOM.pwaInstructionsClose) {
    DOM.pwaInstructionsClose.addEventListener('click', () => {
      DOM.pwaInstructionsModal.classList.add('hidden');
    });
  }

  // Trigger banner check manually on page load if prompt already available or if standalone detection fails
  if (!isAppInstalled() && !isBannerDismissed()) {
    // Some browsers or devices don't fire beforeinstallprompt (like iOS). We can show the banner anyway as a guide
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSamsung = /samsungbrowser/.test(ua);
    
    if (isIOS || isSamsung) {
      showPWABanner();
    }
  }

  // Temporary PWA Diagnostics Logger
  setTimeout(() => {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      console.log('--- PWA BANNER DIAGNOSTICS ---');
      console.log('Banner Display:', window.getComputedStyle(banner).display);
      console.log('Banner Visibility:', window.getComputedStyle(banner).visibility);
      console.log('Banner Classes:', banner.className);
      console.log('Banner Rect:', banner.getBoundingClientRect());
      ['.pwa-banner-content', '.pwa-banner-left', '.pwa-banner-right', '.pwa-banner-actions', '.btn-pwa-install'].forEach(sel => {
        const el = banner.querySelector(sel);
        if (el) {
          console.log(`${sel} Rect:`, el.getBoundingClientRect(), 'Display:', window.getComputedStyle(el).display, 'Opacity:', window.getComputedStyle(el).opacity);
        } else {
          console.log(`${sel} NOT found in DOM`);
        }
      });
    } else {
      console.log('PWA Banner element NOT found in DOM');
    }
  }, 1000);

  // ----------------------------------------------------
  // 17. PUSH NOTIFICATIONS SWITCH CONTROLLER
  // ----------------------------------------------------

  // Convert VAPID key to Uint8Array for push manager subscription
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Update subscription switch state on load
  async function updatePushToggleState() {
    if (!DOM.togglePushNotifications) return;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      DOM.pushStatusText.textContent = 'Status: Not supported in this browser';
      DOM.togglePushNotifications.disabled = true;
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      
      if (sub && Notification.permission === 'granted') {
        DOM.togglePushNotifications.checked = true;
        DOM.pushStatusText.textContent = 'Status: Enabled (Every 1 min)';
      } else {
        DOM.togglePushNotifications.checked = false;
        DOM.pushStatusText.textContent = Notification.permission === 'denied' 
          ? 'Status: Blocked by browser' 
          : 'Status: Disabled';
      }
    } catch (err) {
      console.error('Error reading subscription state:', err);
    }
  }

  // Subscribe to push notifications
  async function subscribeUserToPush() {
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('Permission Denied', 'Browser notification permissions are required to enable alerts.', 'danger');
        updatePushToggleState();
        return;
      }

      DOM.pushStatusText.textContent = 'Status: Enabling...';

      // Get public VAPID key from backend settings route
      const res = await api.request('/settings/vapid-public-key');
      if (!res || !res.publicKey) {
        throw new Error('Failed to retrieve server credentials.');
      }

      const reg = await navigator.serviceWorker.ready;
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(res.publicKey)
      };

      const subscription = await reg.pushManager.subscribe(subscribeOptions);
      console.log('PWA Push Subscription registered:', subscription);

      // Save subscription payload on server
      await api.request('/settings/push-subscribe', {
        method: 'POST',
        body: JSON.stringify({ subscription })
      });

      showToast('Notifications Enabled', 'You will now receive native alerts every 1 minute for membership updates.');
      updatePushToggleState();
    } catch (err) {
      console.error('Subscription process failed:', err);
      showToast('Subscription Error', err.message || 'Failed to enable push notifications.', 'danger');
      updatePushToggleState();
    }
  }

  // Unsubscribe from push notifications
  async function unsubscribeUserFromPush() {
    try {
      DOM.pushStatusText.textContent = 'Status: Disabling...';
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();

        // Inform backend
        await api.request('/settings/push-unsubscribe', {
          method: 'POST',
          body: JSON.stringify({ endpoint })
        });
      }

      showToast('Notifications Disabled', 'Membership alerts have been turned off.');
      updatePushToggleState();
    } catch (err) {
      console.error('Unsubscribe process failed:', err);
      showToast('Unsubscribe Error', 'Failed to disable push notifications cleanly.', 'danger');
      updatePushToggleState();
    }
  }

  // Toggle listener
  if (DOM.togglePushNotifications) {
    DOM.togglePushNotifications.addEventListener('change', (e) => {
      if (e.target.checked) {
        subscribeUserToPush();
      } else {
        unsubscribeUserFromPush();
      }
    });
  }

  // Push Test button event listener
  if (DOM.btnPushTest) {
    DOM.btnPushTest.addEventListener('click', async () => {
      try {
        DOM.btnPushTest.disabled = true;
        showToast('Sending', 'Triggering push notification smoke test...', 'warning');
        
        const res = await api.request('/settings/push-test', {
          method: 'POST'
        });
        
        if (res.success) {
          showToast('Test Sent', 'Smoke test notification triggered successfully!');
        } else {
          showToast('Test Failed', res.error || 'Failed to trigger smoke test.', 'danger');
        }
      } catch (err) {
        console.error('Push test error:', err);
        showToast('Test Error', err.message || 'Failed to communicate with push service.', 'danger');
      } finally {
        DOM.btnPushTest.disabled = false;
      }
    });
  }

  // Initial check on load
  updatePushToggleState();
});
