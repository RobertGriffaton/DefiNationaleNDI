# 🎮 NIRD Resistance - Jeu Narratif Interactif

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

> **Un serious game éducatif sur la souveraineté numérique et les enjeux du libre dans l'éducation**

NIRD Resistance est un jeu narratif interactif qui plonge le joueur dans la peau d'un décideur informatique d'un lycée confronté à des dilemmes sur l'obsolescence programmée, la protection des données et l'utilisation de logiciels libres vs propriétaires.

## 🌟 Démo

[🎯 Jouer au jeu](https://robertgriffaton.github.io/DefiNationaleNDI/) *(si déployé)*

## 📸 Aperçu

Le jeu propose une expérience immersive avec :
- 🎭 **Système de choix narratifs** avec impact sur deux jauges (Autonomie & Budget)
- 💻 **Terminal interactif** simulant des commandes système
- 🎨 **Interface rétro-futuriste** inspirée des terminaux années 80
- 📚 **Fiches pédagogiques** (wiki) pour contextualiser les enjeux
- 🔊 **Ambiance sonore** avec effets de frappe clavier
- 💾 **Système de sauvegarde** automatique
- 🎮 **Easter egg** (code Konami)

## 🚀 Technologies Utilisées

### Frontend
- **Vue 3** - Framework progressif avec Composition API
- **Vite** - Build tool ultra-rapide
- **TailwindCSS 4** - Framework CSS utilitaire
- **PostCSS** - Transformations CSS

### Fonctionnalités Techniques
- ✅ Système de machine à états (state machine) pour la navigation
- ✅ Effet de machine à écrire avec son synchronisé
- ✅ Gestion de jauges dynamiques avec animations
- ✅ Terminal interactif avec simulation de commandes
- ✅ Système de sauvegarde localStorage
- ✅ Architecture composant réutilisable
- ✅ Design responsive

## 📦 Installation

### Prérequis
- Node.js >= 18.0.0
- npm ou yarn

### Démarrage rapide

```bash
# Cloner le dépôt
git clone https://github.com/RobertGriffaton/DefiNationaleNDI.git
cd nird-resistance

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

## 📁 Structure du Projet

```
nird-resistance/
├── public/
│   ├── img/              # Assets visuels (backgrounds, personnages)
│   │   ├── bureau_directeur.jpg
│   │   ├── proviseur_enerve.png
│   │   └── ...
│   └── sounds/           # Effets sonores
│       └── typing.mp3
├── src/
│   ├── assets/
│   │   └── scenario.json # Arbre narratif du jeu
│   ├── components/
│   │   └── HelloWorld.vue
│   ├── App.vue           # Composant principal
│   ├── main.js           # Point d'entrée
│   └── style.css         # Styles globaux
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🎯 Fonctionnalités Clés

### 1. Système de Choix Narratifs
Le jeu utilise un fichier JSON (`scenario.json`) pour définir l'arbre de décision. Chaque étape propose plusieurs choix avec des impacts sur :
- **Autonomie** : Degré d'indépendance vis-à-vis des GAFAM
- **Budget** : Ressources financières disponibles

### 2. Terminal Interactif
Certains choix déclenchent un terminal simulé qui exécute des commandes fictives (ex: `lshw -short`, `apt install`), renforçant l'immersion.

### 3. Système de Jauges Dynamiques
Les jauges évoluent en temps réel avec des animations fluides et des codes couleur :
- 🟢 Vert (>60%)
- 🟡 Orange (30-60%)
- 🔴 Rouge (<30%)

### 4. Easter Eggs
Un code Konami caché permet de remplir instantanément les jauges (mode développeur).

## 🎨 Thématiques Abordées

- 🌍 **Obsolescence programmée** et impact écologique du numérique
- 🔒 **Protection des données personnelles** (RGPD)
- 💰 **Coûts cachés** des solutions "gratuites"
- 🆓 **Logiciels libres** vs propriétaires
- 🎓 **Souveraineté numérique** dans l'éducation
- ♻️ **Économie circulaire** et reconditionnement

## 🛠️ Points Techniques Intéressants

### Effet Machine à Écrire
```javascript
const typeText = async () => {
  for (let i = 0; i < fullText.length; i++) {
    displayedText.value += fullText[i];
    await new Promise(resolve => setTimeout(resolve, 25));
  }
};
```

### Gestion du Terminal
Le terminal supporte un système de script avec délais simulés et callback de validation pour débloquer l'étape suivante.

### Architecture Réactive
Utilisation intensive de `computed` et `watch` pour gérer les états complexes du jeu.

## 📝 Roadmap

- [ ] Ajout de plus de branches narratives
- [ ] Système de scoring et classement
- [ ] Mode multijoueur (débat collaboratif)
- [ ] Version mobile native (PWA)
- [ ] Traductions (EN, ES)
- [ ] Statistiques de fin de partie

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

**Robert Griffaton**

- GitHub: [@RobertGriffaton](https://github.com/RobertGriffaton)
- Projet: [DefiNationaleNDI](https://github.com/RobertGriffaton/DefiNationaleNDI)
**Stéphane Guenounou**

- GitHub: [@Guen0x](https://github.com/Guen0x)
- Projet: [DefiNationaleNDI](https://github.com/RobertGriffaton/DefiNationaleNDI)
## 🙏 Remerciements

- Inspiré par les enjeux de souveraineté numérique dans l'éducation
- Challenge Défi National Numérique Inclusif
- Communauté open source

---

**⭐ Si ce projet vous plaît, n'hésitez pas à lui donner une étoile !**
