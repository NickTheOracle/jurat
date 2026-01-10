const initApp = () => {
  const jsStatus = document.querySelector("#js-status");
  const setJsStatus = (text) => {
    if (jsStatus) {
      jsStatus.textContent = text;
    }
  };
  try {
    if (window.__juratSharedError) {
      setJsStatus("JS status: shared.js error");
      console.error("JuratShared init error.");
      return;
    }
    if (!window.JuratShared) {
      if (!window.__juratSharedReloaded) {
        window.__juratSharedReloaded = true;
        setJsStatus("JS status: loading shared.js...");
        const script = document.createElement("script");
        script.src = "./shared.js?reload=" + Date.now();
        script.onload = () => {
          setJsStatus("JS status: shared.js loaded");
          initApp();
        };
        script.onerror = () => {
          setJsStatus("JS status: failed to load shared.js");
        };
        document.head.appendChild(script);
        return;
      }
      setJsStatus("JS status: shared.js missing");
      console.error("JuratShared not found.");
      return;
    }
    setJsStatus("JS status: ready");
  const formSelect = document.querySelector("#form-select");
  const intakeForm = document.querySelector("#intake-form");
  const clearFormBtn = document.querySelector("#clear-form-btn");
  const loadSampleBtn = document.querySelector("#load-sample-btn");
  const editClientId = document.querySelector("#edit-client-id");
  const saveIntakeBtn = document.querySelector("#save-intake-btn");
  const sendLinkBtn = document.querySelector("#send-link-btn");
  const linkBox = document.querySelector("#link-box");
  const importDraftsBtn = document.querySelector("#import-drafts-btn");
  const exportIntakesBtn = document.querySelector("#export-intakes-btn");
  const importIntakesBtn = document.querySelector("#import-intakes-btn");
  const importIntakesFile = document.querySelector("#import-intakes-file");
  const exportDraftsBtn = document.querySelector("#export-drafts-btn");
  const importDraftsFileBtn = document.querySelector("#import-drafts-file-btn");
  const importDraftsFile = document.querySelector("#import-drafts-file");
  const exportAllBtn = document.querySelector("#export-all-btn");
  const draftList = document.querySelector("#draft-list");
  const clientList = document.querySelector("#client-list");
  const previewContent = document.querySelector("#preview-content");
  const downloadPreviewBtn = document.querySelector("#download-preview-btn");
  const openPreviewBtn = document.querySelector("#open-preview-btn");
  const statusLog = document.querySelector("#status-log");
  const progressBar = document.querySelector("#progress-bar");
  const progressLabel = document.querySelector("#progress-label");
  const runDiagnosticsBtn = document.querySelector("#run-diagnostics-btn");
  const downloadTemplateBtn = document.querySelector("#download-template-btn");
  const serviceUrlInput = document.querySelector("#service-url");
  const saveServiceBtn = document.querySelector("#save-service-btn");

  if (!intakeForm || !clientList || !statusLog) {
    console.error("Jurat UI not fully loaded.");
    return;
  }

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
  fetchN400Template,
  createN400Doc,
  getPdfServiceUrl,
  setPdfServiceUrl,
  requestN400Pdf,
  downloadPdfDoc,
  downloadPdfBytes,
  openPdfDoc,
} = JuratShared;

const formSchema = [
  { key: "fullName", label: "Applicant full legal name" },
  { key: "alienNumber", label: "A-number" },
  { key: "uscisAccountNumber", label: "USCIS online account number" },
  { key: "dateOfBirth", label: "Date of birth" },
  { key: "dateBecamePermanentResident", label: "Date became permanent resident" },
  { key: "ssn", label: "Social Security Number" },
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
  { key: "gender", label: "Gender" },
  { key: "heightFeet", label: "Height (ft)" },
  { key: "heightInches", label: "Height (in)" },
  { key: "weight", label: "Weight (lbs)" },
  { key: "eyeColor", label: "Eye color" },
  { key: "hairColor", label: "Hair color" },
  { key: "maritalStatus", label: "Marital status" },
  { key: "spouseName", label: "Spouse full legal name" },
  { key: "occupation", label: "Occupation" },
  { key: "employer", label: "Employer" },
  { key: "tripsCount", label: "Trips outside the U.S. (5 years)" },
  { key: "tripsDays", label: "Total days outside the U.S." },
  { key: "notes", label: "Notes for attorney" },
];

let clients = loadClients();
let drafts = loadDrafts();
let selectedClientId = clients[0]?.id || null;

const logStatus = (message, type = "info", linkUrl = "") => {
  const item = document.createElement("div");
  item.className = "status-item";
  const linkMarkup = linkUrl
    ? ` · <a class="status-link" href="${linkUrl}" target="_blank" rel="noopener">Open PDF</a>`
    : "";
  item.innerHTML = `
    <div>
      <strong>${type.toUpperCase()}</strong>
      <span> · ${message}${linkMarkup}</span>
    </div>
  `;
  statusLog.prepend(item);
};

const setProgress = (value, label) => {
  const clamped = Math.min(100, Math.max(0, value));
  progressBar.style.width = `${clamped}%`;
  progressLabel.textContent = label;
};

const resetProgress = () => {
  setProgress(0, "Waiting for a download.");
};

const loadServiceUrl = () => {
  serviceUrlInput.value = getPdfServiceUrl();
};

const saveServiceUrl = () => {
  const url = serviceUrlInput.value.trim();
  setPdfServiceUrl(url);
  logStatus(url ? "PDF service URL saved." : "PDF service URL cleared.", "info");
};

const downloadViaService = async (client, fileName) => {
  setProgress(20, "Requesting server PDF...");
  const result = await requestN400Pdf(client);
  if (!result.ok) {
    logStatus(
      `Server PDF failed${result.status ? ` (HTTP ${result.status})` : ""}.`,
      "error"
    );
    setProgress(0, "Server PDF failed.");
    return null;
  }
  setProgress(70, "Downloading from server...");
  const url = await downloadPdfBytes({ bytes: result.bytes, fileName });
  setProgress(100, "Download started.");
  return url;
};

const downloadTemplate = async () => {
  setProgress(10, "Downloading raw N-400...");
  const templateBytes = await checkN400Template();
  if (!templateBytes) {
    return;
  }
  const blob = new Blob([templateBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "N-400-template.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  setProgress(100, "Template download started.");
};

const runDiagnostics = async () => {
  logStatus("Running PDF diagnostics...", "info");
  setProgress(10, "Checking PDF library...");
  if (!window.PDFLib) {
    logStatus("PDF library missing on page.", "error");
    setProgress(0, "PDF library missing.");
    return;
  }
  setProgress(30, "Fetching N-400 template...");
  const templateBytes = await checkN400Template();
  if (!templateBytes) {
    return;
  }
  logStatus(`Template size: ${templateBytes.byteLength} bytes.`, "success");
  setProgress(60, "Parsing PDF...");
  try {
    const pdfDoc = await window.PDFLib.PDFDocument.load(templateBytes, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    logStatus(`PDF parsed (${pageCount} pages).`, "success");
    setProgress(80, "Opening preview tab...");
    const blob = new Blob([templateBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, "_blank", "noopener");
    if (!opened) {
      logStatus("Preview blocked by browser popup settings.", "error");
      setProgress(0, "Preview blocked.");
      return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setProgress(100, "Diagnostics complete.");
  } catch (error) {
    console.warn("PDF parse failed.", error);
    logStatus("Unable to parse PDF template (likely XFA format).", "error");
    setProgress(0, "PDF parse failed.");
  }
};

const checkN400Template = async () => {
  const templateResult = await fetchN400Template();
  if (!templateResult.ok) {
    const statusLabel = templateResult.status ? `HTTP ${templateResult.status}` : "Network error";
    const templateUrl = `${window.location.origin}/forms/N-400.pdf`;
    logStatus(`N-400 template unavailable (${statusLabel}).`, "error", templateUrl);
    setProgress(0, "Template unavailable.");
    return null;
  }
  logStatus("N-400 template loaded.", "success");
  return templateResult.bytes;
};

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
    dateBecamePermanentResident: formData.get("dateBecamePermanentResident"),
    ssn: formData.get("ssn"),
    countryOfBirth: formData.get("countryOfBirth"),
    citizenship: formData.get("citizenship"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    gender: formData.get("gender"),
    heightFeet: formData.get("heightFeet"),
    heightInches: formData.get("heightInches"),
    weight: formData.get("weight"),
    eyeColor: formData.get("eyeColor"),
    hairColor: formData.get("hairColor"),
    maritalStatus: formData.get("maritalStatus"),
    spouseName: formData.get("spouseName"),
    occupation: formData.get("occupation"),
    employer: formData.get("employer"),
    address,
    addressLine1,
    addressLine2: formData.get("addressLine2"),
    city,
    state,
    zipCode,
    country: formData.get("country"),
    tripsCount: formData.get("tripsCount"),
    tripsDays: formData.get("tripsDays"),
    notes: formData.get("notes"),
    createdAt: new Date().toISOString(),
  };
};

const buildClientFromFormWithId = (formData, id, createdAt) => {
  const client = buildClientFromForm(formData);
  return {
    ...client,
    id,
    createdAt,
    updatedAt: new Date().toISOString(),
  };
};

const fillForm = (values) => {
  Object.entries(values).forEach(([key, value]) => {
    const field = intakeForm.querySelector(`[name="${key}"]`);
    if (!field) {
      return;
    }
    field.value = value;
  });
};

const setEditMode = (client) => {
  if (!client) {
    editClientId.value = "";
    saveIntakeBtn.textContent = "Save intake";
    return;
  }
  editClientId.value = client.id;
  saveIntakeBtn.textContent = "Update intake";
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
      <div class="card-actions">
        <button class="btn btn-primary" type="button" data-action="download">Download N-400 (PDF)</button>
        <button class="btn btn-ghost" type="button" data-action="edit">Edit</button>
        <button class="btn btn-muted" type="button" data-action="delete">Delete</button>
      </div>
    `;
    const downloadBtn = card.querySelector('[data-action="download"]');
    const editBtn = card.querySelector('[data-action="edit"]');
    const deleteBtn = card.querySelector('[data-action="delete"]');
    downloadBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      setProgress(10, "Loading N-400 template...");
      logStatus(`Generating N-400 for ${normalized.fullName}`, "info");
      const serviceUrl = getPdfServiceUrl();
      let url = null;
      if (serviceUrl) {
        url = await downloadViaService(client, `${client.id}-N-400.pdf`);
      } else {
        const templateBytes = await checkN400Template();
        if (!templateBytes) {
          return;
        }
        const pdfDoc = await createN400Doc(client, templateBytes);
        if (!pdfDoc) {
          logStatus(`Failed to generate N-400 for ${normalized.fullName}`, "error");
          setProgress(0, "Download failed.");
          return;
        }
        setProgress(60, "Preparing PDF...");
        url = await downloadPdfDoc({ pdfDoc, fileName: `${client.id}-N-400.pdf` });
        setProgress(100, "Download started.");
      }
      if (url) {
        logStatus(`Downloaded N-400 for ${normalized.fullName}`, "success", url);
      }
    });
    editBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      fillForm(getNormalizedClient(client));
      setEditMode(client);
      selectedClientId = client.id;
      renderPreview();
      intakeForm.scrollIntoView({ behavior: "smooth" });
    });
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!window.confirm(`Delete intake for ${normalized.fullName}?`)) {
        return;
      }
      clients = clients.filter((item) => item.id !== client.id);
      saveClients(clients);
      if (selectedClientId === client.id) {
        selectedClientId = clients[0]?.id || null;
      }
      renderClients();
      renderPreview();
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

const exportIntakes = () => {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    clients,
  };
  const dataStr = `data:application/json,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
  const link = document.createElement("a");
  link.href = dataStr;
  link.download = `jurat-intakes-${Date.now()}.json`;
  link.click();
};

const exportDrafts = () => {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    drafts,
  };
  const dataStr = `data:application/json,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
  const link = document.createElement("a");
  link.href = dataStr;
  link.download = `jurat-drafts-${Date.now()}.json`;
  link.click();
};

const exportAll = () => {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    clients,
    drafts,
  };
  const dataStr = `data:application/json,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
  const link = document.createElement("a");
  link.href = dataStr;
  link.download = `jurat-export-${Date.now()}.json`;
  link.click();
};

const importIntakes = async (file) => {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.clients)) {
    window.alert("Invalid intake file.");
    return;
  }
  clients = [...parsed.clients, ...clients];
  saveClients(clients);
  renderClients();
  renderPreview();
  logStatus(`Imported ${parsed.clients.length} intakes.`, "success");
};

const importDrafts = async (file) => {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.drafts)) {
    window.alert("Invalid drafts file.");
    return;
  }
  drafts = [...parsed.drafts, ...drafts];
  saveDrafts(drafts);
  renderDrafts();
  logStatus(`Imported ${parsed.drafts.length} drafts.`, "success");
};

