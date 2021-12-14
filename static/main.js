/* eslint-disable no-undef */
$(document).ready(function () {
  const socket = io.connect("http://localhost:3000/");
  $("#login-Btn").click((event) => {
    event.preventDefault();
    let username = $("#username").val();
    let password = $("#password").val();
    if (username === "" | password === "") {
      alert("Oops! Please, enter username and password⚠")
    }
    else {
      socket.emit("login", { name: username, password: password })
    }
  });

  // ----------------------------------------------

  socket.on("successLogin", () => {
    $("#login_page").css("display", "none");
    $("#auction_page").css("display", "block");
  });

  socket.on("wrongLogin", () => {
    alert("Your data is wrong!")
  });

  socket.on("callNewProduct", (data) => {
    $("#product_image").attr("src", data.image);
    $("#product_name").text(data.name);
    $("#base_price").text(data.price);
    $("#description").text(data.description);
  });
});