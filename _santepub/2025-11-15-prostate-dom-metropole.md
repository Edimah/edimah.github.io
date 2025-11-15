---
layout: post
title: "Incidence du cancer de la prostate en France d'Outre Mer et Métropolitaine"
excerpt: "Visualiser l'écart d'incidence entre les départements d'outre-mer et l'Hexagone en 2022."
image: /assets/img/santepub/prostate_thumbnail.png
date: 2025-11-15
---

À partir des données fiables disponibles dans GLOBOCAN/IARC[^1], j’ai comparé les taux d’incidence standardisés du **cancer de la prostate** en France métropolitaine et dans plusieurs territoires d’Outre-mer.

Les écarts sont importants : la Guadeloupe et la Martinique présentent des valeurs nettement supérieures à la moyenne métropolitaine, et aux autres territoires étudiés.

Dans le cadre de Novembre Bleu 🔷, ce billet cherche à fournir un point d’appui chiffré pour la **sensibilisation** et à ouvrir la discussion sur les facteurs possibles — génétiques, environnementaux et socio-économiques.

## Données & Méthode

**Données** : relevés d'incidence du cancer de la prostate (GLOBOCAN 2022)[^1].  
**Indicateur** : taux d’incidence standardisés monde (_TSM_ / _ASR_) pour 100 000 habitants.

> **Important** : la base mondiale a été filtrée pour isoler les territoires français. Les méthodologies variant d’un territoire à l’autre, les comparaisons doivent rester prudentes.

\*Territoires inclus :

- France métropolitaine
- Guadeloupe
- Martinique
- Guyane
- La Réunion
- Polynésie française\*

Les données ont été traitées sous R (tidyverse, ggplot2) à partir des valeurs relevées.

Le code complet et le dataset utilisé sont disponibles dans mon dépôt GitHub [public-health](https://github.com/Edimah/public-health).

## Résultat

Les incidences observées en **Martinique** et **Guadeloupe** sont environ **2 fois plus élevées** que celles estimées pour la métropole.

Cela rejoint les constats établis par Santé Publique France dans le Bulletin Epidemiologique Hebdomadaire (BEH) publié le 15 novembre 2016 : [_Le cancer de la prostate aux Antilles françaises : état des lieux_](https://beh.santepubliquefrance.fr/beh/2016/39-40/2016_39-40_6.html?utm_source=chatgpt.com)[^2].

<div class="row justify-content-center my-4">
  <div class="col-lg-10">
    <figure class="figure">
      <img class="figure-img img-fluid rounded shadow-sm" src="/assets/img/santepub/prostate_dom_metropole.png" alt="Incidence du cancer de la prostate – DOM et métropole">
      <figcaption class="figure-caption text-center">
        Incidence standardisée (TSM) – DOM vs métropole, source GLOBOCAN 2022[^1] (script R <code>prostate_continental_FR_overseas.R</code>).
      </figcaption>
    </figure>
  </div>
</div>

## Discussion : comment comprendre ces écarts ?

Les écarts d’incidence observés sont documentés dans plusieurs rapports et publications scientifiques. Aucun facteur ne suffit à lui seul ; il s’agit a priori d’un phénomène multifactoriel qui inclut

### 1. Des facteurs génétiques

Les hommes d’ascendance africaine présentent un risque plus élevé de développer un cancer de la prostate.
Les populations antillaises sont donc plus exposées à ce facteur[^3].

### 2. Exposition environnementale : le chlordécone

Un certain nombre d'études menées aux Antilles montrent une association entre l’exposition au chlordécone et un risque accru de cancer de la prostate — sans établir une causalité directe. Il serait pourtant malhonnête de ne pas le mentionner.
Sources : INSERM (2019) et synthèse du Sénat (2019)[^4][^5].

### 3. Modes de vie et facteurs socio-économiques

De nombreuses raisons sont évoquées dans la littérature :

- taux élevés de surpoids et obésité,
- accès inégal au dépistage,
- retards et interruptions dans les parcours de soins,  
  Et ce parmi d'autres déterminants sociaux défavorables dans ces territoires[^6][^7]

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
[^2]: Bousquet P.J. et al. “Le cancer de la prostate aux Antilles françaises : état des lieux.” _Bulletin Épidémiologique Hebdomadaire_ (BEH), 15 novembre 2016. https://beh.santepubliquefrance.fr/beh/2016/39-40/2016_39-40_6.html.
[^3]: Benafif S., Eeles R. “Genetic predisposition to prostate cancer.” _Nature Reviews Urology_, 2018. https://www.nature.com/articles/nrurol.2018.22.
[^4]: INSERM. _Exposition aux pesticides et au chlordécone_. Rapport 2019. https://www.inserm.fr/wp-content/uploads/2019-06/inserm-rapportexpositionauxpesticidesetauchlordecone-2019.pdf.
[^5]: Sénat. “Chlordécone et cancer de la prostate.” Question écrite n°0587S, 2019. https://www.senat.fr/questions/base/2019/qSEQ19010587S.html.
[^6]: HCSP. _Inégalités sociales et cancer aux Antilles_. Rapport 2022. https://www.hcsp.fr/Explore.cgi/Telecharger?NomFichier=ad913637.pdf.
[^7]: Le Quotidien du Médecin. “Guadeloupe, Martinique, La Réunion : constat amer pour les premières études de survie du cancer.” 2023. https://www.lequotidiendumedecin.fr/actu-medicale/guadeloupe-martinique-la-reunion-constat-amer-pour-les-premieres-etudes-de-survie-du-cancer.
