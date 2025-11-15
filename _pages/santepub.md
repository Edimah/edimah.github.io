---
layout: default
permalink: /santepub/
title: Actualités Santé & Stats
nav: true
nav_order: 5.5
---

<div class="post">
  <div class="header-bar">
    <h1>Actualités Santé & Stats</h1>
    <h2>Brèves analyses sur la santé publique et les statistiques, avec un visuel clé et des sources citées.</h2>
  </div>

{% assign billets = site.santepub | sort: 'date' | reverse %}

{% if billets == empty %}

<p>Les premières analyses arrivent très bientôt.</p>
{% else %}
<ul class="post-list">
{% for billet in billets %}
<li>
<div class="row">
{% if billet.image %}
<div class="col-sm-3">
<a href="{{ billet.url | relative_url }}">
<img class="img-fluid rounded" src="{{ billet.image | relative_url }}" alt="{{ billet.title }}">
</a>
</div>
<div class="col-sm-9">
{% else %}
<div class="col-sm-12">
{% endif %}
<h3>
<a class="post-title" href="{{ billet.url | relative_url }}">{{ billet.title }}</a>
</h3>
<p class="post-meta">
{{ billet.date | date: '%d %B %Y' }}
</p>
{% if billet.excerpt %}
<p>{{ billet.excerpt }}</p>
{% else %}
<p>{{ billet.content | strip_html | truncate: 160 }}</p>
{% endif %}
</div>
</div>
</li>
{% endfor %}
</ul>
{% endif %}

</div>
