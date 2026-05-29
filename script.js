// ─────────────────────────────────────────────
// FORMATO ESPAÑOL
// ─────────────────────────────────────────────

const SPANISH_LOCALE = "es-ES";
const MADRID_TIMEZONE = "Europe/Madrid";

function formatSpanishDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleDateString(SPANISH_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: MADRID_TIMEZONE
  });
}

function formatSpanishDateTime(date = new Date()) {
  return date.toLocaleString(SPANISH_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: MADRID_TIMEZONE
  });
}

function formatSpanishNumber(value) {
  return Number(value || 0).toLocaleString(SPANISH_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadClients();
  loadInvoice();
  document.getElementById("addItem").addEventListener("click", addItem);
  document.getElementById("generatePDF").addEventListener("click", generatePDF);
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);

  document.getElementById("manageClients").addEventListener("click", openClientModal);
  document.getElementById("closeClientModal").addEventListener("click", closeClientModal);
  document.getElementById("saveClient").addEventListener("click", saveClient);
  document.getElementById("cancelEditClient").addEventListener("click", clearClientForm);

  document.getElementById("clientModal").addEventListener("click", function(e) {
    if (e.target === this) closeClientModal();
  });

  document.getElementById("saveVersion").addEventListener("click", saveVersion);
  document.getElementById("restoreVersion").addEventListener("click", restoreVersion);
  document.getElementById("clearHistory").addEventListener("click", clearHistory);

  document.getElementById("irpfToggle").addEventListener("change", updateTotals);

  loadVersionHistory();
  updateStorageBar();
});

const DEFAULT_CLIENTS = {
  DOS40: {
    name: "DOS40 SOLUCIONES AUDIOVISUALES Y EVENTOS S.L.U.",
    address: "Plaza de la Constitución 2, Hoyo de Manzanares, 28240 Madrid, España",
    number: "B87799730",
    label: "DOS40"
  },
  nologo: {
    name: "NOX AUDIOVISUALES S.L",
    address: "C/Hierro 2, 28770 Colmenar Viejo, Madrid",
    number: "B-87256574",
    label: "NOX AUDIOVISUALES S.L"
  }
};

let clients = {};

function loadClients() {
  const custom = JSON.parse(localStorage.getItem("customClients") || "{}");
  clients = Object.assign({}, DEFAULT_CLIENTS, custom);
  rebuildClientSelect();
}

function rebuildClientSelect() {
  const sel = document.getElementById("clientSelect");
  const current = sel.value;

  sel.innerHTML = "";

  Object.entries(clients).forEach(([key, info]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = info.label || info.name;
    sel.appendChild(opt);
  });

  if (clients[current]) sel.value = current;
}

function getStorageUsage() {
  let total = 0;

  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += (localStorage[key].length + key.length) * 2;
    }
  }

  return total;
}

function updateStorageBar() {
  const used = getStorageUsage();
  const maxBytes = 5 * 1024 * 1024;
  const pct = Math.min((used / maxBytes) * 100, 100);

  const fill = document.getElementById("storageBarFill");
  const label = document.getElementById("storageLabel");

  if (!fill || !label) return;

  fill.style.width = pct.toFixed(1) + "%";

  label.textContent =
    `Almacenamiento: ${formatSpanishNumber(used / 1024)} KB de ~5120 KB usados (${pct.toFixed(1)}%)`;
}

function saveVersion() {
  const versions = JSON.parse(localStorage.getItem("invoiceVersions") || "[]");

  const snapshot = getInvoiceSnapshot();

  const timestamp = formatSpanishDateTime();

  versions.push({
    timestamp,
    data: snapshot
  });

  localStorage.setItem("invoiceVersions", JSON.stringify(versions));

  loadVersionHistory();
  updateStorageBar();

  alert(`✅ Versión guardada: ${timestamp}`);
}

function loadVersionHistory() {
  const versions = JSON.parse(localStorage.getItem("invoiceVersions") || "[]");

  const select = document.getElementById("versionHistory");

  select.innerHTML = '<option value="">— Sin versiones guardadas —</option>';

  versions.forEach((v, i) => {
    const opt = document.createElement("option");

    opt.value = i;

    opt.textContent =
      `${v.timestamp} — Factura ${v.data.invoiceNumber || "sin número"}`;

    select.appendChild(opt);
  });
}

function calculateHours(inicio, final) {
  if (!inicio || !final) return 0;

  const start = new Date(`1970-01-01T${inicio}:00`);
  const end = new Date(`1970-01-01T${final}:00`);

  let diff = (end - start) / 3600000;

  if (diff < 0) diff += 24;

  return diff;
}

