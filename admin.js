const firebaseConfig = {
  apiKey: "AIzaSyB49TEXISsq9h-9m0PHq_JlshVU_vEJA2s",
  authDomain: "crowdsense-campus-233ad.firebaseapp.com",
  databaseURL: "https://crowdsense-campus-233ad-default-rtdb.firebaseio.com",
  projectId: "crowdsense-campus-233ad",
  storageBucket: "crowdsense-campus-233ad.firebasestorage.app",
  messagingSenderId: "29710577266",
  appId: "1:29710577266:web:7fc9a4152f3133d0245ceb"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();

// ... [Keep your firebaseConfig and initializeApp code above] ...

// 🔐 Protect page: ONLY redirect if they are not logged in AND not already logging out
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    // Check if the current session was intentionally ended to go to landing
    // We use a small delay or a sessionStorage flag if necessary, 
    // but usually, checking the current path is enough.
    if (window.location.pathname.includes("admin-dashboard.html")) {
        // If they are on the dashboard without being logged in, 
        // they likely tried to bypass login.
        window.location.href = "admin-login.html";
    }
  }
});

// 🚪 Logout and redirect to landing page
function logout() {
    firebase.auth().signOut().then(() => {
        // This is the specific redirection after clicking the button
        window.location.href = "landing.html";
    }).catch((error) => {
        console.error("Logout Error:", error);
        alert("Error logging out.");
    });
}

// ... [Keep your markOccupied, addEvent, and deleteEvent functions exactly as they are] ...

// ================= CLASSROOM OVERRIDE =================

function markOccupied() {
  const room = document.getElementById("classroomSelect").value;
  const subject = document.getElementById("subjectInput").value;

  db.ref("overrides/" + room).set({
    active: true,
    status: "ongoing",
    subject: subject
  });

  alert("Marked Occupied");
}

function markFree() {
  const room = document.getElementById("classroomSelect").value;

  db.ref("overrides/" + room).set({
    active: true,
    status: "free",
    subject: ""
  });

  alert("Marked Free");
}

function disableOverride() {
  const room = document.getElementById("classroomSelect").value;

  db.ref("overrides/" + room + "/active").set(false);

  alert("Override Disabled");
}

// ================= EVENTS =================

function addEvent() {
  const event = {
    title: document.getElementById("eventTitle").value,
    club: document.getElementById("eventClub").value,
    type: document.getElementById("eventType").value,
    eligibility: document.getElementById("eventEligibility").value,

    date: document.getElementById("eventDate").value,
    time: document.getElementById("eventTime").value,
    venue: document.getElementById("eventVenue").value,
    description: document.getElementById("eventDesc").value,
    createdAt: Date.now()
  };

  db.ref("events").push(event);

  alert("Event Added");
}

// 📋 Show existing events

/* Keep your firebaseConfig at the top exactly as you had it */
// firebase.initializeApp(firebaseConfig); ... etc

// ... Keep your markOccupied, markFree, disableOverride, addEvent functions ...

// REPLACING the Event List rendering for a better UI:
db.ref("events").on("value", snap => {
    const list = document.getElementById("eventList");
    list.innerHTML = "";
  
    const data = snap.val();
    if (!data) {
        list.innerHTML = `<div class="text-slate-400 text-center py-10">No events found. Create one to get started.</div>`;
        return;
    }
  
    for (let id in data) {
        const ev = data[id];
        const div = document.createElement("div");
        div.className = "flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition border-slate-100 shadow-sm";
        div.innerHTML = `
            <div class="flex gap-4 items-center">
                <div class="bg-indigo-100 text-indigo-600 p-3 rounded-lg">
                    <i class="fas fa-calendar-check text-lg"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-800">${ev.title}</h4>
                    <p class="text-xs text-slate-500">
                        <i class="far fa-clock mr-1"></i> ${ev.date} | ${ev.time} 
                        <span class="mx-2">•</span> 
                        <i class="fas fa-map-marker-alt mr-1"></i> ${ev.venue}
                    </p>
                </div>
            </div>
            <button onclick="deleteEvent('${id}')" class="text-slate-400 hover:text-red-500 p-2 transition">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        list.appendChild(div);
    }
});function deleteEvent(id) {
  if (!confirm("Are you sure you want to delete this event?")) return;

  db.ref("events/" + id).remove()
    .then(() => {
      console.log("Event deleted:", id);
    })
    .catch(err => {
      console.error("Delete failed:", err);
      alert("Failed to delete event");
    });
}




// function logout() {
//   firebase.auth().signOut().then(() => {
//     window.location.href = "admin-login.html";
//   });
// }

