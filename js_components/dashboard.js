function showTab(id) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
  });

  document.querySelectorAll(".tab-content").forEach(content => {
    content.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");
  event.target.classList.add("active");
}
//////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", async () => {

  const api = window.parent.api;

  const salesBox = document.querySelector(".dashboard-sales h2:nth-child(2)");
  const profitBox = document.querySelector(".dashboard-profit h2:nth-child(2)");
  const lowStockBox = document.querySelector(".dashboard-lowstock h2:nth-child(2)");

  const { todaySales, todayProfit } = await api.fetchTodaySummary();

  salesBox.innerText = "₹" + todaySales.toLocaleString("en-IN");
  profitBox.innerText = "₹" + todayProfit.toLocaleString("en-IN");

  const lowStockCount = await api.fetchLowStockCount();
  lowStockBox.innerText = lowStockCount;

  // ⬇️ Load last 5 bills
  loadLastBills();
});


async function loadLastBills() {
  const list = document.getElementById("lastBilling");
  const bills = await window.parent.api.fetchLastBills();

  // ✅ STEP 1: latest bill per customer
  const latestBillsMap = {};

  bills.forEach(bill => {
    const cust = bill.customer_name;

    if (
      !latestBillsMap[cust] ||
      new Date(bill.created_at) > new Date(latestBillsMap[cust].created_at)
    ) {
      latestBillsMap[cust] = bill;
    }
  });

  const latestBills = Object.values(latestBillsMap);

  // ✅ STEP 2: render only latest bills
  list.innerHTML = `
    ${latestBills.map(bill => {

      const paid = bill.total - bill.remaining;

      const date = new Date(bill.created_at);
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      const formattedDate = `${localDate.toLocaleDateString()} ${localDate.toLocaleTimeString()}`;

      let statusClass = "";
      let statusText = "";

      if (paid === 0) {
        statusClass = "status-unpaid";
        statusText = "Unpaid";
      } 
      else if (paid < bill.total) {
        statusClass = "status-remaining";
        statusText = `Remaining: ₹${bill.remaining}`;
      } 
      else {
        statusClass = "status-paid";
        statusText = "Paid";
      }

      return `
        <div class="card" data-bill-id="${bill.id}">
          <div>
            <h4>${bill.customer_name}</h4>
            <p>Bill No: ${bill.id}</p>
            <p>${formattedDate}</p>
          </div>

          <div class="status ${statusClass}">
            <span class="amount-black">
              ₹${paid.toLocaleString("en-IN")} / ₹${bill.total.toLocaleString("en-IN")}
            </span>
            <br/>
            ${statusText}
          </div>
        </div>
      `;
      
    }).join("")}
  `;
  list.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", () => {
    const billId = card.getAttribute("data-bill-id");

    localStorage.setItem("fromPage", "last_bill");
    localStorage.setItem("previewBillId", billId);

    window.location.href = "../html_components/display.html";
  });
});

  
}


//////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", async () => {
  loadRemainingData();
});

