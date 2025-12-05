<?php
// user_check.php
// ----------------
// Endpoint léger utilisé par le client pour savoir si un utilisateur est
// déjà présent dans `content.json` (ceci évite de lui faire repasser les mini-jeux).
//
// Entrées (GET):
//  - email (optionnel) -> recherche prioritaire par email
//  - nom, prenom (utilisés si email absent pour générer la clé anon_...)
//
// Sortie JSON: { "exists": 0 | 1 }
//
header('Content-Type: application/json; charset=utf-8');

$email = trim($_GET['email'] ?? '');
$nom = trim($_GET['nom'] ?? '');
$prenom = trim($_GET['prenom'] ?? '');

$file = 'content.json';
$exists = 0;

if (file_exists($file)) {
    $raw = file_get_contents($file);
    $data = $raw !== '' ? json_decode($raw, true) : [];
    if (is_array($data)) {
        // Ancien format : tableau indexé d'entrées
        if ($data && array_keys($data) === range(0, count($data) - 1)) {
            foreach ($data as $entry) {
                $u = $entry['user'] ?? [];
                $e = trim($u['email'] ?? '');
                if ($email !== '' && $e !== '' && strcasecmp($email, $e) === 0) { $exists = 1; break; }
            }
        } else {
            // Nouveau format : map par utilisateur
            $key = $email !== '' ? $email : 'anon_' . substr(md5($nom . '|' . $prenom), 0, 8);
            if (isset($data[$key])) $exists = 1;
        }
    }
}

echo json_encode(['exists' => $exists]);
