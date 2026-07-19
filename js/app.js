/* app.js — AssetSENSE frontend (Phase 1: UI only, no backend calls yet) */

const STATUS_LABEL = {
  "available": "Available",
  "in-use": "In use",
  "maintenance": "Maintenance",
  "overdue": "Overdue",
  "for-transfer": "For Transfer",
  "to-dispose": "To Dispose",
};
const STATUS_COLOR = {
  "available": "#2E9B5C",
  "in-use": "#C97C2B",
  "maintenance": "#8A8A96",
  "overdue": "#B33A2E",
  "for-transfer": "#3457A6",
  "to-dispose": "#6B4A3A",
};

/* Action button label per status — what tapping the primary button
   on the drawer / scan result does for an asset in that state. */
const STATUS_ACTION = {
  "available": "Check out",
  "in-use": "Check in",
  "overdue": "Check in",
  "maintenance": "Return to service",
  "for-transfer": "Confirm transfer",
  "to-dispose": "Confirm disposal",
};

const PAGE_META = {
  dashboard: { title: "Dashboard", subtitle: "Live overview of everything tagged in the warehouse" },
  assets:    { title: "Assets", subtitle: "Every item registered with an Ntag215 tag" },
  scan:      { title: "Scan Tag", subtitle: "Simulate a PN532 reader event before the ESP32 is wired in" },
  reports:   { title: "Reports", subtitle: "Utilization and turnaround across the warehouse" },
  admin:     { title: "Users & Admin", subtitle: "Accounts, roles, and permissions" },
};

/* ---------------------------------------------------------
   Navigation
--------------------------------------------------------- */
function switchView(view){
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === `view-${view}`));
  document.getElementById("pageTitle").textContent = PAGE_META[view].title;
  document.getElementById("pageSubtitle").textContent = PAGE_META[view].subtitle;
}
document.getElementById("mainNav").addEventListener("click", e => {
  const btn = e.target.closest(".nav-item");
  if (btn) switchView(btn.dataset.view);
});

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
function timeAgo(iso){
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
function fmtDate(iso){
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function initials(name){
  return name.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase();
}
function statusChip(status){
  return `<span class="chip chip-${status}">${STATUS_LABEL[status]}</span>`;
}

/* ---------------------------------------------------------
   Dashboard
--------------------------------------------------------- */
function renderDashboard(){
  const total = ASSETS.length;
  const inUse = ASSETS.filter(a => a.status === "in-use").length;
  const overdue = ASSETS.filter(a => a.status === "overdue").length;

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statInUse").textContent = inUse;
  document.getElementById("statOverdue").textContent = overdue;
  document.getElementById("statTags").textContent = total;

  const byStatus = {};
  ASSETS.forEach(a => byStatus[a.status] = (byStatus[a.status] || 0) + 1);
  const bars = Object.keys(STATUS_LABEL).map(status => {
    const count = byStatus[status] || 0;
    const pct = Math.round((count / total) * 100);
    return `
      <div class="status-row">
        <div class="status-row-top"><span>${STATUS_LABEL[status]}</span><b>${count}</b></div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:${STATUS_COLOR[status]}"></div></div>
      </div>`;
  }).join("");
  document.getElementById("statusBars").innerHTML =
    `<div class="section-head" style="margin-bottom:2px;"><h2>Status breakdown</h2></div>` + bars;

  const feed = ACTIVITY.slice(0, 8).map(item => `
    <div class="feed-item">
      <div class="feed-dot"></div>
      <div class="feed-body">
        <div><b>${item.actor}</b> ${item.action.toLowerCase()}${item.asset ? ` — ${item.asset}` : ""}</div>
        <div class="feed-time">${timeAgo(item.time)}</div>
      </div>
    </div>`).join("");
  document.getElementById("activityFeed").innerHTML =
    `<div class="section-head" style="margin-bottom:6px;"><h2>Recent activity</h2></div>` + feed;
}

/* ---------------------------------------------------------
   Assets table
--------------------------------------------------------- */
let currentFilter = "all";
let currentSearch = "";

function renderAssetTable(){
  const rows = ASSETS.filter(a => {
    const matchesFilter = currentFilter === "all" || a.status === currentFilter;
    const q = currentSearch.toLowerCase();
    const matchesSearch = !q || a.name.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q) || a.location.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  document.getElementById("assetTableBody").innerHTML = rows.map(a => `
    <tr data-id="${a.id}">
      <td>
        <div class="asset-name">${a.name}</div>
        <div class="asset-sub">${a.id} · ${a.category}</div>
      </td>
      <td class="tagcode">${a.tag}</td>
      <td>${a.category}</td>
      <td>${a.location}</td>
      <td>${statusChip(a.status)}</td>
      <td>${a.assignedTo || "—"}</td>
      <td>${timeAgo(a.lastScanned)}</td>
    </tr>
  `).join("") || `<tr><td colspan="7" style="text-align:center; color:var(--ink-faint); padding:28px;">No assets match this filter.</td></tr>`;

  document.querySelectorAll("#assetTableBody tr[data-id]").forEach(tr => {
    tr.addEventListener("click", () => openDrawer(tr.dataset.id));
  });
}

document.querySelectorAll(".filter-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    currentFilter = pill.dataset.filter;
    renderAssetTable();
  });
});
document.getElementById("assetSearch").addEventListener("input", e => {
  currentSearch = e.target.value;
  renderAssetTable();
});
document.getElementById("globalSearch").addEventListener("input", e => {
  if (e.target.value.trim().length > 1){
    switchView("assets");
    document.getElementById("assetSearch").value = e.target.value;
    currentSearch = e.target.value;
    renderAssetTable();
  }
});

