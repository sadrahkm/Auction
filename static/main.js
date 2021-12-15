/* eslint-disable no-undef */
$(document).ready(function () {
  const socket = io.connect("http://localhost:3000/");

    function updateTimer(duration, display) {
        let timer = duration, minutes, seconds;
        // setInterval(function () {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);

            // minutes = minutes < 10 ? "0" + minutes : minutes;
            // seconds = seconds < 10 ? "0" + seconds : seconds;

            display.text(minutes + ":" + seconds);

            // if (--timer < 0) {
            //     timer = duration;
            // }
        // }, 1000);
    }

  $("#login-Btn").click((event) => {
    event.preventDefault();
    let username = $("#username").val();
    let password = $("#password").val();
    if (username === "" | password === "") {
      alert("Oops! Please, enter username and password⚠️")
    }
    else {
      localStorage.setItem('name', username);
      socket.emit("login", { name: username, password: password })
    }
  });

  $("#price_form").submit((event) => {
    event.preventDefault();
    let proposedPrice = $("#price_value_id").val();
    if (proposedPrice === "")
      alert("Oops! Please, enter your proposed price⚠️");
    else {
      socket.emit("getNewPrice", {name: localStorage.getItem('name'), price: proposedPrice});
      $("#price_value_id").val('')
    }
  })

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
    $("#start_auction_id").html("مزایده آغاز شد");
    $("#start_auction_id").css("background-color", "#32CD32");
  });

  socket.on('startTheTimer', (data) => {
      let durationInSeconds = data.duration;
      let display = $("#remaining_time");
      updateTimer(durationInSeconds, display);
  })
});