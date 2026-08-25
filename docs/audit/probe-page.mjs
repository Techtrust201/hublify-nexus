/** Détection exécutée dans la page. */
export const PROBE = () => {
  const vw = document.documentElement.clientWidth;
  const out = {
    pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    bleed: [],
    clipped: [],
    overlaps: [],
    squeezed: [],
    smallTargets: [], // < 24px : violation WCAG 2.5.8 AA
    tightTargets: [], // 24-43px : sous la recommandation 44px, toléré en zone dense
  };

  const desc = (el) => {
    if (!el) return "?";
    const cls = (el.getAttribute("class") ?? "").split(/\s+/).slice(0, 4).join(".");
    const txt = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 34);
    const src = el.getAttribute("data-tsd-source");
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}${txt ? ` «${txt}»` : ""}${src ? ` @${src}` : ""}`;
  };

  /** Rect réellement visible : intersection avec les ancêtres qui rognent. */
  const rectVisible = (el) => {
    let r = el.getBoundingClientRect();
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const pcs = getComputedStyle(p);
      const rogne =
        pcs.overflowX !== "visible" || pcs.overflowY !== "visible" || pcs.contain.includes("paint");
      if (!rogne) continue;
      const pr = p.getBoundingClientRect();
      const left = Math.max(r.left, pr.left);
      const right = Math.min(r.right, pr.right);
      const top = Math.max(r.top, pr.top);
      const bottom = Math.min(r.bottom, pr.bottom);
      r = { left, right, top, bottom, width: right - left, height: bottom - top };
      if (r.width <= 0 || r.height <= 0) return r;
    }
    return r;
  };

  const all = Array.from(document.querySelectorAll("body *"));
  const visible = [];

  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) continue;
    const r = rectVisible(el);
    if (r.width < 1 || r.height < 1) continue;
    visible.push({ el, r, cs });

    // 1. débordement hors viewport (hors conteneurs scrollables volontaires)
    if (r.right > vw + 1 || r.left < -1) {
      let scrollAncestor = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const pcs = getComputedStyle(p);
        if (pcs.overflowX === "auto" || pcs.overflowX === "scroll") {
          scrollAncestor = true;
          break;
        }
      }
      if (!scrollAncestor && el.children.length === 0) {
        out.bleed.push({ el: desc(el), left: Math.round(r.left), right: Math.round(r.right) });
      }
    }

    // 1b. élément flex/grid écrasé sous la taille de son contenu : le contenu
    // déborde en overflow visible et se superpose aux éléments voisins.
    if (cs.overflowX === "visible" && el.clientWidth > 0) {
      const deborde = el.scrollWidth - el.clientWidth;
      const parentCs = el.parentElement ? getComputedStyle(el.parentElement) : null;
      const parentFlexGrid =
        parentCs &&
        (parentCs.display.includes("flex") || parentCs.display.includes("grid"));
      // Un enfant en position absolue (menu déroulant) déborde volontairement.
      const enfantFlottant = Array.from(el.children).some((c) => {
        const p = getComputedStyle(c).position;
        return p === "absolute" || p === "fixed";
      });
      if (deborde > 4 && parentFlexGrid && el.children.length > 0 && !enfantFlottant) {
        out.squeezed.push({
          el: desc(el),
          w: Math.round(r.width),
          content: el.scrollWidth,
        });
      }
    }

    // 2. contenu clipé sans scroll possible
    const clipX = el.scrollWidth - el.clientWidth;
    if (
      clipX > 2 &&
      (cs.overflowX === "hidden" || cs.overflowX === "clip") &&
      el.clientWidth > 0 &&
      cs.textOverflow !== "ellipsis" && // troncature volontaire
      // Un champ de saisie fait défiler sa valeur : ce n'est pas du contenu perdu.
      !el.matches("input, textarea, select, .sr-only, [class*='sr-only']")
    ) {
      out.clipped.push({ el: desc(el), hidden: clipX });
    }

    // 4. cibles tactiles — on mesure la zone réellement cliquable :
    // un <label> englobant agrandit la cible d'une case à cocher.
    if (
      vw < 768 &&
      el.matches("button, a[href], input:not([type=hidden]), select, textarea, [role=button]") &&
      // le lien d'évitement est masqué jusqu'au focus clavier : jamais une cible tactile
      !el.matches(".sr-only, [class*='sr-only']")
    ) {
      const wrap = el.closest("label");
      const hit = wrap && wrap.querySelectorAll("input, button, a[href]").length === 1 ? wrap : el;
      const hr = hit.getBoundingClientRect();
      if (hr.height > 0 && hr.width > 0 && hr.height < 44) {
        const t = { el: desc(el), w: Math.round(hr.width), h: Math.round(hr.height) };
        if (hr.height < 24 || hr.width < 24) out.smallTargets.push(t);
        else out.tightTargets.push(t);
      }
    }
  }

  // 3. superpositions entre éléments « feuilles » non apparentés
  const leaves = visible.filter(({ el, cs }) => {
    if (!el.matches("button, a[href], input, select, textarea, [role=button], p, span, h1, h2, h3, h4, label, td, th, li"))
      return false;
    // uniquement les feuilles de texte / contrôles
    if (el.querySelector("button, a[href], input, p, h1, h2, h3, td, li")) return false;
    const t = (el.textContent ?? "").trim();
    if (!t && !el.matches("input, select, textarea, button, a[href]")) return false;
    if (cs.position === "fixed") return false;
    return true;
  });

  const related = (a, b) => a.contains(b) || b.contains(a);
  const positioned = (el) => {
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.position === "absolute" || cs.position === "fixed" || cs.position === "sticky") return true;
    }
    return false;
  };

  for (let i = 0; i < leaves.length; i++) {
    for (let j = i + 1; j < leaves.length; j++) {
      const A = leaves[i];
      const B = leaves[j];
      if (related(A.el, B.el)) continue;
      const ox = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left);
      const oy = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
      if (ox <= 2 || oy <= 2) continue;
      // ignore les recouvrements volontaires (badge sur icône, overlay positionné)
      if (positioned(A.el) || positioned(B.el)) continue;
      const area = ox * oy;
      const minArea = Math.min(A.r.width * A.r.height, B.r.width * B.r.height);
      if (area / minArea < 0.25) continue;
      out.overlaps.push({
        a: desc(A.el),
        b: desc(B.el),
        overlap: `${Math.round(ox)}x${Math.round(oy)}`,
      });
    }
  }

  return out;
};
