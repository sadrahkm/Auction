const express = require("express");
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

io.on("connection", (socket) => {


});