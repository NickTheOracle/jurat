const JuratShared = (() => {
  const STORAGE_KEY = "jurat.clients";
  const DRAFTS_KEY = "jurat.drafts";
  const SELECTED_FORM_KEY = "jurat.selectedForm";
  const SERVICE_URL_KEY = "jurat.pdfServiceUrl";
  const N400_FORM_ID = "N-400";
  const N400_PDF_PATH = "/forms/N-400.pdf";

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

  const formatMaybeDate = (value) => {
    if (!value) {
      return "";
    }
    return formatDate(value);
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
    const nameParts = client.firstName || client.lastName
      ? {
          firstName: client.firstName || "",
          middleName: client.middleName || "",
          lastName: client.lastName || "",
        }
      : splitName(client.fullName || "");
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
      formattedDateOfBirth: formatDate(client.dateOfBirth || ""),
      formattedDateBecamePermanentResident: formatMaybeDate(client.dateBecamePermanentResident || ""),
      countryOfBirth: client.countryOfBirth || "",
      citizenship: client.citizenship || "",
      alienNumber: client.alienNumber || "",
      uscisAccountNumber: client.uscisAccountNumber || "",
      ssn: client.ssn || "",
      maritalStatus: client.maritalStatus || "",
      spouseName: client.spouseName || "",
      gender: client.gender || "",
      heightFeet: client.heightFeet || "",
      heightInches: client.heightInches || "",
      weight: client.weight || "",
      eyeColor: client.eyeColor || "",
      hairColor: client.hairColor || "",
      occupation: client.occupation || "",
      employer: client.employer || "",
      tripsCount: client.tripsCount || "",
      tripsDays: client.tripsDays || "",
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

  const toUpper = (value) => (value || "").toString().toUpperCase();

  const loadClients = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Unable to load clients.", error);
      return [];
    }
  };

  const saveClients = (clients) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  };

  const loadDrafts = () => {
    const stored = localStorage.getItem(DRAFTS_KEY);
    if (!stored) {
      return [];
    }
    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Unable to load drafts.", error);
      return [];
    }
  };

  const saveDrafts = (drafts) => {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  };

  const getSelectedForm = () => {
    return localStorage.getItem(SELECTED_FORM_KEY) || N400_FORM_ID;
  };

  const setSelectedForm = (formId) => {
    localStorage.setItem(SELECTED_FORM_KEY, formId);
  };

  const getPdfServiceUrl = () => {
    return localStorage.getItem(SERVICE_URL_KEY) || "";
  };

  const setPdfServiceUrl = (url) => {
    localStorage.setItem(SERVICE_URL_KEY, url);
  };

  const setTextField = (form, name, value) => {
    try {
      const field = form.getTextField(name);
      field.setText(toUpper(value));
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
        field.setText(toUpper(value));
      }
    });
  };

  const fetchN400Template = async () => {
    try {
      const response = await fetch(N400_PDF_PATH, { cache: "no-store" });
      if (!response.ok) {
        return { ok: false, status: response.status, bytes: null };
      }
      const bytes = await response.arrayBuffer();
      return { ok: true, status: response.status, bytes };
    } catch (error) {
      return { ok: false, status: 0, bytes: null, error };
    }
  };

  const createN400Doc = async (client, templateBytes) => {
    if (!window.PDFLib) {
      window.alert("PDF library not loaded yet. Please refresh and try again.");
      return null;
    }
    let existingPdfBytes = templateBytes;
    if (!existingPdfBytes) {
      const result = await fetchN400Template();
      if (!result.ok) {
        console.warn("Failed to load N-400 PDF.", result.error || result.status);
        window.alert("Unable to load the official N-400 PDF. Please refresh and try again.");
        return null;
      }
      existingPdfBytes = result.bytes;
    }
    const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const normalized = getNormalizedClient(client);

    setTextFieldsByMatch(form, (name) => name.includes("Line1_AlienNumber"), normalized.alienNumber);
    setTextField(form, "form1[0].#subform[1].P2_Line6_USCISELISAcctNumber[0]", normalized.uscisAccountNumber);
    setTextField(form, "form1[0].#subform[1].Part2Line3_FamilyName[0]", normalized.lastName);
    setTextField(form, "form1[0].#subform[1].Part2Line4a_GivenName[0]", normalized.firstName);
    setTextField(form, "form1[0].#subform[1].Part2Line4a_MiddleName[0]", normalized.middleName);
    setTextField(form, "form1[0].#subform[1].P2_Line8_DateOfBirth[0]", normalized.formattedDateOfBirth);
    setTextField(
      form,
      "form1[0].#subform[1].P2_Line9_DateBecamePermanentResident[0]",
      normalized.formattedDateBecamePermanentResident
    );
    setTextField(form, "form1[0].#subform[1].P2_Line10_CountryOfBirth[0]", normalized.countryOfBirth);
    setTextField(form, "form1[0].#subform[1].P2_Line11_CountryOfNationality[0]", normalized.citizenship);
    setTextField(form, "form1[0].#subform[8].P9_Line22c_SSNumber[0]", normalized.ssn);
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

  const createPdfBlobUrl = async (pdfDoc) => {
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  };

  const createBlobUrlFromBytes = (bytes) => {
    const blob = new Blob([bytes], { type: "application/pdf" });
    return URL.createObjectURL(blob);
  };

  const requestN400Pdf = async (client) => {
    const serviceUrl = getPdfServiceUrl();
    if (!serviceUrl) {
      return { ok: false, status: 0, error: "Service URL not set." };
    }
    const normalized = getNormalizedClient(client);
    const response = await fetch(`${serviceUrl.replace(/\\/$/, "")}/fill/n-400`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized),
    });
    if (!response.ok) {
      return { ok: false, status: response.status };
    }
    const bytes = await response.arrayBuffer();
    return { ok: true, bytes };
  };

  const triggerDownload = (url, fileName) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    try {
      link.click();
    } catch (error) {
      console.warn("Download blocked, opening PDF in a new tab.", error);
      window.open(url, "_blank", "noopener");
    } finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    return url;
  };

  const downloadPdfDoc = async ({ pdfDoc, fileName }) => {
    const url = await createPdfBlobUrl(pdfDoc);
    return triggerDownload(url, fileName);
  };

  const downloadPdfBytes = async ({ bytes, fileName }) => {
    const url = createBlobUrlFromBytes(bytes);
    return triggerDownload(url, fileName);
  };

  const openPdfDoc = async ({ pdfDoc }) => {
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const opened = window.open(url, "_blank", "noopener");
    if (!opened) {
      window.alert("Popup blocked. Please allow popups to preview the PDF.");
      return false;
    }
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  };

    return {
      STORAGE_KEY,
    DRAFTS_KEY,
    N400_FORM_ID,
    N400_PDF_PATH,
    getPdfServiceUrl,
    setPdfServiceUrl,
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
    createPdfBlobUrl,
    downloadPdfDoc,
    downloadPdfBytes,
    requestN400Pdf,
    openPdfDoc,
  };
})();
