const express = require("express");
let mysql = require('mysql');
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
let exitedUsers = [];
let usersReceivedInformation = [];
let usersListNotReceived = [];
let intervalId;
const AUCTION_TIME = 1; // minutes
const AUCTION_ROUNDS = 2;
const MIN_NUMBER_OF_USERS = 3;
const ROUND_TIME = AUCTION_TIME / AUCTION_ROUNDS; // minutes
const WAITING_TIME = 10; // seconds
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

    function waitForTheNextRound() {
        io.sockets.emit('waitForTheNextRound');
        return startTheTimer(WAITING_TIME);
    }

    async function sendInformationList(socketId = null) {
        if (socketId === null)
            io.sockets.emit('informationList', {information: information});
        else
            io.sockets.to(socketId).emit('informationList', {information: information});
    }

    async function startTheNextRound() {
        let difference = customers.filter(user => !information.some((info) => user.name === info.name));
        difference.forEach((item) => {
            io.sockets.to(item.id).emit('forceDisconnect');
        });
        sortInformationList();
        sendInformationList();
        information = [];
        setTimeout(() => {
            usersListNotReceived = customers.filter(customer => !usersReceivedInformation.some((user) => customer.name === user.name));
        }, WAITING_TIME / 2);
        await waitForTheNextRound();
        console.log(usersListNotReceived);
        if (usersListNotReceived.length !== 0) {
            startTheTimer(WAITING_TIME * 2);
            while (isTimerWorking && usersListNotReceived.length !== 0) {
                usersListNotReceived.forEach((user) => {
                    sendInformationList(user.id);
                });
                setTimeout(() => {
                    usersListNotReceived = customers.filter(customer => !usersReceivedInformation.some((user) => customer.name === user.name));
                }, 2000);
            }
            if (usersListNotReceived.length !== 0) {
                usersListNotReceived.forEach((user) => {
                    io.sockets.to(user.id).emit('forceDisconnect');
                })
            }
        }
        startTheRound();
    }

    async function endTheAuction() { //TODO: Clean this code
        let difference = customers.filter(user => !information.some((info) => user.name === info.name));
        difference.forEach((item) => {
            io.sockets.to(item.id).emit('forceDisconnect');
        });
        sortInformationList();
        sendInformationList();
        await waitForTheNextRound();
        let {name, price} = information[information.length - 1];
        io.sockets.emit('announcingTheWinner', {name: name, price: price});
    }

    function startTheTimer(duration) {
        let countdown = duration;
        isTimerWorking = true;
        return new Promise((resolve) => {
            intervalId = setInterval(() => {
                if (countdown <= 0) {
                    clearInterval(intervalId);
                    isTimerWorking = false;
                    resolve();
                    return;
                }
                io.sockets.emit("startTheTimer", {duration: countdown--});
            }, 1000);
        });
    }

    async function startTheRound() {
        io.sockets.emit("startTheRound");
        await startTheTimer(ROUND_TIME * 60);
        roundCounter++;
        if (roundCounter >= AUCTION_ROUNDS)
            endTheAuction()
        else
            startTheNextRound();
    }

    function sendNewProduct(isBroadcast = true) {
        // io.sockets.to(customers[0].id).emit('forceDisconnect');
        let product = getRandomProduct();
        let imageUrl = "/static/products/" + product.file;
        let productJson = {
            image: imageUrl,
            name: product.name,
            price: product.price,
            description: product.description
        };
        if (isBroadcast)
            io.sockets.emit("callNewProduct", productJson);
        else
            socket.emit("callNewProduct", productJson);
    }

    function initializeAuction() {
        sendNewProduct();
        startTheRound();
    }

    function findUserByNamePass(name, password) {
        return users.find((item) => {
            if (item.name === name && item.password === password)
                return item;
        });
    }

    function findUserById(arr, id) {
        let index = arr.findIndex((item) => {
            return item.id === id;
        });
        return [arr[index], index];
    }


    socket.on("login", (data) => {
        if (!isUserExited(data.name)) {
            let {name, password} = data;
            let user = findUserByNamePass(name, password);
            if (user !== undefined) {
                customers.push({id: socket.id, name: user.name});
                socket.emit("successLogin");
                if (customers.length > MIN_NUMBER_OF_USERS)
                    sendNewProduct(false);
                if (customers.length === MIN_NUMBER_OF_USERS)
                    initializeAuction();
            } else
                socket.emit("wrongLogin");
        } else
            socket.emit("exitedUserCannotLogin");
    });

    function isUserExited(name) {
        return exitedUsers.some((item) => {
            return item === name;
        });
    }

    socket.on("getNewPrice", (data) => {
        let [user, index] = findUserById(customers, socket.id);
        if (isUserLoggedIn(user.name))
            if (isTimerWorking)
                information.push({id: socket.id, name: user.name, price: data.price});
            else
                socket.emit('outOfTime');
        else
            socket.emit('userNotLoggedIn');
    });

    socket.on("disconnect", () => {
        let user = findUserById(customers, socket.id);
        if (user[1] !== -1 || user[0] !== undefined) { // TODO: remove from customer and information list
            let info = findUserById(information, socket.id);
            if (info)
                information.splice(info[1], 1);
            customers.splice(user[1], 1);
            if (customers.length < MIN_NUMBER_OF_USERS) {
                io.sockets.emit("minNumberOfUsers");
                clearInterval(intervalId);
            }
            exitedUsers.push(user[0].name);
        }
    });

    // TODO : Check this out
    socket.on("informationReceived", () => {
        let [user] = findUserById(customers, socket.id);
        usersReceivedInformation.push(user);
    });
});