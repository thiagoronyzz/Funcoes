/* Zcode — CATÁLOGO PRINCIPAL DA PLATAFORMA */
import * as EST1 from "./engines/estudos.mjs";
import * as EST2 from "./engines/estudos2.mjs";
import * as UT1 from "./engines/uteis.mjs";
import * as UT2 from "./engines/uteis2.mjs";
import * as JOG1 from "./engines/jogos.mjs";
import * as JOG2 from "./engines/jogos2.mjs";

import { getEstudos } from "./catalog_estudos.mjs";
import { getUteis } from "./catalog_uteis.mjs";
import { getJogos } from "./catalog_jogos.mjs";

export const ENGINES = {
  estudos: { ...EST1.ESTUDOS, ...EST2.ESTUDOS2 },
  uteis: { ...UT1.UTEIS1, ...UT2.UTEIS2 },
  jogos: { ...JOG1.JOGOS1, ...JOG2.JOGOS2 },
};

export const E = getEstudos();
export const U = getUteis();
export const J = getJogos();

export const CATALOGO = { estudos: E, jogos: J, uteis: U };

export function validar() {
  const er = [];
  const cont = { estudos: E.length, jogos: J.length, uteis: U.length };
  for (const c of ["estudos", "jogos", "uteis"]) {
    if (cont[c] < 200) er.push(`${c}: ${cont[c]} apps (esperado ao menos 200)`);
    const nomes = new Set();
    for (const e of CATALOGO[c]) {
      if (!e.nome || !e.desc) er.push(`${c}: app sem nome/desc`);
      if (nomes.has(e.nome)) er.push(`${c}: nome duplicado "${e.nome}"`);
      nomes.add(e.nome);
      if (!e.legacy && !e.engine) er.push(`${c}: "${e.nome}" sem engine nem legacy`);
    }
  }
  return er;
}
