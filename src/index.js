const participantsForm = document.querySelector("#participants-form");
const participantsList = document.querySelector("#participants-list");
const addParticipantButton = document.querySelector("#add-participant");
const resetSplitButton = document.querySelector("#reset-split");
const resultsSection = document.querySelector("#results");
const summaryList = document.querySelector("#summary-list");
const transfersList = document.querySelector("#transfers-list");
const totalAmount = document.querySelector("#total-amount");
const averageAmount = document.querySelector("#average-amount");
const themeToggle = document.querySelector("#theme-toggle");
const themeToggleLabel = document.querySelector("#theme-toggle-label");
const currentYear = document.querySelector("#current-year");
const visitCount = document.querySelector("#visit-count");
const historyList = document.querySelector("#history-list");
const historyEmpty = document.querySelector("#history-empty");
const clearHistoryButton = document.querySelector("#clear-history");

const HISTORY_KEY = "splitMeetHistory";
const MAX_HISTORY_ITEMS = 10;

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

function parseAmountToCents(value) {
  const normalizedValue = value.trim().replace(",", ".");

  if (normalizedValue === "") {
    return 0;
  }

  const [integerPart = "0", decimalPart = ""] = normalizedValue.split(".");
  const safeIntegerPart = integerPart.replace(/\D/g, "") || "0";
  const safeDecimalPart = decimalPart.replace(/\D/g, "").padEnd(2, "0").slice(0, 2);

  return Number(safeIntegerPart) * 100 + Number(safeDecimalPart);
}

function formatMoney(cents) {
  return currencyFormatter.format(cents / 100);
}

function getInitialTheme() {
  const savedTheme = localStorage.getItem("splitMeetTheme");

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  const isDark = theme === "dark";

  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggleLabel.textContent = isDark ? "Modo claro" : "Modo oscuro";
  localStorage.setItem("splitMeetTheme", theme);
}

function updateVisitCounter() {
  const savedVisits = Number(localStorage.getItem("splitMeetVisits"));
  const visits = Number.isFinite(savedVisits) ? savedVisits + 1 : 1;

  localStorage.setItem("splitMeetVisits", String(visits));
  visitCount.textContent = new Intl.NumberFormat("es-AR").format(visits);
}

function getSavedHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

function saveHistoryEntry(entry) {
  const history = getSavedHistory();
  const updatedHistory = [entry, ...history].slice(0, MAX_HISTORY_ITEMS);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  renderHistory();
}

function renderHistory() {
  const history = getSavedHistory();

  historyList.innerHTML = "";
  historyEmpty.hidden = history.length > 0;

  history.forEach((entry) => {
    const item = document.createElement("li");
    const header = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    const transfers = document.createElement("small");

    title.textContent = formatMoney(entry.total);
    meta.textContent = `${entry.participantsCount} participantes - ${entry.createdAt}`;

    if (entry.transfers.length === 0) {
      transfers.textContent = "Sin pagos pendientes.";
    } else {
      transfers.textContent = entry.transfers
        .map((transfer) => `${transfer.from} paga ${formatMoney(transfer.amount)} a ${transfer.to}`)
        .join(" | ");
    }

    header.append(title, meta);
    item.append(header, transfers);
    historyList.appendChild(item);
  });
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
}

function hideCurrentResults() {
  resultsSection.hidden = true;
}

function resetCurrentSplit() {
  participantsList.innerHTML = "";
  summaryList.innerHTML = "";
  transfersList.innerHTML = "";
  totalAmount.textContent = formatMoney(0);
  averageAmount.textContent = formatMoney(0);
  hideCurrentResults();
  createParticipantRow("Persona 1", "0");
  createParticipantRow("Persona 2", "0");
}

function selectInputContent(input) {
  input.addEventListener("focus", () => input.select());
  input.addEventListener("click", () => input.select());
}

function createParticipantRow(name = "", amount = "") {
  const row = document.createElement("div");
  row.className = "participant-row";
  row.innerHTML = `
    <label>
      <span>Participante</span>
      <input
        type="text"
        name="name"
        placeholder="Nombre"
        value="${name}"
        required
      />
    </label>
    <label>
      <span>Gastó</span>
      <input
        type="number"
        name="amount"
        placeholder="0"
        min="0"
        step="0.01"
        value="${amount}"
        required
      />
    </label>
    <button class="icon-button remove-participant" type="button" aria-label="Quitar participante">
      &times;
    </button>
  `;

  row.querySelector(".remove-participant").addEventListener("click", () => {
    if (participantsList.children.length > 2) {
      row.remove();
      hideCurrentResults();
    }
  });

  row.querySelectorAll("input").forEach(selectInputContent);
  participantsList.appendChild(row);
}

