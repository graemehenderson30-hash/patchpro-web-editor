console.log("APP STARTED");
window.onerror = function (msg, src, line, col, err) {
  document.body.innerHTML = `
    <h2>⚠️ App Crashed</h2>
    <p><b>${msg}</b></p>
    <p>Line: ${line}</p>
  `;
};

const client = new Appwrite.Client();

client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("699771170039e58cd202");

const databases = new Appwrite.Databases(client);

const DATABASE_ID = "699773e200344c871602";
const COLLECTION_ID = "shows";

const urlParts = window.location.pathname.split("/");
const documentId = urlParts[urlParts.length - 1];

const documentId = getDocumentId();
loadShow(documentId);

let showData = null;

function getDocumentId() {
  const parts = window.location.pathname.split("/");
  return parts[parts.length - 1];
}

function applyShow(doc) {

    showData = JSON.parse(doc.showData);

    document.getElementById("title").innerText = showData.eventName || "Untitled Show";
    document.getElementById("eventName").value = showData.eventName || "";
    document.getElementById("venue").value = showData.venue || "";

    if(showData.festivalPatch){
        renderPatch();
    }

    if(showData.scheduleItems && showData.bandPatches){
        renderBands();
    }
}

function renderPatch(patch) {
  if (!Array.isArray(patch)) {
    console.warn("Patch is invalid:", patch);
    return;
  }

  const container = document.getElementById("app");

  container.innerHTML = patch.map(ch => `
    <div>
      ${ch?.ch ?? "-"} - ${ch?.name ?? ""}
    </div>
  `).join("");
}
function renderBands() {

    const selector = document.getElementById("bandSelector");
    selector.innerHTML = "";

    showData.scheduleItems.forEach(band => {

        const option = document.createElement("option");
        option.value = band.id;
        option.textContent = band.artistName || "Unnamed Artist";

        selector.appendChild(option);

    });

    selector.addEventListener("change", renderBandPatch);

    renderBandPatch();
}
function renderBandPatch() {

    const bandId = document.getElementById("bandSelector").value;

    const tbody = document.querySelector("#bandPatchTable tbody");
    tbody.innerHTML = "";

    const patch = showData.bandPatches[bandId];

    if(!patch) return;

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
async function loadShow(documentId) {
  try {
    const doc = await databases.getDocument(DB, COL, documentId);

    if (!doc.showData) {
      throw new Error("No show data found");
    }

    try {
      showData = JSON.parse(doc.showData);
    } catch (e) {
      throw new Error("Invalid JSON in showData");
    }

    // SAFETY DEFAULTS
    showData.festivalPatch = showData.festivalPatch || [];
    showData.bandPatches = showData.bandPatches || [];
    showData.scheduleItems = showData.scheduleItems || [];

    renderPatch(showData.festivalPatch);

  } catch (err) {
    console.error(err);

    document.body.innerHTML = `
      <h2>⚠️ Failed to load show</h2>
      <p>${err.message}</p>
    `;
  }
}

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

    alert("Saved!");
}

loadShow();

document.getElementById("eventName").addEventListener("change", saveShow);
document.getElementById("venue").addEventListener("change", saveShow);
document.addEventListener("input", (e) => {

    const field = e.target.dataset.field;
    const index = e.target.dataset.index;
    const band = e.target.dataset.band;

    if(field && index){

        if(band){
            showData.bandPatches[band][index][field] = e.target.value;
        } else {
            showData.festivalPatch[index][field] = e.target.value;
        }

    }

});
client.subscribe(
  `databases.${DB}.collections.${COL}.documents.${documentId}`,
  (res) => {
    if (!res?.payload?.showData) return;

    try {
      const updated = JSON.parse(res.payload.showData);

      renderPatch(updated.festivalPatch || []);

    } catch (e) {
      console.error("Realtime update failed", e);
    }
  }
);
