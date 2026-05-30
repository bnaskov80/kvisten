// --- KONFIGURATION FÖR MOLNSYNRONISERING ---
const firebaseConfig = {
    apiKey: "AIzaSyDtDtAD1tV6qV7bGr3eyVmbn84ZyiqxeI4",
    authDomain: "kvistensinfotavla.firebaseapp.com",
    projectId: "kvistensinfotavla",
    storageBucket: "kvistensinfotavla.firebasestorage.app",
    messagingSenderId: "196445782971",
    appId: "1:196445782971:web:0ab04515d24e7075b6fa9e"
};

// Initiera Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const TAVLA_ID = "kvistens_tavla"; // Unikt ID för din tavla i molnet
const LOSENORD = "skola123";