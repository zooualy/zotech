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

    ouvrirModalSignalement(type, id)
}

function ouvrirModalSignalement(type, id) {
    // Créer le modal s'il n'existe pas
    let modal = document.getElementById('modal-signalement')
    if (!modal) {
        modal = document.createElement('div')
        modal.id = 'modal-signalement'
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);backdrop-filter:blur(5px);z-index:9999;display:flex;align-items:center;justify-content:center;'
        modal.innerHTML = `
            <div style="background:#1a1d2e;border:1px solid #252840;border-radius:20px;padding:2rem;max-width:480px;width:90%;max-height:90vh;overflow-y:auto;" onclick="event.stopPropagation()">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                    <h2 style="color:#ffffff;font-size:1.2rem;">🚩 Signaler un contenu</h2>
                    <button onclick="fermerModalSignalement()" style="background:transparent;border:none;color:#94a3b8;font-size:1.2rem;cursor:pointer;">✕</button>
                </div>
                
                <p style="color:#94a3b8;font-size:0.85rem;margin-bottom:1.5rem;">Aide-nous à maintenir une communauté saine en signalant les contenus inappropriés.</p>

                <div style="margin-bottom:1rem;">
                    <label style="display:block;color:#e2e8f0;font-size:0.85rem;margin-bottom:0.5rem;font-weight:500;">Raison du signalement *</label>
                    <div id="raisons-signalement" style="display:flex;flex-wrap:wrap;gap:0.5rem;">
                        ${['Contenu inapproprié', 'Spam', 'Harcèlement', 'Fausses informations', 'Contenu violent', 'Autre'].map(r => `
                            <button onclick="selectionnerRaison(this, '${r}')" 
                                style="background:#0f1117;border:1px solid #252840;color:#94a3b8;padding:0.4rem 0.85rem;border-radius:20px;cursor:pointer;font-size:0.8rem;transition:all 0.2s;">
                                ${r}
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="raison-selectionnee" value="">
                </div>

                <div style="margin-bottom:1.5rem;">
                    <label style="display:block;color:#e2e8f0;font-size:0.85rem;margin-bottom:0.5rem;font-weight:500;">Message (optionnel)</label>
                    <textarea id="signalement-message" placeholder="Décris le problème en détail..." 
                        style="width:100%;background:#0f1117;border:1px solid #252840;border-radius:10px;padding:0.85rem;color:#e2e8f0;font-size:0.9rem;resize:vertical;min-height:100px;box-sizing:border-box;font-family:Inter,sans-serif;"></textarea>
                </div>

                <p id="signalement-erreur" style="color:#e24b4a;font-size:0.85rem;display:none;margin-bottom:1rem;">❌ Veuillez choisir une raison</p>

                <div style="display:flex;gap:0.75rem;">
                    <button onclick="envoyerSignalement('${type}', ${id})" 
                        style="flex:1;background:linear-gradient(135deg,#e24b4a,#c0392b);border:none;color:white;padding:0.85rem;border-radius:10px;cursor:pointer;font-weight:600;font-size:0.9rem;">
                        🚩 Envoyer le signalement
                    </button>
                    <button onclick="fermerModalSignalement()" 
                        style="flex:1;background:transparent;border:1px solid #252840;color:#e2e8f0;padding:0.85rem;border-radius:10px;cursor:pointer;font-size:0.9rem;">
                        Annuler
                    </button>
                </div>
            </div>
        `
        modal.onclick = fermerModalSignalement
        document.body.appendChild(modal)
    } else {
        modal.style.display = 'flex'
        document.getElementById('raison-selectionnee').value = ''
        document.getElementById('signalement-message').value = ''
        document.getElementById('signalement-erreur').style.display = 'none'
        document.querySelectorAll('#raisons-signalement button').forEach(b => {
            b.style.background = '#0f1117'
            b.style.borderColor = '#252840'
            b.style.color = '#94a3b8'
        })
    }
    
    modal.dataset.type = type
    modal.dataset.id = id
}

function selectionnerRaison(btn, raison) {
    document.querySelectorAll('#raisons-signalement button').forEach(b => {
        b.style.background = '#0f1117'
        b.style.borderColor = '#252840'
        b.style.color = '#94a3b8'
    })
    btn.style.background = 'rgba(226,75,74,0.15)'
    btn.style.borderColor = '#e24b4a'
    btn.style.color = '#e24b4a'
    document.getElementById('raison-selectionnee').value = raison
    document.getElementById('signalement-erreur').style.display = 'none'
}

function fermerModalSignalement() {
    const modal = document.getElementById('modal-signalement')
    if (modal) modal.style.display = 'none'
}

async function envoyerSignalement(type, id) {
    const raison = document.getElementById('raison-selectionnee').value
    const message = document.getElementById('signalement-message').value.trim()

    if (!raison) {
        document.getElementById('signalement-erreur').style.display = 'block'
        return
    }

    const { data: sessionData } = await supabaseClient.auth.getSession()
    const utilisateur = sessionData.session?.user || null

    const { error } = await supabaseClient
        .from('signalements')
        .insert([{
            user_id: utilisateur.id,
            article_id: type === 'article' ? id : null,
            commentaire_id: type === 'commentaire' ? id : null,
            raison: raison,
            message: message,
            type: type,
            statut: 'en_attente'
        }])

    if (error) {
        afficherToast('Erreur : ' + error.message, 'erreur')
        return
    }

    // Envoyer email à l'admin
    // Email à l'admin
if (typeof emailjs !== 'undefined') {
    emailjs.send('service_bwyz99l', 'template_j509wig', {
        pseudo: `Nouveau signalement : ${raison}`,
        username: `${type} #${id}`,
        email: 'zooualytech@gmail.com',
        name: 'ZoTech'
    })
}

    fermerModalSignalement()
    afficherToast('Signalement envoyé — Merci !', 'succes')
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