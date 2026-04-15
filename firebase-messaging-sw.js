importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

firebase.initializeApp({
    apiKey: "AIzaSyCaGWpFFkAu7_FbIQzSlok8CiVsIKgfLkA",
    authDomain: "zotech-1c49d.firebaseapp.com",
    projectId: "zotech-1c49d",
    storageBucket: "zotech-1c49d.firebasestorage.app",
    messagingSenderId: "765175644752",
    appId: "1:765175644752:web:0389acbd1be21a62c10755"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
    const { title, body, icon } = payload.notification
    self.registration.showNotification(title, {
        body: body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200]
    })
})