formSelect.value = getSelectedForm();
formSelect.addEventListener("change", (event) => {
  setSelectedForm(event.target.value);
});

intakeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(intakeForm);
  const existingId = editClientId.value;
  if (existingId) {
    const existing = clients.find((client) => client.id === existingId);
    const updated = buildClientFromFormWithId(
      formData,
      existingId,
      existing?.createdAt || new Date().toISOString()
    );
    clients = clients.map((client) => (client.id === existingId ? updated : client));
    selectedClientId = existingId;
    setEditMode(null);
  } else {
    const client = buildClientFromForm(formData);
    clients = [client, ...clients];
    selectedClientId = client.id;
  }
  saveClients(clients);
  intakeForm.reset();
  renderClients();
  renderPreview();
});

clearFormBtn.addEventListener("click", () => {
  intakeForm.reset();
  setEditMode(null);
});

  loadSampleBtn.addEventListener("click", () => {
    logStatus("Sample intake button clicked.", "info");
    const sample = {
    firstName: "Valeria",
    middleName: "Isabel",
    lastName: "Gomez",
    preferredName: "Val",
    alienNumber: "A208945671",
    uscisAccountNumber: "1100-2233-4455",
    dateOfBirth: "1992-03-11",
    dateBecamePermanentResident: "2018-06-22",
    ssn: "123-45-6789",
    countryOfBirth: "Colombia",
    citizenship: "Colombia",
    email: "valeria.gomez@email.com",
    phone: "(312) 555-0148",
    gender: "female",
    heightFeet: "5",
    heightInches: "4",
    weight: "132",
    eyeColor: "Brown",
    hairColor: "Black",
    maritalStatus: "married",
    spouseName: "Diego Gomez",
    occupation: "Accountant",
    employer: "Brightline LLC",
    addressLine1: "4100 W Irving Park Rd",
    addressLine2: "Apt 12C",
    city: "Chicago",
    state: "IL",
    zipCode: "60641",
    country: "United States",
    tripsCount: "2",
    tripsDays: "18",
    notes: "Requested name update after marriage.",
  };
  fillForm(sample);
  setEditMode(null);
  const formData = new FormData(intakeForm);
  const client = buildClientFromForm(formData);
  clients = [client, ...clients];
  selectedClientId = client.id;
  saveClients(clients);
  renderClients();
  renderPreview();
  logStatus("Sample intake created.", "success");
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

exportIntakesBtn.addEventListener("click", () => {
  if (clients.length === 0) {
    window.alert("No intakes to export yet.");
    return;
  }
  exportIntakes();
});

importIntakesBtn.addEventListener("click", () => {
  importIntakesFile.click();
});

importIntakesFile.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  try {
    await importIntakes(file);
  } catch (error) {
    console.warn("Failed to import intakes.", error);
    window.alert("Unable to import the intake file.");
  } finally {
    importIntakesFile.value = "";
  }
});

