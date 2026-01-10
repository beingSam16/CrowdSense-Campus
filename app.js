// ================= FIREBASE INIT =================
// 🔴 Replace this config with YOUR Firebase Web App config
const firebaseConfig = {
  apiKey: "AIzaSyB49TEXISsq9h-9m0PHq_JlshVU_vEJA2s",
  authDomain: "crowdsense-campus-233ad.firebaseapp.com",
  databaseURL: "https://crowdsense-campus-233ad-default-rtdb.firebaseio.com",
  projectId: "crowdsense-campus-233ad",
  storageBucket: "crowdsense-campus-233ad.firebasestorage.app",
  messagingSenderId: "29710577266",
  appId: "1:29710577266:web:7fc9a4152f3133d0245ceb",
  measurementId: "G-R3EBHCF9F1"
};

firebase.initializeApp(firebaseConfig);
var database = firebase.database();

// ================= PAGE NAV =================
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const page = btn.dataset.page;
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(page).classList.remove("hidden");
  });
});

// ================= HELPERS =================
function setMeter(bar, percent) {
  if (!bar) return;
  bar.style.width = percent + "%";
  bar.classList.remove("low", "medium", "high");
  if (percent < 40) bar.classList.add("low");
  else if (percent < 70) bar.classList.add("medium");
  else bar.classList.add("high");
}

function crowdLabel(percent) {
  if (percent < 40) return "Low crowd";
  if (percent < 70) return "Moderate crowd";
  return "High crowd";
}

// ================= DASHBOARD + FACILITIES =================
var facilitiesRef = database.ref("facilities");

facilitiesRef.on("value", snap => {
  var data = snap.val();
  if (!data) return;

  let openCount = 0;
  let total = 0;
  let totalPercent = 0;
  let pcount = 0;

  for (let key in data) {
    total++;
    let f = data[key];

    if (f.status === "open") openCount++;

    if (typeof f.count === "number" && typeof f.capacity === "number") {
      let percent = Math.round((f.count / f.capacity) * 100);
      totalPercent += percent;
      pcount++;

      // dashboard meters (if exist)
      setMeter(document.getElementById(key + "Meter"), percent);
    }

    // open/close badges (if exist)
    let badge = document.getElementById(key + "Status");
    if (badge) {
      badge.innerText = f.status === "open" ? "Open" : "Closed";
      badge.classList.remove("open", "closed");
      badge.classList.add(f.status === "open" ? "open" : "closed");
    }
  }

  // summary cards
  let facOpen = document.getElementById("facOpen");
  if (facOpen) facOpen.innerText = openCount + "/" + total;

  let avgCrowd = document.getElementById("avgCrowd");
  if (avgCrowd && pcount > 0) {
    avgCrowd.innerText = Math.round(totalPercent / pcount) + "%";
  }
});

// ================= MAIN LIBRARY CARD =================
var libRef = database.ref("library");

libRef.on("value", snap => {
  var lib = snap.val();
  if (!lib) return;

  let percent = Math.round((lib.count / lib.capacity) * 100);

  setMeter(document.getElementById("libMeter"), percent);

  let t = document.getElementById("libText");
  let p = document.getElementById("libPercent");
  if (t) t.innerText = crowdLabel(percent);
  if (p) p.innerText = percent + "%";
});

// ================= CLASSROOM SUMMARY =================
var classRef = database.ref("classrooms");

classRef.on("value", snap => {
  var data = snap.val();
  if (!data) return;

  let ongoing = 0;
  let free = 0;

  for (let room in data) {
    if (data[room].status === "ongoing") ongoing++;
    else free++;
  }

  let o = document.getElementById("ongoingCount");
  let f = document.getElementById("freeCount");
  if (o) o.innerText = ongoing;
  if (f) f.innerText = free;
});

// ================= EVENTS SYSTEM (MODERN UI) =================

let allEvents = [];

database.ref("events").on("value", snap => {
  const data = snap.val();
  allEvents = [];

  if (!data) return;

  for (let id in data) {
    allEvents.push({ id, ...data[id] });
  }

  populateClubFilter();
  renderEvents();
});

function populateClubFilter() {
  const select = document.getElementById("filterClub");
  if (!select) return;

  const clubs = new Set();
  allEvents.forEach(e => clubs.add(e.club));

  select.innerHTML = `<option value="all">All Clubs</option>`;

  clubs.forEach(club => {
    const opt = document.createElement("option");
    opt.value = club;
    opt.textContent = club;
    select.appendChild(opt);
  });
}

function renderEvents() {
  const clubF = document.getElementById("filterClub").value;
  const typeF = document.getElementById("filterType").value;
  const eligF = document.getElementById("filterEligibility").value;

  const container = document.getElementById("eventsContainer");
  container.innerHTML = "";

  const filtered = allEvents.filter(ev => {
    if (clubF !== "all" && ev.club !== clubF) return false;
    if (typeF !== "all" && ev.type !== typeF) return false;
    if (eligF !== "all" && ev.eligibility !== eligF) return false;
    return true;
  });

  document.getElementById("eventCount").innerText = filtered.length;

  filtered.forEach(ev => {
    const card = document.createElement("div");
    card.className = "event-card";

    const badge = ev.type === "Tech" ? "badge-tech" : "badge-nontech";

    card.innerHTML = `
      <div>
        <div class="event-title-row">
          <div>
            <div class="event-title">${ev.title}</div>
            <div class="event-club">${ev.club}</div>
          </div>
          <div class="${badge}">${ev.type}</div>
        </div>

        <div class="event-desc">${ev.description || ""}</div>

        <div class="event-meta">
          <div>📅 ${ev.date}</div>
          <div>⏰ ${ev.time}</div>
        </div>

        <div>
          <span class="badge-elig">${ev.eligibility || "All Students"}</span>
        </div>
      </div>

      <div class="event-footer">
        <button class="register-btn">Register Now</button>
      </div>
    `;

    container.appendChild(card);
  });
}

