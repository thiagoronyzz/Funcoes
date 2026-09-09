/* Zcode — CATÁLOGO PRINCIPAL DA PLATAFORMA */
import * as EST1 from "./engines/estudos.mjs";
import * as EST2 from "./engines/estudos2.mjs";
import * as UT1 from "./engines/uteis.mjs";
import * as UT2 from "./engines/uteis2.mjs";
import { JOGOS_ARCADE } from "./engines/jogos_arcade.mjs";
import { JOGOS_PUZZLE } from "./engines/jogos_puzzle.mjs";

import { getEstudos } from "./catalog_estudos.mjs";
import { getUteis } from "./catalog_uteis.mjs";
import { getJogos } from "./catalog_jogos.mjs";

export const ENGINES = {
  estudos: { ...EST1.ESTUDOS, ...EST2.ESTUDOS2 },
  uteis: { ...UT1.UTEIS1, ...UT2.UTEIS2 },
  jogos: { ...JOGOS_ARCADE, ...JOGOS_PUZZLE },
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
      const chave = e.nome + "|" + e.desc;
      if (nomes.has(chave)) er.push(`${c}: entrada duplicada "${e.nome}"`);
      nomes.add(chave);
      if (!e.legacy && !e.engine) er.push(`${c}: "${e.nome}" sem engine nem legacy`);
    }
  }
  return er;
}
