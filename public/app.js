const intakeForm = document.querySelector("#intake-form");
const clientList = document.querySelector("#client-list");
const formsGrid = document.querySelector("#forms-grid");
const statusList = document.querySelector("#status-list");
const previewContent = document.querySelector("#preview-content");
const previewFormSelect = document.querySelector("#preview-form-select");
const clearFormBtn = document.querySelector("#clear-form-btn");
const newClientBtn = document.querySelector("#new-client-btn");
const shareLinkBtn = document.querySelector("#share-link-btn");
const generatePacketBtn = document.querySelector("#generate-packet-btn");
const downloadSelectedBtn = document.querySelector("#download-selected-btn");
const downloadPreviewBtn = document.querySelector("#download-preview-btn");
const exportJsonBtn = document.querySelector("#export-json-btn");
const loadDemoBtn = document.querySelector("#load-demo-btn");

const STORAGE_KEY = "jurat.clients";
const SELECTED_FORMS_KEY = "jurat.selectedForms";
const SELECTION_PREF_KEY = "jurat.hasSelection";
const PREVIEW_FORM_KEY = "jurat.previewForm";

const clients = [];
const selectedForms = new Set();
let hasSelectionPreference = false;

const N400_FORM_ID = "N-400";
const N400_PDF_PATH = "./forms/N-400.pdf";

const uscisForms = [
  {
    id: "I-130",
    title: "Petition for Alien Relative",
    description: "Family-based sponsorship intake to filing.",
    coverage: 0.86,
  },
  {
    id: "I-485",
    title: "Application to Register Permanent Residence",
    description: "Adjustment of status with background checks.",
    coverage: 0.78,
  },
  {
    id: N400_FORM_ID,
    title: "Application for Naturalization",
    description: "Citizenship eligibility and history (official PDF supported).",
    coverage: 0.64,
  },
  {
    id: "I-765",
    title: "Employment Authorization",
    description: "Work permit requests and renewals.",
    coverage: 0.9,
  },
];

const formSchemas = {
  "I-130": [
    { key: "fullName", label: "Petitioner full legal name" },
    { key: "dateOfBirth", label: "Petitioner date of birth" },
    { key: "citizenship", label: "Country of citizenship" },
    { key: "addressLine1", label: "Current address" },
    { key: "email", label: "Email address" },
  ],
  "I-485": [
    { key: "fullName", label: "Applicant full legal name" },
    { key: "dateOfBirth", label: "Applicant date of birth" },
    { key: "citizenship", label: "Country of citizenship" },
    { key: "addressLine1", label: "Physical address" },
    { key: "phone", label: "Phone number" },
  ],
  "N-400": [
    { key: "fullName", label: "Applicant full legal name" },
    { key: "dateOfBirth", label: "Date of birth" },
    { key: "countryOfBirth", label: "Country of birth" },
    { key: "citizenship", label: "Country of citizenship" },
    { key: "alienNumber", label: "A-number" },
    { key: "uscisAccountNumber", label: "USCIS online account number" },
    { key: "addressLine1", label: "Street address" },
    { key: "addressLine2", label: "Apartment / suite" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "zipCode", label: "ZIP code" },
    { key: "country", label: "Country" },
    { key: "email", label: "Email address" },
    { key: "phone", label: "Phone number" },
  ],
  "I-765": [
    { key: "fullName", label: "Applicant full legal name" },
    { key: "dateOfBirth", label: "Date of birth" },
    { key: "addressLine1", label: "Mailing address" },
    { key: "email", label: "Email address" },
    { key: "phone", label: "Phone number" },
  ],
};

let selectedClientId = null;

const saveClients = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
};

const loadClients = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return;
  }
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      clients.push(...parsed);
      if (clients.length > 0) {
        selectedClientId = clients[0].id;
      }
    }
  } catch (error) {
    console.warn("Unable to load stored clients.", error);
  }
};

const saveSelectedForms = () => {
  localStorage.setItem(SELECTED_FORMS_KEY, JSON.stringify([...selectedForms]));
};

const loadSelectedForms = () => {
  const stored = localStorage.getItem(SELECTED_FORMS_KEY);
  const hasPreference = localStorage.getItem(SELECTION_PREF_KEY);
  hasSelectionPreference = hasPreference === "true";
  if (!stored) {
    return;
  }
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      parsed.forEach((formId) => selectedForms.add(formId));
    }
  } catch (error) {
    console.warn("Unable to load selected forms.", error);
  }
};

const saveSelectionPreference = () => {
  localStorage.setItem(SELECTION_PREF_KEY, String(hasSelectionPreference));
};

