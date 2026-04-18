// ===== FIREBASE NOTIFICATIONS PUSH =====
const VAPID_KEY = "BB0jOeneUNU_vZsJR0TnU7ogOi0dDdUsZhehfSPl1Cee7TsdSHZ5pvS6A5UgubGUojXS1gZ3MhZFbxe_lEISrBU"

let swRegistration = null

// Détecter iOS
function estIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Enregistrer SW au chargement
window.addEventListener('load', async () => {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    if (!sessionData.session) return

    const dejaTraite = localStorage.getItem('notif_traite')
    if (dejaTraite) return

    // iOS → message spécial
    if (estIOS()) {
        setTimeout(() => {
            document.getElementById('notif-permission-overlay').style.display = 'flex'
            document.getElementById('notif-ios-message').style.display = 'block'
            document.getElementById('notif-normal-message').style.display = 'none'
            document.getElementById('btn-autoriser').style.display = 'none'
        }, 3000)
        return
    }

    // PC et Android → notifications push
    try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        await navigator.serviceWorker.ready
        console.log('✅ Service Worker enregistré !')
    } catch (err) {
        console.error('❌ Erreur SW:', err)
        return
    }

    setTimeout(() => {
        document.getElementById('notif-permission-overlay').style.display = 'flex'
        document.getElementById('notif-ios-message').style.display = 'none'
        document.getElementById('notif-normal-message').style.display = 'block'
        document.getElementById('btn-autoriser').style.display = 'inline-block'
    }, 3000)
})

// ===== REFUSER =====
function refuserNotifications() {
    document.getElementById('notif-permission-overlay').style.display = 'none'
    localStorage.setItem('notif_traite', 'refuse')
}

// ===== ACCEPTER =====
async function accepterNotifications() {
    document.getElementById('notif-permission-overlay').style.display = 'none'
    localStorage.setItem('notif_traite', 'accepte')

    try {
    try {
    const permission = await Notification.requestPermission()
    console.log('Permission:', permission)
    if (permission !== 'granted') {
        alert('Autorise les notifications dans les paramètres Chrome !')
        return
    }
    await initialiserToken()
} catch(e) {
    console.error('Erreur permission:', e)
    alert('Erreur: ' + e.message)
}    
    } catch (err) {
        console.error('Erreur permission:', err)
    }
}

// ===== TOKEN =====
async function initialiserToken() {
    try {
        const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js')
        const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js')

        const app = getApps().length === 0 ? initializeApp({
            apiKey: "AIzaSyCaGWpFFkAu7_FbIQzSlok8CiVsIKgfLkA",
            authDomain: "zotech-1c49d.firebaseapp.com",
            projectId: "zotech-1c49d",
            storageBucket: "zotech-1c49d.firebasestorage.app",
            messagingSenderId: "765175644752",
            appId: "1:765175644752:web:0389acbd1be21a62c10755"
        }) : getApps()[0]

        const messaging = getMessaging(app)
        const token = await getToken(messaging, { 
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swRegistration
        })

        if (!token) return

        const { data: sessionData } = await supabaseClient.auth.getSession()
        const userId = sessionData.session?.user?.id
        if (!userId) return

        await supabaseClient
            .from('profils')
            .update({ fcm_token: token })
            .eq('user_id', userId)

        console.log('✅ Token FCM sauvegardé !')

    } catch (error) {
        console.error('Erreur token:', error)
    }
}