async function loadRemainingData() {
  const bills = await window.parent.api.fetchBill();

  // Map latest bill per customer
  const latestBillMap = {};
  bills.forEach(bill => {
    const key = bill.customer_name + "_" + bill.mobile;
    if (!latestBillMap[key] || bill.id > latestBillMap[key].id) {
      latestBillMap[key] = bill;
    }
  });

  // Only latest bills with remaining > 0
  const latestBills = Object.values(latestBillMap).filter(b => b.remaining > 0);

  // Total remaining
  const totalRemain = latestBills.reduce((sum, b) => sum + b.remaining, 0);
  document.getElementById("totalRemainingAmount").innerText =
    "₹" + totalRemain.toLocaleString("en-IN");

  document.getElementById("remainingCustomerCount").innerText = latestBills.length;

  // Table
  const tableBody = document.getElementById("remainingTableBody");
  tableBody.innerHTML = "";

  latestBills.forEach(bill => {
    const date = new Date(bill.created_at);
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    const formattedDate = localDate.toLocaleDateString("en-IN");

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formattedDate}</td>
      <td>${bill.id}</td>
      <td>${bill.customer_name}</td>
      <td>₹${bill.total}</td>
      <td>₹${bill.remaining}</td>
      <td><button class="pay-btn">Pay</button></td>
    `;
    tableBody.appendChild(row);

    const payBtn = row.querySelector(".pay-btn");
    payBtn.addEventListener("click", () => openPayModal(bill));
  });

  // PAY MODAL
  const modal = document.getElementById("payModal");
  const closeModal = document.getElementById("closeModal");
  const modalTotal = document.getElementById("modalTotal");
  const modalRemaining = document.getElementById("modalRemaining");
  const payAmountInput = document.getElementById("payAmount");
  const payError = document.getElementById("payError");
  const confirmPayBtn = document.getElementById("confirmPayBtn");

  let currentBill = null;

  function openPayModal(bill) {
    currentBill = bill;
    modal.style.display = "block";
    modalTotal.innerText = bill.total;
    modalRemaining.innerText = bill.remaining;
    payAmountInput.value = "";
    payError.innerText = "";
  }

  closeModal.onclick = () => modal.style.display = "none";
  window.onclick = (event) => { if (event.target === modal) modal.style.display = "none"; }

  payAmountInput.addEventListener("input", () => {
    const value = Number(payAmountInput.value);
    if (value > currentBill.remaining) {
      payError.innerText = "Amount cannot exceed remaining!";
    } else {
      payError.innerText = "";
    }
  });

  confirmPayBtn.addEventListener("click", async () => {
    const payValue = Number(payAmountInput.value);
    if (!payValue || payValue <= 0 || payValue > currentBill.remaining) {
      payError.innerText = "Enter a valid amount to pay";
      return;
    }

    await window.parent.api.updateBill(currentBill.id, payValue);

    // Update remaining
    currentBill.remaining -= payValue;
    if (currentBill.remaining <= 0) {
      currentBill.remaining = 0;
      currentBill.status = "Paid";
    }

    modal.style.display = "none";

    // 🔹 Refresh table → only show latest bills with remaining > 0
    loadRemainingData();
  });
}


//////////////////////////////////////
document.addEventListener("DOMContentLoaded", async () => {
  await loadLowStock();
});
async function loadLowStock() {
  const lowStockBody = document.getElementById("lowStockBody");
  lowStockBody.innerHTML = "";

  const items = await window.parent.api.fetchLowStockItems();

  // Filter items with qty <= 5
  const lowStockItems = items.filter(item => item.quantity <= 5);

  // Insert rows
  lowStockItems.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.product_name}</td>
      <td>${item.company_name}</td>
      <td>${item.quantity}</td>
    `;
    lowStockBody.appendChild(tr);
  });

  // Update Dashboard Count
  document.querySelector(".dashboard-lowstock h2:nth-child(2)").innerText =
    lowStockItems.length;
}

document.addEventListener("DOMContentLoaded", async () => {

  loadYearOptions();
  loadMonthOptions();

  document.getElementById("searchMonthly")
    .addEventListener("click", loadMonthlyRevenue);

});

function loadYearOptions() {
  const selectYear = document.getElementById("filterYear");
  const currentYear = new Date().getFullYear();

  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    const op = document.createElement("option");
    op.value = y;
    op.innerText = y;
    selectYear.appendChild(op);
  }
}

function loadMonthOptions() {
  const selectMonth = document.getElementById("filterMonth");
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  monthNames.forEach((m, index) => {
    const op = document.createElement("option");
    op.value = index + 1;
    op.innerText = m;
    selectMonth.appendChild(op);
  });
}

async function loadMonthlyRevenue() {

  const year = document.getElementById("filterYear").value;
  const month = document.getElementById("filterMonth").value;

  //===== FETCH DATA =====
  const bills = await window.parent.api.fetchMonthlyRevenue(year, month);
  const billItems = await window.parent.api.fetchBillItems();

  // ❌ NO LATEST FILTER — USE ALL ENTRIES
  const finalBills = bills;

  //===== PROFIT CALCULATION =====
  finalBills.forEach(bill => {
    const items = billItems.filter(i => i.bill_id === bill.id);

    let profit = 0;
    items.forEach(p => {
      profit += (p.selling_price - p.buying_price) * p.quantity;
    });

    bill.profit = profit;
  });

  //===== TABLE =====
  const body = document.getElementById("monthlyTableBody");
  body.innerHTML = "";

  finalBills.forEach(bill => {
    const dateObj = new Date(bill.created_at);
    const formattedDate = dateObj.toLocaleDateString("en-IN");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formattedDate}</td>
      <td>${bill.id}</td>
      <td>${bill.customer_name}</td>
      <td>₹${bill.subtotal.toLocaleString("en-IN")}</td>
      <td>₹${bill.profit.toLocaleString("en-IN")}</td>
    `;
    body.appendChild(tr);
  });

  //===== TOTALS (SUBTOTAL BASED) =====
  const totalRevenue = finalBills.reduce(
    (sum, b) => sum + (Number(b.subtotal) || 0),
    0
  );

  const totalProfit = finalBills.reduce(
    (sum, b) => sum + (Number(b.profit) || 0),
    0
  );

  document.getElementById("totalRevenue").innerText =
    "₹" + totalRevenue.toLocaleString("en-IN");

  document.getElementById("totalProfit").innerText =
    "₹" + totalProfit.toLocaleString("en-IN");

 
const uniqueCustomers = new Set(
  finalBills.map(b => `${b.customer_name}_${b.mobile}`)
);

document.getElementById("totalCustomers").innerText = uniqueCustomers.size;


}
