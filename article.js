// ===== CONTENU DES ARTICLES =====
const articlesContenu = {
    1: {
        contenu: `
            <h2>Introduction</h2>
            <p>En 2026, deux IA dominent le marché : ChatGPT d'OpenAI et Claude d'Anthropic. Mais laquelle choisir pour ton usage quotidien ? On fait le point.</p>
            <h2>🤖 ChatGPT — Le pionnier</h2>
            <p>ChatGPT est l'IA la plus connue au monde. Lancé en 2022, il a révolutionné notre façon d'interagir avec l'intelligence artificielle.</p>
            <ul>
                <li>Très polyvalent pour la rédaction et le code</li>
                <li>Intégration avec DALL-E pour les images</li>
                <li>GPT Store avec des milliers de plugins</li>
                <li>Version gratuite disponible</li>
            </ul>
            <h2>✨ Claude — Le challenger</h2>
            <p>Claude d'Anthropic se distingue par sa capacité à analyser de longs documents et sa précision dans les réponses techniques.</p>
            <ul>
                <li>Contexte très long — idéal pour les gros documents</li>
                <li>Excellente précision et honnêteté</li>
                <li>Parfait pour le code et l'analyse</li>
                <li>Interface épurée et agréable</li>
            </ul>
            <h2>🏆 Verdict</h2>
            <p>Pour un usage général et créatif, ChatGPT est excellent. Pour l'analyse de documents et le code professionnel, Claude est souvent supérieur.</p>
        `
    },
    2: {
        contenu: `
            <h2>Introduction</h2>
            <p>VS Code est l'éditeur de code le plus populaire au monde. Mais sa vraie puissance vient de ses extensions. Voici les 5 indispensables.</p>
            <h2>⚡ 1. Prettier</h2>
            <p>Prettier formate automatiquement ton code. Plus besoin de t'inquiéter de l'indentation ou des espaces.</p>
            <h2>🔍 2. ESLint</h2>
            <p>ESLint détecte les erreurs dans ton JavaScript avant même que tu exécutes le code.</p>
            <h2>🎨 3. GitHub Copilot</h2>
            <p>L'IA intégrée dans VS Code. Elle suggère du code en temps réel pendant que tu tapes.</p>
            <h2>🌈 4. Live Server</h2>
            <p>Recharge automatiquement ton navigateur à chaque modification.</p>
            <h2>📁 5. GitLens</h2>
            <p>Voir qui a modifié quoi et quand dans ton code.</p>
            <h2>🏆 Conclusion</h2>
            <p>Ces 5 extensions vont transformer ton expérience de développement !</p>
        `
    },
    3: {
        contenu: `
            <h2>Introduction</h2>
            <p>Créer un site web gratuit en 2026 n'a jamais été aussi simple.</p>
            <h2>🌐 Option 1 — GitHub Pages</h2>
            <p>Tu uploades ton code sur GitHub et ton site est en ligne gratuitement.</p>
            <h2>⚡ Option 2 — Netlify</h2>
            <p>Tu glisses ton dossier de fichiers et ton site est en ligne en 30 secondes.</p>
            <h2>🚀 Option 3 — Vercel</h2>
            <p>Vercel est idéal pour les projets plus avancés avec React ou Next.js.</p>
            <h2>🏆 Notre recommandation</h2>
            <p>Pour ZoTech, on va utiliser Netlify !</p>
        `
    },
    4: {
        contenu: `
            <h2>Introduction</h2>
            <p>L'IA est partout en 2026, mais beaucoup d'outils sont payants. Voici les meilleures IA gratuites.</p>
            <h2>🤖 1. Claude (Anthropic)</h2>
            <p>Claude propose un plan gratuit très généreux.</p>
            <h2>💬 2. ChatGPT (OpenAI)</h2>
            <p>Le plan gratuit de ChatGPT donne accès à GPT-4o.</p>
            <h2>🔍 3. Perplexity AI</h2>
            <p>Le meilleur moteur de recherche IA.</p>
            <h2>🎨 4. Canva IA</h2>
            <p>Canva intègre maintenant des outils IA puissants.</p>
            <h2>🏆 Conclusion</h2>
            <p>Ces outils gratuits couvrent 90% des besoins quotidiens.</p>
        `
    },
    5: {
        contenu: `
            <h2>Introduction</h2>
            <p>Les tâches répétitives te font perdre un temps précieux. Voici comment utiliser l'IA pour les automatiser.</p>
            <h2>📧 1. Automatiser les emails</h2>
            <p>Utilise Claude ou ChatGPT pour rédiger des réponses types.</p>
            <h2>📊 2. Automatiser les rapports</h2>
            <p>Donne tes données brutes à une IA et demande-lui de générer un rapport complet.</p>
            <h2>📱 3. Automatiser les réseaux sociaux</h2>
            <p>Génère une semaine de contenu en une seule session avec l'IA.</p>
            <h2>🏆 Conclusion</h2>
            <p>L'automatisation avec l'IA peut te faire gagner 2 à 3 heures par jour.</p>
        `
    },
    6: {
        contenu: `
            <h2>Introduction</h2>
            <p>Créer une application mobile sans coder est devenu possible grâce aux outils no-code.</p>
            <h2>📱 1. Glide</h2>
            <p>Transforme une feuille Google Sheets en application mobile en quelques minutes.</p>
            <h2>⚡ 2. Bubble</h2>
            <p>Le plus puissant des outils no-code.</p>
            <h2>🎨 3. Webflow</h2>
            <p>Idéal pour les sites web visuellement impressionnants.</p>
            <h2>🏆 Conclusion</h2>
            <p>Pour une première app simple, commence par Glide.</p>
        `
    }
}

