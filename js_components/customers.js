document.addEventListener("DOMContentLoaded", async () => {
  const api = window.parent.api;
  if (!api || !api.fetchCustomers) {
    console.error("API not available in iframe!");
    return;
  }

  let customers = [];
  let selectedCustomer = null;

  const customersPage = document.querySelector(".customers-page");
  const customersList = document.getElementById("customersList");
  const searchInput = document.getElementById("searchInput");

  // ================= BILL PAGE =================
  const billPage = document.createElement("div");
  billPage.style.display = "none";
  billPage.style.padding = "20px";
  document.body.appendChild(billPage);

  // ================= NORMALIZE (MOBILE BASED ONLY) =================
  function normalizeCustomers(rawCustomers) {
    const map = {};

    rawCustomers.forEach(cust => {
      (cust.bills || []).forEach(bill => {
        const mobile =
          bill.customer_mobile ||
          cust.mobile;

        // ❌ mobile hi nahi to skip (warna sab merge ho jayenge)
        if (!mobile) return;

        // 🔑 KEY = MOBILE ONLY
        if (!map[mobile]) {
          map[mobile] = {
            name: cust.name || "Customer",
            mobile,
            bills: []
          };
        }

        map[mobile].bills.push(bill);
      });
    });

    return Object.values(map);
  }

  // ================= LOAD =================
  async function loadCustomers() {
    try {
      const raw = await api.fetchCustomers();
      customers = normalizeCustomers(raw);
      console.log("Normalized (Mobile based):", customers);
      renderCustomers();
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  }

  // ================= RENDER LIST =================
  function renderCustomers() {
    const query = searchInput.value.toLowerCase();
    customersList.innerHTML = "";

    customers
      .filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.mobile.includes(query)
      )
      .forEach(cust => {
        const div = document.createElement("div");
        div.className = "customer-item";

        const avatar = document.createElement("div");
        avatar.className = "customer-avatar";
        avatar.innerText = cust.name.charAt(0).toUpperCase();

        const name = document.createElement("div");
        name.className = "customer-name";
        name.innerText = `${cust.name} `;

        div.appendChild(avatar);
        div.appendChild(name);

        div.onclick = () => {
          selectedCustomer = cust;
          openCustomerBills();
        };

        customersList.appendChild(div);
      });
  }

  

// ================= OPEN CUSTOMER =================
 function openCustomerBills() {
  if (!selectedCustomer) return;

  const cust = customers.find(c =>
    c.name === selectedCustomer.name &&
    c.mobile === selectedCustomer.mobile
  );
  if (!cust) return;

  customersPage.style.display = "none";
  billPage.style.display = "block";
  billPage.innerHTML = "";

  // TOTAL (sab bills ka sum) - unchanged
  const total = cust.bills.reduce(
    (sum, b) => sum + (b.subtotal || 0),
    0
  );

  // 🔹 LAST BILL = created_at ke hisaab se
  const sortedBills = cust.bills.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const lastBill = sortedBills[sortedBills.length - 1];
  const remaining = lastBill ? lastBill.remaining : 0;

  const headerDiv = document.createElement("div");
  headerDiv.innerHTML = `
    <h2>${cust.name} </h2>
    <p>Total Amount: <strong>₹${total}</strong></p>
    <p>Remaining : <strong>₹${remaining}</strong></p>
    <h3 style="margin-top:20px;">All Bills</h3>
  `;

  const backBtn = document.createElement("button");
  backBtn.innerText = "Back";
  backBtn.style.cssText = `
    margin-bottom:20px;
    padding:10px 20px;
    border:none;
    background:black;
    color:white;
    border-radius:6px;
    cursor:pointer
  `;
  backBtn.onclick = () => {
    billPage.style.display = "none";
    customersPage.style.display = "block";
  };

  billPage.appendChild(backBtn);
  billPage.appendChild(headerDiv);

  // ================= BILLS =================
  cust.bills.forEach(bill => {
    const date = new Date(bill.created_at);
    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );

    const div = document.createElement("div");
    div.className = "bill-card";
    div.style.cssText = `
      background:#fff;
      padding:15px;
      margin-bottom:10px;
      border-radius:8px;
      display:flex;
      justify-content:space-between;
      box-shadow:0 2px 5px rgba(0,0,0,0.1)
    `;

    div.innerHTML = `
      <div>
        <strong>${cust.name}</strong><br>
        Bill No: ${bill.id}<br>
        ${localDate.toLocaleDateString()} ${localDate.toLocaleTimeString()}
      </div>
      <div style="text-align:right;">
        <strong>₹${bill.paid_amount} / ₹${bill.total}</strong><br>
        <span style="color:${
          bill.payment_status === "Paid"
            ? "green"
            : bill.payment_status === "Remain"
            ? "red"
            : "blue"
        }">
          ${bill.payment_status}
          ${
            bill.payment_status === "Remain"
              ? `: ₹${bill.remaining}`
              : ""
          }
        </span>
      </div>
    `;
    div.addEventListener("click", () => {
    localStorage.setItem("fromPage", "customers");
    localStorage.setItem("previewBillId", bill.id);
    window.location.href = "../html_components/display.html";
  });

    billPage.appendChild(div);
  });
}


  searchInput.oninput = renderCustomers;
  loadCustomers();
});


