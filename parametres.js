let utilisateurActuel = null
let profilActuel = null

// ===== CHARGER PARAMÈTRES =====
async function chargerParametres() {
    const { data: sessionData } = await supabaseClient.auth.getSession()
    utilisateurActuel = sessionData.session?.user || null

    if (!utilisateurActuel) {
        window.location.href = 'index.html'
        return
    }

    const { data: profil } = await supabaseClient
        .from('profils')
        .select('*')
        .eq('user_id', utilisateurActuel.id)
        .single()

    profilActuel = profil

    // Appliquer état compte privé
    if (profil?.compte_prive) {
        document.getElementById('toggle-prive').classList.add('actif')
    }

    chargerListeBloques()
}

// ===== COMPTE PRIVÉ =====
async function toggleComptePrive() {
    const toggle = document.getElementById('toggle-prive')
    const estPrive = toggle.classList.contains('actif')

    toggle.classList.toggle('actif')

    await supabaseClient
        .from('profils')
        .update({ compte_prive: !estPrive })
        .eq('user_id', utilisateurActuel.id)

    afficherToast(!estPrive ? 'Compte privé activé !' : 'Compte public activé !', 'succes')
}

// ===== CHANGER MOT DE PASSE =====
function ouvrirChangerMotDePasse() {
    document.getElementById('modal-mdp').classList.add('ouvert')
}

function fermerModalMdp() {
    document.getElementById('modal-mdp').classList.remove('ouvert')
    document.getElementById('mdp-nouveau').value = ''
    document.getElementById('mdp-confirmer').value = ''
    document.getElementById('mdp-message').style.display = 'none'
}

async function changerMotDePasse() {
    const nouveau = document.getElementById('mdp-nouveau').value.trim()
    const confirmer = document.getElementById('mdp-confirmer').value.trim()
    const msg = document.getElementById('mdp-message')

    if (!nouveau || !confirmer) {
        msg.textContent = '❌ Remplis les deux champs !'
        msg.style.color = '#e24b4a'
        msg.style.display = 'block'
        return
    }

    if (nouveau.length < 6) {
        msg.textContent = '❌ Le mot de passe doit avoir au moins 6 caractères !'
        msg.style.color = '#e24b4a'
        msg.style.display = 'block'
        return
    }

    if (nouveau !== confirmer) {
        msg.textContent = '❌ Les mots de passe ne correspondent pas !'
        msg.style.color = '#e24b4a'
        msg.style.display = 'block'
        return
    }

    const { error } = await supabaseClient.auth.updateUser({ password: nouveau })

    if (error) {
        msg.textContent = '❌ Erreur : ' + error.message
        msg.style.color = '#e24b4a'
        msg.style.display = 'block'
        return
    }

    msg.textContent = '✅ Mot de passe modifié !'
    msg.style.color = '#1D9E75'
    msg.style.display = 'block'

    setTimeout(() => fermerModalMdp(), 1500)
}

// ===== LISTE DE BLOCAGE =====
async function chargerListeBloques() {
    const { data: bloques } = await supabaseClient
        .from('blocages')
        .select('bloque_id')
        .eq('bloqueur_id', utilisateurActuel.id)

    const container = document.getElementById('liste-bloques')

    if (!bloques || bloques.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:1rem;">Aucun utilisateur bloqué</p>'
        return
    }

    const ids = bloques.map(b => b.bloque_id)
    const { data: profils } = await supabaseClient
        .from('profils')
        .select('user_id, pseudo, username, photo_profil')
        .in('user_id', ids)

    container.innerHTML = (profils || []).map(p => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem 0; border-bottom:1px solid #252840;">
            <a href="profil.html?u=${p.username}" style="display:flex; align-items:center; gap:0.75rem; text-decoration:none;">
                <div style="width:36px; height:36px; border-radius:50%; background:#7c3aed; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                    ${p.photo_profil 
                        ? `<img src="${p.photo_profil}" style="width:100%;height:100%;object-fit:cover;">`
                        : (p.pseudo || p.username).charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style="color:#e2e8f0; font-size:0.9rem;">${p.pseudo}</div>
                    <div style="color:#94a3b8; font-size:0.8rem;">@${p.username}</div>
                </div>
            </a>
            <button onclick="debloquerUtilisateur('${p.user_id}')" 
                style="background:transparent; border:1px solid #e24b4a; color:#e24b4a; padding:0.4rem 0.85rem; border-radius:8px; cursor:pointer; font-size:0.8rem;">
                Débloquer
            </button>
        </div>
    `).join('')
}

function ouvrirListeBlockage() {
    document.getElementById('modal-blocage').classList.add('ouvert')
}

function fermerModalBlocage() {
    document.getElementById('modal-blocage').classList.remove('ouvert')
}

async function rechercherUtilisateurBlocage(query) {
    if (query.length < 2) {
        document.getElementById('blocage-suggestions').innerHTML = ''
        return
    }

    const { data: profils } = await supabaseClient
        .from('profils')
        .select('user_id, pseudo, username, photo_profil')
        .or(`username.ilike.%${query}%,pseudo.ilike.%${query}%`)
        .neq('user_id', utilisateurActuel.id)
        .limit(5)

    document.getElementById('blocage-suggestions').innerHTML = (profils || []).map(p => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:0.6rem 0.75rem; background:#0f1117; border-radius:8px; margin-bottom:0.4rem;">
            <div style="display:flex; align-items:center; gap:0.75rem;">
                <div style="width:32px; height:32px; border-radius:50%; background:#7c3aed; display:flex; align-items:center; justify-content:center; overflow:hidden; font-size:0.85rem;">
                    ${p.photo_profil 
                        ? `<img src="${p.photo_profil}" style="width:100%;height:100%;object-fit:cover;">`
                        : (p.pseudo || p.username).charAt(0).toUpperCase()}
                </div>
                <span style="color:#e2e8f0; font-size:0.85rem;">${p.pseudo} <span style="color:#94a3b8;">@${p.username}</span></span>
            </div>
            <button onclick="bloquerUtilisateur('${p.user_id}', '${p.pseudo}')" 
                style="background:#e24b4a; border:none; color:white; padding:0.35rem 0.75rem; border-radius:8px; cursor:pointer; font-size:0.78rem;">
                Bloquer
            </button>
        </div>
    `).join('')
}

