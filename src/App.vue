<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import scenario from './assets/scenario.json';
// Import du jeu Snake (Assure-toi d'avoir créé les fichiers snake.js et snake.css dans assets)
import { SnakeGame } from './assets/snake.js';
import './assets/snake.css';

// --- ÉTAT DU JEU ---
const currentStepId = ref(1);
const autonomyScore = ref(20);
const budgetScore = ref(80);
const displayedText = ref("");
const isTyping = ref(false); 
const showWiki = ref(false); 

// --- ÉTAT DU TERMINAL INTERACTIF (HACKER) ---
const showTerminal = ref(false);
const terminalInput = ref(""); 
const terminalHistory = ref([]); 
const terminalRef = ref(null);
const terminalCallback = ref(null); 
const terminalScript = ref([]); 
const isProcessingCommand = ref(false); 

// --- EASTER EGG SNAKE ---
const showSnake = ref(false);
const snakeGameInstance = ref(null);

// --- AUDIO ---
const typingAudio = new Audio('/sounds/typing.mp3');
typingAudio.loop = true; 
typingAudio.volume = 0.3;

// --- DATA ---
const currentStep = computed(() => {
  return scenario.find(s => s.id === currentStepId.value) || scenario[0];
});

const currentBackground = computed(() => {
  return currentStep.value.background ? `/img/${currentStep.value.background}` : '/img/default_bg.jpg';
});

// LOGIQUE PERSONNAGE (Correction Bureau + Profondeur)
const currentCharacter = computed(() => {
  const charFile = currentStep.value.character;
  if (!charFile) return null;

  // SÉCURITÉ : Si c'est le proviseur, il n'apparaît que dans son bureau
  if (charFile.includes('proviseur') && currentStep.value.background !== 'bureau_directeur.jpg') {
    return null;
  }

  return `/img/${charFile}`;
});

// --- 1. SAUVEGARDE ---
const saveGame = () => {
    const gameState = { 
        step: currentStepId.value, 
        autonomy: autonomyScore.value, 
        budget: budgetScore.value 
    };
    localStorage.setItem('nird_save', JSON.stringify(gameState));
};

const loadGame = () => {
    const saved = localStorage.getItem('nird_save');
    if (saved) {
        const parsed = JSON.parse(saved);
        if(parsed.step > 1) { 
            currentStepId.value = parsed.step;
            autonomyScore.value = parsed.autonomy;
            budgetScore.value = parsed.budget;
        }
    }
};

// --- LOGIQUE SNAKE GAME ---
const openSnakeGame = async () => {
    showSnake.value = true;
    await nextTick(); // Attendre que la DIV #hidden-snake-game soit créée dans le DOM
    
    if (!snakeGameInstance.value) {
        // Création de l'instance si elle n'existe pas encore
        snakeGameInstance.value = new SnakeGame('hidden-snake-game', {
            canvasWidth: 600,
            canvasHeight: 400,
            speed: 100,
            gridSize: 20
        });
    } else {
        // Sinon on reset juste le jeu
        snakeGameInstance.value.resetGame();
        snakeGameInstance.value.draw(1);
    }
};

const closeSnakeGame = () => {
    showSnake.value = false;
    if (snakeGameInstance.value) {
        snakeGameInstance.value.destroy(); // Arrêter la boucle de jeu
        snakeGameInstance.value = null; 
    }
    window.focus(); // Redonner le focus au jeu principal
};

// --- 2. MOTEUR TEXTE ---
const typeText = async () => {
  isTyping.value = true;
  showWiki.value = false;
  displayedText.value = "";
  const fullText = currentStep.value.text;
  
  typingAudio.currentTime = 0;
  typingAudio.play().catch(() => {}); 

  for (let i = 0; i < fullText.length; i++) {
    if (fullText !== currentStep.value.text) { typingAudio.pause(); return; }
    displayedText.value += fullText[i];
    await new Promise(resolve => setTimeout(resolve, 25)); 
  }
  
  typingAudio.pause();
  isTyping.value = false;
  
  if (currentStep.value.wiki) setTimeout(() => { showWiki.value = true; }, 500);
  saveGame();
};

// --- 3. TERMINAL INTERACTIF (HACKER) ---
const openTerminal = (scriptLines, nextAction) => {
    showTerminal.value = true;
    terminalHistory.value = [
        "Welcome to NIRD OS v2.0 (GNU/Linux)",
        "System check... OK.",
        "Waiting for user input..."
    ];
    terminalInput.value = "";
    terminalScript.value = scriptLines; 
    terminalCallback.value = nextAction; 
    isProcessingCommand.value = false;
    
    nextTick(() => { });
};

