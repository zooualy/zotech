async function chargerDetail() {
    const params = new URLSearchParams(window.location.search)
    const articleId = params.get('article_id')

    if (!articleId) {
        window.location.href = 'admin.html'
        return
    }

    // Récupérer tous les signalements pour cet article
    const { data: signalements } = await supabaseClient
        .from('signalements')
        .select('*')
        .eq('article_id', articleId)
        .order('created_at', { ascending: false })

    if (!signalements || signalements.length === 0) {
        window.location.href = 'admin.html'
        return
    }

    // Récupérer l'article
    const { data: article } = await supabaseClient
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single()

    // Récupérer les profils des signaleurs
    const userIds = [...new Set(signalements.map(s => s.user_id).filter(Boolean))]
    let profils = {}
    if (userIds.length > 0) {
        const { data: profs } = await supabaseClient
            .from('profils')
            .select('user_id, pseudo, username, photo_profil')
            .in('user_id', userIds)
        if (profs) profs.forEach(p => profils[p.user_id] = p)
    }

    document.getElementById('detail-contenu').innerHTML = `
        <div style="background:#1a1d2e; border:1px solid #252840; border-radius:16px; padding:1.5rem; margin-bottom:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
                <span style="background:rgba(226,75,74,0.15); color:#e24b4a; padding:0.3rem 0.75rem; border-radius:20px; font-size:0.8rem; font-weight:600;">
                    🚩 ${signalements.length} signalement${signalements.length > 1 ? 's' : ''}
                </span>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <a href="article.html?id=${articleId}&src=supabase" target="_blank" 
                        style="background:#1D9E75; color:white; padding:0.5rem 1rem; border-radius:8px; text-decoration:none; font-size:0.85rem;">
                        <i class="fa-solid fa-eye"></i> Voir l'article
                    </a>
                    <button onclick="supprimerArticleSignale(${articleId})"
                        style="background:#e24b4a; color:white; border:none; padding:0.5rem 1rem; border-radius:8px; cursor:pointer; font-size:0.85rem;">
                        <i class="fa-solid fa-trash"></i> Supprimer
                    </button>
                    <button onclick="marquerTousTraites(${articleId})"
                        style="background:#7c3aed; color:white; border:none; padding:0.5rem 1rem; border-radius:8px; cursor:pointer; font-size:0.85rem;">
                        <i class="fa-solid fa-check"></i> Tout traiter
                    </button>
                </div>
            </div>
            <h2 style="color:#ffffff; margin-bottom:0.5rem;">${article?.titre || 'Article'}</h2>
            <p style="color:#94a3b8; font-size:0.9rem;">par ${article?.auteur} · ${new Date(article?.created_at).toLocaleDateString('fr-FR')}</p>
        </div>

        <h3 style="color:#ffffff; margin-bottom:1rem;">📋 Détails des signalements</h3>
        
        ${signalements.map(s => {
            const signaleur = profils[s.user_id]
            return `
                <div style="background:#1a1d2e; border:1px solid #252840; border-radius:12px; padding:1.25rem; margin-bottom:1rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <div style="width:36px; height:36px; border-radius:50%; background:#7c3aed; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                                ${signaleur?.photo_profil 
                                    ? `<img src="${signaleur.photo_profil}" style="width:100%;height:100%;object-fit:cover;">`
                                    : (signaleur?.pseudo || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style="color:#ffffff; font-size:0.9rem; font-weight:500;">${signaleur?.pseudo || 'Utilisateur'}</div>
                                <div style="color:#7c3aed; font-size:0.8rem;">@${signaleur?.username || ''}</div>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                            <span style="background:rgba(226,75,74,0.15); color:#e24b4a; padding:0.3rem 0.75rem; border-radius:20px; font-size:0.78rem;">${s.raison}</span>
                            <span style="color:#606070; font-size:0.78rem;">${new Date(s.created_at).toLocaleDateString('fr-FR')}</span>
                            <span style="background:${s.statut === 'en_attente' ? 'rgba(239,159,39,0.15)' : 'rgba(29,158,117,0.15)'}; 
                                color:${s.statut === 'en_attente' ? '#EF9F27' : '#1D9E75'}; 
                                padding:0.25rem 0.75rem; border-radius:20px; font-size:0.75rem;">
                                ${s.statut}
                            </span>
                        </div>
                    </div>
                    ${s.message ? `
                        <div style="background:#0f1117; border-radius:8px; padding:0.75rem; color:#94a3b8; font-size:0.85rem; font-style:italic; border-left:3px solid #7c3aed;">
                            "${s.message}"
                        </div>
                    ` : ''}
                </div>
            `
        }).join('')}
    `
}

async function supprimerArticleSignale(articleId) {
    ouvrirConfirm({
        icone: '🗑️',
        titre: 'Supprimer l\'article',
        message: 'Supprimer cet article et marquer tous les signalements comme traités ?',
        texteBouton: 'Supprimer',
        onConfirm: async () => {
            await supabaseClient.from('articles').delete().eq('id', articleId)
            await supabaseClient.from('signalements').update({ statut: 'traite' }).eq('article_id', articleId)
            afficherToast('Article supprimé !', 'succes')
            setTimeout(() => window.location.href = 'admin.html', 1500)
        }
    })
}

async function marquerTousTraites(articleId) {
    ouvrirConfirm({
        icone: '✅',
        titre: 'Marquer comme traités',
        message: 'Marquer tous les signalements de cet article comme traités ?',
        texteBouton: 'Confirmer',
        onConfirm: async () => {
            await supabaseClient.from('signalements').update({ statut: 'traite' }).eq('article_id', articleId)
            afficherToast('Tous les signalements traités !', 'succes')
            setTimeout(() => window.location.href = 'admin.html', 1500)
        }
    })
}

window.addEventListener('load', chargerDetail)