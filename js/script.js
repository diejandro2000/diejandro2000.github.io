const { jsPDF } = window.jspdf;

document.getElementById("addItem").addEventListener("click", addItem);
document.getElementById("generatePDF").addEventListener("click", generatePDF);

function addItem() {
  const tbody = document.getElementById("invoiceItems");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" class="item"></td>
    <td><input type="number" class="qty" value="1" min="1"></td>
    <td><input type="number" class="price" value="0" step="0.01"></td>
    <td class="total">$0.00</td>
  `;
  tbody.appendChild(row);
  row.querySelectorAll("input").forEach(input => input.addEventListener("input", updateTotals));
}

function updateTotals() {
  let grandTotal = 0;
  document.querySelectorAll("#invoiceItems tr").forEach(row => {
    const qty = parseFloat(row.querySelector(".qty").value) || 0;
    const price = parseFloat(row.querySelector(".price").value) || 0;
    const total = qty * price;
    row.querySelector(".total").textContent = `$${total.toFixed(2)}`;
    grandTotal += total;
  });
  document.getElementById("grandTotal").textContent = grandTotal.toFixed(2);
}

function generatePDF() {
  const pdf = new jsPDF();
  const clientName = document.getElementById("clientName").value;
  const total = document.getElementById("grandTotal").textContent;
  
  pdf.text(`Invoice for: ${clientName}`, 10, 10);
  pdf.text(`Total: $${total}`, 10, 20);
  pdf.text("Thank you for your business!", 10, 30);
  pdf.save(`Invoice-${clientName}.pdf`);
}
