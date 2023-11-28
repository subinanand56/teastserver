import express from "express";
import cors from "cors";
import mysql from "mysql";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.listen(8081, () => {
  console.log("Server Running");
});

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "dashboard",
});
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("MySQL Connected...");
});

const storage = multer.diskStorage({
  destination:(req, file, cb)=>{
    cb(null, 'public/images')
  },
  filename: (req, file ,cb)=>{
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  }
})

const upload = multer({
  storage: storage
})


app.post("/register", (req, res) => {
  const sql =
    "INSERT INTO register (`name`,`email`,`branch`,`role`,`password`,`phone`,`address`)VALUES (?)";
  const data = [
    req.body.name,
    req.body.email,
    req.body.branch,
    req.body.role,
    req.body.password,
    req.body.phone,
    req.body.address,
  ];
  db.query(sql, [data], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const sql = "SELECT * FROM register WHERE email = ? AND password = ?";
  db.query(sql, [email, password], (err, result) => {
    if (err) return res.json(err);

    if (result.length > 0) {
      const roleQuery = "SELECT role FROM register WHERE email = ?";
      const branchQuery = "SELECT branch FROM register WHERE email = ?";
      const idQuery = "SELECT id FROM register WHERE email = ?"; // Fetch id column

      db.query(roleQuery, [email], (roleErr, roleResult) => {
        if (roleErr) return res.json(roleErr);

        if (roleResult.length > 0) {
          db.query(branchQuery, [email], (branchErr, branchResult) => {
            if (branchErr) return res.json(branchErr);

            if (branchResult.length > 0) {
              db.query(idQuery, [email], (idErr, idResult) => { // Fetch id value
                if (idErr) return res.json(idErr);

                if (idResult.length > 0) {
                  const eid = idResult[0].id; // Extract id value

                  const role = roleResult[0].role;
                  const branch = branchResult[0].branch;

                  const token = jwt.sign(
                    { eid, role, branch }, // Include id in the token payload
                    "qwertyuiopasdfghjklzxcvbnmqwertyui"
                  );

                  return res.json({
                    success: true,
                    message: "Login successful",
                    eid,
                    role,
                    branch,
                    token,
                  });
                } else {
                  return res.json({
                    success: false,
                    message: "Id not found for the user",
                  });
                }
              });
            } else {
              return res.json({
                success: false,
                message: "Branch not found for the user",
              });
            }
          });
        } else {
          return res.json({
            success: false,
            message: "Role not found for the user",
          });
        }
      });
    } else {
      return res.json({ success: false, message: "Invalid email or password" });
    }
  });
});



app.get("/users", (req, res) => {
  const sql = "SELECT * FROM register ";
  db.query(sql, (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});


app.delete("/users/:id", (req, res) => {
  const userId = req.params.id;
  const sql = "DELETE FROM register WHERE id = ?";
  db.query(sql, userId, (err, result) => {
    if (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ error: "Error deleting user" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ message: "User deleted successfully" });
  });
});



app.post("/branch", (req, res) => {
  const sql = "INSERT INTO branch (`name`)VALUES (?)";
  const branchdata = [req.body.name];
  db.query(sql, [branchdata], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});

app.get("/getbranch", (req, res) => {
  const sql = "SELECT * FROM branch ";
  db.query(sql, (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});

app.put("/updatebranch/:id", (req, res) => {
  const branchId = req.params.id;
  const { name } = req.body;

  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Name field is required for update" });
  }

  const sql = "UPDATE branch SET name = ? WHERE bid = ?";
  db.query(sql, [name, branchId], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to update branch",
          error: err,
        });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Branch updated successfully" });
  });
});

app.delete("/deletebranch/:id", (req, res) => {
  const branchId = req.params.id;
  const sql = "DELETE FROM branch WHERE bid = ?";
  db.query(sql, [branchId], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to delete branch",
          error: err,
        });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Branch deleted successfully" });
  });
});


