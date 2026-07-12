import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const isSupabaseConfigured = SUPABASE_URL && SUPABASE_KEY;

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// --- Mock Databases ---

export let mockDepartments: any[] = [
  { id: 'd1', name: 'Engineering', code: 'ENG', parent_id: null, department_head_id: 'u2', status: 'Active' },
  { id: 'd2', name: 'Human Resources', code: 'HR', parent_id: null, department_head_id: 'u4', status: 'Active' },
  { id: 'd3', name: 'Operations', code: 'OPS', parent_id: null, department_head_id: 'u1', status: 'Active' },
  { id: 'd4', name: 'Finance', code: 'FIN', parent_id: null, department_head_id: null, status: 'Active' }
];

export let mockUsers: any[] = [
  { id: 'u1', first_name: 'System', last_name: 'Admin', email: 'admin@assetflow.com', password_hash: 'admin123', role: 'Admin', department_id: 'd3', status: 'Active', created_at: new Date().toISOString() },
  { id: 'u2', first_name: 'Alex', last_name: 'Manager', email: 'manager@assetflow.com', password_hash: 'manager123', role: 'Asset Manager', department_id: 'd1', status: 'Active', created_at: new Date().toISOString() },
  { id: 'u3', first_name: 'Sarah', last_name: 'Head', email: 'head@assetflow.com', password_hash: 'head123', role: 'Department Head', department_id: 'd1', status: 'Active', created_at: new Date().toISOString() },
  { id: 'u4', first_name: 'John', last_name: 'Clerk', email: 'clerk@assetflow.com', password_hash: 'clerk123', role: 'Employee', department_id: 'd2', status: 'Active', created_at: new Date().toISOString() }
];

export let mockVendors: any[] = [
  { id: 'v1', name: 'TechCorp Solutions', contact_name: 'John Doe', contact_email: 'john@techcorp.com', phone: '+1-555-0199', status: 'Active', rating: 4.8, contract_expiry: '2027-12-31' },
  { id: 'v2', name: 'OfficeDepot Ltd', contact_name: 'Jane Smith', contact_email: 'jane@officedepot.com', phone: '+1-555-0188', status: 'Active', rating: 4.2, contract_expiry: '2026-09-30' },
  { id: 'v3', name: 'HeavyMachinery Inc', contact_name: 'Robert Johnson', contact_email: 'robert@heavymachinery.com', phone: '+1-555-0177', status: 'Under Review', rating: 3.9, contract_expiry: '2026-05-15' },
  { id: 'v4', name: 'Global Logistics', contact_name: 'Sarah Lee', contact_email: 'sarah@globallogistics.com', phone: '+1-555-0166', status: 'Active', rating: 4.5, contract_expiry: '2028-01-01' }
];

export let mockAssets: any[] = [
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
];

export let mockAllocations: any[] = [
  { id: 'al1', asset_id: 'a1', allocated_to_type: 'Employee', employee_id: 'u4', department_id: null, allocated_at: '2026-07-01T10:00:00Z', expected_return_date: '2026-07-10', returned_at: null, check_in_notes: null, returned_condition: null, status: 'Active' }
];

