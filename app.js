console.log("APP STARTED");

// ===== APPWRITE =====
const client = new Appwrite.Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("699771170039e58cd202");

const databases = new Appwrite.Databases(client);

const DATABASE_ID = "699773e200344c871602";
const COLLECTION_ID = "shows";

function getDocumentId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

const documentId = getDocumentId();

// ===== STATE (MATCHES SWIFTUI) =====
let state = {
  eventName: "New Event",
  venue: "",
  startDate: "",
  endDate: "",
  scheduleItems: [],
  bandPatches: {},
  selectedBandID: null,
  patchMode: 48
};

// ===== LOAD =====
async function loadShow() {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, documentId);

    const data = JSON.parse(doc.showData || "{}");

    state = {
      ...state,
      ...data
    };

    state.scheduleItems ||= [];
    state.bandPatches ||= {};

    applyState();

  } catch (err) {
    console.error(err);
  }
}

// ===== APPLY STATE =====
function applyState() {
  document.getElementById("title").value = state.eventName;
  document.getElementById("venue").value = state.venue;

  renderSchedule();
  renderArtistTabs();
  renderPatch();
}

// ===== TAB SWITCH =====
function switchTab(tab) {
  document.getElementById("scheduleView").classList.toggle("hidden", tab !== "schedule");
  document.getElementById("patchView").classList.toggle("hidden", tab !== "patch");

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  event.target.classList.add("active");
}

// ===== SCHEDULE =====
function renderSchedule() {
  const tbody = document.querySelector("#scheduleTable tbody");
  tbody.innerHTML = "";

  state.scheduleItems.forEach((item, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><input value="${item.artistName || ""}" data-index="${index}" data-field="artistName"></td>
      <td><input value="${item.loadIn || ""}" data-index="${index}" data-field="loadIn"></td>
      <td><input value="${item.soundcheck || ""}" data-index="${index}" data-field="soundcheck"></td>
      <td><input value="${item.start || ""}" data-index="${index}" data-field="start"></td>
      <td><input value="${item.finish || ""}" data-index="${index}" data-field="finish"></td>
      <td><button class="button-blue">Rider</button></td>
    `;

    tbody.appendChild(row);
  });
}

// ===== ADD ARTIST (MATCH SWIFT) =====
function addArtist() {
  const id = crypto.randomUUID();

  const newArtist = {
    id,
    artistName: "Unnamed",
    loadIn: "",
    soundcheck: "",
    start: "",
    finish: ""
  };

  state.scheduleItems.push(newArtist);

  state.bandPatches[id] = Array.from({ length: state.patchMode }, (_, i) => ({
    channel: i + 1
  }));

  state.selectedBandID = id;

  saveAndRender();
}

// ===== ARTIST TABS =====
function renderArtistTabs() {
  const container = document.getElementById("artistTabs");
  container.innerHTML = "";

  if (!state.selectedBandID && state.scheduleItems.length > 0) {
    state.selectedBandID = state.scheduleItems[0].id;
  }

  state.scheduleItems.forEach(item => {
    const tab = document.createElement("div");

    tab.className = "artist-tab" + (item.id === state.selectedBandID ? " active" : "");
    tab.innerText = item.artistName || "Unnamed";

    tab.onclick = () => {
      state.selectedBandID = item.id;
      renderArtistTabs();
      renderPatch();
    };

    container.appendChild(tab);
  });

  const selected = state.scheduleItems.find(a => a.id === state.selectedBandID);
  document.getElementById("artistTitle").innerText = selected?.artistName || "Unnamed Artist";
}

// ===== PATCH =====
function renderPatch() {
  const tbody = document.querySelector("#patchTable tbody");
  tbody.innerHTML = "";

  if (!state.selectedBandID) return;

  const patch = state.bandPatches[state.selectedBandID] || [];

  const totalChannels = state.patchMode;

  for (let i = 0; i < totalChannels; i++) {
    const ch = patch[i] || {};

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${i + 1}</td>
      <td><input value="${ch.fest || ""}" data-i="${i}" data-field="fest"></td>
      <td>${i + 1}</td>
      <td><input value="${ch.artist || ""}" data-i="${i}" data-field="artist"></td>
      <td><input value="${ch.box || ""}" data-i="${i}" data-field="box"></td>
      <td><input value="${ch.mic || ""}" data-i="${i}" data-field="mic"></td>
      <td><input value="${ch.stand || ""}" data-i="${i}" data-field="stand"></td>
      <td><input type="checkbox" ${ch.phantom ? "checked" : ""} data-i="${i}" data-field="phantom"></td>
    `;

    tbody.appendChild(row);
  }

  updateStats();
}

// ===== STATS =====
function updateStats() {
  const patch = state.bandPatches[state.selectedBandID] || [];

  document.getElementById("statChannels").innerText = patch.length;
  document.getElementById("stat48v").innerText = patch.filter(p => p?.phantom).length;
  document.getElementById("statStands").innerText = patch.filter(p => p?.stand).length;
}

// ===== INPUT =====
document.addEventListener("input", (e) => {
  const index = e.target.dataset.index;
  const field = e.target.dataset.field;

  if (index !== undefined) {
    state.scheduleItems[index][field] = e.target.value;
    triggerSave();
  }

  const i = e.target.dataset.i;

  if (i !== undefined && state.selectedBandID) {
    const patch = state.bandPatches[state.selectedBandID];

    patch[i] ||= {};
    patch[i][field] =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;

    triggerSave();
  }
});

// ===== SAVE =====
let saveTimer;

function triggerSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveShow, 400);
}

async function saveShow() {
  state.eventName = document.getElementById("title").value;
  state.venue = document.getElementById("venue").value;

  await databases.updateDocument(
    DATABASE_ID,
    COLLECTION_ID,
    documentId,
    {
      showData: JSON.stringify(state)
    }
  );
}

// ===== REALTIME =====
client.subscribe(
  `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents.${documentId}`,
  (res) => {
    if (!res?.payload?.showData) return;

    state = JSON.parse(res.payload.showData);
    applyState();
  }
);

// ===== START =====
loadShow();
