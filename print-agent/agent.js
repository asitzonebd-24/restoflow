const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, query, where, onSnapshot, deleteDoc, doc } = require('firebase/firestore');

// কনফিগারেশন ফাইল পড়া
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// ফায়ারবেস ইনিশিয়ালাইজ করা
const app = initializeApp(config.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // অটোমেটিক ডিফল্ট ডাটাবেজ ধরবে

console.log("প্রিন্ট এজেন্ট চালু হচ্ছে...");

signInWithEmailAndPassword(auth, config.email, config.password)
  .then(() => {
    console.log("সফলভাবে লগিন হয়েছে!");

    // ডাটাবেজ মনিটর করা
    const q = query(collection(db, "print_requests"), where("tenantId", "==", config.tenantId));

    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          console.log("নতুন অর্ডার পাওয়া গেছে!");
          // প্রিন্টিং লজিক এখানে আসবে
          await deleteDoc(doc(db, "print_requests", change.doc.id));
        }
      });
    });
  })
  .catch((error) => {
    console.error("লগিন এরর:", error.message);
  });
