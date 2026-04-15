// ===== FIREBASE NOTIFICATIONS PUSH =====
const VAPID_KEY = "BB0jOeneUNU_vZsJR0TnU7ogOi0dDdUsZhehfSPl1Cee7TsdSHZ5pvS6A5UgubGUojXS1gZ3MhZFbxe_lEISrBU"

// ===== AFFICHER POPUP =====
function afficherPopupNotifications() {
    const overlay = document.getElementById('notif-permission-overlay')
    if (!overlay) return
    overlay.style.display = 'flex'
}

// ===== REFUSER =====
function refuserNotifications() {
    const overlay = document.getElementById('notif-permission-overlay')
    if (overlay) overlay.style.display = 'none'

    // Compter les refus
    const compteur = parseInt(localStorage.getItem('notif_refus_compteur') || '0')
    localStorage.setItem('notif_refus_compteur', compteur + 1)
}

// ===== ACCEPTER =====
async function accepterNotifications() {
    const overlay = document.getElementById('notif-permission-overlay')
    if (overlay) overlay.style.display = 'none'

    try {
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

        const messaging = getMessaging(app)
        const token = await getToken(messaging, { vapidKey: VAPID_KEY })

        if (!token) return

        const { data: sessionData } = await supabaseClient.auth.getSession()
        const userId = sessionData.session?.user?.id
        if (!userId) return

        await supabaseClient
            .from('profils')
            .update({ fcm_token: token })
            .eq('user_id', userId)

        localStorage.setItem('notif_acceptee', 'true')
        localStorage.removeItem('notif_refus_compteur')
        console.log('✅ Token FCM sauvegardé !')

    } catch (error) {
        console.error('Erreur notifications:', error)
    }
}

// ===== LANCER =====
window.addEventListener('load', async () => {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    if (!sessionData.session) return

    // Si déjà accepté → ne plus afficher
    const dejaAcceptee = localStorage.getItem('notif_acceptee')
    if (dejaAcceptee) return

    // Si refusé → afficher seulement toutes les 2 connexions
    const compteur = parseInt(localStorage.getItem('notif_refus_compteur') || '0')
    if (compteur > 0 && compteur % 2 !== 0) {
        localStorage.setItem('notif_refus_compteur', compteur + 1)
        return
    }

    setTimeout(afficherPopupNotifications, 3000)
})