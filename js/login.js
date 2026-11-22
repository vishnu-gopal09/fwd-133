(function () {
  "use strict";
  var DEMO = { email: "admin@sau.ac.in", pass: "mess@123" };
  var ALLOWED = ["inventory.html", "suppliers.html"];
  function $(id) { return document.getElementById(id); }

  if (window.messAuth.user()) { location.replace("inventory.html"); return; }

  $("show-pass").addEventListener("change", function () {
    $("login-pass").type = this.checked ? "text" : "password";
  });
  $("fill-demo").addEventListener("click", function () {
    $("login-email").value = DEMO.email;
    $("login-pass").value = DEMO.pass;
    $("login-msg").textContent = "";
  });

  $("login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("login-email").value.trim().toLowerCase();
    var pass = $("login-pass").value;
    var msg = $("login-msg");
    msg.className = "form-msg error";
    if (!/^\S+@\S+\.\S+$/.test(email)) { msg.textContent = "Enter a valid email address."; return; }
    if (!pass) { msg.textContent = "Enter your password."; return; }
    if (email !== DEMO.email || pass !== DEMO.pass) { msg.textContent = "Incorrect email or password."; return; }
    window.messAuth.login(email);
    var next = new URLSearchParams(location.search).get("next");
    location.href = ALLOWED.indexOf(next) !== -1 ? next : "inventory.html";
  });
})();
