<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDM-lK7SVxnQ8j2_QacTPLauE50RaTKPRM",
    authDomain: "ei-social.firebaseapp.com",
    projectId: "ei-social",
    storageBucket: "ei-social.firebasestorage.app",
    messagingSenderId: "1005094792930",
    appId: "1:1005094792930:web:9519944aabba7cf8c778bb",
    measurementId: "G-8QSJC6HDTQ"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>