export let mockTransfers: any[] = [
  {
    id: 't1',
    asset_id: 'a1',
    requester_id: 'u2',
    allocated_to_type: 'Employee',
    current_holder_id: 'u4',
    current_holder_type: 'Employee',
    status: 'Pending',
    comments: 'Need MacBook Pro 16" for client software demo and environment setup validation.',
    expected_return_date: '2026-07-25',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

export let mockBookings: any[] = [
  { id: 'b1', asset_id: 'a5', employee_id: 'u4', start_time: '2026-07-15T09:00:00Z', end_time: '2026-07-15T12:00:00Z', purpose: 'Client delivery run', status: 'Confirmed' }
];

export let mockMaintenanceLogs: any[] = [
  { id: 'm1', asset_id: 'a3', description: 'Replace projector lamp bulb', cost: 150.00, status: 'In Progress', approval_status: 'Approved', requested_by: 'u4', approved_by: 'u2', scheduled_date: '2026-07-10', completion_date: null, performed_by: 'TechCorp Solutions', created_at: new Date().toISOString() },
  { id: 'm2', asset_id: 'a2', description: 'Hydraulic system fluid flush and filter replacement', cost: 450.00, status: 'Completed', approval_status: 'Approved', requested_by: 'u4', approved_by: 'u2', scheduled_date: '2026-05-18', completion_date: '2026-05-20', performed_by: 'HeavyMachinery Inc', created_at: new Date().toISOString() },
  { id: 'm3', asset_id: 'a6', description: 'Compressor bearing lubrication', cost: 300.00, status: 'Scheduled', approval_status: 'Approved', requested_by: 'u2', approved_by: 'u2', scheduled_date: '2026-07-20', completion_date: null, performed_by: 'Global Logistics', created_at: new Date().toISOString() }
];

export let mockWarranties: any[] = [
  { id: 'w1', asset_id: 'a1', vendor_id: 'v1', policy_number: 'WAR-MBP-8923', start_date: '2025-01-15', end_date: '2028-01-15', coverage_details: 'AppleCare+ 3 Year parts and accidental damage.' },
  { id: 'w2', asset_id: 'a4', vendor_id: 'v1', policy_number: 'WAR-SRV-4411', start_date: '2022-11-20', end_date: '2025-11-20', coverage_details: 'Standard hardware warranty, 24/7 onsite tech response.' }
];

export let mockAuditCycles: any[] = [
  { id: 'au1', name: 'Q3 Physical Inventory Check', start_date: '2026-07-01', end_date: null, status: 'In Progress', assigned_auditor_id: 'u2' }
];

export let mockAuditItems: any[] = [
  { id: 'aui1', audit_cycle_id: 'au1', asset_id: 'a1', status_checked: 'Available', location_checked: 'HQ Room 302', discrepancy_found: false, notes: 'Asset in location and working well', checked_at: '2026-07-02T11:00:00Z' }
];

export let mockActivityLogs: any[] = [
  { id: 'l1', user_email: 'admin@assetflow.com', user_role: 'Admin', action: 'CREATE_ASSET', asset_id: 'a1', details: 'Added new MacBook Pro 16" to IT Hardware department.', timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
  { id: 'l2', user_email: 'manager@assetflow.com', user_role: 'Asset Manager', action: 'SCHEDULE_MAINTENANCE', asset_id: 'a3', details: 'Scheduled bulb replacement for conference room projector.', timestamp: new Date(Date.now() - 3600000 * 12).toISOString() },
  { id: 'l3', user_email: 'clerk@assetflow.com', user_role: 'Inventory Clerk', action: 'SCAN_ASSET_QR', asset_id: 'a2', details: 'Scanned Forklift Model T QR code for physical stock check.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() }
];

export let mockCategories: any[] = [
  { id: 'cat1', name: 'IT Hardware', code: 'ITHW', description: 'Laptops, server units, and tech components', warranty_period: 36 },
  { id: 'cat2', name: 'Heavy Equipment', code: 'HEQUIP', description: 'Forklifts, HVAC units, and warehouse installations', warranty_period: 24 },
  { id: 'cat3', name: 'AV Equipment', code: 'AV', description: 'Monitors, projectors, and audio devices', warranty_period: 12 },
  { id: 'cat4', name: 'Vehicles', code: 'VEH', description: 'Company cars, trucks, and vans', warranty_period: 60 }
];

// Helper database API layer supporting mock & supabase fallback
export const db = {
  isMocked: () => !isSupabaseConfigured,

  // --- AUTH & USERS ---
  getUsers: async () => {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*, departments(name)');
      if (!error && data && data.length > 0) return data;
    }
    return mockUsers.map(u => ({
      ...u,
      department: mockDepartments.find(d => d.id === u.department_id)
    }));
  },

  getUserByEmail: async (email: string) => {
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
      if (!error) return data;
    }
    return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  createUser: async (user: any) => {
    if (supabase) {
      const { data, error } = await supabase.from('users').insert([user]).select();
      if (!error) return data[0];
    }
    const newUser = {
      id: `u${mockUsers.length + 1}`,
      role: 'Employee', // default role
      created_at: new Date().toISOString(),
      ...user
    };
    mockUsers.push(newUser);
    return newUser;
  },

  updateUserRole: async (id: string, role: string) => {
    if (supabase) {
      const { data, error } = await supabase.from('users').update({ role }).eq('id', id).select();
      if (!error) return data[0];
    }
    const idx = mockUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      mockUsers[idx].role = role;
      return mockUsers[idx];
    }
    return null;
  },

  updateUser: async (id: string, updates: any) => {
    if (supabase) {
      const { data, error } = await supabase.from('users').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    }
    const idx = mockUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      mockUsers[idx] = { ...mockUsers[idx], ...updates };
      return mockUsers[idx];
    }
    return null;
  },

  // --- DEPARTMENTS ---
  getDepartments: async () => {
    if (supabase) {
      const { data, error } = await supabase.from('departments').select('*');
      if (!error && data && data.length > 0) return data;
    }
    return mockDepartments;
  },

  createDepartment: async (dept: any) => {
    if (supabase) {
      const { data, error } = await supabase.from('departments').insert([dept]).select();
      if (!error) return data[0];
    }
    const newDept = {
      id: `d${mockDepartments.length + 1}`,
      parent_id: null,
      department_head_id: null,
      status: 'Active',
      ...dept
    };
    mockDepartments.push(newDept);
    return newDept;
  },

  updateDepartment: async (id: string, updates: any) => {
    if (supabase) {
      const { data, error } = await supabase.from('departments').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    }
    const idx = mockDepartments.findIndex(d => d.id === id);
    if (idx !== -1) {
      mockDepartments[idx] = { ...mockDepartments[idx], ...updates };
      return mockDepartments[idx];
    }
    return null;
  },

  // --- ASSET CATEGORIES ---
  getCategories: async () => {
    return mockCategories;
  },

  createCategory: async (cat: any) => {
    const newCat = {
      id: `cat_${Date.now()}`,
      ...cat
    };
    mockCategories.push(newCat);
    return newCat;
  },

  updateCategory: async (id: string, updates: any) => {
    const idx = mockCategories.findIndex(c => c.id === id);
    if (idx !== -1) {
      mockCategories[idx] = { ...mockCategories[idx], ...updates };
      return mockCategories[idx];
    }
    return null;
  },

  // --- ASSETS CRUD ---
  getAssets: async () => {
    if (supabase) {
      const { data, error } = await supabase.from('assets').select('*');
      if (!error && data && data.length > 0) return data;
    }
    return mockAssets;
  },

  getAssetById: async (id: string) => {
    if (supabase) {
      const { data, error } = await supabase.from('assets').select('*').eq('id', id).single();
      if (!error) return data;
    }
    return mockAssets.find(a => a.id === id) || null;
  },

  generateAssetTag: () => {
    let maxNum = 0;
    mockAssets.forEach((a: any) => {
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

  createAsset: async (asset: any) => {
    if (supabase) {
      const { data, error } = await supabase.from('assets').insert([asset]).select();
      if (!error) return data[0];
    }
    const nextTag = db.generateAssetTag();
    const newAsset = {
      id: `a${mockAssets.length + 1}`,
      asset_tag: nextTag,
      created_at: new Date().toISOString(),
      telemetry_hours: 0,
      telemetry_temp: 35.0,
      telemetry_vibration: 1.0,
      risk_score: 0.0,
      condition: asset.condition || 'Good',
      is_shared: asset.is_shared === true || asset.is_shared === 'true',
      photo_url: asset.photo_url || '',
      documents: asset.documents || [],
      ...asset
    };
    mockAssets.push(newAsset);
    return newAsset;
  },

  updateAsset: async (id: string, updates: any) => {
    if (supabase) {
      const { data, error } = await supabase.from('assets').update(updates).eq('id', id).select();
      if (!error) return data[0];
    }
    const index = mockAssets.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAssets[index] = { ...mockAssets[index], ...updates };
      return mockAssets[index];
    }
    return null;
  },

  deleteAsset: async (id: string) => {
    if (supabase) {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (!error) return true;
    }
    const index = mockAssets.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAssets.splice(index, 1);
      return true;
    }
    return false;
  },

  // --- ALLOCATIONS ---
  getAllocations: async () => {
    if (supabase) {
      const { data, error } = await supabase.from('allocations').select('*');
      if (!error && data && data.length > 0) return data;
    }
    return mockAllocations;
  },

  createAllocation: async (alloc: any) => {
    // 1. Prevent double allocation: Check if asset is already allocated/active
    const asset = await db.getAssetById(alloc.asset_id);
    if (!asset) throw new Error('Asset not found');
    if (asset.status === 'Allocated') {
      throw new Error('Double Allocation Blocked: This asset is currently allocated.');
    }
    if (asset.status === 'Reserved' || asset.status === 'Under Maintenance' || asset.status === 'Lost' || asset.status === 'Retired' || asset.status === 'Disposed') {
      throw new Error(`Allocation Blocked: Asset state is ${asset.status}.`);
    }

    if (supabase) {
      const payload = {
        allocated_at: new Date().toISOString(),
        status: 'Active',
        ...alloc
      };
      const { data, error } = await supabase.from('allocations').insert([payload]).select();
      if (error) throw error;
      // also update asset status
      await supabase.from('assets').update({ status: 'Allocated' }).eq('id', alloc.asset_id);
      return data[0];
    }

    const newAlloc = {
      id: `al${mockAllocations.length + 1}`,
      allocated_at: new Date().toISOString(),
      status: 'Active',
      check_in_notes: null,
      returned_condition: null,
      ...alloc
    };
    mockAllocations.push(newAlloc);
    asset.status = 'Allocated'; // Update memory asset status
    return newAlloc;
  },

  returnAllocation: async (id: string, returnedCondition: string, checkInNotes: string) => {
    const alloc = mockAllocations.find(al => al.id === id);
    if (!alloc) throw new Error('Allocation record not found');
    
    if (supabase) {
      const { data, error } = await supabase.from('allocations').update({ returned_at: new Date().toISOString(), status: 'Returned', check_in_notes: checkInNotes, returned_condition: returnedCondition }).eq('id', id).select();
      if (error) throw error;
      await supabase.from('assets').update({ status: 'Available', condition: returnedCondition }).eq('id', alloc.asset_id);
      return data[0];
    }

    alloc.returned_at = new Date().toISOString();
    alloc.status = 'Returned';
    alloc.returned_condition = returnedCondition || 'Good';
    alloc.check_in_notes = checkInNotes || 'None';
    
    const asset = mockAssets.find(a => a.id === alloc.asset_id);
    if (asset) {
      asset.status = 'Available';
      asset.condition = returnedCondition || asset.condition || 'Good';
    }
    return alloc;
  },

  // --- TRANSFERS ---
  getTransfers: async () => {
    if (supabase) {
      const { data, error } = await supabase.from('transfers').select('*');
      if (!error && data && data.length > 0) return data;
    }
    return mockTransfers;
  },

  createTransferRequest: async (transfer: any) => {
    if (supabase) {
      // Find active allocation to determine current holder
      const { data: activeAllocData, error: activeAllocError } = await supabase
        .from('allocations')
        .select('*')
        .eq('asset_id', transfer.asset_id)
        .eq('status', 'Active');
      
      const activeAlloc = (!activeAllocError && activeAllocData && activeAllocData.length > 0) ? activeAllocData[0] : null;

      const newTransfer = {
        asset_id: transfer.asset_id,
        requester_id: transfer.requester_id,
        allocated_to_type: transfer.allocated_to_type,
        expected_return_date: transfer.expected_return_date || null,
        comments: transfer.comments,
        status: 'Pending',
        current_holder_id: activeAlloc ? (activeAlloc.employee_id || activeAlloc.department_id) : null,
        current_holder_type: activeAlloc ? activeAlloc.allocated_to_type : 'Employee',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase.from('transfers').insert([newTransfer]).select();
      if (error) throw error;
      return data[0];
    }

    const activeAlloc = mockAllocations.find(al => al.asset_id === transfer.asset_id && al.status === 'Active');
    const newTransfer = {
      id: `t${mockTransfers.length + 1}`,
      status: 'Pending',
      current_holder_id: activeAlloc ? (activeAlloc.employee_id || activeAlloc.department_id) : null,
      current_holder_type: activeAlloc ? activeAlloc.allocated_to_type : 'Employee',
      created_at: new Date().toISOString(),
      ...transfer
    };
    mockTransfers.push(newTransfer);
    return newTransfer;
  },

  approveTransferRequest: async (id: string, email: string) => {
    let tf: any;
    if (supabase) {
      // 1. Update transfer request status to Approved
      const { data: tfData, error: tfError } = await supabase
        .from('transfers')
        .update({
          status: 'Approved',
          processed_by: email,
          processed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      if (tfError || !tfData || tfData.length === 0) throw tfError || new Error('Transfer request not found');
      tf = tfData[0];

      // 2. Return current active allocation for this asset
      const { data: activeAllocData, error: activeAllocError } = await supabase
        .from('allocations')
        .select('*')
        .eq('asset_id', tf.asset_id)
        .eq('status', 'Active');
      
      if (!activeAllocError && activeAllocData && activeAllocData.length > 0) {
        const activeAlloc = activeAllocData[0];
        await supabase.from('allocations').update({
          status: 'Returned',
          returned_at: new Date().toISOString(),
          check_in_notes: `Asset transferred via approved Request #${tf.id}`,
          returned_condition: 'Good'
        }).eq('id', activeAlloc.id);
      }

      // 3. Create new allocation for requester
      const newAlloc = {
        asset_id: tf.asset_id,
        allocated_to_type: tf.allocated_to_type,
        employee_id: tf.allocated_to_type === 'Employee' ? tf.requester_id : null,
        department_id: tf.allocated_to_type === 'Department' ? tf.requester_id : null,
        allocated_at: new Date().toISOString(),
        expected_return_date: tf.expected_return_date || null,
        status: 'Active'
      };
      await supabase.from('allocations').insert([newAlloc]);

      // 4. Ensure asset status is Allocated
      await supabase.from('assets').update({ status: 'Allocated' }).eq('id', tf.asset_id);
      return tf;
    }

    tf = mockTransfers.find(t => t.id === id);
    if (!tf) throw new Error('Transfer request not found');

    tf.status = 'Approved';
    tf.processed_by = email;
    tf.processed_at = new Date().toISOString();

    // 1. Return current allocation
    const activeAlloc = mockAllocations.find(al => al.asset_id === tf.asset_id && al.status === 'Active');
    if (activeAlloc) {
      activeAlloc.status = 'Returned';
      activeAlloc.returned_at = new Date().toISOString();
      activeAlloc.check_in_notes = `Asset transferred via approved Request #${tf.id}`;
      activeAlloc.returned_condition = 'Good';
    }

    // 2. Create new allocation for requester
    const newAlloc = {
      id: `al${mockAllocations.length + 1}`,
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
    mockAllocations.push(newAlloc);

    // 3. Make sure asset status is Allocated
    const asset = mockAssets.find(a => a.id === tf.asset_id);
    if (asset) {
      asset.status = 'Allocated';
    }

    return tf;
  },

  rejectTransferRequest: async (id: string, email: string) => {
    if (supabase) {
      const { data, error } = await supabase
        .from('transfers')
        .update({
          status: 'Rejected',
          processed_by: email,
          processed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      if (error || !data || data.length === 0) throw error || new Error('Transfer request not found');
      return data[0];
    }

    const tf = mockTransfers.find(t => t.id === id);
    if (!tf) throw new Error('Transfer request not found');

    tf.status = 'Rejected';
    tf.processed_by = email;
    tf.processed_at = new Date().toISOString();
    return tf;
  },

  // --- BOOKINGS & OVERLAP CHECK ---
  getBookings: async () => {
    if (supabase) {
      const { data, error } = await supabase.from('bookings').select('*');
      if (!error) return data;
    }
    return mockBookings;
  },

  createBooking: async (booking: any) => {
    const { asset_id, start_time, end_time } = booking;
    const start = new Date(start_time).getTime();
    const end = new Date(end_time).getTime();

    if (start >= end) {
      throw new Error('Start time must be before end time.');
    }

    // 1. Check overlap on memory DB
    const activeBookings = mockBookings.filter(b => b.asset_id === asset_id && b.status === 'Confirmed');
    const hasOverlap = activeBookings.some(b => {
      const bStart = new Date(b.start_time).getTime();
      const bEnd = new Date(b.end_time).getTime();
      return (start < bEnd && end > bStart);
    });

    if (hasOverlap) {
      throw new Error('Overlap Collision Detected: This resource is already booked during this time slot.');
    }

    // 2. Double check if asset is available for booking (e.g. not Retired/Disposed)
    const asset = await db.getAssetById(asset_id);
    if (asset && (asset.status === 'Retired' || asset.status === 'Disposed')) {
      throw new Error(`Booking Blocked: Asset state is ${asset.status}.`);
    }

    if (supabase) {
      // Perform Supabase check & insert
      const { data: dbBookings, error: fetchErr } = await supabase.from('bookings').select('*').eq('asset_id', asset_id).eq('status', 'Confirmed');
      if (!fetchErr && dbBookings) {
        const overlap = dbBookings.some((b: any) => {
          const bStart = new Date(b.start_time).getTime();
          const bEnd = new Date(b.end_time).getTime();
          return (start < bEnd && end > bStart);
        });
        if (overlap) {
          throw new Error('Overlap Collision Detected: This resource is already booked during this time slot.');
        }
      }
      const { data, error } = await supabase.from('bookings').insert([booking]).select();
      if (error) throw error;
      return data[0];
    }

    const newBooking = {
      id: `b${mockBookings.length + 1}`,
      status: 'Confirmed',
      created_at: new Date().toISOString(),
      ...booking
    };
    mockBookings.push(newBooking);
    return newBooking;
  },

  cancelBooking: async (id: string) => {
    if (supabase) {
      const { data, error } = await supabase.from('bookings').update({ status: 'Cancelled' }).eq('id', id).select();
      if (error) throw error;
      return data[0];
    }
    const b = mockBookings.find(bk => bk.id === id);
    if (b) b.status = 'Cancelled';
    return b || null;
  },

  // --- Vendors ---
  getVendors: async () => {
    if (supabase) {
      const { data, error } = await supabase.from('vendors').select('*');
      if (!error && data && data.length > 0) return data;
    }
    return mockVendors;
  },

  createVendor: async (vendor: any) => {
    if (supabase) {
      const { data, error } = await supabase.from('vendors').insert([vendor]).select();
      if (!error) return data[0];
    }
    const newVendor = {
      id: `v${mockVendors.length + 1}`,
      created_at: new Date().toISOString(),
      ...vendor
    };
    mockVendors.push(newVendor);
    return newVendor;
  },

  // --- Maintenance Logs ---
  getMaintenanceLogs: async () => {
    if (supabase) {
      const { data, error } = await supabase.from('maintenance_logs').select('*');
      if (!error) return data;
    }
    return mockMaintenanceLogs;
  },

  createMaintenanceLog: async (log: any) => {
    if (supabase) {
      const { data, error } = await supabase.from('maintenance_logs').insert([log]).select();
      if (!error) return data[0];
    }
    const newLog = {
      id: `m${mockMaintenanceLogs.length + 1}`,
      created_at: new Date().toISOString(),
      approval_status: log.approval_status || 'Approved', // defaults to approved if scheduled by admin
      ...log
    };
    mockMaintenanceLogs.push(newLog);
    return newLog;
  },

  updateMaintenanceLog: async (id: string, updates: any) => {
    if (supabase) {
      const { data, error } = await supabase.from('maintenance_logs').update(updates).eq('id', id).select();
      if (!error) return data[0];
    }
    const index = mockMaintenanceLogs.findIndex(m => m.id === id);
    if (index !== -1) {
      mockMaintenanceLogs[index] = { ...mockMaintenanceLogs[index], ...updates };
      return mockMaintenanceLogs[index];
    }
    return null;
  },

  // --- Warranties ---
  getWarranties: async () => {
    if (supabase) {
      const { data, error } = await supabase.from('warranties').select('*');
      if (!error) return data;
    }
    return mockWarranties;
  },

  createWarranty: async (warranty: any) => {
    if (supabase) {
      const { data, error } = await supabase.from('warranties').insert([warranty]).select();
      if (!error) return data[0];
    }
    const newWarranty = {
      id: `w${mockWarranties.length + 1}`,
      created_at: new Date().toISOString(),
      ...warranty
    };
    mockWarranties.push(newWarranty);
    return newWarranty;
  },

  // --- AUDITS ---
  getAuditCycles: async () => {
    if (supabase) {
      const { data, error } = await supabase.from('audit_cycles').select('*');
      if (!error) return data;
    }
    return mockAuditCycles;
  },

  createAuditCycle: async (cycle: any) => {
    if (supabase) {
      const { data, error } = await supabase.from('audit_cycles').insert([cycle]).select();
      if (!error) return data[0];
    }
    const newCycle = {
      id: `au${mockAuditCycles.length + 1}`,
      status: 'Planned',
      created_at: new Date().toISOString(),
      ...cycle
    };
    mockAuditCycles.push(newCycle);
    return newCycle;
  },

  updateAuditCycle: async (id: string, updates: any) => {
    if (supabase) {
      const { data, error } = await supabase.from('audit_cycles').update(updates).eq('id', id).select();
      if (!error) return data[0];
    }
    const idx = mockAuditCycles.findIndex(c => c.id === id);
    if (idx !== -1) {
      mockAuditCycles[idx] = { ...mockAuditCycles[idx], ...updates };
      return mockAuditCycles[idx];
    }
    return null;
  },

  getAuditItems: async (cycleId?: string) => {
    if (supabase) {
      const query = supabase.from('audit_items').select('*');
      if (cycleId) query.eq('audit_cycle_id', cycleId);
      const { data, error } = await query;
      if (!error) return data;
    }
    if (cycleId) {
      return mockAuditItems.filter(item => item.audit_cycle_id === cycleId);
    }
    return mockAuditItems;
  },

  createAuditItem: async (item: any) => {
    // 1. Generate discrepancy report values
    const asset = await db.getAssetById(item.asset_id);
    let discrepancy = false;
    if (asset) {
      if (asset.location.toLowerCase() !== item.location_checked.toLowerCase() || 
          asset.status.toLowerCase() !== item.status_checked.toLowerCase()) {
        discrepancy = true;
      }
    }

    const payload = {
      ...item,
      discrepancy_found: discrepancy,
      checked_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase.from('audit_items').insert([payload]).select();
      if (!error) return data[0];
    }

    const newItem = {
      id: `aui${mockAuditItems.length + 1}`,
      ...payload
    };
    mockAuditItems.push(newItem);

    // Update asset last audit date
    if (asset) {
      asset.last_audit_date = new Date().toISOString().split('T')[0];
    }

    return newItem;
  },

  // --- Activity/Audit Logs ---
  getActivityLogs: async () => {
    if (supabase) {
      const { data, error } = await supabase.from('activity_logs').select('*').order('timestamp', { ascending: false });
      if (!error) return data;
    }
    return [...mockActivityLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  createActivityLog: async (log: any) => {
    if (supabase) {
      const { data, error } = await supabase.from('activity_logs').insert([log]).select();
      if (!error) return data[0];
    }
    const newLog = {
      id: `l${mockActivityLogs.length + 1}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    mockActivityLogs.push(newLog);
    return newLog;
  }
};
