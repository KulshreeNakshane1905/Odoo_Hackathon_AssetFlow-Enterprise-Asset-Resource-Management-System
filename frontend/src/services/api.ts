import type { UserRole } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

// Fallback Local Storage databases
const initLocalStorage = () => {
  if (!localStorage.getItem('af-departments')) {
    localStorage.setItem('af-departments', JSON.stringify([
      { id: 'd1', name: 'Engineering', code: 'ENG', parent_id: null, department_head_id: 'u2', status: 'Active' },
      { id: 'd2', name: 'Human Resources', code: 'HR', parent_id: null, department_head_id: 'u4', status: 'Active' },
      { id: 'd3', name: 'Operations', code: 'OPS', parent_id: null, department_head_id: 'u1', status: 'Active' },
      { id: 'd4', name: 'Finance', code: 'FIN', parent_id: null, department_head_id: null, status: 'Active' }
    ]));
  }

  if (!localStorage.getItem('af-users')) {
    localStorage.setItem('af-users', JSON.stringify([
      { id: 'u1', first_name: 'System', last_name: 'Admin', email: 'admin@assetflow.com', password_hash: 'admin123', role: 'Admin', department_id: 'd3', status: 'Active', created_at: new Date().toISOString() },
      { id: 'u2', first_name: 'Alex', last_name: 'Manager', email: 'manager@assetflow.com', password_hash: 'manager123', role: 'Asset Manager', department_id: 'd1', status: 'Active', created_at: new Date().toISOString() },
      { id: 'u3', first_name: 'Sarah', last_name: 'Head', email: 'head@assetflow.com', password_hash: 'head123', role: 'Department Head', department_id: 'd1', status: 'Active', created_at: new Date().toISOString() },
      { id: 'u4', first_name: 'John', last_name: 'Clerk', email: 'clerk@assetflow.com', password_hash: 'clerk123', role: 'Employee', department_id: 'd2', status: 'Active', created_at: new Date().toISOString() }
    ]));
  }

  if (!localStorage.getItem('af-vendors')) {
    localStorage.setItem('af-vendors', JSON.stringify([
      { id: 'v1', name: 'TechCorp Solutions', contact_name: 'John Doe', contact_email: 'john@techcorp.com', phone: '+1-555-0199', status: 'Active', rating: 4.8, contract_expiry: '2027-12-31' },
      { id: 'v2', name: 'OfficeDepot Ltd', contact_name: 'Jane Smith', contact_email: 'jane@officedepot.com', phone: '+1-555-0188', status: 'Active', rating: 4.2, contract_expiry: '2026-09-30' },
      { id: 'v3', name: 'HeavyMachinery Inc', contact_name: 'Robert Johnson', contact_email: 'robert@heavymachinery.com', phone: '+1-555-0177', status: 'Under Review', rating: 3.9, contract_expiry: '2026-05-15' },
      { id: 'v4', name: 'Global Logistics', contact_name: 'Sarah Lee', contact_email: 'sarah@globallogistics.com', phone: '+1-555-0166', status: 'Active', rating: 4.5, contract_expiry: '2028-01-01' }
    ]));
  }

  if (!localStorage.getItem('af-assets')) {
    localStorage.setItem('af-assets', JSON.stringify([
      {
        id: 'a1',
        name: 'MacBook Pro 16"',
        asset_tag: 'AF-0001',
        serial_number: 'SN-MBP-9812',
        model_number: 'M3-PRO-16',
        category: 'IT Hardware',
        status: 'Available',
        condition: 'Good',
        is_shared: false,
        photo_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60',
        documents: ['MacBook_Receipt.pdf', 'User_Manual.pdf'],
        location: 'HQ Room 302',
        purchase_value: 2499.00,
        purchase_date: '2025-01-15',
        lifespan_years: 5,
        depreciation_method: 'Straight-Line',
        current_value: 2249.10,
        vendor_id: 'v1',
        telemetry_hours: 450,
        telemetry_temp: 42.5,
        telemetry_vibration: 1.1,
        risk_score: 5.2,
        last_audit_date: '2026-06-01',
        created_at: new Date('2025-01-15').toISOString()
      },
      {
        id: 'a2',
        name: 'Forklift Model T',
        asset_tag: 'AF-0002',
        serial_number: 'SN-FL-4402',
        model_number: 'FL-TX-4400',
        category: 'Heavy Equipment',
        status: 'Available',
        condition: 'Good',
        is_shared: true,
        photo_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=60',
        documents: ['Forklift_Manual.pdf', 'Safety_Inspect_2025.pdf'],
        location: 'Warehouse B',
        purchase_value: 18500.00,
        purchase_date: '2023-06-10',
        lifespan_years: 8,
        depreciation_method: 'Double-Declining',
        current_value: 11562.50,
        vendor_id: 'v3',
        telemetry_hours: 3200,
        telemetry_temp: 68.2,
        telemetry_vibration: 2.3,
        risk_score: 18.5,
        last_audit_date: '2026-05-20',
        created_at: new Date('2023-06-10').toISOString()
      },
      {
        id: 'a3',
        name: 'Conference Room Projector',
        asset_tag: 'AF-0003',
        serial_number: 'SN-PJ-3310',
        model_number: 'PJ-4K-ULTRA',
        category: 'AV Equipment',
        status: 'Under Maintenance',
        condition: 'Fair',
        is_shared: true,
        photo_url: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=500&auto=format&fit=crop&q=60',
        documents: ['Projector_Spec.pdf'],
        location: 'HQ Room 101',
        purchase_value: 1200.00,
        purchase_date: '2024-03-01',
        lifespan_years: 4,
        depreciation_method: 'Straight-Line',
        current_value: 500.00,
        vendor_id: 'v2',
        telemetry_hours: 1200,
        telemetry_temp: 85.0,
        telemetry_vibration: 3.8,
        risk_score: 55.0,
        last_audit_date: '2026-04-10',
        created_at: new Date('2024-03-01').toISOString()
      },
      {
        id: 'a4',
        name: 'Enterprise Server Rack',
        asset_tag: 'AF-0004',
        serial_number: 'SN-SRV-8820',
        model_number: 'SRV-DL380-G10',
        category: 'IT Hardware',
        status: 'Available',
        condition: 'Good',
        is_shared: false,
        photo_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=60',
        documents: ['Server_Rack_Schema.pdf'],
        location: 'Data Center A',
        purchase_value: 12500.00,
        purchase_date: '2022-11-20',
        lifespan_years: 6,
        depreciation_method: 'Straight-Line',
        current_value: 5208.33,
        vendor_id: 'v1',
        telemetry_hours: 24000,
        telemetry_temp: 38.0,
        telemetry_vibration: 0.9,
        risk_score: 8.0,
        last_audit_date: '2026-06-15',
        created_at: new Date('2022-11-20').toISOString()
      },
      {
        id: 'a5',
        name: 'Delivery Van',
        asset_tag: 'AF-0005',
        serial_number: 'SN-VAN-2299',
        model_number: 'FORD-TRANSIT-26',
        category: 'Vehicles',
        status: 'Available',
        condition: 'Good',
        is_shared: true,
        photo_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&auto=format&fit=crop&q=60',
        documents: ['Van_Registration.pdf', 'Insurance_Policy.pdf'],
        location: 'Fleet Yard',
        purchase_value: 35000.00,
        purchase_date: '2021-08-05',
        lifespan_years: 7,
        depreciation_method: 'Double-Declining',
        current_value: 12000.00,
        vendor_id: 'v4',
        telemetry_hours: 85000,
        telemetry_temp: 92.4,
        telemetry_vibration: 4.8,
        risk_score: 32.0,
        last_audit_date: '2026-03-12',
        created_at: new Date('2021-08-05').toISOString()
      },
      {
        id: 'a6',
        name: 'Warehouse HVAC Unit',
        asset_tag: 'AF-0006',
        serial_number: 'SN-HVAC-1044',
        model_number: 'CARRIER-W-44',
        category: 'Facilities',
        status: 'Available',
        condition: 'Poor',
        is_shared: false,
        photo_url: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=500&auto=format&fit=crop&q=60',
        documents: ['HVAC_Manual.pdf'],
        location: 'Warehouse A Roof',
        purchase_value: 9800.00,
        purchase_date: '2020-05-15',
        lifespan_years: 10,
        depreciation_method: 'Straight-Line',
        current_value: 3920.00,
        vendor_id: 'v4',
        telemetry_hours: 15400,
        telemetry_temp: 108.5,
        telemetry_vibration: 6.9,
        risk_score: 88.5,
        last_audit_date: '2026-01-20',
        created_at: new Date('2020-05-15').toISOString()
      }
    ]));
  }

  if (!localStorage.getItem('af-allocations')) {
    localStorage.setItem('af-allocations', JSON.stringify([
      { id: 'al1', asset_id: 'a1', allocated_to_type: 'Employee', employee_id: 'u4', department_id: null, allocated_at: '2026-07-01T10:00:00Z', expected_return_date: '2026-07-10', returned_at: null, check_in_notes: null, returned_condition: null, status: 'Active' }
    ]));
    // Set asset a1 to Allocated initially
    const assets = JSON.parse(localStorage.getItem('af-assets') || '[]');
    const a1 = assets.find((a: any) => a.id === 'a1');
    if (a1) {
      a1.status = 'Allocated';
      localStorage.setItem('af-assets', JSON.stringify(assets));
    }
  }

  if (!localStorage.getItem('af-transfers')) {
    localStorage.setItem('af-transfers', JSON.stringify([
      {
        id: 't1',
        asset_id: 'a1',
        requester_id: 'u2', // Alex Manager
        allocated_to_type: 'Employee',
        current_holder_id: 'u4', // John Clerk
        current_holder_type: 'Employee',
        status: 'Pending',
        comments: 'Need MacBook Pro 16" for client software demo and environment setup validation.',
        expected_return_date: '2026-07-25',
        created_at: new Date(Date.now() - 3600000 * 6).toISOString()
      }
    ]));
  }

  if (!localStorage.getItem('af-bookings')) {
    localStorage.setItem('af-bookings', JSON.stringify([
      { id: 'b1', asset_id: 'a5', employee_id: 'u4', start_time: '2026-07-15T09:00:00Z', end_time: '2026-07-15T12:00:00Z', purpose: 'Client delivery run', status: 'Confirmed' }
    ]));
  }

  if (!localStorage.getItem('af-maintenance')) {
    localStorage.setItem('af-maintenance', JSON.stringify([
      { id: 'm1', asset_id: 'a3', description: 'Replace projector lamp bulb', cost: 150.00, status: 'In Progress', approval_status: 'Approved', requested_by: 'u4', approved_by: 'u2', scheduled_date: '2026-07-10', completion_date: null, performed_by: 'TechCorp Solutions', created_at: new Date().toISOString() },
      { id: 'm2', asset_id: 'a2', description: 'Hydraulic system fluid flush and filter replacement', cost: 450.00, status: 'Completed', approval_status: 'Approved', requested_by: 'u4', approved_by: 'u2', scheduled_date: '2026-05-18', completion_date: '2026-05-20', performed_by: 'HeavyMachinery Inc', created_at: new Date().toISOString() },
      { id: 'm3', asset_id: 'a6', description: 'Compressor bearing lubrication', cost: 300.00, status: 'Scheduled', approval_status: 'Approved', requested_by: 'u2', approved_by: 'u2', scheduled_date: '2026-07-20', completion_date: null, performed_by: 'Global Logistics', created_at: new Date().toISOString() }
    ]));
  }

  if (!localStorage.getItem('af-warranties')) {
    localStorage.setItem('af-warranties', JSON.stringify([
      { id: 'w1', asset_id: 'a1', vendor_id: 'v1', policy_number: 'WAR-MBP-8923', start_date: '2025-01-15', end_date: '2028-01-15', coverage_details: 'AppleCare+ 3 Year parts and accidental damage.' },
      { id: 'w2', asset_id: 'a4', vendor_id: 'v1', policy_number: 'WAR-SRV-4411', start_date: '2022-11-20', end_date: '2025-11-20', coverage_details: 'Standard hardware warranty, 24/7 onsite tech response.' }
    ]));
  }

  if (!localStorage.getItem('af-audit-cycles')) {
    localStorage.setItem('af-audit-cycles', JSON.stringify([
      { id: 'au1', name: 'Q3 Physical Inventory Check', start_date: '2026-07-01', end_date: null, status: 'In Progress', assigned_auditor_id: 'u2' }
    ]));
  }

  if (!localStorage.getItem('af-audit-items')) {
    localStorage.setItem('af-audit-items', JSON.stringify([
      { id: 'aui1', audit_cycle_id: 'au1', asset_id: 'a1', status_checked: 'Available', location_checked: 'HQ Room 302', discrepancy_found: false, notes: 'Asset in location and working well', checked_at: '2026-07-02T11:00:00Z' }
    ]));
  }

  if (!localStorage.getItem('af-logs')) {
    localStorage.setItem('af-logs', JSON.stringify([
      { id: 'l1', user_email: 'admin@assetflow.com', user_role: 'Admin', action: 'CREATE_ASSET', asset_id: 'a1', details: 'Added new MacBook Pro 16" to IT Hardware department.', timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
      { id: 'l2', user_email: 'manager@assetflow.com', user_role: 'Asset Manager', action: 'SCHEDULE_MAINTENANCE', asset_id: 'a3', details: 'Scheduled bulb replacement for conference room projector.', timestamp: new Date(Date.now() - 3600000 * 12).toISOString() },
      { id: 'l3', user_email: 'clerk@assetflow.com', user_role: 'Inventory Clerk', action: 'SCAN_ASSET_QR', asset_id: 'a2', details: 'Scanned Forklift Model T QR code for physical stock check.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
    ]));
  }
  if (!localStorage.getItem('af-categories')) {
    localStorage.setItem('af-categories', JSON.stringify([
      { id: 'cat1', name: 'IT Hardware', code: 'ITHW', description: 'Laptops, server units, and tech components', warranty_period: 36 },
      { id: 'cat2', name: 'Heavy Equipment', code: 'HEQUIP', description: 'Forklifts, HVAC units, and warehouse installations', warranty_period: 24 },
      { id: 'cat3', name: 'AV Equipment', code: 'AV', description: 'Monitors, projectors, and audio devices', warranty_period: 12 },
      { id: 'cat4', name: 'Vehicles', code: 'VEH', description: 'Company cars, trucks, and vans', warranty_period: 60 }
    ]));
  }
};

initLocalStorage();

// Helper to write to local storage helper dbs
const getLS = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setLS = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

// Safe fetch wrapper that handles fallback transparently
async function safeFetch(url: string, options?: RequestInit, fallbackAction?: () => any) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || 'API server returned error');
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`API Server offline. Executing client-side fallback for: ${url}`);
    if (fallbackAction) return fallbackAction();
    throw err;
  }
}

