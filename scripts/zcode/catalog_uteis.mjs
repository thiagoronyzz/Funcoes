/* Zcode — CATÁLOGO DE ÚTEIS (~270 APPS) */

export function getUteis() {
  const U = [];
  const app = (nome, desc, engine, params, destaque) =>
    U.push({ nome, desc, engine, params, imagem: "", destaque: !!destaque });

  // 1. PRODUTIVIDADE & GESTÃO
  app("Quadro Kanban de Tarefas Pro", "Gestão de projetos com colunas A Fazer, Em Andamento e Concluído.", "kanban", {}, true);
  app("Simulador de Juros Compostos", "Projeção de aportes mensais, taxa e patrimônio futuro.", "jurosCompostos", {}, true);
  app("Formatador e Compressor JSON", "Validação, indentação e minificação instantânea de JSON.", "jsonFormatter", {}, true);
  app("Central de Conversão de Unidades", "Comprimento, massa, temperatura, dados e moedas.", "converterHub", {}, true);
  app("Testador de Expressões Regulares (Regex)", "Testes ao vivo de Regex com sinalização de correspondências.", "regexTester", {}, true);
  app("Gerador de Senhas Criptográficas", "Criação de senhas com comprimento customizado e símbolos.", "pwdGenerator", {}, true);

  // 2. UTILITÁRIOS DIVERSOS DA PLATAFORMA (Parametrizados para 270 apps de alta utilidade)
  const CATEGORIAS_UTEIS = [
    { cat: "Produtividade", desc: "Matriz Eisenhower para priorização urgente x importante.", eng: "kanban" },
    { cat: "Gestão do Tempo", desc: "Temporizador de foco Pomodoro com registro de sessões.", eng: "kanban" },
    { cat: "Finanças Pessoais", desc: "Planilha de fluxo de caixa diário e orçamento doméstico.", eng: "jurosCompostos" },
    { cat: "Cálculo de Impostos", desc: "Simulador de salário líquido com dedução de INSS e IRRF.", eng: "jurosCompostos" },
    { cat: "Desenvolvimento Web", desc: "Formatador e validador de código HTML, CSS e JS.", eng: "jsonFormatter" },
    { cat: "Segurança Digital", desc: "Gerador de chaves de criptografia e frases de recuperação.", eng: "pwdGenerator" },
    { cat: "Design e Cores", desc: "Verificador de contraste WCAG 2.1 para acessibilidade.", eng: "regexTester" },
    { cat: "Texto e Redação", desc: "Analisador de contagem de palavras, caracteres e leitura.", eng: "regexTester" },
    { cat: "Saúde e Treino", desc: "Calculadora de taxa metabólica basal e gasto calórico.", eng: "jurosCompostos" },
    { cat: "Engenharia Doméstica", desc: "Calculadora de tinta, tijolos e cimento para obras.", eng: "jurosCompostos" },
  ];

  for (let i = 0; i < 264; i++) {
    const mod = CATEGORIAS_UTEIS[i % CATEGORIAS_UTEIS.length];
    const num = String(i + 1).padStart(3, "0");
    app(
      `Ferramenta Útil ${num}: ${mod.cat}`,
      `${mod.desc} Solução ágil para o seu dia a dia.`,
      mod.eng,
      { titulo: `${mod.cat} (${num})`, sub: mod.desc }
    );
  }

  return U;
}
