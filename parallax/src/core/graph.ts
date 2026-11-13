import type { Contradiction, GraphEdge, GraphNode, Page, SiteId } from "@/core/types";

/* ────────────────────────────────────────────────────────────────────────────
   Grafo de conhecimento contextual
   Nós = conceitos, fontes, produtos e tarefas. Arestas = coocorrência na mesma
   página, citação de fonte e contradição entre afirmações.
   Sem Neo4j: listas de adjacência em memória + persistência em JSON.
   ──────────────────────────────────────────────────────────────────────────── */

let edgeSeq = 0;
const edgeId = () => `e_${Date.now().toString(36)}_${(edgeSeq++).toString(36)}`;

const norm = (s: string) => s.toLowerCase().trim();

export function conceptId(label: string) {
  return `c:${norm(label).replace(/[^\p{L}\p{N}]+/gu, "-")}`;
}
export function sourceId(url: string) {
  return `s:${url}`;
}

export function addPageToGraph(
  graph: { nodes: GraphNode[]; edges: GraphEdge[] },
  page: Page,
  siteId: SiteId
): { nodes: GraphNode[]; edges: GraphEdge[]; addedNodes: GraphNode[]; addedEdges: GraphEdge[] } {
  const nodes = [...graph.nodes];
  const edges = [...graph.edges];
  const addedNodes: GraphNode[] = [];
  const addedEdges: GraphEdge[] = [];
  const now = Date.now();

  const upsert = (node: Omit<GraphNode, "weight" | "createdAt">) => {
    const idx = nodes.findIndex((n) => n.id === node.id);
    if (idx >= 0) {
      nodes[idx] = { ...nodes[idx], weight: Math.min(12, nodes[idx].weight + 1) };
      return nodes[idx];
    }
    const created: GraphNode = { ...node, weight: 1, createdAt: now };
    nodes.push(created);
    addedNodes.push(created);
    return created;
  };

  const source = upsert({
    id: sourceId(page.url),
    label: page.title,
    kind: "fonte",
    siteId,
    pageId: page.id,
    pageTitle: page.title,
    url: page.url,
  });

  const concepts = page.concepts.map((c) => upsert({ id: conceptId(c), label: c, kind: "conceito", siteId, pageId: page.id, pageTitle: page.title, url: page.url }));

  const connect = (from: string, to: string, rel: GraphEdge["rel"], weight = 1) => {
    if (from === to) return;
    const idx = edges.findIndex((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from));
    if (idx >= 0) {
      edges[idx] = { ...edges[idx], weight: Math.min(8, edges[idx].weight + 1) };
      return;
    }
    const e: GraphEdge = { id: edgeId(), from, to, rel, weight, createdAt: now };
    edges.push(e);
    addedEdges.push(e);
  };

  for (const c of concepts) connect(source.id, c.id, "coocorre");
  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) connect(concepts[i].id, concepts[j].id, "coocorre", 1);
  }

  // referências viram nós de fonte ligados por "cita"
  for (const ref of page.refs ?? []) {
    const refNode = upsert({
      id: sourceId(ref.url),
      label: `${ref.author ?? ref.site}${ref.year ? ` (${ref.year})` : ""} — ${ref.title}`,
      kind: "fonte",
      siteId,
      pageId: page.id,
      pageTitle: page.title,
      url: ref.url,
    });
    connect(source.id, refNode.id, "cita", 2);
  }

  return { nodes, edges, addedNodes, addedEdges };
}

