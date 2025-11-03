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

  const fixedTarifa = 24.2;
  const fixedTarifaExtra = 30;

  row.innerHTML = `
    <td style="width:80px;"><input type="date" class="fecha" value="${item.fecha || ""}"></td>

    <td style="width:120px;">
      <select class="lugarDropdown" style="width:100%;">
        <option value="Teatro Las Vegas">Teatro Las Vegas</option>
  		<option value="Auditorio Nacional de Música">Auditorio Nacional de Música</option>
        <option value="Ilustre Colegio de Abogados">Ilustre Colegio de Abogados</option>
  	    <option value="Otro">Otro</option>
      </select>
      <input type="text" class="lugar" placeholder="Otro" value="${item.lugar || ""}" style="display:none; width:100%;">
    </td>

    <td style="width:120px;">
      <select class="actividadDropdown" style="width:100%;">
  		<option value="Evento">Evento</option>
  		<option value="Montaje">Montaje</option>
  		<option value="Desmontaje">Desmontaje</option>
  	  	<option value="Mantenimiento">Mantenimiento</option>
        <option value="Cabaret">Cabaret</option>
        <option value="Gadsby">Gadsby</option>
        <option value="Cine">Cine</option>
        <option value="Musical">Musical</option>
  		<option value="Muay Thai">Muay Thai</option>
	  	<option value="Visita técnica">Visita técnica</option>
	  	<option value="Evento Privado">Evento Privado</option>
        <option value="Otro">Otro</option>
      </select>
      <input type="text" class="actividad" placeholder="Otro" value="${item.actividad || ""}" style="display:none; width:100%;">
    </td>

    <td style="width:70px;"><input type="time" class="inicio" value="${item.inicio || ""}"></td>
    <td style="width:70px;"><input type="time" class="final" value="${item.final || ""}"></td>
    <td style="width:50px;" class="horas">0.00</td>
    <td style="width:50px;">${fixedTarifa}</td>
    <td style="width:50px;"><input type="number" class="horasExtra" value="${item.horasExtra || 0}" step="0.01" style="width:60px;"></td>
    <td style="width:50px;">${fixedTarifaExtra}</td>
    <td style="width:50px;">
      <select class="uber">
        <option value="0">No</option>
        <option value="1">Si</option>
      </select>
    </td>
    <td style="width:50px;">
      <select class="iva">
        <option value="0">No</option>
        <option value="1">Si</option>
      </select>
    </td>
    <td style="width:60px;" class="total">0.00</td>
    <td style="width:30px;"><button class="remove">❌</button></td>
  `;
  // Listen for changes in ANY "lugarDropdown" or "actividadDropdown"