/* ---------------------------------------------------------
   Asset drawer
--------------------------------------------------------- */
function openDrawer(assetId){
  const a = ASSETS.find(x => x.id === assetId);
  if (!a) return;

  const history = ACTIVITY.filter(item => item.asset && item.asset.includes(a.id));

  document.getElementById("drawerBody").innerHTML = `
    <div class="tag-stub">
      <div class="tag-stub-row">
        <span class="tag-stub-code">${a.tag}</span>
        ${statusChip(a.status)}
      </div>
      <div class="tag-stub-name">${a.name}</div>
      <div class="tag-stub-meta">${a.id} · ${a.category}</div>
      <div class="tag-stub-perf">
        <span>Location: ${a.location}</span>
        <span>Last scan: ${timeAgo(a.lastScanned)}</span>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-field"><span>Assigned to</span><b>${a.assignedTo || "Unassigned"}</b></div>
      <div class="detail-field"><span>Due back</span><b>${fmtDate(a.dueBack)}</b></div>
      <div class="detail-field"><span>Category</span><b>${a.category}</b></div>
      <div class="detail-field"><span>Location</span><b>${a.location}</b></div>
    </div>

    <div>
      <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center;">
        ${STATUS_ACTION[a.status]}
      </button>
    </div>

    <div>
      <div class="hist-title">Scan history (mock)</div>
      ${history.length ? history.map(h => `
        <div class="hist-item"><span>${h.action}</span><span>${timeAgo(h.time)}</span></div>
      `).join("") : `<div class="hist-item"><span>No recent events for this tag</span></div>`}
    </div>
  `;

  document.getElementById("assetDrawer").classList.add("open");
  document.getElementById("drawerOverlay").classList.add("open");
}
function closeDrawer(){
  document.getElementById("assetDrawer").classList.remove("open");
  document.getElementById("drawerOverlay").classList.remove("open");
}
document.getElementById("drawerClose").addEventListener("click", closeDrawer);
document.getElementById("drawerOverlay").addEventListener("click", closeDrawer);

/* ---------------------------------------------------------
   Scan simulator
--------------------------------------------------------- */
const scanSelect = document.getElementById("scanSelect");
DEMO_SCAN_TAGS.forEach(tag => {
  const asset = ASSETS.find(a => a.tag === tag);
  const opt = document.createElement("option");
  opt.value = tag;
  opt.textContent = `${tag} — ${asset ? asset.name : "Unknown"}`;
  scanSelect.appendChild(opt);
});

