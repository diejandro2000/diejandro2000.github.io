const { jsPDF } = window.jspdf;

// Load saved data
document.addEventListener("DOMContentLoaded", () => {
  loadInvoice();
  document.getElementById("addItem").addEventListener("click", addItem);
  document.getElementById("generatePDF").addEventListener("click", generatePDF);
  document.getElementById("saveInvoice").addEventListener("click", saveInvoice);
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  document.getElementById("taxRate").addEventListener("input", updateTotals);
});

const clients = {
  client1: {
    name: "DOS40 SOLUCIONES AUDIOVISUALES Y EVENTOS S.L.U.",
    address: "Plaza de la Constitución 2, Hoyo de Manzanares, 28240 Madrid, España",
    number: "B87799730"
  },
  client2: {
    name: "Maria Gonzalez",
    address: "Avenida Siempre Viva 45, 28002, Madrid, España",
    email: "maria.gonzalez@example.com",
    phone: "+34 600 654 321"
  },
  client3: {
    name: "Carlos López",
    address: "Plaza Mayor 10, 28013, Madrid, España",
    email: "carlos.lopez@example.com",
    phone: "+34 600 987 654"
  }
};

function addItem(item = {}) {
  const tbody = document.getElementById("invoiceItems");
  const row = document.createElement("tr");

  row.innerHTML = `
    <td><input type="date" class="fecha" value="${item.fecha || ""}"></td>
    <td>
      <select class="lugarDropdown">
        <option value="">--Select--</option>
        <option value="Office">Office</option>
        <option value="Client Site">Client Site</option>
        <option value="Other">Other</option>
      </select>
      <input type="text" class="lugar" placeholder="Lugar de trabajo" value="${item.lugar || ""}" style="display:none;">
    </td>
    <td>
      <select class="actividadDropdown">
        <option value="">--Select--</option>
        <option value="Consulting">Consulting</option>
        <option value="Design">Design</option>
        <option value="Development">Development</option>
        <option value="Support">Support</option>
        <option value="Other">Other</option>
      </select>
      <input type="text" class="actividad" placeholder="Actividad" value="${item.actividad || ""}" style="display:none;">
    </td>
    <td><input type="time" class="inicio" value="${item.inicio || ""}"></td>
    <td><input type="time" class="final" value="${item.final || ""}"></td>
    <td class="horas">0.00</td>
    <td><input type="number" class="tarifa" value="${item.tarifa || 0}" step="0.01"></td>
    <td><input type="number" class="horasExtra" value="${item.horasExtra || 0}" step="0.01"></td>
    <td><input type="number" class="tarifaExtra" value="${item.tarifaExtra || 0}" step="0.01"></td>
    <td>
      <select class="uber">
        <option value="0">No</option>
        <option value="1">Yes</option>
      </select>
    </td>
    <td>
      <select class="iva">
        <option value="0">No</option>
        <option value="1">Yes</option>
      </select>
    </td>
    <td class="total">0.00</td>
    <td><button class="remove">❌</button></td>
  `;

  tbody.appendChild(row);

  // Show text input if "Other" is selected
  row.querySelector(".lugarDropdown").addEventListener("change", (e) => {
    const input = row.querySelector(".lugar");
    if (e.target.value === "Other") input.style.display = "inline-block";
    else {
      input.style.display = "none";
      input.value = e.target.value;
    }
    updateTotals();
  });

  row.querySelector(".actividadDropdown").addEventListener("change", (e) => {
    const input = row.querySelector(".actividad");
    if (e.target.value === "Other") input.style.display = "inline-block";
    else {
      input.style.display = "none";
      input.value = e.target.value;
    }
    updateTotals();
  });

  // Update totals when inputs change
  const inputs = row.querySelectorAll("input, select");
  inputs.forEach(input => {
    input.addEventListener("input", updateTotals);
    input.addEventListener("change", updateTotals);
  });

  // Remove row
  row.querySelector(".remove").addEventListener("click", () => {
    row.remove();
    updateTotals();
  });

  updateTotals();
}


function calculateHours(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes < startMinutes) endMinutes += 24 * 60;
  return (endMinutes - startMinutes) / 60;
}

function updateTotals() {
  let subtotal = 0;
  let uberCount = 0;

  document.querySelectorAll("#invoiceItems tr").forEach(row => {
    const inicio = row.querySelector(".inicio").value;
    const final = row.querySelector(".final").value;
    const tarifa = parseFloat(row.querySelector(".tarifa").value) || 0;
    const horasExtra = parseFloat(row.querySelector(".horasExtra").value) || 0;
    const tarifaExtra = parseFloat(row.querySelector(".tarifaExtra").value) || 0;
    const uberYes = row.querySelector(".uber").value === "1";
    const ivaYes = row.querySelector(".iva").value === "1";

    if (uberYes) uberCount++;

    const horas = calculateHours(inicio, final);
    row.querySelector(".horas").textContent = horas.toFixed(2);

    // Total row calculation including IVA if checked
    let total = horas * tarifa + horasExtra * tarifaExtra;
    if (ivaYes) total += total * 0.21; // add 21% IVA if checked
    row.querySelector(".total").textContent = total.toFixed(2);

    subtotal += total;
  });

  // Fixed tax rates
  const ivaAmount = subtotal * 0.21;  // 21%
  const irpfAmount = subtotal * 0.15; // 15%
  const grandTotal = subtotal + ivaAmount - irpfAmount;

  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("ivaAmount").textContent = ivaAmount.toFixed(2);
  document.getElementById("irpfAmount").textContent = irpfAmount.toFixed(2);
  document.getElementById("grandTotal").textContent = grandTotal.toFixed(2);

  // Display number of Ubers
  const uberNote = document.getElementById("uberNote");
  if (uberNote) uberNote.textContent = uberCount > 0 ? `${uberCount} Ubers a incluir` : "";
}


