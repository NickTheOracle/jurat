const intakeForm = document.querySelector("#intake-form");
const clientList = document.querySelector("#client-list");
const formsGrid = document.querySelector("#forms-grid");
const statusList = document.querySelector("#status-list");
const clearFormBtn = document.querySelector("#clear-form-btn");
const newClientBtn = document.querySelector("#new-client-btn");
const shareLinkBtn = document.querySelector("#share-link-btn");
const generatePacketBtn = document.querySelector("#generate-packet-btn");
const exportJsonBtn = document.querySelector("#export-json-btn");

const mockClients = [
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
  },
];

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

let selectedClientId = mockClients[0].id;

const renderClients = () => {
  clientList.innerHTML = "";

  mockClients.forEach((client) => {
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

const renderStatus = () => {
  const activeClient = mockClients.find((client) => client.id === selectedClientId);
  statusList.innerHTML = "";
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
    id: `CL-${1000 + mockClients.length + 1}`,
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
  mockClients.unshift(newClient);
  selectedClientId = newClient.id;
  intakeForm.reset();
  renderClients();
  renderStatus();
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
  const activeClient = mockClients.find((client) => client.id === selectedClientId);
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

renderClients();
renderForms();
renderStatus();
