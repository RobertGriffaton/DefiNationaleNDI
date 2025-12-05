<?php
/**
 * index.php
 * --------
 * Wrapper simple pour rediriger vers `lettres/boiteidee.html`.
 * Utilisé principalement pour le serveur PHP intégré afin que l'URL /
 * lance la page de saisie des informations utilisateur.
 *
 * Ne contient pas de logique sensible : redirection 302 vers la page de saisie.
 */
header('Location: lettres/boiteidee.html', true, 302);
exit;
?>