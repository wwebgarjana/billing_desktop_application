
// document.addEventListener("DOMContentLoaded", async () => {

//   loadYearOptions();
//   loadMonthOptions();
//   loadLowStock();
//   renderLowStockChart();
//   renderSalesVsRemainChart();
//   document.getElementById("searchBtn").addEventListener("click", loadCharts);

// });


// function loadYearOptions() {
//   const yearSelect = document.getElementById("yearSelect");
//   const currentYear = new Date().getFullYear();

//   for (let y = currentYear - 5; y <= currentYear + 1; y++) {
//     const op = document.createElement("option");
//     op.value = y;
//     op.innerText = y;
//     yearSelect.appendChild(op);
//   }
// }

// function loadMonthOptions() {
//   const monthSelect = document.getElementById("monthSelect");
//   const monthNames = [
//     "January","February","March","April","May","June",
//     "July","August","September","October","November","December"
//   ];

//   monthNames.forEach((m, index) => {
//     const op = document.createElement("option");
//     op.value = index + 1;
//     op.innerText = m;
//     monthSelect.appendChild(op);
//   });
// }


// /* ==========================
//    LOW STOCK LOAD
// ========================== */
// async function loadLowStock() {
//   const allItems = await window.parent.api.fetchItems();
//   const lowStockRows = document.getElementById("lowStockRows");
//   lowStockRows.innerHTML = "";

//   allItems
//     .filter(item => item.quantity <= 5)
//     .forEach(item => {
//       lowStockRows.innerHTML += `
//         <div class="lowstock-row">
//           <p>${item.product_name}</p>
//           <p>${item.company_name}</p>
//           <p>${item.quantity}</p>
//         </div>
//       `;
//     });
// }

// let salesChart = null;
// let profitChart = null;

// async function loadCharts() {

//   const year = document.getElementById("yearSelect").value;
//   const month = document.getElementById("monthSelect").value;

//   const bills = await window.parent.api.fetchMonthlyProfit(year, month);

//   const monthNames = [
//     "January","February","March","April","May","June",
//     "July","August","September","October","November","December"
//   ];

//   const monthLabel = monthNames[month - 1];

//   /* === ❌ NO LATEST FILTER — USE ALL ENTRIES === */
//   const allBills = bills;

//   /* === TOTAL SALES USING SUBTOTAL === */
//   const totalSales = allBills.reduce(
//     (sum, b) => sum + (Number(b.subtotal) || 0),
//     0
//   );

//   /* ================================
//      CALCULATE PROFIT USING BILL ITEMS
//   =================================== */
//   let totalProfit = 0;

//   allBills.forEach(bill => {
//     const items = bill.items || [];
//     let profit = 0;

//     items.forEach(p => {
//       profit += (p.selling_price - p.buying_price) * p.quantity;
//     });

//     totalProfit += profit;
//   });

//   /* ===== SALES LINE CHART ===== */
//   if (salesChart) salesChart.destroy();

//   salesChart = new Chart(document.getElementById("salesLineChart"), {
//     type: "line",
//     data: {
//       labels: [monthLabel],
//       datasets: [{
//         label: "Sales (₹)",
//         data: [totalSales],
//         borderColor: "#36a2eb",
//         borderWidth: 2,
//         tension: 0.4
//       }]
//     }
//   });

//   /* ===== PROFIT BAR CHART ===== */
//   if (profitChart) profitChart.destroy();

//   profitChart = new Chart(document.getElementById("profitBarChart"), {
//     type: "bar",
//     data: {
//       labels: [monthLabel],
//       datasets: [{
//         label: "Profit (₹)",
//         data: [totalProfit],
//         backgroundColor: "#ff6384"
//       }]
//     }
//   });

// }
// let lowStockChart = null;

// async function renderLowStockChart() {
//   const allItems = await window.parent.api.fetchItems();

//   const totalItems = allItems.length;
//   const lowStockItems = allItems.filter(i => i.quantity <= 5).length;

//   // 🔹 canvas dynamically add (HTML change nahi)
//   let canvas = document.getElementById("lowStockChart");
//   if (!canvas) {
//     canvas = document.createElement("canvas");
//     canvas.id = "lowStockChart";
//     document.querySelector(".lowstock-alert").appendChild(canvas);
//   }

//   if (lowStockChart) lowStockChart.destroy();

//   lowStockChart = new Chart(canvas, {
//     type: "bar",
//     data: {
//       labels: ["Total Items", "Low Stock"],
//       datasets: [{
//         label: "Stock Count",
//         data: [totalItems, lowStockItems],
//         backgroundColor: ["#36a2eb", "#ff6384"]
//       }]
//     },
//     options: {
//       responsive: true,
//       plugins: {
//         legend: { display: false }
//       }
//     }
//   });
// }

// /* ===== TOTAL SALES VS TOTAL REMAINING CHART ===== */
// let salesVsRemainChart = null;

// async function renderSalesVsRemainChart(allBills) {
//   // Total sales already calculated
//   const totalSales = allBills.reduce(
//     (sum, b) => sum + (Number(b.subtotal) || 0),
//     0
//   );

//   // Total remaining stock
//   const allItems = await window.parent.api.fetchItems();
//   const totalRemaining = allItems.reduce(
//     (sum, item) => sum + (Number(item.quantity) || 0),
//     0
//   );

//   // Create canvas if not exists
//   let canvas = document.getElementById("salesVsRemainChart");
//   if (!canvas) {
//     canvas = document.createElement("canvas");
//     canvas.id = "salesVsRemainChart";
//     document.querySelector(".reports-charts").appendChild(canvas);
//   }

