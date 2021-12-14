const express = require("express");
var mysql = require('mysql');
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log("Server listening at port %d", port);
});


app.use("/static", express.static("./static/"));

app.get("/", function (request, response) {
  response.sendFile(__dirname + "/index.html");
});

var db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "auction"
});
let users;
let products;
let customers = [];
let information = [];
db.connect(function(err) {
  if (err) throw err;
  db.query("SELECT * FROM users", function (err, dbUsers, fields) {
    if (err) throw err;
    users = dbUsers
  });
  
  db.query("SELECT * FROM products", function (err, dbProducts, fields) {
    if (err) throw err;
    products = dbProducts;
  });
});


function getRandomProduct(){
  return products[0];
}

function isUserLoggedIn(name){
  return customers.some((item) => {
    return name === item.name;
  });
}


io.on("connection", (socket) => {

  function initializeAuction(){
    console.log("Begin!");
      let product = getRandomProduct();
      let imageUrl = "/static/products/" + product.file;
     socket.emit("callNewProduct", {image: imageUrl, name: product.name, price: product.price, description: product.description});
  } 
  socket.on("login", (data) => {
    // console.log(getRandomProduct())
    let {name, password} = data;
    let currentUser = users.find((item) => {
      if (item.name === name && item.password === password)
        return item;
    });
    // console.log(currentUser);
    if (currentUser !== undefined){
      customers.push({name: currentUser.name});
      // console.log(customers)
      socket.emit("successLogin");
      if (customers.length >= 3)  // TODO : Change this :)
        initializeAuction();
    }
    else
      socket.emit("wrongLogin");
  });

  socket.on("getNewPrice", (data) => { // data => name, price
    if (isUserLoggedIn(data.name)){
      information.push({name: data.name, price: data.price});
    }
  });  
});