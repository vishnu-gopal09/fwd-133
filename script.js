(function () {
  "use strict";

  var INV_KEY = "messInventory.v1";
  var LOG_KEY = "messUsage.v1";

  var seed = [
    { id: 1, name: "Rice", qty: 120, unit: "kg", min: 40 },
    { id: 2, name: "Wheat flour", qty: 65, unit: "kg", min: 30 },
    { id: 3, name: "Cooking oil", qty: 14, unit: "L", min: 20 },
    { id: 4, name: "Lentils", qty: 40, unit: "kg", min: 25 },
    { id: 5, name: "Onions", qty: 30, unit: "kg", min: 15 }
  ];

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }

  var items = load(INV_KEY, null) || seed;
  var log = load(LOG_KEY, []);

  function $(id) { return document.getElementById(id); }
  function round(n) { return Math.round(n * 100) / 100; }
  function today() { return new Date().toLocaleDateString("en-CA"); }
  function status(i) { return i.qty <= 0 ? "out" : (i.qty <= i.min ? "low" : "ok"); }
  function statusLabel(s) { return s === "out" ? "Out of stock" : (s === "low" ? "Low" : "OK"); }
  function el(tag, text, cls) {
    var e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  function setMsg(id, text, type) {
    var m = $(id);
    m.textContent = text;
    m.className = "form-msg" + (type ? " " + type : "");
  }

  /* ---- Feature 1: stock manager (add, restock, search, filter, delete) ---- */
  function renderTable() {
    var body = $("inventory-body");
    var q = $("search").value.trim().toLowerCase();
    var onlyLow = $("filter").value === "low";
    body.textContent = "";

    var shown = items.filter(function (i) {
      return i.name.toLowerCase().indexOf(q) !== -1 && (!onlyLow || status(i) !== "ok");
    });

    if (!shown.length) {
      var tr = el("tr");
      var td = el("td", "No items match.", "empty");
      td.colSpan = 5;
      tr.appendChild(td);
      body.appendChild(tr);
      return;
    }

    shown.forEach(function (i) {
      var s = status(i);
      var tr = el("tr", undefined, s !== "ok" ? "is-low" : "");
      tr.appendChild(el("td", i.name));
      tr.appendChild(el("td", i.qty + " " + i.unit));
      tr.appendChild(el("td", i.min + " " + i.unit));
      var st = el("td");
      st.appendChild(el("span", statusLabel(s), "pill " + s));
      tr.appendChild(st);
      var act = el("td");
      var del = el("button", "Delete", "btn-small");
      del.type = "button";
      del.setAttribute("aria-label", "Delete " + i.name);
      del.addEventListener("click", function () {
        if (confirm("Delete " + i.name + " from the store?")) {
          items = items.filter(function (x) { return x.id !== i.id; });
          persistAndRender();
        }
      });
      act.appendChild(del);
      tr.appendChild(act);
      body.appendChild(tr);
    });
  }

  $("add-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("add-name").value.trim();
    var qty = parseFloat($("add-qty").value);
    var min = parseFloat($("add-min").value);
    var unit = $("add-unit").value;
    if (!name) { setMsg("add-msg", "Please enter an item name.", "error"); return; }
    if (isNaN(qty) || qty < 0) { setMsg("add-msg", "Enter a valid quantity.", "error"); return; }
    if (isNaN(min) || min < 0) min = 0;

    var existing = items.filter(function (i) { return i.name.toLowerCase() === name.toLowerCase(); })[0];
    if (existing) {
      existing.qty = round(existing.qty + qty);
      if (min > 0) existing.min = min;
      setMsg("add-msg", "Added " + qty + " " + existing.unit + " to " + existing.name + ".", "success");
    } else {
      var id = items.reduce(function (m, i) { return Math.max(m, i.id); }, 0) + 1;
      items.push({ id: id, name: name, qty: round(qty), unit: unit, min: min });
      setMsg("add-msg", name + " added to the store.", "success");
    }
    $("add-form").reset();
    persistAndRender(true);
  });

  /* ---- Feature 2: low stock alerts + summary counts ---- */
  function renderAlert() {
    var box = $("alert");
    var low = items.filter(function (i) { return status(i) !== "ok"; });
    box.textContent = "";
    if (!low.length) { box.hidden = true; return; }
    box.hidden = false;
    var head = el("strong", low.length + (low.length === 1 ? " item needs" : " items need") + " reordering");
    box.appendChild(head);
    var ul = el("ul");
    low.forEach(function (i) {
      ul.appendChild(el("li", i.name + ": " + i.qty + " " + i.unit + " left (minimum " + i.min + " " + i.unit + ")"));
    });
    box.appendChild(ul);
  }

  function renderStats() {
    var used = log.filter(function (l) { return l.date === today(); }).length;
    $("stat-total").textContent = items.length;
    $("stat-low").textContent = items.filter(function (i) { return status(i) !== "ok"; }).length;
    $("stat-used").textContent = used;
  }

  /* ---- Feature 3: daily usage log (deducts from stock) ---- */
  function renderUsageSelect() {
    var sel = $("use-item");
    var prev = sel.value;
    sel.textContent = "";
    items.forEach(function (i) {
      var o = el("option", i.name + " (" + i.qty + " " + i.unit + ")");
      o.value = i.id;
      sel.appendChild(o);
    });
    if (prev) sel.value = prev;
  }

  function renderUsageList() {
    var ul = $("usage-list");
    ul.textContent = "";
    var todays = log.filter(function (l) { return l.date === today(); }).reverse();
    if (!todays.length) { ul.appendChild(el("li", "Nothing logged yet today.")); return; }
    todays.forEach(function (l) {
      var li = el("li");
      li.appendChild(el("span", l.name + ": " + l.qty + " " + l.unit));
      li.appendChild(el("span", l.time));
      ul.appendChild(li);
    });
  }

  $("usage-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var item = items.filter(function (i) { return String(i.id) === $("use-item").value; })[0];
    var qty = parseFloat($("use-qty").value);
    if (!item) { setMsg("use-msg", "Add an item to the store first.", "error"); return; }
    if (isNaN(qty) || qty <= 0) { setMsg("use-msg", "Enter the quantity used.", "error"); return; }
    if (qty > item.qty) { setMsg("use-msg", "Only " + item.qty + " " + item.unit + " of " + item.name + " in stock.", "error"); return; }

    item.qty = round(item.qty - qty);
    log.push({
      date: today(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      name: item.name, qty: qty, unit: item.unit
    });
    save(LOG_KEY, log);
    $("use-qty").value = "";
    setMsg("use-msg", "Recorded " + qty + " " + item.unit + " of " + item.name + ".", "success");
    persistAndRender(true);
  });

  function persistAndRender(keepMsg) {
    save(INV_KEY, items);
    renderTable();
    renderAlert();
    renderStats();
    renderUsageSelect();
    renderUsageList();
    if (!keepMsg) { setMsg("add-msg", ""); setMsg("use-msg", ""); }
  }

  $("search").addEventListener("input", renderTable);
  $("filter").addEventListener("change", renderTable);

  persistAndRender();
})();