const handleTerminalKey = async (e) => {
    // Si le terminal n'est pas ouvert, on ne fait rien
    if (!showTerminal.value || isProcessingCommand.value) return;

    // Gestion Espace (Empêcher le scroll)
    if (e.key === ' ') {
        e.preventDefault(); 
        terminalInput.value += ' ';
        return;
    }

    // Validation (Entrée)
    if (e.key === 'Enter') {
        e.preventDefault();
        const command = terminalInput.value.trim();
        if (command === "") return; 

        // Afficher la commande dans l'historique
        terminalHistory.value.push(`root@village-nird:~# ${terminalInput.value}`);
        
        // --- EASTER EGG : Lancement du Snake via commande ---
        if (command === 'snake' || command === './hidden_snake.sh') {
            terminalInput.value = "";
            openSnakeGame();
            return; // On arrête là pour ne pas lancer le script du jeu
        }

        // --- Comportement Normal (Script Fake) ---
        terminalInput.value = "";
        isProcessingCommand.value = true; 

        typingAudio.currentTime = 0;
        typingAudio.play().catch(() => {});

        for (const line of terminalScript.value) {
            terminalHistory.value.push(line);
            await nextTick();
            if (terminalRef.value) terminalRef.value.scrollTop = terminalRef.value.scrollHeight;
            const delay = Math.random() * 200 + 50;
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        typingAudio.pause();
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        
        showTerminal.value = false;
        if (terminalCallback.value) terminalCallback.value();
        return;
    }

    // Effacer
    if (e.key === 'Backspace') {
        terminalInput.value = terminalInput.value.slice(0, -1);
        return;
    }

    // Saisie standard (1 caractère)
    if (e.key.length === 1) {
        terminalInput.value += e.key;
    }
};

// --- GESTION DES CHOIX ---
const makeChoice = (choice) => {
  if (isTyping.value) {
    displayedText.value = currentStep.value.text;
    isTyping.value = false;
    typingAudio.pause();
    if (currentStep.value.wiki) showWiki.value = true;
    return;
  }

  const applyChoice = () => {
      if (choice.impact) {
        autonomyScore.value = Math.min(100, Math.max(0, autonomyScore.value + (choice.impact.autonomy || 0)));
        budgetScore.value = Math.min(100, Math.max(0, budgetScore.value + (choice.impact.budget || 0)));
      }
      if (choice.nextId) {
        currentStepId.value = choice.nextId;
      }
  };

  if (choice.terminal) {
      openTerminal(choice.terminal, applyChoice);
  } else {
      applyChoice();
  }
};

const restartGame = () => {
    localStorage.removeItem('nird_save');
    currentStepId.value = 1;
    autonomyScore.value = 20;
    budgetScore.value = 80;
    showWiki.value = false;
};

// --- LIFECYCLE ---
watch(currentStepId, () => { typeText(); });

onMounted(() => {
    loadGame();
    typeText();
    // Écouteur global pour le terminal
    window.addEventListener('keydown', handleTerminalKey);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleTerminalKey);
});
</script>

