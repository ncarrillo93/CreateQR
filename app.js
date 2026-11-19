(function (root) {
  'use strict';

  // Enable UTF-8 encoding in qrcode-generator when available
  if (typeof qrcode !== 'undefined' && qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) {
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  }

  // shortcut: uses automatic QR version selection (1-40) with UTF-8 byte mode, sufficient for standard URLs up to ~2KB
  var DEFAULT_URL = 'https://github.com/ncarrillo93/CreateQR';
  var QUIET_ZONE = 4;

  var STYLE_PRESETS = {
    classic: {
      id: 'classic',
      name: 'Clásico',
      desc: 'Cuadrado nítido tradicional',
      moduleShape: 'square',
      eyeShape: 'square',
      fg1: '#111827',
      fg2: '#111827',
      useGradient: false,
      bg: '#ffffff'
    },
    rounded: {
      id: 'rounded',
      name: 'Moderno',
      desc: 'Bordes suaves y degradado índigo',
      moduleShape: 'rounded',
      eyeShape: 'rounded',
      fg1: '#1e1b4b',
      fg2: '#4f46e5',
      useGradient: true,
      bg: '#f8fafc'
    },
    dots: {
      id: 'dots',
      name: 'Puntos',
      desc: 'Círculos minimalistas en azul',
      moduleShape: 'dots',
      eyeShape: 'circle',
      fg1: '#0f172a',
      fg2: '#0284c7',
      useGradient: true,
      bg: '#ffffff'
    },
    neon: {
      id: 'neon',
      name: 'Cyber Neón',
      desc: 'Fondo oscuro con brillo cian-violeta',
      moduleShape: 'dots',
      eyeShape: 'circle',
      fg1: '#a855f7',
      fg2: '#06b6d4',
      useGradient: true,
      bg: '#090d16'
    },
    classy: {
      id: 'classy',
      name: 'Elegante',
      desc: 'Trazos orgánicos cálidos en ámbar',
      moduleShape: 'classy',
      eyeShape: 'rounded',
      fg1: '#1c1917',
      fg2: '#b45309',
      useGradient: true,
      bg: '#fffbeb'
    },
    diamond: {
      id: 'diamond',
      name: 'Diamante',
      desc: 'Rombos geométricos esmeralda',
      moduleShape: 'diamond',
      eyeShape: 'square',
      fg1: '#064e3b',
      fg2: '#10b981',
      useGradient: true,
      bg: '#ecfdf5'
    }
  };

  function sanitizeHex(color, fallback) {
    return /^#[0-9a-fA-F]{3,8}$/.test(String(color || '').trim()) ? String(color).trim() : fallback;
  }

  function fmt(n) {
    return Number(n.toFixed(3));
  }

  function createQrMatrix(text, ecLevel) {
    if (typeof qrcode !== 'function') {
      throw new Error('La librería qrcode no está cargada.');
    }
    var level = ['L', 'M', 'Q', 'H'].indexOf(ecLevel) !== -1 ? ecLevel : 'M';
    var content = String(text || '').trim() || DEFAULT_URL;
    var qr = qrcode(0, level);
    qr.addData(content);
    qr.make();

    var size = qr.getModuleCount();
    return {
      size: size,
      ecLevel: level,
      isDark: function (r, c) {
        return qr.isDark(r, c);
      },
      isFinderRegion: function (r, c) {
        return (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
      },
      origins: [
        [0, 0],
        [0, size - 7],
        [size - 7, 0]
      ]
    };
  }

  function renderFinderEye(ox, oy, eyeShape, fill) {
    var px = ox + QUIET_ZONE;
    var py = oy + QUIET_ZONE;
    if (eyeShape === 'circle') {
      var cx = fmt(px + 3.5);
      var cy = fmt(py + 3.5);
      return (
        '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="none" stroke="' + fill + '" stroke-width="1"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="1.5" fill="' + fill + '"/>'
      );
    }
    var outerRx = eyeShape === 'rounded' ? ' rx="1.6"' : '';
    var innerRx = eyeShape === 'rounded' ? ' rx="0.85"' : '';
    return (
      '<rect x="' + fmt(px + 0.5) + '" y="' + fmt(py + 0.5) + '" width="6" height="6"' + outerRx +
      ' fill="none" stroke="' + fill + '" stroke-width="1"/>' +
      '<rect x="' + fmt(px + 2) + '" y="' + fmt(py + 2) + '" width="3" height="3"' + innerRx +
      ' fill="' + fill + '"/>'
    );
  }

  function modulePathSegment(x, y, shape) {
    if (shape === 'square') {
      return 'M' + x + ' ' + y + 'h1v1h-1Z';
    }
    if (shape === 'diamond') {
      return (
        'M' + fmt(x + 0.5) + ' ' + fmt(y + 0.04) +
        'L' + fmt(x + 0.96) + ' ' + fmt(y + 0.5) +
        'L' + fmt(x + 0.5) + ' ' + fmt(y + 0.96) +
        'L' + fmt(x + 0.04) + ' ' + fmt(y + 0.5) + 'Z'
      );
    }
    if (shape === 'classy') {
      var x0 = fmt(x + 0.04);
      var y0 = fmt(y + 0.04);
      var x1 = fmt(x + 0.96);
      var y1 = fmt(y + 0.96);
      var r = 0.36;
      return (
        'M' + x0 + ' ' + fmt(y0 + r) +
        'Q' + x0 + ' ' + y0 + ' ' + fmt(x0 + r) + ' ' + y0 +
        'L' + x1 + ' ' + y0 +
        'L' + x1 + ' ' + fmt(y1 - r) +
        'Q' + x1 + ' ' + y1 + ' ' + fmt(x1 - r) + ' ' + y1 +
        'L' + x0 + ' ' + y1 + 'Z'
      );
    }
    return '';
  }

  function renderQrSvg(text, options) {
    var opts = Object.assign({}, STYLE_PRESETS.classic, options || {});
    var matrix = createQrMatrix(text, opts.ecLevel || 'M');
    var size = matrix.size;
    var total = size + QUIET_ZONE * 2;
    var fg1 = sanitizeHex(opts.fg1, '#111827');
    var fg2 = sanitizeHex(opts.fg2, fg1);
    var bg = sanitizeHex(opts.bg, '#ffffff');
    var useGrad = Boolean(opts.useGradient) && fg1.toLowerCase() !== fg2.toLowerCase();
    var fill = useGrad ? 'url(#qr-grad)' : fg1;

    var defs = useGrad
      ? '<defs><linearGradient id="qr-grad" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="' + fg1 + '"/>' +
        '<stop offset="100%" stop-color="' + fg2 + '"/>' +
        '</linearGradient></defs>'
      : '';

    var eyes = matrix.origins.map(function (pos) {
      return renderFinderEye(pos[1], pos[0], opts.eyeShape, fill);
    }).join('');

    var shapes = [];
    var pathData = [];
    var moduleShape = opts.moduleShape || 'square';

    for (var r = 0; r < size; r += 1) {
      for (var c = 0; c < size; c += 1) {
        if (matrix.isFinderRegion(r, c) || !matrix.isDark(r, c)) {
          continue;
        }
        var x = c + QUIET_ZONE;
        var y = r + QUIET_ZONE;
        if (moduleShape === 'dots') {
          shapes.push('<circle cx="' + fmt(x + 0.5) + '" cy="' + fmt(y + 0.5) + '" r="0.44"/>');
        } else if (moduleShape === 'rounded') {
          shapes.push('<rect x="' + fmt(x + 0.06) + '" y="' + fmt(y + 0.06) + '" width="0.88" height="0.88" rx="0.26"/>');
        } else {
          pathData.push(modulePathSegment(x, y, moduleShape));
        }
      }
    }

    var modulesMarkup = pathData.length > 0
      ? '<path d="' + pathData.join('') + '" fill="' + fill + '"/>'
      : '<g fill="' + fill + '">' + shapes.join('') + '</g>';

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" role="img" aria-label="Código QR generado">' +
      defs +
      '<rect width="' + total + '" height="' + total + '" fill="' + bg + '"/>' +
      eyes +
      modulesMarkup +
      '</svg>';

    return {
      svg: svg,
      size: size,
      total: total,
      ecLevel: matrix.ecLevel
    };
  }

  function runQrSelfTests() {
    function assert(cond, msg) {
      if (!cond) {
        throw new Error('Self-test falló: ' + msg);
      }
    }

    // 1. Matrix dimensions and finder region bounds across EC levels
    ['L', 'M', 'Q', 'H'].forEach(function (lvl) {
      var m = createQrMatrix('https://ejemplo.com/ruta?a=1&b=2', lvl);
      assert(m.size >= 21 && (m.size - 17) % 4 === 0, 'Tamaño de matriz válido para nivel ' + lvl);
      var finderCount = 0;
      for (var r = 0; r < m.size; r += 1) {
        for (var c = 0; c < m.size; c += 1) {
          if (m.isFinderRegion(r, c)) finderCount += 1;
        }
      }
      assert(finderCount === 147, 'Exactamente 147 módulos reservados a los 3 finders (' + finderCount + ')');
    });

    // 2. All 6 style presets produce valid SVG markup with expected shapes
    Object.keys(STYLE_PRESETS).forEach(function (key) {
      var preset = STYLE_PRESETS[key];
      var res = renderQrSvg('https://github.com/ncarrillo93/CreateQR', Object.assign({ ecLevel: 'M' }, preset));
      assert(res.svg.indexOf('<svg ') === 0 && res.svg.indexOf('</svg>') !== -1, 'SVG válido para ' + key);
      if (preset.useGradient && preset.fg1 !== preset.fg2) {
        assert(res.svg.indexOf('<linearGradient') !== -1, 'Gradiente presente en ' + key);
      }
      if (preset.moduleShape === 'dots') {
        assert(res.svg.indexOf('<circle ') !== -1, 'Círculos presentes en ' + key);
      } else if (preset.moduleShape === 'rounded') {
        assert(res.svg.indexOf('rx="0.26"') !== -1, 'Módulos redondeados presentes en ' + key);
      } else {
        assert(res.svg.indexOf('<path d="') !== -1, 'Trazado SVG presente en ' + key);
      }
    });

    // 3. UTF-8 and empty fallback handling
    var fallbackRes = renderQrSvg('', STYLE_PRESETS.classic);
    assert(fallbackRes.size >= 21, 'Fallback para entrada vacía funciona');
    var utf8Res = renderQrSvg('https://ejemplo.com/café-ñandú?q=🚀', STYLE_PRESETS.neon);
    assert(utf8Res.svg.indexOf('<svg ') === 0, 'Soporte UTF-8 funciona');

    return 'PASS';
  }

  function initApp() {
    var els = {
      urlInput: document.getElementById('url-input'),
      urlHint: document.getElementById('url-hint'),
      presetGrid: document.getElementById('preset-grid'),
      moduleShape: document.getElementById('module-shape'),
      eyeShape: document.getElementById('eye-shape'),
      useGradient: document.getElementById('use-gradient'),
      fg1: document.getElementById('color-fg1'),
      fg2: document.getElementById('color-fg2'),
      fg2Wrap: document.getElementById('fg2-wrap'),
      bg: document.getElementById('color-bg'),
      ecLevel: document.getElementById('ec-level'),
      preview: document.getElementById('qr-preview'),
      meta: document.getElementById('qr-meta'),
      status: document.getElementById('qr-status'),
      btnPng: document.getElementById('btn-download-png'),
      btnSvg: document.getElementById('btn-download-svg'),
      btnCopy: document.getElementById('btn-copy-png'),
      themeToggle: document.getElementById('theme-toggle')
    };

    var THEME_STORAGE_KEY = 'createqr-theme';

    function applyTheme(theme) {
      var mode = theme === 'light' ? 'light' : 'dark';
      document.documentElement.dataset.theme = mode;
      if (els.themeToggle) {
        var isLight = mode === 'light';
        els.themeToggle.textContent = isLight ? '🌙' : '☀️';
        els.themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      }
      try {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      } catch (e) {
        // Ignore storage access errors in restricted contexts
      }
    }

    var savedTheme = 'dark';
    try {
      savedTheme = localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark';
    } catch (e) {
      savedTheme = 'dark';
    }
    applyTheme(savedTheme);

    var state = Object.assign({
      url: DEFAULT_URL,
      presetId: 'rounded',
      ecLevel: 'M'
    }, STYLE_PRESETS.rounded);

    var lastSvg = '';

    function setStatus(msg, isError) {
      els.status.textContent = msg || '';
      els.status.className = 'status-msg' + (isError ? ' is-error' : '');
    }

    function isLikelyUrl(val) {
      if (!val) return false;
      try {
        var parsed = new URL(/^https?:\/\//i.test(val) ? val : 'https://' + val);
        return parsed.hostname.indexOf('.') !== -1 || parsed.hostname === 'localhost';
      } catch (e) {
        return false;
      }
    }

    function syncControlsFromState() {
      els.moduleShape.value = state.moduleShape;
      els.eyeShape.value = state.eyeShape;
      els.useGradient.checked = Boolean(state.useGradient);
      els.fg1.value = state.fg1;
      els.fg2.value = state.fg2;
      els.fg2Wrap.classList.toggle('is-disabled', !state.useGradient);
      els.fg2.disabled = !state.useGradient;
      els.bg.value = state.bg;
      els.ecLevel.value = state.ecLevel;

      var cards = els.presetGrid.querySelectorAll('.preset-card');
      Array.prototype.forEach.call(cards, function (card) {
        var active = card.dataset.preset === state.presetId;
        card.classList.toggle('is-active', active);
        card.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    function updateQr() {
      var raw = els.urlInput.value.trim();
      var target = raw || DEFAULT_URL;

      if (!raw) {
        els.urlHint.textContent = 'Mostrando URL de ejemplo hasta que ingreses la tuya.';
      } else if (!isLikelyUrl(raw)) {
        els.urlHint.textContent = 'Texto libre detectado (consejo: incluye https:// para abrirlo directo como enlace).';
      } else {
        els.urlHint.textContent = 'URL lista para escanear desde cualquier cámara.';
      }

      try {
        var result = renderQrSvg(target, state);
        lastSvg = result.svg;
        els.preview.innerHTML = lastSvg;
        var presetLabel = state.presetId && STYLE_PRESETS[state.presetId] ? STYLE_PRESETS[state.presetId].name : 'Personalizado';
        els.meta.textContent = presetLabel + ' • ' + result.size + '×' + result.size + ' módulos • Corrección ' + result.ecLevel;
      } catch (err) {
        setStatus('No se pudo generar el QR: ' + (err && err.message ? err.message : err), true);
      }
    }

    function buildPresetGallery() {
      els.presetGrid.innerHTML = '';
      Object.keys(STYLE_PRESETS).forEach(function (key) {
        var preset = STYLE_PRESETS[key];
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'preset-card';
        btn.dataset.preset = preset.id;
        btn.setAttribute('aria-pressed', 'false');

        var grad = preset.useGradient
          ? 'linear-gradient(135deg, ' + preset.fg1 + ', ' + preset.fg2 + ')'
          : preset.fg1;

        btn.innerHTML =
          '<span class="preset-swatch" style="background:' + preset.bg + '">' +
          '<span class="preset-dot" style="background:' + grad + '"></span>' +
          '</span>' +
          '<span class="preset-info">' +
          '<strong class="preset-name">' + preset.name + '</strong>' +
          '<span class="preset-desc">' + preset.desc + '</span>' +
          '</span>';

        btn.addEventListener('click', function () {
          Object.assign(state, preset, { presetId: preset.id });
          syncControlsFromState();
          updateQr();
          setStatus('Estilo "' + preset.name + '" aplicado.');
        });
        els.presetGrid.appendChild(btn);
      });
    }

    function renderSvgToCanvas(svgMarkup, pxSize, callback) {
      var sizedSvg = svgMarkup.replace('<svg ', '<svg width="' + pxSize + '" height="' + pxSize + '" ');
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = pxSize;
        canvas.height = pxSize;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, pxSize, pxSize);
        callback(null, canvas);
      };
      img.onerror = function () {
        callback(new Error('No se pudo rasterizar el SVG en canvas.'));
      };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sizedSvg);
    }

    function triggerDownload(href, filename) {
      var link = document.createElement('a');
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Wire inputs
    els.urlInput.value = DEFAULT_URL;
    els.urlInput.addEventListener('input', function () {
      state.url = els.urlInput.value;
      updateQr();
    });

    document.querySelectorAll('[data-sample-url]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        els.urlInput.value = chip.getAttribute('data-sample-url');
        state.url = els.urlInput.value;
        updateQr();
      });
    });

    function onCustomChange() {
      state.presetId = '';
      state.moduleShape = els.moduleShape.value;
      state.eyeShape = els.eyeShape.value;
      state.useGradient = els.useGradient.checked;
      state.fg1 = els.fg1.value;
      state.fg2 = els.fg2.value;
      state.bg = els.bg.value;
      state.ecLevel = els.ecLevel.value;
      syncControlsFromState();
      updateQr();
    }

    [els.moduleShape, els.eyeShape, els.useGradient, els.fg1, els.fg2, els.bg, els.ecLevel].forEach(function (ctrl) {
      ctrl.addEventListener('input', onCustomChange);
      ctrl.addEventListener('change', onCustomChange);
    });

    els.btnSvg.addEventListener('click', function () {
      if (!lastSvg) return;
      var blob = new Blob([lastSvg], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      triggerDownload(url, 'codigo-qr.svg');
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      setStatus('SVG descargado.');
    });

    els.btnPng.addEventListener('click', function () {
      if (!lastSvg) return;
      renderSvgToCanvas(lastSvg, 1024, function (err, canvas) {
        if (err) {
          setStatus(err.message, true);
          return;
        }
        triggerDownload(canvas.toDataURL('image/png'), 'codigo-qr-1024px.png');
        setStatus('PNG (1024×1024) descargado.');
      });
    });

    els.btnCopy.addEventListener('click', function () {
      if (!lastSvg) return;
      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
        setStatus('Tu navegador no permite copiar imágenes en este contexto; usa Descargar PNG.', true);
        return;
      }
      renderSvgToCanvas(lastSvg, 1024, function (err, canvas) {
        if (err) {
          setStatus(err.message, true);
          return;
        }
        canvas.toBlob(function (blob) {
          if (!blob) {
            setStatus('Error al generar la imagen para copiar.', true);
            return;
          }
          navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            .then(function () { setStatus('Imagen PNG copiada al portapapeles.'); })
            .catch(function () { setStatus('No se pudo copiar al portapapeles (requiere HTTPS o localhost).', true); });
        }, 'image/png');
      });
    });

    if (els.themeToggle) {
      els.themeToggle.addEventListener('click', function () {
        var nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
        applyTheme(nextTheme);
      });
    }

    buildPresetGallery();
    syncControlsFromState();
    updateQr();

    try {
      var testResult = runQrSelfTests();
      document.body.dataset.selfTest = testResult;
      console.info('QR self-tests: ' + testResult);
    } catch (testErr) {
      document.body.dataset.selfTest = 'FAIL';
      setStatus(testErr.message, true);
      console.error(testErr);
    }
  }

  root.CreateQR = {
    STYLE_PRESETS: STYLE_PRESETS,
    createQrMatrix: createQrMatrix,
    renderQrSvg: renderQrSvg,
    runQrSelfTests: runQrSelfTests
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.CreateQR;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  }
}(typeof globalThis !== 'undefined' ? globalThis : this));