exportDraftsBtn.addEventListener("click", () => {
  if (drafts.length === 0) {
    window.alert("No drafts to export yet.");
    return;
  }
  exportDrafts();
});

exportAllBtn.addEventListener("click", () => {
  if (clients.length === 0 && drafts.length === 0) {
    window.alert("No intakes or drafts to export yet.");
    return;
  }
  exportAll();
});

importDraftsFileBtn.addEventListener("click", () => {
  importDraftsFile.click();
});

importDraftsFile.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  try {
    await importDrafts(file);
  } catch (error) {
    console.warn("Failed to import drafts.", error);
    window.alert("Unable to import the drafts file.");
  } finally {
    importDraftsFile.value = "";
  }
});

downloadPreviewBtn.addEventListener("click", async () => {
  const activeClient = clients.find((client) => client.id === selectedClientId);
  if (!activeClient) {
    window.alert("Select a client to download N-400.");
    return;
  }
  const normalized = getNormalizedClient(activeClient);
  setProgress(10, "Loading N-400 template...");
  logStatus(`Generating N-400 for ${normalized.fullName}`, "info");
  const serviceUrl = getPdfServiceUrl();
  let url = null;
  if (serviceUrl) {
    url = await downloadViaService(activeClient, `${activeClient.id}-N-400.pdf`);
  } else {
    const templateBytes = await checkN400Template();
    if (!templateBytes) {
      return;
    }
    const pdfDoc = await createN400Doc(activeClient, templateBytes);
    if (!pdfDoc) {
      logStatus(`Failed to generate N-400 for ${normalized.fullName}`, "error");
      setProgress(0, "Download failed.");
      return;
    }
    setProgress(60, "Preparing PDF...");
    url = await downloadPdfDoc({ pdfDoc, fileName: `${activeClient.id}-N-400.pdf` });
    setProgress(100, "Download started.");
  }
  if (url) {
    logStatus(`Downloaded N-400 for ${normalized.fullName}`, "success", url);
  }
});

