console.log("APP STARTED");

// ===== ERROR HANDLER =====
window.onerror = function (msg, src, line) {
  document.body.innerHTML = `
    <h2>⚠️ App Crashed</h2>
    <p>${msg}</p>
    <p>Line: ${line}</p>
  `;
};

// ===== APPWRITE =====
const client = new Appwrite.Client();

client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("699771170039e58cd202");

const databases = new Appwrite.Databases(client);

const DATABASE_ID = "699773e200344c871602";
const COLLECTION_ID = "shows";

// ===== DOC ID =====
function getDocumentId() {
  return window.location.pathname.split("/").filter(Boolean).pop();
}

const documentId = getDocumentId();

// ===== STATE =====
let showData = {
  eventName: "",
  venue: "",
  scheduleItems: [],
  bandPatches: {}
};

let selectedArtistId = null;

// ===== LOAD =====
async function loadShow() {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, documentId);

    showData = JSON.parse(doc.showData || "{}");

    showData.scheduleItems ||= [];
    showData.bandPatches ||= {};

    applyData();

  } catch (err) {
    console.error(err);
  }
}

// ===== APPLY =====
function applyData() {
  document.getElementById("title").value = showData.eventName || "";
  document.getElementById("venue").value = showData.venue || "";

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

  showData.scheduleItems.forEach((artist, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><input value="${artist.artistName || ""}" data-index="${index}" data-field="artistName"></td>
      <td><input value="${artist.loadIn || ""}" data-index="${index}" data-field="loadIn"></td>
      <td><input value="${artist.soundcheck || ""}" data-index="${index}" data-field="soundcheck"></td>
      <td><input value="${artist.start || ""}" data-index="${index}" data-field="start"></td>
      <td><input value="${artist.finish || ""}" data-index="${index}" data-field="finish"></td>
      <td><button class="button-blue">Rider</button></td>
    `;

    tbody.appendChild(row);
  });
}

// ===== ADD ARTIST =====
function addArtist() {
  const id = "artist_" + Date.now();

  showData.scheduleItems.push({
    id,
    artistName: "Unnamed",
    loadIn: "",
    soundcheck: "",
    start: "",
    finish: ""
  });

  showData.bandPatches[id] = [];

  selectedArtistId = id;

  saveShow();
  applyData();
}

// ===== ARTIST TABS =====
function renderArtistTabs() {
  const container = document.getElementById("artistTabs");
  container.innerHTML = "";

  showData.scheduleItems.forEach(artist => {
    const tab = document.createElement("div");

    tab.className = "artist-tab" + (artist.id === selectedArtistId ? " active" : "");
    tab.innerText = artist.artistName || "Unnamed";

    tab.onclick = () => {
      selectedArtistId = artist.id;
      renderArtistTabs();
      renderPatch();
    };

    container.appendChild(tab);
  });

  // default select first
  if (!selectedArtistId && showData.scheduleItems.length > 0) {
    selectedArtistId = showData.scheduleItems[0].id;
  }

  const selected = showData.scheduleItems.find(a => a.id === selectedArtistId);
  document.getElementById("artistTitle").innerText = selected?.artistName || "Unnamed Artist";
}

// ===== PATCH =====
function renderPatch() {
  const tbody = document.querySelector("#patchTable tbody");
  tbody.innerHTML = "";

  if (!selectedArtistId) return;

  const patch = showData.bandPatches[selectedArtistId] || [];

  for (let i = 0; i < 32; i++) {
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
  const patch = showData.bandPatches[selectedArtistId] || [];

  let channels = patch.length;
  let phantom = patch.filter(p => p?.phantom).length;
  let stands = patch.filter(p => p?.stand).length;

  document.getElementById("statChannels").innerText = channels;
  document.getElementById("stat48v").innerText = phantom;
  document.getElementById("statStands").innerText = stands;
}

// ===== INPUT HANDLER =====
document.addEventListener("input", (e) => {
  const index = e.target.dataset.index;
  const field = e.target.dataset.field;

  if (index !== undefined) {
    showData.scheduleItems[index][field] = e.target.value;
    triggerSave();
  }

  const i = e.target.dataset.i;

  if (i !== undefined && selectedArtistId) {
    const patch = showData.bandPatches[selectedArtistId];

    patch[i] ||= {};
    patch[i][e.target.dataset.field] =
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
  showData.eventName = document.getElementById("title").value;
  showData.venue = document.getElementById("venue").value;

  await databases.updateDocument(
    DATABASE_ID,
    COLLECTION_ID,
    documentId,
    {
      showData: JSON.stringify(showData),
      eventName: showData.eventName,
      venue: showData.venue
    }
  );

  console.log("Saved");
}

// ===== REALTIME =====
client.subscribe(
  `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents.${documentId}`,
  (res) => {
    if (!res?.payload?.showData) return;

    showData = JSON.parse(res.payload.showData);

    applyData();
  }
);

// ===== START =====
loadShow();
