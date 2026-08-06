---
layout: post
title: "Incidence du cancer de la prostate en France d'Outre Mer et Métropolitaine"
description: "Visualiser l'écart d'incidence entre des territoires français ultramarins et l'Hexagone en 2022."
date: 2025-11-15 09:00:00
lang: fr
tags: sante-publique dataviz depistage
categories: posts
---

## Résumé 🧵

À partir des données fiables disponibles auprès de l'Observatoire Mondial du Cancer de l'OMS, (GLOBACAN/IARC)[^1], j’ai comparé les taux d’incidence standardisés du **cancer de la prostate** en France métropolitaine et dans plusieurs territoires d’Outre-mer.

Les écarts sont importants : la Guadeloupe et la Martinique présentent des valeurs nettement supérieures à la moyenne métropolitaine, et aux autres territoires étudiés.

Dans le cadre de Novembre Bleu 🔷, ce billet cherche à fournir un point d’appui chiffré pour la **sensibilisation** et à ouvrir la discussion sur les facteurs possibles — génétiques, environnementaux et socio-économiques.

## Données & Méthode

**Données** : relevés d'incidence du cancer de la prostate (GLOBOCAN 2022)[^1] par pays.  
**Indicateur** : taux d’incidence standardisés monde (_TSM_ / _ASR_ en français) pour 100 000 habitants.

### Traitement des données

Les données ont été traitées sous R (`tidyverse`, `ggplot2`) : la base mondiale a été filtrée sur R pour isoler les territoires français.

⚠️ Les méthodologies variant d’un territoire à l’autre, les comparaisons doivent rester prudentes. [^2]

La base résultante inclut les territoires suivants, sur lesquels nous avons basé notre étude :

- France métropolitaine
- Guadeloupe
- Martinique
- Guyane
- La Réunion
- Polynésie française

