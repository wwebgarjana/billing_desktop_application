

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  saveItem: (data) => ipcRenderer.invoke("save-item", data),
  saveUser: (data) => ipcRenderer.invoke("save-user", data),
  checkLogin: (data) => ipcRenderer.invoke("check-login", data),
  checkUserExists: () => ipcRenderer.invoke("check-user-exists"),

  fetchItems: () => ipcRenderer.invoke("fetch-items"), 
   deleteItem: id => ipcRenderer.invoke("delete-item", id),
  updateItem: data => ipcRenderer.invoke("update-item", data),
  saveBill: (billData) => ipcRenderer.invoke("save-bill", billData),
 getRemaining: (mobile) => ipcRenderer.invoke("get-remaining", mobile),
 fetchCustomers: () => ipcRenderer.invoke("fetch-customers"),
 fetchBills: () => ipcRenderer.invoke("fetch-bills"),
 getCustomerDetails: (mobile) => ipcRenderer.invoke("getCustomerDetails", mobile),
// api
updateStockByCompany: (productName, companyName, quantity) =>
  ipcRenderer.invoke('update-stock-by-company', productName, companyName, quantity),

fetchTodaySummary: () => ipcRenderer.invoke("fetchTodaySummary"),
fetchLowStockCount: () => ipcRenderer.invoke("fetchLowStockCount"),
fetchLastBills: () => ipcRenderer.invoke("fetchLastBills"),
fetchBill: () => ipcRenderer.invoke("fetchBill"),
 updateBill: (billId, paidAmount) => ipcRenderer.invoke("updateBill", billId, paidAmount),
 fetchLowStockItems: () => ipcRenderer.invoke("fetch-low-stock-items"),
  fetchMonthlyRevenue: (year, month) =>
    ipcRenderer.invoke("fetch-monthly-revenue", year, month),
  fetchBillItems: () => ipcRenderer.invoke("fetch-bill-items"),
  fetchMonthlyProfit: (year, month) =>
    ipcRenderer.invoke("fetch-monthly-profit", year, month),
  updateUserPassword: (newPassword) =>
    ipcRenderer.invoke("update-user-password", newPassword),
  fetchBillById: async (bill_id) => {
    try {
      // Send billId to main process
      const bill = await ipcRenderer.invoke("fetch-bill-by-id", Number(bill_id));
      return bill;
    } catch (err) {
      console.error("❌ Error in fetchBillById:", err);
      return null;
    }
  }

});

