/*
 * Funções — visualizador matemático educacional.
 * Arquitetura em JavaScript puro: camada de entrada, motor de cálculo e renderização gráfica.
 */
(() => {
  'use strict';

  const EPS = 1e-9;
  const ROOT_TOL = 1e-7;
  const CLIP_Y = 1e4;
  const SAMPLE_COUNT = 1100;
  const COLORS = {
    function: '#1d4ed8',
    secondary: '#dc2626',
    accent: '#0f766e',
    point: '#f97316',
    asymptote: '#64748b',
    grid: 'rgba(148, 163, 184, 0.23)',
    axis: 'rgba(15, 23, 42, 0.52)'
  };

  const els = {
    select: document.getElementById('functionType'),
    inputs: document.getElementById('dynamicInputs'),
    warnings: document.getElementById('warningBox'),
    formulaBadge: document.getElementById('formulaBadge'),
    studyCards: document.getElementById('studyCards'),
    resetZoom: document.getElementById('resetZoom'),
    restoreDefaults: document.getElementById('restoreDefaults'),
    canvas: document.getElementById('functionChart')
  };

  let chart;

  const FUNCTION_GROUPS = [
    {
      label: 'Lineares e afins',
      items: [
        {
          id: 'constant',
          name: 'Função constante',
          inputs: [numberInput('c', 'Valor constante c', 2, 'f(x) = c para todo x real.')]
        },
        {
          id: 'linear',
          name: 'Função linear',
          inputs: [numberInput('a', 'Coeficiente angular a', 1, 'Se a > 0 é crescente; se a < 0 é decrescente.')]
        },
        {
          id: 'affine',
          name: 'Função afim',
          inputs: [
            numberInput('a', 'Coeficiente angular a', 1),
            numberInput('b', 'Coeficiente linear b', 0, 'Intercepto em Y: (0, b).')
          ]
        }
      ]
    },
    {
      label: 'Polinomiais',
      items: [
        {
          id: 'quadratic',
          name: 'Função quadrática',
          inputs: [
            numberInput('a', 'Coeficiente a', 1, 'Condição: a ≠ 0.'),
            numberInput('b', 'Coeficiente b', -2),
            numberInput('c', 'Coeficiente c', -3)
          ]
        },
        {
          id: 'cubic',
          name: 'Função cúbica',
          inputs: [
            numberInput('a', 'Coeficiente a', 1, 'Condição: a ≠ 0.'),
            numberInput('b', 'Coeficiente b', 0),
            numberInput('c', 'Coeficiente c', -4),
            numberInput('d', 'Coeficiente d', 0)
          ]
        },
        {
          id: 'polynomial',
          name: 'Polinomial genérica',
          inputs: [
            textInput('coeffs', 'Coeficientes em ordem decrescente', '1, 0, -4', 'Ex.: 2, -3, 0, 1 representa 2x³ − 3x² + 1.', true)
          ]
        }
      ]
    },
    {
      label: 'Transcendentes',
      items: [
        {
          id: 'exponential',
          name: 'Função exponencial',
          inputs: [numberInput('base', 'Base a', 2, 'Condições: a > 0 e a ≠ 1.')]
        },
        {
          id: 'logarithmic',
          name: 'Função logarítmica',
          inputs: [numberInput('base', 'Base a', 2, 'Condições: a > 0 e a ≠ 1; domínio x > 0.')]
        },
        trigDefinition('sine', 'Função seno'),
        trigDefinition('cosine', 'Função cosseno'),
        trigDefinition('tangent', 'Função tangente'),
        trigDefinition('cotangent', 'Função cotangente')
      ]
    },
    {
      label: 'Especiais',
      items: [
        {
          id: 'power',
          name: 'Função potência',
          inputs: [
            numberInput('a', 'Coeficiente a', 1),
            numberInput('n', 'Expoente n', 3, 'Para expoentes não inteiros, o gráfico real é restringido a x ≥ 0.')
          ]
        },
        {
          id: 'modular',
          name: 'Função modular',
          inputs: [
            numberInput('a', 'Abertura/escala a', 1),
            numberInput('h', 'Deslocamento horizontal h', 0),
            numberInput('k', 'Deslocamento vertical k', 0, 'Forma usada: a|x − h| + k.')
          ]
        },
        {
          id: 'rational',
          name: 'Função racional',
          inputs: [
            textInput('numCoeffs', 'Coeficientes de P(x)', '1', 'Numerador P(x), em ordem decrescente.', true),
            textInput('denCoeffs', 'Coeficientes de Q(x)', '1, 0', 'Denominador Q(x); deve ser diferente do polinômio zero.', true)
          ]
        },
        {
          id: 'reciprocal',
          name: 'Função recíproca',
          inputs: [
            numberInput('kcoef', 'Numerador k', 1),
            numberInput('h', 'Assíntota vertical h', 0),
            numberInput('v', 'Assíntota horizontal v', 0, 'Forma usada: k/(x − h) + v.')
          ]
        },
        {
          id: 'sqrt',
          name: 'Função raiz quadrada',
          inputs: [
            numberInput('a', 'Escala a', 1),
            numberInput('h', 'Início do domínio h', 0),
            numberInput('k', 'Deslocamento vertical k', 0, 'Forma usada: a√(x − h) + k.')
          ]
        },
        {
          id: 'cuberoot',
          name: 'Função raiz cúbica',
          inputs: [
            numberInput('a', 'Escala a', 1),
            numberInput('h', 'Deslocamento horizontal h', 0),
            numberInput('k', 'Deslocamento vertical k', 0, 'Forma usada: a∛(x − h) + k.')
          ]
        }
      ]
    },
    {
      label: 'Conceituais',
      items: [
        {
          id: 'composite',
          name: 'Função composta',
          inputs: [
            textInput('outerExpr', 'Função externa f(u)', 'u^2 + 1', 'Use a variável u. Ex.: sqrt(u), sin(u), abs(u).', true),
            textInput('innerExpr', 'Função interna g(x)', 'x + 2', 'Use a variável x. Ex.: x^2, log(x), 2*x - 1.', true)
          ]
        },
        {
          id: 'inverse',
          name: 'Função inversa',
          inputs: [
            textInput('originalExpr', 'Função original f(x)', '2*x + 3', 'A inversa é desenhada refletindo f em relação à reta y = x.', true),
            numberInput('domainStart', 'Início do intervalo analisado', -5),
            numberInput('domainEnd', 'Fim do intervalo analisado', 5)
          ]
        }
      ]
    }
  ];

  const COMPUTERS = {
    constant: computeConstant,
    linear: computeLinear,
    affine: computeAffine,
    quadratic: computeQuadratic,
    cubic: computeCubic,
    polynomial: computePolynomial,
    power: computePower,
    exponential: computeExponential,
    logarithmic: computeLogarithmic,
    sine: () => computeTrig('sine'),
    cosine: () => computeTrig('cosine'),
    tangent: () => computeTrig('tangent'),
    cotangent: () => computeTrig('cotangent'),
    modular: computeModular,
    rational: computeRational,
    reciprocal: computeReciprocal,
    sqrt: computeSquareRoot,
    cuberoot: computeCubeRoot,
    composite: computeComposite,
    inverse: computeInverse
  };

  const TYPE_MAP = new Map(FUNCTION_GROUPS.flatMap(group => group.items.map(item => [item.id, item])));

  const criticalLabelPlugin = {
    id: 'criticalLabels',
    afterDatasetsDraw(currentChart) {
      const { ctx } = currentChart;
      currentChart.data.datasets.forEach((dataset, datasetIndex) => {
        if (!dataset.showLabels) return;
        const meta = currentChart.getDatasetMeta(datasetIndex);
        ctx.save();
        ctx.font = '700 11px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = 'rgba(255,255,255,0.88)';
        ctx.lineWidth = 4;
        meta.data.forEach((element, index) => {
          const raw = dataset.data[index];
          if (!raw || !raw.label || raw.y === null || Number.isNaN(raw.y)) return;
          const text = raw.label;
          const x = element.x + 8;
          const y = element.y - 8;
          ctx.strokeText(text, x, y);
          ctx.fillText(text, x, y);
        });
        ctx.restore();
      });
    }
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    populateSelect();
    if (window.Chart) {
      const maybeZoom = window.ChartZoom || window.zoomPlugin || window['chartjs-plugin-zoom'];
      safeChartRegister(maybeZoom);
      safeChartRegister(criticalLabelPlugin);
    }

    els.select.value = 'affine';
    buildInputsForSelectedType();
    bindEvents();
    updateApp();
  }

  function populateSelect() {
    FUNCTION_GROUPS.forEach(group => {
      const optGroup = document.createElement('optgroup');
      optGroup.label = group.label;
      group.items.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        optGroup.appendChild(option);
      });
      els.select.appendChild(optGroup);
    });
  }

  function bindEvents() {
    els.select.addEventListener('change', () => {
      buildInputsForSelectedType();
      updateApp();
    });

    els.inputs.addEventListener('input', updateApp);
    els.inputs.addEventListener('change', updateApp);

    els.resetZoom.addEventListener('click', () => {
      if (chart && typeof chart.resetZoom === 'function') chart.resetZoom();
      else if (chart) chart.reset();
    });

    els.restoreDefaults.addEventListener('click', () => {
      buildInputsForSelectedType();
      updateApp();
    });
  }

  function buildInputsForSelectedType() {
    const def = TYPE_MAP.get(els.select.value);
    els.inputs.innerHTML = '';
    def.inputs.forEach(inputDef => {
      const field = document.createElement('label');
      field.className = `field ${inputDef.wide ? 'field--wide' : ''}`;
      field.setAttribute('for', inputDef.id);

      const title = document.createElement('span');
      title.textContent = inputDef.label;
      field.appendChild(title);

      const control = inputDef.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
      control.id = inputDef.id;
      control.name = inputDef.id;
      control.value = inputDef.value;
      control.dataset.default = inputDef.value;
      if (inputDef.type !== 'textarea') control.type = inputDef.type;
      if (inputDef.type === 'number') {
        control.step = 'any';
        control.inputMode = 'decimal';
      }
      field.appendChild(control);

      if (inputDef.help) {
        const help = document.createElement('small');
        help.textContent = inputDef.help;
        field.appendChild(help);
      }
      els.inputs.appendChild(field);
    });
  }

  function updateApp() {
    const type = els.select.value;
    const computer = COMPUTERS[type] || computeAffine;
    let details;
    try {
      details = computer();
    } catch (error) {
      details = makeDetails({
        name: 'Erro de cálculo',
        formula: 'Verifique a entrada',
        warnings: [`Ocorreu um erro inesperado: ${escapeHtml(error.message)}`],
        properties: [
          prop('Orientação', 'Revise coeficientes, bases, denominadores e expressões digitadas.')
        ]
      });
      console.error(error);
    }
    renderWarnings(details.warnings || []);
    renderStudyPanel(details);
    renderChart(details);
  }

  function numberInput(id, label, value, help = '') {
    return { id, label, value: String(value), type: 'number', help };
  }

  function textInput(id, label, value, help = '', wide = false) {
    return { id, label, value, type: 'text', help, wide };
  }

  function trigDefinition(id, name) {
    return {
      id,
      name,
      inputs: [
        numberInput('A', 'Amplitude/escala A', 1),
        numberInput('B', 'Frequência angular B', 1, 'Período: 2π/|B| para seno/cosseno; π/|B| para tangente/cotangente.'),
        numberInput('C', 'Fase C', 0, 'Forma usada: A·função(Bx + C) + D.'),
        numberInput('D', 'Deslocamento vertical D', 0)
      ]
    };
  }

  function makeDetails({ name, formula, properties = [], warnings = [], points = [], fn = null, series = null, xMin = -10, xMax = 10, verticalAsymptotes = [], horizontalAsymptotes = [], obliqueAsymptotes = [], gaps = [] }) {
    return {
      name,
      formula,
      properties,
      warnings: warnings.filter(Boolean),
      points: dedupePoints(points),
      fn,
      series,
      xMin,
      xMax,
      verticalAsymptotes: uniqueSorted(verticalAsymptotes.filter(Number.isFinite)),
      horizontalAsymptotes: uniqueSorted(horizontalAsymptotes.filter(Number.isFinite)),
      obliqueAsymptotes,
      gaps: uniqueSorted(gaps.filter(Number.isFinite))
    };
  }

  function prop(label, value) {
    return { label, value };
  }

  // ----------------------------- Computadores matemáticos -----------------------------

  function computeConstant() {
    const warnings = [];
    const c = readNumber('c', warnings);
    const roots = nearlyZero(c) ? 'Todos os números reais, pois f(x) = 0.' : 'Não possui raiz real.';
    return makeDetails({
      name: 'Função constante',
      formula: `f(x) = ${fmt(c)}`,
      fn: () => c,
      points: [{ x: 0, y: c, label: `(0, ${fmt(c)})` }],
      properties: [
        prop('Nome', 'Função constante'),
        prop('Fórmula', `f(x) = ${fmt(c)}`),
        prop('Domínio', 'ℝ'),
        prop('Imagem', `{${fmt(c)}}`),
        prop('Raiz', roots),
        prop('Gráfico', 'Reta horizontal.'),
        prop('Crescimento', 'Constante em todo o domínio.')
      ],
      warnings
    });
  }

  function computeLinear() {
    const warnings = [];
    const a = readNumber('a', warnings);
    if (nearlyZero(a)) warnings.push('Como a = 0, a função linear se reduz à função constante f(x) = 0.');
    const image = nearlyZero(a) ? '{0}' : 'ℝ';
    const roots = nearlyZero(a) ? 'Todos os reais, pois f(x) = 0.' : 'x = 0';
    return makeDetails({
      name: 'Função linear',
      formula: `f(x) = ${formatCoefficientForFormula(a, 'x')}`,
      fn: x => a * x,
      points: [{ x: 0, y: 0, label: 'Origem' }],
      properties: [
        prop('Nome', 'Função linear'),
        prop('Fórmula', `f(x) = ${formatCoefficientForFormula(a, 'x')}`),
        prop('Domínio', 'ℝ'),
        prop('Imagem', image),
        prop('Raiz', roots),
        prop('Coeficiente angular', `a = ${fmt(a)}`),
        prop('Intercepto em Y', '(0, 0)'),
        prop('Gráfico', 'Reta passando pela origem.'),
        prop('Crescimento', describeSlope(a))
      ],
      warnings
    });
  }

  function computeAffine() {
    const warnings = [];
    const a = readNumber('a', warnings);
    const b = readNumber('b', warnings);
    if (nearlyZero(a)) warnings.push('Como a = 0, a função afim se comporta como função constante f(x) = b.');
    const rootText = nearlyZero(a)
      ? (nearlyZero(b) ? 'Todos os reais, pois f(x) = 0.' : 'Não possui raiz real.')
      : `x = ${fmt(-b / a)}`;
    const points = [{ x: 0, y: b, label: `Y (${fmt(b)})` }];
    if (!nearlyZero(a)) points.push({ x: -b / a, y: 0, label: `Raiz ${fmt(-b / a)}` });
    return makeDetails({
      name: 'Função afim',
      formula: `f(x) = ${polynomialLabel([a, b])}`,
      fn: x => a * x + b,
      points,
      properties: [
        prop('Nome', nearlyZero(b) ? 'Função linear dentro da família afim' : 'Função afim'),
        prop('Fórmula', `f(x) = ${polynomialLabel([a, b])}`),
        prop('Domínio', 'ℝ'),
        prop('Imagem', nearlyZero(a) ? `{${fmt(b)}}` : 'ℝ'),
        prop('Raiz', rootText),
        prop('Coeficiente angular', `a = ${fmt(a)}`),
        prop('Coeficiente linear', `b = ${fmt(b)}`),
        prop('Intercepto em Y', `(0, ${fmt(b)})`),
        prop('Crescimento', describeSlope(a)),
        prop('Gráfico', 'Reta.')
      ],
      warnings
    });
  }

  function computeQuadratic() {
    const warnings = [];
    const a = readNumber('a', warnings);
    const b = readNumber('b', warnings);
    const c = readNumber('c', warnings);
    const coeffs = [a, b, c];
    const points = [{ x: 0, y: c, label: `Y (${fmt(c)})` }];

    if (nearlyZero(a)) {
      warnings.push('Valor inválido para função quadrática: a = 0. O gráfico exibido corresponde à função linear/constante bx + c.');
      const roots = linearRoots(b, c);
      roots.values.forEach(root => points.push({ x: root, y: 0, label: `Raiz ${fmt(root)}` }));
      return makeDetails({
        name: 'Degeneração linear',
        formula: `f(x) = ${polynomialLabel(coeffs)}`,
        fn: x => b * x + c,
        points,
        properties: [
          prop('Nome', 'Não é quadrática para a = 0'),
          prop('Fórmula inserida', `f(x) = ${polynomialLabel(coeffs)}`),
          prop('Comportamento', nearlyZero(b) ? 'Função constante.' : 'Função afim.'),
          prop('Domínio', 'ℝ'),
          prop('Imagem', nearlyZero(b) ? `{${fmt(c)}}` : 'ℝ'),
          prop('Raiz', roots.text),
          prop('Intercepto em Y', `(0, ${fmt(c)})`)
        ],
        warnings
      });
    }

    const delta = b * b - 4 * a * c;
    const xv = -b / (2 * a);
    const yv = -delta / (4 * a);
    const rootValues = quadraticRoots(a, b, c);
    rootValues.forEach(root => points.push({ x: root, y: 0, label: `Raiz ${fmt(root)}` }));
    points.push({ x: xv, y: yv, label: `V (${fmt(xv)}, ${fmt(yv)})` });

    const rootText = delta < -EPS
      ? 'Não possui raízes reais (Δ < 0).'
      : rootValues.map((root, index) => `x${rootValues.length > 1 ? index + 1 : ''} = ${fmt(root)}`).join('; ');

    return makeDetails({
      name: 'Função quadrática',
      formula: `f(x) = ${polynomialLabel(coeffs)}`,
      fn: x => a * x * x + b * x + c,
      points,
      properties: [
        prop('Nome', 'Função quadrática'),
        prop('Fórmula', `f(x) = ${polynomialLabel(coeffs)}`),
        prop('Condição', 'a ≠ 0'),
        prop('Domínio', 'ℝ'),
        prop('Imagem', a > 0 ? `[${fmt(yv)}, +∞)` : `(-∞, ${fmt(yv)}]`),
        prop('Discriminante', `Δ = b² − 4ac = ${fmt(delta)}`),
        prop('Raízes', rootText),
        prop('Vértice', `(${fmt(xv)}, ${fmt(yv)})`),
        prop('Eixo de simetria', `x = ${fmt(xv)}`),
        prop('Intercepto em Y', `(0, ${fmt(c)})`),
        prop('Concavidade', a > 0 ? 'Para cima (a > 0).' : 'Para baixo (a < 0).'),
        prop(a > 0 ? 'Valor mínimo' : 'Valor máximo', `yv = ${fmt(yv)}`),
        prop('Crescimento', a > 0 ? `Decresce em (-∞, ${fmt(xv)}) e cresce em (${fmt(xv)}, +∞).` : `Cresce em (-∞, ${fmt(xv)}) e decresce em (${fmt(xv)}, +∞).`)
      ],
      warnings
    });
  }

  function computeCubic() {
    const warnings = [];
    const a = readNumber('a', warnings);
    const b = readNumber('b', warnings);
    const c = readNumber('c', warnings);
    const d = readNumber('d', warnings);
    const coeffs = [a, b, c, d];
    const trimmed = normalizeCoeffs(coeffs);
    const deg = degreeOf(coeffs);
    if (nearlyZero(a)) warnings.push(`Como a = 0, a função não é cúbica; o grau efetivo é ${deg}.`);

    const fn = x => polyEval(coeffs, x);
    const roots = findPolynomialRealRoots(coeffs);
    const points = [{ x: 0, y: d, label: `Y (${fmt(d)})` }];
    roots.forEach(root => points.push({ x: root, y: 0, label: `Raiz ${fmt(root)}` }));

    let inflection = 'Só existe para grau 3 efetivo.';
    let extremaText = 'Podem existir conforme os coeficientes.';
    if (!nearlyZero(a)) {
      const xi = -b / (3 * a);
      const yi = fn(xi);
      points.push({ x: xi, y: yi, label: `Inflexão (${fmt(xi)}, ${fmt(yi)})` });
      inflection = `(${fmt(xi)}, ${fmt(yi)})`;
      const derivative = [3 * a, 2 * b, c];
      const critical = findPolynomialRealRoots(derivative);
      if (critical.length) {
        extremaText = critical.map(x => {
          const second = 6 * a * x + 2 * b;
          const kind = second > 0 ? 'mínimo local' : second < 0 ? 'máximo local' : 'ponto estacionário';
          const y = fn(x);
          points.push({ x, y, label: `${kind} (${fmt(x)}, ${fmt(y)})` });
          return `${kind}: (${fmt(x)}, ${fmt(y)})`;
        }).join('; ');
      } else {
        extremaText = 'Não possui máximo/mínimo local real.';
      }
    }

    return makeDetails({
      name: 'Função cúbica',
      formula: `f(x) = ${polynomialLabel(coeffs)}`,
      fn,
      points,
      properties: [
        prop('Nome', !nearlyZero(a) ? 'Função cúbica' : 'Polinomial degenerada'),
        prop('Fórmula', `f(x) = ${polynomialLabel(coeffs)}`),
        prop('Condição', 'a ≠ 0 para ser cúbica.'),
        prop('Grau efetivo', String(deg)),
        prop('Domínio', 'ℝ'),
        prop('Imagem', deg % 2 === 1 ? 'ℝ' : 'Depende do grau efetivo e dos coeficientes.'),
        prop('Intercepto em Y', `(0, ${fmt(d)})`),
        prop('Raízes reais', roots.length ? roots.map(root => `x = ${fmt(root)}`) : 'Não foram encontradas raízes reais.'),
        prop('Ponto de inflexão', inflection),
        prop('Extremos locais', extremaText),
        prop('Gráfico', 'Curva geralmente semelhante a um S quando o grau efetivo é 3.')
      ],
      warnings,
      xMin: rangeAroundRoots(roots, -10, 10).min,
      xMax: rangeAroundRoots(roots, -10, 10).max
    });
  }

  function computePolynomial() {
    const warnings = [];
    const coeffs = parseCoefficients(readText('coeffs'), [1, 0, -4], warnings, 'coeficientes da função polinomial');
    const trimmed = normalizeCoeffs(coeffs);
    const deg = degreeOf(trimmed);
    const fn = x => polyEval(trimmed, x);
    const roots = findPolynomialRealRoots(trimmed);
    const derivativeRoots = deg > 1 ? findPolynomialRealRoots(derivativeCoeffs(trimmed)) : [];
    const constantTerm = trimmed[trimmed.length - 1] || 0;
    const points = [{ x: 0, y: constantTerm, label: `Y (${fmt(constantTerm)})` }];
    roots.forEach(root => points.push({ x: root, y: 0, label: `Raiz ${fmt(root)}` }));
    derivativeRoots.slice(0, 8).forEach(x => points.push({ x, y: fn(x), label: `Crítico ${fmt(x)}` }));
    const range = rangeAroundRoots([...roots, ...derivativeRoots], -10, 10);

    return makeDetails({
      name: 'Função polinomial',
      formula: `f(x) = ${polynomialLabel(trimmed)}`,
      fn,
      points,
      xMin: range.min,
      xMax: range.max,
      properties: [
        prop('Nome', 'Função polinomial'),
        prop('Fórmula', `f(x) = ${polynomialLabel(trimmed)}`),
        prop('Grau', String(deg)),
        prop('Domínio', 'ℝ'),
        prop('Imagem', deg % 2 === 1 ? 'ℝ para grau ímpar com coeficiente líder não nulo.' : 'Depende dos coeficientes; para grau par há máximo ou mínimo global.'),
        prop('Raízes reais', roots.length ? roots.map(root => `x ≈ ${fmt(root)}`) : 'Não foram encontradas raízes reais.'),
        prop('Intercepto em Y', `(0, ${fmt(constantTerm)})`),
        prop('Pontos críticos', derivativeRoots.length ? derivativeRoots.map(x => `x ≈ ${fmt(x)}, f(x) ≈ ${fmt(fn(x))}`) : 'Não possui pontos críticos reais ou é de grau ≤ 1.'),
        prop('Observação', 'Uma polinomial de grau n possui no máximo n raízes reais.')
      ],
      warnings
    });
  }

  function computePower() {
    const warnings = [];
    const a = readNumber('a', warnings);
    const n = readNumber('n', warnings);
    const integerExponent = Number.isInteger(roundIfClose(n));
    const exponent = roundIfClose(n);
    if (!integerExponent) warnings.push('Expoente não inteiro: para manter valores reais, o gráfico usa x ≥ 0.');
    if (nearlyZero(a)) warnings.push('Como a = 0, a função se comporta como constante nula.');
    const fn = x => {
      if (!integerExponent && x < 0) return NaN;
      if (x === 0 && exponent < 0) return NaN;
      return a * Math.pow(x, exponent);
    };
    const roots = !nearlyZero(a) && exponent > 0 ? 'x = 0' : (nearlyZero(a) ? 'Todos os reais do domínio.' : 'Não possui raiz real.');
    const domain = describePowerDomain(exponent, integerExponent);
    const image = describePowerRange(a, exponent, integerExponent);
    const points = [];
    if (exponent > 0 || nearlyZero(exponent)) points.push({ x: 0, y: fn(0), label: 'Origem/valor inicial' });
    if (Number.isFinite(fn(1))) points.push({ x: 1, y: fn(1), label: `(1, ${fmt(fn(1))})` });
    return makeDetails({
      name: 'Função potência',
      formula: `f(x) = ${formatCoefficientForFormula(a, `x${sup(exponent)}`)}`,
      fn,
      points,
      xMin: integerExponent ? -10 : -1,
      xMax: 10,
      verticalAsymptotes: exponent < 0 ? [0] : [],
      gaps: exponent < 0 ? [0] : [],
      properties: [
        prop('Nome', 'Função potência'),
        prop('Fórmula', `f(x) = ${formatCoefficientForFormula(a, `x${sup(exponent)}`)}`),
        prop('Domínio', domain),
        prop('Imagem', image),
        prop('Raiz', roots),
        prop('Comportamento', 'Depende do expoente n e do sinal de a.'),
        prop('Simetria', integerExponent ? (Math.abs(exponent % 2) < EPS ? 'n par: simetria em relação ao eixo Y.' : 'n ímpar: simetria em relação à origem.') : 'Sem simetria par/ímpar garantida para expoente real geral.'),
        prop('Gráfico', 'Depende do expoente; use o zoom para investigar o comportamento local.')
      ],
      warnings
    });
  }

  function computeExponential() {
    const warnings = [];
    const base = readNumber('base', warnings);
    let fn = null;
    if (base <= 0) {
      warnings.push('Base inválida para função exponencial real: é necessário a > 0.');
    } else {
      if (nearlyEqual(base, 1)) warnings.push('Como a = 1, a expressão aˣ se torna a função constante f(x) = 1; não é exponencial estrita.');
      fn = x => Math.pow(base, x);
    }
    return makeDetails({
      name: 'Função exponencial',
      formula: `f(x) = ${fmt(base)}ˣ`,
      fn,
      points: base > 0 ? [{ x: 0, y: 1, label: '(0, 1)' }] : [],
      horizontalAsymptotes: base > 0 && !nearlyEqual(base, 1) ? [0] : [],
      properties: [
        prop('Nome', 'Função exponencial'),
        prop('Fórmula', `f(x) = ${fmt(base)}ˣ`),
        prop('Condições', 'a > 0 e a ≠ 1 para ser exponencial estrita.'),
        prop('Domínio', base > 0 ? 'ℝ' : 'Indefinido para a base informada.'),
        prop('Imagem', base > 0 ? '(0, +∞)' : 'Indefinida para a base informada.'),
        prop('Intercepto em Y', base > 0 ? '(0, 1)' : 'Não aplicável.'),
        prop('Raiz', 'Não possui.'),
        prop('Assíntota horizontal', base > 0 && !nearlyEqual(base, 1) ? 'y = 0' : 'Não há na função constante.'),
        prop('Crescimento', base > 1 ? 'Crescente (a > 1).' : base > 0 && base < 1 ? 'Decrescente (0 < a < 1).' : 'Constante quando a = 1.')
      ],
      warnings
    });
  }

  function computeLogarithmic() {
    const warnings = [];
    const base = readNumber('base', warnings);
    let fn = null;
    if (base <= 0 || nearlyEqual(base, 1)) {
      warnings.push('Base inválida para função logarítmica: é necessário a > 0 e a ≠ 1.');
    } else {
      fn = x => x > 0 ? Math.log(x) / Math.log(base) : NaN;
    }
    return makeDetails({
      name: 'Função logarítmica',
      formula: `f(x) = log<sub>${fmt(base)}</sub>(x)`,
      fn,
      points: base > 0 && !nearlyEqual(base, 1) ? [{ x: 1, y: 0, label: '(1, 0)' }] : [],
      xMin: -1,
      xMax: 12,
      verticalAsymptotes: base > 0 && !nearlyEqual(base, 1) ? [0] : [],
      gaps: [0],
      properties: [
        prop('Nome', 'Função logarítmica'),
        prop('Fórmula', `f(x) = log<sub>${fmt(base)}</sub>(x)`),
        prop('Condições', 'a > 0 e a ≠ 1.'),
        prop('Domínio', base > 0 && !nearlyEqual(base, 1) ? '(0, +∞)' : 'Indefinido para a base informada.'),
        prop('Imagem', base > 0 && !nearlyEqual(base, 1) ? 'ℝ' : 'Indefinida para a base informada.'),
        prop('Raiz / intercepto em X', base > 0 && !nearlyEqual(base, 1) ? 'x = 1, ponto (1, 0).' : 'Não aplicável.'),
        prop('Intercepto em Y', 'Não possui, pois x = 0 está fora do domínio.'),
        prop('Assíntota vertical', base > 0 && !nearlyEqual(base, 1) ? 'x = 0' : 'Não aplicável.'),
        prop('Crescimento', base > 1 ? 'Crescente (a > 1).' : base > 0 && base < 1 ? 'Decrescente (0 < a < 1).' : 'Não aplicável.'),
        prop('Função inversa', 'Exponencial de mesma base.')
      ],
      warnings
    });
  }

  function computeTrig(kind) {
    const warnings = [];
    const A = readNumber('A', warnings);
    const B = readNumber('B', warnings);
    const C = readNumber('C', warnings);
    const D = readNumber('D', warnings);
    const meta = {
      sine: { name: 'Função seno', fnName: 'sen', js: Math.sin, periodAngle: 2 * Math.PI },
      cosine: { name: 'Função cosseno', fnName: 'cos', js: Math.cos, periodAngle: 2 * Math.PI },
      tangent: { name: 'Função tangente', fnName: 'tan', periodAngle: Math.PI },
      cotangent: { name: 'Função cotangente', fnName: 'cot', periodAngle: Math.PI }
    }[kind];

    const formula = `f(x) = ${fmt(A)}·${meta.fnName}(${fmt(B)}x ${signed(C)}) ${signed(D)}`;
    const period = !nearlyZero(B) ? meta.periodAngle / Math.abs(B) : Infinity;
    if (nearlyZero(A)) warnings.push('Como A = 0, a função se reduz à constante f(x) = D.');
    if (nearlyZero(B)) warnings.push('Como B = 0, a variável x desaparece da expressão; o gráfico é constante quando a expressão trigonométrica está definida.');

    let undefinedEverywhere = false;
    const fn = x => {
      const angle = B * x + C;
      if (kind === 'sine') return A * Math.sin(angle) + D;
      if (kind === 'cosine') return A * Math.cos(angle) + D;
      if (kind === 'tangent') {
        if (Math.abs(Math.cos(angle)) < 1e-6) return NaN;
        return A * Math.tan(angle) + D;
      }
      if (Math.abs(Math.sin(angle)) < 1e-6) return NaN;
      return A * (Math.cos(angle) / Math.sin(angle)) + D;
    };

    if (nearlyZero(B) && kind === 'tangent' && Math.abs(Math.cos(C)) < 1e-6) {
      undefinedEverywhere = true;
      warnings.push('A tangente fica indefinida para todo x porque cos(C) = 0.');
    }
    if (nearlyZero(B) && kind === 'cotangent' && Math.abs(Math.sin(C)) < 1e-6) {
      undefinedEverywhere = true;
      warnings.push('A cotangente fica indefinida para todo x porque sen(C) = 0.');
    }

    const xMin = Number.isFinite(period) ? -2 * period : -10;
    const xMax = Number.isFinite(period) ? 2 * period : 10;
    const verticalAsymptotes = !nearlyZero(B) && (kind === 'tangent' || kind === 'cotangent')
      ? trigAsymptotes(kind, B, C, xMin, xMax)
      : [];
    const roots = !nearlyZero(A) && !nearlyZero(B) ? trigRoots(kind, A, B, C, D, xMin, xMax) : [];
    const points = [];
    const y0 = undefinedEverywhere ? NaN : fn(0);
    if (Number.isFinite(y0)) points.push({ x: 0, y: y0, label: `Y (${fmt(y0)})` });
    roots.slice(0, 10).forEach(root => points.push({ x: root, y: 0, label: `Raiz ${fmt(root)}` }));

    const rootFormula = trigRootDescription(kind, A, B, C, D);
    const asymptoteDescription = kind === 'tangent'
      ? 'x = (π/2 − C + kπ)/B'
      : kind === 'cotangent'
        ? 'x = (kπ − C)/B'
        : 'Não possui assíntotas verticais.';

    return makeDetails({
      name: meta.name,
      formula,
      fn: undefinedEverywhere ? null : fn,
      xMin,
      xMax,
      verticalAsymptotes,
      gaps: verticalAsymptotes,
      points,
      properties: [
        prop('Nome', meta.name),
        prop('Fórmula', formula),
        prop('Domínio', trigDomain(kind, B, C)),
        prop('Imagem', kind === 'sine' || kind === 'cosine' ? `[${fmt(D - Math.abs(A))}, ${fmt(D + Math.abs(A))}]` : (nearlyZero(A) ? `{${fmt(D)}}` : 'ℝ')),
        prop('Amplitude', kind === 'sine' || kind === 'cosine' ? `|A| = ${fmt(Math.abs(A))}` : 'Não possui amplitude finita.'),
        prop('Período', Number.isFinite(period) ? `${fmt(period)} rad` : 'Indefinido para B = 0.'),
        prop('Raízes', rootFormula),
        prop('Intercepto em Y', Number.isFinite(y0) ? `(0, ${fmt(y0)})` : 'Não existe para os valores informados.'),
        prop('Assíntotas verticais', asymptoteDescription),
        prop('Gráfico', 'Curva periódica; navegue pelo gráfico para observar ciclos sucessivos.')
      ],
      warnings
    });
  }

  function computeModular() {
    const warnings = [];
    const a = readNumber('a', warnings);
    const h = readNumber('h', warnings);
    const k = readNumber('k', warnings);
    if (nearlyZero(a)) warnings.push('Como a = 0, a função modular se reduz à constante f(x) = k.');
    const fn = x => a * Math.abs(x - h) + k;
    const roots = modularRoots(a, h, k);
    const points = [{ x: h, y: k, label: `V (${fmt(h)}, ${fmt(k)})` }, { x: 0, y: fn(0), label: `Y (${fmt(fn(0))})` }];
    roots.values.forEach(root => points.push({ x: root, y: 0, label: `Raiz ${fmt(root)}` }));
    return makeDetails({
      name: 'Função modular',
      formula: `f(x) = ${fmt(a)}|x ${signed(-h)}| ${signed(k)}`,
      fn,
      points,
      xMin: h - 10,
      xMax: h + 10,
      properties: [
        prop('Nome', 'Função modular'),
        prop('Fórmula', `f(x) = ${fmt(a)}|x ${signed(-h)}| ${signed(k)}`),
        prop('Domínio', 'ℝ'),
        prop('Imagem', nearlyZero(a) ? `{${fmt(k)}}` : a > 0 ? `[${fmt(k)}, +∞)` : `(-∞, ${fmt(k)}]`),
        prop('Raiz', roots.text),
        prop('Valor extremo', nearlyZero(a) ? 'Constante.' : a > 0 ? `Mínimo = ${fmt(k)}` : `Máximo = ${fmt(k)}`),
        prop('Intercepto em X', roots.text),
        prop('Intercepto em Y', `(0, ${fmt(fn(0))})`),
        prop('Gráfico', a >= 0 ? 'Formato de V.' : 'Formato de V invertido.'),
        prop('Simetria', `Eixo de simetria: x = ${fmt(h)}.`)
      ],
      warnings
    });
  }

  function computeRational() {
    const warnings = [];
    const numerator = normalizeCoeffs(parseCoefficients(readText('numCoeffs'), [1], warnings, 'coeficientes de P(x)'));
    const denominator = normalizeCoeffs(parseCoefficients(readText('denCoeffs'), [1, 0], warnings, 'coeficientes de Q(x)'));
    const denIsZero = denominator.length === 1 && nearlyZero(denominator[0]);
    if (denIsZero) {
      warnings.push('Denominador inválido: Q(x) não pode ser o polinômio zero.');
      return makeDetails({
        name: 'Função racional inválida',
        formula: `f(x) = (${polynomialLabel(numerator)}) / (${polynomialLabel(denominator)})`,
        warnings,
        properties: [
          prop('Nome', 'Função racional'),
          prop('Condição', 'Q(x) ≠ 0 e Q não pode ser o polinômio zero.'),
          prop('Correção sugerida', 'Informe ao menos um coeficiente não nulo em Q(x).')
        ]
      });
    }

    const fn = x => {
      const q = polyEval(denominator, x);
      if (Math.abs(q) < 1e-7) return NaN;
      return polyEval(numerator, x) / q;
    };
    const denRoots = findPolynomialRealRoots(denominator);
    const numRoots = findPolynomialRealRoots(numerator).filter(root => Math.abs(polyEval(denominator, root)) > 1e-5);
    const holes = denRoots.filter(root => Math.abs(polyEval(numerator, root)) <= 1e-5);
    const verticalAsymptotes = denRoots.filter(root => Math.abs(polyEval(numerator, root)) > 1e-5);
    const asymptoteInfo = rationalEndBehavior(numerator, denominator);
    const yDen = polyEval(denominator, 0);
    const yIntercept = Math.abs(yDen) > 1e-7 ? fn(0) : NaN;
    const points = [];
    if (Number.isFinite(yIntercept)) points.push({ x: 0, y: yIntercept, label: `Y (${fmt(yIntercept)})` });
    numRoots.forEach(root => points.push({ x: root, y: 0, label: `Raiz ${fmt(root)}` }));
    const range = rangeAroundRoots([...denRoots, ...numRoots], -10, 10);

    return makeDetails({
      name: 'Função racional',
      formula: `f(x) = (${polynomialLabel(numerator)}) / (${polynomialLabel(denominator)})`,
      fn,
      points,
      xMin: range.min,
      xMax: range.max,
      verticalAsymptotes,
      horizontalAsymptotes: asymptoteInfo.horizontal,
      obliqueAsymptotes: asymptoteInfo.oblique,
      gaps: denRoots,
      properties: [
        prop('Nome', 'Função racional'),
        prop('Fórmula', `f(x) = P(x)/Q(x), com P(x) = ${polynomialLabel(numerator)} e Q(x) = ${polynomialLabel(denominator)}`),
        prop('Condição', 'Q(x) ≠ 0.'),
        prop('Domínio', denRoots.length ? `ℝ \ {${denRoots.map(fmt).join(', ')}}` : 'ℝ'),
        prop('Imagem', 'Depende da função; observe assíntotas e descontinuidades.'),
        prop('Raízes', numRoots.length ? numRoots.map(root => `x ≈ ${fmt(root)}`) : 'Não possui raízes reais admissíveis.'),
        prop('Intercepto em Y', Number.isFinite(yIntercept) ? `(0, ${fmt(yIntercept)})` : 'Não possui; x = 0 zera Q(x).'),
        prop('Assíntotas verticais', verticalAsymptotes.length ? verticalAsymptotes.map(root => `x ≈ ${fmt(root)}`) : 'Não foram encontradas.'),
        prop('Descontinuidades removíveis', holes.length ? holes.map(root => `furo em x ≈ ${fmt(root)}`) : 'Não foram identificadas por raízes comuns reais.'),
        prop('Comportamento no infinito', asymptoteInfo.description),
        prop('Gráfico', 'Pode possuir hipérboles, assíntotas e descontinuidades.')
      ],
      warnings
    });
  }

  function computeReciprocal() {
    const warnings = [];
    const kcoef = readNumber('kcoef', warnings);
    const h = readNumber('h', warnings);
    const v = readNumber('v', warnings);
    if (nearlyZero(kcoef)) warnings.push('Como k = 0, a expressão se torna constante f(x) = v, exceto pela restrição formal x ≠ h.');
    const fn = x => Math.abs(x - h) < 1e-7 ? NaN : kcoef / (x - h) + v;
    const yIntercept = Math.abs(h) > 1e-7 ? fn(0) : NaN;
    const root = !nearlyZero(v) ? h - kcoef / v : NaN;
    const points = [];
    if (Number.isFinite(yIntercept)) points.push({ x: 0, y: yIntercept, label: `Y (${fmt(yIntercept)})` });
    if (Number.isFinite(root)) points.push({ x: root, y: 0, label: `Raiz ${fmt(root)}` });
    return makeDetails({
      name: 'Função recíproca',
      formula: `f(x) = ${fmt(kcoef)}/(x ${signed(-h)}) ${signed(v)}`,
      fn,
      points,
      xMin: h - 10,
      xMax: h + 10,
      verticalAsymptotes: nearlyZero(kcoef) ? [] : [h],
      horizontalAsymptotes: [v],
      gaps: [h],
      properties: [
        prop('Nome', 'Função recíproca'),
        prop('Fórmula', `f(x) = ${fmt(kcoef)}/(x ${signed(-h)}) ${signed(v)}`),
        prop('Domínio', `ℝ \ {${fmt(h)}}`),
        prop('Imagem', nearlyZero(kcoef) ? `{${fmt(v)}}` : `ℝ \ {${fmt(v)}}`),
        prop('Raiz', Number.isFinite(root) ? `x = ${fmt(root)}` : 'Não possui quando v = 0 e k ≠ 0.'),
        prop('Intercepto em Y', Number.isFinite(yIntercept) ? `(0, ${fmt(yIntercept)})` : 'Não possui; x = 0 está fora do domínio.'),
        prop('Assíntota vertical', nearlyZero(kcoef) ? 'Não há curva hiperbólica quando k = 0.' : `x = ${fmt(h)}`),
        prop('Assíntota horizontal', `y = ${fmt(v)}`),
        prop('Gráfico', 'Hipérbole.'),
        prop('Simetria', h === 0 && v === 0 ? 'Simetria em relação à origem.' : `Simetria central no ponto (${fmt(h)}, ${fmt(v)}).`)
      ],
      warnings
    });
  }

  function computeSquareRoot() {
    const warnings = [];
    const a = readNumber('a', warnings);
    const h = readNumber('h', warnings);
    const k = readNumber('k', warnings);
    if (nearlyZero(a)) warnings.push('Como a = 0, a função raiz quadrada se reduz à constante f(x) = k no domínio x ≥ h.');
    const fn = x => x >= h ? a * Math.sqrt(x - h) + k : NaN;
    const rootInfo = squareRootRoot(a, h, k);
    const points = [{ x: h, y: k, label: `Início (${fmt(h)}, ${fmt(k)})` }];
    if (rootInfo.value !== null) points.push({ x: rootInfo.value, y: 0, label: `Raiz ${fmt(rootInfo.value)}` });
    const y0 = fn(0);
    if (Number.isFinite(y0)) points.push({ x: 0, y: y0, label: `Y (${fmt(y0)})` });
    return makeDetails({
      name: 'Função raiz quadrada',
      formula: `f(x) = ${fmt(a)}√(x ${signed(-h)}) ${signed(k)}`,
      fn,
      points,
      xMin: h - 2,
      xMax: h + 14,
      gaps: [h],
      properties: [
        prop('Nome', 'Função raiz quadrada'),
        prop('Fórmula', `f(x) = ${fmt(a)}√(x ${signed(-h)}) ${signed(k)}`),
        prop('Domínio', `[${fmt(h)}, +∞)`),
        prop('Imagem', nearlyZero(a) ? `{${fmt(k)}}` : a > 0 ? `[${fmt(k)}, +∞)` : `(-∞, ${fmt(k)}]`),
        prop('Raiz', rootInfo.text),
        prop('Valor extremo', nearlyZero(a) ? 'Constante.' : a > 0 ? `Mínimo = ${fmt(k)}` : `Máximo = ${fmt(k)}`),
        prop('Intercepto em X', rootInfo.text),
        prop('Intercepto em Y', Number.isFinite(y0) ? `(0, ${fmt(y0)})` : 'Não possui quando 0 não pertence ao domínio.'),
        prop('Gráfico', a >= 0 ? 'Curva crescente a partir do início do domínio.' : 'Curva decrescente a partir do início do domínio.')
      ],
      warnings
    });
  }

  function computeCubeRoot() {
    const warnings = [];
    const a = readNumber('a', warnings);
    const h = readNumber('h', warnings);
    const k = readNumber('k', warnings);
    if (nearlyZero(a)) warnings.push('Como a = 0, a função raiz cúbica se reduz à constante f(x) = k.');
    const fn = x => a * Math.cbrt(x - h) + k;
    const root = nearlyZero(a) ? null : h + Math.pow(-k / a, 3);
    const points = [{ x: h, y: k, label: `Centro (${fmt(h)}, ${fmt(k)})` }];
    if (root !== null) points.push({ x: root, y: 0, label: `Raiz ${fmt(root)}` });
    points.push({ x: 0, y: fn(0), label: `Y (${fmt(fn(0))})` });
    return makeDetails({
      name: 'Função raiz cúbica',
      formula: `f(x) = ${fmt(a)}∛(x ${signed(-h)}) ${signed(k)}`,
      fn,
      points,
      xMin: h - 10,
      xMax: h + 10,
      properties: [
        prop('Nome', 'Função raiz cúbica'),
        prop('Fórmula', `f(x) = ${fmt(a)}∛(x ${signed(-h)}) ${signed(k)}`),
        prop('Domínio', 'ℝ'),
        prop('Imagem', nearlyZero(a) ? `{${fmt(k)}}` : 'ℝ'),
        prop('Raiz', root === null ? (nearlyZero(k) ? 'Todos os reais.' : 'Não possui raiz real.') : `x = ${fmt(root)}`),
        prop('Intercepto em X', root === null ? 'Depende de k.' : `(${fmt(root)}, 0)`),
        prop('Intercepto em Y', `(0, ${fmt(fn(0))})`),
        prop('Gráfico', 'Curva semelhante a uma curva em S.'),
        prop('Crescimento', a > 0 ? 'Crescente em todo o domínio.' : a < 0 ? 'Decrescente em todo o domínio.' : 'Constante.'),
        prop('Simetria', h === 0 && k === 0 ? 'Simetria em relação à origem.' : `Simetria central no ponto (${fmt(h)}, ${fmt(k)}).`)
      ],
      warnings
    });
  }

  function computeComposite() {
    const warnings = [];
    const outerExpr = readText('outerExpr') || 'u^2 + 1';
    const innerExpr = readText('innerExpr') || 'x + 2';
    const inner = compileExpression(innerExpr, warnings, 'g(x)');
    const outer = compileExpression(outerExpr, warnings, 'f(u)');
    const fn = inner && outer ? x => {
      const u = inner({ x, u: x });
      if (!Number.isFinite(u)) return NaN;
      return outer({ u, x: u });
    } : null;
    const y0 = fn ? fn(0) : NaN;
    const points = Number.isFinite(y0) ? [{ x: 0, y: y0, label: `Y (${fmt(y0)})` }] : [];
    return makeDetails({
      name: 'Função composta',
      formula: `(f ∘ g)(x) = f(g(x))`,
      fn,
      points,
      properties: [
        prop('Nome', 'Função composta'),
        prop('Fórmula geral', '(f ∘ g)(x) = f(g(x))'),
        prop('Função externa', `f(u) = ${escapeHtml(outerExpr)}`),
        prop('Função interna', `g(x) = ${escapeHtml(innerExpr)}`),
        prop('Domínio', 'Depende simultaneamente do domínio de g e dos valores de g(x) aceitos por f.'),
        prop('Imagem', 'Depende das funções f e g.'),
        prop('Característica', 'Aplicação de uma função dentro de outra.'),
        prop('Intercepto em Y', Number.isFinite(y0) ? `(0, ${fmt(y0)})` : 'Não definido para x = 0.'),
        prop('Observação', 'Raízes, restrições de logaritmos e raízes pares são tratadas como lacunas no gráfico.')
      ],
      warnings
    });
  }

  function computeInverse() {
    const warnings = [];
    const expr = readText('originalExpr') || '2*x + 3';
    let start = readNumber('domainStart', warnings);
    let end = readNumber('domainEnd', warnings);
    if (start > end) [start, end] = [end, start];
    if (nearlyEqual(start, end)) {
      warnings.push('O intervalo analisado precisa ter comprimento positivo; foi ampliado automaticamente.');
      start -= 1;
      end += 1;
    }

    const compiled = compileExpression(expr, warnings, 'f(x)');
    const originalData = [];
    const inverseData = [];
    const ys = [];
    const samples = 700;
    if (compiled) {
      for (let i = 0; i <= samples; i += 1) {
        const x = start + (end - start) * (i / samples);
        const y = compiled({ x, u: x });
        if (Number.isFinite(y) && Math.abs(y) < CLIP_Y) {
          originalData.push({ x, y });
          inverseData.push({ x: y, y: x });
          ys.push(y);
        } else {
          originalData.push({ x, y: null });
        }
      }
      if (!isMonotonic(originalData)) {
        warnings.push('A função original não parece ser injetiva no intervalo analisado; a inversa pode deixar de ser função. Restrinja o intervalo para estudar um ramo.');
      }
    }
    inverseData.sort((p, q) => (p.x ?? 0) - (q.x ?? 0));
    const minY = ys.length ? Math.min(...ys) : -5;
    const maxY = ys.length ? Math.max(...ys) : 5;
    const plotMin = Math.min(start, minY) - 1;
    const plotMax = Math.max(end, maxY) + 1;
    const diagonal = [{ x: plotMin, y: plotMin }, { x: plotMax, y: plotMax }];

    return makeDetails({
      name: 'Função inversa',
      formula: `f⁻¹(x), reflexão de f(x) = ${escapeHtml(expr)}`,
      series: [
        { label: 'f(x) original', data: originalData, color: COLORS.function },
        { label: 'f⁻¹(x) refletida', data: inverseData, color: COLORS.secondary },
        { label: 'Reta y = x', data: diagonal, color: COLORS.accent, dashed: true }
      ],
      xMin: plotMin,
      xMax: plotMax,
      properties: [
        prop('Nome', 'Função inversa'),
        prop('Fórmula geral', 'f⁻¹(x)'),
        prop('Função original', `f(x) = ${escapeHtml(expr)}`),
        prop('Domínio da inversa', `Imagem aproximada de f no intervalo: [${fmt(minY)}, ${fmt(maxY)}]`),
        prop('Imagem da inversa', `Domínio analisado da função original: [${fmt(start)}, ${fmt(end)}]`),
        prop('Propriedade', 'f(f⁻¹(x)) = x e f⁻¹(f(x)) = x quando a inversa existe.'),
        prop('Característica gráfica', 'Reflexão do gráfico de f em relação à reta y = x.'),
        prop('Condição de existência', 'A função original deve ser bijetiva no domínio considerado; na prática, verifique se é injetiva no intervalo.')
      ],
      warnings
    });
  }

  // ----------------------------- Renderização -----------------------------

  function safeChartRegister(plugin) {
    if (!plugin || !window.Chart) return;
    try {
      Chart.register(plugin);
    } catch (error) {
      // Chart.js ignora plugins já registrados em versões recentes; este bloco evita falhas em CDNs diferentes.
      console.warn('Plugin Chart.js não registrado novamente:', error.message);
    }
  }

  function renderWarnings(warnings) {
    if (!warnings.length) {
      els.warnings.hidden = true;
      els.warnings.innerHTML = '';
      return;
    }
    els.warnings.hidden = false;
    els.warnings.innerHTML = `<strong>Atenção:</strong><ul>${warnings.map(w => `<li>${w}</li>`).join('')}</ul>`;
  }

  function renderStudyPanel(details) {
    els.formulaBadge.innerHTML = details.formula || details.name;
    els.studyCards.innerHTML = details.properties.map(item => `
      <article class="study-card">
        <div class="study-card__label">${escapeHtml(item.label)}</div>
        <div class="study-card__value">${renderValue(item.value)}</div>
      </article>
    `).join('');
  }

  function renderValue(value) {
    if (Array.isArray(value)) {
      return `<ul>${value.map(v => `<li>${v}</li>`).join('')}</ul>`;
    }
    return value === undefined || value === null || value === '' ? '—' : String(value);
  }

  function renderChart(details) {
    if (!window.Chart) {
      els.warnings.hidden = false;
      els.warnings.innerHTML = '<strong>Atenção:</strong><ul><li>Chart.js não foi carregado. Verifique sua conexão com a CDN.</li></ul>';
      return;
    }

    const xMin = Number.isFinite(details.xMin) ? details.xMin : -10;
    const xMax = Number.isFinite(details.xMax) && details.xMax > xMin ? details.xMax : xMin + 20;
    const datasets = [];
    const allLineData = [];
    const specialXs = details.points.map(point => point.x).filter(Number.isFinite);

    const series = details.series || (details.fn ? [{ label: details.name, fn: details.fn, color: COLORS.function }] : []);
    series.forEach((serie, index) => {
      const data = serie.data || sampleFunction(serie.fn, xMin, xMax, [...(details.gaps || []), ...(serie.gaps || [])], specialXs);
      allLineData.push(data);
      datasets.push({
        type: 'line',
        label: serie.label || details.name,
        data,
        parsing: false,
        borderColor: serie.color || (index === 0 ? COLORS.function : COLORS.secondary),
        backgroundColor: 'transparent',
        borderWidth: serie.borderWidth || 2.7,
        borderDash: serie.dashed ? [8, 6] : undefined,
        pointRadius: 0,
        pointHoverRadius: 4,
        spanGaps: false,
        tension: 0
      });
    });

    const yRange = computeYRange(allLineData, details.points, details.horizontalAsymptotes);

    details.verticalAsymptotes
      .filter(x => x >= xMin && x <= xMax)
      .forEach(x => {
        datasets.push(asymptoteDataset(`Assíntota x = ${fmt(x)}`, [{ x, y: yRange.min }, { x, y: yRange.max }]));
      });

    details.horizontalAsymptotes.forEach(y => {
      datasets.push(asymptoteDataset(`Assíntota y = ${fmt(y)}`, [{ x: xMin, y }, { x: xMax, y }]));
    });

    details.obliqueAsymptotes.forEach(line => {
      datasets.push(asymptoteDataset(`Assíntota ${line.label}`, [{ x: xMin, y: line.m * xMin + line.b }, { x: xMax, y: line.m * xMax + line.b }]));
    });

    if (details.points.length) {
      datasets.push({
        type: 'scatter',
        label: 'Pontos críticos',
        data: details.points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y)),
        parsing: false,
        showLabels: true,
        pointRadius: 5,
        pointHoverRadius: 8,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: COLORS.point
      });
    }

    if (chart) chart.destroy();
    chart = new Chart(els.canvas, {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        normalized: true,
        interaction: { mode: 'nearest', intersect: false },
        scales: {
          x: {
            type: 'linear',
            min: xMin,
            max: xMax,
            title: { display: true, text: 'x' },
            grid: {
              color: context => nearlyZero(context.tick.value) ? COLORS.axis : COLORS.grid,
              lineWidth: context => nearlyZero(context.tick.value) ? 1.6 : 1
            },
            ticks: { maxTicksLimit: 12, callback: value => fmt(Number(value)) }
          },
          y: {
            type: 'linear',
            min: yRange.min,
            max: yRange.max,
            title: { display: true, text: 'f(x)' },
            grid: {
              color: context => nearlyZero(context.tick.value) ? COLORS.axis : COLORS.grid,
              lineWidth: context => nearlyZero(context.tick.value) ? 1.6 : 1
            },
            ticks: { maxTicksLimit: 10, callback: value => fmt(Number(value)) }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, boxWidth: 10, boxHeight: 10 }
          },
          tooltip: {
            callbacks: {
              label(context) {
                const raw = context.raw || {};
                const label = raw.label ? `${raw.label}: ` : `${context.dataset.label}: `;
                if (raw.y === null || raw.x === null) return `${label}indefinido`;
                return `${label}(${fmt(raw.x)}, ${fmt(raw.y)})`;
              }
            }
          },
          zoom: {
            limits: {
              x: { min: xMin - 1000, max: xMax + 1000 },
              y: { min: yRange.min - 1000, max: yRange.max + 1000 }
            },
            pan: { enabled: true, mode: 'xy' },
            zoom: {
              wheel: { enabled: true, speed: 0.08 },
              pinch: { enabled: true },
              mode: 'xy'
            }
          }
        }
      }
    });
  }

  function asymptoteDataset(label, data) {
    return {
      type: 'line',
      label,
      data,
      parsing: false,
      borderColor: COLORS.asymptote,
      borderDash: [7, 7],
      borderWidth: 1.5,
      pointRadius: 0,
      spanGaps: false,
      tension: 0
    };
  }

  function sampleFunction(fn, xMin, xMax, gaps = [], specialXs = []) {
    if (!fn) return [];
    const base = [];
    for (let i = 0; i <= SAMPLE_COUNT; i += 1) {
      base.push(xMin + (xMax - xMin) * (i / SAMPLE_COUNT));
    }
    const epsX = Math.max((xMax - xMin) / SAMPLE_COUNT / 5, 1e-5);
    const enriched = [
      ...base,
      ...specialXs,
      ...gaps.flatMap(gap => [gap - epsX, gap, gap + epsX])
    ].filter(x => Number.isFinite(x) && x >= xMin - EPS && x <= xMax + EPS);
    const xs = uniqueSorted(enriched, 1e-8);
    const data = [];
    let prevX = null;
    let prevY = null;
    xs.forEach(x => {
      const crossedGap = prevX !== null && gaps.some(gap => (prevX < gap && x >= gap) || (prevX <= gap && x > gap));
      if (crossedGap && data.length && data[data.length - 1].y !== null) {
        data.push({ x: (prevX + x) / 2, y: null });
      }
      let y = NaN;
      try { y = fn(x); } catch (_) { y = NaN; }
      const invalid = !Number.isFinite(y) || Math.abs(y) > CLIP_Y;
      const jump = prevY !== null && Number.isFinite(prevY) && Number.isFinite(y) && Math.abs(y - prevY) > 0.65 * CLIP_Y;
      data.push({ x, y: invalid || jump ? null : y });
      prevX = x;
      prevY = invalid ? null : y;
    });
    return data;
  }

  function computeYRange(dataGroups, points, horizontalAsymptotes = []) {
    const values = [];
    dataGroups.forEach(data => data.forEach(point => {
      if (point && Number.isFinite(point.y) && Math.abs(point.y) < CLIP_Y) values.push(point.y);
    }));
    points.forEach(point => {
      if (Number.isFinite(point.y) && Math.abs(point.y) < CLIP_Y) values.push(point.y);
    });
    horizontalAsymptotes.forEach(y => Number.isFinite(y) && values.push(y));
    if (!values.length) return { min: -10, max: 10 };
    values.sort((a, b) => a - b);
    const lo = values[Math.floor(values.length * 0.04)];
    const hi = values[Math.ceil(values.length * 0.96) - 1];
    let min = Number.isFinite(lo) ? lo : values[0];
    let max = Number.isFinite(hi) ? hi : values[values.length - 1];
    points.forEach(point => {
      if (Number.isFinite(point.y) && Math.abs(point.y) < CLIP_Y) {
        min = Math.min(min, point.y);
        max = Math.max(max, point.y);
      }
    });
    if (nearlyEqual(min, max)) {
      min -= 5;
      max += 5;
    } else {
      const padding = Math.max((max - min) * 0.14, 1);
      min -= padding;
      max += padding;
    }
    return { min, max };
  }

  // ----------------------------- Utilitários matemáticos -----------------------------

  function readNumber(id, warnings) {
    const element = document.getElementById(id);
    const raw = element ? element.value : '';
    const value = Number(String(raw).trim().replace(',', '.'));
    if (!Number.isFinite(value)) {
      warnings.push(`Valor inválido em ${id}; foi usado 0 para manter o gráfico estável.`);
      return 0;
    }
    return value;
  }

  function readText(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
  }

  function parseCoefficients(raw, fallback, warnings, label) {
    const clean = String(raw || '')
      .replace(/[−–—]/g, '-')
      .replace(/[\[\](){}]/g, ' ')
      .trim();
    if (!clean) {
      warnings.push(`Nenhum valor informado em ${label}; foram usados os coeficientes padrão.`);
      return fallback;
    }
    const parts = clean.split(/[,;\s]+/).filter(Boolean);
    const numbers = parts.map(part => Number(part));
    if (!numbers.length || numbers.some(n => !Number.isFinite(n))) {
      warnings.push(`Há coeficientes inválidos em ${label}; foram usados os coeficientes padrão.`);
      return fallback;
    }
    return numbers;
  }

  function normalizeCoeffs(coeffs) {
    const normalized = coeffs.map(value => nearlyZero(value) ? 0 : value);
    while (normalized.length > 1 && nearlyZero(normalized[0])) normalized.shift();
    return normalized.length ? normalized : [0];
  }

  function degreeOf(coeffs) {
    return normalizeCoeffs(coeffs).length - 1;
  }

  function polyEval(coeffs, x) {
    return normalizeCoeffs(coeffs).reduce((acc, coef) => acc * x + coef, 0);
  }

  function derivativeCoeffs(coeffs) {
    const c = normalizeCoeffs(coeffs);
    const degree = c.length - 1;
    if (degree <= 0) return [0];
    return c.slice(0, -1).map((coef, index) => coef * (degree - index));
  }

  function linearRoots(a, b) {
    if (nearlyZero(a)) {
      return nearlyZero(b)
        ? { values: [], text: 'Todos os reais, pois f(x) = 0.' }
        : { values: [], text: 'Não possui raiz real.' };
    }
    const root = -b / a;
    return { values: [root], text: `x = ${fmt(root)}` };
  }

  function quadraticRoots(a, b, c) {
    if (nearlyZero(a)) return linearRoots(b, c).values;
    const delta = b * b - 4 * a * c;
    if (delta < -EPS) return [];
    if (nearlyZero(delta)) return [-b / (2 * a)];
    const sqrtDelta = Math.sqrt(Math.max(0, delta));
    return uniqueSorted([(-b - sqrtDelta) / (2 * a), (-b + sqrtDelta) / (2 * a)]);
  }

  function findPolynomialRealRoots(coeffs) {
    const c = normalizeCoeffs(coeffs);
    const deg = c.length - 1;
    if (deg <= 0) return [];
    if (deg === 1) return [roundIfClose(-c[1] / c[0])];
    if (deg === 2) return quadraticRoots(c[0], c[1], c[2]).map(roundIfClose);

    const bound = Math.min(Math.max(cauchyRootBound(c), 1), 1e4);
    const critical = findPolynomialRealRoots(derivativeCoeffs(c)).filter(x => x > -bound && x < bound);
    const splitPoints = uniqueSorted([-bound, ...critical, bound]);
    const roots = [];
    const tol = ROOT_TOL * (1 + c.reduce((sum, item) => sum + Math.abs(item), 0));

    splitPoints.forEach(x => {
      if (Math.abs(polyEval(c, x)) <= tol) roots.push(x);
    });

    for (let i = 0; i < splitPoints.length - 1; i += 1) {
      const left = splitPoints[i];
      const right = splitPoints[i + 1];
      const fLeft = polyEval(c, left);
      const fRight = polyEval(c, right);
      if (!Number.isFinite(fLeft) || !Number.isFinite(fRight)) continue;
      if (Math.abs(fLeft) <= tol || Math.abs(fRight) <= tol) continue;
      if (fLeft * fRight < 0) {
        roots.push(bisectRoot(x => polyEval(c, x), left, right));
      }
    }
    return uniqueSorted(roots.map(roundIfClose), 1e-5);
  }

  function cauchyRootBound(coeffs) {
    const c = normalizeCoeffs(coeffs);
    const leading = Math.abs(c[0]);
    if (nearlyZero(leading)) return 10;
    const maxRest = Math.max(...c.slice(1).map(value => Math.abs(value)), 0);
    return 1 + maxRest / leading;
  }

  function bisectRoot(fn, left, right) {
    let a = left;
    let b = right;
    let fa = fn(a);
    for (let i = 0; i < 90; i += 1) {
      const mid = (a + b) / 2;
      const fm = fn(mid);
      if (Math.abs(fm) < ROOT_TOL) return roundIfClose(mid);
      if (fa * fm <= 0) {
        b = mid;
      } else {
        a = mid;
        fa = fm;
      }
    }
    return roundIfClose((a + b) / 2);
  }

  function polynomialDivide(numerator, denominator) {
    const num = normalizeCoeffs(numerator).slice();
    const den = normalizeCoeffs(denominator);
    const diff = num.length - den.length;
    if (diff < 0) return { quotient: [0], remainder: num };
    const quotient = Array(diff + 1).fill(0);
    for (let i = 0; i <= diff; i += 1) {
      const factor = num[i] / den[0];
      quotient[i] = factor;
      for (let j = 0; j < den.length; j += 1) {
        num[i + j] -= factor * den[j];
      }
    }
    return { quotient: normalizeCoeffs(quotient), remainder: normalizeCoeffs(num.slice(diff + 1)) };
  }

  function rationalEndBehavior(numerator, denominator) {
    const degP = degreeOf(numerator);
    const degQ = degreeOf(denominator);
    const leadP = normalizeCoeffs(numerator)[0];
    const leadQ = normalizeCoeffs(denominator)[0];
    if (degP < degQ) {
      return { horizontal: [0], oblique: [], description: 'Assíntota horizontal y = 0.' };
    }
    if (degP === degQ) {
      const y = leadP / leadQ;
      return { horizontal: [y], oblique: [], description: `Assíntota horizontal y = ${fmt(y)}.` };
    }
    const division = polynomialDivide(numerator, denominator);
    if (degreeOf(division.quotient) === 1) {
      const [m, b] = normalizeCoeffs(division.quotient);
      return {
        horizontal: [],
        oblique: [{ m, b, label: `y = ${polynomialLabel([m, b])}` }],
        description: `Assíntota oblíqua y = ${polynomialLabel([m, b])}.`
      };
    }
    return {
      horizontal: [],
      oblique: [],
      description: `Como grau(P) − grau(Q) = ${degP - degQ}, há assíntota polinomial ${polynomialLabel(division.quotient)}.`
    };
  }

  function modularRoots(a, h, k) {
    if (nearlyZero(a)) {
      return nearlyZero(k)
        ? { values: [], text: 'Todos os reais, pois f(x) = 0.' }
        : { values: [], text: 'Não possui raiz real.' };
    }
    const target = -k / a;
    if (target < -EPS) return { values: [], text: 'Não possui raiz real.' };
    if (nearlyZero(target)) return { values: [h], text: `x = ${fmt(h)}` };
    const roots = uniqueSorted([h - target, h + target]);
    return { values: roots, text: roots.map(root => `x = ${fmt(root)}`).join('; ') };
  }

  function squareRootRoot(a, h, k) {
    if (nearlyZero(a)) {
      return nearlyZero(k)
        ? { value: null, text: 'Todos os pontos do domínio são raízes.' }
        : { value: null, text: 'Não possui raiz real.' };
    }
    const target = -k / a;
    if (target < -EPS) return { value: null, text: 'Não possui raiz real.' };
    const root = h + target * target;
    return { value: root, text: `x = ${fmt(root)}` };
  }

  function trigAsymptotes(kind, B, C, xMin, xMax) {
    const values = [];
    const thetaA = xMin * B + C;
    const thetaB = xMax * B + C;
    const thetaMin = Math.min(thetaA, thetaB);
    const thetaMax = Math.max(thetaA, thetaB);
    const kMin = Math.floor((thetaMin - 2 * Math.PI) / Math.PI) - 3;
    const kMax = Math.ceil((thetaMax + 2 * Math.PI) / Math.PI) + 3;
    for (let k = kMin; k <= kMax; k += 1) {
      const angle = kind === 'tangent' ? Math.PI / 2 + k * Math.PI : k * Math.PI;
      const x = (angle - C) / B;
      if (x >= xMin - EPS && x <= xMax + EPS) values.push(x);
    }
    return uniqueSorted(values);
  }

  function trigRoots(kind, A, B, C, D, xMin, xMax) {
    if (nearlyZero(A) || nearlyZero(B)) return [];
    const target = -D / A;
    const angles = [];
    const full = 2 * Math.PI;
    if (kind === 'sine') {
      if (target < -1 - EPS || target > 1 + EPS) return [];
      const clamped = clamp(target, -1, 1);
      const alpha = Math.asin(clamped);
      angles.push(alpha, Math.PI - alpha);
      return angleSolutions(angles, full, B, C, xMin, xMax);
    }
    if (kind === 'cosine') {
      if (target < -1 - EPS || target > 1 + EPS) return [];
      const clamped = clamp(target, -1, 1);
      const alpha = Math.acos(clamped);
      angles.push(alpha, -alpha);
      return angleSolutions(angles, full, B, C, xMin, xMax);
    }
    if (kind === 'tangent') {
      angles.push(Math.atan(target));
      return angleSolutions(angles, Math.PI, B, C, xMin, xMax);
    }
    // cot(theta) = target. Para target = 0, theta = π/2 + kπ.
    angles.push(nearlyZero(target) ? Math.PI / 2 : Math.atan(1 / target));
    return angleSolutions(angles, Math.PI, B, C, xMin, xMax);
  }

  function angleSolutions(baseAngles, periodAngle, B, C, xMin, xMax) {
    const values = [];
    const thetaA = xMin * B + C;
    const thetaB = xMax * B + C;
    const thetaMin = Math.min(thetaA, thetaB);
    const thetaMax = Math.max(thetaA, thetaB);
    baseAngles.forEach(baseAngle => {
      const kMin = Math.floor((thetaMin - baseAngle) / periodAngle) - 2;
      const kMax = Math.ceil((thetaMax - baseAngle) / periodAngle) + 2;
      for (let k = kMin; k <= kMax; k += 1) {
        const x = (baseAngle + k * periodAngle - C) / B;
        if (x >= xMin - EPS && x <= xMax + EPS) values.push(roundIfClose(x));
      }
    });
    return uniqueSorted(values);
  }

  function trigRootDescription(kind, A, B, C, D) {
    if (nearlyZero(A)) return nearlyZero(D) ? 'Todos os reais do domínio.' : 'Não possui raízes.';
    if (nearlyZero(B)) return 'Depende do valor constante A·função(C)+D.';
    if (kind === 'sine' && nearlyZero(D) && nearlyZero(C)) return 'x = kπ/B; no caso básico B = 1, x = kπ.';
    if (kind === 'cosine' && nearlyZero(D) && nearlyZero(C)) return 'x = (π/2 + kπ)/B; no caso básico B = 1, x = π/2 + kπ.';
    if (kind === 'tangent' && nearlyZero(D) && nearlyZero(C)) return 'x = kπ/B; no caso básico B = 1, x = kπ.';
    if (kind === 'cotangent' && nearlyZero(D) && nearlyZero(C)) return 'x = (π/2 + kπ)/B; no caso básico B = 1, x = π/2 + kπ.';
    return 'Calculadas por A·função(Bx+C)+D = 0; raízes visíveis aparecem como pontos laranja no gráfico.';
  }

  function trigDomain(kind, B, C) {
    if (kind === 'sine' || kind === 'cosine') return 'ℝ';
    if (nearlyZero(B)) return 'ℝ quando a expressão trigonométrica constante está definida.';
    if (kind === 'tangent') return 'ℝ, exceto x = (π/2 − C + kπ)/B.';
    return 'ℝ, exceto x = (kπ − C)/B.';
  }

  function compileExpression(expr, warnings, label) {
    if (!window.math) {
      warnings.push('A biblioteca math.js não foi carregada; expressões digitadas não podem ser avaliadas agora.');
      return null;
    }
    try {
      const compiled = window.math.compile(normalizeExpression(expr));
      return scope => toRealNumber(compiled.evaluate({
        x: scope.x,
        u: scope.u,
        pi: Math.PI,
        π: Math.PI,
        e: Math.E
      }));
    } catch (error) {
      warnings.push(`Expressão inválida em ${label}: ${escapeHtml(error.message)}.`);
      return null;
    }
  }

  function normalizeExpression(expr) {
    return String(expr)
      .replace(/[−–—]/g, '-')
      .replace(/\bsen\s*\(/gi, 'sin(')
      .replace(/\btg\s*\(/gi, 'tan(')
      .replace(/\bln\s*\(/gi, 'log(');
  }

  function toRealNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (value && typeof value.re === 'number' && typeof value.im === 'number') {
      return Math.abs(value.im) < 1e-9 ? value.re : NaN;
    }
    const primitive = Number(value);
    return Number.isFinite(primitive) ? primitive : NaN;
  }

  function isMonotonic(data) {
    let hasPositive = false;
    let hasNegative = false;
    let previous = null;
    data.forEach(point => {
      if (!point || !Number.isFinite(point.y)) return;
      if (previous !== null) {
        const diff = point.y - previous;
        if (diff > 1e-5) hasPositive = true;
        if (diff < -1e-5) hasNegative = true;
      }
      previous = point.y;
    });
    return !(hasPositive && hasNegative);
  }

  function rangeAroundRoots(values, fallbackMin, fallbackMax) {
    const finite = values.filter(Number.isFinite);
    if (!finite.length) return { min: fallbackMin, max: fallbackMax };
    const minValue = Math.min(...finite, fallbackMin);
    const maxValue = Math.max(...finite, fallbackMax);
    const width = Math.max(maxValue - minValue, 8);
    const padding = width * 0.18;
    return { min: minValue - padding, max: maxValue + padding };
  }

  // ----------------------------- Formatação e segurança -----------------------------

  function fmt(value, maximumFractionDigits = 5) {
    if (!Number.isFinite(value)) return 'indef.';
    const normalized = nearlyZero(value) ? 0 : roundIfClose(value);
    return normalized.toLocaleString('pt-BR', {
      maximumFractionDigits,
      minimumFractionDigits: 0
    });
  }

  function signed(value) {
    if (nearlyZero(value)) return '+ 0';
    return value < 0 ? `− ${fmt(Math.abs(value))}` : `+ ${fmt(value)}`;
  }

  function sup(value) {
    const text = String(fmt(value));
    const map = { '-': '⁻', '−': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', ',': '·', '.': '·' };
    return [...text].map(char => map[char] || char).join('');
  }

  function polynomialLabel(coeffs, variable = 'x') {
    const c = normalizeCoeffs(coeffs);
    if (c.length === 1 && nearlyZero(c[0])) return '0';
    const degree = c.length - 1;
    const terms = [];
    c.forEach((coef, index) => {
      if (nearlyZero(coef)) return;
      const power = degree - index;
      const absCoef = Math.abs(coef);
      let body = '';
      if (power === 0) body = fmt(absCoef);
      else if (power === 1) body = `${nearlyEqual(absCoef, 1) ? '' : fmt(absCoef)}${variable}`;
      else body = `${nearlyEqual(absCoef, 1) ? '' : fmt(absCoef)}${variable}${sup(power)}`;
      if (!terms.length) terms.push(`${coef < 0 ? '−' : ''}${body}`);
      else terms.push(`${coef < 0 ? ' − ' : ' + '}${body}`);
    });
    return terms.join('') || '0';
  }

  function formatCoefficientForFormula(coef, variableText) {
    if (nearlyZero(coef)) return '0';
    if (nearlyEqual(coef, 1)) return variableText;
    if (nearlyEqual(coef, -1)) return `−${variableText}`;
    return `${fmt(coef)}${variableText}`;
  }

  function describeSlope(a) {
    if (a > 0) return 'Crescente (a > 0).';
    if (a < 0) return 'Decrescente (a < 0).';
    return 'Constante (a = 0).';
  }

  function describePowerDomain(n, integerExponent) {
    if (integerExponent) {
      if (n < 0) return 'ℝ \ {0}';
      return 'ℝ';
    }
    return n < 0 ? '(0, +∞)' : '[0, +∞)';
  }

  function describePowerRange(a, n, integerExponent) {
    if (nearlyZero(a)) return '{0}';
    if (!integerExponent) {
      if (n < 0) return a > 0 ? '(0, +∞)' : '(-∞, 0)';
      return a > 0 ? '[0, +∞)' : '(-∞, 0]';
    }
    if (n === 0) return `{${fmt(a)}}`;
    if (n < 0) {
      if (Math.abs(n % 2) === 1) return 'ℝ \ {0}';
      return a > 0 ? '(0, +∞)' : '(-∞, 0)';
    }
    if (Math.abs(n % 2) === 0) return a > 0 ? '[0, +∞)' : '(-∞, 0]';
    return 'ℝ';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function nearlyZero(value) {
    return Math.abs(value) < EPS;
  }

  function nearlyEqual(a, b) {
    return Math.abs(a - b) < EPS;
  }

  function roundIfClose(value) {
    if (!Number.isFinite(value)) return value;
    const rounded = Math.round(value);
    return Math.abs(value - rounded) < 1e-10 ? rounded : value;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function uniqueSorted(values, tolerance = 1e-7) {
    const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
    const unique = [];
    sorted.forEach(value => {
      if (!unique.length || Math.abs(value - unique[unique.length - 1]) > tolerance) {
        unique.push(roundIfClose(value));
      }
    });
    return unique;
  }

  function dedupePoints(points) {
    const result = [];
    points.forEach(point => {
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
      const existing = result.find(item => Math.abs(item.x - point.x) < 1e-6 && Math.abs(item.y - point.y) < 1e-6);
      if (!existing) result.push(point);
    });
    return result;
  }
})();
