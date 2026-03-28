// ===== VARIABLES =====
let articleIdActuel = null
let sourceActuelle = null
let utilisateurActuel = null
let dejaLike = false
let dejaFavori = false

// ===== INITIALISER =====
async function initialiserInteractions(articleId, source) {
    articleIdActuel = articleId
    sourceActuelle = source

    const { data: sessionData } = await supabaseClient.auth.getSession()
    utilisateurActuel = sessionData.session?.user || null

    if (!utilisateurActuel) {
        document.getElementById('commentaire-form-modal').style.display = 'none'
        document.getElementById('non-connecte-commentaire').style.display = 'block'
    }

    await chargerLikes()
    await chargerCommentaires()
    await chargerFavoris()
}

// ===== LIKES ARTICLE =====
async function chargerLikes() {
    const { data: likes } = await supabaseClient
        .from('likes')
        .select('*')
        .eq('article_id', articleIdActuel)

    const count = likes?.length || 0
    document.getElementById('likes-count').textContent = count

    if (utilisateurActuel) {
        const monLike = likes?.find(l => l.user_id === utilisateurActuel.id)
        if (monLike) {
            dejaLike = true
            document.getElementById('btn-like').classList.add('active')
        }
    }
}

async function toggleLike() {
    if (!utilisateurActuel) {
        ouvrirModal('connexion')
        return
    }

    const btn = document.getElementById('btn-like')
    const countEl = document.getElementById('likes-count')
    let count = parseInt(countEl.textContent)

    if (dejaLike) {
        await supabaseClient.from('likes').delete()
            .eq('user_id', utilisateurActuel.id)
            .eq('article_id', articleIdActuel)
        dejaLike = false
        btn.classList.remove('active')
        countEl.textContent = Math.max(0, count - 1)
    } else {
        await supabaseClient.from('likes').insert([{
            user_id: utilisateurActuel.id,
            article_id: articleIdActuel
        }])
        dejaLike = true
        btn.classList.add('active')
        countEl.textContent = count + 1

        // Notifier l'auteur
        const { data: article } = await supabaseClient
            .from('articles')
            .select('user_id, titre')
            .eq('id', articleIdActuel)
            .single()

        if (article && article.user_id !== utilisateurActuel.id) {
            const { data: profil } = await supabaseClient
                .from('profils')
                .select('pseudo, username')
                .eq('user_id', utilisateurActuel.id)
                .single()

            await creerNotification(
                article.user_id,
                'like',
                `❤️ ${profil?.pseudo || 'Quelqu\'un'} a aimé ton article "${article.titre}"`,
                `article.html?id=${articleIdActuel}&src=${sourceActuelle}`
            )
        }
    }
}

// ===== FAVORIS =====
async function chargerFavoris() {
    if (!utilisateurActuel) return

    const { data: favori } = await supabaseClient
        .from('favoris')
        .select('*')
        .eq('user_id', utilisateurActuel.id)
        .eq('article_id', articleIdActuel)
        .single()

    if (favori) {
        dejaFavori = true
        document.getElementById('btn-favori').classList.add('favori-active')
        document.getElementById('favoris-label').textContent = 'Sauvé'
    }
}

async function toggleFavori() {
    if (!utilisateurActuel) {
        ouvrirModal('connexion')
        return
    }

    const btn = document.getElementById('btn-favori')
    const label = document.getElementById('favoris-label')

    if (dejaFavori) {
        await supabaseClient.from('favoris').delete()
            .eq('user_id', utilisateurActuel.id)
            .eq('article_id', articleIdActuel)
        dejaFavori = false
        btn.classList.remove('favori-active')
        label.textContent = 'Sauver'
    } else {
        await supabaseClient.from('favoris').insert([{
            user_id: utilisateurActuel.id,
            article_id: articleIdActuel
        }])
        dejaFavori = true
        btn.classList.add('favori-active')
        label.textContent = 'Sauvé'

        // Notifier l'auteur
        const { data: article } = await supabaseClient
            .from('articles')
            .select('user_id, titre')
            .eq('id', articleIdActuel)
            .single()

        if (article && article.user_id !== utilisateurActuel.id) {
            const { data: profil } = await supabaseClient
                .from('profils')
                .select('pseudo')
                .eq('user_id', utilisateurActuel.id)
                .single()

            await creerNotification(
                article.user_id,
                'favori',
                `🔖 ${profil?.pseudo || 'Quelqu\'un'} a mis en favori ton article "${article.titre}"`,
                `article.html?id=${articleIdActuel}&src=${sourceActuelle}`
            )
        }
    }
}

