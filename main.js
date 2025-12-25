const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

// DB Setup (APP FOLDER ke andar)
const dbFolder = path.join(__dirname, "database");
const dbPath = path.join(dbFolder, "billing_app.db");

if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder);
}

const db = new sqlite3.Database(dbPath, () => {
  console.log("SQLite Connected Successfully!");
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mobile TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);
});


  ipcMain.handle("save-user",(event,user)=>{
    return new Promise(resolve =>{
      db.run("INSERT OR IGNORE INTO users(mobile , password) VALUES (?,?)",
        [user.mobile,user.password],
        err =>resolve({success:!err})

      );
    });

  });

  // Update password for the only user
ipcMain.handle("update-user-password", (event, newPassword) => {
  return new Promise(resolve => {
    db.run(
      "UPDATE users SET password = ? WHERE id = 1",
      [newPassword],
      function (err) {
        console.log("ROWS UPDATED:", this.changes);
        resolve({ success: !err && this.changes > 0 });
      }
    );
  });
});



  ipcMain.handle("check-login",(event,user)=>{
    return new Promise(resolve=>{
      db.get("SELECT * from users where mobile=? and password=?",
        [user.mobile,user.password],
        (err,row)=>{
          resolve(row ?{success:true}:{success:false});
        }
      )
    })
  });


  ipcMain.handle("check-user-exists", () => {
  return new Promise(resolve => {
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      resolve(row.count > 0);
    });
  });
});

  
   db.run(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT,
      product_name TEXT,
      company_name TEXT,
      buying_price REAL,
      selling_price REAL,
      quantity INTEGER,
      primary_unit TEXT,
      gst REAL,
      handling INTEGER
    )`, (err2) => {
      if (err2) console.log("Error creating table:", err2);
      else console.log("Table created successfully");
  });



ipcMain.handle("save-item", async (event, item) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO items 
      (product_id, product_name, company_name, buying_price, selling_price, quantity, primary_unit, gst,  handling)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(item.productId),
        item.productName,
        item.companyName,
        item.buyingPrice,
        item.sellingPrice,
        item.quantity,
        item.primaryUnit,
        item.gst,
        item.handling
      ],
      (err) => {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
});

ipcMain.handle("update-item", (event, item) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE items SET
        product_name = ?,
        company_name = ?,
        buying_price = ?,
        selling_price = ?,
        quantity = ?,
        primary_unit = ?,
        gst = ?,
        handling = ?
       WHERE product_id = ?`,
      [
        item.productName,
        item.companyName,
        item.buyingPrice,
        item.sellingPrice,
        item.quantity,
        item.primaryUnit,
        item.gst,
        item.handling,
        String(item.productId)
      ],
      err => err ? reject(err) : resolve(true)
    );
  });
});


ipcMain.handle("fetch-items", () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM items ORDER BY id DESC", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});
ipcMain.handle("delete-item", (event, productId) => {
  return new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM items WHERE product_id = ?",
      [productId],
      err => err ? reject(err) : resolve(true)
    );
  });
});


db.serialize(() => {

  // ================= BILLS TABLE =================
  db.run(`
  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    mobile TEXT,
    address TEXT,
    subtotal REAL,
    gst REAL,
    total REAL,
    extra_charges REAL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    remaining REAL DEFAULT 0,
    payment_status TEXT,
    payment_type TEXT,
   created_at DATETIME DEFAULT (datetime('now','localtime'))
  )
`);

  // ================= BILL ITEMS TABLE =================
  db.run(`
    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER,
      product_name TEXT,
      company_name TEXT,
      quantity INTEGER,
      rate REAL,
      gst REAL,
      charges REAL,
      total REAL,
      buying_price REAL,
      selling_price REAL
    )
  `);

});


// ================= SAVE BILL =================

