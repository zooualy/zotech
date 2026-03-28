// ===== CONFIGURATION SUPABASE =====
const SUPABASE_URL = 'https://boitsdxdjmyxyfpihyaf.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvaXRzZHhkam15eHlmcGloeWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTkxNTUsImV4cCI6MjA4OTc5NTE1NX0.g-K8T85MyaNTnfUpqhb-sbB47CJysW8_TZ6P_gx5djs'

const { createClient } = supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY)

// ===== INSCRIPTION =====
async function inscrire(email, motDePasse, pseudo, username) {
    const reglesUsername = /^[a-z0-9._]{3,30}$/
    if (!reglesUsername.test(username.toLowerCase())) {
        afficherMessage('erreur', '❌ Nom d\'utilisateur invalide ! Utilise uniquement des lettres minuscules, chiffres, points ou underscores (3-30 caractères)')
        return
    }

    if (username.startsWith('.') || username.startsWith('_') ||
        username.endsWith('.') || username.endsWith('_')) {
        afficherMessage('erreur', '❌ Le nom d\'utilisateur ne peut pas commencer ou finir par . ou _')
        return
    }

    if (username.includes('..') || username.includes('__') || username.includes('._') || username.includes('_.')) {
        afficherMessage('erreur', '❌ Le nom d\'utilisateur ne peut pas contenir deux symboles consécutifs')
        return
    }

    const motsInterdits = ['admin', 'zotech', 'moderateur', 'support', 'help', 'official']
    if (motsInterdits.some(mot => username.toLowerCase().includes(mot))) {
        afficherMessage('erreur', '❌ Ce nom d\'utilisateur est réservé !')
        return
    }

    const { data: existant } = await supabaseClient
        .from('profils')
        .select('username')
        .eq('username', username.toLowerCase())
        .single()

    if (existant) {
        afficherMessage('erreur', '❌ Ce nom d\'utilisateur est déjà pris !')
        return
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: motDePasse,
        options: {
            data: { pseudo: pseudo, username: username.toLowerCase() }
        }
    })

    if (error) {
        afficherMessage('erreur', error.message)
        return
    }

    await supabaseClient
        .from('profils')
        .insert([{
            user_id: data.user.id,
            username: username.toLowerCase(),
            pseudo: pseudo,
            bio: '',
            photo_profil: '',
            photo_couverture: '',
            abonnes: 0,
            abonnements: 0,
            est_admin: false
        }])

    afficherMessage('succes', `✅ Compte créé ! Bienvenue ${pseudo} 🎉`)
    setTimeout(() => {
        fermerModal()
        window.location.href = 'index.html'
    }, 1500)
}

// ===== CONNEXION =====
async function connecter(email, motDePasse) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: motDePasse
    })

    if (error) {
        afficherMessage('erreur', '❌ Email ou mot de passe incorrect')
        return
    }

    // Vérifier si le compte est banni
    const { data: profil } = await supabaseClient
        .from('profils')
        .select('banni')
        .eq('user_id', data.user.id)
        .single()

    if (profil?.banni) {
        await supabaseClient.auth.signOut()
        const msg = document.getElementById('auth-message')
        msg.innerHTML = `
            <div style="text-align:center;">
                <div style="font-size:2rem; margin-bottom:0.5rem;">🚫</div>
                <p style="color:#e24b4a; font-weight:600; margin-bottom:0.5rem;">Ton compte a été banni</p>
                <p style="color:#94a3b8; font-size:0.85rem; margin-bottom:1rem;">Si tu penses que c'est une erreur, contacte l'administration.</p>
              
            </div>
        `
        msg.style.display = 'block'
        return
    }

    afficherMessage('succes', `✅ Bienvenue ${data.user.user_metadata.pseudo || email} !`)
    setTimeout(() => {
        fermerModal()
        window.location.href = 'index.html'
    }, 1500)
}

// ===== DÉCONNEXION =====
async function deconnecter() {
    ouvrirConfirm({
        icone: '🚪',
        titre: 'Déconnexion',
        message: 'Tu veux vraiment te déconnecter de ZoTech ?',
        texteBouton: 'Se déconnecter',
        couleur: 'violet',
        onConfirm: async () => {
            await supabaseClient.auth.signOut()
            window.location.href = 'index.html'
        }
    })
}

// ===== VÉRIFIER SI CONNECTÉ =====
async function verifierSession() {
    const { data } = await supabaseClient.auth.getSession()
    if (data.session) {
        mettreAJourNavbar(data.session.user)
    }
}

