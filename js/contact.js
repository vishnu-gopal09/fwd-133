(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  $("contact-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("c-name").value.trim(), email = $("c-email").value.trim(), text = $("c-msg").value.trim();
    var st = $("c-status");
    st.className = "form-msg error";
    if (!name) { st.textContent = "Please enter your name."; return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { st.textContent = "Enter a valid email address."; return; }
    if (text.length < 10) { st.textContent = "Message should be at least 10 characters."; return; }
    try {
      var all = JSON.parse(localStorage.getItem("messContact.v1") || "[]");
      all.push({ name: name, email: email, message: text, sent: new Date().toISOString() });
      localStorage.setItem("messContact.v1", JSON.stringify(all));
    } catch (err) { /* storage unavailable */ }
    $("contact-form").reset();
    st.className = "form-msg success";
    st.textContent = "Thanks, " + name + ". Your message has been recorded.";
  });
})();
