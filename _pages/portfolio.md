---
layout: page
title: portfolio
permalink: /portfolio/
nav: true
nav_order: 3
tabs: true
---

<div class="text-center mb-4">
  <strong>Sélectionnez l’univers que vous souhaitez parcourir</strong>
</div>

{% tabs portfolio-view %}

{% tab portfolio-view Statistiques et Santé Publique (en français) %}

### Statistiques & Santé Publique (FR)

<div class="row row-cols-1 row-cols-md-2 g-4">
  {% assign public_posts = site.santepub | sort: "date" | reverse %}
  {% if public_posts == empty %}
    <div class="col">
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <p class="card-text mb-0">Aucun contenu Santé publique n’est disponible pour le moment.</p>
        </div>
      </div>
    </div>
  {% else %}
    {% for post in public_posts limit: 6 %}
      {% assign summary = post.excerpt | default: post.description | default: post.content %}
      {% assign summary = summary | strip_html | truncate: 170 %}
      <div class="col">
        <div class="card h-100 shadow-sm">
          {% if post.image %}
            <img class="card-img-top" src="{{ post.image | relative_url }}" alt="{{ post.title }}">
          {% endif %}
          <div class="card-body">
            <h3 class="card-title">{{ post.title }}</h3>
            <p class="card-text">{{ summary }}</p>
            <a class="stretched-link" href="{{ post.url | relative_url }}">Lire l’analyse</a>
          </div>
        </div>
      </div>
    {% endfor %}
  {% endif %}
</div>

{% endtab %}

{% tab portfolio-view Independent research & personal projects %}

### Independent research & personal projects (EN)

<div class="row row-cols-1 row-cols-md-2 g-4">
  {% assign indie_projects = site.projects | where_exp: "project", "project.draft != true" | sort: "importance" | reverse %}
  {% if indie_projects == empty %}
    <div class="col">
      <div class="card h-100 shadow-sm">
        <div class="card-body">
          <p class="card-text mb-0">No independent projects are published yet.</p>
        </div>
      </div>
    </div>
  {% else %}
    {% for project in indie_projects limit: 6 %}
      {% assign summary = project.excerpt | default: project.description | default: project.content %}
      {% assign summary = summary | strip_html | truncate: 170 %}
      <div class="col">
        <div class="card h-100 shadow-sm">
          {% if project.img %}
            <img class="card-img-top" src="{{ project.img | relative_url }}" alt="{{ project.title }}">
          {% endif %}
          <div class="card-body">
            <h3 class="card-title text-capitalize">{{ project.title }}</h3>
            <p class="card-text">{{ summary }}</p>
            <a class="stretched-link" href="{{ project.url | relative_url }}">View project</a>
          </div>
        </div>
      </div>
    {% endfor %}
  {% endif %}
</div>

{% endtab %}

{% endtabs %}
