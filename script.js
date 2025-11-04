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
<td style="width:80px;" class="horasCell">
  <span class="horasExtra">0.00</span>
  <button class="editHoras" title="Editar horas extra" style="margin-left:4px;">✏️</button>
</td>
    <td style="width:50px;">
      <select class="uber">
        <option value="0">No</option>
        <option value="1">Si</option>
      </select>
    </td>
    <td style="width:100px;" class="totalCell">
  <input type="number" class="totalInput" value="0.00" step="0.01" style="width:60px;">
  <span class="extraPrice" style="margin-left:4px; font-size:0.8em; color:#555;">+0.00</span>
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

  const fixedTarifaExtra = 24.2; // Extra hours rate
  const maxNormalHours = 10;
  const uberPrice = 0; // Adjust if needed

  document.querySelectorAll("#invoiceItems tr").forEach(row => {
    const inicio = row.querySelector(".inicio").value;
    const final = row.querySelector(".final").value;
    const uberYes = row.querySelector(".uber").value === "1";

    // Calculate hours
    let totalHours = calculateHours(inicio, final);
    let normalHours = Math.min(totalHours, maxNormalHours);
    let extraHours = Math.max(totalHours - maxNormalHours, 0);

    row.querySelector(".horas").textContent = normalHours.toFixed(2);
    row.querySelector(".horasExtra").textContent = extraHours.toFixed(2);

    // Calculate extra hours price
    const extraPrice = extraHours * fixedTarifaExtra;
    row.querySelector(".extraPrice").textContent = `+${extraPrice.toFixed(2)}€`;

    // Get user input total
    const userTotal = parseFloat(row.querySelector(".totalInput").value) || 0;

    // Add both user total and extra hours to subtotal
    subtotal += userTotal + extraPrice + (uberYes ? uberPrice : 0);

    if (uberYes) uberCount++;
  });

  const ivaAmount = subtotal * 0.21;
  const irpfAmount = subtotal * 0.15;
  const grandTotal = subtotal + ivaAmount - irpfAmount;

  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("ivaAmount").textContent = ivaAmount.toFixed(2);
  document.getElementById("irpfAmount").textContent = irpfAmount.toFixed(2);
  document.getElementById("grandTotal").textContent = grandTotal.toFixed(2);
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
  const clientLogos = {
    DOS40: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/…", // truncated
    nologo: null
  };
  const clientId = document.getElementById("clientSelect").value;
  const logoBase64 = clientLogos[clientId] || null;
  const pageWidth = doc.internal.pageSize.getWidth();

  if (logoBase64) {
    try {
      const imgWidth = 40;
      const imgHeight = 40;
      const imgX = pageWidth - imgWidth - 20;
      const imgY = 48;
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
    const horasExtra = parseFloat(row.querySelector(".horasExtra").textContent) || 0;

    // Take the user-edited total from input box
    const totalInput = parseFloat(row.querySelector(".totalInput").value) || 0;

    // Append extra hours info only if > 0
    let totalText = totalInput.toFixed(2);
    if (horasExtra > 0) {
      const extraPrice = parseFloat(row.querySelector(".extraPrice").textContent.replace('+','').replace('€','')) || 0;
      totalText += ` + ${horasExtra}h extra (${extraPrice.toFixed(2)}€)`;
    }

    const uber = parseInt(row.querySelector(".uber").value);
    if (uber) uberCount++;

    // Correct column order: Fecha, Lugar, Actividad, Inicio, Final, Horas, Uber, Total
    rows.push([fecha, lugar, actividad, inicio, final, horas, uber ? "Si" : "No", totalText]);
  });

  doc.autoTable({
    head: [["Fecha","Lugar de trabajo","Actividad","Inicio","Final","Horas","Uber","Total (€)"]],
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
  doc.save(`factura_${invoiceDate}.pdf`);
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

