const formSelect = document.querySelector("#form-select");
const intakeForm = document.querySelector("#intake-form");
const clearFormBtn = document.querySelector("#clear-form-btn");
const sendLinkBtn = document.querySelector("#send-link-btn");
const linkBox = document.querySelector("#link-box");
const importDraftsBtn = document.querySelector("#import-drafts-btn");
const draftList = document.querySelector("#draft-list");
const clientList = document.querySelector("#client-list");
const previewContent = document.querySelector("#preview-content");
const downloadPreviewBtn = document.querySelector("#download-preview-btn");

const {
  N400_FORM_ID,
  loadClients,
  saveClients,
  loadDrafts,
  saveDrafts,
  getSelectedForm,
  setSelectedForm,
  buildFullName,
  getNormalizedClient,
  createN400Doc,
  downloadPdfDoc,
} = JuratShared;

const formSchema = [
  { key: "fullName", label: "Applicant full legal name" },
  { key: "alienNumber", label: "A-number" },
  { key: "uscisAccountNumber", label: "USCIS online account number" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "countryOfBirth", label: "Country of birth" },
  { key: "citizenship", label: "Country of citizenship" },
  { key: "addressLine1", label: "Street address" },
  { key: "addressLine2", label: "Apartment / suite" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zipCode", label: "ZIP code" },
  { key: "country", label: "Country" },
  { key: "email", label: "Email address" },
  { key: "phone", label: "Phone number" },
  { key: "notes", label: "Notes for attorney" },
];

let clients = loadClients();
let drafts = loadDrafts();
let selectedClientId = clients[0]?.id || null;

const buildClientFromForm = (formData) => {
  const nameParts = {
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName"),
    lastName: formData.get("lastName"),
  };
  const addressLine1 = formData.get("addressLine1");
  const city = formData.get("city");
  const state = formData.get("state");
  const zipCode = formData.get("zipCode");
  const address = [
    addressLine1,
    city,
    state && zipCode ? `${state} ${zipCode}` : state || zipCode,
    formData.get("country"),
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: `CL-${Date.now().toString().slice(-6)}`,
    formId: N400_FORM_ID,
    source: "assistant",
    firstName: nameParts.firstName,
    middleName: nameParts.middleName,
    lastName: nameParts.lastName,
    fullName: buildFullName(nameParts),
    preferredName: formData.get("preferredName"),
    alienNumber: formData.get("alienNumber"),
    uscisAccountNumber: formData.get("uscisAccountNumber"),
    dateOfBirth: formData.get("dateOfBirth"),
    countryOfBirth: formData.get("countryOfBirth"),
    citizenship: formData.get("citizenship"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address,
    addressLine1,
    addressLine2: formData.get("addressLine2"),
    city,
    state,
    zipCode,
    country: formData.get("country"),
    notes: formData.get("notes"),
    createdAt: new Date().toISOString(),
  };
};

const renderClients = () => {
  clientList.innerHTML = "";
  if (clients.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No clients yet. Save an intake or import a completed client link.";
    clientList.appendChild(empty);
    return;
  }

  clients.forEach((client) => {
    const normalized = getNormalizedClient(client);
    const card = document.createElement("div");
    card.className = "client-card";
    card.innerHTML = `
      <h3>${normalized.fullName}</h3>
      <div class="client-meta">${client.id} · ${normalized.citizenship || "Citizenship pending"}</div>
      <div class="client-meta">${client.email}</div>
      <div class="client-badges">
        <span class="badge">${client.formId}</span>
        <span class="badge">${client.source === "client" ? "Client intake" : "Assistant intake"}</span>
      </div>
      <button class="btn btn-primary" type="button">Download N-400 (PDF)</button>
    `;
    const button = card.querySelector("button");
    button.addEventListener("click", async () => {
      const pdfDoc = await createN400Doc(client);
      if (!pdfDoc) {
        return;
      }
      await downloadPdfDoc({ pdfDoc, fileName: `${client.id}-N-400.pdf` });
    });
    card.addEventListener("click", () => {
      selectedClientId = client.id;
      renderPreview();
    });
    clientList.appendChild(card);
  });
};

const renderDrafts = () => {
  draftList.innerHTML = "";
  if (drafts.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No client links yet. Generate one to get started.";
    draftList.appendChild(empty);
    return;
  }

  drafts.forEach((draft) => {
    const card = document.createElement("div");
    card.className = "draft-card";
    card.innerHTML = `
      <strong>${draft.id}</strong>
      <span>${draft.formId}</span>
      <span class="status-pill ${draft.status === "completed" ? "status-good" : "status-warn"}">
        ${draft.status}
      </span>
    `;
    draftList.appendChild(card);
  });
};

const renderPreview = () => {
  previewContent.innerHTML = "";
  const activeClient = clients.find((client) => client.id === selectedClientId);
  if (!activeClient) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Select a client to preview their N-400 data.";
    previewContent.appendChild(empty);
    return;
  }

  formSchema.forEach((field) => {
    const row = document.createElement("div");
    row.className = "preview-row";
    const normalized = getNormalizedClient(activeClient);
    const value = normalized[field.key] || "";
    row.innerHTML = `
      <span>${field.label}</span>
      <div class="${value ? "" : "preview-missing"}">${value || "Missing"}</div>
    `;
    previewContent.appendChild(row);
  });
};

const updateLinkBox = (link) => {
  linkBox.innerHTML = "";
  if (!link) {
    linkBox.innerHTML = `<p class="helper-text">No link generated yet.</p>`;
    return;
  }
  const field = document.createElement("div");
  field.className = "link-field";
  field.textContent = link;
  const copyBtn = document.createElement("button");
  copyBtn.className = "btn btn-ghost";
  copyBtn.type = "button";
  copyBtn.textContent = "Copy link";
  copyBtn.addEventListener("click", () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link);
    }
  });
  linkBox.appendChild(field);
  linkBox.appendChild(copyBtn);
};

