
// 🔥 ADD 1: GLOBAL VARIABLE (TOP OF FILE)
let invoiceData = null;

document.addEventListener("DOMContentLoaded", async () => {
  const api = window.parent?.api || null;

  let data = null;

  const fromPage = localStorage.getItem("fromPage");
  const previewBillId = localStorage.getItem("previewBillId");

  /* ================= FETCH FROM API ================= */
  if ((fromPage === "all_bills" || fromPage === "last_bill" || fromPage ==="customers") && previewBillId && api) {
    try {
      const bill = await api.fetchBillById(previewBillId);

      if (bill) {
        data = {
          billNo: bill.id,
          billDate: bill.created_at,
          customer: {
            name: bill.customer_name || "",
            mobile: bill.mobile || "",
            address: bill.address || ""
          },
          items: (bill.items || []).map(item => ({
            name: item.product_name || item.name || "",
            company: item.company_name || item.company || "",
            qty: item.quantity || item.qty || 0,
            rate: item.rate || 0,
            total: item.total || 0
          })),
          subtotal: bill.subtotal || 0,
          previousRemaining: bill.total - bill.subtotal || 0,
          total: bill.total || 0,
          paid: bill.paid_amount || 0,
          remaining: bill.total - (bill.paid_amount || 0)
        };

        // 🔥 ADD 2: ASSIGN FOR PDF
        invoiceData = data;
      }
    } catch (err) {
      console.error("❌ Error fetching bill:", err);
    }
  }

  /* ================= NO DATA ================= */
  if (!data) {
    document.getElementById("invoiceBody").innerHTML =
      "<tr><td colspan='6'>No data found</td></tr>";
    return;
  }

  /* ================= RENDER BILL ================= */
  document.getElementById("invoiceBillNo").innerText =
    "Bill No: " + data.billNo;

  document.getElementById("invoiceDate").innerText =
    "Date: " + new Date().toLocaleDateString("en-IN");

  document.getElementById("custName").innerText = data.customer.name;
  document.getElementById("custMobile").innerText = data.customer.mobile;

  const tbody = document.getElementById("invoiceBody");
  tbody.innerHTML = "";

  data.items.forEach((item, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${item.name}</td>
        <td>${item.company || ""}</td>
        <td>${item.qty}</td>
        <td>₹${item.rate}</td>
        <td>₹${Number(item.total).toFixed(2)}</td>
      </tr>
    `;
  });

  /* ================= PAYMENT ================= */
  document.getElementById("subTotal").innerText = data.subtotal;
  document.getElementById("prevRemain").innerText = data.previousRemaining;
  document.getElementById("grandTotal").innerText = data.total;
  document.getElementById("paidAmt").innerText = data.paid;
  document.getElementById("currRemain").innerText = data.remaining;
});

// BACK
document.getElementById("invoiceBack").onclick = () => {
  history.back();
};

// DONE
document.getElementById("doneBtn").onclick = () => {
  history.back();
};

document.getElementById("viewPdf").onclick = () => {
  document.documentElement.classList.add("pdf-view");
};


document.getElementById("downloadPdf").onclick = () => {
  if (!invoiceData) {
    alert("Invoice data not ready");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  // ================= HEADER =================
  doc.setFillColor(27, 58, 142);
  doc.rect(0, 0, 210, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("Invoice", 12, 14);

  doc.setTextColor(0);
  doc.setFontSize(11);

  // ================= SHOP DETAILS =================
  doc.text("dhanjvbb", 12, 32);
  doc.text("Phone: 8010855039", 12, 38);
  doc.text("Address: hvb", 12, 44);

  // ================= BILL INFO =================
  doc.text(`Bill No: ${invoiceData.billNo}`, 150, 32);
  //doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 150, 38);
const billDate = invoiceData.billDate
  ? new Date(invoiceData.billDate).toLocaleDateString("en-IN")
  : new Date().toLocaleDateString("en-IN");

doc.text(`Date: ${billDate}`, 150, 38);

  // ================= CUSTOMER BOX =================
  doc.setDrawColor(27, 58, 142);
  doc.roundedRect(10, 50, 190, 30, 4, 4);

  doc.setFontSize(11);
  doc.text(`Bill To: ${invoiceData.customer?.name || ""}`, 14, 60);
  doc.text(`Mobile: ${invoiceData.customer?.mobile || ""}`, 14, 67);

  if (invoiceData.customer?.address) {
    const addr = doc.splitTextToSize(
      `Address: ${invoiceData.customer.address}`,
      160
    );
    doc.text(addr, 14, 74);
  }

  // ================= ITEMS TABLE =================
  const rows = invoiceData.items.map((item, i) => [
    i + 1,
    item.name || "",
    item.company || "",
    Number(item.qty),
    Number(item.rate).toFixed(2),
    Number(item.total).toFixed(2),
  ]);

  doc.autoTable({
    startY: 90,
    head: [["Sr.No", "Item", "Company", "Qty", "Rate", "Amount"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: [27, 58, 142],
      textColor: 255,
    },
    bodyStyles:{
      textColor: 0,
    }
  });

  // ================= PAYMENT LOGIC =================
 // ================= PAYMENT LOGIC =================
const subtotal = Number(invoiceData.subtotal || 0);
const previousRemaining = Number(invoiceData.previousRemaining || 0);
const total = Number(invoiceData.total || 0);
const paid = Number(invoiceData.paid || 0);
const remaining = Number(invoiceData.remaining || 0);

// Table start position
let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 50;

// Table rows
let paymentRows = [
  ["Sub Total", subtotal.toFixed(2)],
  ["Previous Remaining", previousRemaining.toFixed(2)],
  ["Total", total.toFixed(2)],
  ["Paid", paid.toFixed(2)],
  ["Remaining", remaining.toFixed(2)],
];



// ================= PAYMENT TABLE =================
doc.autoTable({
  startY: y,
  head: [["Payment Details", "Amount"]],
  body: paymentRows,

  styles: {
    fontSize: 10,
    halign: "left"
  },

  columnStyles: {
    0: { halign: "left" },
    1: { halign: "right" } // values right
  },

  headStyles: {
    fillColor: [27, 58, 142],
    textColor: 255
  },
   bodyStyles:{
      textColor: 0,
    },

  // ✅ Header alignment fix
  didParseCell: function (data) {
    if (data.section === "head" && data.column.index === 1) {
      data.cell.styles.halign = "right";
    }
  },

  theme: "grid"
});


// ================= PAYMENT STATUS =================
let statusY = doc.lastAutoTable.finalY + 10;

doc.setFontSize(11);

if (remaining === 0) {
  doc.setTextColor(0, 150, 0); // green
  doc.text("Payment Status: PAID", 140, statusY);
} else if (remaining > 0 && remaining < total) {
  doc.setTextColor(200, 0, 0); // red
   doc.text("Payment Status: REMAINING", 140, statusY);
} else {
  doc.setTextColor(0, 0, 200); // blue
  doc.text("Payment Status: UNPAID", 140, statusY);
}


doc.setTextColor(0);


  // ================= FOOTER =================
  doc.setFontSize(10);
  doc.text("Thank You..!", 12, 270);
  doc.text("Authorised Signature", 150, 270);
  doc.setFontSize(9);
  doc.text("Invoice created by Nand Vahi", 75, 285);

  doc.save(`Invoice_${invoiceData.billNo}.pdf`);
};