const savePreviewForm = (formId) => {
  localStorage.setItem(PREVIEW_FORM_KEY, formId);
};

const loadPreviewForm = () => {
  return localStorage.getItem(PREVIEW_FORM_KEY);
};

const getActiveClient = () => clients.find((client) => client.id === selectedClientId);

const splitName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", middleName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: "", lastName: "" };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], middleName: "", lastName: parts[1] };
  }
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
};

const buildFullName = ({ firstName = "", middleName = "", lastName = "" }) => {
  return [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
};

const formatDate = (dateValue) => {
  if (!dateValue) {
    return "";
  }
  if (dateValue.includes("/")) {
    return dateValue;
  }
  const [year, month, day] = dateValue.split("-");
  if (!year || !month || !day) {
    return dateValue;
  }
  return `${month}/${day}/${year}`;
};

const parseStreetAddress = (addressLine1 = "") => {
  const match = addressLine1.trim().match(/^(\d+)\s+(.*)$/);
  if (!match) {
    return { number: "", street: addressLine1.trim() };
  }
  return { number: match[1], street: match[2] };
};

const parseAddressFallback = (address = "") => {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return {};
  }
  const [line1, city, stateZip, country] = parts;
  let state = "";
  let zipCode = "";
  if (stateZip) {
    const stateZipParts = stateZip.split(/\s+/).filter(Boolean);
    state = stateZipParts[0] || "";
    zipCode = stateZipParts[1] || "";
  }
  return {
    addressLine1: line1 || "",
    city: city || "",
    state,
    zipCode,
    country: country || "",
  };
};

const getNormalizedClient = (client) => {
  const nameParts = client.firstName || client.lastName ? {
    firstName: client.firstName || "",
    middleName: client.middleName || "",
    lastName: client.lastName || "",
  } : splitName(client.fullName || "");
  const fullName = client.fullName || buildFullName(nameParts);
  const addressFallback = client.address && !client.addressLine1 ? parseAddressFallback(client.address) : {};
  const addressLine1 = client.addressLine1 || addressFallback.addressLine1 || "";
  const addressLine2 = client.addressLine2 || "";
  const city = client.city || addressFallback.city || "";
  const state = client.state || addressFallback.state || "";
  const zipCode = client.zipCode || addressFallback.zipCode || "";
  const country = client.country || addressFallback.country || "";
  const { number, street } = parseStreetAddress(addressLine1);

  return {
    ...client,
    firstName: nameParts.firstName,
    middleName: nameParts.middleName,
    lastName: nameParts.lastName,
    fullName,
    dateOfBirth: client.dateOfBirth || "",
    formattedDateOfBirth: formatDate(client.dateOfBirth),
    countryOfBirth: client.countryOfBirth || "",
    citizenship: client.citizenship || "",
    alienNumber: client.alienNumber || "",
    uscisAccountNumber: client.uscisAccountNumber || "",
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
    country,
    addressNumber: number,
    addressStreet: street,
  };
};

const getPreviewValue = (client, key) => {
  const normalized = getNormalizedClient(client);
  return normalized[key] || "";
};

const renderClients = () => {
  clientList.innerHTML = "";

  if (clients.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No clients yet. Add one from the intake form or load demo data.";
    clientList.appendChild(empty);
    return;
  }

  clients.forEach((client) => {
    const normalized = getNormalizedClient(client);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "client-card";
    if (client.id === selectedClientId) {
      card.style.borderColor = "#e07a5f";
      card.style.boxShadow = "0 10px 20px rgba(224, 122, 95, 0.15)";
    }
    card.innerHTML = `
      <h3>${normalized.fullName}</h3>
      <div class="client-meta">${client.id} · ${normalized.citizenship || "Citizenship pending"}</div>
      <div class="client-meta">${client.email}</div>
      <div class="client-badges">
        <span class="badge">${(client.caseType || "case pending").replace("-", " ")}</span>
        <span class="badge">Last updated today</span>
      </div>
    `;
    card.addEventListener("click", () => {
      selectedClientId = client.id;
      renderClients();
      renderStatus();
      renderPreview();
    });
    clientList.appendChild(card);
  });
};

