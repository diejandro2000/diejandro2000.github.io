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

function formatSpanishNumber(value) {
  return Number(value || 0).toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function parseSpanishDate(dateStr) {
  if (!dateStr) return null;

  const parts = dateStr.split("/");

  if (parts.length !== 3) return null;

  const [day, month, year] = parts;

  return new Date(year, month - 1, day);
}

function formatSpanishDate(dateString) {
  if (!dateString) return "";

  if (dateString.includes("/")) return dateString;

  const date = new Date(dateString);

  return date.toLocaleDateString("es-ES");
}

const DEFAULT_CLIENTS = {
  DOS40: {
    name: "DOS40 SOLUCIONES AUDIOVISUALES Y EVENTOS S.L.U.",
    address: "Plaza de la Constitución 2, Hoyo de Manzanares, 28240 Madrid, España",
    number: "B87799730",
    label: "DOS40"
  }
};

let clients = {};

function loadClients() {
  const custom = JSON.parse(localStorage.getItem("customClients") || "{}");
  clients = Object.assign({}, DEFAULT_CLIENTS, custom);
  rebuildClientSelect();
}

function saveCustomClients(custom) {
  localStorage.setItem("customClients", JSON.stringify(custom));
  loadClients();
}

function getCustomClients() {
  return JSON.parse(localStorage.getItem("customClients") || "{}");
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

function openClientModal() {
  document.getElementById("clientModal").style.display = "flex";
}

function closeClientModal() {
  document.getElementById("clientModal").style.display = "none";
}

function clearClientForm() {}

function saveClient() {}

function getStorageUsage() {
  let total = 0;

  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += (localStorage[key].length + key.length) * 2;
    }
  }

  return total;
}

function updateStorageBar() {}

function getInvoiceSnapshot() {
  const items = [];

  document.querySelectorAll("#invoiceItems tr").forEach(row => {
    items.push({
      fecha: row.querySelector(".fecha")?.value || "",
      lugarDropdown: row.querySelector(".lugarDropdown")?.value || "",
      lugar: row.querySelector(".lugar")?.value || "",
      actividadDropdown: row.querySelector(".actividadDropdown")?.value || "",
      actividad: row.querySelector(".actividad")?.value || "",
      inicio: row.querySelector(".inicio")?.value || "",
      final: row.querySelector(".final")?.value || "",
      horas: parseFloat(row.querySelector(".horas")?.value) || 0,
      dietaSelect: row.querySelector(".dieta")?.value || "0",
      dietaValue: row.querySelector(".dietaValue")?.value || "",
      totalInput: row.querySelector(".totalInput")?.value || "0.00",

      equipoText: row.querySelector(".equipoText")?.value || "",
      equipoPrice: row.querySelector(".equipoPrice")?.value || ""
    });
  });

  return {
    clientId: document.getElementById("clientSelect").value,
    invoiceNumber: document.getElementById("invoiceNumber").value,
    invoiceDate: document.getElementById("invoiceDate").value,
    items
  };
}

function saveVersion() {}
function loadVersionHistory() {}
function restoreVersion() {}
function clearHistory() {}

