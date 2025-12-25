document.addEventListener("DOMContentLoaded", async () => {
  const api = window.parent.api;
  const itemsBody = document.getElementById("itemsBody");

  // Fetch items from API and render table
  async function loadItems() {
    try {
      const dbItems = await api.fetchItems(); // Fetch from API
      itemsBody.innerHTML = "";

      dbItems.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "items-row";
        row.innerHTML = `
          <p>${index + 1}</p>
          <p>${item.product_name}</p>
          <p>${item.company_name}</p>
          <p>${item.buying_price}</p>
          <p>${item.selling_price}</p>
          <P>${item.quantity}</p>
        `;
        itemsBody.appendChild(row);
      });
    } catch (error) {
      console.error("Error loading items:", error);
      itemsBody.innerHTML = `<p style="color:red">Failed to load items</p>`;
    }
  }

  loadItems();
});