// Filter listeners
document.getElementById("filterClub")?.addEventListener("change", renderEvents);
document.getElementById("filterType")?.addEventListener("change", renderEvents);
document.getElementById("filterEligibility")?.addEventListener("change", renderEvents);


// ================= AI PREDICTIONS =================
var predRef = database.ref("predictions/Library");

predRef.on("value", snap => {
  var data = snap.val();
  if (!data) return;

  var entries = Object.entries(data);
  entries.sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  var first3 = entries.slice(0, 3);

  let bestHour = null;
  let bestPercent = 999;

  first3.forEach((item, index) => {
    var hour = item[0];
    var percent = item[1].percent;
    var level = item[1].level;

    var el = document.getElementById("pred" + (index + 1));
    if (!el) return;

    el.innerText = percent + "% • " + level;
    el.classList.remove("green", "yellow", "red");
    if (level === "Low") el.classList.add("green");
    if (level === "Medium") el.classList.add("yellow");
    if (level === "High") el.classList.add("red");

    if (percent < bestPercent) {
      bestPercent = percent;
      bestHour = hour;
    }
  });

  let best = document.getElementById("bestTimeText");
  if (best && bestHour !== null) {
    best.innerText = bestHour + ":00 (Expected low crowd)";
  }
});
// ================= CLASSROOM LIST =================
var classListRef = database.ref("classrooms");

classListRef.on("value", snap => {
  var data = snap.val();
  if (!data) return;

  let container = document.getElementById("classroomList");
  if (!container) return;

  container.innerHTML = "";

  for (let room in data) {
    let r = data[room];

    let div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="card-body">
        <h3>${room}</h3>
        <div class="muted">${r.subject || ""} • ${r.faculty || ""}</div>
        <div class="status-badge ${r.status === "ongoing" ? "open" : "closed"}">
          ${r.status}
        </div>
      </div>
    `;

    container.appendChild(div);
  }
});
// ================= REPORT ISSUE =================
var btn = document.getElementById("submitIssue");
if (btn) {
  btn.addEventListener("click", function() {
    var title = document.getElementById("issueTitle").value;
    var fac = document.getElementById("issueFacility").value;
    var desc = document.getElementById("issueDesc").value;

    if (!title || !fac || !desc) {
      alert("Fill all fields");
      return;
    }

    database.ref("issues").push({
      title: title,
      facility: fac,
      description: desc,
      createdAt: Date.now()
    });

    alert("Issue submitted!");
    document.getElementById("issueTitle").value = "";
    document.getElementById("issueFacility").value = "";
    document.getElementById("issueDesc").value = "";
  });
}
// ================= AUTO CLASSROOM STATUS FROM TIMETABLE =================

function timeToMinutes(t) {
  let parts = t.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function updateClassroomFromTimetable() {
  const now = new Date();

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dayName = days[now.getDay()];

  let hh = now.getHours().toString().padStart(2, "0");
  let mm = now.getMinutes().toString().padStart(2, "0");
  let currentTime = hh + ":" + mm;
  let nowMin = timeToMinutes(currentTime);

  // ==================================================
  // 🛑 STEP 5: CHECK ADMIN OVERRIDE FIRST
  // ==================================================

  database.ref("overrides/classroom20").once("value").then(overrideSnap => {
    const override = overrideSnap.val();

    if (override && override.active) {
      console.log("🛑 ADMIN OVERRIDE ACTIVE:", override);

      database.ref("classrooms/classroom20").update({
        status: override.status,
        subject: override.subject || ""
      });

      return; // ⛔ STOP HERE — DO NOT RUN TIMETABLE LOGIC
    }

    // ==================================================
    // ✅ NO OVERRIDE → CONTINUE NORMAL TIMETABLE LOGIC
    // ==================================================

    var path = "timetables/SY_B/SY_B/" + dayName;
    console.log("Checking timetable path:", path);

    var ref = database.ref(path);

    ref.once("value").then(snapshot => {
      var data = snapshot.val();
      console.log("Timetable data for today:", data);

      // Default: free
      database.ref("classrooms/classroom20").update({
        status: "free",
        subject: ""
      });

      if (!data) {
        console.log("❌ No timetable found for today");
        return;
      }

      for (let start in data) {
        let slot = data[start];

        let startMin = timeToMinutes(start.replace("_", ":"));
        let endMin = timeToMinutes(slot.endsAt);

        console.log("Checking slot:", start.replace("_", ":"), "to", slot.endsAt);

        if (nowMin >= startMin && nowMin < endMin) {
          if (slot.type === "lecture") {
            console.log("✅ MATCHED LECTURE:", slot.subject);
            database.ref("classrooms/classroom20").update({
              status: "ongoing",
              subject: slot.subject
            });
          } else if (slot.type === "lab") {
            console.log("✅ MATCHED LAB");
            database.ref("classrooms/classroom20").update({
              status: "ongoing",
              subject: "Lab Session"
            });
          }
        }
      }
    }).catch(err => {
      console.error("Firebase read error:", err);
    });

  }).catch(err => {
    console.error("Override read error:", err);
  });
}

// Run every minute
setInterval(updateClassroomFromTimetable, 60000);
updateClassroomFromTimetable();
