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
      alert("⚠️Oops! Please, enter username and password");
    }
    else {
      localStorage.setItem('name', username);
      socket.emit("login", { name: username, password: password });
    }
  });

  $("#price_form").submit((event) => {
    event.preventDefault();
    let proposedPrice = $("#price_value_id").val();
    if (proposedPrice === "")
      alert("Oops! Please, enter your proposed price⚠️");
    else {
      socket.emit("getNewPrice", {
        name: localStorage.getItem('name'),
        price: proposedPrice
      });
      $("#price_value_id").val('');
    }
  })

  // ----------------------------------------------

  socket.on("successLogin", () => {
    $("#login_page").css("display", "none");
    $("#auction_page").css("display", "block");
  });

  socket.on("wrongLogin", () => {
    alert("⚠️Your data is wrong!")
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
  });

  socket.on("outOfTime", () => {
    alert("Sorry! The auction is over😞");
  });

  socket.on("userNotLoggedIn", () => {
    alert("⚠️You are not logged in!");
  });

  socket.on("informationList", (data) => {
    for (var i = 0; i < data.information.length; i++) {
      $('#customers > tbody:last-child').append(`
      <tr>
      <td>${data.information[i].name}</td>
      <td id="price">${data.information[i].price}</td>
      </tr>
      `);
    }
  });

  socket.on("announcingTheWinner", (data) => {
    $("#modal-id").css("display", "block");
    $(".winner-name").html(`${data.name} با قیمت ${data.price}برنده شد`);
    $("#auction_page").toggleClass("page-after-Determining-winner");
    $(".close").click(() => {
      $("#modal-id").css("display", "none");
      $("#auction_page").removeClass("page-after-Determining-winner");
    });
    $("#start_auction_id").html("!مزایده تمام شد");
    $("#start_auction_id").css("background-color", "red");
  });
});