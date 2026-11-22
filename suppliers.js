(function () {
  "use strict";
  var KEY = "messSuppliers.v1";
  var seed = [
    { id: 1, name: "Sharma Traders", phone: "9810000001", items: "Rice, wheat flour, lentils" },
    { id: 2, name: "Fresh Farms Produce", phone: "9810000002", items: "Onions, potatoes, vegetables" },
    { id: 3, name: "Delhi Oil Depot", phone: "9810000003", items: "Cooking oil, ghee" }
  ];
  function $(id) { return document.getElementById(id); }
  function load() { try { var r = localStorage.getItem(KEY); return r ? JSON.parse(r) : seed; } catch (e) { return seed; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }
  function cell(text) { var td = document.createElement("td"); td.textContent = text; return td; }
  var list = load();

  function render() {
    var q = $("sup-search").value.trim().toLowerCase();
    var body = $("sup-body");
    body.textContent = "";
    var shown = list.filter(function (s) { return (s.name + " " + s.items).toLowerCase().indexOf(q) !== -1; });
    if (!shown.length) {
      var tr = document.createElement("tr"), td = cell("No suppliers found.");
      td.className = "empty"; td.colSpan = 4; tr.appendChild(td); body.appendChild(tr); return;
    }
    shown.forEach(function (s) {
      var tr = document.createElement("tr");
      tr.appendChild(cell(s.name));
      var ph = document.createElement("td"), a = document.createElement("a");
      a.href = "tel:" + s.phone; a.textContent = s.phone; ph.appendChild(a); tr.appendChild(ph);
      tr.appendChild(cell(s.items));
      var act = document.createElement("td"), b = document.createElement("button");
      b.type = "button"; b.className = "btn-small"; b.textContent = "Delete";
      b.setAttribute("aria-label", "Delete " + s.name);
      b.addEventListener("click", function () {
        if (confirm("Delete " + s.name + "?")) {
          list = list.filter(function (x) { return x.id !== s.id; });
          save(); render();
        }
      });
      act.appendChild(b); tr.appendChild(act); body.appendChild(tr);
    });
  }

  $("sup-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("sup-name").value.trim(), phone = $("sup-phone").value.replace(/[\s-]/g, ""), items = $("sup-items").value.trim();
    var msg = $("sup-msg");
    msg.className = "form-msg error";
    if (!name) { msg.textContent = "Enter the supplier name."; return; }
    if (!/^\d{10}$/.test(phone)) { msg.textContent = "Phone must be exactly 10 digits."; return; }
    if (!items) { msg.textContent = "List what this supplier provides."; return; }
    var id = list.reduce(function (m, s) { return Math.max(m, s.id); }, 0) + 1;
    list.push({ id: id, name: name, phone: phone, items: items });
    save(); render();
    $("sup-form").reset();
    msg.className = "form-msg success";
    msg.textContent = name + " saved.";
  });

  $("sup-search").addEventListener("input", render);
  render();
})();
