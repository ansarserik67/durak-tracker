(function () {
  "use strict";

  var STORAGE_KEY = "durak-tracker:out-cards";

  var SUITS = [
    { id: "spades", symbol: "♠", name: "Пики", red: false },
    { id: "clubs", symbol: "♣", name: "Крести", red: false },
    { id: "diamonds", symbol: "♦", name: "Бубны", red: true },
    { id: "hearts", symbol: "♥", name: "Черви", red: true }
  ];

  var RANKS = ["6", "7", "8", "9", "10", "В", "Д", "К", "Т"];
  var RANK_NAMES = {
    "6": "6", "7": "7", "8": "8", "9": "9", "10": "10",
    "В": "валет", "Д": "дама", "К": "король", "Т": "туз"
  };

  var deck = [];
  SUITS.forEach(function (suit) {
    RANKS.forEach(function (rank) {
      deck.push({ id: rank + "_" + suit.id, rank: rank, suit: suit });
    });
  });

  var suitsEl = document.getElementById("suits");
  var resetBtn = document.getElementById("resetBtn");
  var counterValue = document.getElementById("counterValue");

  var out = loadState();
  var suitCountEls = {};

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return new Set();
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? new Set(arr) : new Set();
    } catch (e) {
      return new Set();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(out)));
    } catch (e) {
      /* приватный режим — просто не сохраняем */
    }
  }

  function remainingIn(suitId) {
    var total = 0;
    for (var i = 0; i < deck.length; i++) {
      if (deck[i].suit.id === suitId && !out.has(deck[i].id)) total++;
    }
    return total;
  }

  function buildSuitRow(suit) {
    var row = document.createElement("section");
    row.className = "suit-row";

    var badge = document.createElement("div");
    badge.className = "suit-badge" + (suit.red ? " suit-badge--red" : "");

    var icon = document.createElement("span");
    icon.className = "suit-badge__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = suit.symbol;

    var name = document.createElement("span");
    name.className = "suit-badge__name";
    name.textContent = suit.name;

    var count = document.createElement("span");
    count.className = "suit-badge__count";
    count.textContent = "9/9";
    suitCountEls[suit.id] = count;

    badge.appendChild(icon);
    badge.appendChild(name);
    badge.appendChild(count);

    var cards = document.createElement("div");
    cards.className = "suit-cards";

    deck
      .filter(function (entry) {
        return entry.suit.id === suit.id;
      })
      .forEach(function (entry, index) {
        cards.appendChild(buildCard(entry, index));
      });

    row.appendChild(badge);
    row.appendChild(cards);
    return row;
  }

  function buildCard(entry, index) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card" + (entry.suit.red ? " card--red" : "");
    btn.dataset.id = entry.id;
    btn.style.setProperty("--i", index);
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute(
      "aria-label",
      RANK_NAMES[entry.rank] + " " + entry.suit.name.toLowerCase()
    );

    var rank = document.createElement("span");
    rank.className = "card__rank";
    rank.textContent = entry.rank;

    var center = document.createElement("span");
    center.className = "card__suit card__suit--center";
    center.textContent = entry.suit.symbol;

    var suit = document.createElement("span");
    suit.className = "card__suit";
    suit.textContent = entry.suit.symbol;

    btn.appendChild(rank);
    btn.appendChild(center);
    btn.appendChild(suit);

    btn.addEventListener("click", function () {
      toggle(entry, btn);
    });

    return btn;
  }

  function toggle(entry, el) {
    if (out.has(entry.id)) {
      out.delete(entry.id);
      el.classList.remove("is-out");
      el.setAttribute("aria-pressed", "false");
    } else {
      out.add(entry.id);
      el.classList.add("is-out");
      el.setAttribute("aria-pressed", "true");
    }
    saveState();
    updateSuitCount(entry.suit.id);
    updateCounter(true);
  }

  function updateSuitCount(suitId) {
    var left = remainingIn(suitId);
    var el = suitCountEls[suitId];
    if (el) {
      el.textContent = left + "/9";
      el.classList.toggle("is-empty", left === 0);
    }
  }

  function updateCounter(animate) {
    var remaining = deck.length - out.size;
    counterValue.textContent = String(remaining);
    counterValue.parentElement.setAttribute(
      "aria-label",
      "В игре " + remaining + " карт из 36"
    );
    if (animate) {
      counterValue.classList.remove("is-bump");
      void counterValue.offsetWidth; /* перезапуск анимации */
      counterValue.classList.add("is-bump");
      window.setTimeout(function () {
        counterValue.classList.remove("is-bump");
      }, 200);
    }
  }

  function render() {
    var fragment = document.createDocumentFragment();
    SUITS.forEach(function (suit) {
      var row = buildSuitRow(suit);
      row.querySelectorAll(".card").forEach(function (card) {
        if (out.has(card.dataset.id)) {
          card.classList.add("is-out");
          card.setAttribute("aria-pressed", "true");
        }
        card.classList.add("is-entering");
        card.addEventListener("animationend", function onEnd() {
          card.classList.remove("is-entering");
          card.removeEventListener("animationend", onEnd);
        });
      });
      fragment.appendChild(row);
    });
    suitsEl.appendChild(fragment);
  }

  function resetAll() {
    out.clear();
    saveState();
    var cards = suitsEl.querySelectorAll(".card");
    cards.forEach(function (card) {
      card.classList.remove("is-out");
      card.setAttribute("aria-pressed", "false");
      card.classList.add("is-entering");
      card.addEventListener(
        "animationend",
        function onEnd() {
          card.classList.remove("is-entering");
          card.removeEventListener("animationend", onEnd);
        },
        { once: true }
      );
    });
    SUITS.forEach(function (suit) {
      updateSuitCount(suit.id);
    });
    updateCounter(true);
  }

  resetBtn.addEventListener("click", resetAll);

  render();
  SUITS.forEach(function (suit) {
    updateSuitCount(suit.id);
  });
  updateCounter(false);
})();
