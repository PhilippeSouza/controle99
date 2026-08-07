// Configuração do Firebase Client
// Pode ser configurado dinamicamente ou pré-preenchido

const firebaseConfig = {
    apiKey: "AIzaSyBG2GDFU8xb_kw2zhqZ90vNteciXolF4r4",
    authDomain: "controle99-cd38b.firebaseapp.com",
    projectId: "controle99-cd38b",
    storageBucket: "controle99-cd38b.firebasestorage.app",
    messagingSenderId: "776197687655",
    appId: "1:776197687655:web:5e0f88e048b3061132c7c2",
    measurementId: "G-37CSV9D457"
};

// Limpa chaves antigas de teste salvas no navegador
try { localStorage.removeItem("controle99_firebase_config"); } catch(e) {}

let db = null;
let auth = null;

function initFirebase() {
    if (typeof firebase !== 'undefined') {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            auth = firebase.auth();
            db = firebase.firestore();

            // Ativa persistência offline para PWA (funciona sem internet)
            db.enablePersistence({ synchronizeTabs: true }).catch(err => {
                console.log("Persistência offline:", err.code);
            });

            console.log("Firebase inicializado com sucesso.");
            return true;
        } catch (e) {
            console.error("Erro ao inicializar Firebase:", e);
        }
    }
    return false;
}

function saveFirebaseConfig(configObj) {
    firebaseConfig = configObj;
    localStorage.setItem("controle99_firebase_config", JSON.stringify(configObj));
    return initFirebase();
}

// Tenta inicializar ao carregar o arquivo
initFirebase();

// --- MÉTODOS DE AUTENTICAÇÃO ---

async function signInWithGoogle() {
    if (!auth) throw new Error("Firebase Auth não está configurado.");
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    try {
        const result = await auth.signInWithPopup(provider);
        return result.user;
    } catch (err) {
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
            await auth.signInWithRedirect(provider);
        } else {
            throw err;
        }
    }
}

async function signUpUser(email, password) {
    if (!auth) throw new Error("Firebase Auth não está configurado.");
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    return userCredential.user;
}

async function signInUser(email, password) {
    if (!auth) throw new Error("Firebase Auth não está configurado.");
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return userCredential.user;
}

async function signOutUser() {
    if (!auth) return;
    await auth.signOut();
}

function getCurrentUser() {
    return new Promise((resolve) => {
        if (!auth) return resolve(null);
        const unsubscribe = auth.onAuthStateChanged(user => {
            unsubscribe();
            resolve(user);
        });
    });
}

// --- MÉTODOS DE BANCO DE DADOS (FIRESTORE) ---

// Busca todas as entradas do usuário logado no Firestore
async function fetchCloudEntries() {
    const user = await getCurrentUser();
    if (!user || !db) return null;

    try {
        const snapshot = await db.collection("users")
            .doc(user.uid)
            .collection("entries")
            .orderBy("date", "desc")
            .get();

        const entries = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            entries.push({
                id: doc.id,
                date: data.date,
                rides: parseFloat(data.rides) || 0,
                tips: parseFloat(data.tips) || 0,
                km: parseFloat(data.km) || 0,
                hours: parseFloat(data.hours) || 0,
                fuel: parseFloat(data.fuel) || 0,
                food: parseFloat(data.food) || 0,
                others: parseFloat(data.others) || 0,
                notes: data.notes || ''
            });
        });
        return entries;
    } catch (error) {
        console.error("Erro ao buscar dados no Firestore:", error);
        throw error;
    }
}

// Salva ou atualiza um registro no Firestore
async function saveCloudEntry(entry) {
    const user = await getCurrentUser();
    if (!user || !db) return null;

    const entryId = String(entry.id);
    const record = {
        date: entry.date,
        rides: parseFloat(entry.rides) || 0,
        tips: parseFloat(entry.tips) || 0,
        km: parseFloat(entry.km) || 0,
        hours: parseFloat(entry.hours) || 0,
        fuel: parseFloat(entry.fuel) || 0,
        food: parseFloat(entry.food) || 0,
        others: parseFloat(entry.others) || 0,
        notes: entry.notes || '',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("users")
        .doc(user.uid)
        .collection("entries")
        .doc(entryId)
        .set(record, { merge: true });
}

// Deleta um registro do Firestore
async function deleteCloudEntry(id) {
    const user = await getCurrentUser();
    if (!user || !db) return null;

    await db.collection("users")
        .doc(user.uid)
        .collection("entries")
        .doc(String(id))
        .delete();
}

// Sincroniza em lote todos os lançamentos locais/recuperados para o Firestore
async function syncLocalEntriesToCloud(entriesList) {
    const user = await getCurrentUser();
    if (!user || !db) return false;

    const batch = db.batch();
    const userEntriesRef = db.collection("users").doc(user.uid).collection("entries");

    entriesList.forEach(entry => {
        const docRef = userEntriesRef.doc(String(entry.id));
        batch.set(docRef, {
            date: entry.date,
            rides: parseFloat(entry.rides) || 0,
            tips: parseFloat(entry.tips) || 0,
            km: parseFloat(entry.km) || 0,
            hours: parseFloat(entry.hours) || 0,
            fuel: parseFloat(entry.fuel) || 0,
            food: parseFloat(entry.food) || 0,
            others: parseFloat(entry.others) || 0,
            notes: entry.notes || '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    });

    await batch.commit();
    return true;
}

// Torna os métodos acessíveis no escopo global
window.FirebaseBackend = {
    initFirebase,
    saveFirebaseConfig,
    signInWithGoogle,
    signUpUser,
    signInUser,
    signOutUser,
    getCurrentUser,
    fetchCloudEntries,
    saveCloudEntry,
    deleteCloudEntry,
    syncLocalEntriesToCloud
};