function addItem(item = {}) {
  const tbody = document.getElementById("invoiceItems");

  const row = document.createElement("tr");

  row.innerHTML = `
    <td>
      <input type="text" class="fecha" placeholder="dd/mm/aaaa" value="${item.fecha || ""}">
    </td>

    <td>
      <select class="lugarDropdown">
        <option value="Teatro Las Vegas">Teatro Las Vegas</option>
        <option value="Otro">Otro</option>
      </select>

      <input
        type="text"
        class="lugar"
        placeholder="Otro"
        value="${item.lugar || ""}"
        style="display:none;"
      >
    </td>

    <td>
      <select class="actividadDropdown">
        <option value="Evento">Evento</option>
        <option value="Montaje">Montaje</option>
        <option value="Otro">Otro</option>
      </select>

      <input
        type="text"
        class="actividad"
        placeholder="Otro"
        value="${item.actividad || ""}"
        style="display:none;"
      >
    </td>

    <td>
      <input type="text" class="inicio" placeholder="hh:mm" value="${item.inicio || ""}">
    </td>

    <td>
      <input type="text" class="final" placeholder="hh:mm" value="${item.final || ""}">
    </td>

    <td>
      <input
        type="number"
        class="horas"
        value="${item.horas?.toFixed?.(2) || "0.00"}"
        step="0.01"
      >
    </td>

    <td>
      <select class="dieta">
        <option value="0">No</option>
        <option value="1">Sí</option>
      </select>

      <input
        type="number"
        class="dietaValue"
        placeholder="€"
        value="${item.dietaValue || ""}"
        style="display:none;"
      >
    </td>

    <!-- NUEVA COLUMNA -->
    <td style="width:220px;">
      <textarea
        class="equipoText"
        placeholder="Ej: 2x altavoces Meyer + mesa Yamaha"
        style="width:100%; min-height:60px;"
      >${item.equipoText || ""}</textarea>

      <input
        type="number"
        class="equipoPrice"
        placeholder="€"
        value="${item.equipoPrice || ""}"
        step="0.01"
      >

      <div style="
        font-size:0.72em;
        color:#b26a00;
        margin-top:4px;
      ">
        Exento de IVA según alquiler de equipo
      </div>
    </td>

    <td class="totalCell">
      <input
        type="number"
        class="totalInput"
        value="${item.totalInput || "0.00"}"
        step="0.01"
      >

      <span class="extraPrice"></span>
    </td>

    <td>
      <button class="remove">❌</button>
    </td>
  `;

  tbody.appendChild(row);

  const inicioInput = row.querySelector(".inicio");
  const finalInput = row.querySelector(".final");
  const horasInput = row.querySelector(".horas");

  function recalcFromTimes() {
    const inicio = inicioInput.value;
    const fin = finalInput.value;

    if (inicio && fin) {
      horasInput.value = calculateHours(inicio, fin).toFixed(2);
      updateTotals();
    }
  }

  horasInput.addEventListener("input", updateTotals);

  inicioInput.addEventListener("change", recalcFromTimes);
  finalInput.addEventListener("change", recalcFromTimes);

  row.querySelectorAll("input, select, textarea").forEach(el => {
    el.addEventListener("input", updateTotals);
    el.addEventListener("change", updateTotals);
  });

  row.querySelector(".remove").addEventListener("click", () => {
    row.remove();
    updateTotals();
  });

  updateTotals();
}

function calculateHours(inicio, final) {
  if (!inicio || !final) return 0;

  const [h1, m1] = inicio.split(":").map(Number);
  const [h2, m2] = final.split(":").map(Number);

  let start = h1 + (m1 / 60);
  let end = h2 + (m2 / 60);

  let diff = end - start;

  if (diff < 0) diff += 24;

  return diff;
}

function updateTotals() {
  let subtotal = 0;
  let ivaBase = 0;
  let equipoExento = 0;

  const tarifaExtra = 20;

  document.querySelectorAll("#invoiceItems tr").forEach(row => {
    const horas = parseFloat(row.querySelector(".horas")?.value) || 0;

    const manualTotal =
      parseFloat(row.querySelector(".totalInput")?.value) || 0;

    const equipoPrice =
      parseFloat(row.querySelector(".equipoPrice")?.value) || 0;

    const dietaYes =
      row.querySelector(".dieta")?.value === "1";

    const dietaValue =
      parseFloat(row.querySelector(".dietaValue")?.value) || 0;

    let extras = 0;

    if (horas > 10) {
      extras += (horas - 10) * tarifaExtra;
    }

    if (dietaYes) {
      extras += dietaValue;
    }

    subtotal += manualTotal + extras + equipoPrice;

    ivaBase += manualTotal + extras;

    equipoExento += equipoPrice;
  });

  const applyIrpf = document.getElementById("irpfToggle")?.checked ?? true;

  const ivaAmount = ivaBase * 0.21;

  const irpfAmount = applyIrpf
    ? ivaBase * 0.15
    : 0;

  const grandTotal =
    ivaBase +
    equipoExento +
    ivaAmount -
    irpfAmount;

  document.getElementById("subtotal").textContent =
    formatSpanishNumber(subtotal);

  document.getElementById("ivaAmount").textContent =
    formatSpanishNumber(ivaAmount);

  document.getElementById("irpfAmount").textContent =
    applyIrpf
      ? formatSpanishNumber(irpfAmount)
      : "—";

  document.getElementById("equipoExentoTotal").textContent =
    formatSpanishNumber(equipoExento);

  document.getElementById("grandTotal").textContent =
    formatSpanishNumber(grandTotal);
}

