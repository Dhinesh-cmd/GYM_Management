const API_BASE = '/api';

const api = {
  getToken() {
    return localStorage.getItem('gym_token');
  },
  setToken(token) {
    if (token) {
      localStorage.setItem('gym_token', token);
    } else {
      localStorage.removeItem('gym_token');
    }
  },
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      ...options.headers
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Set Content-Type only if it's not FormData (multer restore handles its own boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    const res = await fetch(`${API_BASE}${endpoint}`, config);

    // Auto-logout on token expiration (401)
    if (res.status === 401 && endpoint !== '/auth/login') {
      this.setToken(null);
      window.dispatchEvent(new Event('unauthorized'));
      throw new Error('Session expired. Please log in again.');
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request failed.');
      }
      return data;
    } else {
      if (!res.ok) {
        throw new Error('Request failed.');
      }
      return res; // For downloads or raw responses
    }
  },

  // Auth Operations
  login(username, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  getMe() {
    return this.request('/auth/me');
  },

  // Customer Operations
  getStats() {
    return this.request('/customers/stats');
  },
  getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/customers?${query}`);
  },
  getCustomer(id) {
    return this.request(`/customers/${id}`);
  },
  createCustomer(data) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateCustomer(id, data) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteCustomer(id) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE'
    });
  },
  renewCustomer(id, data) {
    return this.request(`/customers/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  importCustomers(customers) {
    return this.request('/customers/import', {
      method: 'POST',
      body: JSON.stringify({ customers })
    });
  },

  // Sales Operations
  getSalesReport(filter) {
    return this.request(`/sales/report?filter=${filter}`);
  },

  // Settings & Exports
  updateProfile(data) {
    return this.request('/settings/update-profile', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  getExportData() {
    return this.request('/settings/export-data');
  },
  async downloadBackup() {
    const token = this.getToken();
    const response = await fetch(`${API_BASE}/settings/backup`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (!response.ok) {
      throw new Error('Failed to download backup database.');
    }
    return response.blob();
  },
  async restoreBackup(file) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('backupFile', file);
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/settings/restore`, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to restore database.');
    }
    return data;
  }
};
