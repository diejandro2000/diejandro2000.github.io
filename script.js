document.addEventListener("DOMContentLoaded", () => {
  loadClients();
  loadInvoice();

  document.getElementById("addItem").addEventListener("click", addItem);
  document.getElementById("addEquipo").addEventListener("click", () => addEquipoItem());
  document.getElementById("generatePDF").addEventListener("click", generatePDF);
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);

  // Load saved theme
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    document.getElementById("themeToggle").textContent = "☀️";
  }

  // Client manager
  document.getElementById("manageClients").addEventListener("click", openClientModal);
  document.getElementById("closeClientModal").addEventListener("click", closeClientModal);
  document.getElementById("saveClient").addEventListener("click", saveClient);
  document.getElementById("cancelEditClient").addEventListener("click", clearClientForm);

  document.getElementById("clientModal").addEventListener("click", function(e) {
    if (e.target === this) closeClientModal();
  });

  // Version history
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
  },
  Lopezgarcia: {
    name: "LÓPEZ GARCÍA SONORIZACIONES S.L.",
    address: "C/Maqueda 28 1D 28024 Madrid",
    number: "B-86354388",
    label: "LÓPEZ GARCÍA SONORIZACIONES S.L."
  },
  angelica: {
    name: "Angélica Uceda García",
    address: "C/Menorca 1, Móstoles Madrid",
    number: "05332789D",
    label: "Angélica Uceda García"
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

// ==========================
// CLIENT MODAL
// ==========================

function openClientModal() {
  renderClientList();
  clearClientForm();

  const modal = document.getElementById("clientModal");
  modal.style.display = "flex";
  modal.style.pointerEvents = "auto";
}

function closeClientModal() {
  const modal = document.getElementById("clientModal");
  modal.style.display = "none";
  modal.style.pointerEvents = "none";
}

function renderClientList() {
  const custom = getCustomClients();
  const listEl = document.getElementById("clientList");

  listEl.innerHTML = "";

  const builtinHeader = document.createElement("p");
  builtinHeader.innerHTML = `
    <strong>Clientes predefinidos</strong>
    <span style="font-size:0.8em;color:#888;">
      (no editables)
    </span>
  `;

  listEl.appendChild(builtinHeader);

  Object.entries(DEFAULT_CLIENTS).forEach(([key, info]) => {
    const row = document.createElement("div");

    row.style.cssText = `
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:10px 0;
      border-bottom:1px solid rgba(255,255,255,0.08);
      gap:8px;
    `;

    row.innerHTML = `
      <span style="flex:1; font-size:0.9em;">
        <strong>${info.label || info.name}</strong><br>
        <small style="color:#aaa;">
          ${info.address} — ${info.number}
        </small>
      </span>
    `;

    listEl.appendChild(row);
  });

  const customKeys = Object.keys(custom);

  if (customKeys.length > 0) {
    const customHeader = document.createElement("p");

    customHeader.innerHTML = `
      <strong style="margin-top:12px; display:block;">
        Clientes añadidos
      </strong>
    `;

    listEl.appendChild(customHeader);

    customKeys.forEach(key => {
      const info = custom[key];

      const row = document.createElement("div");

      row.style.cssText = `
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:10px 0;
        border-bottom:1px solid rgba(255,255,255,0.08);
        gap:8px;
      `;

      row.innerHTML = `
        <span style="flex:1; font-size:0.9em;">
          <strong>${info.label || info.name}</strong><br>
          <small style="color:#aaa;">
            ${info.address} — ${info.number}
          </small>
        </span>

        <button class="editClientBtn"
          data-key="${key}"
          style="
            background:#f59e0b;
            padding:4px 8px;
            font-size:0.8em;
          ">
          ✏️
        </button>

        <button class="deleteClientBtn"
          data-key="${key}"
          style="
            background:#ef4444;
            padding:4px 8px;
            font-size:0.8em;
          ">
          🗑️
        </button>
      `;

      listEl.appendChild(row);
    });

    listEl.querySelectorAll(".editClientBtn").forEach(btn => {
      btn.addEventListener("click", () => startEditClient(btn.dataset.key));
    });

    listEl.querySelectorAll(".deleteClientBtn").forEach(btn => {
      btn.addEventListener("click", () => deleteClient(btn.dataset.key));
    });

  } else {
    const none = document.createElement("p");

    none.textContent = "Aún no has añadido clientes propios.";
    none.style.color = "#888";
    none.style.fontSize = "0.9em";

    listEl.appendChild(none);
  }
}

function clearClientForm() {
  document.getElementById("editClientKey").value = "";
  document.getElementById("newClientLabel").value = "";
  document.getElementById("newClientName").value = "";
  document.getElementById("newClientAddr").value = "";
  document.getElementById("newClientNIF").value = "";

  document.getElementById("clientFormTitle").textContent =
    "➕ Añadir nuevo cliente";

  document.getElementById("cancelEditClient").style.display = "none";
}

function startEditClient(key) {
  const custom = getCustomClients();
  const info = custom[key];

  if (!info) return;

  document.getElementById("editClientKey").value = key;
  document.getElementById("newClientLabel").value = info.label || "";
  document.getElementById("newClientName").value = info.name || "";
  document.getElementById("newClientAddr").value = info.address || "";
  document.getElementById("newClientNIF").value = info.number || "";

  document.getElementById("clientFormTitle").textContent =
    "✏️ Editar cliente";

  document.getElementById("cancelEditClient").style.display = "inline-block";

  document.getElementById("newClientLabel").focus();
}

function deleteClient(key) {
  if (!confirm("¿Eliminar este cliente?")) return;

  const custom = getCustomClients();

  delete custom[key];

  saveCustomClients(custom);

  renderClientList();
  updateStorageBar();
}

function saveClient() {
  const label = document.getElementById("newClientLabel").value.trim();
  const name = document.getElementById("newClientName").value.trim();
  const address = document.getElementById("newClientAddr").value.trim();
  const number = document.getElementById("newClientNIF").value.trim();
  const editKey = document.getElementById("editClientKey").value.trim();

  if (!label || !name) {
    alert("El nombre es obligatorio.");
    return;
  }

  const custom = getCustomClients();

  const key = editKey || ("custom_" + Date.now());

  custom[key] = {
    label,
    name,
    address,
    number
  };

  saveCustomClients(custom);

  renderClientList();
  clearClientForm();
  updateStorageBar();

  alert(`✅ Cliente "${label}" guardado.`);
}

// ==========================
// THEME
// ==========================

function toggleTheme() {
  document.body.classList.toggle("dark");

  const dark = document.body.classList.contains("dark");

  localStorage.setItem("theme", dark ? "dark" : "light");

  document.getElementById("themeToggle").textContent =
    dark ? "☀️" : "🌑";
}