function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // ---- HEADER SECTION ----
  const invoiceNumber = document.getElementById("invoiceNumber").value || "0000";
  let y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`FACTURA Nº ${invoiceNumber}`, 14, y);

  const invoiceDate = document.getElementById("invoiceDate").value || new Date().toLocaleDateString();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Fecha de emisión: ${invoiceDate}`, 140, y);

   y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Diego Alejandro Loaiza Flórez", 14, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("DNI: 51763818H", 14, y);
  y += 6;
  doc.text("Calle Monte de Montjuich 28 2A, 28031, Madrid, España", 14, y);
  y += 6;
  doc.text("Email: diejandro689@gmail.com", 14, y);
  y += 6;
  doc.text("ES9001821649210208511353", 14, y);

  // ---- CLIENT SECTION ----
  const clientId = document.getElementById("clientSelect").value;
  let clientInfo = { name: "Client Name", address: "", email: "", phone: "" };
  if (clientId && clients[clientId]) clientInfo = clients[clientId];

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text(`Para: ${clientInfo.name}`, 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  if (clientInfo.address) doc.text(clientInfo.address, 14, y);

  // ---- INVOICE TABLE ----
  const rows = [];
  let uberCount = 0;

  document.querySelectorAll("#invoiceItems tr").forEach(row => {
    const fecha = row.querySelector(".fecha").value;
    const lugar = row.querySelector(".lugar").value;
    const actividad = row.querySelector(".actividad").value;
    const inicio = row.querySelector(".inicio").value;
    const final = row.querySelector(".final").value;
    const horas = row.querySelector(".horas").textContent;
    const tarifa = row.querySelector(".tarifa").value;
    const horasExtra = row.querySelector(".horasExtra").value;
    const tarifaExtra = row.querySelector(".tarifaExtra").value;
    const ivaYes = row.querySelector(".iva").value === "1";
    const uberYes = row.querySelector(".uber").value === "1";
    const total = parseFloat(row.querySelector(".total").textContent) || 0;

    if (uberYes) uberCount++;
    rows.push([fecha, lugar, actividad, inicio, final, horas, tarifa, horasExtra, tarifaExtra, uberYes ? "Yes" : "No", ivaYes ? "Yes" : "No", total.toFixed(2)]);
  });

  const tableStartY = y + 10;
  doc.autoTable({
    head: [["Fecha","Lugar de trabajo","Actividad","Inicio","Final","Horas","Tarifa","Horas extra","Tarifa extra","Uber","IVA","Total"]],
    body: rows,
    startY: tableStartY,
    margin: { top: 14, left: 14, right: 14, bottom: 14 },
    theme: "striped",
    headStyles: { fillColor: [52, 73, 94], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
    tableWidth: doc.internal.pageSize.getWidth() - 28,
    showHead: 'everyPage'
  });

  // ---- TOTALS SECTION ----
  const subtotal = parseFloat(document.getElementById("subtotal").textContent) || 0;
  const ivaAmount = parseFloat(document.getElementById("ivaAmount").textContent) || 0;
  const irpfAmount = parseFloat(document.getElementById("irpfAmount").textContent) || 0;
  const grandTotal = parseFloat(document.getElementById("grandTotal").textContent) || 0;

  let finalY = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Subtotal: ${subtotal.toFixed(2)}€`, 140, finalY);
  doc.text(`IVA (21%): ${ivaAmount.toFixed(2)}€`, 140, finalY + 6);
  doc.text(`IRPF (15%): ${irpfAmount.toFixed(2)}€`, 140, finalY + 12);

  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${grandTotal.toFixed(2)}€`, 140, finalY + 18);

  // ---- Uber note ----
  if (uberCount > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(`${uberCount} Ubers a incluir`, 140, finalY + 24);
  }

  doc.save(`invoice_${clientInfo.name.replace(/\s+/g, "_")}.pdf`);
}


function saveInvoice() {
  const clientId = document.getElementById("clientSelect").value;
  const clientName = clientId && clients[clientId] ? clients[clientId].name : "";
  const data = {
    clientId,
    clientName,
    invoiceNumber: document.getElementById("invoiceNumber").value,
    invoiceDate: document.getElementById("invoiceDate").value,
    taxRate: document.getElementById("taxRate").value,
    items: Array.from(document.querySelectorAll("#invoiceItems tr")).map(row => ({
      fecha: row.querySelector(".fecha").value,
      lugar: row.querySelector(".lugar").value,
      actividad: row.querySelector(".actividad").value,
      inicio: row.querySelector(".inicio").value,
      final: row.querySelector(".final").value,
      horas: row.querySelector(".horas").textContent,
      tarifa: row.querySelector(".tarifa").value,
      horasExtra: row.querySelector(".horasExtra").value,
      tarifaExtra: row.querySelector(".tarifaExtra").value,
      uber: row.querySelector(".uber").value,
      iva: row.querySelector(".iva").value,
      total: row.querySelector(".total").textContent
    }))
  };

  localStorage.setItem("invoiceData", JSON.stringify(data));
  alert("Invoice saved locally!");
}

function loadInvoice() {
  const saved = JSON.parse(localStorage.getItem("invoiceData"));
  if (!saved) return;

  document.getElementById("clientSelect").value = saved.clientId || "";
  document.getElementById("invoiceNumber").value = saved.invoiceNumber || "";
  document.getElementById("invoiceDate").value = saved.invoiceDate || "";
  document.getElementById("taxRate").value = saved.taxRate || 10;

  document.getElementById("invoiceItems").innerHTML = "";
  (saved.items || []).forEach(item => addItem(item));
  updateTotals();
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  document.getElementById("themeToggle").textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
}
