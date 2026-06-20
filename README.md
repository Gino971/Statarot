# Statarot

Web app de statistiques de situations de jeu au tarot.

## Developpement local

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
```

## GitHub Pages (Deploy from a branch)

Ce projet est configure pour un deploiement depuis la branche `main` et le dossier `docs`.

1. Generer les fichiers Pages:

```bash
npm run build:pages
```

2. Commit + push le dossier `docs`.

3. Dans GitHub: Settings > Pages
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/docs`

4. Attendre la publication puis ouvrir l'URL Pages du depot.
