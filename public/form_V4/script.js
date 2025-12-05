// ==================================================================
// script.js — Comportements du formulaire V4
// - gestion du déplacement du formulaire (effet "qui fuit")
// - gestion du bouton "Arrêter le formulaire" et de la manivelle (batterie)
// - interception de la première soumission : modal + mini-jeu (cookie-hell)
// - restauration du message après complétion du jeu et persistance de l'état
//
// Contrat / inputs-outputs :
// - Lit localStorage['lettres_user'] pour préremplir `user_email`, `user_nom`, `user_prenom`.
// - Enregistre temporairement le brouillon dans localStorage['formV2_draft'] lors du lancement du jeu.
// - Après victoire, appelle `onGameComplete()` qui :
//     * restaure le brouillon, autorise le collage, cache la manivelle,
//     * marque localStorage['formV4_unlocked']='1' pour persistance (évite de refaire les mini-jeux),
//     * désactive définitivement le bouton "Arrêter le formulaire".
//
// Points d'extension :
// - user_check.php : endpoint qui permet au client de savoir si l'utilisateur est déjà connu
// - save.php : endpoint serveur qui regroupe les messages par utilisateur dans content.json
//
// Remarques sécurité : ne pas stocker d'informations sensibles dans localStorage en production.
// ==================================================================
document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES ---
    const form = document.getElementById("contactForm");
    const stopBtn = document.getElementById('stop-btn');
    const messageInput = document.getElementById('message');
    const submitBtn = document.getElementById('submit-btn');
    // Hidden inputs / user display (remplis depuis la page lettres)
    const userEmailInput = document.getElementById('user-email');
    const userNomInput = document.getElementById('user-nom');
    const userPrenomInput = document.getElementById('user-prenom');
    const userInfoBox = document.getElementById('user-info');
    const userNameLabel = document.getElementById('user-name');
    
    // Variables pour la Manivelle
    const crankSection = document.getElementById('crank-section');
    const crankBtn = document.getElementById('crank-btn');
    const batteryLevel = document.getElementById('battery-level');
    const statusText = document.getElementById('status-text');

    // --- PARTIE 1 : LE FORMULAIRE QUI FUIT (Paramètres de ton fichier original) ---

    // Ajoute la transition CSS dynamiquement (Vitesse 0.6s = Plus lent/facile)
    form.style.transition = "left 0.6s ease-out, top 0.6s ease-out";
    form.style.position = "absolute"; // Important pour que left/top fonctionnent

    // états du formulaire
    let isMoving = false;      // indique si une animation de mouvement est en cours
    let locked = false;        // verrou : empêche tout mouvement une fois activé
    let gameLaunched = false;
    let gameCompleted = false;
    let popupWindow = null;
    let allowPaste = false; // après complétion on autorisera le collage
    let annoyClickCount = 0; // compteur partagé pour le modal intégré

    // Position initiale au centre
    let initialLeftPercent = 50;
    let initialTopPercent = 50;
    
    // On place le formulaire au centre au début
    form.style.left = initialLeftPercent + "%";
    form.style.top = initialTopPercent + "%";
    form.style.transform = "translate(-50%, -50%)";

    // Surveillance de la souris pour déclencher le déplacement aléatoire
    // Le formulaire se déplacera si la souris s'approche du centre (distance < 150px)
    document.addEventListener("mousemove", (e) => {
        if (locked) return; // Si on a cliqué sur "Arrêter", on ne bouge plus

        const rect = form.getBoundingClientRect();
        // Calcul du centre du formulaire
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distX = e.clientX - centerX;
        const distY = e.clientY - centerY;
        // Distance entre la souris et le centre du formulaire
        const dist = Math.sqrt(distX ** 2 + distY ** 2);

        // --- PARAMÈTRES ORIGINAUX (Plus facile) ---
        // Distance < 150px (il faut s'approcher plus près pour qu'il bouge)
        if (dist < 150 && !isMoving) {
            isMoving = true;
            
            // Calcul des limites pour ne pas sortir de l'écran
            const formWidth = form.offsetWidth;
            const formHeight = form.offsetHeight;
            const maxLeftPercent = ((window.innerWidth - formWidth) / window.innerWidth) * 100;
            const maxTopPercent = ((window.innerHeight - formHeight) / window.innerHeight) * 100;

            // Nouvelle position aléatoire
            let randomLeft = Math.random() * 80 + 10;
            let randomTop = Math.random() * 80 + 10;

            // On s'assure qu'on reste dans les limites
            randomLeft = Math.min(randomLeft, maxLeftPercent);
            randomTop = Math.min(randomTop, maxTopPercent);
            randomLeft = Math.max(randomLeft, 0);
            randomTop = Math.max(randomTop, 0);
            
            // On enlève le centrage CSS temporairement pour éviter les conflits de calcul
            form.style.transform = "none"; 

            // On applique la nouvelle position en pourcentage (transition CSS gère l'animation)
            form.style.left = randomLeft + "%";
            form.style.top = randomTop + "%";
            
            // On attend 600ms (0.6s) avant de pouvoir rebouger
            setTimeout(() => {
                isMoving = false;
            }, 600); 
        }
    });

    // --- TRANSITION : QUAND ON CLIQUE SUR ARRÊTER ---

    // Capture le formulaire : le recentre, affiche la manivelle et active la saisie
    stopBtn.addEventListener('click', () => {
        // Si l'utilisateur est déjà déverrouillé (a passé le jeu), empêcher toute réactivation
        try {
            if (localStorage.getItem('formV4_unlocked') === '1') {
                // déjà déverrouillé -> rien à faire
                return;
            }
        } catch (e) {}

        locked = true; // On verrouille le mouvement
        
        // On remet le formulaire bien au centre pour l'esthétique
        form.style.transition = "all 1s ease";
        form.style.left = "50%";
        form.style.top = "50%";
        form.style.transform = "translate(-50%, -50%)";
        
        // Mise à jour visuelle du bouton
        stopBtn.textContent = "✅ Formulaire Capturé";
        stopBtn.disabled = true;
        stopBtn.style.backgroundColor = "#10b981"; // Vert succès

        // Apparition de la section Manivelle
        crankSection.style.display = "block";
        
        // Activation du champ message (mais attention à la coupure de courant !)
        messageInput.disabled = false;
        messageInput.placeholder = "Vite ! Tapez avant la coupure...";
        messageInput.focus();
        submitBtn.disabled = false;

        // On lance le jeu de la manivelle
        startCrankGame();
    });

    // --- PARTIE 2 : JEU DE LA MANIVELLE & ÉNERGIE ---

    function startCrankGame() {
        let energy = 100;
        const decayRate = 1.5; // Vitesse à laquelle la barre descend
        const boostAmount = 15; // Énergie gagnée par clic

        // Boucle de jeu (toutes les 100ms)
        const gameLoop = setInterval(() => {
            energy -= decayRate;
            
            if (energy > 100) energy = 100;
            
            // Si plus d'énergie, on punit
            if (energy <= 0) {
                energy = 0;
                punishUser();
            }

            updateUI(energy);

        }, 100);

        // Clic sur la manivelle
        crankBtn.addEventListener('click', () => {
            energy += boostAmount;
            
            // Si on a de l'énergie et que le champ était bloqué, on le débloque
            if (energy > 0 && messageInput.classList.contains('power-outage')) {
                restorePower();
            }
            updateUI(energy);
        });

        function punishUser() {
            // Si pas déjà puni
            if (!messageInput.classList.contains('power-outage')) {
                messageInput.classList.add('power-outage'); // Flou + gris
                messageInput.value = ""; // ON EFFACE LE TEXTE (Cruel)
                messageInput.blur(); // On enlève le focus
                statusText.innerHTML = "⚠️ PANNE DE COURANT - TEXTE PERDU";
                statusText.style.color = "red";
            }
        }

        function restorePower() {
            messageInput.classList.remove('power-outage');
            messageInput.focus();
            statusText.innerHTML = "⚡ Système en ligne";
            statusText.style.color = "#22c55e"; // Vert
        }

        function updateUI(currentEnergy) {
            batteryLevel.style.width = currentEnergy + "%";
            
            // Changement de couleur selon le niveau
            if (currentEnergy < 20) {
                batteryLevel.style.background = "#ef4444"; // Rouge
            } else if (currentEnergy < 50) {
                batteryLevel.style.background = "#eab308"; // Jaune
            } else {
                batteryLevel.style.background = "#22c55e"; // Vert
            }
        }
    }
    
    // Petit bonus : empêcher le copier-coller tant que le jeu n'est pas complété
    function pasteHandler(e) {
        if (!allowPaste) {
            e.preventDefault();
            alert("Copier-coller interdit !");
        }
    }
    messageInput.addEventListener('paste', pasteHandler);

    // ... tout le code du jeu précédent ...

    // --- GESTION DU MESSAGE DE SUCCÈS (Retour de save.php) ---
    const params = new URLSearchParams(window.location.search);
    if (params.get('saved') === '1') {
        const flash = document.getElementById('flash');
        if (flash) {
            // On force l'affichage
            flash.hidden = false; 
            flash.style.display = 'block'; 
            
            // On le cache après 4 secondes
            setTimeout(() => {
                flash.style.display = 'none';
                
                // On nettoie l'URL pour que le message ne revienne pas si on rafraichit
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 4000);
        }
    }

    // --- INTERCEPTION DE LA SOUMISSION : bloquer tant que le jeu n'est pas complété ---
    form.addEventListener('submit', (e) => {
        const hasMessage = messageInput && messageInput.value && messageInput.value.trim() !== '';
        // Si le jeu n'est pas complété, on empêche toujours l'envoi
        if (!gameCompleted) {
            e.preventDefault();
            try { localStorage.setItem('formV2_draft', messageInput.value); } catch (err) { /* ignore */ }

            // Si le jeu n'a pas encore été lancé, on lance la séquence (modal intégré ou popup)
            if (!gameLaunched && hasMessage) {
                const annoyModal = document.getElementById('annoy-modal');
                if (annoyModal) {
                    annoyModal.classList.add('active');
                    annoyModal.setAttribute('aria-hidden', 'false');
                    // reset compteur (le listener CONTINUER enverra la popup au 3ème clic)
                    annoyClickCount = 0;
                } else {
                    // fallback immédiat (popup)
                    const popupUrl = 'popup/index.html';
                    const features = 'width=520,height=700,menubar=no,toolbar=no,location=no';
                    try {
                        popupWindow = window.open(popupUrl, 'formV2CookiePopup', features);
                        if (!popupWindow) popupWindow = window.open(popupUrl, '_blank');
                    } catch (err) {
                        window.open(popupUrl, '_blank');
                    }
                    gameLaunched = true;
                    // Bloquer le bouton d'envoi pendant que le jeu est en cours
                    try { submitBtn.disabled = true; } catch (e) {}
                }
            } else {
                // Le jeu est déjà lancé mais pas complété : informer / focaliser la popup
                try {
                    if (popupWindow && !popupWindow.closed) {
                        popupWindow.focus();
                    } else {
                        alert('Le mini-jeu est en cours dans une autre fenêtre. Terminez-le pour pouvoir envoyer le formulaire.');
                    }
                } catch (e) {
                    // ignore
                }
            }

            return; // empêcher l'envoi tant que jeu non complété
        }
        // sinon, laisser la soumission se faire normalement (envoyer à save.php)
    });

    // Ecouter message postMessage depuis la popup / jeu
    window.addEventListener('message', (ev) => {
        const data = ev.data || {};
        if (data && data.type === 'cookie-hell-complete') {
            onGameComplete();
        }
    });

    // Écoute storage pour fallback si le jeu est ouvert dans un nouvel onglet
    window.addEventListener('storage', (ev) => {
        if (!ev) return;
        if (ev.key === 'formV2_cookie_complete' && ev.newValue === '1') {
            try { localStorage.removeItem('formV2_cookie_complete'); } catch (e) {}
            onGameComplete();
        }
    });

    function onGameComplete() {
        gameCompleted = true;
        gameLaunched = false;
        locked = true; // bloquer définitivement le mouvement

        // Nettoyer complètement le champ message
        if (messageInput) {
            messageInput.disabled = false;
            messageInput.classList.remove('power-outage');
            messageInput.style.opacity = '1';
            messageInput.style.pointerEvents = 'auto';
            messageInput.style.filter = 'none';
            messageInput.style.backgroundColor = '';
        }

        // Restaurer le message depuis localStorage si présent
        try {
            const draft = localStorage.getItem('formV2_draft');
            if (draft !== null && messageInput) {
                messageInput.value = draft;
            }
        } catch (e) { }

        // Désactiver les features qui génent l'utilisateur
        try {
            crankSection.style.display = 'none';
            crankBtn.disabled = true;
        } catch (e) {}

        // Autoriser le copier-coller maintenant
        allowPaste = true;

        // Autoriser l'usage normal: enable submit, remove restrictions
        if (messageInput) {
            messageInput.disabled = false;
            submitBtn.disabled = false;
            messageInput.placeholder = 'Votre message...';
            messageInput.focus();
        }

        // Fermer la popup si elle existe
        try { if (popupWindow && !popupWindow.closed) popupWindow.close(); } catch (e) {}

        // Afficher un message de confirmation temporaire
        const flash = document.getElementById('flash');
        if (flash) {
            flash.hidden = false;
            flash.textContent = 'Jeu terminé — vous pouvez maintenant envoyer des messages librement';
            setTimeout(() => { flash.hidden = true; }, 4000);
        }

        // Nettoyer le draft (optionnel)
        try { localStorage.removeItem('formV2_draft'); } catch (e) {}

        // Marquer de façon persistante que l'utilisateur est déverrouillé
        try { localStorage.setItem('formV4_unlocked', '1'); } catch (e) {}

        // Désactiver définitivement le bouton "Arrêter le formulaire" pour éviter relance
        try {
            if (stopBtn) {
                stopBtn.disabled = true;
                stopBtn.setAttribute('aria-disabled', 'true');
                stopBtn.style.pointerEvents = 'none';
                stopBtn.textContent = '✅ Déverrouillé';
                stopBtn.style.backgroundColor = '#10b981';
            }
        } catch (e) {}
    }

    // --- PRÉREMPLISSAGE DES INFOS UTILISATEUR (depuis lettres/boiteidee) ---
    try {
        const raw = localStorage.getItem('lettres_user');
        if (raw) {
            const obj = JSON.parse(raw);
            if (obj) {
                if (userEmailInput) userEmailInput.value = obj.email || '';
                if (userNomInput) userNomInput.value = obj.nom || '';
                if (userPrenomInput) userPrenomInput.value = obj.prenom || '';

                // Affiche une petite info à l'écran
                const displayName = [obj.prenom, obj.nom].filter(Boolean).join(' ').trim() || obj.email || '';
                if (displayName && userInfoBox && userNameLabel) {
                    userNameLabel.textContent = displayName;
                    userInfoBox.style.display = 'block';
                }
                // Vérifier côté serveur si l'utilisateur existe déjà pour éviter de lui faire refaire les mini-jeux
                try {
                    const params = new URLSearchParams();
                    if (obj.email && obj.email.trim() !== '') {
                        params.append('email', obj.email.trim());
                    } else {
                        params.append('nom', obj.nom || '');
                        params.append('prenom', obj.prenom || '');
                    }

                    fetch('user_check.php?' + params.toString(), { cache: 'no-store' })
                        .then(res => res.json())
                        .then(data => {
                            if (data && data.exists) {
                                // L'utilisateur existe : autoriser l'usage normal sans mini-jeux
                                try {
                                    // marque persistante au cas où
                                    try { localStorage.setItem('formV4_unlocked', '1'); } catch (e) {}
                                    onGameComplete();
                                } catch (e) { /* ignore */ }
                            }
                        }).catch(() => {/* ignore network errors */});
                } catch (e) { /* ignore */ }
            }
        }
    } catch (e) {
        // ignore parse errors
    }

    // Si l'utilisateur a déjà été déverrouillé précédemment, appliquer l'état immédiatement
    try {
        if (localStorage.getItem('formV4_unlocked') === '1') {
            try { onGameComplete(); } catch (e) {}
        }
    } catch (e) {}

    // --- MODAL "POPUP CHIANT" INTÉGRÉ DANS index.html ---
    try {
    const annoyLaunch = document.getElementById('annoy-launch');
    const annoyModal = document.getElementById('annoy-modal');
    const annoyContinue = document.getElementById('annoy-continue');
    const annoyCancel = document.getElementById('annoy-cancel');

        function openAnnoyModal() {
            if (!annoyModal) return;
            annoyModal.classList.add('active');
            annoyModal.setAttribute('aria-hidden', 'false');
            annoyClickCount = 0;
        }

        function closeAnnoyModal() {
            if (!annoyModal) return;
            annoyModal.classList.remove('active');
            annoyModal.setAttribute('aria-hidden', 'true');
        }

        if (annoyLaunch) {
            annoyLaunch.addEventListener('click', (e) => {
                e.preventDefault();
                openAnnoyModal();
            });
        }

        if (annoyCancel) {
            annoyCancel.addEventListener('click', (e) => {
                e.preventDefault();
                // comportement volontairement piégeux
                alert('Ha ha ! Le bouton "Annuler" ne fonctionne pas ! 😈');
            });
        }

        if (annoyContinue) {
            annoyContinue.addEventListener('click', (e) => {
                e.preventDefault();
                annoyClickCount++;
                if (annoyClickCount < 3) {
                    alert('Clic ' + annoyClickCount + '/3 - Continuez à appuyer !');
                    return;
                }

                // Au 3ème clic : ouvrir le jeu (popup avec fallback) et sauvegarder le brouillon
                try { localStorage.setItem('formV2_draft', messageInput.value); } catch (err) { /* ignore */ }

                const popupUrl = 'popup/index.html';
                const features = 'width=520,height=700,menubar=no,toolbar=no,location=no';
                try {
                    popupWindow = window.open(popupUrl, 'formV2CookiePopup', features);
                    if (!popupWindow) popupWindow = window.open(popupUrl, '_blank');
                } catch (err) {
                    window.open(popupUrl, '_blank');
                }

                gameLaunched = true;
                // Bloquer le bouton d'envoi pendant que le jeu est en cours
                try { submitBtn.disabled = true; } catch (e) {}
                closeAnnoyModal();
            });
        }

        // Empêche la touche Échap de fermer le modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && annoyModal && annoyModal.classList.contains('active')) {
                e.preventDefault();
                alert('Non non non, pas d\'échappatoire ! 😈');
            }
        });
    } catch (e) {
        // ignore si éléments manquants
    }

// Fin du DOMContentLoaded (ne pas effacer l'accolade ci-dessous)
});