export function contradictionsFrom(
  page: Page,
  store: Contradiction[],
  allPages: Page[]
): Contradiction[] {
  const negation = (s: string) => /\b(n[ãa]o|nunca|sem|nenhum|jamais)\b/i.test(s);
  const found: Contradiction[] = [];
  for (const claim of page.claims ?? []) {
    for (const other of allPages) {
      if (other.id === page.id) continue;
      for (const otherClaim of other.claims ?? []) {
        if (norm(otherClaim.topic) !== norm(claim.topic)) continue;
        // heurística: afirmações de mesmo tópico que divergem em número/valor
        const nums = (s: string) => s.match(/\d+(?:[.,]\d+)?/g) ?? [];
        const a = nums(claim.text);
        const b = nums(otherClaim.text);
        const numericDiff = a.length > 0 && b.length > 0 && a.join() !== b.join();
        const lexicalDiff = a.length === 0 && b.length === 0 && negation(claim.text) !== negation(otherClaim.text);
        const partialNumeric = a.length !== b.length && (a.length > 0 || b.length > 0);
        if (!numericDiff && !lexicalDiff && !partialNumeric) continue;
        const id = `ct:${[page.id, other.id, norm(claim.topic)].join("-")}`;
        if (store.some((c) => c.id === id) || found.some((c) => c.id === id)) continue;
        found.push({
          id,
          topic: claim.topic,
          claimA: { text: claim.text, source: `${page.title} (${page.url})` },
          claimB: { text: otherClaim.text, source: `${other.title} (${other.url})` },
          createdAt: Date.now(),
        });
      }
    }
  }
  return found;
}

export function neighbors(graph: { nodes: GraphNode[]; edges: GraphEdge[] }, id: string) {
  const out: { node: GraphNode; rel: GraphEdge["rel"]; weight: number }[] = [];
  for (const e of graph.edges) {
    if (e.from === id) {
      const n = graph.nodes.find((x) => x.id === e.to);
      if (n) out.push({ node: n, rel: e.rel, weight: e.weight });
    } else if (e.to === id) {
      const n = graph.nodes.find((x) => x.id === e.from);
      if (n) out.push({ node: n, rel: e.rel, weight: e.weight });
    }
  }
  return out.sort((a, b) => b.weight - a.weight);
}

/** Layout determinístico em anéis concêntricos (sem física, sem dependências). */
export function layoutGraph(graph: { nodes: GraphNode[]; edges: GraphEdge[] }, width: number, height: number) {
  const concepts = graph.nodes.filter((n) => n.kind === "conceito").sort((a, b) => b.weight - a.weight);
  const sources = graph.nodes.filter((n) => n.kind === "fonte");
  const positions = new Map<string, { x: number; y: number; r: number }>();
  const cx = width / 2;
  const cy = height / 2;

  const focal = concepts.slice(0, 14);
  const ring1 = Math.min(width, height) * 0.26;
  const ring2 = Math.min(width, height) * 0.4;

  focal.forEach((n, i) => {
    const a = (i / Math.max(1, focal.length)) * Math.PI * 2 - Math.PI / 2;
    positions.set(n.id, {
      x: cx + Math.cos(a) * ring1,
      y: cy + Math.sin(a) * ring1,
      r: 5 + Math.min(7, n.weight * 1.6),
    });
  });

  const outer = [...sources, ...concepts.slice(14, 30)];
  outer.slice(0, 20).forEach((n, i) => {
    const a = (i / Math.max(1, outer.length)) * Math.PI * 2 - Math.PI / 2 + 0.25;
    positions.set(n.id, {
      x: cx + Math.cos(a) * ring2,
      y: cy + Math.sin(a) * ring2,
      r: n.kind === "fonte" ? 3.5 : 4,
    });
  });

  const rest = graph.nodes.filter((n) => !positions.has(n.id)).slice(0, 12);
  rest.forEach((n, i) => {
    const a = (i / Math.max(1, rest.length)) * Math.PI * 2;
    positions.set(n.id, { x: cx + Math.cos(a) * ring2 * 1.22, y: cy + Math.sin(a) * ring2 * 1.22, r: 2.5 });
  });

  return positions;
}

export function graphStats(graph: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const concepts = graph.nodes.filter((n) => n.kind === "conceito").length;
  const sources = graph.nodes.filter((n) => n.kind === "fonte").length;
  const crossSource = graph.nodes.filter((n) => n.kind === "conceito" && n.weight >= 2).length;
  return { concepts, sources, crossSource, edges: graph.edges.length };
}
