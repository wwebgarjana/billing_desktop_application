document.addEventListener("DOMContentLoaded", () => {
  const api = window.parent.api;
  const itemsBody = document.getElementById("itemsBody");

  const popup = document.getElementById("addItemPopup");
  const addBtn = document.getElementById("addItemBtn");
  const cancelBtn = document.getElementById("cancelItemBtn");
  const saveBtn = document.getElementById("saveItemBtn");

  const errorBox = document.createElement("div");
  errorBox.style.color = "red";
  errorBox.style.marginBottom = "8px";
  popup.querySelector(".additem-card").prepend(errorBox);

  const productId = document.getElementById("productId");
  const productName = document.getElementById("productName");
  const companyName = document.getElementById("companyName");
  const buyingPrice = document.getElementById("buyingPrice");
  const sellingPrice = document.getElementById("sellingPrice");
  const quantity = document.getElementById("quantity");
  const primaryUnit = document.getElementById("primaryUnit");

  const gstEnable = document.getElementById("gstEnable");
  const gstValue = document.getElementById("gstValue");

  const handlingEnable = document.getElementById("handlingEnable");
  const handlingValue = document.getElementById("handlingValue");

  let items = [];
  let editMode = false;
  let editProductId = null;

  function resetForm() {
    errorBox.textContent = "";
    productId.value = "";
    productName.value = "";
    companyName.value = "";
    buyingPrice.value = "";
    sellingPrice.value = "";
    quantity.value = "";
    primaryUnit.value = "";

    gstEnable.checked = false;
    gstValue.value = "";
    gstValue.style.display = "none";

    handlingEnable.checked = false;
    handlingValue.value = "";
    handlingValue.style.display = "none";

    productId.disabled = false;
    editMode = false;
    editProductId = null;
  }

  function renderItems() {
    itemsBody.innerHTML = "";
    items.forEach((item, index) => {
      itemsBody.innerHTML += `
        <div class="items-row">
          <p>${index + 1}</p>
          <p>${item.productName}</p>
          <p>${item.companyName}</p>
          <p>${item.buyingPrice}</p>
          <p>${item.sellingPrice}</p>
          <p>${item.quantity}</p>
          <div class="actions">
            <i class="fa fa-pen edit-icon" data-id="${item.productId}"></i>
            <i class="fa fa-trash delete-icon" data-id="${item.productId}"></i>
          </div>
        </div>
      `;
    });
  }

  async function loadItemsFromDB() {
    const dbItems = await api.fetchItems();
    items = dbItems.map(row => ({
      productId: String(row.product_id),
      productName: row.product_name,
      companyName: row.company_name,
      buyingPrice: row.buying_price,
      sellingPrice: row.selling_price,
      quantity: row.quantity,
      primaryUnit: row.primary_unit,
      gst: row.gst,
      handling: row.handling
    }));
    renderItems();
  }

  loadItemsFromDB();

  addBtn.onclick = () => {
    resetForm();
    popup.style.display = "flex";
  };

  cancelBtn.onclick = () => {
    resetForm();
    popup.style.display = "none";
  };

  gstEnable.onchange = () => {
    gstValue.style.display = gstEnable.checked ? "block" : "none";
    if (!gstEnable.checked) gstValue.value = "";
  };

  handlingEnable.onchange = () => {
    handlingValue.style.display = handlingEnable.checked ? "block" : "none";
    if (!handlingEnable.checked) handlingValue.value = "";
  };

  itemsBody.onclick = async (e) => {
    if (e.target.classList.contains("delete-icon")) {
      const id = e.target.dataset.id;
      await api.deleteItem(id);
      loadItemsFromDB();
    }

    if (e.target.classList.contains("edit-icon")) {
      const id = e.target.dataset.id;
      const item = items.find(i => i.productId === id);

      resetForm();
      editMode = true;
      editProductId = id;

      productId.value = item.productId;
      productId.disabled = true;
      productName.value = item.productName;
      companyName.value = item.companyName;
      buyingPrice.value = item.buyingPrice;
      sellingPrice.value = item.sellingPrice;
      quantity.value = item.quantity;
      primaryUnit.value = item.primaryUnit;

      if (item.gst !== null) {
        gstEnable.checked = true;
        gstValue.style.display = "block";
        gstValue.value = item.gst;
      }

      if (item.handling !== null) {
        handlingEnable.checked = true;
        handlingValue.style.display = "block";
        handlingValue.value = item.handling;
      }

      popup.style.display = "flex";
    }
  };

  saveBtn.onclick = async () => {
    document.querySelectorAll(".error-text").forEach(e => e.textContent = "");

    const data = {
      productId: String(productId.value.trim()), 
      productName: productName.value.trim(),
      companyName: companyName.value.trim(),
      buyingPrice: Number(buyingPrice.value),
      sellingPrice: Number(sellingPrice.value),
      quantity: Math.max(0, Number(quantity.value)),
      primaryUnit: primaryUnit.value.trim(),
      gst: gstEnable.checked ? Number(gstValue.value) : null,
      handling: handlingEnable.checked ? Number(handlingValue.value) : null
    };

    let hasError = false;

    if (!data.productId) {
      document.getElementById("productIdError").textContent = "Product ID required";
      hasError = true;
    }

    if (!data.productName) {
      document.getElementById("productNameError").textContent =
        "Product name required";
      hasError = true;
    } else if (!/^[A-Za-z\s]+$/.test(data.productName)) {
      document.getElementById("productNameError").textContent =
        "Only alphabets allowed";
      hasError = true;
    }

    if (!data.companyName) {
      document.getElementById("companyNameError").textContent =
        "Company name required";
      hasError = true;
    } else if (!/^[A-Za-z\s]+$/.test(data.companyName)) {
      document.getElementById("companyNameError").textContent =
        "Only alphabets allowed";
      hasError = true;
    }

    if (!data.primaryUnit) {
      document.getElementById("primaryUnitError").textContent =
        "Primary unit required";
      hasError = true;
    } else if (!/^[A-Za-z\s]+$/.test(data.primaryUnit)) {
      document.getElementById("primaryUnitError").textContent =
        "Only alphabets allowed";
      hasError = true;
    }

    if (!data.buyingPrice) {
      document.getElementById("buyingPriceError").textContent = "Buying price required";
      hasError = true;
    }

    if (!data.sellingPrice) {
      document.getElementById("sellingPriceError").textContent = "Selling price required";
      hasError = true;
    }

    if (data.sellingPrice < data.buyingPrice) {
      document.getElementById("sellingPriceError").textContent =
        "Selling price must be ≥ buying price";
      hasError = true;
    }

    if (gstEnable.checked && (data.gst == null || isNaN(data.gst))) {
      alert("GST value required");
      hasError = true;
    }

    if (handlingEnable.checked && (data.handling == null || isNaN(data.handling))) {
      alert("Handling charges required");
      hasError = true;
    }

    if (!editMode) {
      const exists = items.some(i => i.productId === data.productId);
      if (exists) {
        document.getElementById("productIdError").textContent =
          "Product ID already exists";
        hasError = true;
      }
    }

    if (hasError) return;

    if (editMode) {
       await api.updateItem(data);
    } else {
      await api.saveItem(data);
    }

    popup.style.display = "none";
    resetForm();
    loadItemsFromDB();
  };
});

