// ===== HISTORIQUE DE RECHERCHE =====
function sauvegarderHistorique(query) {
    let historique = JSON.parse(localStorage.getItem('zotech_historique') || '[]')
    historique = historique.filter(h => h !== query)
    historique.unshift(query)
    historique = historique.slice(0, 5)
    localStorage.setItem('zotech_historique', JSON.stringify(historique))
}

function getHistorique() {
    return JSON.parse(localStorage.getItem('zotech_historique') || '[]')
}

function supprimerHistorique(query) {
    let historique = JSON.parse(localStorage.getItem('zotech_historique') || '[]')
    historique = historique.filter(h => h !== query)
    localStorage.setItem('zotech_historique', JSON.stringify(historique))
    afficherSuggestionsPopulaires()
}

// ===== FILTRE CATÉGORIE =====
let filtreCategorie = 'tous'

function changerFiltreRecherche(cat) {
    filtreCategorie = cat
    document.querySelectorAll('.recherche-filtre').forEach(f => f.classList.remove('active'))
    event.target.classList.add('active')
    const query = document.getElementById('search-input').value
    if (query.length >= 2) rechercherEnTempsReel(query)
}

// ===== OUVRIR/FERMER RECHERCHE =====
function ouvrirRecherche() {
    const overlay = document.getElementById('recherche-overlay')
    overlay.style.display = 'flex'
    setTimeout(() => {
        document.getElementById('search-input').focus()
        afficherSuggestionsPopulaires()
    }, 100)
}

function fermerRecherche() {
    document.getElementById('recherche-overlay').style.display = 'none'
    document.getElementById('search-input').value = ''
    filtreCategorie = 'tous'
    document.getElementById('search-resultats').innerHTML = `
        <div class="search-vide">
            <div style="font-size: 3rem;">🔍</div>
            <p>Tape quelque chose pour rechercher</p>
        </div>
    `
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fermerRecherche()
})

let rechercheTimer = null

async function rechercherEnTempsReel(query) {
    clearTimeout(rechercheTimer)

    if (query.length === 0) {
        afficherSuggestionsPopulaires()
        return
    }

    if (query.length < 2) {
        afficherSuggestionsRapides(query)
        return
    }

    document.getElementById('search-resultats').innerHTML = `
        <div class="search-vide">
            <div style="font-size: 2rem;">⏳</div>
            <p>Recherche en cours...</p>
        </div>
    `

    rechercheTimer = setTimeout(async () => {
        sauvegarderHistorique(query)
        const [profils, contenus] = await Promise.all([
            rechercherProfils(query),
            rechercherContenus(query)
        ])
        afficherResultatsRecherche(profils, contenus, query)
    }, 300)
}

// ===== SUGGESTIONS POPULAIRES =====
function afficherSuggestionsPopulaires() {
    const historique = getHistorique()
    const suggestions = [
        { texte: '🤖 Intelligence artificielle', query: 'intelligence artificielle' },
        { texte: '💻 Tutoriels VS Code', query: 'VS Code' },
        { texte: '⚡ Astuces productivité', query: 'astuces productivité' },
        { texte: '📱 Applications mobiles', query: 'application mobile' },
        { texte: '🌐 Créer un site web', query: 'créer site web' },
        { texte: '🎯 ChatGPT et Claude', query: 'ChatGPT Claude' },
    ]

    let html = ''

    if (historique.length > 0) {
        html += `<div class="search-section-titre">🕐 Recherches récentes</div>`
        html += historique.map(h => `
            <div class="search-suggestion" style="display:flex; justify-content:space-between; align-items:center;">
                <span onclick="utiliserSuggestion('${h}')" style="flex:1; cursor:pointer;">🕐 ${h}</span>
                <button onclick="supprimerHistorique('${h}')" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:0.8rem;">✕</button>
            </div>
        `).join('')
    }

    html += `<div class="search-section-titre">🔥 Tendances</div>`
    html += suggestions.map(s => `
        <div class="search-suggestion" onclick="utiliserSuggestion('${s.query}')">
            <span>${s.texte}</span>
            <span style="color:#606070; font-size:0.8rem;">↗️</span>
        </div>
    `).join('')

    document.getElementById('search-resultats').innerHTML = html
}

