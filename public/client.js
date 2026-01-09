const clientForm = document.querySelector("#client-intake-form");
const statusMessage = document.querySelector("#status-message");

const { loadDrafts, saveDrafts, buildFullName } = JuratShared;

const params = new URLSearchParams(window.location.search);
const draftId = params.get("draft");
const formId = params.get("form") || "N-400";

let drafts = loadDrafts();
let activeDraft = drafts.find((draft) => draft.id === draftId);

if (!draftId) {
  statusMessage.textContent = "Missing intake link. Please request a new link.";
}

if (draftId && !activeDraft) {
  activeDraft = {
    id: draftId,
    formId,
    status: "sent",
    createdAt: new Date().toISOString(),
  };
  drafts = [activeDraft, ...drafts];
  saveDrafts(drafts);
}

clientForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(clientForm);
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

  const payload = {
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
  };

  if (activeDraft) {
    activeDraft.status = "completed";
    activeDraft.data = payload;
    activeDraft.completedAt = new Date().toISOString();
    drafts = drafts.map((draft) => (draft.id === activeDraft.id ? activeDraft : draft));
    saveDrafts(drafts);
    statusMessage.textContent = "Thanks! Your intake was submitted.";
    clientForm.reset();
    return;
  }

  statusMessage.textContent = "Thanks! Your intake was submitted.";
  clientForm.reset();
});
