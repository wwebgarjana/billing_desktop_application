document.addEventListener("DOMContentLoaded", async () => {
  const api = window.parent.api;

  let extraCharges = [];
  let chargesConfirmed = false;

  // ====== MESSAGE BOX ======
  function showMessage(msg, type = "success") {
    let msgBox = document.getElementById("msgBox");
    if (!msgBox) {
      msgBox = document.createElement("div");
      msgBox.id = "msgBox";
      msgBox.style.position = "fixed";
      msgBox.style.top = "20px";
      msgBox.style.right = "20px";
      msgBox.style.padding = "10px 15px";
      msgBox.style.borderRadius = "6px";
      msgBox.style.color = "#fff";
      msgBox.style.zIndex = "9999";
      document.body.appendChild(msgBox);
    }
    msgBox.style.background = type === "error" ? "#e74c3c" : "#2ecc71";
    msgBox.textContent = msg;
    setTimeout(() => msgBox.remove(), 2500);
  }

  // ====== POPUP ======
  
   const popup = document.getElementById("newBillPopup");

  
  popup.style.display = "block";
  document.body.style.overflow = "hidden";

  // ====== INPUTS ======
  const productNameInput = document.querySelector(".product-inputs input[type='text']");
  const rateInput = document.querySelector(".product-inputs input[placeholder^='Rate']");
  const buyingPriceInput = document.querySelector(".product-inputs input[placeholder^='Buying']");
  const qtySpan = document.querySelector(".qty-control span");
  const qtyMinus = document.querySelector(".qty-control button:first-child");
  const qtyPlus = document.querySelector(".qty-control button:last-child");
  const addProductBtn = document.querySelector(".add-product-btn");
  const productTableBody = document.querySelector(".product-table tbody");
  const subtotalEl = document.getElementById("subtotalText");
  const totalInput = document.getElementById("totalDisplay");
  const paymentSelect = document.getElementById("paymentType");
  const remainingText = document.getElementById("remainingText");
  const totalText = document.getElementById("totalText");
  const mobileInput = document.querySelector("input[placeholder='Mobile']");

  let quantity = 1;
  let selectedProduct = null;
  let productsInBill = [];
  let remainingAmount = 0;

  qtySpan.textContent = quantity;

  function resetForm() {
    productNameInput.value = "";
    rateInput.value = "";
    buyingPriceInput.value = "";
    quantity = 1;
    qtySpan.textContent = "1";
    selectedProduct = null;

    productsInBill = [];
    productTableBody.innerHTML = "";

    remainingAmount = 0;
    totalInput.value = "";
    totalInput.placeholder = "";

    document.querySelector("input[placeholder='Name']").value = "";
    mobileInput.value = "";
    document.querySelector("input[placeholder='Address']").value = "";

    updateSubtotal();
    updateTotalDisplay();
  }

  const itemsList = await api.fetchItems();
  const dataList = document.createElement("datalist");
  dataList.id = "productOptions";
  document.body.appendChild(dataList);
  itemsList.forEach(item => {
    const option = document.createElement("option");
    option.value = item.product_name;
    dataList.appendChild(option);
  });
  productNameInput.setAttribute("list", "productOptions");


//////////////////////////////
productNameInput.addEventListener("input", () => {
  const value = productNameInput.value.toLowerCase();

  // UNIQUE PRODUCT NAME FILTER
  const uniqueNames = [...new Set(
    itemsList.map(i => i.product_name.toLowerCase())
  )];

  // CHECK IF EXACT PRODUCT EXISTS
  if (uniqueNames.includes(value)) {
    const matched = itemsList.find(item =>
      item.product_name.toLowerCase() === value
    );

    selectedProduct = matched;

    rateInput.value = matched.selling_price;
    buyingPriceInput.value = matched.buying_price;

    // LOAD COMPANIES
    loadCompanyOptions(matched.product_name);
  } else {
    selectedProduct = null;
    rateInput.value = "";
    buyingPriceInput.value = "";
  }
});


function renderUniqueProductList() {
  const productOptions = document.getElementById("productOptions");
  productOptions.innerHTML = "";

  const uniqueNames = [...new Set(itemsList.map(i => i.product_name))];

  uniqueNames.forEach(name => {
    const op = document.createElement("option");
    op.value = name;
    productOptions.appendChild(op);
  });
}
renderUniqueProductList();

function loadCompanyOptions(productName) {
  const companySelect = document.getElementById("companySelect");
  companySelect.innerHTML = "";

  const companyList = itemsList.filter(
    item => item.product_name.toLowerCase() === productName.toLowerCase()
  );

  const uniqueCompanies = [...new Set(companyList.map(i => i.company_name))];

  uniqueCompanies.forEach(company => {
    const op = document.createElement("option");
    op.value = company;
    op.textContent = company;
    companySelect.appendChild(op);
  });
}
 


document.getElementById("companySelect").addEventListener("input", () => {
  const pname = productNameInput.value.toLowerCase();
  const cname = document.getElementById("companySelect").value.toLowerCase();

  const matched = itemsList.find(
    item => item.product_name.toLowerCase() === pname && item.company_name.toLowerCase() === cname
  );

  if (matched) {
    selectedProduct = matched;
    rateInput.value = matched.selling_price;
    buyingPriceInput.value = matched.buying_price;
  }
});




//////////////////////////////////////////
  qtyMinus.onclick = () => {
    if (quantity > 1) {
      quantity--;
      qtySpan.textContent = quantity;
    }
  };
  qtyPlus.onclick = () => {
    quantity++;
    qtySpan.textContent = quantity;
  };


async function fetchRemaining() {
  const nameInput = document.querySelector('input[placeholder="Name"]');

  if (!mobileInput.value) {
    remainingAmount = 0;
    nameInput.readOnly = false; // mobile blank → editable
  } else {

    remainingAmount = await api.getRemaining(mobileInput.value);
    const customer = await api.getCustomerDetails(mobileInput.value);

    if (customer && customer.customer_name) {
      nameInput.value = customer.customer_name;
      nameInput.readOnly = true;   // 🔒 DB se aaya → lock
    } else {
      nameInput.value = "";
      nameInput.readOnly = false;  // DB me nahi mila → editable
    }
  }

  updateTotalDisplay();
}





  mobileInput.addEventListener("blur", fetchRemaining);

  function updateSubtotal() {
    const subtotal = productsInBill.reduce((sum, p) => sum + (p.total + p.charges), 0);
    subtotalEl.textContent = `Subtotal: ₹${subtotal.toFixed(2)}`;
  }

  function updateTotalDisplay() {
    const subtotal = productsInBill.reduce((sum, p) => sum + (p.total + p.charges), 0);

    const chargesTotal = chargesConfirmed
      ? extraCharges.reduce((sum, c) => sum + c.amount, 0)
      : 0;

    const finalSubtotal = subtotal + chargesTotal;
    const actualTotal = Math.round(finalSubtotal + remainingAmount);

    subtotalEl.textContent = `Subtotal: ₹${finalSubtotal.toFixed(2)}`;
    totalText.innerHTML = `<strong>Total: ₹${actualTotal}</strong>`;

    totalInput.placeholder = actualTotal;
  }
 

async function updateItemStock(productName, companyName, quantity) {
  try {
    await api.updateStockByCompany(productName, companyName, quantity); 
  } catch (err) {
    console.error("Stock update failed:", err);
  }
}



  addProductBtn.onclick = () => {
    if (!selectedProduct) {
      showMessage("Select valid product from DB", "error");
      return;
    }

    if (selectedProduct.quantity <= 0) {
    showMessage(`"${selectedProduct.product_name}" — OUT OF STOCK`, "error");
    return;
  }

    const handling = Number(selectedProduct.handling || 0);

    const rate = Number(rateInput.value);
    const qty = quantity;
    const gst = selectedProduct.gst || 0;
    const amount = rate * qty;
    const gstAmount = amount * (gst / 100);
    const charges = qty * handling;
    const total = amount + gstAmount;

   // const existing = productsInBill.find(p => p.productName === selectedProduct.product_name);
  const existing = productsInBill.find(
  p => p.productName === selectedProduct.product_name &&
       p.companyName === selectedProduct.company_name
);




    if (existing) {
      existing.qty += qty;
      existing.amount = existing.rate * existing.qty;
      existing.gstAmount = existing.amount * (gst / 100);
      existing.charges = existing.qty * handling;
      existing.total = existing.amount + existing.gstAmount;

      updateItemStock(selectedProduct.product_name, selectedProduct.company_name, quantity);
    } else {
      productsInBill.push({
        productName: selectedProduct.product_name,
        companyName: selectedProduct.company_name,
        qty,
        rate,
        amount,
        gstAmount,
        charges,
        total,
        buying_price: Number(buyingPriceInput.value) || selectedProduct.buying_price || 0,
        selling_price: Number(rateInput.value) || selectedProduct.selling_price || rate
       
      });

     
      updateItemStock(selectedProduct.product_name, selectedProduct.company_name, quantity);

     
    }
function renderProductTable() {
    productTableBody.innerHTML = "";
    productsInBill.forEach((p, i) => {
      const row = document.createElement("tr");
      row.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.productName}</td>
      <td>${p.companyName}</td>
      <td>${p.qty}</td>
      <td>${p.rate}</td>
      <td>${p.gstAmount.toFixed(2)}</td>
      <td>${p.charges.toFixed(2)}</td>
      <td>${p.total.toFixed(2)}</td>
       <td>
        <button class="edit-btn">✏️</button>
        <button class="delete-btn">🗑️</button>
      </td>
    `;
      productTableBody.appendChild(row);

       // Edit button
    row.querySelector(".edit-btn").onclick = () => {
      selectedProduct = itemsList.find(
        item =>
          item.product_name === p.productName &&
          item.company_name === p.companyName
      );
      if (selectedProduct) {
        productNameInput.value = selectedProduct.product_name;
        rateInput.value = selectedProduct.selling_price;
        buyingPriceInput.value = selectedProduct.buying_price;
        quantity = p.qty;
        qtySpan.textContent = quantity;
        loadCompanyOptions(selectedProduct.product_name);
        document.getElementById("companySelect").value = selectedProduct.company_name;

        // Remove the row from productsInBill so that user can update it and add again
        productsInBill.splice(i, 1);
        renderProductTable();
      }
    };

    // Delete button
    row.querySelector(".delete-btn").onclick = () => {
      productsInBill.splice(i, 1);
      renderProductTable();
    };
  
    });
  }

    renderProductTable();

    updateSubtotal();
    updateTotalDisplay();

    productNameInput.value = "";
    rateInput.value = "";
    buyingPriceInput.value = "";
    quantity = 1;
    qtySpan.textContent = "1";
    selectedProduct = null;
  };

  //totalInput.addEventListener("input", updateTotalDisplay);
  // totalInput is your paid amount input
totalInput.addEventListener("input", () => {
  const actualTotal = Math.round(
    productsInBill.reduce((sum, p) => sum + (p.total + p.charges), 0) +
    (chargesConfirmed ? extraCharges.reduce((sum, c) => sum + c.amount, 0) : 0) +
    remainingAmount
  );

  const paid = Number(totalInput.value);

  // Validate paid amount
  if (isNaN(paid) || paid < 0 || paid > actualTotal) {
    showMessage(`Paid amount must be between 0 and ₹${actualTotal}`, "error");
  }

  updateTotalDisplay();
});

  paymentSelect.addEventListener("change", updateTotalDisplay);

  const custName = document.querySelector("input[placeholder='Name']");
const custMobile = document.querySelector("input[placeholder='Mobile']");


const nameErr = document.getElementById("nameErr");
const mobileErr = document.getElementById("mobileErr");


  const generateBillBtn = document.querySelector(".generate-bill-btn");


generateBillBtn.onclick = async () => {
  // Validate stock
  for (let p of productsInBill) {
    const dbItem = itemsList.find(i =>
      i.product_name === p.productName &&
      i.company_name === p.companyName
    );

    if (!dbItem || dbItem.quantity <= 0) {
      showMessage(`"${p.productName}" stock finished — Bill cannot be generated`, "error");
      return;
    }

    if (p.qty > dbItem.quantity) {
      showMessage(`"${p.productName}" stock insufficient — only ${dbItem.quantity} available`, "error");
      return;
    }
  }

  // Validate customer inputs
  let valid = true;

  if (custName.value.trim() === "") {
    nameErr.style.display = "block";
    valid = false;
  } else {
    nameErr.style.display = "none";
  }

  if (custMobile.value.trim() === "") {
    mobileErr.style.display = "block";
    valid = false;
  } else {
    mobileErr.style.display = "none";
  }

  if (!valid) return;

  if (productsInBill.length === 0) {
    showMessage("No products added", "error");
    return;
  }

  // 🔹 BILL DATA CREATION (added from your second code)
  const subtotal = productsInBill.reduce((sum, p) => sum + (p.total + p.charges), 0);
  const gstTotal = productsInBill.reduce((sum, p) => sum + p.gstAmount, 0);
  //const paidAmount = parseFloat(totalInput.value) || 0;
  const chargesTotal = chargesConfirmed
    ? extraCharges.reduce((sum, c) => sum + c.amount, 0)
    : 0;

  const finalSubtotal = subtotal + chargesTotal;
  const actualTotal = Math.round(finalSubtotal + remainingAmount);
  const paidAmount = parseFloat(totalInput.value) || 0;
  if (paidAmount < 0 || paidAmount > actualTotal) {
    showMessage(`Paid amount must be between 0 and ₹${actualTotal}`, "error");
    return; // Stop bill generation
  }
  const newRemaining = actualTotal - paidAmount;

  const billData = {
   // billNo: Date.now(),

    customer: {
      name: document.querySelector("input[placeholder='Name']").value || "",
      mobile: mobileInput.value || "",
      address: document.querySelector("input[placeholder='Address']").value || ""
    },

    subtotal: finalSubtotal,
    gst: gstTotal,
    total: actualTotal,
    paid: paidAmount,
    remaining: newRemaining,
   previousRemaining: remainingAmount || 0,

    paymentStatus: paidAmount === actualTotal
      ? "Paid"
      : paidAmount > 0 && paidAmount < actualTotal
        ? "Remaining"
        : "Unpaid",

    paymentType: paymentSelect.value,

    items: productsInBill.map(p => ({
      name: p.productName,
      company: p.companyName, 
      qty: p.qty,
      rate: p.rate,
      gstAmount: p.gstAmount,
      charges: p.charges,
      total: p.total,
      buying_price: p.buying_price,
      selling_price: p.selling_price
    })),

    extraCharges: extraCharges,
    extraChargesTotal: chargesTotal
  };
  ////////////////////////////////

  // Save bill
  const res = await api.saveBill(billData);

  if (res.success) {
    showMessage("Bill saved successfully", "success");

    // 🔹 Redirect to preview.html with billData
    billData.billNo = res.billId;
    localStorage.setItem("previewData", JSON.stringify(billData));
    window.parent.location.href = "../html_components/preview.html";
  }
};




///////////////////////////////////////////
  // ---------------------------------------
  // EXTRA CHARGES INSIDE DOM BLOCK
  // ---------------------------------------

  const chargesEnable = document.getElementById("chargesEnable");
  const chargesContainer = document.getElementById("chargesContainer");
  const addChargeBtn = document.getElementById("addChargeBtn");
  const chargesList = document.getElementById("chargesList");

  function showPaymentBoxCharges() {
    let box = document.getElementById("chargesBreakup");

    if (!extraCharges.length) {
      box.innerHTML = "";
      return;
    }

    box.innerHTML = extraCharges
      .map(c => `${c.title}: ₹${c.amount}`)
      .join("<br>");
  }

  chargesEnable.onchange = () => {
    chargesContainer.style.display = chargesEnable.checked ? "block" : "none";
  };

  addChargeBtn.onclick = () => {
    const title = document.getElementById("chargeTitle").value.trim();
    const amount = Number(document.getElementById("chargeAmount").value.trim());

    if (!title || !amount) {
       showMessage("Please enter title & charge value", "error");
      return;
    }

    extraCharges.push({ title, amount });

    const row = document.createElement("div");
    row.innerHTML = `<p><strong>${title}</strong> - ₹${amount}</p>`;
    chargesList.appendChild(row);

    document.getElementById("chargeTitle").value = "";
    document.getElementById("chargeAmount").value = "";
  };

  document.querySelector(".add-charges-btn").onclick = () => {
    chargesConfirmed = true;
    updateTotalDisplay();
    showPaymentBoxCharges();
  };

}); 

