// ===== VÉRIFIER ADMIN =====
const CODE_SECRET_ADMIN = 'Elhadji@24062022'

function verifierCode() {
    const input = document.getElementById('input-code-secret')
    const erreur = document.getElementById('code-erreur')

    if (input.value === CODE_SECRET_ADMIN) {
        sessionStorage.setItem('admin_code', CODE_SECRET_ADMIN)
        document.getElementById('admin-lock').style.display = 'none'
        verifierAdminSuivi()
    } else {
        erreur.style.display = 'block'
        input.value = ''
        input.focus()
    }
}

async function verifierAdmin() {
   // Toujours demander le code à chaque visite
    sessionStorage.removeItem('admin_code')
    // Afficher overlay
    return
}

async function verifierAdminSuivi() {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    const utilisateur = sessionData.session?.user || null

    if (!utilisateur) {
        window.location.href = 'index.html'
        return
    }

    const { data: profil } = await supabaseClient
        .from('profils')
        .select('est_admin')
        .eq('user_id', utilisateur.id)
        .single()

    if (!profil?.est_admin) {
        window.location.href = 'index.html'
        return
    }

    chargerStats()
    chargerSignalements()
}
// ===== STATS =====
async function chargerStats() {
    const { count: totalUsers } = await supabaseClient
        .from('profils')
        .select('*', { count: 'exact', head: true })

    const { count: totalArticles } = await supabaseClient
        .from('articles')
        .select('*', { count: 'exact', head: true })

    const { count: totalSignalements } = await supabaseClient
        .from('signalements')
        .select('*', { count: 'exact', head: true })

    const { count: signalementsAttente } = await supabaseClient
        .from('signalements')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'en_attente')

    document.getElementById('stat-total-users').textContent = totalUsers || 0
    document.getElementById('stat-total-articles').textContent = totalArticles || 0
    document.getElementById('stat-total-signalements').textContent = totalSignalements || 0
    document.getElementById('stat-signalements-attente').textContent = signalementsAttente || 0
}

// ===== ONGLETS =====
function changerOngletAdmin(onglet) {
    document.querySelectorAll('.admin-onglet').forEach(o => o.classList.remove('active'))
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'))

    event.target.closest('.admin-onglet').classList.add('active')
    document.getElementById(`section-${onglet}`).classList.add('active')

    if (onglet === 'signalements') chargerSignalements()
    else if (onglet === 'publications') chargerPublications()
   else if (onglet === 'utilisateurs') chargerUtilisateurs()
else if (onglet === 'contestations') chargerContestations()
}

