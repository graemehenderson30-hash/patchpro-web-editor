const client = new Appwrite.Client();

client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("699771170039e58cd202");

const databases = new Appwrite.Databases(client);

const DATABASE_ID = "699773e200344c871602";
const COLLECTION_ID = "shows";

const urlParts = window.location.pathname.split("/");
const documentId = urlParts[urlParts.length - 1];

let showData = null;

function applyShow(doc) {

    showData = JSON.parse(doc.showData);

    document.getElementById("title").innerText = showData.eventName;
    document.getElementById("eventName").value = showData.eventName;
    document.getElementById("venue").value = showData.venue;

    renderPatch();
}

function renderPatch() {

    const tbody = document.querySelector("#patchTable tbody");
    tbody.innerHTML = "";

    showData.festivalPatch.forEach((channel, index) => {

        const row = document.createElement("tr");

        row.innerHTML = `
        <td>${channel.channel}</td>
        <td><input value="${channel.instrument || ""}" data-field="instrument" data-index="${index}"></td>
        <td><input value="${channel.mic || ""}" data-field="mic" data-index="${index}"></td>
        <td><input value="${channel.notes || ""}" data-field="notes" data-index="${index}"></td>
        `;

        tbody.appendChild(row);
    });
}

async function loadShow() {

    const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        documentId
    );

    applyShow(doc);

    // 🔴 LIVE COLLABORATION
    client.subscribe(
        `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents.${documentId}`,
        (response) => {

            if (response.events.includes(
                "databases.*.collections.*.documents.*.update"
            )) {
                applyShow(response.payload);
            }
        }
    );
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

    if(field && index){

        showData.festivalPatch[index][field] = e.target.value;

    }

});
