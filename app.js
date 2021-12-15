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
let db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "auction"
});
app.use("/static", express.static("./static/"));
app.get("/", function (request, response) {
    response.sendFile(__dirname + "/index.html");
});


let users;
let products;
let customers = [];
let information = [];
let isTimerWorking = false;
let roundCounter = 0;
const AUCTION_TIME = 60; // minutes
const AUCTION_ROUNDS = 6;
db.connect(function (err) {
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


function getRandomProduct() {
    return products[0];
}

function isUserLoggedIn(name) {
    return customers.some((item) => {
        return name === item.name;
    });
}

io.on("connection", (socket) => {

    function sortInformationList() {
        information.sort((a, b) => {
            return a.price - b.price;
        });
    }

    function startTheNextRound() {
        io.sockets.emit('waitForTheNextRound'); // TODO : Front - wait about 30 seconds
        sortInformationList();
        io.sockets.emit('informationList', {information: information}); // TODO : Front
        setTimeout(() => {
            // Next round will be started
            startTheTimer();
        }, 30000)
    }

    function endTheAuction() {
        // Announce the winner
    }

    function startTheTimer() {
        let countdown = AUCTION_TIME / AUCTION_ROUNDS * 60;
        isTimerWorking = true;
        let intervalId = setInterval(() => {
            if (countdown <= 0) {
                clearInterval(intervalId);
                isTimerWorking = false;
                roundCounter++;
                if (roundCounter > AUCTION_ROUNDS)
                    endTheAuction()
                else
                    startTheNextRound();
            }

            io.sockets.emit("startTheTimer", {duration: countdown--});
        }, 1000);
    }

    function sendNewProduct() {
        let product = getRandomProduct();
        let imageUrl = "/static/products/" + product.file;
        io.sockets.emit("callNewProduct", {
            image: imageUrl,
            name: product.name,
            price: product.price,
            description: product.description
        });
    }

    function initializeAuction() {
        sendNewProduct();
        startTheTimer();
    }

    function findUser(name, password) {
        return users.find((item) => {
            if (item.name === name && item.password === password)
                return item;
        });
    }

    socket.on("login", (data) => {
        let {name, password} = data;
        let currentUser = findUser(name, password);
        if (currentUser !== undefined) {
            customers.push({name: currentUser.name});
            socket.emit("successLogin");
            if (customers.length >= 2)  // TODO : Change this :)
                initializeAuction();
        } else
            socket.emit("wrongLogin");
    });

    socket.on("getNewPrice", (data) => {
        if (isUserLoggedIn(data.name))
            if (isTimerWorking)
                information.push({name: data.name, price: data.price});
            else
                socket.emit('outOfTime')  // TODO: Front
        else
            socket.emit('userNotLoggedIn') // TODO: Front
    });
});