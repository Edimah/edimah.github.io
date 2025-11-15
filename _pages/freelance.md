---
layout: page
title: freelance
nav: true
nav_order: 5
permalink: /freelance/
tabs: true
---

<div class="text-center mb-4">
  <strong>Choisissez votre langue / Pick your language</strong>
</div>

{% tabs freelance-lang %}

{% tab freelance-lang Français %}

> J’accompagne les structures qui ont besoin d’analyse statistique rigoureuse, de modélisation et de prototypage IA léger — sans infrastructure lourde.

---

## Capacités centrales

- **Analyses statistiques structurées** : modèles bayésiens ou hiérarchiques, séries temporelles, estimation d’incertitudes pour appuyer la décision.
- **Analyses prédictives calmes** : scoring, classification, NLP léger ; livrables reproductibles en notebooks ou scripts prêts à intégrer.
- **Données de santé & visualisations** : exploitation de bases publiques ou privées, mise en forme claire pour les décideurs.
- **Transfert de compétences** : ateliers d’introduction aux stats/IA adaptés aux attentes des équipes.

| Besoin fréquent                | Ce que je livre                            | Résultat attendu                       |
| ------------------------------ | ------------------------------------------ | -------------------------------------- |
| Comprendre un phénomène métier | Modèles transparents + note méthodologique | Lecture partagée et actionnable        |
| Tester un cas d’usage IA/ML    | Prototype end-to-end (data → API/notebook) | Décision rapide sur la suite à donner  |
| Rendre des chiffres lisibles   | Visualisations, dashboards ou rapports     | Matériel prêt pour les comités/clients |

### Domaines familiers

- Pharmacies d’officine et industriels pharma.
- Épidémiologie et santé publique.
- PME régulées avec fortes contraintes de traçabilité.

---

## Approche

1. **Clarifier** la question métier, les métriques utiles et les contraintes d’usage.
2. **Structurer** les données (qualité, lignage, documentation de chaque transformation).
3. **Construire** le modèle, le prototype ou la visualisation la plus simple possible.
4. **Transmettre** : code commenté, rapport court, passation orale ou atelier ciblé.

---

## Expérience & ancrage

> Monde pharmaceutique, officines, épidémiologie et santé publique constituent mon terrain principal. J’y suis habitué aux contraintes qualité, à la documentation et aux délais serrés.

### 🤝 Contact

- [Contact direct par email](mailto:edimah.synesius-songo@proton.me)
- Possibilité d’échanger en visio courte (30 min) pour cadrer votre besoin.

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

{% endtab %}

{% tab freelance-lang English %}

> I help teams that need rigorous statistical analyses, thoughtful modeling, and lightweight AI prototypes—without heavy infrastructure.

---

## Core capabilities

- **Structured statistical work**: Bayesian/hierarchical models, time series, uncertainty quantification for better decisions.
- **Calm predictive analytics**: scoring, classification, lightweight NLP; reproducible notebooks or scripts that plug into your stack.
- **Health data & visuals**: public or proprietary datasets turned into clear narratives for stakeholders.
- **Capability building**: workshops on statistical fundamentals and AI literacy tailored to non-technical teams.

| Typical need                 | What I deliver                                 | Expected outcome           |
| ---------------------------- | ---------------------------------------------- | -------------------------- |
| Understand a business signal | Transparent models + methodology brief         | Shared, actionable insight |
| Test an AI/ML use case       | End-to-end prototype (data → API/notebook)     | Faster go/no-go decision   |
| Make numbers readable        | Visualisations, dashboards, or concise reports | Ready-to-share materials   |

### Familiar fields

- Retail pharmacies and pharma industry stakeholders.
- Epidemiology and public-health initiatives.
- Regulated SMEs with strict traceability requirements.

---

## Collaboration approach

1. **Clarify** the business question, success metrics, and usage constraints.
2. **Structure** the data (quality checks, lineage, fully documented steps).
3. **Build** the minimal model / prototype / visual that answers the question.
4. **Transfer** knowledge: commented code, short report, live handover or focused workshop.

<details>
<summary>Sample engagements</summary>

- Refined an existing demand-forecast model for pharmacies with uncertainty bands.
- Exploratory study on public-health survey data to support an institutional memo.
- Lightweight NLP prototype to triage sensitive customer feedback.
- 2-hour AI literacy workshop for business teams built on real use cases.

</details>

- [x] Methodological clarity.
- [x] Technical simplicity.
- [x] Deliverables teams can use immediately.

---

## Experience & focus

> Pharmaceutical ecosystems, pharmacies, epidemiology, and public health are my core playground. I am used to quality constraints, documentation duties, and tight institutional timelines.

### 🤝 Get in touch

- [Email me directly](mailto:edimah.synesius-songo@proton.me)
- 30-minute video call available to scope your needs.

### 📊 Recent work highlights

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
        {{ item.collection | default: "Project" | capitalize }}
      </p>
    </article>
  {% endfor %}
</div>

{% endtab %}

{% endtabs %}

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