function getParticipants() {
  return Array.from(participantsList.querySelectorAll(".participant-row"))
    .map((row) => {
      const name = row.querySelector("[name='name']").value.trim();
      const amount = parseAmountToCents(row.querySelector("[name='amount']").value);

      return {
        name,
        amount,
      };
    })
    .filter((participant) => participant.name !== "");
}

function calculateBalances(participants) {
  const total = participants.reduce((sum, participant) => sum + participant.amount, 0);
  const baseShare = Math.floor(total / participants.length);
  const remainder = total % participants.length;

  const balances = participants.map((participant, index) => ({
    ...participant,
    share: baseShare + (index < remainder ? 1 : 0),
    balance: participant.amount - (baseShare + (index < remainder ? 1 : 0)),
  }));

  return { total, average: total / participants.length, balances };
}

function calculateTransfers(balances) {
  const debtors = balances
    .filter((participant) => participant.balance < 0)
    .map((participant) => ({
      name: participant.name,
      amount: Math.abs(participant.balance),
    }));

  const creditors = balances
    .filter((participant) => participant.balance > 0)
    .map((participant) => ({
      name: participant.name,
      amount: participant.balance,
    }));

  const transfers = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount === 0) debtorIndex += 1;
    if (creditor.amount === 0) creditorIndex += 1;
  }

  return transfers;
}

function renderResults({ total, average, balances }) {
  const transfers = calculateTransfers(balances);

  totalAmount.textContent = formatMoney(total);
  averageAmount.textContent = formatMoney(average);
  summaryList.innerHTML = "";
  transfersList.innerHTML = "";

  balances.forEach((participant) => {
    const item = document.createElement("li");
    const details = document.createElement("span");
    const participantName = document.createElement("strong");
    const participantAmount = document.createElement("small");
    const status = document.createElement("span");
    const statusClass = participant.balance >= 0 ? "positive" : "negative";
    const statusText =
      participant.balance >= 0
        ? `Debe recibir ${formatMoney(participant.balance)}`
        : `Debe pagar ${formatMoney(Math.abs(participant.balance))}`;

    participantName.textContent = participant.name;
    participantAmount.textContent = `Gastó ${formatMoney(participant.amount)}`;
    status.className = statusClass;
    status.textContent = statusText;

    details.append(participantName, participantAmount);
    item.append(details, status);
    summaryList.appendChild(item);
  });

  if (transfers.length === 0) {
    const item = document.createElement("li");
    item.textContent = "Las cuentas ya están saldadas.";
    transfersList.appendChild(item);
  } else {
    transfers.forEach((transfer) => {
      const item = document.createElement("li");
      const description = document.createElement("span");
      const from = document.createElement("strong");
      const to = document.createElement("strong");
      const amount = document.createElement("span");

      from.textContent = transfer.from;
      to.textContent = transfer.to;
      amount.textContent = formatMoney(transfer.amount);

      description.append(from, " le paga a ", to);
      item.append(description, amount);
      transfersList.appendChild(item);
    });
  }

  resultsSection.hidden = false;
}

function calculateSplit() {
  const participants = getParticipants();

  if (participants.length < 2) {
    resultsSection.hidden = true;
    return null;
  }

  const result = calculateBalances(participants);

  renderResults(result);
  return {
    ...result,
    participantsCount: participants.length,
    transfers: calculateTransfers(result.balances),
  };
}

addParticipantButton.addEventListener("click", () => {
  createParticipantRow();
  hideCurrentResults();
});
resetSplitButton.addEventListener("click", resetCurrentSplit);
themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme;
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});
participantsForm.addEventListener("input", hideCurrentResults);
participantsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = calculateSplit();

  if (!result) {
    return;
  }

  saveHistoryEntry({
    createdAt: new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date()),
    participantsCount: result.participantsCount,
    total: result.total,
    transfers: result.transfers,
  });
});
clearHistoryButton.addEventListener("click", clearHistory);

applyTheme(getInitialTheme());
currentYear.textContent = new Date().getFullYear();
updateVisitCounter();
renderHistory();
resetCurrentSplit();
