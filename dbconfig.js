
//Import all JS dependencies and config database
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import {getDatabase} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js"; 


const firebaseConfig = {
    apiKey: "AIzaSyBCt-7B1yxQFf4MGVr8LlzYGjsuUfHeubk",
    authDomain: "jeopardy-app-f9400.firebaseapp.com",
    databaseURL: "https://jeopardy-app-f9400-default-rtdb.firebaseio.com",
    projectId: "jeopardy-app-f9400",
    storageBucket: "jeopardy-app-f9400.firebasestorage.app",
    messagingSenderId: "963595068149",
    appId: "1:963595068149:web:3c17c4bede1977e9441bbc"
  };

  const app = initializeApp(firebaseConfig);

  // Initialize Realtime Database and get a reference to the service
  window.db = getDatabase(app);

  