const renderForms = () => {
  formsGrid.innerHTML = "";
  uscisForms.forEach((form) => {
    const card = document.createElement("div");
    card.className = "form-card";
    const checkboxId = `form-${form.id}`;
    card.innerHTML = `
      <h4>${form.id}</h4>
      <p>${form.title}</p>
      <label class="client-meta">
        <input type="checkbox" id="${checkboxId}" data-form-id="${form.id}" />
        Auto-map intake fields
      </label>
      <p>${form.description}</p>
    `;
    const checkbox = card.querySelector("input");
    checkbox.checked = !hasSelectionPreference || selectedForms.has(form.id);
    checkbox.addEventListener("change", (event) => {
      const formId = event.target.dataset.formId;
      if (event.target.checked) {
        selectedForms.add(formId);
      } else {
        selectedForms.delete(formId);
      }
      hasSelectionPreference = true;
      saveSelectedForms();
      saveSelectionPreference();
    });
    formsGrid.appendChild(card);
  });
};

const renderPreviewSelect = () => {
  previewFormSelect.innerHTML = "";
  uscisForms.forEach((form) => {
    const option = document.createElement("option");
    option.value = form.id;
    option.textContent = `${form.id} — ${form.title}`;
    previewFormSelect.appendChild(option);
  });
  const stored = loadPreviewForm();
  if (stored && uscisForms.some((form) => form.id === stored)) {
    previewFormSelect.value = stored;
  }
};

const renderPreview = () => {
  const activeClient = getActiveClient();
  previewContent.innerHTML = "";

  if (!activeClient) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Select a client to preview USCIS form data.";
    previewContent.appendChild(empty);
    return;
  }

  const formId = previewFormSelect.value;
  const schema = formSchemas[formId] || [];
  schema.forEach((field) => {
    const row = document.createElement("div");
    row.className = "preview-row";
    const value = getPreviewValue(activeClient, field.key);
    row.innerHTML = `
      <span>${field.label}</span>
      <div class="${value ? "" : "preview-missing"}">${value || "Missing"}</div>
    `;
    previewContent.appendChild(row);
  });
};

const renderStatus = () => {
  const activeClient = getActiveClient();
  statusList.innerHTML = "";

  if (!activeClient) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No automation status yet. Select a client.";
    statusList.appendChild(empty);
    return;
  }

  uscisForms.forEach((form) => {
    const coverage = Math.round(form.coverage * 100);
    const item = document.createElement("div");
    const normalized = getNormalizedClient(activeClient);
    item.className = "status-item";
    item.innerHTML = `
      <div>
        <strong>${form.id}</strong>
        <span> · ${normalized.fullName}</span>
      </div>
      <span class="status-pill ${coverage >= 80 ? "status-good" : "status-warn"}">
        ${coverage}% mapped
      </span>
    `;
    statusList.appendChild(item);
  });
};

const getSelectedFormIds = () => {
  if (!hasSelectionPreference) {
    return uscisForms.map((form) => form.id);
  }
  return uscisForms.filter((form) => selectedForms.has(form.id)).map((form) => form.id);
};

