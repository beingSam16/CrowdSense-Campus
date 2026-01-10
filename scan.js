// ================= FIREBASE INIT =================
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
// ================= QR SCANNER =================
const scanner = new Html5Qrcode("reader");
let scanLocked = false;

Html5Qrcode.getCameras().then(devices => {
  if (!devices.length) {
    alert("No camera found");
    return;
  }

  scanner.start(
    devices[0].id,
    { fps: 10, qrbox: 250 },
    onScanSuccess,
    (err) => {
      // ignore scan errors
    }
  );
}).catch(err => {
  console.error("Camera error:", err);
});

// ================= SCAN HANDLER =================
function onScanSuccess(decodedText, decodedResult) {
  console.log("QR detected:", decodedText);

  if (scanLocked) {
    console.log("Scan locked, ignoring...");
    return;
  }

  scanLocked = true;

  const facilityId = decodedText.trim().toLowerCase();
  console.log("Facility ID:", facilityId);

  const ref = db.ref("facilities/" + facilityId);

  ref.once("value").then(snapshot => {
    if (!snapshot.exists()) {
      alert("❌ Invalid Facility QR");
      scanLocked = false;
      return;
    }

    const data = snapshot.val();
    const count = data.count || 0;
    const capacity = data.capacity || 0;

    if (capacity && count >= capacity) {
      alert("⚠️ Facility is full");
      scanLocked = false;
      return;
    }

    // ✅ Update facility count
    ref.update({
      count: count + 1,
      updatedAt: Date.now()
    });

    // ✅ Log check-in
    db.ref("checkin_logs").push({
      facility: facilityId,
      time: Date.now()
    });

    alert(
      "✅ Check-in Successful!\n\n" +
      "Facility: " + facilityId.replace("_", " ").toUpperCase() + "\n" +
      "Current Count: " + (count + 1) + "\n\n" +
      "Next scan allowed in 3 seconds"
    );

    // 🔓 Unlock after 3 seconds
    setTimeout(() => {
      scanLocked = false;
      console.log("Scanner unlocked");
    }, 3000);

  }).catch(err => {
    console.error("Firebase error:", err);
    scanLocked = false;
  });
}

.facilities-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ROW BASE */
.facility-row {
  display: grid;
  gap: 20px;
}

/* 2 cards in row */
.facility-row.two {
  grid-template-columns: repeat(2, 1fr);
}

/* 3 cards in row */
.facility-row.three {
  grid-template-columns: repeat(3, 1fr);
}

/* Responsive fallback */
@media (max-width: 900px) {
  .facility-row.two,
  .facility-row.three {
    grid-template-columns: 1fr;
  }
}