Le code complet et le dataset utilisés sont disponibles dans mon dépôt GitHub [public-health](https://github.com/Edimah/public-health).

L'aborescence des fichiers concernés est la suivante :

```
📂 public-health/
├── cancers/
│   └── prostate_continental_FR_overseas.R
├── data/
│   ├── dataset-inc-males-in-2022-prostate.csv
│   ├── french_prostate_incidence_2022.csv
│   └── french_prostate_incidence_2022.rds
└── exports/
  ├── prostate_asr_table_en.csv
  ├── prostate_asr_table_en.md
  ├── prostate_incidence_france_overseas_en.png
  ├── prostate_incidence_france_overseas_fr.png
  ├── prostate_tsm_table_fr.csv
  └── prostate_tsm_table_fr.md
```

Le script R `prostate_continental_FR_overseas.R` :

1. lit le CSV brut (`dataset-inc-males-in-2022-prostate.csv`) dans `data/`,
2. crée les jeux filtrés (CSV/RDS) dans le ficher `data/`,
3. puis alimente les visuels et tableaux qui sont déposés dans `exports/`.

## Résultats

Les résultats de ce traitement sont résumés dans le tableau suivant :

| Région                | TSM (monde) |
| :-------------------- | ----------: |
| Guadeloupe            |       157.5 |
| Martinique            |       134.3 |
| Guyane française      |        94.1 |
| France métropolitaine |        82.3 |
| Polynésie française   |        62.3 |
| La Réunion            |        59.6 |

> On observe que les incidences observées en **Martinique** et **Guadeloupe** sont environ **2 fois plus élevées** que celles de la Métropole, et presque 3 fois plus élevées que celles de La Réunion.

Cela rejoint les constats établis par Santé Publique France dans le Bulletin Epidemiologique Hebdomadaire (BEH) publié le 15 novembre 2016 : [_Le cancer de la prostate aux Antilles françaises : état des lieux_](https://beh.santepubliquefrance.fr/beh/2016/39-40/2016_39-40_6.html?utm_source=chatgpt.com)[^3].

Le tableau peut être résumé sous forme d'histogramme. Ci-dessous nos comparons ainsi l'incidence du cancer de la prostate dans les cinq territoire d'Outre-Mer étudiés (en bleu) avec celle de la Métropole (en gris).

<figure>
  <img src="/assets/img/santepub/prostate_dom_metropole.png" alt="Incidence du cancer de la prostate – DOM et métropole" loading="lazy">
  <figcaption>
    Incidence standardisée (TSM) – DOM vs métropole, source GLOBOCAN 2022 (script R <code>prostate_continental_FR_overseas.R</code>).
  </figcaption>
</figure>

## Discussion : comment comprendre ces écarts ?

Les écarts d’incidence observés sont documentés dans plusieurs rapports et publications scientifiques. Aucun facteur ne suffit à lui seul ; il s’agit a priori d’un phénomène multifactoriel qui inclut

### 1. Des facteurs génétiques

Les hommes d’ascendance africaine présentent un risque plus élevé de développer un cancer de la prostate.
Les populations antillaises sont donc plus exposées à ce facteur[^4].

### 2. Exposition environnementale : le chlordécone

Un certain nombre d'études menées aux Antilles montrent une association entre l’exposition au chlordécone et un risque accru de cancer de la prostate — sans établir une causalité directe. Il serait pourtant malhonnête de ne pas le mentionner.
Sources : INSERM (2019) et synthèse du Sénat (2019)[^5][^6].

### 3. Modes de vie et facteurs socio-économiques

De nombreuses raisons sont évoquées dans la littérature :

- taux élevés de surpoids et obésité,
- accès inégal au dépistage,
- retards et interruptions dans les parcours de soins,  
  Et ce parmi d'autres déterminants sociaux défavorables dans ces territoires[^7][^8]

### 4. Organisation des soins et dépistage

Plusieurs analyses (SPF, HCSP) soulignent :

- un recours variable au dépistage selon les territoires
- des inégalités d’accès aux spécialistes
- une surveillance moins systématique des groupes à risque
  Ces éléments contribuent à des diagnostics parfois plus tardifs.

## Prévention : faisons compter les données

Ces résultats doivent servir de support aux actions locales : la sensibilisation reste le premier rempart à l'évolution de cette maladie.

L’incidence élevée dans ces territoires n’est pas une fatalité : il existe des mesures de prévention et de détection précoce. Et de plus en plus d'initiatives locales pronent l'accès à l'information et aux soins adéquats.

Les actions menées par les associations et les acteurs du monde de la santé se multiplient. Les chiffres justifient cette tendance.

_Image de couverture générée avec DALL-E._

## Références

[^1]: IARC / WHO. _GLOBOCAN 2022: Prostate cancer incidence by country_. Disponible via https://gco.iarc.fr/today/, téléchargement des tables CSV correspondant aux taux d'incidence du cancer de la prostate et filtré par pays ("Countries") (consulté en 2025) avant traitement de données externe.
[^2]: IARC / WHO. _GLOBOCAN 2022: Data & methods by country_. Disponible via https://gco.iarc.who.int/today/en/data-sources-methods-by-country-detailed?tab=5 (consulté en 2025)
[^3]: Bousquet P.J. et al. “Le cancer de la prostate aux Antilles françaises : état des lieux.” _Bulletin Épidémiologique Hebdomadaire_ (BEH), 15 novembre 2016. https://beh.santepubliquefrance.fr/beh/2016/39-40/2016_39-40_6.html.
[^4]: Benafif S., Eeles R. “Genetic predisposition to prostate cancer.” _Nature Reviews Urology_, 2018. https://www.nature.com/articles/nrurol.2018.22.
[^5]: INSERM. _Exposition aux pesticides et au chlordécone_. Rapport 2019. https://www.inserm.fr/wp-content/uploads/2019-06/inserm-rapportexpositionauxpesticidesetauchlordecone-2019.pdf.
[^6]: Sénat. “Chlordécone et cancer de la prostate.” Question écrite n°0587S, 2019. https://www.senat.fr/questions/base/2019/qSEQ19010587S.html.
[^7]: HCSP. _Inégalités sociales et cancer aux Antilles_. Rapport 2022. https://www.hcsp.fr/Explore.cgi/Telecharger?NomFichier=ad913637.pdf.
[^8]: Le Quotidien du Médecin. “Guadeloupe, Martinique, La Réunion : constat amer pour les premières études de survie du cancer.” 2023. https://www.lequotidiendumedecin.fr/actu-medicale/guadeloupe-martinique-la-reunion-constat-amer-pour-les-premieres-etudes-de-survie-du-cancer.
