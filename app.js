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

async function loadShow() {

    const doc = await databases.getDocument(
        DATABASE_ID,
        COLLECTION_ID,
        documentId
    );

    showData = JSON.parse(doc.showData);

    document.getElementById("title").innerText = showData.eventName;
    document.getElementById("eventName").value = showData.eventName;
    document.getElementById("venue").value = showData.venue;
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
