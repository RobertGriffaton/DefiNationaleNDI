/*
    form_V4/lettres/script.js
    -------------------------
    Script qui anime la mini-interface "catcher" et gère la saisie des
    informations utilisateur sur la page `boiteidee.html`.

    Rôles principaux:
    - animations ludiques (lettres qui tombent) pour la saisie
    - gestion du bouton d'accès (sauvegarde en localStorage puis redirection)

    Ce fichier ne communique pas directement avec le serveur; il écrit
    localStorage['lettres_user'] attendu ensuite par `form_V4/script.js`.
*/

const Catcher = document.getElementById('catcher');
const MailBox = document.getElementById('email-box');
const NomBox = document.getElementById('nom-box');
const PrenomBox = document.getElementById('prenom-box');
const LoginButton = document.getElementById('login-btn');
const KEY_MAP = {
    // Azerty-like swaps (preserve original playful behavior)
    'a': 'z', 'z': 'a', 'e': 'r', 'r': 'e', 't': 'y',
    'y': 't', 'u': 'i', 'i': 'u', 'o': 'p', 'p': 'o',
    'q': 's', 's': 'q', 'd': 'f', 'f': 'd', 'g': 'h',
    'h': 'g', 'j': 'k', 'k': 'j', 'l': 'w', 'w': 'l',
    'x': 'c', 'c': 'x', 'v': 'b', 'b': 'v', 'n': 'm',
    'm': 'n',

    // Uppercase equivalents
    'A': 'Z', 'Z': 'A', 'E': 'R', 'R': 'E', 'T': 'Y',
    'Y': 'T', 'U': 'I', 'I': 'U', 'O': 'P', 'P': 'O',
    'Q': 'S', 'S': 'Q', 'D': 'F', 'F': 'D', 'G': 'H',
    'H': 'G', 'J': 'K', 'K': 'J', 'L': 'W', 'W': 'L',
    'X': 'C', 'C': 'X', 'V': 'B', 'B': 'V', 'N': 'M',
    'M': 'N',

    // Numbers shifted one to the right (playful)
    '1': '2', '2': '3', '3': '4', '4': '5', '5': '6',
    '6': '7', '7': '8', '8': '9', '9': '0', '0': '1',

    // Keep arobase available: both @ and ; produce @ (so @ isn't swallowed)
    ';': '@', '@': '@',

    // Accented letters and special French characters: map to themselves so
    // they are recognized and will drop as-is when pressed (é, è, à, ç, etc.)
    'é': 'é', 'É': 'É', 'è': 'è', 'È': 'È', 'ê': 'ê', 'Ê': 'Ê',
    'ë': 'ë', 'Ë': 'Ë', 'à': 'à', 'À': 'À', 'â': 'â', 'Â': 'Â',
    'ä': 'ä', 'Ä': 'Ä', 'ç': 'ç', 'Ç': 'Ç', 'ù': 'ù', 'Ù': 'Ù',
    'û': 'û', 'Û': 'Û', 'ü': 'ü', 'Ü': 'Ü', 'î': 'î', 'Î': 'Î',
    'ï': 'ï', 'Ï': 'Ï', 'ô': 'ô', 'Ô': 'Ô', 'œ': 'œ', 'Œ': 'Œ',
    'æ': 'æ', 'Æ': 'Æ',

    // Common punctuation and symbols: pass through
    '.': '.', ',': ',', ':': ':', '!': '!', '?': '?', '-': '-',
    '_': '_', '+': '+', '=': '=', '/': '/', '\\': '\\',
    '"': '"', "'": "'", '(': '(', ')': ')', '[': '[', ']': ']',
    '{': '{', '}': '}', '%': '%', '$': '$', '#': '#', '&': '&',
    '*': '*', '~': '~', '`': '`', '^': '^', '€': '€',
};

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

let divList = [] 
let catcherData = {
    'x':100,
    'length': 200,
}

let divid=0;
let field=1;

