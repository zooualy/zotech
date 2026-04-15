// ===== FIREBASE NOTIFICATIONS PUSH =====
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')

const firebaseConfig = {
    apiKey: "AIzaSyCaGWpFFkAu7_FbIQzSlok8CiVsIKgfLkA",
    authDomain: "zotech-1c49d.firebaseapp.com",
    projectId: "zotech-1c49d",
    storageBucket: "zotech-1c49d.firebasestorage.app",
    messagingSenderId: "765175644752",
    appId: "1:765175644752:web:0389acbd1be21a62c10755"
}

const VAPID_KEY = "BB0jOeneUNU_vZsJR0TnU7ogOi0dDdUsZhehfSPl1Cee7TsdSHZ5pvS6A5UgubGUojXS1gZ3MhZFbxe_lEISrBU"

// ===== INITIALISER FIREBASE =====
async function initialiserFirebase() {
    const { default: app } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js')
    const { getMessaging, getToken, onMessage } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js')

    const firebaseApp = initializeApp(firebaseConfig)
    const messaging = getMessaging(firebaseApp)

    return { messaging, getToken, onMessage }
}

// ===== DEMANDER AUTORISATION =====
async function demanderAutorisationNotifications() {
    try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return null

        const { messaging, getToken } = await initialiserFirebase()

        const token = await getToken(messaging, { vapidKey: VAPID_KEY })
        if (!token) return null

        // Sauvegarder le token dans Supabase
        const { data: sessionData } = await supabaseClient.auth.getSession()
        const userId = sessionData.session?.user?.id
        if (!userId) return null

        await supabaseClient
            .from('profils')
            .update({ fcm_token: token })
            .eq('user_id', userId)

        console.log('Token FCM sauvegardé !')
        return token

    } catch (error) {
        console.error('Erreur notifications:', error)
        return null
    }
}

// ===== ENVOYER NOTIFICATION PUSH =====
async function envoyerNotificationPush(userIds, titre, corps, lien) {
    // Cette fonction sera appelée côté serveur
    // Pour l'instant on stocke dans Supabase
    for (const userId of userIds) {
        await creerNotification(userId, 'push', corps, lien)
    }
}

// ===== LANCER =====
window.addEventListener('load', async () => {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    if (!sessionData.session) return

    // Demander autorisation après connexion
    setTimeout(demanderAutorisationNotifications, 3000)
})