// ===== SIGNALEMENTS =====
async function chargerSignalements() {
    const { data: signalements } = await supabaseClient
        .from('signalements')
        .select('*')
        .order('created_at', { ascending: false })

    const tbody = document.getElementById('tbody-signalements')

    if (!signalements || signalements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="admin-vide">Aucun signalement 🎉</td></tr>'
        return
    }

    // Récupérer les articles signalés
    const articleIds = signalements.filter(s => s.article_id).map(s => s.article_id)
    let articles = {}
    if (articleIds.length > 0) {
        const { data: arts } = await supabaseClient
            .from('articles')
            .select('id, titre, auteur, username_auteur')
            .in('id', articleIds)
        if (arts) arts.forEach(a => articles[a.id] = a)
    }

    // Récupérer les commentaires signalés
    const commentaireIds = signalements.filter(s => s.commentaire_id).map(s => s.commentaire_id)
    let commentaires = {}
    if (commentaireIds.length > 0) {
        const { data: comms } = await supabaseClient
            .from('commentaires')
            .select('id, contenu, user_id')
            .in('id', commentaireIds)
        if (comms) comms.forEach(c => commentaires[c.id] = c)
    }

    // Récupérer les profils des signaleurs
    const userIds = [...new Set(signalements.map(s => s.user_id).filter(Boolean))]
    let profils = {}
    if (userIds.length > 0) {
        const { data: profs } = await supabaseClient
            .from('profils')
            .select('user_id, pseudo, username')
            .in('user_id', userIds)
        if (profs) profs.forEach(p => profils[p.user_id] = p)
    }

    tbody.innerHTML = signalements.map(s => {
        const signaleur = profils[s.user_id]
        const article = s.article_id ? articles[s.article_id] : null
        const commentaire = s.commentaire_id ? commentaires[s.commentaire_id] : null

        // Contenu signalé
        let contenuSignale = '—'
        let lienContenu = ''
        if (article) {
            contenuSignale = `📝 <strong>${article.titre}</strong><br><small>par ${article.auteur}</small>`
            lienContenu = `<a href="article.html?id=${s.article_id}&src=supabase" target="_blank" class="admin-btn admin-btn-success"><i class="fa-solid fa-eye"></i> Voir</a>`
        } else if (commentaire) {
            contenuSignale = `💬 <em>"${commentaire.contenu?.substring(0, 60)}..."</em>`
        } else if (s.type === 'profil') {
            contenuSignale = `👤 Profil signalé`
        }

        return `
            <tr>
                <td><span class="badge badge-${s.type}">${s.type}</span></td>
                <td style="max-width:250px;">${contenuSignale}</td>
                <td>${signaleur ? `<a href="profil.html?u=${signaleur.username}" target="_blank" style="color:#7c3aed;">@${signaleur.username}</a>` : '—'}</td>
                <td>${s.raison}</td>
                <td>${new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                <td><span class="badge badge-${s.statut === 'en_attente' ? 'attente' : 'traite'}">${s.statut}</span></td>
                <td style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    ${lienContenu}
                    ${s.type === 'article' && s.article_id ? `
                        <button class="admin-btn admin-btn-danger" onclick="supprimerArticleAdmin(${s.article_id}, ${s.id})">
                            <i class="fa-solid fa-trash"></i> Supprimer
                        </button>
                    ` : ''}
                    <button class="admin-btn admin-btn-success" onclick="marquerTraite(${s.id})">
                        <i class="fa-solid fa-check"></i> Traité
                    </button>
                </td>
            </tr>
        `
    }).join('')
}
// ===== PUBLICATIONS =====
async function chargerPublications() {
    const { data: articles } = await supabaseClient
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

    const tbody = document.getElementById('tbody-publications')

    if (!articles || articles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="admin-vide">Aucune publication</td></tr>'
        return
    }

   tbody.innerHTML = articles.map(a => `
        <tr>
            <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${a.titre}</td>
            <td><a href="profil.html?u=${a.username_auteur}" target="_blank" style="color:#7c3aed;">@${a.username_auteur || a.auteur}</a></td>
            <td><span class="badge badge-article">${a.type_contenu || 'article'}</span></td>
            <td>${new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
            <td style="display:flex; gap:0.5rem;">
       <a href="article.html?id=${a.id}&src=supabase" target="_blank" class="admin-btn admin-btn-success">
    <i class="fa-solid fa-eye"></i> Voir
</a>
<button class="admin-btn admin-btn-${a.featured ? 'warning' : 'success'}" onclick="toggleFeatured(${a.id}, ${a.featured})">
    <i class="fa-solid fa-star"></i> ${a.featured ? 'Retirer une' : 'À la une'}
</button>
<button class="admin-btn admin-btn-danger" onclick="supprimerArticleAdmin(${a.id}, null)">
    <i class="fa-solid fa-trash"></i> Supprimer
</button>        
            </td>
        </tr>
    `).join('')
}

