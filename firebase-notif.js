// ===== FIREBASE NOTIFICATIONS PUSH =====
const VAPID_KEY = "BB0jOeneUNU_vZsJR0TnU7ogOi0dDdUsZhehfSPl1Cee7TsdSHZ5pvS6A5UgubGUojXS1gZ3MhZFbxe_lEISrBU"

async function initialiserNotifications() {
    try {
        const { data: sessionData } = await supabaseClient.auth.getSession()
        if (!sessionData.session) return

        // Si déjà accepté → ne plus demander
        const dejaAcceptee = localStorage.getItem('notif_acceptee')
        if (dejaAcceptee) return

        // Demander permission directement au navigateur
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js')
        const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js')

        const app = initializeApp({
            apiKey: "AIzaSyCaGWpFFkAu7_FbIQzSlok8CiVsIKgfLkA",
            authDomain: "zotech-1c49d.firebaseapp.com",
            projectId: "zotech-1c49d",
            storageBucket: "zotech-1c49d.firebasestorage.app",
            messagingSenderId: "765175644752",
            appId: "1:765175644752:web:0389acbd1be21a62c10755"
        })

        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        await navigator.serviceWorker.ready

        const messaging = getMessaging(app)
        const token = await getToken(messaging, { 
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration
        })

        if (!token) return

        const userId = sessionData.session.user.id

        await supabaseClient
            .from('profils')
            .update({ fcm_token: token })
            .eq('user_id', userId)

        localStorage.setItem('notif_acceptee', 'true')
        console.log('✅ Token FCM sauvegardé !')

    } catch (error) {
        console.error('Erreur notifications:', error)
    }
}

// Lancer après 3 secondes
window.addEventListener('load', async () => {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    if (!sessionData.session) return
    setTimeout(initialiserNotifications, 3000)
})