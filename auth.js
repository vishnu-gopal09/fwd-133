(function () {
  "use strict";
  var KEY = "messAuth.v1";
  function user() { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } }
  window.messAuth = {
    user: user,
    login: function (u) { try { sessionStorage.setItem(KEY, u); } catch (e) {} },
    logout: function () { try { sessionStorage.removeItem(KEY); } catch (e) {} }
  };

  // Protected pages (<html data-protected>) redirect to login first
  if (document.documentElement.hasAttribute("data-protected") && !user()) {
    var page = location.pathname.split("/").pop() || "index.html";
    location.replace("login.html?next=" + encodeURIComponent(page));
    return;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var link = document.getElementById("auth-link");
    var cta = document.getElementById("cta-link");
    if (!user()) return;
    if (link) {
      link.textContent = "Logout";
      link.href = "#";
      link.addEventListener("click", function (e) {
        e.preventDefault();
        window.messAuth.logout();
        location.href = "index.html";
      });
    }
    if (cta) { cta.textContent = "Go to inventory"; cta.href = "inventory.html"; }
  });
})();
