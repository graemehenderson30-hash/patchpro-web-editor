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

// ===== GET DOC ID =====
function getDocumentId() {
  return window.location.pathname.split("/").filter(Boolean).pop();
}

const documentId = getDocumentId();

let showData = {};

// ===== LOAD =====
async function loadShow() {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, documentId);

    showData = JSON.parse(doc.showData || "{}");

    showData.festivalPatch = showData.festivalPatch || [];
    showData.scheduleItems = showData.scheduleItems || [];

    applyData();

  } catch (err) {
    console.error(err);
  }
}

// ===== APPLY =====
function applyData() {
  document.getElementById("title").innerText = showData.eventName || "New Event";
  document.getElementById("venue").value = showData.venue || "";

  renderSchedule();
  renderPatch();
}

// ===== TABS =====
function switchTab(tab) {
  document.getElementById("scheduleView").classList.toggle("hidden", tab !== "schedule");
  document.getElementById("patchView").classList.toggle("hidden", tab !== "patch");

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  event.target.classList.add("active");
}

// ===== SCHEDULE =====
function renderSchedule() {
  const grid = document.getElementById("scheduleGrid");
  grid.innerHTML = "";

  showData.scheduleItems.forEach(item => {
    const div = document.createElement("div");
    div.innerHTML = `
      <input value="${item.artistName || ""}">
      <input value="${item.start || ""}">
      <input value="${item.end || ""}">
    `;
    grid.appendChild(div);
  });
}

// ===== PATCH =====
function renderPatch() {
  const tbody = document.querySelector("#patchTable tbody");
  tbody.innerHTML = "";

  showData.festivalPatch.forEach((ch, i) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${ch.ch || i+1}</td>
      <td><input value="${ch.fest || ""}"></td>
      <td>${ch.ch || i+1}</td>
      <td><input value="${ch.artist || ""}"></td>
      <td><input value="${ch.box || ""}"></td>
      <td><input value="${ch.mic || ""}"></td>
      <td><input value="${ch.stand || ""}"></td>
      <td><input type="checkbox" ${ch.phantom ? "checked" : ""}></td>
    `;

    tbody.appendChild(row);
  });
}

// ===== START =====
loadShow();