<template>
  <div 
    class="h-screen w-full bg-cover bg-center overflow-hidden relative select-none font-sans transition-[background-image] duration-500 ease-in-out"
    :style="{ backgroundImage: `url(${currentBackground})` }"
  >
    <!-- Overlay sombre -->
    <div class="absolute inset-0 bg-black/30 pointer-events-none"></div>

    <!-- HUD (Jauges) -->
    <div class="absolute top-4 left-4 flex flex-col gap-3 z-40 bg-gray-900/90 p-4 rounded-lg backdrop-blur-md border border-white/10 text-white text-xs md:text-sm font-mono shadow-xl w-64 border-l-4 border-l-blue-500 transition-all">
        <div class="flex flex-col gap-1">
            <div class="flex justify-between font-bold"><span>🛡️ Résistance</span><span>{{ autonomyScore }}%</span></div>
            <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden"><div class="h-full transition-all duration-500" :class="autonomyScore < 30 ? 'bg-red-500' : autonomyScore < 70 ? 'bg-yellow-400' : 'bg-green-500'" :style="{width: autonomyScore + '%'}"></div></div>
        </div>
        <div class="flex flex-col gap-1">
            <div class="flex justify-between font-bold"><span>💰 Budget</span><span>{{ budgetScore }}%</span></div>
            <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden"><div class="h-full bg-blue-500 transition-all duration-500" :style="{width: budgetScore + '%'}"></div></div>
        </div>
    </div>

    <!-- NAVBAR DE FIN DE JEU (En haut à droite) -->
    <!-- Apparaît uniquement à la fin du jeu (pas de choix) -->
    <Transition name="fade">
        <div v-if="!currentStep.choices || currentStep.choices.length === 0" class="absolute top-4 right-4 z-50 flex flex-col gap-2 items-end">
            <div class="bg-black/80 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-2xl text-right">
                <h3 class="text-white font-bold uppercase tracking-widest text-xs mb-3 border-b border-white/10 pb-2">
                    🚀 Continuer l'exploration NIRD
                </h3>
                <div class="flex flex-col gap-2">
                    <!-- 1. Boîte à Outils (Pointe vers Cookie Hell) -->
                    <a href="/form_V4/cookie-hell-simple.html" class="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-lg transition-transform hover:scale-105 shadow-md flex items-center justify-end gap-2">
                        <span>🛠️ Boîte à Outils</span>
                        <span class="text-xs opacity-75">(Cookies)</span>
                    </a>
                    
                    <!-- 2. Formulaire (Pointe vers le form principal) -->
                    <a href="/form_V4/index.html" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-transform hover:scale-105 shadow-md flex items-center justify-end gap-2">
                        <span>📝 Formulaire</span>
                        <span class="text-xs opacity-75">(Main)</span>
                    </a>
                </div>
            </div>
        </div>
    </Transition>

    <!-- WIKI POPUP (Notification) -->
    <!-- Déplacé légèrement (top-24) pour ne pas chevaucher la Navbar si elle est présente -->
    <Transition name="slide-right">
        <div v-if="showWiki && currentStep.wiki" class="absolute top-24 right-4 z-40 w-72 md:w-96">
            <div class="bg-gray-800/95 border-l-4 border-yellow-400 text-white p-5 rounded-r-lg shadow-2xl relative">
                <button @click="showWiki = false" class="absolute top-2 right-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
                <h3 class="text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2 uppercase tracking-wide">💡 Le Saviez-vous ?</h3>
                <h4 class="font-bold text-lg mb-1">{{ currentStep.wiki.title }}</h4>
                <p class="leading-snug text-gray-300 text-sm font-sans">{{ currentStep.wiki.content }}</p>
                <div class="mt-3 w-full bg-gray-700 h-1 rounded-full overflow-hidden"><div class="bg-yellow-500 h-full w-full animate-shrink"></div></div>
            </div>
        </div>
    </Transition>

    <!-- TERMINAL INTERACTIF (Overlay installation) -->
    <Transition name="fade">
        <div v-if="showTerminal" class="absolute inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="w-full max-w-4xl bg-black border-2 border-gray-700 rounded-lg shadow-2xl font-mono text-sm md:text-lg overflow-hidden flex flex-col h-[70vh] relative">
                <div class="bg-gray-800 px-4 py-3 flex items-center gap-2 border-b border-gray-700">
                    <div class="w-3 h-3 rounded-full bg-red-500"></div>
                    <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div class="w-3 h-3 rounded-full bg-green-500"></div>
                    <span class="ml-4 text-gray-400 text-xs font-bold">root@village-nird:~ (bash)</span>
                </div>
                <div ref="terminalRef" class="p-6 text-green-500 flex-1 overflow-y-auto scroll-smooth space-y-2 font-bold tracking-wide cursor-text" @click="$refs.hiddenInput?.focus()">
                    <p v-for="(line, index) in terminalHistory" :key="index" class="break-words">
                        <span v-if="line.startsWith('root')" class="text-blue-400 mr-2">➜</span>
                        <span v-else class="text-gray-400 mr-2">></span>
                        {{ line }}
                    </p>
                    <div v-if="!isProcessingCommand" class="flex items-center">
                        <span class="text-blue-400 mr-2">root@village-nird:~#</span>
                        <!-- whitespace-pre-wrap permet de voir les espaces tapés -->
                        <span class="text-white whitespace-pre-wrap">{{ terminalInput }}</span>
                        <span class="animate-pulse bg-white w-2 h-5 ml-1 inline-block"></span>
                    </div>
                    <div v-if="!isProcessingCommand && terminalInput.length === 0" class="mt-8 text-gray-600 text-xs italic text-center">
                        (Tapez votre commande et appuyez sur ENTRÉE)
                    </div>
                </div>
            </div>
        </div>
    </Transition>

    <!-- EASTER EGG: SNAKE GAME OVERLAY -->
    <!-- C'est ici que le jeu se lance quand on tape "snake" dans le terminal -->
    <div v-if="showSnake" class="snake-wrapper">
        <div class="terminal-window">
            <button @click="closeSnakeGame" class="close-overlay-btn">FERMER X</button>
            <div class="terminal-header">
                <div class="terminal-buttons">
                    <div class="term-btn close"></div>
                    <div class="term-btn min"></div>
                    <div class="term-btn max"></div>
                </div>
                <div class="terminal-title">root@ndi-2025: ~/games/snake (EASTER EGG)</div>
            </div>
            <div class="terminal-body">
                <div class="command-line">
                    <span class="prompt">root@ndi-2025:~$</span>
                    <span class="command">./hidden_snake.sh --fullscreen</span>
                </div>
                <!-- Container où le jeu va s'injecter -->
                <div id="hidden-snake-game"></div>

                <div class="terminal-status-bar">
                    <span>PID: 1337</span>
                    <span>Score: <span id="term-score">0</span></span>
                </div>
            </div>
        </div>
    </div>

    <!-- PERSONNAGE (Centré, Ajusté pour effet de profondeur) -->
    <div v-if="currentCharacter" class="absolute bottom-0 left-0 w-full flex justify-center items-end z-10 pointer-events-none">
        <img 
            :src="currentCharacter" 
            class="h-[65vh] md:h-[75vh] w-auto max-w-3xl object-contain object-bottom drop-shadow-2xl animate-slide-up transition-all duration-300" 
            alt="Personnage"
        />
    </div>

    <!-- INTERFACE DIALOGUE -->
    <div class="absolute bottom-0 w-full p-4 md:p-6 z-20 flex flex-col items-center justify-end min-h-[30vh]">
        
        <!-- CHOIX MULTIPLES (SCROLLABLE) -->
        <div v-if="!isTyping" class="mb-4 flex flex-col gap-2 w-full max-w-xl animate-fade-in max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            <!-- Boucle des choix -->
            <button 
                v-for="(choice, index) in currentStep.choices" 
                :key="index" 
                @click="makeChoice(choice)" 
                class="bg-white/95 hover:bg-yellow-400 hover:text-black text-gray-900 font-bold py-2 px-4 rounded-lg shadow-lg border-2 border-black/10 transform hover:scale-[1.02] transition-all text-left text-sm md:text-base flex items-center justify-between group min-h-[50px]"
            >
                <span class="flex-1">➤ {{ choice.text }}</span>
                <span v-if="choice.terminal" class="text-[10px] bg-gray-900 text-green-400 px-2 py-1 rounded font-mono ml-3 border border-green-500/50 group-hover:bg-black group-hover:text-green-300 whitespace-nowrap">
                    >_ CMD
                </span>
            </button>
            
            <!-- ÉCRAN DE FIN DE JEU : BOUTON RECOMMENCER (La navbar est maintenant en haut à droite) -->
            <div v-if="!currentStep.choices || currentStep.choices.length === 0" class="flex flex-col items-center mt-4 w-full">
                <!-- Bouton Recommencer -->
                <button @click="restartGame" class="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg animate-bounce mb-6">
                    🔄 Recommencer l'aventure
                </button>

                <!-- Indice Snake (Easter Egg) -->
                <div class="mt-4 text-2xl opacity-30 hover:opacity-100 transition-opacity cursor-help" title="Psst... Tapez 'snake' dans le terminal (choix technique)...">
                    🐍
                </div>
            </div>
        </div>

        <!-- BOITE DE TEXTE -->
        <div @click="isTyping = false; displayedText = currentStep.text; typingAudio.pause(); if(currentStep.wiki) showWiki = true;" class="w-full max-w-4xl bg-gray-900/95 border-2 border-white/30 rounded-xl p-6 shadow-2xl backdrop-blur-md relative cursor-pointer">
            <div v-if="currentStep.speaker" class="absolute -top-4 left-6 bg-yellow-500 text-black font-extrabold px-4 py-1 rounded shadow-lg uppercase tracking-widest text-xs md:text-sm border-2 border-white">{{ currentStep.speaker }}</div>
            <p class="text-white text-base md:text-xl leading-relaxed font-medium drop-shadow-md mt-2 h-20 md:h-24 overflow-y-auto font-sans">
                {{ displayedText }}<span v-if="isTyping" class="animate-pulse text-yellow-400">|</span>
            </p>
            <div v-if="!isTyping && currentStep.choices.length > 0" class="absolute bottom-3 right-4 text-yellow-400 animate-bounce text-xl">▼</div>
        </div>
    </div>

    <footer class="absolute bottom-1 right-2 text-[10px] text-gray-400 z-50 opacity-60 hover:opacity-100 transition-opacity">Nuit de l'Info 2025 | Démarche NIRD</footer>
  </div>
</template>

<style>
/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-right-enter-active { transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.slide-right-leave-active { transition: all 0.3s ease-in; }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); opacity: 0; }

/* Animations */
@keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.animate-slide-up { animation: slideUp 0.6s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
@keyframes shrink { from { width: 100%; } to { width: 0%; } }
.animate-shrink { animation: shrink 15s linear forwards; }

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.3); border-radius: 10px; }
</style>