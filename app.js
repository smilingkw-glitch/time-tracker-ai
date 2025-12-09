// ---------------------- Imports ---------------------- //
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ---------------------- Firebase Config ---------------------- //
const firebaseConfig = {
  apiKey: "AIzaSyC0J72Xd-2hGniRVe_iMuIjh2Z1M2Up278",
  authDomain: "time-tracker-ai-21d3f.firebaseapp.com",
  projectId: "time-tracker-ai-21d3f",
  storageBucket: "time-tracker-ai-21d3f.firebasestorage.app",
  messagingSenderId: "392736566446",
  appId: "1:392736566446:web:8c849e725bd988e280513f",
  measurementId: "G-GBNKPJMQBM"
};

// ---------------------- Initialize Firebase ---------------------- //
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

console.log("Firebase connected");

// ---------------------- DOM Elements ---------------------- //
const loginSection = document.getElementById("login-section");
const appSection = document.getElementById("app-section");
const googleLoginBtn = document.getElementById("google-login");
const logoutBtn = document.getElementById("logout-btn");
const datePicker = document.getElementById("date-picker");
const activityName = document.getElementById("activity-name");
const activityMin = document.getElementById("activity-min");
const activityCategory = document.getElementById("activity-category");
const addActivityBtn = document.getElementById("add-activity");
const activityListDiv = document.getElementById("activity-list");
const remainingTimeP = document.getElementById("remaining-time");
const analyseBtn = document.getElementById("analyse-btn");
const dashboard = document.getElementById("dashboard");
const noData = document.getElementById("no-data");

let remainingMinutes = 1440;

// ---------------------- Login with Google ---------------------- //
googleLoginBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Logged in as:", user.displayName);
  } catch (error) {
    console.error("Login failed:", error);
  }
});

// ---------------------- Logout ---------------------- //
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    console.log("User logged out");
  } catch (error) {
    console.error("Logout failed:", error);
  }
});

// ---------------------- Show App if Logged in ---------------------- //
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = "none";
    appSection.style.display = "block";
  } else {
    loginSection.style.display = "block";
    appSection.style.display = "none";
  }
});

// ---------------------- Add Activity Function ---------------------- //
addActivityBtn.addEventListener("click", async () => {
  const name = activityName.value.trim();
  const minutes = parseInt(activityMin.value);
  const category = activityCategory.value;

  if (!name || !minutes || minutes <= 0) {
    alert("Enter valid activity and minutes");
    return;
  }

  if (minutes > remainingMinutes) {
    alert(`You only have ${remainingMinutes} minutes left for this day`);
    return;
  }

  const user = auth.currentUser;
  if (!user) return alert("User not logged in");

  const date = datePicker.value;
  if (!date) return alert("Select a date");

  const activity = { name, minutes, category };

  // Save to Firestore
  const docRef = doc(db, "users", user.uid, "days", date, "activities", name);
  await setDoc(docRef, activity);

  // Update remaining minutes
  remainingMinutes -= minutes;
  remainingTimeP.innerText = `Remaining: ${remainingMinutes} minutes`;

  // Clear inputs
  activityName.value = "";
  activityMin.value = "";

  // Render activities
  renderActivities();
});

// ---------------------- Render Activities ---------------------- //
async function renderActivities() {
  activityListDiv.innerHTML = "";
  const user = auth.currentUser;
  if (!user) return;

  const date = datePicker.value;
  if (!date) return;

  const activitiesCol = collection(db, "users", user.uid, "days", date, "activities");
  const snapshot = await getDocs(activitiesCol);

  if (snapshot.empty) {
    noData.style.display = "block";
    dashboard.style.display = "none";
    activityListDiv.innerHTML = "<p>No activities yet</p>";
    remainingMinutes = 1440;
    remainingTimeP.innerText = `Remaining: ${remainingMinutes} minutes`;
    return;
  }

  noData.style.display = "none";
  dashboard.style.display = "none";

  let totalMinutes = 0;
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    totalMinutes += data.minutes;
    const div = document.createElement("div");
    div.innerText = `${data.name} - ${data.category} - ${data.minutes} min`;
    activityListDiv.appendChild(div);
  });

  remainingMinutes = 1440 - totalMinutes;
  remainingTimeP.innerText = `Remaining: ${remainingMinutes} minutes`;
}

// ---------------------- Fetch Activities on Date Change ---------------------- //
datePicker.addEventListener("change", () => {
  renderActivities();
});

// ---------------------- Analyse Button ---------------------- //
analyseBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return alert("User not logged in");

  const date = datePicker.value;
  if (!date) return alert("Select a date");

  const activitiesCol = collection(db, "users", user.uid, "days", date, "activities");
  const snapshot = await getDocs(activitiesCol);

  if (snapshot.empty) {
    dashboard.style.display = "none";
    noData.style.display = "block";
    return;
  }

  noData.style.display = "none";
  dashboard.style.display = "block";

  // Prepare data for chart
  const categoryMap = {};
  let totalMinutes = 0;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    totalMinutes += data.minutes;
    if (categoryMap[data.category]) {
      categoryMap[data.category] += data.minutes;
    } else {
      categoryMap[data.category] = data.minutes;
    }
  });

  // Summary text
  const summary = document.getElementById("summary");
  summary.innerText = `Total Hours: ${(totalMinutes / 60).toFixed(2)}h | Total Activities: ${snapshot.size}`;

  // Prepare chart
  const ctx = document.getElementById("chart").getContext("2d");

  // Destroy previous chart if exists
  if (window.myChart) window.myChart.destroy();

  window.myChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(categoryMap),
      datasets: [{
        data: Object.values(categoryMap),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
        title: {
          display: true,
          text: `Activities Breakdown for ${date}`
        }
      }
    }
  });
});

