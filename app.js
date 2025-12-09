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
const chartCanvas = document.getElementById("chart");

let activities = [];
let remainingMinutes = 1440;
let chartInstance = null;

// ---------------------- Login ---------------------- //
googleLoginBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Logged in as:", result.user.displayName);
  } catch (err) {
    console.error("Login failed:", err);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    console.log("Logged out");
  } catch (err) {
    console.error("Logout failed:", err);
  }
});

onAuthStateChanged(auth, (user) => {
  if(user){
    loginSection.style.display = "none";
    appSection.style.display = "block";
    if(datePicker.value) fetchActivities();
  } else {
    loginSection.style.display = "block";
    appSection.style.display = "none";
  }
});

// ---------------------- Add Activity ---------------------- //
addActivityBtn.addEventListener("click", async () => {
  const name = activityName.value.trim();
  const minutes = parseInt(activityMin.value);
  const category = activityCategory.value;

  if(!name || !minutes || minutes <=0){
    alert("Enter valid activity and minutes");
    return;
  }

  if(minutes > remainingMinutes){
    alert(`Only ${remainingMinutes} minutes remaining`);
    return;
  }

  const user = auth.currentUser;
  if(!user) return alert("Login first");

  const date = datePicker.value;
  if(!date) return alert("Select a date");

  const activity = {name, minutes, category};
  const docRef = doc(db, "users", user.uid, "days", date, "activities", name);
  await setDoc(docRef, activity);

  activities.push(activity);
  remainingMinutes -= minutes;
  remainingTimeP.innerText = `Remaining: ${remainingMinutes} minutes`;

  renderActivitiesUI();
  activityName.value = "";
  activityMin.value = "";
});

// ---------------------- Fetch & Render ---------------------- //
datePicker.addEventListener("change", fetchActivities);

async function fetchActivities(){
  const user = auth.currentUser;
  if(!user) return;

  const date = datePicker.value;
  if(!date) return;

  const activitiesCol = collection(db, "users", user.uid, "days", date, "activities");
  const snapshot = await getDocs(activitiesCol);

  activities = [];
  let total = 0;

  if(snapshot.empty){
    noData.style.display = "block";
    dashboard.style.display = "none";
    activityListDiv.innerHTML = "<p>No activities yet</p>";
    remainingMinutes = 1440;
    remainingTimeP.innerText = `Remaining: ${remainingMinutes} minutes`;
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    activities.push(data);
    total += data.minutes;
  });

  remainingMinutes = 1440 - total;
  remainingTimeP.innerText = `Remaining: ${remainingMinutes} minutes`;

  noData.style.display = "none";
  dashboard.style.display = "none";
  renderActivitiesUI();
}

// ---------------------- Render UI ---------------------- //
function renderActivitiesUI(){
  activityListDiv.innerHTML = "";
  activities.forEach(a => {
    const div = document.createElement("div");
    div.innerText = `${a.name} - ${a.category} - ${a.minutes} min`;
    activityListDiv.appendChild(div);
  });
}

// ---------------------- Analyse Button ---------------------- //
analyseBtn.addEventListener("click", () => {
  if(activities.length === 0){
    alert("No activities to analyse");
    return;
  }

  const categoryMinutes = {};
  activities.forEach(a => {
    if(!categoryMinutes[a.category]) categoryMinutes[a.category] = 0;
    categoryMinutes[a.category] += a.minutes;
  });

  const labels = Object.keys(categoryMinutes);
  const data = Object.values(categoryMinutes);

  if(chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas, {
    type: "pie",
    data: {
      labels,
      datasets:[{
        label: "Minutes spent",
        data,
        backgroundColor: ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"]
      }]
    }
  });

  dashboard.style.display = "block";
});