// ===== COMMENTAIRES =====
function ouvrirCommentaires() {
    document.getElementById('commentaires-modal').style.display = 'flex'
}

function fermerCommentaires() {
    document.getElementById('commentaires-modal').style.display = 'none'
}

async function chargerCommentaires() {
    const { data: commentaires } = await supabaseClient
        .from('commentaires')
        .select('*')
        .eq('article_id', articleIdActuel)
        .is('parent_id', null)
        .order('created_at', { ascending: false })

    const count = commentaires?.length || 0
    document.getElementById('commentaires-count').textContent = count
    document.getElementById('commentaires-count-modal').textContent = count

    const liste = document.getElementById('liste-commentaires')

    if (!commentaires || commentaires.length === 0) {
        liste.innerHTML = `
            <div class="commentaire-vide">
                <div style="font-size:2rem;">💬</div>
                <p>Sois le premier à commenter !</p>
            </div>
        `
        return
    }

    liste.innerHTML = commentaires.map(c => {
        const photoHtml = c.photo_auteur
            ? `<img src="${c.photo_auteur}" alt="${c.auteur}">`
            : (c.auteur || '?').charAt(0).toUpperCase()
        const bgAvatar = c.photo_auteur ? 'background:none;' : ''
        const estMonCommentaire = utilisateurActuel?.id === c.user_id

        return `
            <div class="commentaire-item" id="commentaire-${c.id}">
                <a href="profil.html?u=${c.username_auteur || ''}"
                    class="commentaire-avatar" style="${bgAvatar}">
                    ${photoHtml}
                </a>
                <div class="commentaire-body">
                    <div class="commentaire-header">
                        <span class="commentaire-auteur">${c.auteur}</span>
                        <span class="commentaire-username">@${c.username_auteur || ''}</span>
                        <span class="commentaire-date">
                            ${new Date(c.created_at).toLocaleDateString('fr-FR')}
                        </span>
                    </div>
                    <p class="commentaire-texte">${c.contenu}</p>
                    <div class="commentaire-actions">
                        <button 
                        <div class="commentaire-actions">
                        <button class="btn-commentaire-action" id="like-btn-${c.id}" onclick="likerCommentaire(${c.id}, this)">
                            🤍 <span class="like-count-comment">0</span>
                        </button>
                        <button class="btn-commentaire-action" onclick="toggleReponse(${c.id})">
                            <i class="fa-solid fa-reply"></i> Répondre
                        </button>
                        ${!estMonCommentaire ? `
                        <button class="btn-commentaire-action" onclick="signalerContenu('commentaire', ${c.id})" style="color:#e24b4a;">
                            <i class="fa-solid fa-flag"></i>
                        </button>
                        ` : `
                        <button class="btn-commentaire-action delete" onclick="supprimerCommentaire(${c.id})">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                        `}
                    </div>
                    <div id="reponse-form-${c.id}" style="display:none;" class="reponse-form">
                        <input type="text" placeholder="Ta réponse..." id="reponse-input-${c.id}">
                        <button onclick="publierReponse(${c.id})">Envoyer</button>
                    </div>
                    <div id="voir-reponses-${c.id}"></div>
                    <div id="reponses-${c.id}" class="commentaire-reponses" style="display:none;"></div>
                </div>
            </div>
        `
    }).join('')

    commentaires.forEach(c => {
        chargerLikesCommentaire(c.id)
        chargerReponses(c.id)
    })
}

