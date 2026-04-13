const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, query, where, onSnapshot, deleteDoc, doc } = require('firebase/firestore');

// কনফিগারেশন ফাইল পড়া
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// ফায়ারবেস ইনিশিয়ালাইজ করা
const app = initializeApp(config.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log(`প্রিন্ট এজেন্ট চালু হচ্ছে... রেস্টুরেন্ট আইডি: ${config.tenantId}`);

signInWithEmailAndPassword(auth, config.email, config.password)
  .then(() => {
    console.log("প্রিন্ট এজেন্ট সফলভাবে লগিন হয়েছে!");

    // ডাটাবেজ মনিটর করা
    const q = query(collection(db, "print_requests"), where("tenantId", "==", config.tenantId));

    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          console.log("নতুন অর্ডার প্রিন্ট হচ্ছে...", data.orderId);
          
          try {
            // এখানে আপনার প্রিন্টিং লজিক বসান
            // await ptp.print("order.pdf"); 
            
            console.log("প্রিন্টিং সফল।");
            
            // প্রিন্ট সফল হলে ডাটাবেজ থেকে রিকোয়েস্ট মুছে ফেলুন
            await deleteDoc(doc(db, "print_requests", change.doc.id));
            console.log("রিকোয়েস্ট ডাটাবেজ থেকে মুছে ফেলা হয়েছে।");
          } catch (error) {
            console.error("প্রিন্টিং সমস্যা:", error);
          }
        }
      });
    });
  })
  .catch((error) => {
    console.error("লগিন সমস্যা:", error.message);
  });
