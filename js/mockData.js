/* mockData.js
   Frontend-only placeholder data for AssetSENSE.
   Shapes here match what /api/assets, /api/users, and /api/activity
   are expected to return once the backend (Express + MongoDB Atlas) is built.
   Replace ASSETS / USERS / ACTIVITY with real fetch() calls in Phase 2.
*/

const ASSETS = [
  { id: "A-0114", tag: "NTAG215-04A2E1", name: "Dell Latitude 5420", category: "Laptops", location: "Shelf A1", status: "available", assignedTo: null, lastScanned: "2026-07-18T09:12:00", dueBack: null },
  { id: "A-0115", tag: "NTAG215-04A2E7", name: "Dell Latitude 5420", category: "Laptops", location: "Room 204", status: "in-use", assignedTo: null, lastScanned: "2026-07-19T08:03:00", dueBack: "2026-07-22" },
  { id: "A-0201", tag: "NTAG215-091B3C", name: "Bosch Cordless Drill", category: "Power Tools", location: "Shelf C2", status: "in-use", assignedTo: null, lastScanned: "2026-07-15T14:20:00", dueBack: "2026-07-17" },
  { id: "A-0202", tag: "NTAG215-091B44", name: "Makita Angle Grinder", category: "Power Tools", location: "Shelf C2", status: "maintenance", assignedTo: null, lastScanned: "2026-07-10T11:00:00", dueBack: null },
  { id: "A-0305", tag: "NTAG215-0C7A19", name: "Epson Projector EB-X05", category: "AV Equipment", location: "Room 118", status: "available", assignedTo: null, lastScanned: "2026-07-17T16:45:00", dueBack: null },
  { id: "A-0306", tag: "NTAG215-0C7A22", name: "Shure Wireless Mic Set", category: "AV Equipment", location: "AV Booth", status: "overdue", assignedTo: null, lastScanned: "2026-07-08T10:15:00", dueBack: "2026-07-12" },
  { id: "A-0410", tag: "NTAG215-11D8F0", name: "Fluke Multimeter 117", category: "Lab Instruments", location: "Lab 3B", status: "available", assignedTo: null, lastScanned: "2026-07-18T13:30:00", dueBack: null },
  { id: "A-0411", tag: "NTAG215-11D8F5", name: "Tektronix Oscilloscope", category: "Lab Instruments", location: "Lab 3B", status: "in-use", assignedTo: null, lastScanned: "2026-07-19T07:50:00", dueBack: "2026-07-21" },
  { id: "A-0512", tag: "NTAG215-16E2A8", name: "Stackable Chair (x1)", category: "Furniture", location: "Storage D", status: "for-transfer", assignedTo: null, lastScanned: "2026-07-14T09:00:00", dueBack: null },
  { id: "A-0513", tag: "NTAG215-16E2B1", name: "Folding Table 6ft", category: "Furniture", location: "Storage D", status: "in-use", assignedTo: null, lastScanned: "2026-07-19T06:40:00", dueBack: "2026-07-20" },
  { id: "A-0601", tag: "NTAG215-1A44C7", name: "Fire Extinguisher (ABC)", category: "Safety Gear", location: "Hallway A", status: "to-dispose", assignedTo: null, lastScanned: "2026-07-05T08:00:00", dueBack: null },
  { id: "A-0602", tag: "NTAG215-1A44D2", name: "First Aid Kit, Large", category: "Safety Gear", location: "Room 204", status: "available", assignedTo: null, lastScanned: "2026-07-16T15:10:00", dueBack: null },
  { id: "A-0116", tag: "NTAG215-04A2F0", name: "HP ProBook 450", category: "Laptops", location: "Shelf A1", status: "overdue", assignedTo: null, lastScanned: "2026-07-06T09:45:00", dueBack: "2026-07-09" },
  { id: "A-0307", tag: "NTAG215-0C7A30", name: "Portable PA Speaker", category: "AV Equipment", location: "AV Booth", status: "available", assignedTo: null, lastScanned: "2026-07-18T17:00:00", dueBack: null },
];

const USERS = [
  { id: "U-01", name: "ADMIN", role: "Admin", department: "AAMO", status: "active", lastActive: "2026-07-19T08:30:00" },
  { id: "U-02", name: "HANS", role: "Warehouse Staff", department: "AAMO", status: "active", lastActive: "2026-07-19T08:03:00" },
  { id: "U-03", name: "BASTTI", role: "Warehouse Staff", department: "AAMO", status: "active", lastActive: "2026-07-15T14:20:00" },
  { id: "U-04", name: "SAMUEL", role: "Faculty Requester", department: "CICS", department_full: "College of Computer and Information Sciences", status: "active", lastActive: "2026-07-19T07:50:00" },
];

const ACTIVITY = [
  { time: "2026-07-19T08:30:00", actor: "ADMIN", action: "Signed in", asset: null },
  { time: "2026-07-19T08:03:00", actor: "HANS", action: "Checked out", asset: "Dell Latitude 5420 (A-0115)" },
  { time: "2026-07-19T07:50:00", actor: "SAMUEL", action: "Checked out", asset: "Tektronix Oscilloscope (A-0411)" },
  { time: "2026-07-19T06:40:00", actor: "BASTTI", action: "Checked out", asset: "Folding Table 6ft (A-0513)" },
  { time: "2026-07-18T17:00:00", actor: "System", action: "Scanned in", asset: "Portable PA Speaker (A-0307)" },
  { time: "2026-07-18T13:30:00", actor: "System", action: "Scanned in", asset: "Fluke Multimeter 117 (A-0410)" },
  { time: "2026-07-18T09:12:00", actor: "System", action: "Scanned in", asset: "Dell Latitude 5420 (A-0114)" },
  { time: "2026-07-17T16:45:00", actor: "System", action: "Scanned in", asset: "Epson Projector EB-X05 (A-0305)" },
  { time: "2026-07-16T15:10:00", actor: "System", action: "Scanned in", asset: "First Aid Kit, Large (A-0602)" },
  { time: "2026-07-15T14:20:00", actor: "BASTTI", action: "Checked out", asset: "Bosch Cordless Drill (A-0201)" },
];

/* Tags that respond to the Scan Simulator on the Scan page.
   Any tag in ASSETS works; this list is just the "known good" demo set. */
const DEMO_SCAN_TAGS = ["NTAG215-04A2E1", "NTAG215-0C7A19", "NTAG215-11D8F0", "NTAG215-1A44D2"];
