
window.addEventListener("DOMContentLoaded", () => {

  const data = JSON.parse(localStorage.getItem("previewData"));
  if (!data) return;

document.getElementById("invoiceBillNo").innerText =
  "Bill No: " + data.billNo;


  document.getElementById("invoiceDate").innerText =
    "Date: " + new Date().toLocaleDateString("en-IN");

  // CUSTOMER
  document.getElementById("custName").innerText = data.customer.name;
  document.getElementById("custMobile").innerText = data.customer.mobile;

  // TABLE
  const tbody = document.getElementById("invoiceBody");
  tbody.innerHTML = "";

  data.items.forEach((item, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${item.name}</td>
       <td>${item.company || item.companyName || item.company_name || ""}</td>

        <td>${item.qty}</td>
        <td>₹${item.rate}</td>
        <td>₹${item.total.toFixed(2)}</td>
      </tr>
    `;
  });

  // PAYMENT
  document.getElementById("subTotal").innerText = data.subtotal;
  document.getElementById("prevRemain").innerText = data.previousRemaining;
  document.getElementById("grandTotal").innerText = data.total;
  document.getElementById("paidAmt").innerText = data.paid;
  document.getElementById("currRemain").innerText = data.remaining;

  // BACK
 // document.getElementById("invoiceBack").onclick = () => history.back();
 document.getElementById("invoiceBack").onclick = () => {
    localStorage.removeItem("previewData");
    window.parent.location.href = "../html_components/sidebar.html";
  };

  


  // DONE
  document.getElementById("doneBtn").onclick = () => {
    localStorage.removeItem("previewData");
    window.parent.location.href = "../html_components/sidebar.html";
  };
});


// VIEW PDF (same page)
document.getElementById("viewPdf").onclick = () => {
  document.documentElement.classList.add("pdf-view");
};

document.getElementById("downloadPdf").onclick = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  const data = JSON.parse(localStorage.getItem("previewData"));
  if (!data) {
    alert("Invoice data not ready");
    return;
  }

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
  doc.text(`Bill No: ${data.billNo}`, 150, 32);

  const billDate = data.billDate
    ? new Date(data.billDate).toLocaleDateString("en-IN")
    : new Date().toLocaleDateString("en-IN");

  doc.text(`Date: ${billDate}`, 150, 38);

  // ================= CUSTOMER BOX =================
  doc.setDrawColor(27, 58, 142);
  doc.roundedRect(10, 50, 190, 30, 4, 4);

  doc.setFontSize(11);
  doc.text(`Bill To: ${data.customer?.name || ""}`, 14, 60);
  doc.text(`Mobile: ${data.customer?.mobile || ""}`, 14, 67);

  if (data.customer?.address) {
    const addr = doc.splitTextToSize(`Address: ${data.customer.address}`, 160);
    doc.text(addr, 14, 74);
  }

  // ================= ITEMS TABLE =================
  const rows = data.items.map((item, i) => [
    i + 1,
    item.name || "",
    item.company || item.companyName || item.company_name || "",
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
    bodyStyles: {
      textColor: 0,
    },
  });

  // ================= PAYMENT DETAILS =================
  const subtotal = Number(data.subtotal || 0);
  const previousRemaining = Number(data.previousRemaining || 0);
  const total = Number(data.total || 0);
  const paid = Number(data.paid || 0);
  const remaining = Number(data.remaining || 0);

  const y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 50;

  const paymentRows = [
    ["Sub Total", subtotal.toFixed(2)],
    ["Previous Remaining", previousRemaining.toFixed(2)],
    ["Total", total.toFixed(2)],
    ["Paid", paid.toFixed(2)],
    ["Remaining", remaining.toFixed(2)],
  ];

  doc.autoTable({
    startY: y,
    head: [["Payment Details", "Amount"]],
    body: paymentRows,
    styles: { fontSize: 10, halign: "left" },
    columnStyles: { 0: { halign: "left" }, 1: { halign: "right" } },
    headStyles: { fillColor: [27, 58, 142], textColor: 255 },
    bodyStyles: { textColor: 0 },
    didParseCell: function (data) {
      if (data.section === "head" && data.column.index === 1) {
        data.cell.styles.halign = "right";
      }
    },
    theme: "grid",
  });

  // ================= PAYMENT STATUS =================
  const statusY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);

  if (remaining === 0) {
    doc.setTextColor(0, 150, 0); // green
    doc.text("Payment Status: PAID", 140, statusY);
  } else if (remaining > 0 && remaining < total) {
    doc.setTextColor(200, 0, 0); // red
    doc.text(`Payment Status: REMAINING (${remaining.toFixed(2)})`, 140, statusY);
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

  // ================= SAVE PDF =================
  doc.save(`Invoice_${data.billNo}.pdf`);
};