formSelect.value = getSelectedForm();
formSelect.addEventListener("change", (event) => {
  setSelectedForm(event.target.value);
});

intakeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(intakeForm);
  const client = buildClientFromForm(formData);
  clients = [client, ...clients];
  selectedClientId = client.id;
  saveClients(clients);
  intakeForm.reset();
  renderClients();
  renderPreview();
});

clearFormBtn.addEventListener("click", () => {
  intakeForm.reset();
});

sendLinkBtn.addEventListener("click", () => {
  const draftId = `DR-${Date.now().toString().slice(-6)}`;
  const draft = {
    id: draftId,
    formId: N400_FORM_ID,
    status: "sent",
    createdAt: new Date().toISOString(),
  };
  drafts = [draft, ...drafts];
  saveDrafts(drafts);
  renderDrafts();
  const link = `${window.location.origin}${window.location.pathname.replace("index.html", "")}client.html?draft=${draftId}&form=${N400_FORM_ID}`;
  updateLinkBox(link);
});

importDraftsBtn.addEventListener("click", () => {
  const completed = drafts.filter((draft) => draft.status === "completed" && !draft.importedAt);
  if (completed.length === 0) {
    window.alert("No completed intakes to import yet.");
    return;
  }
  completed.forEach((draft) => {
    const client = {
      ...draft.data,
      id: `CL-${Date.now().toString().slice(-6)}-${draft.id}`,
      formId: draft.formId,
      source: "client",
    };
    clients.unshift(client);
    draft.importedAt = new Date().toISOString();
  });
  saveClients(clients);
  saveDrafts(drafts);
  renderClients();
  renderDrafts();
});

downloadPreviewBtn.addEventListener("click", async () => {
  const activeClient = clients.find((client) => client.id === selectedClientId);
  if (!activeClient) {
    window.alert("Select a client to download N-400.");
    return;
  }
  const pdfDoc = await createN400Doc(activeClient);
  if (!pdfDoc) {
    return;
  }
  await downloadPdfDoc({ pdfDoc, fileName: `${activeClient.id}-N-400.pdf` });
});

renderClients();
renderDrafts();
renderPreview();
