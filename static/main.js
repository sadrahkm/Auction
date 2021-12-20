/* eslint-disable no-undef */
$(document).ready(function () {
  const socket = io.connect("http://localhost:3000/");
  let isPricingOpen = false;

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
      socket.emit("login", { name: username, password: password });
    }
  });

  $("#price_form").submit((event) => {
    event.preventDefault();
    if (isPricingOpen) {
      let proposedPrice = $("#price_value_id").val();
      if (proposedPrice === "")
        alert("Oops! Please, enter your proposed price⚠️");
      else {
        socket.emit("getNewPrice", {
          price: proposedPrice
        });
        $("#price_value_id").val('');
      }
    } else
      alert("Please wait")
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
  });

  socket.on('startTheTimer', (data) => {
    let durationInSeconds = data.duration;
    let display = $("#remaining_time");
    updateTimer(durationInSeconds, display);
  });

  socket.on("outOfTime", () => {
    alert("Sorry! Round hasn't been started 😞");
  });

  socket.on("userNotLoggedIn", () => {
    alert("⚠️You are not logged in!");
  });

  socket.on("waitForTheNextRound", () => {
    isPricingOpen = false;
    $("#start_auction_id").html("برای شروع دور بعدی منتظر بمانید");
    $("#start_auction_id").css("background-color", "#CDC849");
  });

  socket.on("startTheRound", () => {
    isPricingOpen = true;
    $("#start_auction_id").html("مزایده آغاز شد");
    $("#start_auction_id").css("background-color", "#32CD32");
  })

  socket.on("informationList", (data) => {
    $(".customerRow").remove();
    socket.emit('informationReceived');
    for (var i = 0; i < data.information.length; i++) {
      $('#customers > tbody:last-child').append(`
      <tr class = "customerRow">
      <td>${data.information[i].name}</td>
      <td>${data.information[i].price}</td>
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

  socket.on("exitedUserCannotLogin", () => {
    alert("You cannot login anymore!");
  });

  socket.on('forceDisconnect', () => {
    window.location.reload();
  });
  socket.on('minNumberOfUsers', () => {
    alert('The auction needs at least 3 people. Auction stopped!');
    window.location.reload();
  });
  socket.on('ping', () => {
    socket.emit('pong');
  });
  socket.on("waitForDelay", () => {
    $("#start_auction_id").html("لطفا کمی منتظر بمانید...");
  });
});