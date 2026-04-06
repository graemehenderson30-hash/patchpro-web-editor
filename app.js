const DATABASE_ID = "699773e200344c871602";
const COLLECTION_ID = "shows";
const PROJECT_ID = "699771170039e58cd202";

let state = {};

// ---------- LOAD ----------
async function loadShow() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    console.error("No ID in URL");
    return;
  }

  const res = await fetch(
    `https://cloud.appwrite.io/v1/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${id}`,
    {
      headers: {
        "X-Appwrite-Project": PROJECT_ID
      }
    }
  );

  const doc = await res.json();

  state = JSON.parse(doc.showData);

  applyState();
}

// ---------- APPLY ----------
function applyState() {
  document.getElementById("title").value = state.eventName || "";
  document.getElementById("venue").value = state.venue || "";

  renderSchedule();
  renderPatch();
}

// ---------- SCHEDULE (READ ONLY) ----------
function renderSchedule() {
  const tbody = document.querySelector("#scheduleTable tbody");
  tbody.innerHTML = "";

  state.scheduleItems?.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.artistName || ""}</td>
      <td>${item.start || ""}</td>
      <td>${item.finish || ""}</td>
    `;

    tbody.appendChild(row);
  });
}

// ---------- PATCH (EDITABLE) ----------
function renderPatch() {
  const tbody = document.querySelector("#patchTable tbody");
  tbody.innerHTML = "";

  const total = state.patchMode || 48;

  for (let i = 0; i < total; i++) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${i + 1}</td>
      <td><input></td>
      <td><input></td>
    `;

    tbody.appendChild(row);
  }
}

// ---------- TABS ----------
function switchTab(tab) {
  document.getElementById("scheduleView").classList.toggle("hidden", tab !== "schedule");
  document.getElementById("patchView").classList.toggle("hidden", tab !== "patch");
}

// ---------- START ----------
loadShow();