const buildFormPage = async ({ pdfDoc, form, formId, client }) => {
  const { StandardFonts, rgb } = PDFLib;
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const titleY = 752;

  page.drawText(`USCIS ${formId}`, {
    x: 48,
    y: titleY,
    size: 20,
    font: bold,
    color: rgb(0.12, 0.12, 0.12),
  });
  page.drawText("Generated by Jurat (fillable prototype)", {
    x: 48,
    y: titleY - 22,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  const schema = formSchemas[formId] || [];
  const normalized = getNormalizedClient(client);
  let cursorY = titleY - 60;
  const fieldHeight = 20;
  const gap = 18;

  schema.forEach((field, index) => {
    page.drawText(field.label, {
      x: 48,
      y: cursorY + 4,
      size: 11,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });
    const textField = form.createTextField(`${formId}-${index}`);
    textField.setText(normalized[field.key] || "");
    textField.addToPage(page, {
      x: 280,
      y: cursorY,
      width: 280,
      height: fieldHeight,
      textColor: rgb(0, 0, 0),
      borderColor: rgb(0.8, 0.76, 0.7),
      backgroundColor: rgb(1, 1, 1),
      font,
    });
    cursorY -= gap + fieldHeight;
  });
};

const createPlaceholderDoc = async ({ formIds, client }) => {
  const pdfDoc = await PDFLib.PDFDocument.create();
  const form = pdfDoc.getForm();

  for (const formId of formIds) {
    await buildFormPage({ pdfDoc, form, formId, client });
  }

  return pdfDoc;
};

const setTextField = (form, name, value) => {
  try {
    const field = form.getTextField(name);
    field.setText(value || "");
  } catch (error) {
    return;
  }
};

const setTextFieldsByMatch = (form, matchFn, value) => {
  form.getFields().forEach((field) => {
    const name = field.getName();
    if (!matchFn(name)) {
      return;
    }
    if (typeof field.setText === "function") {
      field.setText(value || "");
    }
  });
};

const createN400Doc = async (client) => {
  if (!window.PDFLib) {
    window.alert("PDF library not loaded yet. Please refresh and try again.");
    return null;
  }
  const response = await fetch(N400_PDF_PATH);
  const existingPdfBytes = await response.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
  const form = pdfDoc.getForm();
  const normalized = getNormalizedClient(client);

  setTextFieldsByMatch(form, (name) => name.includes("Line1_AlienNumber"), normalized.alienNumber);
  setTextField(form, "form1[0].#subform[1].P2_Line6_USCISELISAcctNumber[0]", normalized.uscisAccountNumber);
  setTextField(form, "form1[0].#subform[1].Part2Line3_FamilyName[0]", normalized.lastName);
  setTextField(form, "form1[0].#subform[1].Part2Line4a_GivenName[0]", normalized.firstName);
  setTextField(form, "form1[0].#subform[1].Part2Line4a_MiddleName[0]", normalized.middleName);
  setTextField(form, "form1[0].#subform[1].P2_Line8_DateOfBirth[0]", normalized.formattedDateOfBirth);
  setTextField(form, "form1[0].#subform[1].P2_Line10_CountryOfBirth[0]", normalized.countryOfBirth);
  setTextField(form, "form1[0].#subform[1].P2_Line11_CountryOfNationality[0]", normalized.citizenship);
  setTextField(form, "form1[0].#subform[2].P4_Line1_Number[0]", normalized.addressNumber);
  setTextField(form, "form1[0].#subform[2].P4_Line1_StreetName[0]", normalized.addressStreet);
  setTextField(form, "form1[0].#subform[2].P4_Line1_City[0]", normalized.city);
  setTextField(form, "form1[0].#subform[2].P4_Line1_State[0]", normalized.state);
  setTextField(form, "form1[0].#subform[2].P4_Line1_ZipCode[0]", normalized.zipCode);
  setTextField(form, "form1[0].#subform[2].P4_Line1_Country[0]", normalized.country);
  setTextField(form, "form1[0].#subform[10].P12_Line3_Telephone[0]", normalized.phone);
  setTextField(form, "form1[0].#subform[10].P12_Line3_Mobile[0]", normalized.phone);
  setTextField(form, "form1[0].#subform[10].P12_Line5_Email[0]", normalized.email);

  const { StandardFonts } = PDFLib;
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  form.updateFieldAppearances(font);

  return pdfDoc;
};

const downloadPdfDoc = async ({ pdfDoc, fileName }) => {
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const downloadPdf = async ({ fileName, formIds, client }) => {
  if (!window.PDFLib) {
    window.alert("PDF library not loaded yet. Please refresh and try again.");
    return;
  }
  const pdfDoc = await createPlaceholderDoc({ formIds, client });
  await downloadPdfDoc({ pdfDoc, fileName });
};

const downloadPacket = async ({ fileName, formIds, client }) => {
  if (!window.PDFLib) {
    window.alert("PDF library not loaded yet. Please refresh and try again.");
    return;
  }
  const packetDoc = await PDFLib.PDFDocument.create();
  for (const formId of formIds) {
    const formDoc =
      formId === N400_FORM_ID
        ? await createN400Doc(client)
        : await createPlaceholderDoc({ formIds: [formId], client });
    if (!formDoc) {
      return;
    }
    const pages = await packetDoc.copyPages(formDoc, formDoc.getPageIndices());
    pages.forEach((page) => packetDoc.addPage(page));
  }
  await downloadPdfDoc({ pdfDoc: packetDoc, fileName });
};

intakeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(intakeForm);
  const nameParts = {
    firstName: formData.get("firstName"),
    middleName: formData.get("middleName"),
    lastName: formData.get("lastName"),
  };
  const addressLine1 = formData.get("addressLine1");
  const city = formData.get("city");
  const state = formData.get("state");
  const zipCode = formData.get("zipCode");
  const address = [addressLine1, city, state && zipCode ? `${state} ${zipCode}` : state || zipCode, formData.get("country")]
    .filter(Boolean)
    .join(", ");
  const newClient = {
    id: `CL-${1000 + clients.length + 1}`,
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
    caseType: formData.get("caseType"),
    notes: formData.get("notes"),
  };
  clients.unshift(newClient);
  selectedClientId = newClient.id;
  saveClients();
  intakeForm.reset();
  renderClients();
  renderStatus();
  renderPreview();
});

clearFormBtn.addEventListener("click", () => {
  intakeForm.reset();
});

newClientBtn.addEventListener("click", () => {
  intakeForm.scrollIntoView({ behavior: "smooth" });
});

shareLinkBtn.addEventListener("click", () => {
  window.alert("Share this secure intake link: https://jurat.example/intake/CL-XXXX");
});

exportJsonBtn.addEventListener("click", () => {
  const activeClient = getActiveClient();
  if (!activeClient) {
    window.alert("Select a client to export.");
    return;
  }
  const payload = {
    client: activeClient,
    forms: uscisForms.map((form) => form.id),
    generatedAt: new Date().toISOString(),
  };
  const dataStr = `data:application/json,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
  const link = document.createElement("a");
  link.href = dataStr;
  link.download = `${activeClient.id}-intake.json`;
  link.click();
});

loadDemoBtn.addEventListener("click", () => {
  if (clients.length > 0) {
    return;
  }
  clients.push(
    {
      id: "CL-1032",
      firstName: "Ana",
      middleName: "",
      lastName: "Gutierrez",
      fullName: "Ana Gutierrez",
      preferredName: "Ana",
      alienNumber: "A123456789",
      uscisAccountNumber: "1234-5678-9012",
      dateOfBirth: "1989-05-17",
      countryOfBirth: "El Salvador",
      citizenship: "El Salvador",
      email: "ana.gutierrez@email.com",
      phone: "(213) 555-0172",
      address: "215 Grand Ave, Los Angeles, CA 90012, United States",
      addressLine1: "215 Grand Ave",
      addressLine2: "Apt 4B",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90012",
      country: "United States",
      caseType: "family-based",
      notes: "Needs I-130 + I-485; spouse is USC.",
    },
    {
      id: "CL-1033",
      firstName: "Wei",
      middleName: "",
      lastName: "Zhang",
      fullName: "Wei Zhang",
      preferredName: "Wei",
      alienNumber: "A987654321",
      uscisAccountNumber: "9876-5432-1098",
      dateOfBirth: "1994-02-08",
      countryOfBirth: "China",
      citizenship: "China",
      email: "wei.z@email.com",
      phone: "(646) 555-0142",
      address: "77 East 10th St, New York, NY 10003, United States",
      addressLine1: "77 East 10th St",
      addressLine2: "Unit 12A",
      city: "New York",
      state: "NY",
      zipCode: "10003",
      country: "United States",
      caseType: "employment",
      notes: "H-1B extension, premium processing.",
    }
  );
  selectedClientId = clients[0].id;
  saveClients();
  renderClients();
  renderStatus();
  renderPreview();
});

previewFormSelect.addEventListener("change", () => {
  savePreviewForm(previewFormSelect.value);
  renderPreview();
});

downloadPreviewBtn.addEventListener("click", async () => {
  const activeClient = getActiveClient();
  if (!activeClient) {
    window.alert("Select a client to download a form.");
    return;
  }
  const formId = previewFormSelect.value;
  if (formId === N400_FORM_ID) {
    const pdfDoc = await createN400Doc(activeClient);
    if (!pdfDoc) {
      return;
    }
    await downloadPdfDoc({ pdfDoc, fileName: `${activeClient.id}-${formId}.pdf` });
    return;
  }
  await downloadPdf({
    fileName: `${activeClient.id}-${formId}.pdf`,
    formIds: [formId],
    client: activeClient,
  });
});

downloadSelectedBtn.addEventListener("click", async () => {
  const activeClient = getActiveClient();
  if (!activeClient) {
    window.alert("Select a client to download forms.");
    return;
  }
  const formIds = getSelectedFormIds();
  if (formIds.length === 0) {
    window.alert("Select at least one form.");
    return;
  }
  for (const formId of formIds) {
    if (formId === N400_FORM_ID) {
      const pdfDoc = await createN400Doc(activeClient);
      if (!pdfDoc) {
        return;
      }
      await downloadPdfDoc({ pdfDoc, fileName: `${activeClient.id}-${formId}.pdf` });
      continue;
    }
    await downloadPdf({
      fileName: `${activeClient.id}-${formId}.pdf`,
      formIds: [formId],
      client: activeClient,
    });
  }
});

generatePacketBtn.addEventListener("click", async () => {
  const activeClient = getActiveClient();
  if (!activeClient) {
    window.alert("Select a client to generate a packet.");
    return;
  }
  const formIds = getSelectedFormIds();
  await downloadPacket({
    fileName: `${activeClient.id}-packet.pdf`,
    formIds,
    client: activeClient,
  });
});

loadClients();
loadSelectedForms();
renderClients();
renderForms();
renderPreviewSelect();
renderStatus();
renderPreview();
