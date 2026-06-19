/*
 * Regenera supabase/aplicar_tudo.sql concatenando os arquivos de sql/ na
 * ordem correta de dependência.
 *
 * Uso:  node supabase/_gerar_bundle.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const base = dirname(fileURLToPath(import.meta.url));

// Ordem importa: tipos -> funções -> tabelas (por FK) -> dados -> gatilhos.
const ORDEM = [
  "sql/00_base/01_extensoes_e_tipos.sql",
  "sql/00_base/02_funcoes_autorizacao.sql",
  "sql/10_entidades/perfis.sql",
  "sql/10_entidades/organizacoes.sql",
  "sql/10_entidades/papeis_permissoes.sql",
  "sql/10_entidades/membros.sql",
  "sql/10_entidades/convites.sql",
  "sql/10_entidades/logs_auditoria.sql",
  "sql/10_entidades/jogos.sql",
  "sql/20_dados/seed_papeis.sql",
  "sql/30_rpc/convites_rpc.sql",
  "sql/99_gatilhos.sql",
];

const cabecalho = [
  "-- ============================================================",
  "-- jogos_cscj :: Área de Usuários / Organizações",
  "-- Bundle de TODO o SQL, na ordem correta de dependência.",
  "-- Cole no SQL Editor do Supabase e clique Run. Idempotente.",
  "-- (Gerado a partir de supabase/sql/ — não edite à mão.)",
  "-- ============================================================",
  "",
];

const partes = ORDEM.map((rel) => {
  const conteudo = readFileSync(join(base, rel), "utf8");
  return `-- ===== ${rel} =====\n${conteudo}\n`;
});

writeFileSync(join(base, "aplicar_tudo.sql"), [...cabecalho, ...partes].join("\n"));
console.log(`OK: aplicar_tudo.sql gerado a partir de ${ORDEM.length} arquivos.`);
