console.log("APP STARTED");

// ===== ERROR HANDLER =====
window.onerror = function (msg, src, line, col, err) {
  document.body.innerHTML = `
    <h2>⚠️ App Crashed</h2>
    <p><b>${msg}</b></p>
    <p>Line: ${line}</p>
  `;
};

// ===== APPWRITE SETUP =====
const client = new Appwrite.Client();

client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("699771170039e58cd202");

const databases = new Appwrite.Databases(client);

const DATABASE_ID = "699773e200344c871602";
const COLLECTION_ID = "shows";

// ===== GET DOCUMENT ID =====
function getDocumentId() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

const documentId = getDocumentId();

let showData = null;

// ===== LOAD SHOW =====
async function loadShow(documentId) {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, documentId);

    if (!doc.showData) {
      throw new Error("No show data found");
    }

    try {
      showData = JSON.parse(doc.showData);
    } catch (e) {
      throw new Error("Invalid JSON in showData");
    }

    // SAFE DEFAULTS
    showData.festivalPatch = showData.festivalPatch || [];
    showData.bandPatches = showData.bandPatches || {};
    showData.scheduleItems = showData.scheduleItems || [];

    applyShow();

  } catch (err) {
    console.error(err);

    document.body.innerHTML = `
      <h2>⚠️ Failed to load show</h2>
      <p>${err.message}</p>
    `;
  }
}

// ===== APPLY DATA TO UI =====
function applyShow() {
  document.getElementById("title").innerText =
    showData.eventName || "Untitled Show";

  document.getElementById("eventName").value =
    showData.eventName || "";

  document.getElementById("venue").value =
    showData.venue || "";

  renderPatch(showData.festivalPatch);
  renderBands();
}

// ===== RENDER PATCH TABLE =====
function renderPatch(patch) {
  const container = document.querySelector("#patchTable tbody");
  container.innerHTML = "";

  if (!Array.isArray(patch)) return;

  patch.forEach((ch, index) => {
    const row = document.createElement("tr");

    row.style.background = getChannelColor(ch);
    row.innerHTML = `
      <td class="ch-num">${ch?.ch ?? "-"}</td>
      <td>
        <input class="input instrument" 
          value="${ch?.instrument || ""}" 
          data-index="${index}" data-field="instrument">
      </td>
      <td>
        <input class="input mic" 
          value="${ch?.mic || ""}" 
          data-index="${index}" data-field="mic">
      </td>
      <td>
        <input class="input notes" 
          value="${ch?.notes || ""}" 
          data-index="${index}" data-field="notes">
      </td>
    `;

    container.appendChild(row);
  });
}

// ===== RENDER BAND SELECTOR =====
function renderBands() {
  const selector = document.getElementById("bandSelector");
  selector.innerHTML = "";

  showData.scheduleItems.forEach(band => {
    const option = document.createElement("option");
    option.value = band.id;
    option.textContent = band.artistName || "Unnamed Artist";
    selector.appendChild(option);
  });

  selector.onchange = renderBandPatch;

  renderBandPatch();
}

function getChannelColor(ch) {
  if (!ch) return "#1e1e1e";

  if (ch.instrument?.toLowerCase().includes("kick")) return "#3a1f1f";
  if (ch.instrument?.toLowerCase().includes("snare")) return "#3a2a1f";
  if (ch.instrument?.toLowerCase().includes("vox")) return "#1f2f3a";

  return "#1e1e1e";
}

// ===== RENDER BAND PATCH =====
function renderBandPatch() {
  const bandId = document.getElementById("bandSelector").value;
  const tbody = document.querySelector("#bandPatchTable tbody");

  tbody.innerHTML = "";

  const patch = showData.bandPatches[bandId];
  if (!patch) return;

  patch.forEach((channel, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${channel.channel}</td>
      <td><input value="${channel.instrument || ""}" data-band="${bandId}" data-field="instrument" data-index="${index}"></td>
      <td><input value="${channel.mic || ""}" data-band="${bandId}" data-field="mic" data-index="${index}"></td>
      <td><input value="${channel.notes || ""}" data-band="${bandId}" data-field="notes" data-index="${index}"></td>
    `;

    tbody.appendChild(row);
  });
}

// ===== SAVE SHOW =====
async function saveShow() {
  showData.eventName = document.getElementById("eventName").value;
  showData.venue = document.getElementById("venue").value;

  const jsonString = JSON.stringify(showData);

  await databases.updateDocument(
    DATABASE_ID,
    COLLECTION_ID,
    documentId,
    {
      showData: jsonString,
      eventName: showData.eventName,
      venue: showData.venue
    }
  );

  console.log("Saved");
}

// ===== INPUT LISTENER =====
document.addEventListener("input", (e) => {
  const field = e.target.dataset.field;
  const index = e.target.dataset.index;
  const band = e.target.dataset.band;

  if (field && index !== undefined) {
    if (band) {
      showData.bandPatches[band][index][field] = e.target.value;
    } else {
      showData.festivalPatch[index][field] = e.target.value;
    }
  }
});

// ===== AUTO SAVE =====
document.getElementById("eventName").addEventListener("change", saveShow);
document.getElementById("venue").addEventListener("change", saveShow);

// ===== REALTIME SYNC =====
client.subscribe(
  `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents.${documentId}`,
  (res) => {
    if (!res?.payload?.showData) return;

    try {
      const updated = JSON.parse(res.payload.showData);

      showData = updated;

      renderPatch(showData.festivalPatch);
      renderBandPatch();

    } catch (e) {
      console.error("Realtime update failed", e);
    }
  }
);

// ===== START APP =====
loadShow(documentId);
