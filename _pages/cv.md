---
layout: page
permalink: /cv/
title: CV
nav: true
nav_order: 3
---

{% assign cv_pdf = '/assets/pdf/edimah-synesius-songo-cv.pdf' | relative_url %}

<p><a href="{{ cv_pdf }}" download>Download the PDF</a></p>

<object class="cv-pdf" data="{{ cv_pdf }}" type="application/pdf">
  <p>This browser cannot show the PDF here. <a href="{{ cv_pdf }}">Open the CV</a>.</p>
</object>