document.addEventListener("change", function (e) {
  if (e.target.classList.contains("lugarDropdown")) {
    const select = e.target;
    const input = select.nextElementSibling; // the <input> right after it
    if (select.value === "Otro") {
      input.style.display = "block";
      input.focus();
    } else {
      input.style.display = "none";
      input.value = "";
    }
  }

  if (e.target.classList.contains("actividadDropdown")) {
    const select = e.target;
    const input = select.nextElementSibling; // the <input> right after it
    if (select.value === "Otro") {
      input.style.display = "block";
      input.focus();
    } else {
      input.style.display = "none";
      input.value = "";
    }
  }
});


  tbody.appendChild(row);

  // Show/hide text box if "Other" is selected
  row.querySelector(".lugarDropdown").addEventListener("change", e => {
    const input = row.querySelector(".lugar");
    input.style.display = e.target.value === "Other" ? "inline-block" : "none";
  });

  row.querySelector(".actividadDropdown").addEventListener("change", e => {
    const input = row.querySelector(".actividad");
    input.style.display = e.target.value === "Other" ? "inline-block" : "none";
  });

  const inputs = row.querySelectorAll("input, select");
  inputs.forEach(input => {
    input.addEventListener("input", updateTotals);
    input.addEventListener("change", updateTotals);
  });

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

  const fixedTarifa = 24.2;
  const fixedTarifaExtra = 30;

  document.querySelectorAll("#invoiceItems tr").forEach(row => {
    const inicio = row.querySelector(".inicio").value;
    const final = row.querySelector(".final").value;
    const horasExtra = parseFloat(row.querySelector(".horasExtra").value) || 0;
    const uberYes = row.querySelector(".uber").value === "1";
    const ivaYes = row.querySelector(".iva").value === "1";

    if (uberYes) uberCount++;

    const horas = calculateHours(inicio, final);
    row.querySelector(".horas").textContent = horas.toFixed(2);

    let total = horas * fixedTarifa + horasExtra * fixedTarifaExtra;
    if (ivaYes) total += total * 0.21; // add 21% IVA if checked

    row.querySelector(".total").textContent = total.toFixed(2);

    subtotal += total;
  });

  const ivaAmount = subtotal * 0.21;
  const irpfAmount = subtotal * 0.15;
  const grandTotal = subtotal + ivaAmount - irpfAmount;

  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("ivaAmount").textContent = ivaAmount.toFixed(2);
  document.getElementById("irpfAmount").textContent = irpfAmount.toFixed(2);
  document.getElementById("grandTotal").textContent = grandTotal.toFixed(2);

  const uberNote = document.getElementById("uberNote");
  if (uberNote) uberNote.textContent = uberCount > 0 ? `${uberCount} Uber(s) a incluir` : "";
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
  const lugar = row.querySelector(".lugarDropdown").value === "Otro"
    ? row.querySelector(".lugar").value
    : row.querySelector(".lugarDropdown").value;
  const actividad = row.querySelector(".actividadDropdown").value === "Otro"
    ? row.querySelector(".actividad").value
    : row.querySelector(".actividadDropdown").value;
  const inicio = row.querySelector(".inicio").value;
  const final = row.querySelector(".final").value;
  const horas = row.querySelector(".horas").textContent;
  const tarifa = row.querySelector("td:nth-child(7)").textContent;
  const horasExtra = row.querySelector(".horasExtra").value;
  const tarifaExtra = row.querySelector("td:nth-child(9)").textContent;
  const iva = parseInt(row.querySelector(".iva").value);
  const total = row.querySelector(".total").textContent;
  const uber = parseInt(row.querySelector(".uber").value);
  if(uber) uberCount++;

  rows.push([fecha, lugar, actividad, inicio, final, horas, tarifa, horasExtra, tarifaExtra, uber ? "Si" : "No", iva ? "Si" : "No", total]);
});

// Auto-fit table width to page
doc.autoTable({
  head: [["Fecha","Lugar de trabajo","Actividad","Inicio","Final","Horas","Tarifa (€/hora) + IVA","Horas extra","Tarifa horas extra (€/hora) + IVA","Uber","IVA","Total (€)"]],
  body: rows,
  startY: y + 10,
  theme: "striped",
  headStyles: { fillColor: [52, 73, 94], textColor: 255 },
  styles: { fontSize: 8, cellPadding: 2 },
  tableWidth: 'auto',          // auto-fit width
  showHead: 'everyPage'
});

// ---- TOTALS SECTION ----
let finalY = doc.lastAutoTable.finalY + 10;

const subtotal = parseFloat(document.getElementById("subtotal").textContent) || 0;
const ivaAmount = parseFloat(document.getElementById("ivaAmount").textContent) || 0;
const irpfAmount = parseFloat(document.getElementById("irpfAmount").textContent) || 0;
const grandTotal = parseFloat(document.getElementById("grandTotal").textContent) || 0;

// Print totals neatly in PDF
doc.setFont("helvetica", "normal");
doc.setFontSize(11);
doc.text(`Subtotal: ${subtotal.toFixed(2)}€`, 140, finalY);
doc.text(`IVA (21%): ${ivaAmount.toFixed(2)}€`, 140, finalY + 6);
doc.text(`IRPF (15%): ${irpfAmount.toFixed(2)}€`, 140, finalY + 12);

doc.setFont("helvetica", "bold");
doc.text(`Total: ${grandTotal.toFixed(2)}€`, 140, finalY + 18);

// Add Uber note below Grand Total
if(uberCount > 0){
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
doc.text(`${uberCount} Uber(s) a incluir`, 140, finalY + 24);
  }

  doc.save(`invoice_${clientInfo.name.replace(/\s+/g, "_")}.pdf`);
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

document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
});

function toggleTheme() {
  document.body.classList.toggle("dark");
  const btn = document.getElementById("themeToggle");
  if (document.body.classList.contains("dark")) {
    btn.textContent = "☀️";
  } else {
    btn.textContent = "🌙";
  }
}

