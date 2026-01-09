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
const exportJsonBtn = document.querySelector("#export-json-btn");
const loadDemoBtn = document.querySelector("#load-demo-btn");

const clients = [];

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
    id: "N-400",
    title: "Application for Naturalization",
    description: "Citizenship eligibility and history.",
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
    { key: "address", label: "Current address" },
    { key: "email", label: "Email address" },
  ],
  "I-485": [
    { key: "fullName", label: "Applicant full legal name" },
    { key: "dateOfBirth", label: "Applicant date of birth" },
    { key: "citizenship", label: "Country of citizenship" },
    { key: "address", label: "Physical address" },
    { key: "phone", label: "Phone number" },
  ],
  "N-400": [
    { key: "fullName", label: "Applicant full legal name" },
    { key: "dateOfBirth", label: "Date of birth" },
    { key: "citizenship", label: "Country of citizenship" },
    { key: "address", label: "Current address" },
    { key: "notes", label: "Notes / flags" },
  ],
  "I-765": [
    { key: "fullName", label: "Applicant full legal name" },
    { key: "dateOfBirth", label: "Date of birth" },
    { key: "address", label: "Mailing address" },
    { key: "email", label: "Email address" },
    { key: "phone", label: "Phone number" },
  ],
};

let selectedClientId = null;

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
    const card = document.createElement("button");
    card.type = "button";
    card.className = "client-card";
    if (client.id === selectedClientId) {
      card.style.borderColor = "#e07a5f";
      card.style.boxShadow = "0 10px 20px rgba(224, 122, 95, 0.15)";
    }
    card.innerHTML = `
      <h3>${client.fullName}</h3>
      <div class="client-meta">${client.id} · ${client.citizenship}</div>
      <div class="client-meta">${client.email}</div>
      <div class="client-badges">
        <span class="badge">${client.caseType.replace("-", " ")}</span>
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
        <input type="checkbox" id="${checkboxId}" checked />
        Auto-map intake fields
      </label>
      <p>${form.description}</p>
    `;
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
};

const renderPreview = () => {
  const activeClient = clients.find((client) => client.id === selectedClientId);
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
    const value = activeClient[field.key];
    row.innerHTML = `
      <span>${field.label}</span>
      <div class="${value ? "" : "preview-missing"}">${value || "Missing"}</div>
    `;
    previewContent.appendChild(row);
  });
};

const renderStatus = () => {
  const activeClient = clients.find((client) => client.id === selectedClientId);
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
    item.className = "status-item";
    item.innerHTML = `
      <div>
        <strong>${form.id}</strong>
        <span> · ${activeClient.fullName}</span>
      </div>
      <span class="status-pill ${coverage >= 80 ? "status-good" : "status-warn"}">
        ${coverage}% mapped
      </span>
    `;
    statusList.appendChild(item);
  });
};

intakeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(intakeForm);
  const newClient = {
    id: `CL-${1000 + clients.length + 1}`,
    fullName: formData.get("fullName"),
    preferredName: formData.get("preferredName"),
    dateOfBirth: formData.get("dateOfBirth"),
    citizenship: formData.get("citizenship"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    caseType: formData.get("caseType"),
    notes: formData.get("notes"),
  };
  clients.unshift(newClient);
  selectedClientId = newClient.id;
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

generatePacketBtn.addEventListener("click", () => {
  window.alert("Packet generated with auto-filled USCIS forms.");
});

exportJsonBtn.addEventListener("click", () => {
  const activeClient = clients.find((client) => client.id === selectedClientId);
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
      fullName: "Ana Gutierrez",
      preferredName: "Ana",
      dateOfBirth: "1989-05-17",
      citizenship: "El Salvador",
      email: "ana.gutierrez@email.com",
      phone: "(213) 555-0172",
      address: "215 Grand Ave, Los Angeles, CA 90012",
      caseType: "family-based",
      notes: "Needs I-130 + I-485; spouse is USC.",
    },
    {
      id: "CL-1033",
      fullName: "Wei Zhang",
      preferredName: "Wei",
      dateOfBirth: "1994-02-08",
      citizenship: "China",
      email: "wei.z@email.com",
      phone: "(646) 555-0142",
      address: "77 East 10th St, New York, NY 10003",
      caseType: "employment",
      notes: "H-1B extension, premium processing.",
    }
  );
  selectedClientId = clients[0].id;
  renderClients();
  renderStatus();
  renderPreview();
});

previewFormSelect.addEventListener("change", renderPreview);

renderClients();
renderForms();
renderPreviewSelect();
renderStatus();
renderPreview();