//   if (salesVsRemainChart) salesVsRemainChart.destroy();

//   salesVsRemainChart = new Chart(canvas, {
//     type: "bar",
//     data: {
//       labels: ["Total Sales", "Total Remaining"],
//       datasets: [{
//         label: "Amount / Stock",
//         data: [totalSales, totalRemaining],
//         backgroundColor: ["#36a2eb", "#ffce56"]
//       }]
//     },
//     options: {
//       responsive: true,
//       plugins: {
//         legend: { display: false }
//       }
//     }
//   });
// }

// // Call it at the end of loadCharts
// renderSalesVsRemainChart(allBills);





document.addEventListener("DOMContentLoaded", async () => {
  loadYearOptions();
  loadMonthOptions();
  loadLowStock();
  renderLowStockChart();
  
  // Initial charts load ke liye
  await loadCharts();

  document.getElementById("searchBtn").addEventListener("click", loadCharts);
});

function loadYearOptions() {
  const yearSelect = document.getElementById("yearSelect");
  const currentYear = new Date().getFullYear();

  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    const op = document.createElement("option");
    op.value = y;
    op.innerText = y;
    yearSelect.appendChild(op);
  }
}

function loadMonthOptions() {
  const monthSelect = document.getElementById("monthSelect");
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  monthNames.forEach((m, index) => {
    const op = document.createElement("option");
    op.value = index + 1;
    op.innerText = m;
    monthSelect.appendChild(op);
  });
}

/* ==========================
   LOW STOCK LOAD
========================== */
async function loadLowStock() {
  const allItems = await window.parent.api.fetchItems();
  const lowStockRows = document.getElementById("lowStockRows");
  lowStockRows.innerHTML = "";

  allItems
    .filter(item => item.quantity <= 5)
    .forEach(item => {
      lowStockRows.innerHTML += `
        
      `;
    });
}

let salesChart = null;
let profitChart = null;
let salesVsRemainChart = null;

async function loadCharts() {
  const year = document.getElementById("yearSelect").value;
  const month = document.getElementById("monthSelect").value;

  const bills = await window.parent.api.fetchMonthlyProfit(year, month);
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];
  const monthLabel = monthNames[month - 1];

  const allBills = bills;

  /* ===== TOTAL SALES ===== */
  const totalSales = allBills.reduce(
    (sum, b) => sum + (Number(b.subtotal) || 0),
    0
  );

  /* ===== TOTAL PROFIT ===== */
  let totalProfit = 0;
  allBills.forEach(bill => {
    const items = bill.items || [];
    let profit = 0;
    items.forEach(p => {
      profit += (p.selling_price - p.buying_price) * p.quantity;
    });
    totalProfit += profit;
  });

  /* ===== SALES LINE CHART ===== */
  if (salesChart) salesChart.destroy();
  salesChart = new Chart(document.getElementById("salesLineChart"), {
    type: "line",
    data: {
      labels: [monthLabel],
      datasets: [{
        label: "Sales (₹)",
        data: [totalSales],
        borderColor: "#36a2eb",
        borderWidth: 2,
        tension: 0.4
      }]
    }
  });

  /* ===== PROFIT BAR CHART ===== */
  if (profitChart) profitChart.destroy();
  profitChart = new Chart(document.getElementById("profitBarChart"), {
    type: "bar",
    data: {
      labels: [monthLabel],
      datasets: [{
        label: "Profit (₹)",
        data: [totalProfit],
        backgroundColor: "#ff6384"
      }]
    }
  });

  /* ===== TOTAL SALES VS TOTAL REMAINING CHART ===== */
 
/* ===== TOTAL SALES VS TOTAL REMAINING CHART ===== */
const remainingMap = new Map();

// Loop through all bills for the selected month
allBills.forEach(bill => {
  const key = bill.customer_name + "_" + bill.mobile_no;
  // Overwrite previous entry for same customer+mobile → latest remaining
  remainingMap.set(key, Number(bill.remaining) || 0);
});

// Total remaining = sum of all latest remaining values
const totalRemaining = Array.from(remainingMap.values()).reduce((sum, val) => sum + val, 0);

let canvas = document.getElementById("salesVsRemainChart");
if (!canvas) {
  canvas = document.createElement("canvas");
  canvas.id = "salesVsRemainChart";
  document.querySelector(".reports-charts").appendChild(canvas);
}

if (salesVsRemainChart) salesVsRemainChart.destroy();

salesVsRemainChart = new Chart(canvas, {
  type: "bar",
  data: {
    labels: ["Total Sales", "Total Remaining"],
    datasets: [{
      label: "Amount / Stock",
      data: [totalSales, totalRemaining],
      backgroundColor: ["#36a2eb", "#ffce56"]
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } }
  }
});

}
let lowStockChart = null;
async function renderLowStockChart() {
  const allItems = await window.parent.api.fetchItems();
  const totalItems = allItems.length;
  const lowStockItems = allItems.filter(i => i.quantity <= 5).length;

  let canvas = document.getElementById("lowStockChart");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "lowStockChart";
    document.querySelector(".lowstock-alert").appendChild(canvas);
  }

  if (lowStockChart) lowStockChart.destroy();

  lowStockChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Total Items", "Low Stock"],
      datasets: [{
        label: "Stock Count",
        data: [totalItems, lowStockItems],
        backgroundColor: ["#36a2eb", "#ff6384"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}