async function bloquerUtilisateur(userId, pseudo) {
    const { error } = await supabaseClient
        .from('blocages')
        .insert([{ bloqueur_id: utilisateurActuel.id, bloque_id: userId }])

    if (!error) {
        afficherToast(`@${pseudo} bloqué !`, 'succes')
        chargerListeBloques()
        document.getElementById('blocage-search').value = ''
        document.getElementById('blocage-suggestions').innerHTML = ''
    }
}

async function debloquerUtilisateur(userId) {
    await supabaseClient
        .from('blocages')
        .delete()
        .eq('bloqueur_id', utilisateurActuel.id)
        .eq('bloque_id', userId)

    afficherToast('Utilisateur débloqué !', 'succes')
    chargerListeBloques()
}

// ===== SUPPRIMER COMPTE =====
async function supprimerCompte() {
    ouvrirConfirm({
        icone: '🗑️',
        titre: 'Supprimer mon compte',
        message: 'Cette action est irréversible ! Toutes tes données seront perdues.',
        texteBouton: 'Supprimer définitivement',
        onConfirm: async () => {
            await supabaseClient.from('articles').delete().eq('user_id', utilisateurActuel.id)
            await supabaseClient.from('commentaires').delete().eq('user_id', utilisateurActuel.id)
            await supabaseClient.from('likes').delete().eq('user_id', utilisateurActuel.id)
            await supabaseClient.from('favoris').delete().eq('user_id', utilisateurActuel.id)
            await supabaseClient.from('profils').delete().eq('user_id', utilisateurActuel.id)
            await supabaseClient.auth.signOut()
            window.location.href = 'index.html'
        }
    })
}

// ===== LANCER =====
window.addEventListener('load', chargerParametres)

// ===== CHANGER EMAIL =====
function ouvrirChangerEmail() {
    document.getElementById('modal-email').classList.add('ouvert')
}

function fermerModalEmail() {
    document.getElementById('modal-email').classList.remove('ouvert')
    document.getElementById('email-nouveau').value = ''
    document.getElementById('email-message').style.display = 'none'
}

async function changerEmail() {
    const nouvelEmail = document.getElementById('email-nouveau').value.trim()
    const msg = document.getElementById('email-message')

    if (!nouvelEmail || !nouvelEmail.includes('@')) {
        msg.textContent = '❌ Entre une adresse email valide !'
        msg.style.color = '#e24b4a'
        msg.style.display = 'block'
        return
    }

    const { error } = await supabaseClient.auth.updateUser({ email: nouvelEmail })

    if (error) {
        msg.textContent = '❌ Erreur : ' + error.message
        msg.style.color = '#e24b4a'
        msg.style.display = 'block'
        return
    }

    // Mettre à jour aussi dans la table profils
    await supabaseClient
        .from('profils')
        .update({ email: nouvelEmail })
        .eq('user_id', utilisateurActuel.id)

    msg.textContent = '✅ Un email de confirmation a été envoyé !'
    msg.style.color = '#1D9E75'
    msg.style.display = 'block'

    setTimeout(() => fermerModalEmail(), 2000)
}