// ===== AFFICHER L'ARTICLE =====
async function afficherArticle() {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    const src = params.get('src') || 'local'

    if (!id) {
        window.location.href = 'index.html'
        return
    }

    const idNum = parseInt(id)
    let article = null
    let contenuHtml = ''

    if (src === 'supabase') {
        const { data: dataSupabase } = await supabaseClient
            .from('articles')
            .select('*')
            .eq('id', idNum)
            .single()

        if (dataSupabase) {
            article = dataSupabase
            contenuHtml = dataSupabase.contenu || '<p>Aucun contenu disponible</p>'
        } else {
            window.location.href = 'index.html'
            return
        }
    } else {
        if (articlesContenu[idNum]) {
            article = articles.find(a => a.id === idNum)
            contenuHtml = articlesContenu[idNum].contenu
        } else {
            window.location.href = 'index.html'
            return
        }
    }

    // Remplir les infos
    document.title = `${article.titre} - ZoTech`
    document.getElementById('article-tag').textContent = article.tag
    document.getElementById('article-titre').textContent = article.titre

    // Auteur avec lien profil
    const auteurEl = document.getElementById('article-auteur')
    const usernameAuteur = article.username_auteur || ''

    if (usernameAuteur) {
        let profilAuteur = null

        if (article.user_id) {
            const { data } = await supabaseClient
                .from('profils')
                .select('photo_profil')
                .eq('user_id', article.user_id)
                .single()
            profilAuteur = data
        } else if (usernameAuteur) {
            const { data } = await supabaseClient
                .from('profils')
                .select('photo_profil')
                .eq('username', usernameAuteur)
                .single()
            profilAuteur = data
        }

        const photoHtml = profilAuteur?.photo_profil
            ? `<img src="${profilAuteur.photo_profil}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : (article.auteur || '?').charAt(0).toUpperCase()

        const bgAvatar = profilAuteur?.photo_profil ? 'background:none;' : ''

        auteurEl.innerHTML = `
            <a href="profil.html?u=${usernameAuteur}"
                style="color:#7c3aed; text-decoration:none; display:flex; align-items:center; gap:0.5rem;">
                <span style="width:32px; height:32px; border-radius:50%; background:#7c3aed; ${bgAvatar} display:inline-flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:600; color:white; overflow:hidden; flex-shrink:0;">
                    ${photoHtml}
                </span>
                ${article.auteur}
            </a>`
    } else {
        auteurEl.textContent = article.auteur
    }

    document.getElementById('article-date').textContent = article.date ||
        new Date(article.created_at).toLocaleDateString('fr-FR')

    // Photo de couverture ou emoji
    // Photo de couverture ou emoji
    const emojiDiv = document.getElementById('article-emoji')
    
    if (article.type_contenu === 'video' && article.url_video) {
        // Vidéo → afficher la vidéo directement
        emojiDiv.innerHTML = `
            <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:12px; width:100%;">
                <iframe 
                    src="${article.url_video}" 
                    style="position:absolute; top:0; left:0; width:100%; height:100%; border:none; border-radius:12px;"
                    allowfullscreen>
                </iframe>
            </div>
        `
        emojiDiv.style.minHeight = 'auto'
        emojiDiv.style.background = 'none'
        emojiDiv.style.padding = '0'

    } else if (article.type_contenu === 'photo' && article.url_image) {
        // Photo → afficher toutes les photos
        const photos = article.url_image.split(',').filter(p => p)
        emojiDiv.innerHTML = photos.map(photo => `
            <img src="${photo}" style="width:100%; border-radius:12px; margin-bottom:0.5rem; display:block;">
        `).join('')
        emojiDiv.style.minHeight = 'auto'
        emojiDiv.style.background = 'none'
        emojiDiv.style.padding = '0'
        emojiDiv.style.display = 'block'

    } else if (article.url_couverture) {
        // Article avec couverture
        emojiDiv.innerHTML = `<img src="${article.url_couverture}" style="width:100%;height:100%;object-fit:cover;border-radius:16px;display:block;">`
        emojiDiv.style.fontSize = '0'
        emojiDiv.style.minHeight = '350px'
        emojiDiv.style.padding = '0'

    } else {
        // Emoji par défaut
        emojiDiv.textContent = article.emoji || '📝'
    }

    // Contenu
    // Contenu
    // Contenu
    if (article.type_contenu !== 'video' && article.type_contenu !== 'photo') {
        document.getElementById('article-contenu').innerHTML = contenuHtml
    }

    // Articles similaires
    const { data: similairesSupabase } = await supabaseClient
        .from('articles')
        .select('*')
        .eq('tag', article.tag)
        .neq('id', idNum)
        .limit(3)

    const similairesLocaux = articles
        .filter(a => a.tag === article.tag && a.id !== idNum)
        .slice(0, 3)

    const tousSimiliaires = [
        ...similairesLocaux,
        ...(similairesSupabase || []).map(a => ({
            ...a,
            date: new Date(a.created_at).toLocaleDateString('fr-FR')
        }))
    ].slice(0, 3)

    document.getElementById('articles-similaires').innerHTML =
        tousSimiliaires.length > 0
            ? tousSimiliaires.map(creerCarte).join('')
            : '<p style="color:#a0a0b0; text-align:center; padding:2rem;">Aucun article similaire</p>'

    // Initialiser likes, commentaires, favoris
    await initialiserInteractions(idNum, src)
}

// ===== LANCER =====
// ===== OUVRIR COMMENTAIRE DEPUIS NOTIFICATION =====
async function ouvrirCommentaireDepuisNotification() {
    const hash = window.location.hash
    if (!hash.startsWith('#commentaire-')) return

    const commentaireId = hash.replace('#commentaire-', '')
    if (!commentaireId) return

    // Attendre que les commentaires soient chargés
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Ouvrir le popup
    ouvrirCommentaires()

    // Attendre que le popup soit ouvert
    await new Promise(resolve => setTimeout(resolve, 500))

    // Trouver et scroller vers le commentaire
    const commentaireEl = document.getElementById(`commentaire-${commentaireId}`)
    if (commentaireEl) {
        commentaireEl.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // Surligner en violet
        commentaireEl.style.background = 'rgba(124, 58, 237, 0.25)'
        commentaireEl.style.borderRadius = '10px'
        commentaireEl.style.transition = 'background 1s'

        // Retirer le surlignage après 2 secondes
        setTimeout(() => {
            commentaireEl.style.background = ''
        }, 2500)
    }
}

// ===== LANCER =====
document.addEventListener('DOMContentLoaded', afficherArticle)
window.addEventListener('load', ouvrirCommentaireDepuisNotification)