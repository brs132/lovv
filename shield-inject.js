// Shield - Código injetado diretamente na página via chrome.scripting.executeScript
// Este arquivo NÃO deve ser ofuscado para funcionar corretamente
(function() {
  var actionAttr = document.documentElement.getAttribute('data-shield-action');
  if (!actionAttr) return;
  document.documentElement.removeAttribute('data-shield-action');
  var enable = actionAttr === 'enable';

  console.log('[Shield Inject] Executando, enable:', enable);

  // Seletores agressivos
  const allSelectors = [
    '.tiptap.ProseMirror',
    '.tiptap[contenteditable="true"]',
    '.ProseMirror[contenteditable="true"]',
    'div.ProseMirror',
    '.tiptap',
    '#chat-input',
    'form#chat-input',
    'div[contenteditable="true"]',
    '[role="textbox"]',
    'textarea',
    '[data-placeholder]',
  ];

  // Handler global nomeado (persiste entre execuções)
  if (!window.__shieldStopEvent) {
    window.__shieldStopEvent = function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    };
  }
  const stopEvent = window.__shieldStopEvent;

  if (enable) {
    // Limpar overlays antigos
    const oldOverlay = document.getElementById('leigos-shield-input');
    if (oldOverlay) oldOverlay.remove();
    const existingOverlay = document.getElementById('leigos-shield-overlay');
    if (existingOverlay) existingOverlay.remove();

    // Injetar CSS de animação
    if (!document.getElementById('leigos-shield-css')) {
      const style = document.createElement('style');
      style.id = 'leigos-shield-css';
      style.textContent = '\
        @keyframes shieldPulse {\
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); border-color: #dc2626; }\
          50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); border-color: #ef4444; }\
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: #dc2626; }\
        }\
      ';
      document.head.appendChild(style);
    }

    // Encontrar e bloquear
    var found = 0;
    for (var i = 0; i < allSelectors.length; i++) {
      var selector = allSelectors[i];
      try {
        var elements = document.querySelectorAll(selector);
        for (var j = 0; j < elements.length; j++) {
          var el = elements[j];
          if (el.getAttribute('data-shield-active') === 'true') continue;

          el.style.setProperty('pointer-events', 'none', 'important');
          el.style.setProperty('opacity', '0.5', 'important');
          el.style.setProperty('filter', 'grayscale(50%)', 'important');
          el.style.setProperty('border', '3px solid #dc2626', 'important');
          el.style.setProperty('border-radius', '12px', 'important');
          el.style.setProperty('background-color', 'rgba(220, 38, 38, 0.15)', 'important');
          el.style.setProperty('cursor', 'not-allowed', 'important');
          el.style.setProperty('animation', 'shieldPulse 1.5s ease-in-out infinite', 'important');
          el.setAttribute('data-shield-active', 'true');
          // Salvar valor original antes de sobrescrever
          if (el.hasAttribute('contenteditable')) {
            el.setAttribute('data-shield-original-ce', el.getAttribute('contenteditable'));
          }
          el.setAttribute('contenteditable', 'false');
          el.setAttribute('disabled', 'true');

          var events = ['keydown', 'keypress', 'keyup', 'input', 'beforeinput', 'paste', 'cut', 'mousedown', 'mouseup', 'click', 'focus', 'focusin', 'drop'];
          for (var k = 0; k < events.length; k++) {
            el.addEventListener(events[k], stopEvent, { capture: true });
          }

          if (el.parentElement) {
            el.parentElement.style.setProperty('pointer-events', 'none', 'important');
            el.parentElement.style.setProperty('opacity', '0.6', 'important');
            el.parentElement.setAttribute('data-shield-parent', 'true');
          }

          found++;
          console.log('[Shield Inject] Bloqueado:', el.tagName, el.className);
        }
      } catch(e) {}
    }

    // Bloquear form
    var formEl = document.querySelector('form#chat-input') || document.querySelector('form:has([contenteditable])');
    if (formEl && formEl.getAttribute('data-shield-form') !== 'true') {
      formEl.style.setProperty('pointer-events', 'none', 'important');
      formEl.style.setProperty('opacity', '0.5', 'important');
      formEl.style.setProperty('filter', 'grayscale(30%)', 'important');
      formEl.style.setProperty('border', '3px solid #dc2626', 'important');
      formEl.style.setProperty('background-color', 'rgba(220, 38, 38, 0.1)', 'important');
      formEl.style.setProperty('animation', 'shieldPulse 1.5s ease-in-out infinite', 'important');
      formEl.setAttribute('data-shield-form', 'true');
      var formEvents = ['submit', 'keydown', 'keypress', 'click', 'focus', 'focusin'];
      for (var m = 0; m < formEvents.length; m++) {
        formEl.addEventListener(formEvents[m], stopEvent, { capture: true });
      }
      found++;
    }

    // Overlay responsivo (position: fixed)
    if (found > 0) {
      var firstBlocked = document.querySelector('[data-shield-active="true"]');
      if (firstBlocked) {
        var shield = document.createElement('div');
        shield.id = 'leigos-shield-overlay';
        shield.style.cssText = 'position:fixed;background:rgba(220,38,38,0.08);z-index:9999998;cursor:not-allowed;pointer-events:all;display:flex;align-items:center;justify-content:center;transition:top 0.15s ease,left 0.15s ease,width 0.15s ease,height 0.15s ease;';
        shield.innerHTML = '<span style="background:rgba(220,38,38,0.9);color:white;padding:4px 14px;border-radius:8px;font-size:12px;font-weight:700;font-family:system-ui,sans-serif;pointer-events:none;white-space:nowrap;">\u{1F512} Use a extensão Leigos Academy</span>';
        document.body.appendChild(shield);

        // Função de posicionamento responsivo
        var positionOverlay = function() {
          var target = document.querySelector('[data-shield-active="true"]');
          if (!target || !shield.parentElement) return;
          var rect = target.getBoundingClientRect();
          shield.style.top = rect.top + 'px';
          shield.style.left = rect.left + 'px';
          shield.style.width = rect.width + 'px';
          shield.style.height = rect.height + 'px';
        };
        positionOverlay();

        // Listeners para manter responsivo
        window.__shieldPositionFn = positionOverlay;
        window.addEventListener('scroll', positionOverlay, true);
        window.addEventListener('resize', positionOverlay);

        // ResizeObserver para mudanças de layout
        try {
          if (window.__shieldResizeObs) window.__shieldResizeObs.disconnect();
          window.__shieldResizeObs = new ResizeObserver(positionOverlay);
          window.__shieldResizeObs.observe(firstBlocked);
          if (firstBlocked.parentElement) window.__shieldResizeObs.observe(firstBlocked.parentElement);
        } catch(e) {}

        // Interval de segurança para recalcular posição
        window.__shieldInterval = setInterval(positionOverlay, 1000);
      }
    }

    console.log('[Shield Inject] Total bloqueados:', found);

  } else {
    // ===== DESATIVAR =====
    console.log('[Shield Inject] Desativando...');

    // Remover event listeners e estilos
    var shieldedElements = document.querySelectorAll('[data-shield-active="true"]');
    for (var n = 0; n < shieldedElements.length; n++) {
      var el = shieldedElements[n];
      var propsToRemove = ['pointer-events','opacity','filter','border','border-radius','background-color','cursor','animation'];
      for (var p = 0; p < propsToRemove.length; p++) {
        el.style.removeProperty(propsToRemove[p]);
      }
      el.removeAttribute('data-shield-active');
      el.removeAttribute('disabled');
      // Restaurar contenteditable original
      var originalCE = el.getAttribute('data-shield-original-ce');
      if (originalCE !== null) {
        el.setAttribute('contenteditable', originalCE);
        el.removeAttribute('data-shield-original-ce');
      } else {
        el.removeAttribute('contenteditable');
      }

      // Remover event listeners com a ref global
      if (window.__shieldStopEvent) {
        var removeEvents = ['keydown','keypress','keyup','input','beforeinput','paste','cut','mousedown','mouseup','click','focus','focusin','drop'];
        for (var r = 0; r < removeEvents.length; r++) {
          el.removeEventListener(removeEvents[r], window.__shieldStopEvent, { capture: true });
        }
      }
    }

    var parentElements = document.querySelectorAll('[data-shield-parent="true"]');
    for (var q = 0; q < parentElements.length; q++) {
      parentElements[q].style.removeProperty('pointer-events');
      parentElements[q].style.removeProperty('opacity');
      parentElements[q].removeAttribute('data-shield-parent');
    }

    var formElements = document.querySelectorAll('[data-shield-form="true"]');
    for (var s = 0; s < formElements.length; s++) {
      var fEl = formElements[s];
      var fProps = ['pointer-events','opacity','filter','border','background-color','animation'];
      for (var t = 0; t < fProps.length; t++) {
        fEl.style.removeProperty(fProps[t]);
      }
      fEl.removeAttribute('data-shield-form');
      if (window.__shieldStopEvent) {
        var fEvents = ['submit','keydown','keypress','click','focus','focusin'];
        for (var u = 0; u < fEvents.length; u++) {
          fEl.removeEventListener(fEvents[u], window.__shieldStopEvent, { capture: true });
        }
      }
    }

    // Remover overlay e listeners de posição
    var overlay = document.getElementById('leigos-shield-overlay');
    if (overlay) overlay.remove();
    var oldOverlay2 = document.getElementById('leigos-shield-input');
    if (oldOverlay2) oldOverlay2.remove();
    var css = document.getElementById('leigos-shield-css');
    if (css) css.remove();

    // Limpar listeners de posicionamento
    if (window.__shieldPositionFn) {
      window.removeEventListener('scroll', window.__shieldPositionFn, true);
      window.removeEventListener('resize', window.__shieldPositionFn);
      delete window.__shieldPositionFn;
    }
    if (window.__shieldResizeObs) {
      window.__shieldResizeObs.disconnect();
      delete window.__shieldResizeObs;
    }
    if (window.__shieldInterval) {
      clearInterval(window.__shieldInterval);
      delete window.__shieldInterval;
    }

    // Limpar handler global
    delete window.__shieldStopEvent;

    console.log('[Shield Inject] Desativado com sucesso');
  }
})();