openPreviewBtn.addEventListener("click", async () => {
  const activeClient = clients.find((client) => client.id === selectedClientId);
  if (!activeClient) {
    window.alert("Select a client to preview N-400.");
    return;
  }
  const normalized = getNormalizedClient(activeClient);
  logStatus(`Opening preview for ${normalized.fullName}`, "info");
  const serviceUrl = getPdfServiceUrl();
  if (serviceUrl) {
    const result = await requestN400Pdf(activeClient);
    if (!result.ok) {
      logStatus(
        `Server PDF failed${result.status ? ` (HTTP ${result.status})` : ""}.`,
        "error"
      );
      setProgress(0, "Server PDF failed.");
      return;
    }
    setProgress(70, "Opening server PDF...");
    const url = await downloadPdfBytes({ bytes: result.bytes, fileName: `${activeClient.id}-N-400.pdf` });
    window.open(url, "_blank", "noopener");
    setProgress(100, "Preview opened.");
    return;
  }
  const templateBytes = await checkN400Template();
  if (!templateBytes) {
    return;
  }
  const pdfDoc = await createN400Doc(activeClient, templateBytes);
  if (!pdfDoc) {
    logStatus(`Failed to open preview for ${normalized.fullName}`, "error");
    return;
  }
  setProgress(40, "Opening PDF preview...");
  const opened = await openPdfDoc({ pdfDoc });
  if (opened) {
    logStatus(`Preview opened for ${normalized.fullName}`, "success");
    setProgress(100, "Preview opened.");
  } else {
    logStatus(`Preview blocked by browser for ${normalized.fullName}`, "error");
    setProgress(0, "Preview blocked.");
  }
});

renderClients();
renderDrafts();
renderPreview();
resetProgress();
loadServiceUrl();
if (!loadSampleBtn) {
  console.error("Load sample button not found.");
  logStatus("Sample button missing from page.", "error");
} else {
  logStatus("Sample button ready.", "info");
}

  runDiagnosticsBtn?.addEventListener("click", runDiagnostics);
  downloadTemplateBtn?.addEventListener("click", downloadTemplate);
  saveServiceBtn?.addEventListener("click", saveServiceUrl);
  } catch (error) {
    console.error("Init error:", error);
    setJsStatus("JS status: error");
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