document.getElementById("scanBtn").addEventListener("click", () => {
  const tag = scanSelect.value || DEMO_SCAN_TAGS[Math.floor(Math.random() * DEMO_SCAN_TAGS.length)];
  const target = document.getElementById("scanTarget");
  const status = document.getElementById("scanStatus");
  const result = document.getElementById("scanResult");

  target.classList.add("pulsing");
  status.textContent = "Reading tag…";
  result.innerHTML = `<div class="scan-result-empty"><p>Reading NFC payload…</p></div>`;

  setTimeout(() => {
    target.classList.remove("pulsing");
    const asset = ASSETS.find(a => a.tag === tag);

    if (!asset){
      status.textContent = "Tag not recognized";
      result.innerHTML = `<div class="scan-result-empty"><p>This tag isn't registered in AssetSENSE yet. Add it from the Assets page once the backend is live.</p></div>`;
      return;
    }

    status.textContent = "Match found";
    result.innerHTML = `
      <div class="tag-stub" style="margin-bottom:16px;">
        <div class="tag-stub-row">
          <span class="tag-stub-code">${asset.tag}</span>
          ${statusChip(asset.status)}
        </div>
        <div class="tag-stub-name">${asset.name}</div>
        <div class="tag-stub-meta">${asset.id} · ${asset.category}</div>
        <div class="tag-stub-perf">
          <span>Location: ${asset.location}</span>
          <span>Last scan: just now</span>
        </div>
      </div>
      <div class="detail-grid">
        <div class="detail-field"><span>Assigned to</span><b>${asset.assignedTo || "Unassigned"}</b></div>
        <div class="detail-field"><span>Due back</span><b>${fmtDate(asset.dueBack)}</b></div>
      </div>
      <div style="margin-top:16px; display:flex; gap:10px;">
        <button class="btn btn-primary" style="flex:1; justify-content:center;">
          ${STATUS_ACTION[asset.status]}
        </button>
        <button class="btn btn-ghost" style="flex:1; justify-content:center;" onclick="openDrawer('${asset.id}')">
          View full record
        </button>
      </div>
    `;
  }, 1100);
});

/* ---------------------------------------------------------
   Reports
--------------------------------------------------------- */
function renderReports(){
  const byCat = {};
  ASSETS.forEach(a => byCat[a.category] = (byCat[a.category] || 0) + 1);
  const maxCat = Math.max(...Object.values(byCat));
  document.getElementById("categoryBars").innerHTML = Object.entries(byCat).map(([cat, count]) => `
    <div class="bar-col">
      <span class="bar-val">${count}</span>
      <div class="bar" style="height:${(count / maxCat) * 100}%"></div>
      <span class="bar-lbl">${cat}</span>
    </div>
  `).join("");

  const byStatus = {};
  ASSETS.forEach(a => byStatus[a.status] = (byStatus[a.status] || 0) + 1);
  const total = ASSETS.length;
  let offset = 0;
  const circumference = 2 * Math.PI * 15.9;
  const segments = Object.keys(STATUS_LABEL).map(status => {
    const count = byStatus[status] || 0;
    const frac = count / total;
    const dash = frac * circumference;
    const seg = `<circle cx="21" cy="21" r="15.9" fill="none" stroke="${STATUS_COLOR[status]}" stroke-width="5.5"
                  stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" />`;
    offset += dash;
    return seg;
  }).join("");
  document.getElementById("donutChart").innerHTML = segments;
  document.getElementById("donutLegend").innerHTML = Object.keys(STATUS_LABEL).map(status => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${STATUS_COLOR[status]}"></span>
      ${STATUS_LABEL[status]} <b>${byStatus[status] || 0}</b>
    </div>
  `).join("");

  const trend = [3, 5, 2, 6, 4, 7, 3];
  const maxTrend = Math.max(...trend);
  document.getElementById("trendRow").innerHTML = trend.map(v => `
    <div class="trend-col" style="height:${(v / maxTrend) * 100}%" title="${v} check-outs"></div>
  `).join("");
}

/* ---------------------------------------------------------
   Admin / Users
--------------------------------------------------------- */
function renderUsers(){
  document.getElementById("userTableBody").innerHTML = USERS.map(u => `
    <tr>
      <td>
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="avatar" style="width:28px; height:28px; font-size:11px;">${initials(u.name)}</div>
          <span class="asset-name">${u.name}</span>
        </div>
      </td>
      <td><span class="role-badge role-${u.role.replace(/\s/g,'-')}">${u.role}</span></td>
      <td>${u.department}</td>
      <td><span class="status-dot ${u.status}">${u.status === "active" ? "Active" : "Suspended"}</span></td>
      <td>${timeAgo(u.lastActive)}</td>
      <td><button class="btn btn-ghost btn-sm">Manage</button></td>
    </tr>
  `).join("");
}

/* ---------------------------------------------------------
   Init
--------------------------------------------------------- */
renderDashboard();
renderAssetTable();
renderReports();
renderUsers();
