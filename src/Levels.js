/**
 * Levels.js
 * Centralisation des données de niveaux pour le jeu et l'éditeur.
 */

const GameLevels = {
    "1": {
        "level_id": 1,
        "name": "Niveau 1",
        "tutorial_tip": "",
        "mapData": [
            [0, 20, 0, 20, 5, 0, 0, 0, 0, 0],
            [0, 20, 0, 20, 0, 0, 0, 0, 0, 0],
            [0, 20, 0, 20, 0, 0, 0, 0, 0, 0],
            [0, 20, 0, 20, 0, 0, 0, 0, 0, 0],
            [0, 20, 21, 20, 0, 0, 0, 0, 0, 0],
            [0, 20, 21, 20, 0, 0, 0, 0, 0, 0],
            [0, 20, 21, 20, 3, 0, 0, 0, 0, 0],
            [0, 20, 21, 20, 0, 0, 0, 0, 0, 0],
            [0, 20, 21, 20, 0, 0, 0, 6, 0, 0],
            [0, 20, 21, 20, 0, 0, 0, 0, 0, 0]
        ],
        "gemsRequired": 0
    },
    "2": {
        "level_id": 2,
        "name": "Le Pas des Épines",
        "tutorial_tip": "Pétrifie l'ennemi (3) avec ESPACE et pousse-le dans l'eau (2) !",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 0, 1, 0, 4, 1, 8, 1],
            [1, 1, 1, 1, 0, 1, 0, 2, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 1
    },
    "3": {
        "level_id": 3,
        "name": "Le Delta de Pierre",
        "tutorial_tip": "Tu as besoin de deux ponts pour atteindre ces éclats.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 8, 2, 1, 4, 1, 4, 1, 1, 1, 1],
            [1, 0, 2, 0, 2, 0, 2, 0, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 1],
            [1, 0, 3, 0, 0, 0, 0, 3, 0, 0, 1],
            [1, 0, 0, 0, 5, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 2
    },
    "4": {
        "level_id": 4,
        "name": "L'Écho du Styx",
        "tutorial_tip": "Une statue qui en frappe une autre lui transmet son élan !",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 4, 1, 1, 1, 1, 1, 1, 1, 8, 1],
            [1, 2, 1, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 0, 3, 0, 3, 0, 1, 1],
            [1, 0, 0, 0, 0, 1, 3, 1, 0, 5, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 1
    },
    "5": {
        "level_id": 5,
        "name": "La Clairière des Éclats",
        "tutorial_tip": "Collectez toutes les gemmes avant que la porte ne s'ouvre.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 0, 0, 0, 0, 0, 4, 1],
            [1, 0, 0, 3, 0, 0, 0, 3, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 4, 0, 3, 0, 0, 0, 3, 0, 4, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 8, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 3
    },
    "6": {
        "level_id": 6,
        "name": "Le Passage de Corail",
        "tutorial_tip": "L'eau entoure presque tout ici.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 0, 1, 4, 2, 4, 1, 0, 0, 1],
            [1, 0, 0, 3, 0, 1, 0, 2, 0, 1, 0, 3, 1],
            [1, 0, 3, 0, 0, 1, 4, 2, 4, 1, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
            [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
            [1, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 4
    },
    "7": {
        "level_id": 7,
        "name": "L'Archipel Perdu",
        "tutorial_tip": "Construis ton propre chemin entre les îles.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 3, 2, 4, 0, 4, 2, 3, 0, 0, 1],
            [1, 0, 0, 0, 2, 0, 3, 0, 2, 0, 0, 0, 1],
            [1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1],
            [1, 4, 0, 3, 0, 0, 0, 0, 0, 3, 0, 4, 1],
            [1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1],
            [1, 0, 0, 0, 2, 0, 3, 0, 2, 0, 0, 8, 1],
            [1, 0, 3, 0, 2, 4, 0, 4, 2, 3, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 6
    },
    "8": {
        "level_id": 8,
        "name": "Le Trident Sacré",
        "tutorial_tip": "Trois bras mènent aux richesses de l'Olympe.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 4, 2, 4, 2, 1, 8, 1, 2, 4, 2, 4, 1],
            [1, 0, 2, 0, 2, 0, 0, 0, 2, 0, 2, 0, 1],
            [1, 3, 0, 3, 0, 3, 5, 3, 0, 3, 0, 3, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 4
    },
    "9": {
        "level_id": 9,
        "name": "Les Eaux d'Achéron",
        "tutorial_tip": "Méfie-toi du courant invisible (labyrinthe d'eau).",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 2, 4, 0, 0, 0, 4, 2, 0, 8, 1],
            [1, 1, 0, 2, 0, 2, 2, 2, 0, 2, 0, 1, 1],
            [1, 1, 0, 2, 0, 2, 4, 2, 0, 2, 0, 1, 1],
            [1, 1, 3, 0, 0, 3, 0, 3, 0, 0, 3, 1, 1],
            [1, 1, 2, 2, 2, 2, 0, 2, 2, 2, 2, 1, 1],
            [1, 1, 4, 0, 3, 0, 0, 0, 3, 0, 4, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 4
    },
    "10": {
        "level_id": 10,
        "name": "Le Passage Final de Hermès",
        "tutorial_tip": "Le dernier test avant les ressorts.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 4, 1],
            [1, 1, 1, 1, 0, 2, 3, 2, 3, 2, 0, 1, 1, 1, 1],
            [1, 4, 0, 3, 0, 2, 0, 2, 0, 2, 0, 3, 0, 4, 1],
            [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
            [1, 2, 2, 2, 2, 2, 3, 2, 3, 2, 2, 2, 2, 2, 1],
            [1, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 8, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 3
    },
    "11": {
        "level_id": 11,
        "name": "Le Rebond de Morphée",
        "tutorial_tip": "Le ressort (9) renvoie les objets avec force.",
        "mapData": [
            [1, 9, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 3, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 5, 0, 0, 0, 4, 1],
            [1, 2, 2, 2, 2, 2, 1],
            [1, 1, 1, 8, 1, 1, 1]
        ],
        "gemsRequired": 1
    },
    "12": {
        "level_id": 12,
        "name": "Le Billard d'Hermès",
        "tutorial_tip": "Les ressorts renvoient les blocs à 180 degrés.",
        "mapData": [
            [1, 1, 1, 9, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [9, 0, 3, 0, 0, 0, 9],
            [1, 0, 0, 5, 0, 0, 1],
            [1, 1, 1, 8, 1, 1, 1]
        ],
        "gemsRequired": 0
    },
    "13": {
        "level_id": 13,
        "name": "Le Zig-Zag Élastique",
        "tutorial_tip": "Utilise le ressort pour atteindre le coin opposé.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 9, 1],
            [1, 5, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 3, 0, 0, 0, 0, 0, 3, 0, 0, 1],
            [1, 0, 0, 0, 2, 2, 2, 0, 0, 4, 1],
            [1, 1, 1, 1, 1, 8, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 1
    },
    "14": {
        "level_id": 14,
        "name": "Double Rebond",
        "tutorial_tip": "Deux ressorts valent mieux qu'un.",
        "mapData": [
            [1, 9, 1, 1, 1, 9, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 3, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [1, 4, 2, 0, 2, 4, 1],
            [1, 0, 2, 5, 2, 0, 1],
            [1, 1, 1, 8, 1, 1, 1]
        ],
        "gemsRequired": 2
    },
    "15": {
        "level_id": 15,
        "name": "L'Arène de Choc",
        "tutorial_tip": "Fais circuler la statue tout autour de la salle.",
        "mapData": [
            [1, 1, 1, 1, 1, 9, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 0, 0, 0, 0, 0, 4, 1],
            [9, 0, 0, 0, 1, 1, 1, 0, 0, 0, 9],
            [1, 0, 0, 0, 1, 3, 1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
            [9, 0, 0, 0, 0, 3, 0, 0, 0, 0, 9],
            [1, 4, 0, 0, 0, 0, 0, 0, 0, 8, 1],
            [1, 1, 1, 1, 1, 9, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 2
    },
    "16": {
        "level_id": 16,
        "name": "Le Grand Huit",
        "tutorial_tip": "Les ressorts propulsent les statues sur de longues distances.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1],
            [1, 0, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
            [1, 3, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1],
            [1, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 1],
            [9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9],
            [1, 1, 1, 1, 1, 1, 8, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 1
    },
    "17": {
        "level_id": 17,
        "name": "La Cascade de Bronze",
        "tutorial_tip": "Pousse la statue dans l'axe du ressort.",
        "mapData": [
            [1, 1, 1, 1, 1, 9, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 2, 1, 1, 1, 0, 1],
            [1, 0, 1, 3, 0, 2, 0, 3, 1, 0, 1],
            [1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
            [1, 5, 0, 0, 0, 2, 0, 0, 0, 4, 1],
            [1, 1, 1, 1, 1, 8, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 1
    },
    "18": {
        "level_id": 18,
        "name": "Le Piège à Ressort",
        "tutorial_tip": "Anticipe le rebond pour ne pas te faire écraser.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 3, 0, 0, 4, 1],
            [1, 0, 1, 1, 1, 1, 1, 2, 1],
            [1, 0, 0, 0, 0, 0, 0, 2, 1],
            [1, 3, 1, 1, 1, 1, 0, 2, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 9, 1, 1, 8, 1, 1, 1, 1]
        ],
        "gemsRequired": 1
    },
    "19": {
        "level_id": 19,
        "name": "L'Envol de Pégase",
        "tutorial_tip": "La statue doit traverser toute la zone d'eau.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 3, 0, 0, 0, 0, 3, 0, 4, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
            [1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 4, 2, 1],
            [1, 9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8, 1]
        ],
        "gemsRequired": 2
    },
    "20": {
        "level_id": 20,
        "name": "Le Mur du Son",
        "tutorial_tip": "La vitesse est la clé de ce puzzle.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 4, 1],
            [1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 2, 1],
            [1, 3, 0, 3, 0, 3, 0, 2, 0, 3, 0, 3, 0, 2, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 1]
        ],
        "gemsRequired": 1
    },
    "21": {
        "level_id": 21,
        "name": "La Forge du Destin",
        "tutorial_tip": "Le marteau (10) dévie les statues à 90 degrés selon sa rotation.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 1, 4, 0, 1],
            [1, 0, 0, 10, 0, 0, 1],
            [1, 0, 3, 1, 0, 0, 1],
            [1, 1, 1, 1, 8, 1, 1]
        ],
        "gemsRequired": 1
    },
    "22": {
        "level_id": 22,
        "name": "L'Angle d'Héphaïstos",
        "tutorial_tip": "Le marteau change la direction du bloc à 90 degrés.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 1, 4, 0, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 0, 3, 0, 10, 0, 0, 0, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 8, 0, 0, 1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 1
    },
    "23": {
        "level_id": 23,
        "name": "Le Double Virage",
        "tutorial_tip": "Utilise deux marteaux pour effectuer un demi-tour.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 1, 4, 0, 4, 1],
            [1, 0, 3, 0, 10, 0, 0, 0, 1],
            [1, 0, 0, 0, 1, 0, 10, 0, 1],
            [1, 3, 0, 0, 1, 8, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 2
    },
    "24": {
        "level_id": 24,
        "name": "Le Ricochet d'Arès",
        "tutorial_tip": "Combinaison de marteaux et de ressorts.",
        "mapData": [
            [1, 1, 1, 1, 1, 9, 1],
            [1, 5, 0, 0, 0, 0, 1],
            [1, 0, 3, 0, 10, 0, 1],
            [1, 0, 0, 0, 0, 0, 1],
            [9, 0, 0, 1, 1, 1, 1],
            [1, 4, 0, 8, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 1
    },
    "25": {
        "level_id": 25,
        "name": "La Danse des Éclats",
        "tutorial_tip": "Chaque marteau doit être utilisé au bon moment.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 0, 0, 0, 0, 0, 4, 1],
            [1, 0, 10, 0, 1, 1, 1, 0, 10, 0, 1],
            [1, 0, 0, 3, 0, 3, 0, 0, 0, 0, 1],
            [1, 0, 10, 0, 1, 1, 1, 0, 10, 0, 1],
            [1, 4, 0, 0, 0, 0, 0, 0, 0, 8, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 2
    },
    "26": {
        "level_id": 26,
        "name": "Le Labyrinthe du Minotaure",
        "tutorial_tip": "Attention ! Le Pousseur (11) te traquera sans relâche.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 1, 0, 0, 0, 1, 0, 0, 4, 1],
            [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 0, 11, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
            [1, 4, 0, 0, 1, 0, 0, 0, 1, 0, 0, 8, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 2
    },
    "27": {
        "level_id": 27,
        "name": "La Parade des Ombres",
        "tutorial_tip": "Utilise les dalles pour te protéger des Pousseurs.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1],
            [1, 0, 11, 0, 0, 0, 0, 3, 0, 0, 0, 0, 11, 0, 1],
            [1, 0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0, 1],
            [1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 2
    },
    "28": {
        "level_id": 28,
        "name": "Le Temple du Froid",
        "tutorial_tip": "Pétrifie le Pousseur pour l'utiliser comme un bloc.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 0, 11, 0, 1, 1],
            [1, 0, 1, 1, 0, 1, 0, 1, 1],
            [1, 0, 1, 4, 2, 4, 0, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 8, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 2
    },
    "29": {
        "level_id": 29,
        "name": "L'Énigme du Sphinx",
        "tutorial_tip": "Un passage secret ne s'ouvre que si tu marches sur la dalle (7).",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 0, 0, 0, 3, 0, 0, 0, 4, 1],
            [1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2, 1],
            [1, 7, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 1],
            [1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 2, 1],
            [1, 4, 0, 0, 0, 3, 0, 0, 0, 0, 0, 8, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 2
    },
    "30": {
        "level_id": 30,
        "name": "Le Grand Sanctuaire",
        "tutorial_tip": "Utilisez les dalles sacrées pour vous protéger du Pousseur.",
        "mapData": [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 1],
            [1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1],
            [1, 0, 0, 0, 7, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 8, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        ],
        "gemsRequired": 0
    }
};

// Export pour usage global (Browser)
if (typeof window !== 'undefined') {
    window.GameLevels = GameLevels;
}
