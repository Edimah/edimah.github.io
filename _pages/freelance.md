---
layout: page
title: freelance
nav: true
nav_order: 5
permalink: /freelance/
tabs: true
---

<div class="text-center mb-4">
  <strong>Freelance / Consulting</strong>
</div>

{% tabs freelance-lang %}

{% tab freelance-lang Français %}

> J’accompagne les équipes dans la conception et la validation de cadres statistiques pour les outils de décision assistés par IA en environnements régulés.

---

## Compétences

- **Analyses statistiques** : modèles bayésiens ou hiérarchiques, séries temporelles, estimation d’incertitudes pour appuyer la décision.
- **Analyses prédictives** : scoring, classification, NLP léger ; livrables reproductibles en notebooks ou scripts prêts à intégrer.
- **Analyse de données & visualisations** : exploitation de bases publiques ou privées, mise en forme claire pour les décideurs.
- **Cadres d’évaluation** : conception de cadres d’évaluation statistique pour les systèmes d’IA dans les environnements régulés (santé, finance, assurance).

---

## Approche

1. **Clarifier** la question métier, les métriques utiles et les contraintes d’usage.
2. **Structurer** les données (qualité, lignage, documentation de chaque transformation).
3. **Construire** le modèle, le prototype ou la visualisation la plus simple possible.
4. **Transmettre** : code commenté, rapport court, passation orale ou atelier ciblé.

---

## Expérience & ancrage

> J’interviens là où l’erreur a des conséquences : santé publique, énergie, finance, assurance. Terrain actuel : la donnée de santé réglementée, avec la refonte de bout en bout de la chaîne de données d’un organisme public de dépistage des cancers ; auparavant, calibration bayésienne de modèles physiques (EDF) et analyse de sensibilité en grande dimension (IFP Energies nouvelles). Contraintes qualité, documentation et délais institutionnels serrés font partie du cadre habituel.

### 🤝 [Contact direct par email](mailto:edimah.synesius-songo@proton.me)

**Études de cas disponibles sur demande.** Focus actuel : méthodologie d’audit statistique pour les chaînes de données en santé publique.

{% endtab %}

{% tab freelance-lang English %}

> I help teams design and validate statistical frameworks for AI-assisted decision tools in regulated environments.

---

## Skills

- **Statistical work**: Bayesian/hierarchical models, time series, uncertainty quantification for better decisions.
- **Predictions**: scoring, classification, lightweight NLP; reproducible notebooks or scripts that plug into your stack.
- **Data Analytics & Visualisation**: public or proprietary datasets turned into clear narratives for stakeholders.
- **Evaluation frameworks**: statistical conformity and reliability assessment for AI systems in regulated environments (health, finance, insurance).

---

## Collaboration approach

1. **Clarify** the business question, success metrics, and usage constraints.
2. **Structure** the data (quality checks, lineage, fully documented steps).
3. **Build** the minimal model / prototype / visual that answers the question.
4. **Transfer** knowledge: commented code, short report, live handover or focused workshop.

---

## Experience & focus

> I work where failure has consequences: public health, energy, finance, insurance. Current ground: regulated health data — an end-to-end data chain rebuild for a public cancer-screening organisation — with prior research work in Bayesian calibration of physics models (EDF) and high-dimensional sensitivity analysis (IFP Energies nouvelles). Quality constraints, documentation duties, and tight institutional timelines are the usual operating conditions.

### 🤝 Get in touch : [Email me directly](mailto:edimah.synesius-songo@proton.me)

**Case studies available on request.** Current focus: statistical audit methodology for regulated public health data chains.

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
