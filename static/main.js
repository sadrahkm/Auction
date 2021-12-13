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
    $("#login_page").css("display", "block");
    $("#auction-page").css("display", "none");
  });

  socket.on("callNewProduct", (data) => {
    $("image").attr("src", data.image);
    $("price").text(data.price);
    $("description").text(data.description);
  });
});