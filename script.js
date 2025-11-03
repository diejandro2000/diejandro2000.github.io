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

function addItem(item = { name: "", qty: 1, price: 0 }) {
  const tbody = document.getElementById("invoiceItems");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" class="item" value="${item.name}"></td>
    <td><input type="number" class="qty" value="${item.qty}" min="1"></td>
    <td><input type="number" class="price" value="${item.price}" step="0.01"></td>
    <td class="total">$0.00</td>
    <td><button class="remove">❌</button></td>
  `;
  tbody.appendChild(row);

  row.querySelectorAll("input").forEach(input => input.addEventListener("input", updateTotals));
  row.querySelector(".remove").addEventListener("click", () => {
    row.remove();
    updateTotals();
  });
  updateTotals();
}

function updateTotals() {
  let subtotal = 0;
  document.querySelectorAll("#invoiceItems tr").forEach(row => {
    const qty = parseFloat(row.querySelector(".qty").value) || 0;
    const price = parseFloat(row.querySelector(".price").value) || 0;
    const total = qty * price;
    row.querySelector(".total").textContent = `$${total.toFixed(2)}`;
    subtotal += total;
  });

  const taxRate = parseFloat(document.getElementById("taxRate").value) || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("taxAmount").textContent = taxAmount.toFixed(2);
  document.getElementById("grandTotal").textContent = grandTotal.toFixed(2);
}

function generatePDF() {
  const pdf = new jsPDF();
  const clientName = document.getElementById("clientName").value || "Client";
  const invoiceNumber = document.getElementById("invoiceNumber").value || "0000";
  const invoiceDate = document.getElementById("invoiceDate").value || new Date().toLocaleDateString();

  pdf.setFontSize(16);
  pdf.text("Invoice", 14, 20);
  pdf.setFontSize(10);
  pdf.text(`Client: ${clientName}`, 14, 30);
  pdf.text(`Invoice #: ${invoiceNumber}`, 14, 36);
  pdf.text(`Date: ${invoiceDate}`, 14, 42);

  const rows = [];
  document.querySelectorAll("#invoiceItems tr").forEach(row => {
    const item = row.querySelector(".item").value;
    const qty = row.querySelector(".qty").value;
    const price = row.querySelector(".price").value;
    const total = (qty * price).toFixed(2);
    rows.push([item, qty, `$${price}`, `$${total}`]);
  });

  pdf.autoTable({
    head: [["Item", "Qty", "Price", "Total"]],
    body: rows,
    startY: 50,
  });

  const finalY = pdf.lastAutoTable.finalY + 10;
  const total = document.getElementById("grandTotal").textContent;

  pdf.text(`Total: $${total}`, 14, finalY);
  pdf.text("Thank you for your business!", 14, finalY + 10);

  pdf.save(`Invoice-${clientName}.pdf`);
}

function saveInvoice() {
  const data = {
    clientName: document.getElementById("clientName").value,
    invoiceNumber: document.getElementById("invoiceNumber").value,
    invoiceDate: document.getElementById("invoiceDate").value,
    taxRate: document.getElementById("taxRate").value,
    items: Array.from(document.querySelectorAll("#invoiceItems tr")).map(row => ({
      name: row.querySelector(".item").value,
      qty: row.querySelector(".qty").value,
      price: row.querySelector(".price").value
    }))
  };
  localStorage.setItem("invoiceData", JSON.stringify(data));
  alert("Invoice saved locally!");
}

function loadInvoice() {
  const saved = JSON.parse(localStorage.getItem("invoiceData"));
  if (!saved) return;
  document.getElementById("clientName").value = saved.clientName || "";
  document.getElementById("invoiceNumber").value = saved.invoiceNumber || "";
  document.getElementById("invoiceDate").value = saved.invoiceDate || "";
  document.getElementById("taxRate").value = saved.taxRate || 10;
  document.getElementById("invoiceItems").innerHTML = "";
  (saved.items || []).forEach(addItem);
  updateTotals();
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  document.getElementById("themeToggle").textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
}