export const api = {
  // AUTH
  login: (email: string, password_hash: string) => {
    return safeFetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password: password_hash })
    }, () => {
      const users = getLS('af-users');
      const matched = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password_hash === password_hash);
      if (!matched) throw new Error('Invalid email or password.');
      return matched;
    });
  },

  signup: (userData: any) => {
    return safeFetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(userData)
    }, () => {
      const users = getLS('af-users');
      const email = userData.email;
      const existing = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) throw new Error('An account with this email already exists.');

      const newUser = {
        id: `u_${Date.now()}`,
        role: 'Employee',
        created_at: new Date().toISOString(),
        ...userData
      };
      users.push(newUser);
      setLS('af-users', users);

      api.createActivityLog({
        user_email: email,
        user_role: 'Employee',
        action: 'USER_SIGNUP',
        details: `New account registered for ${userData.first_name} ${userData.last_name}`
      }, 'Employee', email);

      return newUser;
    });
  },

  forgotPassword: (email: string) => {
    return safeFetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email })
    }, () => {
      return { message: `Password reset instructions sent to ${email}` };
    });
  },

  // USERS / EMPLOYEE DIRECTORY
  getUsers: () => safeFetch(`${API_BASE}/users`, undefined, () => {
    const users = getLS('af-users');
    const depts = getLS('af-departments');
    return users.map((u: any) => ({
      ...u,
      department: depts.find((d: any) => d.id === u.department_id) || null
    }));
  }),

  promoteUser: (userId: string, role: UserRole, adminEmail: string) => {
    return safeFetch(`${API_BASE}/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, adminEmail })
    }, () => {
      const users = getLS('af-users');
      const idx = users.findIndex((u: any) => u.id === userId);
      if (idx !== -1) {
        users[idx].role = role;
        setLS('af-users', users);

        api.createActivityLog({
          user_email: adminEmail,
          user_role: 'Admin',
          action: 'PROMOTE_USER',
          details: `Promoted user ${users[idx].email} to ${role}.`
        }, 'Admin', adminEmail);

        return users[idx];
      }
      throw new Error('User not found.');
    });
  },

  // DEPARTMENTS
  getDepartments: () => safeFetch(`${API_BASE}/departments`, undefined, () => getLS('af-departments')),

  createDepartment: (dept: any) => {
    return safeFetch(`${API_BASE}/departments`, {
      method: 'POST',
      body: JSON.stringify(dept)
    }, () => {
      const depts = getLS('af-departments');
      const newDept = {
        id: `d_${Date.now()}`,
        parent_id: null,
        department_head_id: null,
        status: 'Active',
        ...dept
      };
      depts.push(newDept);
      setLS('af-departments', depts);
      return newDept;
    });
  },

  updateDepartment: (id: string, updates: any) => {
    return safeFetch(`${API_BASE}/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, () => {
      const depts = getLS('af-departments');
      const idx = depts.findIndex((d: any) => d.id === id);
      if (idx !== -1) {
        depts[idx] = { ...depts[idx], ...updates };
        setLS('af-departments', depts);
        return depts[idx];
      }
      throw new Error('Department not found');
    });
  },

  // CATEGORIES
  getCategories: () => safeFetch(`${API_BASE}/categories`, undefined, () => getLS('af-categories')),

  createCategory: (category: any) => {
    return safeFetch(`${API_BASE}/categories`, {
      method: 'POST',
      body: JSON.stringify(category)
    }, () => {
      const cats = getLS('af-categories');
      const newCat = {
        id: `cat_${Date.now()}`,
        ...category
      };
      cats.push(newCat);
      setLS('af-categories', cats);
      return newCat;
    });
  },

  updateCategory: (id: string, updates: any) => {
    return safeFetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, () => {
      const cats = getLS('af-categories');
      const idx = cats.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        cats[idx] = { ...cats[idx], ...updates };
        setLS('af-categories', cats);
        return cats[idx];
      }
      throw new Error('Category not found');
    });
  },

  // USERS
  updateUser: (id: string, updates: any) => {
    return safeFetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, () => {
      const users = getLS('af-users');
      const idx = users.findIndex((u: any) => u.id === id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        setLS('af-users', users);
        return users[idx];
      }
      throw new Error('User not found');
    });
  },

  // ASSETS
  getAssets: () => safeFetch(`${API_BASE}/assets`, undefined, () => getLS('af-assets')),
  
  getAssetById: (id: string) => safeFetch(`${API_BASE}/assets/${id}`, undefined, () => {
    return getLS('af-assets').find((a: any) => a.id === id) || null;
  }),
  
  // Helper to generate sequential asset tags
  generateAssetTag: () => {
    const assets = getLS('af-assets');
    let maxNum = 0;
    assets.forEach((a: any) => {
      if (a.asset_tag && a.asset_tag.startsWith('AF-')) {
        const num = parseInt(a.asset_tag.replace('AF-', ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `AF-${String(nextNum).padStart(4, '0')}`;
  },

  createAsset: (asset: any, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/assets`, {
      method: 'POST',
      body: JSON.stringify({ ...asset, userRole: role, userEmail: email })
    }, () => {
      const assets = getLS('af-assets');
      const nextTag = api.generateAssetTag();
      const newAsset = {
        id: `a_${Date.now()}`,
        asset_tag: nextTag,
        telemetry_hours: 0,
        telemetry_temp: 35.0,
        telemetry_vibration: 1.0,
        risk_score: 0.0,
        condition: asset.condition || 'Good',
        is_shared: asset.is_shared === true || asset.is_shared === 'true',
        photo_url: asset.photo_url || '',
        documents: asset.documents || [],
        created_at: new Date().toISOString(),
        ...asset
      };
      assets.push(newAsset);
      setLS('af-assets', assets);

      api.createActivityLog({
        user_email: email,
        user_role: role,
        action: 'CREATE_ASSET',
        asset_id: newAsset.id,
        details: `Created asset ${newAsset.name} (${newAsset.serial_number}) with tag ${nextTag}`
      }, role, email);

      return newAsset;
    });
  },
  
  updateAsset: (id: string, updates: any, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...updates, userRole: role, userEmail: email })
    }, () => {
      const assets = getLS('af-assets');
      const idx = assets.findIndex((a: any) => a.id === id);
      if (idx !== -1) {
        assets[idx] = { ...assets[idx], ...updates };
        setLS('af-assets', assets);

        api.createActivityLog({
          user_email: email,
          user_role: role,
          action: 'UPDATE_ASSET',
          asset_id: id,
          details: `Updated asset ${assets[idx].name} attributes.`
        }, role, email);

        return assets[idx];
      }
      return null;
    });
  },
  
  deleteAsset: (id: string) => {
    return safeFetch(`${API_BASE}/assets/${id}`, { method: 'DELETE' }, () => {
      const assets = getLS('af-assets');
      const filtered = assets.filter((a: any) => a.id !== id);
      setLS('af-assets', filtered);
      return true;
    });
  },

  // ALLOCATIONS
  getAllocations: () => safeFetch(`${API_BASE}/allocations`, undefined, () => getLS('af-allocations')),

  createAllocation: (alloc: any, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/allocations`, {
      method: 'POST',
      body: JSON.stringify({ ...alloc, userRole: role, userEmail: email })
    }, () => {
      const assets = getLS('af-assets');
      const asset = assets.find((a: any) => a.id === alloc.asset_id);
      if (!asset) throw new Error('Asset not found');
      if (asset.status === 'Allocated') {
        throw new Error('Double Allocation Blocked: This asset is currently allocated.');
      }
      if (asset.status === 'Reserved' || asset.status === 'Under Maintenance' || asset.status === 'Lost' || asset.status === 'Retired' || asset.status === 'Disposed') {
        throw new Error(`Allocation Blocked: Asset state is ${asset.status}.`);
      }

      const allocations = getLS('af-allocations');
      const newAlloc = {
        id: `al_${Date.now()}`,
        allocated_at: new Date().toISOString(),
        status: 'Active',
        ...alloc
      };
      allocations.push(newAlloc);
      setLS('af-allocations', allocations);

      // update asset status in local storage
      asset.status = 'Allocated';
      setLS('af-assets', assets);

      api.createActivityLog({
        user_email: email,
        user_role: role,
        action: 'ALLOCATE_ASSET',
        asset_id: alloc.asset_id,
        details: `Allocated asset ${asset.name} to ${alloc.allocated_to_type === 'Employee' ? 'employee' : 'department'}.`
      }, role, email);

      return newAlloc;
    });
  },

  returnAllocation: (id: string, returnedCondition: string, checkInNotes: string, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/allocations/${id}/return`, {
      method: 'POST',
      body: JSON.stringify({ returnedCondition, checkInNotes, userEmail: email, userRole: role })
    }, () => {
      const allocations = getLS('af-allocations');
      const assets = getLS('af-assets');
      const alloc = allocations.find((al: any) => al.id === id);
      if (!alloc) throw new Error('Allocation record not found');

      alloc.returned_at = new Date().toISOString();
      alloc.status = 'Returned';
      alloc.returned_condition = returnedCondition || 'Good';
      alloc.check_in_notes = checkInNotes || 'None';
      setLS('af-allocations', allocations);

      const asset = assets.find((a: any) => a.id === alloc.asset_id);
      if (asset) {
        asset.status = 'Available';
        asset.condition = returnedCondition || asset.condition || 'Good';
        setLS('af-assets', assets);
      }

      api.createActivityLog({
        user_email: email,
        user_role: role,
        action: 'RETURN_ASSET',
        asset_id: alloc.asset_id,
        details: `Returned asset ${asset ? asset.name : alloc.asset_id} to inventory in ${returnedCondition || 'Good'} condition. Notes: ${checkInNotes || 'None'}`
      }, role, email);

      return alloc;
    });
  },

  // TRANSFERS
  getTransfers: () => safeFetch(`${API_BASE}/transfers`, undefined, () => getLS('af-transfers')),

  createTransferRequest: (transfer: any, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/transfers`, {
      method: 'POST',
      body: JSON.stringify({ ...transfer, userRole: role, userEmail: email })
    }, () => {
      const transfers = getLS('af-transfers');
      const assets = getLS('af-assets');
      const asset = assets.find((a: any) => a.id === transfer.asset_id);
      if (!asset) throw new Error('Asset not found');

      // Find current active holder of the asset
      const allocations = getLS('af-allocations');
      const activeAlloc = allocations.find((al: any) => al.asset_id === transfer.asset_id && al.status === 'Active');
      
      const newTransfer = {
        id: `t_${Date.now()}`,
        status: 'Pending',
        current_holder_id: activeAlloc ? (activeAlloc.employee_id || activeAlloc.department_id) : null,
        current_holder_type: activeAlloc ? activeAlloc.allocated_to_type : 'Employee',
        created_at: new Date().toISOString(),
        ...transfer
      };

      transfers.push(newTransfer);
      setLS('af-transfers', transfers);

      api.createActivityLog({
        user_email: email,
        user_role: role,
        action: 'TRANSFER_REQUEST',
        asset_id: transfer.asset_id,
        details: `Requested transfer for asset ${asset.name} from current holder.`
      }, role, email);

      return newTransfer;
    });
  },

  approveTransferRequest: (id: string, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/transfers/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ userRole: role, userEmail: email })
    }, () => {
      const transfers = getLS('af-transfers');
      const tf = transfers.find((t: any) => t.id === id);
      if (!tf) throw new Error('Transfer request not found');

      tf.status = 'Approved';
      tf.processed_by = email;
      tf.processed_at = new Date().toISOString();
      setLS('af-transfers', transfers);

      const allocations = getLS('af-allocations');
      const assets = getLS('af-assets');

      // 1. Terminate the active allocation of the current holder
      const activeAlloc = allocations.find((al: any) => al.asset_id === tf.asset_id && al.status === 'Active');
      if (activeAlloc) {
        activeAlloc.status = 'Returned';
        activeAlloc.returned_at = new Date().toISOString();
        activeAlloc.check_in_notes = `Asset transferred via approved Request #${tf.id}`;
        activeAlloc.returned_condition = 'Good'; // Default to good or current asset condition
      }

      // 2. Create the new allocation for the requester
      const newAlloc = {
        id: `al_${Date.now()}`,
        asset_id: tf.asset_id,
        allocated_to_type: tf.allocated_to_type,
        employee_id: tf.allocated_to_type === 'Employee' ? tf.requester_id : null,
        department_id: tf.allocated_to_type === 'Department' ? tf.requester_id : null,
        allocated_at: new Date().toISOString(),
        expected_return_date: tf.expected_return_date || null,
        returned_at: null,
        check_in_notes: null,
        returned_condition: null,
        status: 'Active'
      };
      allocations.push(newAlloc);
      setLS('af-allocations', allocations);

      // 3. Update the asset status (just to ensure it remains Allocated)
      const asset = assets.find((a: any) => a.id === tf.asset_id);
      if (asset) {
        asset.status = 'Allocated';
        setLS('af-assets', assets);
      }

      api.createActivityLog({
        user_email: email,
        user_role: role,
        action: 'TRANSFER_APPROVE',
        asset_id: tf.asset_id,
        details: `Approved transfer request #${tf.id} for asset ${asset ? asset.name : tf.asset_id}.`
      }, role, email);

      return tf;
    });
  },

  rejectTransferRequest: (id: string, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/transfers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ userRole: role, userEmail: email })
    }, () => {
      const transfers = getLS('af-transfers');
      const tf = transfers.find((t: any) => t.id === id);
      if (!tf) throw new Error('Transfer request not found');

      tf.status = 'Rejected';
      tf.processed_by = email;
      tf.processed_at = new Date().toISOString();
      setLS('af-transfers', transfers);

      api.createActivityLog({
        user_email: email,
        user_role: role,
        action: 'TRANSFER_REJECT',
        details: `Rejected transfer request #${tf.id} for asset ${tf.asset_id}.`
      }, role, email);

      return tf;
    });
  },

  // BOOKINGS & OVERLAP CHECK
  getBookings: () => safeFetch(`${API_BASE}/bookings`, undefined, () => getLS('af-bookings')),

  createBooking: (booking: any, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/bookings`, {
      method: 'POST',
      body: JSON.stringify({ ...booking, userEmail: email, userRole: role })
    }, () => {
      const bookings = getLS('af-bookings');
      const start = new Date(booking.start_time).getTime();
      const end = new Date(booking.end_time).getTime();

      if (start >= end) {
        throw new Error('Start time must be before end time.');
      }

      // Check collision
      const activeBookings = bookings.filter((b: any) => b.asset_id === booking.asset_id && b.status === 'Confirmed');
      const hasOverlap = activeBookings.some((b: any) => {
        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();
        return (start < bEnd && end > bStart);
      });

      if (hasOverlap) {
        throw new Error('Overlap Collision Detected: This resource is already booked during this time slot.');
      }

      // Check asset status
      const assets = getLS('af-assets');
      const asset = assets.find((a: any) => a.id === booking.asset_id);
      if (asset && (asset.status === 'Retired' || asset.status === 'Disposed')) {
        throw new Error(`Booking Blocked: Asset state is ${asset.status}.`);
      }

      const newBooking = {
        id: `b_${Date.now()}`,
        status: 'Confirmed',
        created_at: new Date().toISOString(),
        ...booking
      };
      bookings.push(newBooking);
      setLS('af-bookings', bookings);

      api.createActivityLog({
        user_email: email,
        user_role: role,
        action: 'BOOK_ASSET',
        asset_id: booking.asset_id,
        details: `Booked resource ${asset ? asset.name : booking.asset_id} from ${booking.start_time} to ${booking.end_time}.`
      }, role, email);

      return newBooking;
    });
  },

  cancelBooking: (id: string, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ userEmail: email, userRole: role })
    }, () => {
      const bookings = getLS('af-bookings');
      const b = bookings.find((bk: any) => bk.id === id);
      if (b) {
        b.status = 'Cancelled';
        setLS('af-bookings', bookings);

        api.createActivityLog({
          user_email: email,
          user_role: role,
          action: 'CANCEL_BOOKING',
          asset_id: b.asset_id,
          details: `Cancelled booking reservation for asset ${b.asset_id}.`
        }, role, email);

        return b;
      }
      throw new Error('Booking not found.');
    });
  },

  // VENDORS
  getVendors: () => safeFetch(`${API_BASE}/vendors`, undefined, () => getLS('af-vendors')),
  
  createVendor: (vendor: any) => {
    return safeFetch(`${API_BASE}/vendors`, {
      method: 'POST',
      body: JSON.stringify(vendor)
    }, () => {
      const vendors = getLS('af-vendors');
      const newVendor = {
        id: `v_${Date.now()}`,
        created_at: new Date().toISOString(),
        ...vendor
      };
      vendors.push(newVendor);
      setLS('af-vendors', vendors);
      return newVendor;
    });
  },

  // MAINTENANCE & WORKFLOW APPROVALS
  getMaintenanceLogs: () => safeFetch(`${API_BASE}/maintenance`, undefined, () => getLS('af-maintenance')),
  
  createMaintenanceLog: (log: any, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/maintenance`, {
      method: 'POST',
      body: JSON.stringify({ ...log, userRole: role, userEmail: email })
    }, () => {
      const logs = getLS('af-maintenance');
      const assets = getLS('af-assets');
      const asset = assets.find((a: any) => a.id === log.asset_id);
      
      const newLog = {
        id: `m_${Date.now()}`,
        created_at: new Date().toISOString(),
        approval_status: log.approval_status || 'Approved',
        status: 'Scheduled',
        ...log
      };
      logs.push(newLog);
      setLS('af-maintenance', logs);

      if (newLog.approval_status === 'Approved' && asset) {
        asset.status = 'Under Maintenance';
        setLS('af-assets', assets);
      }

      api.createActivityLog({
        user_email: email,
        user_role: role,
        action: newLog.approval_status === 'Approved' ? 'SCHEDULE_MAINTENANCE' : 'REQUEST_MAINTENANCE',
        asset_id: log.asset_id,
        details: `${newLog.approval_status === 'Approved' ? 'Scheduled' : 'Requested'} maintenance for ${asset ? asset.name : 'Asset'}: ${log.description}`
      }, role, email);

      return newLog;
    });
  },
  
  updateMaintenanceLog: (id: string, updates: any) => {
    return safeFetch(`${API_BASE}/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, () => {
      const logs = getLS('af-maintenance');
      const idx = logs.findIndex((l: any) => l.id === id);
      if (idx !== -1) {
        logs[idx] = { ...logs[idx], ...updates };
        setLS('af-maintenance', logs);

        if (updates.status === 'Completed') {
          const assets = getLS('af-assets');
          const asset = assets.find((a: any) => a.id === logs[idx].asset_id);
          if (asset) {
            asset.status = 'Available';
            setLS('af-assets', assets);
          }
        }

        return logs[idx];
      }
      return null;
    });
  },

  approveMaintenanceRequest: (id: string, approvedBy: string, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/maintenance/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approved_by: approvedBy, userEmail: email, userRole: role })
    }, () => {
      const logs = getLS('af-maintenance');
      const idx = logs.findIndex((l: any) => l.id === id);
      if (idx !== -1) {
        logs[idx].approval_status = 'Approved';
        logs[idx].status = 'Scheduled';
        logs[idx].approved_by = approvedBy;
        setLS('af-maintenance', logs);

        const assets = getLS('af-assets');
        const asset = assets.find((a: any) => a.id === logs[idx].asset_id);
        if (asset) {
          asset.status = 'Under Maintenance';
          setLS('af-assets', assets);
        }

        api.createActivityLog({
          user_email: email,
          user_role: role,
          action: 'APPROVE_MAINTENANCE',
          asset_id: logs[idx].asset_id,
          details: `Approved maintenance request ${id} for execution.`
        }, role, email);

        return logs[idx];
      }
      throw new Error('Maintenance request not found.');
    });
  },

  rejectMaintenanceRequest: (id: string, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/maintenance/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ userEmail: email, userRole: role })
    }, () => {
      const logs = getLS('af-maintenance');
      const idx = logs.findIndex((l: any) => l.id === id);
      if (idx !== -1) {
        logs[idx].approval_status = 'Rejected';
        logs[idx].status = 'Cancelled';
        setLS('af-maintenance', logs);

        api.createActivityLog({
          user_email: email,
          user_role: role,
          action: 'REJECT_MAINTENANCE',
          asset_id: logs[idx].asset_id,
          details: `Rejected maintenance request ${id}.`
        }, role, email);

        return logs[idx];
      }
      throw new Error('Maintenance request not found.');
    });
  },

  // AUDITS
  getAuditCycles: () => safeFetch(`${API_BASE}/audits/cycles`, undefined, () => getLS('af-audit-cycles')),

  createAuditCycle: (cycle: any, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/audits/cycles`, {
      method: 'POST',
      body: JSON.stringify({ ...cycle, userEmail: email, userRole: role })
    }, () => {
      const cycles = getLS('af-audit-cycles');
      const newCycle = {
        id: `au_${Date.now()}`,
        status: 'Planned',
        created_at: new Date().toISOString(),
        ...cycle
      };
      cycles.push(newCycle);
      setLS('af-audit-cycles', cycles);

      api.createActivityLog({
        user_email: email,
        user_role: role,
        action: 'CREATE_AUDIT_CYCLE',
        details: `Created new audit cycle: ${cycle.name}`
      }, role, email);

      return newCycle;
    });
  },

  updateAuditCycle: (id: string, updates: any) => {
    return safeFetch(`${API_BASE}/audits/cycles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }, () => {
      const cycles = getLS('af-audit-cycles');
      const idx = cycles.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        cycles[idx] = { ...cycles[idx], ...updates };
        setLS('af-audit-cycles', cycles);
        return cycles[idx];
      }
      return null;
    });
  },

  getAuditItems: (cycleId?: string) => {
    const url = cycleId ? `${API_BASE}/audits/items?cycle_id=${cycleId}` : `${API_BASE}/audits/items`;
    return safeFetch(url, undefined, () => {
      const items = getLS('af-audit-items');
      if (cycleId) {
        return items.filter((item: any) => item.audit_cycle_id === cycleId);
      }
      return items;
    });
  },

  createAuditItem: (item: any, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/audits/items`, {
      method: 'POST',
      body: JSON.stringify({ ...item, userEmail: email, userRole: role })
    }, () => {
      const items = getLS('af-audit-items');
      const assets = getLS('af-assets');
      const asset = assets.find((a: any) => a.id === item.asset_id);
      
      let discrepancy = false;
      if (asset) {
        if (asset.location.toLowerCase() !== item.location_checked.toLowerCase() || 
            asset.status.toLowerCase() !== item.status_checked.toLowerCase()) {
          discrepancy = true;
        }
      }

      const newItem = {
        id: `aui_${Date.now()}`,
        discrepancy_found: discrepancy,
        checked_at: new Date().toISOString(),
        ...item
      };
      items.push(newItem);
      setLS('af-audit-items', items);

      if (asset) {
        asset.last_audit_date = new Date().toISOString().split('T')[0];
        setLS('af-assets', assets);
      }

      api.createActivityLog({
        user_email: email,
        user_role: role,
        action: 'RECORD_AUDIT_ITEM',
        asset_id: item.asset_id,
        details: `Audited asset ${asset ? asset.name : item.asset_id}: status checked as ${item.status_checked}, location as ${item.location_checked}. Discrepancy: ${discrepancy}`
      }, role, email);

      return newItem;
    });
  },

  // WARRANTIES
  getWarranties: () => safeFetch(`${API_BASE}/warranties`, undefined, () => getLS('af-warranties')),
  
  createWarranty: (warranty: any) => {
    return safeFetch(`${API_BASE}/warranties`, {
      method: 'POST',
      body: JSON.stringify(warranty)
    }, () => {
      const warranties = getLS('af-warranties');
      const newWarranty = {
        id: `w_${Date.now()}`,
        created_at: new Date().toISOString(),
        ...warranty
      };
      warranties.push(newWarranty);
      setLS('af-warranties', warranties);
      return newWarranty;
    });
  },

  // ACTIVITY LOGS
  getActivityLogs: () => safeFetch(`${API_BASE}/logs`, undefined, () => {
    return getLS('af-logs').sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }),
  
  createActivityLog: (log: any, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/logs`, {
      method: 'POST',
      body: JSON.stringify({ ...log, userRole: role, userEmail: email })
    }, () => {
      const logs = getLS('af-logs');
      const newLog = {
        id: `l_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...log
      };
      logs.push(newLog);
      setLS('af-logs', logs);
      return newLog;
    });
  },

  // DEPRECIATION CALCULATION
  calculateDepreciation: (cost: number, lifespanYears: number, purchaseDate: string, method: 'Straight-Line' | 'Double-Declining') => {
    return safeFetch(`${API_BASE}/depreciation`, {
      method: 'POST',
      body: JSON.stringify({ cost, lifespanYears, purchaseDate, method })
    }, () => {
      const schedule = [];
      let currentBookValue = cost;
      const startYear = new Date(purchaseDate || Date.now()).getFullYear();

      if (method === 'Straight-Line') {
        const annualDep = cost / lifespanYears;
        for (let i = 1; i <= lifespanYears; i++) {
          const depExpense = annualDep;
          const accDep = annualDep * i;
          currentBookValue -= depExpense;
          schedule.push({
            year: startYear + i - 1,
            depreciationExpense: Number(depExpense.toFixed(2)),
            accumulatedDepreciation: Number(accDep.toFixed(2)),
            bookValue: Number(Math.max(0, currentBookValue).toFixed(2))
          });
        }
      } else {
        const rate = 2 / lifespanYears;
        let accDep = 0;
        for (let i = 1; i <= lifespanYears; i++) {
          let depExpense = currentBookValue * rate;
          if (i === lifespanYears) {
            depExpense = currentBookValue;
          }
          accDep += depExpense;
          currentBookValue -= depExpense;
          schedule.push({
            year: startYear + i - 1,
            depreciationExpense: Number(depExpense.toFixed(2)),
            accumulatedDepreciation: Number(accDep.toFixed(2)),
            bookValue: Number(Math.max(0, currentBookValue).toFixed(2))
          });
        }
      }
      return { cost, lifespanYears, method, schedule };
    });
  },

  // AI CHATBOT
  sendChatMessage: (message: string, role: UserRole, email: string) => {
    return safeFetch(`${API_BASE}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, role, userEmail: email })
    }, async () => {
      // Local NLP Chat Processing
      const query = message.toLowerCase().trim();
      const assets = getLS('af-assets');
      const vendors = getLS('af-vendors');
      const logs = getLS('af-maintenance');

      if (query.includes('predict') || query.includes('risk') || query.includes('fail') || query.includes('anomaly')) {
        const highRisk = assets.filter((a: any) => a.risk_score > 50);
        if (highRisk.length === 0) {
          return { reply: `### AI Predictive Maintenance Summary\n\nI analyzed all system telemetry streams (hours, operating temperatures, vibration indexes). Currently, **all assets are operating within safety tolerances** (Risk Score < 50%).\n\nNo emergency maintenance events are predicted at this time.` };
        }
        let reply = `### ⚠️ AI Predictive Maintenance Alert\n\nI detected **${highRisk.length} asset(s) at high risk of operational failure** based on real-time telemetry analysis:\n\n`;
        highRisk.forEach((a: any) => {
          reply += `- **${a.name}** (${a.serial_number}) in *${a.location}*\n`;
          reply += `  - **Risk Score:** \`${a.risk_score}%\` (CRITICAL)\n`;
          reply += `  - **Temp:** \`${a.telemetry_temp}°C\` | **Vibration:** \`${a.telemetry_vibration} mm/s\`\n`;
          reply += `  - **Suggested Action:** Schedule diagnostic maintenance immediately.\n\n`;
        });
        reply += `Would you like me to schedule emergency inspections for these items?`;
        return { reply, data: highRisk };
      }

      if (query.includes('schedule') || query.includes('repair') || query.includes('maintenance')) {
        const matched = assets.find((a: any) => 
          query.includes(a.name.toLowerCase()) || 
          query.includes(a.serial_number.toLowerCase())
        );

        if (matched) {
          const schedDate = new Date();
          schedDate.setDate(schedDate.getDate() + 2);
          const dateStr = schedDate.toISOString().split('T')[0];

          const newLog = {
            id: `m_${Date.now()}`,
            asset_id: matched.id,
            description: `Scheduled via AI Chatbot: Diagnostic review of telemetry variables (requested by ${email})`,
            cost: 250.00,
            status: 'Scheduled',
            approval_status: 'Approved',
            scheduled_date: dateStr,
            performed_by: 'TechCorp Solutions',
            created_at: new Date().toISOString()
          };

          const oldLogs = getLS('af-maintenance');
          oldLogs.push(newLog);
          setLS('af-maintenance', oldLogs);

          api.createActivityLog({
            user_email: email,
            user_role: role,
            action: 'SCHEDULE_MAINTENANCE_AI',
            asset_id: matched.id,
            details: `Scheduled AI-driven maintenance for ${matched.name}.`
          }, role, email);

          return {
            reply: `### ✅ Maintenance Scheduled\n\nI have successfully scheduled a maintenance ticket for **${matched.name}** (${matched.serial_number}).\n\n- **Date:** ${dateStr}\n- **Assigned Vendor:** TechCorp Solutions\n- **Estimated Cost:** $250.00\n- **Log ID:** \`${newLog.id}\`\n\nI have recorded this in the system and alerted the Maintenance Manager.`,
            actionTaken: 'SCHEDULE_MAINTENANCE',
            data: newLog
          };
        }

        const openLogs = logs.filter((l: any) => l.status === 'Scheduled' || l.status === 'In Progress');
        let reply = `### Active Maintenance Tickets (${openLogs.length})\n\n`;
        if (openLogs.length === 0) {
          reply += "There are no open or scheduled maintenance tickets at the moment.";
        } else {
          openLogs.forEach((l: any) => {
            const asset = assets.find((a: any) => a.id === l.asset_id);
            reply += `- **${asset ? asset.name : 'Unknown Asset'}**: ${l.description}\n`;
            reply += `  - **Status:** \`${l.status}\` | **Scheduled:** \`${l.scheduled_date}\` | **Vendor:** ${l.performed_by || 'Unassigned'}\n`;
          });
        }
        return { reply };
      }

      if (query.includes('asset') || query.includes('list') || query.includes('find') || query.includes('search')) {
        const cats = ['it hardware', 'heavy equipment', 'av equipment', 'vehicles', 'facilities'];
        const matchedCat = cats.find(c => query.includes(c));

        let filtered = assets;
        let heading = 'All Assets';

        if (matchedCat) {
          filtered = assets.filter((a: any) => a.category.toLowerCase() === matchedCat);
          heading = `${matchedCat.toUpperCase()} Assets`;
        } else if (query.includes('active') || query.includes('available')) {
          filtered = assets.filter((a: any) => a.status === 'Available');
          heading = 'Available Assets';
        } else if (query.includes('maintenance')) {
          filtered = assets.filter((a: any) => a.status === 'Under Maintenance');
          heading = 'Assets in Maintenance';
        }

        let reply = `### 📋 ${heading} (${filtered.length})\n\n`;
        reply += `| Asset Name | Serial Number | Category | Status | Location | Value |\n`;
        reply += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        filtered.forEach((a: any) => {
          reply += `| **${a.name}** | \`${a.serial_number}\` | ${a.category} | \`${a.status}\` | ${a.location} | \$${Number(a.purchase_value).toLocaleString()} |\n`;
        });
        return { reply, data: filtered };
      }

      if (query.includes('vendor') || query.includes('supplier')) {
        let reply = `### 🏢 Active Enterprise Partners (${vendors.length})\n\n`;
        reply += `| Vendor Name | Contact Email | Rating | Contract Expiry | Status |\n`;
        reply += `| :--- | :--- | :--- | :--- | :--- |\n`;
        vendors.forEach((v: any) => {
          reply += `| **${v.name}** | ${v.contact_email} | ⭐ \`${v.rating}\` | ${v.contract_expiry} | \`${v.status}\` |\n`;
        });
        return { reply };
      }

      if (query.includes('depreciat') || query.includes('value') || query.includes('worth')) {
        let reply = `### 📈 Asset Depreciation Summary\n\nHere is the financial valuation breakdown of our top inventory assets:\n\n`;
        let totalCost = 0;
        let totalCurrent = 0;
        assets.forEach((a: any) => {
          totalCost += Number(a.purchase_value);
          totalCurrent += Number(a.current_value);
          reply += `- **${a.name}**: Cost \`$${Number(a.purchase_value).toLocaleString()}\` $\\rightarrow$ Current \`$${Number(a.current_value).toLocaleString()}\` (${a.depreciation_method})\n`;
        });
        const pct = ((totalCurrent / totalCost) * 100).toFixed(1);
        reply += `\n**Portfolio Health:** The current valuation is **$${totalCurrent.toLocaleString()}** (**${pct}%** of total acquisition cost **$${totalCost.toLocaleString()}**).`;
        return { reply };
      }

      return {
        reply: `👋 Hello! I am **AssetFlow AI**, your enterprise assistant.\n\nI can help you monitor telemetry streams, inspect depreciation indexes, search logs, and schedule repair cycles directly. Here are some commands you can try:\n\n- 🔍 **Search**: *"Show me all IT hardware"* or *"List active assets"* \n- ⚠️ **Predictive Maintenance**: *"Check predictive maintenance"* or *"Any anomalies?"*\n- 🛠️ **Service**: *"Schedule maintenance for Forklift Model T"* \n- 🏢 **Partners**: *"Show active vendors"* \n- 📈 **Valuation**: *"Summarize asset depreciation"*`
      };
    });
  }
};