const randomChar = () => {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters.charAt(getRandomInt(0, letters.length));
}


// ===================================
// Fonction générique pour créer un élément tombant
// ===================================
const generateFallingDiv = (left_padding, content, type) => {
    let fallingDiv = document.createElement('div');
    fallingDiv.style.cssText = `
    position:fixed;
    left: ${left_padding}px;
    top: 20px;
    opacity:1;
    z-index:${type === 'background' ? '90' : '100'};
   `;
    let contentText = document.createElement('h1');
    contentText.innerHTML = content;
    fallingDiv.dataset.type = type;
    
    if(type === 'eraser') {
        contentText.style.color = 'white';
        contentText.style.background = 'crimson';
        contentText.style.padding = '6px';
        contentText.style.borderRadius = '6px';
        contentText.style.fontSize = '34px';
    } else if (type === 'letter') {
        contentText.style.color = '#ff00c3ff'; 
        contentText.style.fontSize = '48px';
    } else if (type === 'background') {
        contentText.style.color = 'rgba(255, 255, 255, 0.5)';
        contentText.style.fontSize = '24px';
    }

    fallingDiv.appendChild(contentText);
    fallingDiv.id = divid;
    document.body.appendChild(fallingDiv);

    return fallingDiv;
}


let loginLoopInterval = setInterval(loginLoop, 10);
let spawnTime = 0; 

function loginLoop(){
    spawnTime += 10;
    
    // 1. Apparition des lettres de bruit de fond (chaque 200ms)
    if(spawnTime >= 200){
        spawnTime = 0;
        const random_char = randomChar();
        const random_x = getRandomInt(20, window.innerWidth - 20);
        divList.push(generateFallingDiv(random_x, random_char, 'background')); 
        divid += 1;
    }

    // 2. Mise en évidence du champ actif
    if(field == 1){
        MailBox.style.borderColor = "purple";
        NomBox.style.borderColor = "white";
        PrenomBox.style.borderColor = "white";
        LoginButton.style.borderColor = "white";
    }
    else if( field == 2){
        MailBox.style.borderColor = "white";
        NomBox.style.borderColor = "purple";
        PrenomBox.style.borderColor = "white";
        LoginButton.style.borderColor = "white";
    }
    else if( field == 3){
        MailBox.style.borderColor = "white";
        NomBox.style.borderColor = "white";
        PrenomBox.style.borderColor = "purple";
        LoginButton.style.borderColor = "white";
    }
    else{
        MailBox.style.borderColor = "white";
        NomBox.style.borderColor = "white";
        PrenomBox.style.borderColor = "white";
        LoginButton.style.borderColor = "purple";
    }
   
    // 3. Mouvement des éléments
    moveLetters();
}

function stopLoginLoop(){
    clearInterval(loginLoopInterval);
    console.log('login stopped')
}


function removeElement(id){
    const elementToRemove = document.getElementById(id);
    if(elementToRemove != null)
        elementToRemove.remove()
}

function moveLetters(){
    divList = divList.filter(element => { 
        const computedStyle = window.getComputedStyle(element);
        let currentTop = parseInt(computedStyle.getPropertyValue("top"));
        const type = element.dataset && element.dataset.type;
        
        // Vitesse basée sur le type
        if(type === 'eraser') {
            currentTop += 10; 
        } else if (type === 'background') {
            currentTop += 1; 
        } 
        else { 
            currentTop += 3; 
        }
        
        element.style.top =  `${currentTop}px`;

        // 1. Élément manqué
        if(parseInt(element.style.top) > window.innerHeight) {
            removeElement(element.id);
            return false; 
        }

        // 2. Élément attrapé
        const isCaught = (
            parseInt(element.style.top) > window.innerHeight - 120 && 
            parseInt(element.style.top) < window.innerHeight - 20 && 
            parseInt(element.style.left) >=  catcherData.x && 
            parseInt(element.style.left) <= catcherData.x + catcherData.length
        );

        if(isCaught) {
            if (type === 'background') {
                 removeElement(element.id);
                 return false;
            }

            const parentDiv = document.getElementById(element.id);
            if(parentDiv != null){
                const childText = parentDiv.querySelector("h1").textContent;
                
                if(type === 'eraser'){
                    clearAllInput();
                } else { 
                    addLetterToBox(childText);
                }
                removeElement(element.id);
                return false; 
            }
        }
        
        return true; 
    });
}