function generatePDF() {
  updateTotals();

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  const invoiceNumber =
    document.getElementById("invoiceNumber")?.value || "0000";

  const invoiceDate =
    document.getElementById("invoiceDate")?.value ||
    new Date().toLocaleDateString("es-ES");

  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);

  doc.text(`FACTURA Nº ${invoiceNumber}`, 14, y);

  doc.setFont("helvetica", "normal");

  doc.text(`Fecha de emisión: ${invoiceDate}`, 140, y);

  const rows = [];

  let equipoExento = 0;
  let ivaBase = 0;

  document.querySelectorAll("#invoiceItems tr").forEach((row) => {
    const fecha = row.querySelector(".fecha")?.value || "";

    const lugar =
      row.querySelector(".lugarDropdown")?.value || "";

    const actividad =
      row.querySelector(".actividadDropdown")?.value || "";

    const inicio =
      row.querySelector(".inicio")?.value || "";

    const final =
      row.querySelector(".final")?.value || "";

    const horas =
      parseFloat(row.querySelector(".horas")?.value) || 0;

    const dietaYes =
      row.querySelector(".dieta")?.value === "1";

    const manualTotal =
      parseFloat(row.querySelector(".totalInput")?.value) || 0;

    const equipoText =
      row.querySelector(".equipoText")?.value || "";

    const equipoPrice =
      parseFloat(row.querySelector(".equipoPrice")?.value) || 0;

    let combinedText =
      formatSpanishNumber(manualTotal) + " €";

    if (equipoPrice > 0) {
      combinedText +=
        `\n\nALQUILER EQUIPO:\n` +
        `${equipoText}\n` +
        `${formatSpanishNumber(equipoPrice)} €\n` +
        `(EXENTO IVA)`;
    }

    rows.push([
      fecha,
      lugar,
      actividad,
      inicio,
      final,
      horas.toFixed(2),
      dietaYes ? "Sí" : "No",
      combinedText
    ]);

    ivaBase += manualTotal;
    equipoExento += equipoPrice;
  });

  doc.autoTable({
    head: [[
      "Fecha",
      "Lugar",
      "Actividad",
      "Inicio",
      "Final",
      "Horas",
      "Dieta",
      "Total"
    ]],

    body: rows,

    startY: 40,

    styles: {
      fontSize: 8
    }
  });

  let finalY = doc.lastAutoTable.finalY + 15;

  const ivaAmount = ivaBase * 0.21;

  const applyIrpf =
    document.getElementById("irpfToggle").checked === true;

  const irpfAmount =
    applyIrpf
      ? ivaBase * 0.15
      : 0;

  const grandTotal =
    ivaBase +
    equipoExento +
    ivaAmount -
    irpfAmount;

  doc.text(
    `Base imponible: ${formatSpanishNumber(ivaBase)} €`,
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

  doc.text(
    `Alquiler exento IVA: ${formatSpanishNumber(equipoExento)} €`,
    140,
    finalY + 18
  );

  doc.setFont("helvetica", "bold");

  doc.text(
    `TOTAL: ${formatSpanishNumber(grandTotal)} €`,
    140,
    finalY + 26
  );

  doc.save(
    `factura_${invoiceDate.replace(/\//g, "-")}.pdf`
  );
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

document.addEventListener("change", function(e) {
  const target = e.target;

  if (target.classList.contains("dieta")) {
    const valueInput =
      target.closest("tr").querySelector(".dietaValue");

    valueInput.style.display =
      target.value === "1"
        ? "inline-block"
        : "none";

    updateTotals();
  }
});

document.addEventListener("input", function(e) {
  if (
    e.target.classList.contains("dietaValue") ||
    e.target.classList.contains("totalInput") ||
    e.target.classList.contains("horas") ||
    e.target.classList.contains("equipoPrice")
  ) {
    updateTotals();
  }
});