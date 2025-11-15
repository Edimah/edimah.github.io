---
layout: page
title: freelance
nav: true
nav_order: 5
permalink: /freelance/
---

> J’accompagne les équipes qui ont besoin d’analyse statistique rigoureuse, de modélisation et de prototypage IA léger — sans infrastructure lourde.

---

## Capacités centrales

- **Analyses statistiques structurées** : modèles bayésiens ou hiérarchiques, séries temporelles, estimation d’incertitude pour appuyer la décision.
- **Analyses prédictives calmes** : scoring, classification, NLP léger ; livrables reproductibles en notebooks ou scripts prêts à intégrer.
- **Données de santé & visualisations** : exploitation de bases publiques ou privées, mise en forme claire pour les décideurs.
- **Transfert de compétences** : ateliers sur les fondamentaux statistiques, séances d’acculturation IA adaptées au niveau des équipes.

| Besoin fréquent                | Ce que je livre                            | Résultat attendu                       |
| ------------------------------ | ------------------------------------------ | -------------------------------------- |
| Comprendre un phénomène métier | Modèles transparents + note méthodologique | Lecture partagée et actionnable        |
| Tester un cas d’usage IA/ML    | Prototype end-to-end (data → API/notebook) | Décision rapide sur la suite à donner  |
| Rendre des chiffres lisibles   | Visualisations, dashboards ou rapports     | Matériel prêt pour les comités/clients |

### Domaines familiers

- Pharmacies d’officine et industriels pharma.
- Épidémiologie et santé publique.
- PME sous-exploitant leurs données.

---

## Approche de collaboration

1. **Clarifier** la question métier, les métriques utiles et les contraintes d’usage.
2. **Structurer** les données (qualité, lignage, documentation de chaque transformation).
3. **Construire** le modèle, le prototype ou la visualisation la plus simple possible.
4. **Transmettre** : code commenté, rapport court, passation orale ou atelier ciblé.

<details>
<summary>Exemples d’interventions récentes</summary>

- Mise à jour d’un modèle de prévision d’activité officinale, avec indicateurs de performance.
- Analyse exploratoire de données d’enquêtes santé.
- Session d’acculturation IA pour équipes métier (2h), centrée sur des cas concrets.

</details>

- [x] Clarté méthodologique.
- [x] Simplicité technique.
- [x] Livrables immédiatement exploitables par les équipes métier.

---

## Expérience & ancrage

> Monde pharmaceutique, officines, épidémiologie et santé publique constituent mon terrain principal. J’y suis habitué aux contraintes qualité, à la documentation et aux délais serrés des acteurs institutionnels.

### 🤝 Contact

- [Contact direct par email](mailto:edimah.synesius-songo@proton.me)
- Possibilité d’échanger en visio.

### 📊 Exemples de travaux récents

<div class="project-carousel">
  {% assign project_cards = site.projects | where_exp: "p", "p.draft != true" | sort: "importance" | reverse %}
  {% if project_cards == empty %}
    {% assign project_cards = site.santepub %}
  {% endif %}
  {% for item in project_cards limit: 6 %}
    {% assign summary = item.excerpt | default: item.description | default: item.content %}
    {% assign summary = summary | strip_html | truncate: 140 %}
    <article class="project-card">
      {% if item.image %}
        <div class="project-card__thumb">
          <img src="{{ item.image | relative_url }}" alt="Illustration {{ item.title }}">
        </div>
      {% endif %}
      <h4><a href="{{ item.url | relative_url }}">{{ item.title }}</a></h4>
      <p class="project-card__summary">{{ summary }}</p>
      <p class="project-card__meta">
        {% if item.date %}
          {{ item.date | date: "%d %b %Y" }} ·
        {% endif %}
        {{ item.collection | default: "Projet" | capitalize }}
      </p>
    </article>
  {% endfor %}
</div>

<style>
.project-carousel {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding: 1rem 0 0.5rem;
  scroll-snap-type: x mandatory;
}
.project-card {
  min-width: 260px;
  max-width: 320px;
  padding: 1rem;
  border: 1px solid var(--global-divider-color, #e1e4e8);
  border-radius: 0.75rem;
  background: var(--global-bg-color, #fff);
  scroll-snap-align: start;
}
.project-card__thumb img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;
}
.project-card__summary {
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}
.project-card__meta {
  font-size: 0.85rem;
  color: var(--global-muted-color, #6c757d);
  margin-bottom: 0;
}
</style>
