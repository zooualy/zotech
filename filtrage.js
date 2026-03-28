// ===== MOTS INTERDITS =====
const motsInterdits = [
    'idiot', 'imbécile', 'connard', 'con', 'merde', 'putain', 'salope',
    'pute', 'enculé', 'batard', 'bâtard', 'niquer', 'nique', 'fdp',
    'pd', 'nègre', 'negro', 'tapette', 'fils de pute', 'va te faire',
    'nazi', 'hitler', 'terroriste', 'kill', 'murder', 'rape', 'fuck',
    'shit', 'asshole', 'bitch', 'bastard', 'damn', 'cunt', 'dick'
]

// ===== VÉRIFIER CONTENU =====
function verifierContenu(texte) {
    if (!texte) return { valide: true }
    const texteLower = texte.toLowerCase()
    for (const mot of motsInterdits) {
        if (texteLower.includes(mot)) {
            return {
                valide: false,
                message: `❌ Ton message contient un mot inapproprié. Merci de respecter la communauté ZoTech !`
            }
        }
    }
    return { valide: true }
}

// ===== CHOISIR RAISON =====
function choisirRaison() {
    return new Promise((resolve) => {
        const ancien = document.getElementById('raison-overlay')
        if (ancien) ancien.remove()

        const overlay = document.createElement('div')
        overlay.id = 'raison-overlay'
        overlay.className = 'confirm-overlay ouvert'
        overlay.innerHTML = `
            <div class="confirm-box">
                <div class="confirm-icone">🚨</div>
                <div class="confirm-titre">Raison du signalement</div>
                <div style="display:flex; flex-direction:column; gap:0.5rem; margin:1rem 0;">
                    <button class="raison-btn" id="raison-1"><i class="fa-solid fa-ban"></i> Contenu inapproprié</button>
                    <button class="raison-btn" id="raison-2"><i class="fa-solid fa-user-slash"></i> Harcèlement</button>
                    <button class="raison-btn" id="raison-3"><i class="fa-solid fa-triangle-exclamation"></i> Spam</button>
                    <button class="raison-btn" id="raison-4"><i class="fa-solid fa-circle-exclamation"></i> Fausses informations</button>
                    <button class="raison-btn" id="raison-5"><i class="fa-solid fa-ellipsis"></i> Autre</button>
                </div>
                <button class="confirm-btn-annuler" id="raison-annuler">Annuler</button>
            </div>
        `
        document.body.appendChild(overlay)

        setTimeout(() => {
            const raisons = [
                { id: 'raison-1', texte: 'Contenu inapproprié' },
                { id: 'raison-2', texte: 'Harcèlement' },
                { id: 'raison-3', texte: 'Spam' },
                { id: 'raison-4', texte: 'Fausses informations' },
                { id: 'raison-5', texte: 'Autre' }
            ]

            raisons.forEach(r => {
                const btn = document.getElementById(r.id)
                if (btn) {
                    btn.addEventListener('click', () => {
                        overlay.remove()
                        resolve(r.texte)
                    })
                }
            })

            const annuler = document.getElementById('raison-annuler')
            if (annuler) {
                annuler.addEventListener('click', () => {
                    overlay.remove()
                    resolve(null)
                })
            }
        }, 100)
    })
}

// ===== SIGNALER UN CONTENU =====
async function signalerContenu(type, id) {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    const utilisateur = sessionData.session?.user || null

    if (!utilisateur) {
        ouvrirModal('connexion')
        return
    }

    const raison = await choisirRaison()
    console.log('Raison:', raison)
    if (!raison) return

    const { error } = await supabaseClient
        .from('signalements')
        .insert([{
            user_id: utilisateur.id,
            article_id: type === 'article' ? id : null,
            commentaire_id: type === 'commentaire' ? id : null,
            raison: raison,
            type: type,
            statut: 'en_attente'
        }])

    if (error) {
        console.log('Erreur signalement:', error)
        afficherToast('Erreur : ' + error.message, 'erreur')
        return
    }

    afficherToast('Contenu signalé — Merci !', 'succes')
}

// ===== SIGNALER UN PROFIL =====
async function signalerProfil() {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    const utilisateur = sessionData.session?.user || null

    if (!utilisateur) {
        ouvrirModal('connexion')
        return
    }

    const raison = await choisirRaison()
    if (!raison) return

    const params = new URLSearchParams(window.location.search)
    const username = params.get('u')

    const { data: profilSignale } = await supabaseClient
        .from('profils')
        .select('user_id')
        .eq('username', username)
        .single()

    if (!profilSignale) return

    const { error } = await supabaseClient
        .from('signalements')
        .insert([{
            user_id: utilisateur.id,
            article_id: null,
            commentaire_id: null,
            raison: raison,
            type: 'profil',
            statut: 'en_attente'
        }])

    if (error) {
        console.log('Erreur:', error)
        afficherToast('Erreur : ' + error.message, 'erreur')
        return
    }

    afficherToast('Profil signalé — Merci !', 'succes')
}