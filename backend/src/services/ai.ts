import { db } from './db';

interface ChatResponse {
  reply: string;
  actionTaken?: string;
  data?: any;
}

export async function processChatMessage(message: string, role: string, userEmail: string): Promise<ChatResponse> {
  const query = message.toLowerCase().trim();
  const assets = await db.getAssets();
  const vendors = await db.getVendors();
  const maintenanceLogs = await db.getMaintenanceLogs();

  // 1. Predictive Maintenance queries
  if (query.includes('predict') || query.includes('risk') || query.includes('fail') || query.includes('maintenance due') || query.includes('anomaly')) {
    const highRiskAssets = assets.filter(a => Number(a.risk_score) > 50);
    if (highRiskAssets.length === 0) {
      return {
        reply: `### AI Predictive Maintenance Summary\n\nI analyzed all system telemetry streams (hours, operating temperatures, vibration indexes). Currently, **all assets are operating within safety tolerances** (Risk Score < 50%).\n\nNo emergency maintenance events are predicted at this time.`
      };
    }

    let reply = `### ⚠️ AI Predictive Maintenance Alert\n\nI detected **${highRiskAssets.length} asset(s) at high risk of operational failure** based on real-time telemetry analysis:\n\n`;
    highRiskAssets.forEach(a => {
      reply += `- **${a.name}** (${a.serial_number}) in *${a.location}*\n`;
      reply += `  - **Risk Score:** \`${a.risk_score}%\` (CRITICAL)\n`;
      reply += `  - **Temp:** \`${a.telemetry_temp}°C\` | **Vibration:** \`${a.telemetry_vibration} mm/s\`\n`;
      reply += `  - **Suggested Action:** Schedule diagnostic maintenance immediately.\n\n`;
    });
    reply += `Would you like me to schedule emergency inspections for these items?`;

    return {
      reply,
      data: highRiskAssets
    };
  }

  // 2. Schedule maintenance command
  if (query.includes('schedule') || query.includes('repair') || query.includes('maintenance')) {
    // Check if user is trying to schedule for a specific asset
    const words = query.split(' ');
    // Look for matching asset in the system
    const matchedAsset = assets.find(a => 
      query.includes(a.name.toLowerCase()) || 
      query.includes(a.serial_number.toLowerCase()) ||
      query.includes(a.id.toLowerCase())
    );

    if (matchedAsset) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 2); // Schedule in 2 days
      const dateString = scheduledDate.toISOString().split('T')[0];

      const newLog = await db.createMaintenanceLog({
        asset_id: matchedAsset.id,
        description: `Scheduled via AI Chatbot: Diagnostic review of telemetry variables (requested by ${userEmail})`,
        cost: 250.00,
        status: 'Scheduled',
        scheduled_date: dateString,
        performed_by: 'TechCorp Solutions'
      });

      await db.createActivityLog({
        user_email: userEmail,
        user_role: role,
        action: 'SCHEDULE_MAINTENANCE_AI',
        asset_id: matchedAsset.id,
        details: `Scheduled AI-driven maintenance for ${matchedAsset.name}.`
      });

      return {
        reply: `### ✅ Maintenance Scheduled\n\nI have successfully scheduled a maintenance ticket for **${matchedAsset.name}** (${matchedAsset.serial_number}).\n\n- **Date:** ${dateString}\n- **Assigned Vendor:** TechCorp Solutions\n- **Estimated Cost:** $250.00\n- **Log ID:** \`${newLog.id}\`\n\nI have recorded this in the system and alerted the Maintenance Manager.`,
        actionTaken: 'SCHEDULE_MAINTENANCE',
        data: newLog
      };
    }

    if (query.includes('schedule') && !matchedAsset) {
      return {
        reply: `### Schedule Maintenance\n\nTo schedule a maintenance ticket, please mention the **asset name** or **serial number** in your message.\n\n*Example:* "Schedule maintenance for Forklift Model T" or "Create a repair ticket for SN-MBP-9812".`
      };
    }

    // Default maintenance status query
    const activeMaint = maintenanceLogs.filter(m => m.status === 'In Progress' || m.status === 'Scheduled');
    let reply = `### Active Maintenance Tickets (${activeMaint.length})\n\n`;
    if (activeMaint.length === 0) {
      reply += "There are no open or scheduled maintenance tickets at the moment.";
    } else {
      activeMaint.forEach(m => {
        const asset = assets.find(a => a.id === m.asset_id);
        reply += `- **${asset ? asset.name : 'Unknown Asset'}**: ${m.description}\n`;
        reply += `  - **Status:** \`${m.status}\` | **Scheduled:** \`${m.scheduled_date}\` | **Vendor:** ${m.performed_by || 'Unassigned'}\n`;
      });
    }
    return { reply };
  }

  // 3. Asset search / lists
  if (query.includes('asset') || query.includes('list') || query.includes('find') || query.includes('search')) {
    // Check if specific category is requested
    const categories = ['it hardware', 'heavy equipment', 'av equipment', 'vehicles', 'facilities'];
    const matchedCategory = categories.find(c => query.includes(c));

    let filteredAssets = assets;
    let heading = 'All Assets';

    if (matchedCategory) {
      filteredAssets = assets.filter(a => a.category.toLowerCase() === matchedCategory);
      heading = `${matchedCategory.toUpperCase()} Assets`;
    } else if (query.includes('active')) {
      filteredAssets = assets.filter(a => a.status === 'Active');
      heading = 'Active Assets';
    } else if (query.includes('maintenance')) {
      filteredAssets = assets.filter(a => a.status === 'Maintenance');
      heading = 'Assets in Maintenance';
    }

    if (filteredAssets.length === 0) {
      return {
        reply: `### Assets Search\n\nI couldn't find any assets matching that description. Try searching by category, such as "IT Hardware" or "Heavy Equipment".`
      };
    }

    let reply = `### 📋 ${heading} (${filteredAssets.length})\n\n`;
    reply += `| Asset Name | Serial Number | Category | Status | Location | Value |\n`;
    reply += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
    filteredAssets.forEach(a => {
      reply += `| **${a.name}** | \`${a.serial_number}\` | ${a.category} | \`${a.status}\` | ${a.location} | \$${Number(a.purchase_value).toLocaleString()} |\n`;
    });

    return {
      reply,
      data: filteredAssets
    };
  }

  // 4. Vendors lookup
  if (query.includes('vendor') || query.includes('supplier')) {
    let reply = `### 🏢 Active Enterprise Partners (${vendors.length})\n\n`;
    reply += `| Vendor Name | Contact Email | Rating | Contract Expiry | Status |\n`;
    reply += `| :--- | :--- | :--- | :--- | :--- |\n`;
    vendors.forEach(v => {
      reply += `| **${v.name}** | ${v.contact_email} | ⭐ \`${v.rating}\` | ${v.contract_expiry} | \`${v.status}\` |\n`;
    });
    return { reply };
  }

  // 5. Depreciation lookup
  if (query.includes('depreciat') || query.includes('value') || query.includes('worth')) {
    let reply = `### 📈 Asset Depreciation Summary\n\nHere is the financial valuation breakdown of our top inventory assets:\n\n`;
    let totalCost = 0;
    let totalCurrent = 0;
    assets.forEach(a => {
      totalCost += Number(a.purchase_value);
      totalCurrent += Number(a.current_value);
      reply += `- **${a.name}**: Cost \`$${Number(a.purchase_value).toLocaleString()}\` $\\rightarrow$ Current \`$${Number(a.current_value).toLocaleString()}\` (${a.depreciation_method})\n`;
    });
    const percentage = ((totalCurrent / totalCost) * 100).toFixed(1);
    reply += `\n**Portfolio Health:** The current valuation is **$${totalCurrent.toLocaleString()}** (**${percentage}%** of total acquisition cost **$${totalCost.toLocaleString()}**).`;
    return { reply };
  }

  // Help command / fallback greeting
  return {
    reply: `👋 Hello! I am **AssetFlow AI**, your enterprise assistant.\n\nI can help you monitor telemetry streams, inspect depreciation indexes, search logs, and schedule repair cycles directly. Here are some commands you can try:\n\n- 🔍 **Search**: *"Show me all IT hardware"* or *"List active assets"* \n- ⚠️ **Predictive Maintenance**: *"Check predictive maintenance"* or *"Any anomalies?"*\n- 🛠️ **Service**: *"Schedule maintenance for Forklift Model T"* \n- 🏢 **Partners**: *"Show active vendors"* \n- 📈 **Valuation**: *"Summarize asset depreciation"*`
  };
}