function updateTotals() {
  let subtotal = 0;

  const tarifaExtra = 20;
  const maxNormalHours = 10;

  document.querySelectorAll("#invoiceItems tr").forEach(row => {
    const inicio = row.querySelector(".inicio")?.value || "";
    const final = row.querySelector(".final")?.value || "";

    const horasInput = row.querySelector(".horas");

    if (inicio && final) {
      const totalHours = calculateHours(inicio, final);

      horasInput.value = totalHours.toFixed(2);
    }

    const horas = parseFloat(horasInput?.value) || 0;

    const extraHours = Math.max(horas - maxNormalHours, 0);

    const extraTotal = extraHours * tarifaExtra;

    const manualTotal =
      parseFloat(row.querySelector(".totalInput")?.value) || 0;

    subtotal += manualTotal + extraTotal;
  });

  const applyIrpf =
    document.getElementById("irpfToggle")?.checked ?? true;

  const ivaAmount = subtotal * 0.21;
  const irpfAmount = applyIrpf ? subtotal * 0.15 : 0;
  const grandTotal = subtotal + ivaAmount - irpfAmount;

  document.getElementById("subtotal").textContent =
    formatSpanishNumber(subtotal);

  document.getElementById("ivaAmount").textContent =
    formatSpanishNumber(ivaAmount);

  document.getElementById("irpfAmount").textContent =
    applyIrpf
      ? formatSpanishNumber(irpfAmount)
      : "—";

  document.getElementById("grandTotal").textContent =
    formatSpanishNumber(grandTotal);
}

function generatePDF() {
  updateTotals();

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  try {
    const invoiceNumber =
      document.getElementById("invoiceNumber")?.value || "0000";

    const rawInvoiceDate =
      document.getElementById("invoiceDate")?.value;

    const invoiceDate = rawInvoiceDate
      ? formatSpanishDate(rawInvoiceDate)
      : formatSpanishDate(new Date());

    const tarifaExtra = 20;

    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);

    doc.text(`FACTURA Nº ${invoiceNumber}`, 14, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text(`Fecha de emisión: ${invoiceDate}`, 140, y);

    const rows = [];

    document.querySelectorAll("#invoiceItems tr").forEach((row) => {
      const rawFecha =
        row.querySelector(".fecha")?.value || "";

      const fecha = formatSpanishDate(rawFecha);

      const inicio =
        row.querySelector(".inicio")?.value || "";

      const final =
        row.querySelector(".final")?.value || "";

      const horas =
        parseFloat(row.querySelector(".horas")?.value) || 0;

      const manualTotal =
        parseFloat(row.querySelector(".totalInput")?.value) || 0;

      rows.push([
        fecha,
        inicio,
        final,
        formatSpanishNumber(horas),
        `${formatSpanishNumber(manualTotal)} €`
      ]);
    });

    doc.autoTable({
      head: [["Fecha", "Inicio", "Final", "Horas", "Total"]],
      body: rows,
      startY: y + 20,
      theme: "striped",
      styles: {
        fontSize: 9
      }
    });

    let subtotal = 0;

    document.querySelectorAll("#invoiceItems tr").forEach((row) => {
      const horas =
        parseFloat(row.querySelector(".horas")?.value) || 0;

      const manualTotal =
        parseFloat(row.querySelector(".totalInput")?.value) || 0;

      const extra =
        Math.max(horas - 10, 0) * tarifaExtra;

      subtotal += manualTotal + extra;
    });

    const applyIrpf =
      document.getElementById("irpfToggle").checked === true;

    const ivaAmount = subtotal * 0.21;
    const irpfAmount = applyIrpf ? subtotal * 0.15 : 0;
    const grandTotal = subtotal + ivaAmount - irpfAmount;

    let finalY = doc.lastAutoTable.finalY + 15;

    doc.text(
      `Subtotal: ${formatSpanishNumber(subtotal)} €`,
      140,
      finalY
    );

    doc.text(
      `IVA (21%): ${formatSpanishNumber(ivaAmount)} €`,
      140,
      finalY + 6
    );

    if (applyIrpf) {
      doc.text(
        `IRPF (15%): ${formatSpanishNumber(irpfAmount)} €`,
        140,
        finalY + 12
      );
    }

    doc.setFont("helvetica", "bold");

    doc.text(
      `Total: ${formatSpanishNumber(grandTotal)} €`,
      140,
      finalY + 18
    );

    const safeDate = invoiceDate.replace(/\//g, "-");

    doc.save(`factura_${safeDate}.pdf`);

  } catch (error) {
    console.error(error);

    alert("Error al generar PDF");
  }
}

function loadInvoice() {
  const saved =
    JSON.parse(localStorage.getItem("invoiceData") || "null");

  if (!saved) return;

  document.getElementById("clientSelect").value =
    saved.clientId || "";

  document.getElementById("invoiceNumber").value =
    saved.invoiceNumber || "";

  document.getElementById("invoiceDate").value =
    saved.invoiceDate || "";

  document.getElementById("invoiceItems").innerHTML = "";

  (saved.items || []).forEach(item => addItem(item));

  updateTotals();
}

function toggleTheme() {
  document.body.classList.toggle("dark");

  const btn = document.getElementById("themeToggle");

  btn.textContent =
    document.body.classList.contains("dark")
      ? "☀️"
      : "🌙";
}