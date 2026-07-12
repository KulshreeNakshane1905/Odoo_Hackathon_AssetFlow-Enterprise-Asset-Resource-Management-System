import { Router, Request, Response } from 'express';
import { db } from '../services/db';
import { processChatMessage } from '../services/ai';

const router = Router();

// --- AUTH ENDPOINTS ---

router.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, password, department_id } = req.body;
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'Required fields are missing.' });
    }

    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const user = await db.createUser({
      first_name,
      last_name,
      email,
      password_hash: password, // Store password simply for mock/auth demo
      department_id: department_id || null,
      role: 'Employee' // Hardcoded to Employee to prevent self-assigned admin roles
    });

    // Log this action
    await db.createActivityLog({
      user_email: email,
      user_role: 'Employee',
      action: 'USER_SIGNUP',
      details: `New account registered for ${first_name} ${last_name}`
    });

    res.status(201).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.getUserByEmail(email);
    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Log this action
    await db.createActivityLog({
      user_email: user.email,
      user_role: user.role,
      action: 'USER_LOGIN',
      details: `User logged in successfully`
    });

    res.json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      department_id: user.department_id
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    // Simulate link sent
    res.json({ message: `Password reset instructions sent to ${email}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- EMPLOYEE & DEPARTMENT ENDPOINTS ---

router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await db.getUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role, adminEmail } = req.body;
    if (!role) {
      return res.status(400).json({ error: 'Role is required.' });
    }
    const updated = await db.updateUserRole(req.params.id, role);
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await db.createActivityLog({
      user_email: adminEmail || 'admin@assetflow.com',
      user_role: 'Admin',
      action: 'PROMOTE_USER',
      details: `Promoted user ${updated.email} to ${role}.`
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/departments', async (req: Request, res: Response) => {
  try {
    const depts = await db.getDepartments();
    res.json(depts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/departments/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateDepartment(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await db.getCategories();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', async (req: Request, res: Response) => {
  try {
    const category = await db.createCategory(req.body);
    res.status(201).json(category);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateCategory(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const updated = await db.updateUser(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- ALLOCATIONS ENDPOINTS ---

router.get('/allocations', async (req: Request, res: Response) => {
  try {
    const allocs = await db.getAllocations();
    res.json(allocs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/allocations', async (req: Request, res: Response) => {
  try {
    const { asset_id, allocated_to_type, employee_id, department_id, expected_return_date, userEmail, userRole } = req.body;
    if (!asset_id || !allocated_to_type) {
      return res.status(400).json({ error: 'Asset and allocation type are required.' });
    }

    const alloc = await db.createAllocation({
      asset_id,
      allocated_to_type,
      employee_id: allocated_to_type === 'Employee' ? employee_id : null,
      department_id: allocated_to_type === 'Department' ? department_id : null,
      expected_return_date
    });

    // Update asset state to Allocated
    await db.updateAsset(asset_id, { status: 'Allocated' });

    await db.createActivityLog({
      user_email: userEmail || 'admin@assetflow.com',
      user_role: userRole || 'Asset Manager',
      action: 'ALLOCATE_ASSET',
      asset_id,
      details: `Allocated asset ${asset_id} to ${allocated_to_type === 'Employee' ? 'employee ' + employee_id : 'department ' + department_id}`
    });

    res.status(201).json(alloc);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/allocations/:id/return', async (req: Request, res: Response) => {
  try {
    const { returnedCondition, checkInNotes, userEmail, userRole } = req.body;
    const returned = await db.returnAllocation(req.params.id, returnedCondition, checkInNotes);
    
    await db.createActivityLog({
      user_email: userEmail || 'admin@assetflow.com',
      user_role: userRole || 'Asset Manager',
      action: 'RETURN_ASSET',
      asset_id: returned.asset_id,
      details: `Returned asset allocation ${req.params.id} back to inventory in ${returnedCondition || 'Good'} condition. Notes: ${checkInNotes || 'None'}`
    });

    res.json(returned);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- TRANSFERS ENDPOINTS ---

router.get('/transfers', async (req: Request, res: Response) => {
  try {
    const transfers = await db.getTransfers();
    res.json(transfers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transfers', async (req: Request, res: Response) => {
  try {
    const { asset_id, requester_id, allocated_to_type, comments, expected_return_date, userEmail, userRole } = req.body;
    if (!asset_id || !requester_id) {
      return res.status(400).json({ error: 'Asset and requester are required.' });
    }
    const transfer = await db.createTransferRequest({
      asset_id,
      requester_id,
      allocated_to_type,
      comments,
      expected_return_date
    });
    
    await db.createActivityLog({
      user_email: userEmail || 'admin@assetflow.com',
      user_role: userRole || 'Employee',
      action: 'TRANSFER_REQUEST',
      asset_id,
      details: `Created transfer request for asset ${asset_id} by requester ${requester_id}`
    });

    res.status(201).json(transfer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/transfers/:id/approve', async (req: Request, res: Response) => {
  try {
    const { userEmail, userRole } = req.body;
    const approved = await db.approveTransferRequest(req.params.id, userEmail);
    
    await db.createActivityLog({
      user_email: userEmail || 'admin@assetflow.com',
      user_role: userRole || 'Asset Manager',
      action: 'TRANSFER_APPROVE',
      asset_id: approved.asset_id,
      details: `Approved transfer request ${req.params.id} for asset ${approved.asset_id}`
    });

    res.json(approved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transfers/:id/reject', async (req: Request, res: Response) => {
  try {
    const { userEmail, userRole } = req.body;
    const rejected = await db.rejectTransferRequest(req.params.id, userEmail);
    
    await db.createActivityLog({
      user_email: userEmail || 'admin@assetflow.com',
      user_role: userRole || 'Asset Manager',
      action: 'TRANSFER_REJECT',
      details: `Rejected transfer request ${req.params.id} for asset ${rejected.asset_id}`
    });

    res.json(rejected);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- BOOKINGS ENDPOINTS ---

router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const bookings = await db.getBookings();
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bookings', async (req: Request, res: Response) => {
  try {
    const { asset_id, employee_id, start_time, end_time, purpose, userEmail, userRole } = req.body;
    if (!asset_id || !employee_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'Asset, employee, and start/end times are required.' });
    }

    const booking = await db.createBooking({
      asset_id,
      employee_id,
      start_time,
      end_time,
      purpose
    });

    await db.createActivityLog({
      user_email: userEmail || 'employee@assetflow.com',
      user_role: userRole || 'Employee',
      action: 'BOOK_ASSET',
      asset_id,
      details: `Booked resource ${asset_id} from ${start_time} to ${end_time}`
    });

    res.status(201).json(booking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/bookings/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { userEmail, userRole } = req.body;
    const cancelled = await db.cancelBooking(req.params.id);
    if (!cancelled) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    await db.createActivityLog({
      user_email: userEmail || 'employee@assetflow.com',
      user_role: userRole || 'Employee',
      action: 'CANCEL_BOOKING',
      asset_id: cancelled.asset_id,
      details: `Cancelled booking reservation ${req.params.id}.`
    });

    res.json(cancelled);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- MAINTENANCE & ROUTING WORKFLOW ENDPOINTS ---

router.get('/maintenance', async (req: Request, res: Response) => {
  try {
    const logs = await db.getMaintenanceLogs();
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/maintenance', async (req: Request, res: Response) => {
  try {
    const { asset_id, description, cost, scheduled_date, performed_by, approval_status, requested_by, userEmail, userRole } = req.body;
    if (!asset_id || !description || !scheduled_date) {
      return res.status(400).json({ error: 'Asset, description, and scheduled date are required.' });
    }

    const log = await db.createMaintenanceLog({
      asset_id,
      description,
      cost: Number(cost) || 0,
      scheduled_date,
      performed_by: performed_by || '',
      approval_status: approval_status || 'Approved', // defaults to approved if created by manager directly
      requested_by: requested_by || null,
      status: 'Scheduled'
    });

    // Update asset status to Under Maintenance if immediately scheduled and approved
    if (log.approval_status === 'Approved') {
      await db.updateAsset(asset_id, { status: 'Under Maintenance' });
    }

    await db.createActivityLog({
      user_email: userEmail || 'admin@assetflow.com',
      user_role: userRole || 'Asset Manager',
      action: log.approval_status === 'Approved' ? 'SCHEDULE_MAINTENANCE' : 'REQUEST_MAINTENANCE',
      asset_id,
      details: `${log.approval_status === 'Approved' ? 'Scheduled' : 'Requested'} maintenance: ${description}`
    });

    res.status(201).json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/maintenance/:id', async (req: Request, res: Response) => {
  try {
    const log = await db.updateMaintenanceLog(req.params.id, req.body);
    if (!log) return res.status(404).json({ error: 'Maintenance record not found' });
    
    // If the maintenance status was completed, set asset status back to Available
    if (req.body.status === 'Completed') {
      await db.updateAsset(log.asset_id, { status: 'Available' });
    }

    res.json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/maintenance/:id/approve', async (req: Request, res: Response) => {
  try {
    const { approved_by, userEmail, userRole } = req.body;
    const record = await db.updateMaintenanceLog(req.params.id, {
      approval_status: 'Approved',
      approved_by,
      status: 'Scheduled'
    });
    
    if (!record) return res.status(404).json({ error: 'Maintenance record not found' });

    // Transition asset status
    await db.updateAsset(record.asset_id, { status: 'Under Maintenance' });

    await db.createActivityLog({
      user_email: userEmail || 'admin@assetflow.com',
      user_role: userRole || 'Asset Manager',
      action: 'APPROVE_MAINTENANCE',
      asset_id: record.asset_id,
      details: `Approved maintenance request ${req.params.id} for execution.`
    });

    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/maintenance/:id/reject', async (req: Request, res: Response) => {
  try {
    const { userEmail, userRole } = req.body;
    const record = await db.updateMaintenanceLog(req.params.id, {
      approval_status: 'Rejected',
      status: 'Cancelled'
    });

    if (!record) return res.status(404).json({ error: 'Maintenance record not found' });

    await db.createActivityLog({
      user_email: userEmail || 'admin@assetflow.com',
      user_role: userRole || 'Asset Manager',
      action: 'REJECT_MAINTENANCE',
      asset_id: record.asset_id,
      details: `Rejected maintenance request ${req.params.id}.`
    });

    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- AUDIT CYCLES ENDPOINTS ---

router.get('/audits/cycles', async (req: Request, res: Response) => {
  try {
    const cycles = await db.getAuditCycles();
    res.json(cycles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/audits/cycles', async (req: Request, res: Response) => {
  try {
    const { name, start_date, assigned_auditor_id, userEmail, userRole } = req.body;
    if (!name || !start_date) {
      return res.status(400).json({ error: 'Name and start date are required.' });
    }

    const cycle = await db.createAuditCycle({
      name,
      start_date,
      assigned_auditor_id,
      status: 'Planned'
    });

    await db.createActivityLog({
      user_email: userEmail || 'admin@assetflow.com',
      user_role: userRole || 'Asset Manager',
      action: 'CREATE_AUDIT_CYCLE',
      details: `Created new audit cycle: ${name}`
    });

    res.status(201).json(cycle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/audits/cycles/:id', async (req: Request, res: Response) => {
  try {
    const cycle = await db.updateAuditCycle(req.params.id, req.body);
    if (!cycle) return res.status(404).json({ error: 'Audit cycle not found.' });
    res.json(cycle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/audits/items', async (req: Request, res: Response) => {
  try {
    const cycleId = req.query.cycle_id as string;
    const items = await db.getAuditItems(cycleId);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/audits/items', async (req: Request, res: Response) => {
  try {
    const { audit_cycle_id, asset_id, status_checked, location_checked, notes, userEmail, userRole } = req.body;
    if (!audit_cycle_id || !asset_id || !status_checked || !location_checked) {
      return res.status(400).json({ error: 'Audit cycle, asset, status, and location are required.' });
    }

    const item = await db.createAuditItem({
      audit_cycle_id,
      asset_id,
      status_checked,
      location_checked,
      notes
    });

    await db.createActivityLog({
      user_email: userEmail || 'auditor@assetflow.com',
      user_role: userRole || 'Asset Manager',
      action: 'RECORD_AUDIT_ITEM',
      asset_id,
      details: `Audited asset ${asset_id}: status checked as ${status_checked}, location checked as ${location_checked}. Discrepancy: ${item.discrepancy_found}`
    });

    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- AI CHATBOT ENDPOINT ---
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, role, userEmail } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }
    const response = await processChatMessage(
      message,
      role || 'Admin',
      userEmail || 'admin@assetflow.com'
    );
    res.json(response);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- DEPRECIATION CALCULATION ENDPOINT ---
router.post('/depreciation', (req: Request, res: Response) => {
  try {
    const { cost, lifespanYears, purchaseDate, method } = req.body;
    
    const assetCost = Number(cost);
    const lifespan = Number(lifespanYears);
    
    if (isNaN(assetCost) || isNaN(lifespan) || lifespan <= 0 || assetCost <= 0) {
      return res.status(400).json({ error: 'Valid cost and lifespan years are required.' });
    }

    const schedule = [];
    let currentBookValue = assetCost;
    const startYear = new Date(purchaseDate || Date.now()).getFullYear();

    // Straight-Line Depreciation
    if (method === 'Straight-Line') {
      const annualDepreciation = assetCost / lifespan;
      for (let i = 1; i <= lifespan; i++) {
        const depExpense = annualDepreciation;
        const accumulatedDep = annualDepreciation * i;
        currentBookValue -= depExpense;
        schedule.push({
          year: startYear + i - 1,
          depreciationExpense: Number(depExpense.toFixed(2)),
          accumulatedDepreciation: Number(accumulatedDep.toFixed(2)),
          bookValue: Number(Math.max(0, currentBookValue).toFixed(2))
        });
      }
    } 
    // Double-Declining Balance Depreciation
    else {
      const rate = 2 / lifespan;
      let accumulatedDep = 0;
      for (let i = 1; i <= lifespan; i++) {
        let depExpense = currentBookValue * rate;
        // In the final year, adjust to fully depreciate the asset
        if (i === lifespan) {
          depExpense = currentBookValue;
        }
        accumulatedDep += depExpense;
        currentBookValue -= depExpense;
        schedule.push({
          year: startYear + i - 1,
          depreciationExpense: Number(depExpense.toFixed(2)),
          accumulatedDepreciation: Number(accumulatedDep.toFixed(2)),
          bookValue: Number(Math.max(0, currentBookValue).toFixed(2))
        });
      }
    }

    res.json({
      cost: assetCost,
      lifespanYears: lifespan,
      method,
      schedule
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- ASSETS CRUD ---
router.get('/assets', async (req: Request, res: Response) => {
  try {
    const assets = await db.getAssets();
    res.json(assets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/assets/:id', async (req: Request, res: Response) => {
  try {
    const asset = await db.getAssetById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.json(asset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/assets', async (req: Request, res: Response) => {
  try {
    const asset = await db.createAsset(req.body);
    // Log this action
    await db.createActivityLog({
      user_email: req.body.userEmail || 'admin@assetflow.com',
      user_role: req.body.userRole || 'Admin',
      action: 'CREATE_ASSET',
      asset_id: asset.id,
      details: `Created asset ${asset.name} (${asset.serial_number})`
    });
    res.status(201).json(asset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/assets/:id', async (req: Request, res: Response) => {
  try {
    const asset = await db.updateAsset(req.params.id, req.body);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    // Log this action
    await db.createActivityLog({
      user_email: req.body.userEmail || 'admin@assetflow.com',
      user_role: req.body.userRole || 'Admin',
      action: 'UPDATE_ASSET',
      asset_id: asset.id,
      details: `Updated asset ${asset.name} attributes.`
    });
    res.json(asset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/assets/:id', async (req: Request, res: Response) => {
  try {
    const success = await db.deleteAsset(req.params.id);
    if (!success) return res.status(404).json({ error: 'Asset not found' });
    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- VENDORS ---
router.get('/vendors', async (req: Request, res: Response) => {
  try {
    const vendors = await db.getVendors();
    res.json(vendors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/vendors', async (req: Request, res: Response) => {
  try {
    const vendor = await db.createVendor(req.body);
    res.status(201).json(vendor);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- WARRANTIES ---
router.get('/warranties', async (req: Request, res: Response) => {
  try {
    const warranties = await db.getWarranties();
    res.json(warranties);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/warranties', async (req: Request, res: Response) => {
  try {
    const warranty = await db.createWarranty(req.body);
    res.status(201).json(warranty);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- ACTIVITY LOGS ---
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const logs = await db.getActivityLogs();
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
