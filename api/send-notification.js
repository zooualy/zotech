const admin = require('firebase-admin')

// Initialiser Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    })
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' })
    }

    const { tokens, titre, corps, lien } = req.body

    if (!tokens || tokens.length === 0) {
        return res.status(400).json({ error: 'Aucun token' })
    }

    try {
        const message = {
            notification: {
                title: titre || 'ZoTech',
                body: corps || 'Nouvelle notification'
            },
            webpush: {
                fcmOptions: {
                    link: lien || 'https://zotech.technology'
                },
                notification: {
                    icon: 'https://zotech.technology/favicon.ico',
                    badge: 'https://zotech.technology/favicon.ico'
                }
            },
            tokens: tokens
        }

        const response = await admin.messaging().sendEachForMulticast(message)
        return res.status(200).json({ 
            succes: response.successCount,
            echecs: response.failureCount
        })

    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}