function clearAllInput(){
    if(field == 1){
        MailBox.value = '';
    } else if(field == 2){
        NomBox.value = '';
    } else if(field == 3){
        PrenomBox.value = '';
    }
}

function addLetterToBox(chr){
    if (field == 1){
        MailBox.value += chr;
    }
    else if (field == 2){
        NomBox.value += chr;
    }
    else if (field == 3){
        PrenomBox.value += chr;
    }
}


document.addEventListener("keydown", function(event) {
    const key = event.key;
    const isMappableKey = key.length === 1 && KEY_MAP.hasOwnProperty(key); 
    
    event.preventDefault(); 
    

    // 1. GESTION DU MOUVEMENT ET NAVIGATION
    if(key == 'ArrowRight' && catcherData.x + catcherData.length < window.innerWidth - 20 ) {
        catcherData.x += 50;
    } else if (key == 'ArrowLeft' && catcherData.x > 20) {
        catcherData.x -= 50;
    } else if(key == 'Enter') {
        // move forward when pressing Enter
        field += 1;
        if (field > 4) field = 4; 
    } 
    // allow moving up/down between fields
    else if (key == 'ArrowDown') {
        field += 1;
        if (field > 4) field = 4;
    } else if (key == 'ArrowUp') {
        field -= 1;
        if (field < 1) field = 1;
    }
    // 2. GESTION DE L'EFFACEUR
    else if (key == 'Backspace') {
        // Fait tomber un effaceur à une position aléatoire
        const random_x = getRandomInt(20, window.innerWidth - 20);
        divList.push(generateFallingDiv(random_x, '🧽', 'eraser'));
        divid += 1;
    } 
    // 3. GESTION DE LA CHUTE DE LETTRE (POSITION ALÉATOIRE)
    else if (isMappableKey) { 
        const substituted_char = KEY_MAP[key]; 
        
        // <<< LA MODIFICATION CLÉ EST ICI >>>
        // Fait tomber la lettre à une position X aléatoire sur l'écran
        const drop_x = getRandomInt(20, window.innerWidth - 20); 

        divList.push(generateFallingDiv(drop_x, substituted_char, 'letter')); 
        divid += 1;
    }

    // update visual focus + focus element
    Catcher.style.left=`${catcherData.x}px`
    if (field === 1) {
        MailBox.focus();
    } else if (field === 2) {
        NomBox.focus();
    } else if (field === 3) {
        PrenomBox.focus();
    } else if (field === 4) {
        // focus the login button so user can activate it with keyboard
        LoginButton.focus();
    }

});

// -----------------------------------------
// Gestion du bouton "Accéder à la boîte"
// Sauvegarde les informations utilisateur dans localStorage
// puis redirige vers le formulaire principal (../index.html)
// -----------------------------------------
if (LoginButton) {
    LoginButton.addEventListener('click', function () {
        const email = MailBox.value.trim();
        const nom = NomBox.value.trim();
        const prenom = PrenomBox.value.trim();

        if (!email && !nom && !prenom) {
            // si aucun champ renseigné, on demande à l'utilisateur
            alert('Veuillez saisir au moins une information (email, nom ou prénom) avant de continuer.');
            return;
        }

        try {
            const payload = { email: email, nom: nom, prenom: prenom };
            localStorage.setItem('lettres_user', JSON.stringify(payload));
        } catch (e) {
            // ignore errors (private mode, quota)
        }

        // redirection vers le formulaire principal
        window.location.href = '../index.html';
    });
}