// ===== LIKER COMMENTAIRE =====
async function likerCommentaire(commentaireId, btn) {
    if (!utilisateurActuel) {
        ouvrirModal('connexion')
        return
    }

    const countEl = btn.querySelector('.like-count-comment')
    let count = parseInt(countEl.textContent)

    if (btn.classList.contains('liked')) {
        await supabaseClient.from('likes').delete()
            .eq('user_id', utilisateurActuel.id)
            .eq('commentaire_id', commentaireId)
        btn.classList.remove('liked')
        btn.innerHTML = `🤍 <span class="like-count-comment">${Math.max(0, count - 1)}</span>`
    } else {
        await supabaseClient.from('likes').insert([{
            user_id: utilisateurActuel.id,
            commentaire_id: commentaireId
        }])
        btn.classList.add('liked')
        btn.innerHTML = `❤️ <span class="like-count-comment">${count + 1}</span>`
    }
}

async function chargerLikesCommentaire(commentaireId) {
    const { data: likes } = await supabaseClient
        .from('likes')
        .select('*')
        .eq('commentaire_id', commentaireId)

    const count = likes?.length || 0
    const btn = document.getElementById(`like-btn-${commentaireId}`)
    if (btn) {
        btn.innerHTML = `🤍 <span class="like-count-comment">${count}</span>`
    }

    if (utilisateurActuel && btn) {
        const monLike = likes?.find(l => l.user_id === utilisateurActuel.id)
        if (monLike) {
            btn.classList.add('liked')
            btn.innerHTML = `❤️ <span class="like-count-comment">${count}</span>`
        }
    }
}

// ===== SUPPRIMER COMMENTAIRE =====
async function supprimerCommentaire(commentaireId) {
   ouvrirConfirm({
        icone: '🗑️',
        titre: 'Supprimer le commentaire',
        message: 'Tu veux vraiment supprimer ce commentaire ?',
        texteBouton: 'Supprimer',
        onConfirm: async () => {
            await supabaseClient.from('commentaires').delete()
                .eq('id', commentaireId)
                .eq('user_id', utilisateurActuel.id)
            await chargerCommentaires()
        }
    })
    return

    await supabaseClient.from('commentaires').delete()
        .eq('id', commentaireId)
        .eq('user_id', utilisateurActuel.id)

    await chargerCommentaires()
}

// ===== RÉPONDRE =====
function toggleReponse(commentaireId) {
    const form = document.getElementById(`reponse-form-${commentaireId}`)
    form.style.display = form.style.display === 'none' ? 'flex' : 'none'
    if (form.style.display === 'flex') {
        document.getElementById(`reponse-input-${commentaireId}`).focus()
    }
}

async function publierReponse(commentaireId) {
    if (!utilisateurActuel) {
        ouvrirModal('connexion')
        return
    }

    const input = document.getElementById(`reponse-input-${commentaireId}`)
    const contenu = input.value.trim()
    if (!contenu) return

    const { data: profil } = await supabaseClient
        .from('profils')
        .select('username, photo_profil, pseudo')
        .eq('user_id', utilisateurActuel.id)
        .single()

    await supabaseClient.from('commentaires').insert([{
        user_id: utilisateurActuel.id,
        article_id: articleIdActuel,
        contenu: contenu,
        auteur: profil?.pseudo || utilisateurActuel.email,
        username_auteur: profil?.username || '',
        photo_auteur: profil?.photo_profil || '',
        parent_id: commentaireId
    }])

    input.value = ''
    document.getElementById(`reponse-form-${commentaireId}`).style.display = 'none'
    await chargerReponses(commentaireId)
}