ipcMain.handle("save-bill", async (event, bill) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO bills 
        (customer_name, mobile, address, subtotal, gst, total, extra_charges, paid_amount, remaining, payment_status, payment_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bill.customer.name,
        bill.customer.mobile,
        bill.customer.address,
        bill.subtotal,
        bill.gst,
        bill.total,
        bill.extraChargesTotal,
        bill.paid,
        bill.remaining,
        bill.paymentStatus,
        bill.paymentType
      ],
      function (err) {
        if (err) return reject(err);

        const billId = this.lastID;

        const stmt = db.prepare(`
          INSERT INTO bill_items
            (bill_id, product_name, company_name,quantity, rate, gst, charges, total,buying_price,selling_price)
          VALUES (?, ?, ?, ?, ?, ?, ?,?,?,?)
        `);

       bill.items.forEach(item => {
  stmt.run([
    billId,
    item.name,
    item.company,
    item.qty,
    item.rate,
    item.gstAmount,
    item.charges,
    item.total,
    item.buying_price,
    item.selling_price
  ]);
});


        stmt.finalize();
        resolve({ success: true, billId });
      }
    );
  });
});


ipcMain.handle("get-remaining", (event, mobile) => {
  return new Promise((resolve, reject) => {
    db.get(
      `
      SELECT remaining 
      FROM bills 
      WHERE mobile = ?
      ORDER BY id DESC 
      LIMIT 1
      `,
      [mobile],
      (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.remaining : 0);
      }
    );
  });
});

ipcMain.handle("fetch-bills", async () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM bills ORDER BY id DESC`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

// Fetch all unique customers with their bills
ipcMain.handle("fetch-customers", async () => {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT 
        id,
        customer_name,
        mobile,
        subtotal,
        total,
        remaining,
        paid_amount,
        payment_status,
        created_at
      FROM bills
      ORDER BY created_at DESC
      `,
      (err, rows) => {
        if (err) return reject(err);

        const customersMap = {};

        rows.forEach(row => {
          // 🔑 PRIMARY KEY = MOBILE
          const key = row.mobile || `no_mobile_${row.id}`;

          if (!customersMap[key]) {
            customersMap[key] = {
              name: row.customer_name || "Customer",
              mobile: row.mobile || "N/A",
              bills: []
            };
          }

          customersMap[key].bills.push({
            id: row.id,
            subtotal: row.subtotal,
            total: row.total,
            remaining: row.remaining,
            paid_amount: row.paid_amount,
            payment_status: row.payment_status,
            created_at: row.created_at
          });
        });

        resolve(Object.values(customersMap));
      }
    );
  });
});


ipcMain.handle("getCustomerDetails", (event, mobile) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT customer_name FROM bills WHERE mobile = ? ORDER BY id DESC LIMIT 1`,
      [mobile],
      (err, row) => {
        if (err) {
          console.log("DB Error:", err);
          resolve(null);
        } else {
          resolve(row || null);
        }
      }
    );
  });
});

ipcMain.handle('update-stock-by-company', (event, productName, companyName, quantity) => {
  return new Promise((resolve, reject) => {

    const stmt = db.prepare(
      "UPDATE items SET quantity = quantity - ? WHERE product_name = ? AND company_name = ? AND quantity >= ?"
    );

    stmt.run(quantity, productName, companyName, quantity, function(err) {
      if (err) {
        console.log("Stock update error:", err);
        reject({ success: false, error: err });
      } else if (this.changes === 0) {
        resolve({ success: false, message: "Stock insufficient or product not found" });
      } else {
        resolve({ success: true });
      }
    });

  });
});



ipcMain.handle("fetchTodaySummary", () => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 
        (SELECT SUM(subtotal) 
         FROM bills 
         WHERE date(created_at) = date('now','localtime')) AS todaySales,
         
        (SELECT SUM((bi.selling_price - bi.buying_price) * bi.quantity)
         FROM bill_items bi
         JOIN bills b ON bi.bill_id = b.id
         WHERE date(b.created_at) = date('now','localtime')) AS todayProfit`,
      (err, row) => {
        if (err) reject(err);
        resolve({
          todaySales: row?.todaySales || 0,
          todayProfit: row?.todayProfit || 0
        });
      }
    );
  });
});