// ===== METTRE À JOUR LA NAVBAR =====
// ===== METTRE À JOUR LA NAVBAR =====
async function mettreAJourNavbar(user) {
    const navAuth = document.querySelector('.nav-auth')
    if (!navAuth) return

    if (user) {
        const { data: profil } = await supabaseClient
            .from('profils')
            .select('photo_profil, username')
            .eq('user_id', user.id)
            .single()

        const photoUrl = profil?.photo_profil || ''
        const username = profil?.username || user.email

        const avatarHtml = photoUrl
            ? `<img src="${photoUrl}" class="nav-avatar">`
            : `<div class="nav-avatar nav-avatar-initiale">${username.charAt(0).toUpperCase()}</div>`

navAuth.innerHTML = `
            
<div class="nav-auth-desktop">
                <a href="profil.html?u=${username}" class="nav-auth-btn" style="text-decoration:none;">
                    ${avatarHtml}
                </a>
                <button class="nav-auth-btn nav-deconnexion" onclick="deconnecter()">
                    <i class="fa-solid fa-right-from-bracket"></i>
                    <span>Déconnexion</span>
                </button>
            </div>
            <!-- VERSION MOBILE -->
            <div class="nav-auth-mobile">
                <a href="profil.html?u=${username}" style="text-decoration:none;">
                    ${avatarHtml}
                </a>
            </div>
        `
    } else {
        navAuth.innerHTML = `
            <button class="btn-login" onclick="ouvrirModal('connexion')">Connexion</button>
            <button class="btn-signup" onclick="ouvrirModal('inscription')">S'inscrire</button>
        `
    }
}

// ===== RÉINITIALISER LE FORMULAIRE =====
function reinitialiserFormulaire() {
    const loginEmail = document.getElementById('login-email')
    const loginPassword = document.getElementById('login-password')
    if (loginEmail) loginEmail.value = ''
    if (loginPassword) loginPassword.value = ''

    const registerPseudo = document.getElementById('register-pseudo')
    const registerUsername = document.getElementById('register-username')
    const registerEmail = document.getElementById('register-email')
    const registerPassword = document.getElementById('register-password')
    if (registerPseudo) registerPseudo.value = ''
    if (registerUsername) registerUsername.value = ''
    if (registerEmail) registerEmail.value = ''
    if (registerPassword) registerPassword.value = ''

    const indicator = document.getElementById('username-indicator')
    if (indicator) indicator.textContent = ''

    const authMessage = document.getElementById('auth-message')
    if (authMessage) {
        authMessage.textContent = ''
        authMessage.style.display = 'none'
    }
}

// ===== MODAL =====
function ouvrirModal(type) {
    const modal = document.getElementById('auth-modal')
    const titre = document.getElementById('modal-titre')
    const formConnexion = document.getElementById('form-connexion')
    const formInscription = document.getElementById('form-inscription')

    modal.style.display = 'flex'

    if (type === 'connexion') {
        titre.textContent = '🔐 Connexion'
        formConnexion.style.display = 'block'
        formInscription.style.display = 'none'
    } else {
        titre.textContent = '✨ Créer un compte'
        formConnexion.style.display = 'none'
        formInscription.style.display = 'block'
    }
}

function fermerModal() {
    document.getElementById('auth-modal').style.display = 'none'
    reinitialiserFormulaire()
}

// ===== AFFICHER MESSAGE =====
function afficherMessage(type, texte) {
    const msg = document.getElementById('auth-message')
    msg.textContent = texte
    msg.style.color = type === 'succes' ? '#1D9E75' : '#e24b4a'
    msg.style.display = 'block'
}

// ===== LANCER LA VÉRIFICATION AU CHARGEMENT =====
window.addEventListener('load', verifierSession)

// ===== VÉRIFICATION EN TEMPS RÉEL DU USERNAME =====
let verificationTimer = null