// ===== UTILISATEURS =====
async function chargerUtilisateurs() {
    const { data: utilisateurs } = await supabaseClient
        .from('profils')
        .select('*')
        .order('created_at', { ascending: false })

    const tbody = document.getElementById('tbody-utilisateurs')

    if (!utilisateurs || utilisateurs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="admin-vide">Aucun utilisateur</td></tr>'
        return
    }

    tbody.innerHTML = utilisateurs.map(u => `
        <tr>
            <td>${u.pseudo}</td>
            <td>@${u.username}</td>
            <td>${u.abonnes || 0}</td>
            <td>
                <span class="badge ${u.est_admin ? 'badge-traite' : u.banni ? 'badge-attente' : ''}">
                    ${u.est_admin ? 'Admin' : u.banni ? 'Banni' : 'Actif'}
                </span>
            </td>
            <td style="display:flex; gap:0.5rem;">
                <a href="profil.html?u=${u.username}" class="admin-btn admin-btn-success" target="_blank">
                    <i class="fa-solid fa-eye"></i> Voir
                </a>
                ${!u.est_admin ? `
                <button class="admin-btn admin-btn-${u.banni ? 'success' : 'warning'}"
                onclick="toggleBannir('${u.user_id}', ${u.banni === true})"
                    <i class="fa-solid fa-${u.banni ? 'unlock' : 'ban'}"></i> ${u.banni ? 'Débannir' : 'Bannir'}
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('')
}

// ===== SUPPRIMER ARTICLE =====
async function supprimerArticleAdmin(articleId, signalementId) {
    ouvrirConfirm({
        icone: '🗑️',
        titre: 'Supprimer la publication',
        message: 'Tu veux vraiment supprimer cette publication ?',
        texteBouton: 'Supprimer',
        onConfirm: async () => {
            await supabaseClient.from('articles').delete().eq('id', articleId)
            if (signalementId) {
                await supabaseClient.from('signalements').update({ statut: 'traite' }).eq('id', signalementId)
            }
            afficherToast('Publication supprimée !', 'succes')
            chargerStats()
            chargerSignalements()
        }
    })
}

// ===== MARQUER TRAITÉ =====
async function marquerTraite(signalementId) {
    await supabaseClient
        .from('signalements')
        .update({ statut: 'traite' })
        .eq('id', signalementId)
    afficherToast('Signalement marqué comme traité !', 'succes')
    chargerSignalements()
    chargerStats()
}

// ===== BANNIR UTILISATEUR =====
async function toggleBannir(userId, estBanni) {
    estBanni = estBanni === true || estBanni === 'true'
    estBanni = estBanni === true || estBanni === 'true'
    
    ouvrirConfirm({
        icone: estBanni ? '🔓' : '🚫',
        titre: estBanni ? 'Débannir l\'utilisateur' : 'Bannir l\'utilisateur',
        message: estBanni ? 'Tu veux débannir cet utilisateur ?' : 'Tu veux bannir cet utilisateur ?',
        texteBouton: estBanni ? 'Débannir' : 'Bannir',
        onConfirm: async () => {
            console.log('onConfirm exécuté, estBanni:', estBanni)
            await supabaseClient
                .from('profils')
                .update({ banni: !estBanni })
                .eq('user_id', userId)

            if (estBanni) {
                const { data: profil } = await supabaseClient
                    .from('profils')
                    .select('pseudo, username, email')
                    .eq('user_id', userId)
                    .single()

                console.log('Profil:', profil)

                if (profil) {
                    emailjs.send('service_bwyz99l', 'template_j509wig', {
                        pseudo: profil.pseudo || profil.username,
                        username: profil.username,
                        email: profil.email || '',
                        name: 'ZoTech'
                    }).then(() => console.log('Email envoyé !'))
                    .catch(err => console.log('Erreur:', err))
                }
            }

            afficherToast(estBanni ? 'Utilisateur débanni !' : 'Utilisateur banni !', 'succes')
            chargerUtilisateurs()
        }
    })
}

// ===== LANCER =====
window.addEventListener('load', verifierAdmin)


// ===== CONTESTATIONS =====
async function chargerContestations() {
    const { data: contestations } = await supabaseClient
        .from('contestations')
        .select('*')
        .order('created_at', { ascending: false })

    const tbody = document.getElementById('tbody-contestations')

    if (!contestations || contestations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="admin-vide">Aucune contestation 🎉</td></tr>'
        return
    }

    // Compter non lues
    const nonLues = contestations.filter(c => !c.lu).length
    const titre = document.querySelector('[onclick="changerOngletAdmin(\'contestations\')"]')
    if (titre) {
        titre.innerHTML = `<i class="fa-solid fa-gavel"></i> Contestations ${nonLues > 0 ? `<span style="background:#e24b4a; color:white; border-radius:50%; padding:0.1rem 0.4rem; font-size:0.7rem; margin-left:0.3rem;">${nonLues}</span>` : ''}`
    }

    tbody.innerHTML = contestations.map(c => `
        <tr style="${!c.lu ? 'background:rgba(124,58,237,0.06);' : ''}" onclick="marquerContestationLue(${c.id})">
            <td>
                ${!c.lu ? '<span style="width:8px;height:8px;background:#7c3aed;border-radius:50%;display:inline-block;margin-right:0.5rem;"></span>' : ''}
                <a href="profil.html?u=${c.username}" target="_blank" style="color:#7c3aed;">@${c.username}</a>
            </td>
            <td style="max-width:300px;">
                <p style="white-space:pre-wrap; font-size:0.85rem; color:#e2e8f0;">${c.message}</p>
            </td>
            <td>${new Date(c.created_at).toLocaleDateString('fr-FR')}</td>
            <td><span class="badge badge-${c.statut === 'en_attente' ? 'attente' : c.statut === 'accepte' ? 'traite' : 'article'}">${c.statut}</span></td>
            <td style="display:flex; gap:0.5rem;">
                <button class="admin-btn admin-btn-success" onclick="event.stopPropagation(); debannirDepuisContestation('${c.username}', ${c.id})">
                    <i class="fa-solid fa-unlock"></i> Débannir
                </button>
                <button class="admin-btn admin-btn-danger" onclick="event.stopPropagation(); rejeterContestation(${c.id})">
                    <i class="fa-solid fa-xmark"></i> Rejeter
                </button>
            </td>
        </tr>
    `).join('')
}

async function marquerContestationLue(id) {
    await supabaseClient
        .from('contestations')
        .update({ lu: true })
        .eq('id', id)
    chargerContestations()
}
async function debannirDepuisContestation(username, contestationId) {
    await supabaseClient.from('profils').update({ banni: false }).eq('username', username)
    await supabaseClient.from('contestations').update({ statut: 'accepte' }).eq('id', contestationId)
    
    // Récupérer l'email de l'utilisateur
  const { data: profil } = await supabaseClient
        .from('profils')
        .select('pseudo, username, email')
        .eq('username', username)
        .single()

    // Envoyer email via EmailJS
    if (profil) {
        const { data: profil } = await supabaseClient
                    .from('profils')
                    .select('pseudo, username, email')
                    .eq('user_id', userId)
                    .single()
    }

    afficherToast('Utilisateur débanni !', 'succes')
    chargerContestations()
}

async function rejeterContestation(contestationId) {
    // Récupérer les infos de la contestation
    const { data: contestation } = await supabaseClient
        .from('contestations')
        .select('username')
        .eq('id', contestationId)
        .single()

    if (contestation) {
        const { data: profil } = await supabaseClient
            .from('profils')
            .select('pseudo, username, email')
            .eq('username', contestation.username)
            .single()

        if (profil?.email) {
            emailjs.send('service_bwyz99l', 'template_o9kll6w', {
                pseudo: profil.pseudo || profil.username,
                username: profil.username,
                email: profil.email,
                name: 'ZoTech'
            }).then(() => console.log('Email rejet envoyé !'))
            .catch(err => console.log('Erreur:', err))
        }
    }

    await supabaseClient.from('contestations').update({ statut: 'rejete' }).eq('id', contestationId)
    afficherToast('Contestation rejetée !', 'succes')
    chargerContestations()
}

// ===== RECHERCHE ADMIN =====
function rechercherAdmin(query) {
    query = query.toLowerCase().trim()
    const ongletActif = document.querySelector('.admin-onglet.active')?.textContent.trim()

    if (!query) {
        // Recharger sans filtre
        if (ongletActif?.includes('Utilisateurs')) chargerUtilisateurs()
        else if (ongletActif?.includes('Publications')) chargerPublications()
        else if (ongletActif?.includes('Signalements')) chargerSignalements()
        return
    }

    // Filtrer les lignes visibles
    const tbody = document.querySelector('.admin-section.active tbody')
    if (!tbody) return

    const lignes = tbody.querySelectorAll('tr')
    lignes.forEach(ligne => {
        const texte = ligne.textContent.toLowerCase()
        ligne.style.display = texte.includes(query) ? '' : 'none'
    })
}

// ===== TOGGLE À LA UNE =====
async function toggleFeatured(articleId, estFeatured) {
    await supabaseClient
        .from('articles')
        .update({ featured: !estFeatured })
        .eq('id', articleId)
    afficherToast(estFeatured ? 'Retiré de la une !' : 'Mis à la une !', 'succes')
    chargerPublications()
}