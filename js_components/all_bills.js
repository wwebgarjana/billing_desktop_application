document.addEventListener("DOMContentLoaded", async () => {
  const api = window.parent.api; // iframe access
  const billsList = document.getElementById("billsList");
  const tabs = document.querySelectorAll(".bills-tab");

  let allBills = [];

  // Fetch bills from main
  async function loadBills() {
    try {
      allBills = await api.fetchBills(); // FIXED HERE
      renderBills("all");
    } catch (err) {
      console.error("Error fetching bills:", err);
    }
  }

  // Render bills

function renderBills(filter) {
  billsList.innerHTML = "";

  // ✅ STEP 1: customer-wise latest bill nikaalo
  const latestBillsMap = {};

  allBills.forEach(bill => {
    const cust = bill.customer_name;

    if (
      !latestBillsMap[cust] ||
      new Date(bill.created_at) > new Date(latestBillsMap[cust].created_at)
    ) {
      latestBillsMap[cust] = bill;
    }
  });

  // sirf latest bills ka array
  let latestBills = Object.values(latestBillsMap);

  // ✅ STEP 2: ab isi par filter lagao
  let filtered = latestBills.filter(bill => {
    if (filter === "all") return true;
    if (filter === "paid") return bill.paid_amount >= bill.total;
    if (filter === "unpaid") return bill.paid_amount === 0;
    if (filter === "remain") return bill.paid_amount > 0 && bill.paid_amount < bill.total;
  });

  // 🔽 rendering (same as tera code)
  filtered.forEach(bill => {
    const card = document.createElement("div");
    card.className = "bill-card";

    const left = document.createElement("div");
    left.className = "bill-left";

    const logo = document.createElement("img");
    logo.src = "../images/bill.png";
    logo.className = "bill-logo";
    left.appendChild(logo);

    const info = document.createElement("div");
    info.className = "bill-info";

    const custName = document.createElement("div");
    custName.className = "cust-name";
    custName.innerText = bill.customer_name;

    const billNo = document.createElement("div");
    billNo.className = "bill-no";
    billNo.innerText = `Bill No: ${bill.id}`;

    const date = new Date(bill.created_at);
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));

    const billDate = document.createElement("div");
    billDate.className = "bill-date";
    billDate.innerText = `${localDate.toLocaleDateString()} ${localDate.toLocaleTimeString()}`;

    info.appendChild(custName);
    info.appendChild(billNo);
    info.appendChild(billDate);
    left.appendChild(info);

    const right = document.createElement("div");
    right.className = "bill-right";

    const paid = document.createElement("div");
    paid.className = "paid";
    paid.innerText = `₹${bill.paid_amount.toLocaleString("en-IN")} / ₹${bill.total.toLocaleString("en-IN")}`;
    right.appendChild(paid);

    const remainingDiv = document.createElement("div");
    remainingDiv.className = "remaining";

    if (bill.paid_amount >= bill.total) {
      remainingDiv.innerText = "Paid";
      remainingDiv.classList.add("green");
    } else if (bill.paid_amount === 0) {
      remainingDiv.innerText = "Unpaid";
      remainingDiv.classList.add("blue");
    } else {
      remainingDiv.innerText = `Remaining: ₹${(bill.total - bill.paid_amount).toLocaleString("en-IN")}`;
      remainingDiv.classList.add("red");
    }

    right.appendChild(remainingDiv);

    card.appendChild(left);
    card.appendChild(right);

    ////////////////////////////////preview wala part////////////

card.addEventListener("click", () => {

  localStorage.setItem("fromPage", "all_bills");
  localStorage.setItem("previewBillId", bill.id); // ✅ sirf bill no

  window.location.href = "../html_components/display.html";
});



    ////////////////////////////////
    billsList.appendChild(card);
  });
}





  // Tabs click
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderBills(tab.dataset.tab);
    });
  });

  // Initial load
  loadBills();
});