async function chargerReponses(commentaireId) {
    const { data: reponses } = await supabaseClient
        .from('commentaires')
        .select('*')
        .eq('parent_id', commentaireId)
        .order('created_at', { ascending: true })

    const voirBtn = document.getElementById(`voir-reponses-${commentaireId}`)
    const container = document.getElementById(`reponses-${commentaireId}`)

    if (!reponses || reponses.length === 0) {
        if (voirBtn) voirBtn.innerHTML = ''
        return
    }

    if (voirBtn) {
       voirBtn.innerHTML = `
            <button class="btn-commentaire-action" onclick="toggleReponses(${commentaireId})"
                id="toggle-reponses-${commentaireId}">
                <i class="fa-solid fa-eye"></i> Voir ${reponses.length} réponse(s)
            </button>
        `
    }

    if (!container) return

    container.innerHTML = reponses.map(r => {
        const photoHtml = r.photo_auteur
            ? `<img src="${r.photo_auteur}" alt="${r.auteur}">`
            : (r.auteur || '?').charAt(0).toUpperCase()
        const bgAvatar = r.photo_auteur ? 'background:none;' : ''
        const estMaReponse = utilisateurActuel?.id === r.user_id

        return `
            <div class="commentaire-reponse-item" id="commentaire-${r.id}">
                <a href="profil.html?u=${r.username_auteur || ''}"
                    class="commentaire-avatar" style="width:28px;height:28px;font-size:0.75rem;${bgAvatar}">
                    ${photoHtml}
                </a>
                <div class="commentaire-body">
                    <div class="commentaire-header">
                        <span class="commentaire-auteur" style="font-size:0.85rem;">${r.auteur}</span>
                        <span class="commentaire-username" style="font-size:0.75rem;">@${r.username_auteur || ''}</span>
                    </div>
                    <p class="commentaire-texte" style="font-size:0.85rem;">${r.contenu}</p>
                    ${estMaReponse ? `
                    <div class="commentaire-actions">
                        <button class="btn-commentaire-action delete" onclick="supprimerCommentaire(${r.id})">
                            🗑️ Supprimer
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        `
    }).join('')
}

function toggleReponses(commentaireId) {
    const container = document.getElementById(`reponses-${commentaireId}`)
    const btn = document.getElementById(`toggle-reponses-${commentaireId}`)

    if (container.style.display === 'none') {
        container.style.display = 'block'
        btn.textContent = '🙈 Masquer les réponses'
    } else {
        container.style.display = 'none'
        btn.textContent = '👁️ Voir les réponses'
    }
}

// ===== PUBLIER COMMENTAIRE =====
async function publierCommentaire() {
    if (!utilisateurActuel) {
        ouvrirModal('connexion')
        return
    }

   const contenu = document.getElementById('commentaire-input').value.trim()
    if (!contenu) {
        afficherToast('Écris quelque chose avant de publier !', 'erreur')
        return
    }

    // Vérifier contenu
    const verification = verifierContenu(contenu)
    if (!verification.valide) {
        afficherToast(verification.message, 'erreur')
        return
    }

    const { data: profil } = await supabaseClient
        .from('profils')
        .select('username, photo_profil, pseudo')
        .eq('user_id', utilisateurActuel.id)
        .single()

    const { error } = await supabaseClient.from('commentaires').insert([{
        user_id: utilisateurActuel.id,
        article_id: articleIdActuel,
        contenu: contenu,
        auteur: profil?.pseudo || utilisateurActuel.email,
        username_auteur: profil?.username || '',
        photo_auteur: profil?.photo_profil || ''
    }])

    if (error) {
        alert('❌ Erreur : ' + error.message)
        return
    }

    document.getElementById('commentaire-input').value = ''
    await chargerCommentaires()

    // Notifier l'auteur
        const { data: article } = await supabaseClient
            .from('articles')
            .select('user_id, titre')
            .eq('id', articleIdActuel)
            .single()

        if (article && article.user_id !== utilisateurActuel.id) {
            const { data: profil } = await supabaseClient
                .from('profils')
                .select('pseudo, username')
                .eq('user_id', utilisateurActuel.id)
                .single()
// Récupérer l'ID du nouveau commentaire
        const { data: nouveauComment } = await supabaseClient
            .from('commentaires')
            .select('id')
            .eq('user_id', utilisateurActuel.id)
            .eq('article_id', articleIdActuel)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        await creerNotification(
            article.user_id,
            'commentaire',
            `💬 ${profil?.pseudo || 'Quelqu\'un'} a commenté : "${contenu.substring(0, 50)}${contenu.length > 50 ? '...' : ''}"`,
            `article.html?id=${articleIdActuel}&src=${sourceActuelle}#commentaire-${nouveauComment?.id || ''}`
        )
        }
}

// ===== PARTAGER =====
function partagerArticleActuel() {
    const url = window.location.href
    if (navigator.share) {
        navigator.share({
            title: document.getElementById('article-titre').textContent + ' — ZoTech',
            text: 'Découvre cet article sur ZoTech !',
            url: url
        })
    } else {
        navigator.clipboard.writeText(url)
        alert('✅ Lien copié !')
    }
}