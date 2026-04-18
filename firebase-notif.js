// ===== FIREBASE NOTIFICATIONS PUSH =====
const VAPID_KEY = "BB0jOeneUNU_vZsJR0TnU7ogOi0dDdUsZhehfSPl1Cee7TsdSHZ5pvS6A5UgubGUojXS1gZ3MhZFbxe_lEISrBU"

let swRegistration = null

// Enregistrer le SW immédiatement
window.addEventListener('load', async () => {
    try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        console.log('✅ Service Worker enregistré !')
    } catch (err) {
        console.error('❌ Erreur SW:', err)
        return
    }

    const { data: sessionData } = await supabaseClient.auth.getSession()
    if (!sessionData.session) return

    // Si déjà accepté → ne plus afficher
    const dejaAcceptee = localStorage.getItem('notif_acceptee')
    if (dejaAcceptee) return

    // Afficher popup après 3 secondes
    setTimeout(() => {
        document.getElementById('notif-permission-overlay').style.display = 'flex'
    }, 3000)
})

// ===== REFUSER =====
function refuserNotifications() {
    document.getElementById('notif-permission-overlay').style.display = 'none'
    const compteur = parseInt(localStorage.getItem('notif_refus_compteur') || '0')
    localStorage.setItem('notif_refus_compteur', compteur + 1)
}

// ===== ACCEPTER =====
async function accepterNotifications() {
    document.getElementById('notif-permission-overlay').style.display = 'none'

    try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
            alert('Tu dois autoriser les notifications dans les paramètres de ton navigateur !')
            return
        }

        await initialiserToken()

    } catch (err) {
        console.error('Erreur permission:', err)
    }
}

// ===== INITIALISER TOKEN =====
async function initialiserToken() {
    try {
        const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js')
        const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js')

        const firebaseConfig = {
            apiKey: "AIzaSyCaGWpFFkAu7_FbIQzSlok8CiVsIKgfLkA",
            authDomain: "zotech-1c49d.firebaseapp.com",
            projectId: "zotech-1c49d",
            storageBucket: "zotech-1c49d.firebasestorage.app",
            messagingSenderId: "765175644752",
            appId: "1:765175644752:web:0389acbd1be21a62c10755"
        }

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
        const messaging = getMessaging(app)

        await navigator.serviceWorker.ready

        const token = await getToken(messaging, { 
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swRegistration
        })

        if (!token) {
            console.log('❌ Pas de token')
            return
        }

        const { data: sessionData } = await supabaseClient.auth.getSession()
        const userId = sessionData.session?.user?.id
        if (!userId) return

        await supabaseClient
            .from('profils')
            .update({ fcm_token: token })
            .eq('user_id', userId)

        localStorage.setItem('notif_acceptee', 'true')
        console.log('✅ Token FCM sauvegardé !')

    } catch (error) {
        console.error('Erreur token:', error)
    }
}