ipcMain.handle("fetchLowStockCount", () => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) AS lowStockCount 
       FROM items 
       WHERE quantity <= 5`,
      (err, row) => {
        if (err) reject(err);
        resolve(row?.lowStockCount || 0);
      }
    );
  });
});


ipcMain.handle("fetchLastBills", () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
        b.id,
        b.customer_name,
        b.total,
        b.created_at,
        b.remaining,
        b.payment_status
       FROM bills b
       ORDER BY b.id DESC
       LIMIT 5`,
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  });
});

ipcMain.handle("fetchBill", () => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        id,
        customer_name,
        mobile,
        created_at,
        total,
        remaining
      FROM bills
      ORDER BY id DESC
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});


// ================= UPDATE BILL (Pay remaining amount) =================
ipcMain.handle("updateBill", (event, billId, paidAmount) => {
  return new Promise((resolve, reject) => {
    // Get current remaining and paid_amount
    db.get("SELECT remaining, paid_amount FROM bills WHERE id = ?", [billId], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error("Bill not found"));

      const newRemaining = row.remaining - paidAmount;
      const newPaid = row.paid_amount + paidAmount;
      const paymentStatus = newRemaining <= 0 ? "Paid" : "Partial";

      db.run(
        `UPDATE bills 
         SET remaining = ?, paid_amount = ?, payment_status = ? 
         WHERE id = ?`,
        [newRemaining < 0 ? 0 : newRemaining, newPaid, paymentStatus, billId],
        function(err2) {
          if (err2) return reject(err2);
          resolve({ success: true, remaining: newRemaining < 0 ? 0 : newRemaining, paid: newPaid, status: paymentStatus });
        }
      );
    });
  });
});


ipcMain.handle("fetch-low-stock-items", async () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM items", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});


ipcMain.handle("fetch-monthly-revenue", async (event, year, month) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM bills 
       WHERE strftime('%Y', created_at) = ?
       AND strftime('%m', created_at) = ?`,
      [String(year), String(month).padStart(2, "0")],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
});


ipcMain.handle("fetch-bill-items", async () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM bill_items`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
});

ipcMain.handle("fetch-monthly-profit", async (event, year, month) => {
  return new Promise((resolve, reject) => {

    db.all(
      `SELECT * FROM bills 
       WHERE strftime('%Y', created_at) = ?
       AND strftime('%m', created_at) = ?`,
      [String(year), String(month).padStart(2, "0")],
      async (err, bills) => {
        if (err) return reject(err);

        // attach bill items to each bill
        for (let bill of bills) {
          bill.items = await new Promise((res, rej) => {
            db.all(
              `SELECT * FROM bill_items 
               WHERE bill_id = ?`,
              [bill.id],
              (err2, items) => {
                if (err2) rej(err2);
                else res(items);
              }
            );
          });
        }

        resolve(bills);
      }
    );
  });
});


ipcMain.handle("fetch-bill-by-id", async (event, bill_id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM bills WHERE id = ?`, [bill_id], (err, bill) => {
      if (err) {
        console.error("Bill fetch error:", err);
        return reject(err);
      }
      if (!bill) return resolve(null);

      db.all(`SELECT * FROM bill_items WHERE bill_id = ?`, [bill_id], (err2, items) => {
        if (err2) {
          console.error("Bill items fetch error:", err2);
          return reject(err2);
        }

        // Attach items
        bill.items = items || [];
        resolve(bill);
      });
    });
  });
});


// WINDOW
function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false 
    }
  });

  win.loadFile(path.join(__dirname, "html_components", "sidebar.html"));
}

app.whenReady().then(createWindow);
