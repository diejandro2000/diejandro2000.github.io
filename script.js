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
  DOS40: {
    name: "DOS40 SOLUCIONES AUDIOVISUALES Y EVENTOS S.L.U.",
    address: "Plaza de la Constitución 2, Hoyo de Manzanares, 28240 Madrid, España",
    number: "B87799730"
  },
  nologo: {
    name: "Maria Gonzalez",
    address: "Avenida Siempre Viva 45, 28002, Madrid, España",
    number: "123456"
  }
};

function addItem(item = {}) {
  const tbody = document.getElementById("invoiceItems");
  const row = document.createElement("tr");

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
    <td style="width:80px;" class="horasCell">
  <span class="horas">0.00</span>
  <button class="editHoras" title="Editar horas" style="margin-left:4px;">✏️</button>
</td>
    <td style="width:50px;"><input type="number" class="horasExtra" value="${item.horasExtra || 0}" step="0.01" style="width:60px;"></td>
    <td style="width:50px;">
      <select class="uber">
        <option value="0">No</option>
        <option value="1">Si</option>
      </select>
    </td>
    <td style="width:80px;" class="totalCell">
  <span class="total">0.00</span>
  <button class="editTotal" title="Editar total" style="margin-left:4px;">✏️</button>
</td>
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

// Allow editing hours manually
row.querySelector(".editHoras").addEventListener("click", () => {
  const span = row.querySelector(".horas");
  const currentValue = span.textContent;
  const input = document.createElement("input");
  input.type = "number";
  input.value = currentValue;
  input.step = "0.01";
  input.style.width = "60px";
  span.replaceWith(input);
  input.focus();

  input.addEventListener("blur", () => {
    const newValue = parseFloat(input.value) || 0;
    const newSpan = document.createElement("span");
    newSpan.className = "horas";
    newSpan.textContent = newValue.toFixed(2);
    input.replaceWith(newSpan);
    updateTotals();
  });
});

// Allow editing total manually
row.querySelector(".editTotal").addEventListener("click", () => {
  const span = row.querySelector(".total");
  const currentValue = span.textContent;
  const input = document.createElement("input");
  input.type = "number";
  input.value = currentValue;
  input.step = "0.01";
  input.style.width = "70px";
  span.replaceWith(input);
  input.focus();

  input.addEventListener("blur", () => {
    const newValue = parseFloat(input.value) || 0;
    const newSpan = document.createElement("span");
    newSpan.className = "total";
    newSpan.textContent = newValue.toFixed(2);
    input.replaceWith(newSpan);
    updateTotals();
  });
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

    if (uberYes) uberCount++;

    const horas = calculateHours(inicio, final);
    row.querySelector(".horas").textContent = horas.toFixed(2);

    let total = horas * fixedTarifa + horasExtra * fixedTarifaExtra;

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

  const invoiceNumber = document.getElementById("invoiceNumber").value || "0000";
  let y = 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`FACTURA Nº ${invoiceNumber}`, 14, y);

  const invoiceDate = document.getElementById("invoiceDate").value || new Date().toLocaleDateString();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Fecha de emisión: ${invoiceDate}`, 140, y);

  // ---- CLIENT LOGOS (BASE64) ----
  // Replace the string below with your actual Base64 logos
  const clientLogos = {
    DOS40: "data:image/jpeg;base64,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",
    nologo: null
  };

  const clientId = document.getElementById("clientSelect").value;
  const logoBase64 = clientLogos[clientId] || null;
  const pageWidth = doc.internal.pageSize.getWidth();

  	if (logoBase64) {
	    try {
	      const imgWidth = 40;
	      const imgHeight = 40;
	      const imgY = 48; // 👈 lowered from 15 → 42 to align with details
	      const imgX = pageWidth - imgWidth - 20;
	      doc.addImage(logoBase64, "PNG", imgX, imgY, imgWidth, imgHeight);
	    } catch (err) {
	      console.warn("⚠️ Could not embed logo:", err);
	    }
	  }

  // ---- BUSINESS INFO ----
  y = 30;
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

  const clientInfo = clients[clientId] || { name: "Client Name", address: "", number: "" };

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text(`Para: ${clientInfo.name}`, 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  if (clientInfo.address) doc.text(clientInfo.address, 14, y);
  if (clientInfo.number) {
    y += 6;
    doc.text(`NIF: ${clientInfo.number}`, 14, y);
  }

  // ---- TABLE ----
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
    const total = row.querySelector(".total").textContent;
    const uber = parseInt(row.querySelector(".uber").value);
    if (uber) uberCount++;

    rows.push([
      fecha, lugar, actividad, inicio, final, horas,
      tarifa, horasExtra, tarifaExtra,
      uber ? "Si" : "No", total
    ]);
  });

  doc.autoTable({
    head: [[
      "Fecha","Lugar de trabajo","Actividad","Inicio","Final","Horas",
      "Tarifa (€/hora) + IVA","Horas extra","Tarifa horas extra (€/hora) + IVA",
      "Uber","Total (€)"
    ]],
    body: rows,
    startY: y + 10,
    theme: "striped",
    headStyles: { fillColor: [52, 73, 94], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
    tableWidth: 'auto',
    showHead: 'everyPage'
  });

  // ---- TOTALS ----
  const finalY = doc.lastAutoTable.finalY + 10;
  const subtotal = parseFloat(document.getElementById("subtotal").textContent) || 0;
  const ivaAmount = parseFloat(document.getElementById("ivaAmount").textContent) || 0;
  const irpfAmount = parseFloat(document.getElementById("irpfAmount").textContent) || 0;
  const grandTotal = parseFloat(document.getElementById("grandTotal").textContent) || 0;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Subtotal: ${subtotal.toFixed(2)}€`, 140, finalY);
  doc.text(`IVA (21%): ${ivaAmount.toFixed(2)}€`, 140, finalY + 6);
  doc.text(`IRPF (15%): ${irpfAmount.toFixed(2)}€`, 140, finalY + 12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${grandTotal.toFixed(2)}€`, 140, finalY + 18);

  if (uberCount > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text(`${uberCount} Uber(s) a incluir`, 140, finalY + 24);
  }

  // ---- SAVE PDF ----
  doc.save(`invoice_${invoiceDate}.pdf`);
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