async function verifierUsername(username) {
    const indicator = document.getElementById('username-indicator')
    if (!indicator) return

    if (username.length < 3) {
        indicator.textContent = ''
        return
    }

    const regles = /^[a-z0-9._]{3,30}$/
    if (!regles.test(username.toLowerCase())) {
        indicator.textContent = '❌ Lettres minuscules, chiffres, points ou underscores uniquement'
        indicator.style.color = '#e24b4a'
        return
    }

    if (username.startsWith('.') || username.startsWith('_') ||
        username.endsWith('.') || username.endsWith('_')) {
        indicator.textContent = '❌ Ne peut pas commencer ou finir par . ou _'
        indicator.style.color = '#e24b4a'
        return
    }

    const motsInterdits = ['admin', 'zotech', 'moderateur', 'support', 'help', 'official']
    if (motsInterdits.some(mot => username.toLowerCase().includes(mot))) {
        indicator.textContent = '❌ Nom d\'utilisateur réservé'
        indicator.style.color = '#e24b4a'
        return
    }

    indicator.textContent = '⏳ Vérification...'
    indicator.style.color = '#a0a0b0'

    clearTimeout(verificationTimer)
    verificationTimer = setTimeout(async () => {
        const { data } = await supabaseClient
            .from('profils')
            .select('username')
            .eq('username', username.toLowerCase())
            .single()

        if (data) {
            indicator.textContent = '❌ Nom d\'utilisateur déjà pris'
            indicator.style.color = '#e24b4a'
        } else {
            indicator.textContent = '✅ Nom d\'utilisateur disponible !'
            indicator.style.color = '#1D9E75'
        }
    }, 500)
}

// ===== VÉRIFIER SI MODIFICATION AUTORISÉE =====
async function verifierDelaiModification(userId, type) {
    const { data: profil } = await supabaseClient
        .from('profils')
        .select('username_modifie_le, pseudo_modifie_le')
        .eq('user_id', userId)
        .single()

    if (!profil) return { autorise: true }

    const maintenant = new Date()

    if (type === 'username' && profil.username_modifie_le) {
        const dernierChangement = new Date(profil.username_modifie_le)
        const joursEcoules = Math.floor((maintenant - dernierChangement) / (1000 * 60 * 60 * 24))
        if (joursEcoules < 30) {
            const joursRestants = 30 - joursEcoules
            return {
                autorise: false,
                message: `❌ Tu peux modifier ton nom d'utilisateur dans ${joursRestants} jour(s)`
            }
        }
    }

    if (type === 'pseudo' && profil.pseudo_modifie_le) {
        const dernierChangement = new Date(profil.pseudo_modifie_le)
        const joursEcoules = Math.floor((maintenant - dernierChangement) / (1000 * 60 * 60 * 24))
        if (joursEcoules < 7) {
            const joursRestants = 7 - joursEcoules
            return {
                autorise: false,
                message: `❌ Tu peux modifier ton pseudo dans ${joursRestants} jour(s)`
            }
        }
    }

    return { autorise: true }
}

// ===== MODIFIER USERNAME =====
async function modifierUsername(userId, nouveauUsername) {
    const delai = await verifierDelaiModification(userId, 'username')
    if (!delai.autorise) {
        return { erreur: delai.message }
    }

    const regles = /^[a-z0-9._]{3,30}$/
    if (!regles.test(nouveauUsername.toLowerCase())) {
        return { erreur: '❌ Nom d\'utilisateur invalide !' }
    }

    const { data: existant } = await supabaseClient
        .from('profils')
        .select('username')
        .eq('username', nouveauUsername.toLowerCase())
        .single()

    if (existant) {
        return { erreur: '❌ Ce nom d\'utilisateur est déjà pris !' }
    }

    const { error } = await supabaseClient
        .from('profils')
        .update({
            username: nouveauUsername.toLowerCase(),
            username_modifie_le: new Date().toISOString()
        })
        .eq('user_id', userId)

    if (error) return { erreur: '❌ Erreur : ' + error.message }
    return { succes: '✅ Nom d\'utilisateur modifié avec succès !' }
}

// ===== MODIFIER PSEUDO =====
async function modifierPseudo(userId, nouveauPseudo) {
    const delai = await verifierDelaiModification(userId, 'pseudo')
    if (!delai.autorise) {
        return { erreur: delai.message }
    }

    const { error } = await supabaseClient
        .from('profils')
        .update({
            pseudo: nouveauPseudo,
            pseudo_modifie_le: new Date().toISOString()
        })
        .eq('user_id', userId)

    if (error) return { erreur: '❌ Erreur : ' + error.message }
    return { succes: '✅ Pseudo modifié avec succès !' }
}

// ===== TOGGLE AVATAR DROPDOWN =====
function toggleAvatarDropdown() {
    const dropdown = document.getElementById('avatar-dropdown')
    if (!dropdown) return
    dropdown.classList.toggle('ouvert')
}

// Fermer si on clique ailleurs
document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.nav-profil-wrapper')
    if (wrapper && !wrapper.contains(e.target)) {
        const dropdown = document.getElementById('avatar-dropdown')
        if (dropdown) dropdown.classList.remove('ouvert')
    }
})