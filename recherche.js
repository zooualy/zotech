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
        const [profils, contenus] = await Promise.all([
            rechercherProfils(query),
            rechercherContenus(query)
        ])
        afficherResultatsRecherche(profils, contenus, query)
    }, 400)
}

// ===== SUGGESTIONS POPULAIRES =====
function afficherSuggestionsPopulaires() {
    const suggestions = [
        { texte: '🤖 Intelligence artificielle', query: 'intelligence artificielle' },
        { texte: '💻 Tutoriels VS Code', query: 'VS Code' },
        { texte: '⚡ Astuces productivité', query: 'astuces productivité' },
        { texte: '📱 Applications mobiles', query: 'application mobile' },
        { texte: '🌐 Créer un site web', query: 'créer site web' },
        { texte: '🎯 ChatGPT et Claude', query: 'ChatGPT Claude' },
    ]

    document.getElementById('search-resultats').innerHTML = `
        <div class="search-section-titre">🔥 Tendances</div>
        ${suggestions.map(s => `
            <div class="search-suggestion" onclick="utiliserSuggestion('${s.query}')">
                <span>${s.texte}</span>
                <span style="color:#606070; font-size:0.8rem;">↗</span>
            </div>
        `).join('')}
    `
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

    // Chercher aussi des profils
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
                <span style="color:#606070; font-size:0.8rem;">↗</span>
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
    document.getElementById('search-resultats').innerHTML = `
        <div class="search-vide">
            <div style="font-size: 2rem;">⏳</div>
            <p>Recherche en cours...</p>
        </div>
    `

   rechercheTimer = setTimeout(async () => {
        const searchQuery = document.getElementById('search-input')?.value || ''
        if (!searchQuery) return
        const [profils, contenus] = await Promise.all([
            rechercherProfils(searchQuery),
            rechercherContenus(searchQuery)
        ])
        afficherResultatsRecherche(profils, contenus, searchQuery)
    }, 400)


async function rechercherProfils(query) {
    const { data } = await supabaseClient
        .from('profils')
        .select('*')
        .or(`username.ilike.%${query}%,pseudo.ilike.%${query}%`)
        .limit(5)
    return data || []
}

async function rechercherContenus(query) {
    const motsCles = await extraireMotsClesAvecIA(query)
    const termes = [query, ...motsCles]
    let tousLesResultats = []

    for (const terme of termes) {
        const { data } = await supabaseClient
            .from('articles')
            .select('*')
            .or(`titre.ilike.%${terme}%,description.ilike.%${terme}%,hashtags.ilike.%${terme}%,contenu.ilike.%${terme}%,tag.ilike.%${terme}%`)
            .limit(6)
        if (data) tousLesResultats = [...tousLesResultats, ...data]
    }

    const articlesLocaux = typeof articles !== 'undefined'
        ? articles.filter(a =>
            termes.some(terme =>
                a.titre.toLowerCase().includes(terme.toLowerCase()) ||
                a.description.toLowerCase().includes(terme.toLowerCase()) ||
                a.tag.toLowerCase().includes(terme.toLowerCase())
            )
        )
        : []

    const ids = new Set()
    return [...articlesLocaux, ...tousLesResultats].filter(a => {
        const key = a.id || a.titre
        if (ids.has(key)) return false
        ids.add(key)
        return true
    }).slice(0, 8)
}

// ===== EXTRAIRE MOTS CLÉS INTELLIGEMMENT (sans API) =====
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
        'appli': ['app', 'mobile', 'application'],
        'site': ['web', 'HTML', 'internet', 'créer'],
        'automatiser': ['automatisation', 'astuce', 'IA'],
        'outil': ['logiciel', 'app', 'astuce'],
        'video': ['vidéo', 'tutoriel', 'youtube'],
        'extension': ['VS Code', 'plugin', 'outil'],
        'debuter': ['débutant', 'tutoriel', 'apprendre', 'commencer'],
        'debutant': ['tutoriel', 'apprendre', 'commencer', 'facile'],
        'facile': ['simple', 'tutoriel', 'astuce', 'débutant'],
        'meilleur': ['top', 'astuce', 'outil', 'recommandation'],
        'nouveau': ['nouveauté', 'news', 'récent', '2026'],
        'creer': ['créer', 'créateur', 'tutoriel', 'faire'],
    }

    // Nettoyer la requête — enlever apostrophes et articles collés
    const queryNettoyee = query
        .toLowerCase()
        .replace(/l'/g, ' ')
        .replace(/d'/g, ' ')
        .replace(/j'/g, ' ')
        .replace(/n'/g, ' ')
        .replace(/s'/g, ' ')
        .replace(/c'/g, ' ')
        .replace(/qu'/g, ' ')

    // Extraire les mots importants
    const mots = queryNettoyee
        .split(/\s+/)
        .map(m => m.replace(/[^a-zA-ZàâäéèêëîïôùûüÿçÀÂÄÉÈÊËÎÏÔÙÛÜŸÇ]/g, ''))
        .filter(m => m.length > 2 && !motsVides.includes(m))

    // Corriger les fautes communes
    const corrections = {
        'inteligence': 'intelligence',
        'artificiell': 'artificielle',
        'aprendere': 'apprendre',
        'tutoril': 'tutoriel',
        'astuc': 'astuce',
        'programation': 'programmation',
        'developper': 'développer',
        'creer': 'créer',
        'utilser': 'utiliser',
        'machie': 'machine',
        'lerning': 'learning',
        'chatgp': 'ChatGPT',
        'claud': 'Claude',
    }

    const motsCorrigés = mots.map(m => corrections[m] || m)

    // Ajouter les synonymes
    const motsCles = [...motsCorrigés]
    motsCorrigés.forEach(mot => {
        const syns = synonymes[mot.toLowerCase()]
        if (syns) motsCles.push(...syns)
    })

    return [...new Set(motsCles)]
}
async function afficherResultatsRecherche(profils, contenus, query) {
    const container = document.getElementById('search-resultats')

    if (profils.length === 0 && contenus.length === 0) {
        container.innerHTML = `
            <div class="search-vide">
                <div style="font-size: 3rem;">😕</div>
                <p>Aucun résultat pour "<strong>${query}</strong>"</p>
            </div>
        `
        return
    }

    let html = ''

    if (profils.length > 0) {
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
                    <div class="search-item-sub">@${p.username} · ${p.abonnes || 0} abonnés</div>
                </div>
            </a>
        `).join('')
    }

    if (contenus.length > 0) {
        html += `<div class="search-section-titre">📝 Contenus</div>`

        const userIds = [...new Set(contenus.filter(a => a.user_id).map(a => a.user_id))]
        const nomsAuteurs = [...new Set(contenus.filter(a => !a.user_id && a.auteur).map(a => a.auteur))]
        let profilsAuteurs = {}

        if (userIds.length > 0) {
            const { data: auteurs } = await supabaseClient
                .from('profils')
                .select('user_id, username, photo_profil, pseudo')
                .in('user_id', userIds)
            if (auteurs) auteurs.forEach(p => profilsAuteurs[p.user_id] = p)
        }

        if (nomsAuteurs.length > 0) {
            const { data: auteursByNom } = await supabaseClient
                .from('profils')
                .select('user_id, username, photo_profil, pseudo')
                .in('pseudo', nomsAuteurs)
            if (auteursByNom) auteursByNom.forEach(p => profilsAuteurs[p.pseudo] = p)
        }

        html += contenus.map(a => {
            const auteur = profilsAuteurs[a.user_id] || profilsAuteurs[a.auteur]
            const bgAuteur = auteur?.photo_profil ? 'background:none;' : ''
            const photoAuteur = auteur?.photo_profil
                ? `<img src="${auteur.photo_profil}" alt="${a.auteur}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
                : (a.auteur || '?').charAt(0).toUpperCase()

            return `
                <div class="search-item-contenu">
                    <a href="article.html?id=${a.id}" class="search-item" onclick="fermerRecherche()" style="flex:1">
                        <div class="search-item-avatar" style="background:#1e1e2e;font-size:1.2rem;">
                            ${a.emoji || '📝'}
                        </div>
                        <div class="search-item-info">
                            <div class="search-item-nom">${a.titre}</div>
                            <div class="search-item-sub">${a.tag}</div>
                        </div>
                    </a>
                    <a href="profil.html?u=${auteur?.username || ''}" class="search-auteur" onclick="fermerRecherche()">
                        <div class="search-auteur-avatar" style="${bgAuteur}">
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