app.post("/product", (req, res) => {
  const sql = "INSERT INTO product (`name`)VALUES (?)";
  const productdata = [req.body.name];
  db.query(sql, [productdata], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});

app.get("/product", (req, res) => {
  const sql = "SELECT * FROM product ";
  db.query(sql, (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});

app.put("/product/:id", (req, res) => {
  const productId = req.params.id;
  const newName = req.body.name;
  if (!newName) {
    return res
      .status(400)
      .json({ success: false, message: "Name field is required for update" });
  }

  const sql = "UPDATE product SET name = ? WHERE id = ?";
  const productData = [newName, productId];

  db.query(sql, productData, (err, result) => {
    if (err) return res.json(err);
    return res.json({ message: "Product updated successfully", result });
  });
});


app.delete("/product/:id", (req, res) => {
  const productId = req.params.id;
  const sql = "DELETE FROM product WHERE id = ?";
  const productData = [productId];

  db.query(sql, productData, (err, result) => {
    if (err) return res.json(err);
    return res.json({ message: "Product deleted successfully", result });
  });
});


app.post("/test", (req, res) => {
  const sql =
    "INSERT INTO test (`name`,`date`)VALUES (?)";
  const data = [
    req.body.name,
    req.body.date,  
  ];
  db.query(sql, [data], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});

app.post("/sales", (req, res) => {
  const sql =
    "INSERT INTO sales (`name`,`price`,`branch`,`quantity`,`date`,`unit`)VALUES (?)";
  const data = [
    req.body.name,
    req.body.price,
    req.body.branch,
    req.body.quantity,
    req.body.date,
    req.body.unit,
    
  ];
  db.query(sql, [data], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});


app.get("/getsales", (req, res) => {
  const branch = req.query.branch;
  const startDate = req.query.start_date;
  const endDate = req.query.end_date;

  let sql = "SELECT * FROM sales WHERE 1 = 1"; 

  const params = [];
  if (branch) {
    sql += " AND `branch` = ?";
    params.push(branch);
  }

  if (startDate && endDate) {
    sql += " AND `date` BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.json(err);
    return res.json(results);
  });
});


app.post("/expense", (req, res) => {
  const sql =
    "INSERT INTO expense (`item`,`price`,`branch`,`date`)VALUES (?)";
  const data = [
    req.body.item,
    req.body.price,
    req.body.branch,
    req.body.date, 
  ];
  db.query(sql, [data], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});


app.get("/getexpenses", (req, res) => {
  const branch = req.query.branch;
  const startDate = req.query.start_date;
  const endDate = req.query.end_date;

  let sql = "SELECT * FROM expense WHERE 1 = 1"; 

  const params = [];
  if (branch) {
    sql += " AND `branch` = ?";
    params.push(branch);
  }

  if (startDate && endDate) {
    sql += " AND `date` BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.json(err);
    return res.json(results);
  });
});

app.post("/purchase",(req, res) => {
  const sql =
    "INSERT INTO purchase (`productName`,`price`,`branch`,`companyName`,`accepted`,`date`)VALUES (?)";
  const data = [
    req.body.productName,
    req.body.price,
    req.body.branch,
    req.body.companyName, 
    req.body.accepted,
    req.body.date,
  ];
  db.query(sql, [data], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});

app.post("/purchaseimage",upload.single('image'),(req, res) => {
  const sql =
    "INSERT INTO purchase (`productName`,`price`,`branch`,`companyName`,`accepted`,`date`,`Eid`,`image`)VALUES (?)";
  const data = [
    req.body.productName,
    req.body.price,
    req.body.branch,
    req.body.companyName, 
    req.body.accepted,
    req.body.date,
    req.body.Eid,
    req.file.filename,  
  ];
  db.query(sql, [data], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});

app.get("/purchasedetails/:Eid", (req, res) => {
  const Eid = req.params.Eid;
  const sql = "SELECT * FROM purchase WHERE Eid = ?";
  
  db.query(sql, [Eid], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: "No purchases found for this Eid" });
    }

    return res.json({ purchases: results });
  });
});



app.get("/getallrqst", (req, res) => {
  const { branch } = req.query;
  const sql = "SELECT * FROM purchase WHERE branch = ?"; 
  db.query(sql, [branch], (err, result) => {
    if (err) return res.json(err);
    return res.json(result);
  });
});


app.put("/updatestatus/:id", (req, res) => {
  const { id } = req.params;
  const { accepted } = req.body; 

  const sql = "UPDATE purchase SET accepted = ? WHERE id = ?";
  db.query(sql, [accepted, id], (err, result) => {
    if (err) return res.json(err);
    return res.json({ message: `Status updated for purchase ID ${id}`, accepted });
  });
});



app.get("/getpurchases", (req, res) => {
  const branch = req.query.branch;
  const startDate = req.query.start_date;
  const endDate = req.query.end_date;

  let sql = "SELECT * FROM purchase WHERE `accepted` = 1"; 
  const params = [];
  if (branch) {
    sql += " AND `branch` = ?";
    params.push(branch);
  }

  if (startDate && endDate) {
    sql += " AND `date` BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.json(err);
    return res.json(results);
  });
});

// Endpoint to get the total sum of prices for sales within a date range
app.get("/sales/total", (req, res) => {
  const { fromDate, toDate, branch } = req.query;

  let sql = "SELECT SUM(price) AS totalSales FROM sales WHERE date BETWEEN ? AND ?";
  const data = [fromDate, toDate];

  if (branch) {
    sql += " AND branch = ?";
    data.push(branch);
  }

  db.query(sql, data, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const totalSales = result[0].totalSales || 0; // Extract total sales or default to 0
    
    return res.json({ totalSales });
  });
});

// Endpoint to get the total sum of expenses within a date range
app.get("/expenses/total", (req, res) => {
  const { fromDate, toDate, branch } = req.query;

  let sql = "SELECT SUM(price) AS totalExpenses FROM expense WHERE date BETWEEN ? AND ?";
  const data = [fromDate, toDate];

  if (branch) {
    sql += " AND branch = ?";
    data.push(branch);
  }

  db.query(sql, data, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const totalExpenses = result[0].totalExpenses || 0; // Extract total expenses or default to 0

    return res.json({ totalExpenses });
  });
});

app.get("/purchase/total", (req, res) => {
  const { fromDate, toDate, branch } = req.query;

  let sql = "SELECT SUM(price) AS totalPurchases FROM purchase WHERE date BETWEEN ? AND ? AND accepted = ?";
  const data = [fromDate, toDate, 1];

  if (branch) {
    sql += " AND branch = ?";
    data.push(branch);
  }

  db.query(sql, data, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    const totalPurchases = result[0].totalPurchases || 0;
    return res.json({ totalPurchases });
  });
});