// ===== SUGGESTIONS RAPIDES =====
async function afficherSuggestionsRapides(query) {
    const suggestions = [
        'intelligence artificielle', 'tutoriel', 'VS Code', 'ChatGPT',
        'Claude', 'application mobile', 'site web', 'productivité',
        'automatisation', 'no-code', 'python', 'javascript', 'astuce',
        'extension', 'gratuit', 'outil IA', 'machine learning'
    ]

    const filtrees = suggestions.filter(s =>
        s.toLowerCase().includes(query.toLowerCase())
    )

    const { data: profils } = await supabaseClient
        .from('profils')
        .select('username, pseudo, photo_profil')
        .or(`username.ilike.%${query}%,pseudo.ilike.%${query}%`)
        .limit(3)

    let html = ''

    if (filtrees.length > 0) {
        html += `<div class="search-section-titre">🔍 Suggestions</div>`
        html += filtrees.slice(0, 5).map(s => `
            <div class="search-suggestion" onclick="utiliserSuggestion('${s}')">
                <span>🔍 ${s}</span>
                <span style="color:#606070; font-size:0.8rem;">↗️</span>
            </div>
        `).join('')
    }

    if (profils && profils.length > 0) {
        html += `<div class="search-section-titre">👤 Profils</div>`
        html += profils.map(p => `
            <a href="profil.html?u=${p.username}" class="search-item" onclick="fermerRecherche()">
                <div class="search-item-avatar" style="${p.photo_profil ? 'background:none;' : ''}">
                    ${p.photo_profil
                        ? `<img src="${p.photo_profil}" alt="${p.pseudo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
                        : (p.pseudo || p.username).charAt(0).toUpperCase()
                    }
                </div>
                <div class="search-item-info">
                    <div class="search-item-nom">${p.pseudo || p.username}</div>
                    <div class="search-item-sub">@${p.username}</div>
                </div>
            </a>
        `).join('')
    }

    if (!html) {
        html = `
            <div class="search-vide">
                <div style="font-size: 2rem;">🔍</div>
                <p>Continue à taper...</p>
            </div>
        `
    }

    document.getElementById('search-resultats').innerHTML = html
}

// ===== UTILISER UNE SUGGESTION =====
function utiliserSuggestion(query) {
    const input = document.getElementById('search-input')
    input.value = query
    rechercherEnTempsReel(query)
}

async function rechercherProfils(query) {
    const { data } = await supabaseClient
        .from('profils')
        .select('*')
        .or(`username.ilike.%${query}%,pseudo.ilike.%${query}%`)
        .limit(5)
    return data || []
}
// ===== NORMALISER ACCENTS =====
function normaliserTexte(texte) {
    return texte
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
}
async function rechercherContenus(query) {
    const motsCles = extraireMotsClesAvecIA(query) || []
    const queryNormalisee = normaliserTexte(query)
    const termes = [...new Set([query, queryNormalisee, ...motsCles])]
    let tousLesResultats = []

    for (const terme of termes) {
        let q = supabaseClient
            .from('articles')
            .select('*')
        const { data } = await supabaseClient
            .rpc('search_articles', { search_term: terme })
        if (data) tousLesResultats = [...tousLesResultats, ...data]
        continue

        if (filtreCategorie !== 'tous') {
            if (filtreCategorie === 'IA') q = q.in('tag', ['IA', 'Tech'])
            else if (filtreCategorie === 'TutorielAstuce') q = q.in('tag', ['Tutoriel', 'Astuce'])
            else q = q.eq('tag', filtreCategorie)
        }

       
    }

    const ids = new Set()
    return tousLesResultats.filter(a => {
        const key = a.id
        if (ids.has(key)) return false
        ids.add(key)
        return true
    }).slice(0, 8)
}

// ===== EXTRAIRE MOTS CLÉS =====
function extraireMotsClesAvecIA(query) {
    const motsVides = ['comment', 'faire', 'pour', 'avec', 'dans', 'les', 'des',
        'une', 'que', 'qui', 'est', 'sur', 'par', 'tout', 'mais', 'ou',
        'donc', 'ni', 'car', 'je', 'tu', 'il', 'nous', 'vous', 'ils',
        'mon', 'ton', 'son', 'mes', 'tes', 'ses', 'apprendre', 'utiliser',
        'créer', 'avoir', 'être', 'quel', 'quelle', 'quoi', 'quand',
        'combien', 'pourquoi', "l'", "d'", "j'", "n'", "s'", "c'",
        'la', 'le', 'un', 'en', 'au', 'aux', 'du', 'de', 'et', 'ou']

    const synonymes = {
        'coder': ['code', 'programmer', 'développer', 'tutoriel', 'VS Code'],
        'programmer': ['code', 'coder', 'développer', 'tutoriel'],
        'gratuit': ['free', 'astuce', 'outil'],
        'intelligence': ['IA', 'artificielle', 'machine learning', 'ChatGPT', 'Claude'],
        'artificielle': ['IA', 'Claude', 'ChatGPT', 'intelligence'],
        'ia': ['intelligence artificielle', 'IA', 'Claude', 'ChatGPT', 'machine learning'],
        'application': ['app', 'mobile', 'no-code'],
        'site': ['web', 'HTML', 'internet', 'créer'],
        'video': ['vidéo', 'tutoriel', 'youtube'],
        'tuto': ['tutoriel'],
        'debutant': ['tutoriel', 'apprendre', 'commencer', 'facile'],
        'meilleur': ['top', 'astuce', 'outil'],
    }

    const corrections = {
        'inteligence': 'intelligence',
        'artificiell': 'artificielle',
        'tutoril': 'tutoriel',
        'programation': 'programmation',
        'chatgp': 'ChatGPT',
        'claud': 'Claude',
        'technolgie': 'technologie',
        'publie': 'publication',
        'video': 'vidéo',
        'appli': 'application',
    }

    const queryNettoyee = query.toLowerCase()
        .replace(/l'/g, ' ').replace(/d'/g, ' ').replace(/j'/g, ' ')
        .replace(/n'/g, ' ').replace(/s'/g, ' ').replace(/c'/g, ' ')

    const mots = queryNettoyee.split(/\s+/)
        .map(m => m.replace(/[^a-zA-ZàâäéèêëîïôùûüÿçÀÂÄÉÈÊËÎÏÔÙÛÜŸÇ]/g, ''))
        .filter(m => m.length > 2 && !motsVides.includes(m))

    const motsCorrigés = mots.map(m => corrections[m] || m)

    const motsCles = [...motsCorrigés]
    motsCorrigés.forEach(mot => {
        const syns = synonymes[mot.toLowerCase()]
        if (syns) motsCles.push(...syns)
    })

    return [...new Set(motsCles)]
}

async function afficherResultatsRecherche(profils, contenus, query) {
    const container = document.getElementById('search-resultats')
    const total = profils.length + contenus.length

    if (total === 0) {
        container.innerHTML = `
            <div class="search-vide">
                <div style="font-size: 3rem;">😕</div>
                <p>Aucun résultat pour "<strong>${query}</strong>"</p>
                <p style="font-size:0.85rem; color:#94a3b8; margin-top:0.5rem;">Essaie avec d'autres mots clés</p>
            </div>
        `
        return
    }

    let html = `
        <div style="padding:0.75rem 1rem; color:#94a3b8; font-size:0.82rem; border-bottom:1px solid #252840;">
            ${total} résultat${total > 1 ? 's' : ''} pour "<strong style="color:#7c3aed;">${query}</strong>"
        </div>
        <div style="display:flex; gap:0.5rem; padding:0.75rem 1rem; border-bottom:1px solid #252840; overflow-x:auto;">
            <button class="recherche-filtre ${filtreCategorie === 'tous' ? 'active' : ''}" onclick="changerFiltreRecherche('tous')">Tous</button>
            <button class="recherche-filtre ${filtreCategorie === 'IA' ? 'active' : ''}" onclick="changerFiltreRecherche('IA')">🤖 IA</button>
            <button class="recherche-filtre ${filtreCategorie === 'TutorielAstuce' ? 'active' : ''}" onclick="changerFiltreRecherche('TutorielAstuce')">📚 Tutoriels</button>
            <button class="recherche-filtre ${filtreCategorie === 'News' ? 'active' : ''}" onclick="changerFiltreRecherche('News')">📰 News</button>
        </div>
    `

    if (profils.length > 0) {
        html += `<div class="search-section-titre">👤 Profils (${profils.length})</div>`
        html += profils.map(p => `
            <a href="profil.html?u=${p.username}" class="search-item" onclick="fermerRecherche()">
                <div class="search-item-avatar" style="${p.photo_profil ? 'background:none;' : ''}">
                    ${p.photo_profil
                        ? `<img src="${p.photo_profil}" alt="${p.pseudo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
                        : (p.pseudo || p.username).charAt(0).toUpperCase()
                    }
                </div>
                <div class="search-item-info">
                    <div class="search-item-nom">${p.pseudo || p.username}</div>
                    <div class="search-item-sub">@${p.username} · ${p.abonnes || 0} abonnés</div>
                </div>
            </a>
        `).join('')
    }

    if (contenus.length > 0) {
        html += `<div class="search-section-titre">📝 Contenus (${contenus.length})</div>`

        const userIds = [...new Set(contenus.filter(a => a.user_id).map(a => a.user_id))]
        let profilsAuteurs = {}

        if (userIds.length > 0) {
            const { data: auteurs } = await supabaseClient
                .from('profils')
                .select('user_id, username, photo_profil, pseudo')
                .in('user_id', userIds)
            if (auteurs) auteurs.forEach(p => profilsAuteurs[p.user_id] = p)
        }

        html += contenus.map(a => {
            const auteur = profilsAuteurs[a.user_id]
            const photoAuteur = auteur?.photo_profil
                ? `<img src="${auteur.photo_profil}" alt="${a.auteur}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
                : (a.auteur || '?').charAt(0).toUpperCase()

            return `
                <div class="search-item-contenu">
                    <a href="article.html?id=${a.id}&src=supabase" class="search-item" onclick="fermerRecherche()" style="flex:1">
                        <div class="search-item-avatar" style="background:#1e1e2e;font-size:1.2rem;">
                            ${a.emoji || '📝'}
                        </div>
                        <div class="search-item-info">
                            <div class="search-item-nom">${a.titre}</div>
                            <div class="search-item-sub"><span class="card-tag" style="font-size:0.7rem; padding:0.1rem 0.4rem;">${a.tag}</span></div>
                        </div>
                    </a>
                    <a href="profil.html?u=${auteur?.username || ''}" class="search-auteur" onclick="fermerRecherche()">
                        <div class="search-auteur-avatar" style="${auteur?.photo_profil ? 'background:none;' : ''}">
                            ${photoAuteur}
                        </div>
                        <span>${a.auteur}</span>
                    </a>
                </div>
            `
        }).join('')
    }

    container.innerHTML = html
}