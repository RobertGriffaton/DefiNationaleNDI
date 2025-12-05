<?php
// save.php
//
// Endpoint d'enregistrement des messages.
// Fonction principale : stocker les messages regroupés par utilisateur dans content.json.
// Format cible (map par utilisateur) :
// {
//   "user@example.com": { "email":"...", "nom":"...", "prenom":"...", "messages": [ {"date":"...","message":"..."}, ... ] },
//   "anon_abc123": { ... }
// }
//
// Comportement :
// - récupère POST['message'] et les champs utilisateur (user_email,user_nom,user_prenom)
// - migre l'ancien format (array indexé d'entrées) si nécessaire
// - ajoute le message au tableau `messages` de l'utilisateur (clé par email ou anonymisée)
// - sauve content.json
//
// Notes sécurité :
// - Les données sont échappées via htmlspecialchars() avant stockage pour limiter les risques XSS
// - En production, ajouter des validations supplémentaires (email, longueur, quota, authentification)

// 1. On récupère le message du formulaire
// Récupération des données envoyées
$message = $_POST['message'] ?? '';
$user_email = trim($_POST['user_email'] ?? '');
$user_nom = trim($_POST['user_nom'] ?? '');
$user_prenom = trim($_POST['user_prenom'] ?? '');

// Si message vide, on redirige (rien à faire)
if (!empty(trim($message))) {
    $file = 'content.json';

    // Charger le fichier si présent
    $raw = file_exists($file) ? file_get_contents($file) : '';
    $current = $raw !== '' ? json_decode($raw, true) : [];
    if (!is_array($current)) $current = [];

    // Le nouveau format souhaité :
    // {
    //   "user@example.com": { "email":"...", "nom":"...", "prenom":"...", "messages": [ {"date":"...","message":"..."}, ... ] },
    //   "anon_abc123": { ... }
    // }

    // Si le fichier existant est un tableau indexé (ancien format), on le migre vers la map par utilisateur
    $map = [];
    if ($current && array_keys($current) === range(0, count($current) - 1)) {
        // ancien format : array d'entrées
        foreach ($current as $entry) {
            $u = $entry['user'] ?? [];
            $email = trim($u['email'] ?? '');
            $nom = trim($u['nom'] ?? '');
            $prenom = trim($u['prenom'] ?? '');
            $date = $entry['date'] ?? date('Y-m-d H:i:s');
            $msg = $entry['message'] ?? '';
            $key = $email !== '' ? $email : 'anon_' . substr(md5($nom . '|' . $prenom), 0, 8);
            if (!isset($map[$key])) {
                $map[$key] = [
                    'email' => $email,
                    'nom' => $nom,
                    'prenom' => $prenom,
                    'messages' => []
                ];
            }
            $map[$key]['messages'][] = ['date' => $date, 'message' => $msg];
        }
    } else {
        // Déjà au format map : on l'utilise tel quel
        $map = $current;
    }

    // Préparer la clé utilisateur pour l'entrée courante
    $user_key = $user_email !== '' ? $user_email : 'anon_' . substr(md5($user_nom . '|' . $user_prenom), 0, 8);

    if (!isset($map[$user_key])) {
        $map[$user_key] = [
            'email' => $user_email,
            'nom' => $user_nom,
            'prenom' => $user_prenom,
            'messages' => []
        ];
    }

    // Ajout du message avec date dans le tableau messages de l'utilisateur
    $map[$user_key]['messages'][] = [
        'date' => date('Y-m-d H:i:s'),
        'message' => htmlspecialchars($message)
    ];

    // Sauvegarde finale
    file_put_contents($file, json_encode($map, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// 7. Redirection vers la page d'accueil avec un petit signal "?saved=1"
header('Location: index.html?saved=1');
exit;
?>