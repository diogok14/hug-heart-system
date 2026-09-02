# Radar de Integridade em Contratações Públicas

Sistema de inteligência analítica para detecção precoce de riscos de irregularidade em licitações e contratos públicos brasileiros, cruzando dados abertos oficiais com modelos de score, análise semântica de editais e auditoria geográfica.

---

## Autor

**Diogo Murilo Lopes**  
Engenheiro de Computação  
Araxá, MG — Brasil  
E-mail: diogok14@gmail.com  
Telefone: (34) 98828-3960  
LinkedIn: [linkedin.com/in/diogo-murilo-lopes-068b3524](https://linkedin.com/in/diogo-murilo-lopes-068b3524)

### Formação e especialização

- Especialização em Engenharia de IA Aplicada — UNIPDS (2026)  
  Foco em IA Generativa, LLMs, orquestração multi-agente (LangGraph), RAG avançado, arquitetura AI-First, protocolo MCP e fine-tuning (LoRA/PEFT).
- MBA em Engenharia de Software — Universidade de São Paulo (USP), 2023–2025
- MBA em Data Science e Analytics — Universidade de São Paulo (USP), 2021–2023
- MBA em Gestão de Projetos — Pontifícia Universidade Católica de Minas Gerais (PUC Minas), 2015–2016
- Análise de Dados — Universidade de São Paulo (USP), 2024
- Bacharelado em Engenharia de Computação — Universidade de Uberaba (UNIUBE), 2007–2011
- Certificação AWS Partner: Migrating Your Application to AWS

### Trajetória profissional

Atuação no ecossistema de software para gestão pública, com experiência em:

- Arquitetura, migração e governança de dados em escala enterprise (AWS, PostgreSQL, MySQL, sistemas legados);
- Pipelines de ingestão, transformação e conformidade de dados estruturados e não estruturados (LGPD/GDPR);
- Integração de APIs REST com modelos de linguagem (LLMs) e serviços de comunicação em nuvem;
- Modelagem de dados, otimização SQL, DevOps, CI/CD, observabilidade e metodologias ágeis (Scrum/Kanban) e PMP.

---

## O que é o Radar de Integridade

O Radar de Integridade é uma plataforma de apoio ao controle, ao jornalismo investigativo e à gestão pública. Ele consolida informações dispersas de diferentes bases oficiais — licitações, contratos, empresas, sócios, sanções e editais — e as transforma em **indicadores de risco quantitativos e auditáveis**, facilitando a triagem de processos que merecem atenção.

A solução não substitui auditoria humana nem produz conclusões definitivas. Ela gera **indícios técnicos** classificados por score de risco, com evidências transparentes para que auditores, gestores e cidadãos possam priorizar análises.

---

## Stack tecnológico

- **Framework full-stack:** TanStack Start v1 (React 19 + SSR/SSG + server functions)
- **Build tool:** Vite 7
- **Linguagem:** TypeScript
- **Estilo:** Tailwind CSS v4 + shadcn/ui
- **Visualização:** Recharts
- **Backend e banco:** Supabase (PostgreSQL, Row Level Security, Auth, Storage)
- **Execução serverless:** edge runtime (Cloudflare Workers) via `createServerFn` e rotas API do TanStack Start
- **IA generativa:** Google Gemini (por meio da plataforma de IA integrada) para análise semântica de editais
- **Geocodificação e auditoria geográfica:** Google Maps Geocoding, Places e Street View Static
- **Fontes de dados públicas:** Transferegov, Portal da Transparência, dados de CNPJ/QSA da Receita Federal, sanções CEIS/CNEP/CEPIM da Controladoria-Geral da União (CGU)

---

## Arquitetura da solução

A aplicação segue uma arquitetura em camadas com separação clara entre apresentação, lógica de negócio e fontes de dados.

```text
┌─────────────────────────────────────────────────────────────┐
│  Camada de apresentação (React + Tailwind + shadcn/ui)      │
│  Dashboard · Explorador de certames · Dossiê · Grafo · FAQ  │
├─────────────────────────────────────────────────────────────┤
│  Camada de aplicação (TanStack Start server functions)      │
│  carregarRadar() · calcularScore() · analisarEditalIA()     │
│  recalcularScores() · ingestão de dados abertos (roadmap)   │
├─────────────────────────────────────────────────────────────┤
│  Camada de dados (Supabase / PostgreSQL)                    │
│  empresas · socios · sancoes_cgu · licitacoes ·             │
│  propostas_licitacao · auditoria_risco · app_user_connections
├─────────────────────────────────────────────────────────────┤
│  Fontes externas                                            │
│  Transferegov · Receita Federal · CGU · Google Maps · Gemini│
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de dados

1. **Ingestão:** coleta periódica (jobs agendados) de licitações, contratos, empresas, sócios e sanções em bases abertas.
2. **Enriquecimento:** cada licitação vencedora é ligada ao CNPJ da empresa, ao seu Quadro Societário e Administrativo (QSA), às sanções vigentes e ao endereço geocodificado.
3. **Cálculo de score:** motor determinístico avalia cinco fatores de risco, gerando evidências textuais.
4. **Análise semântica de editais:** extração de texto de PDFs e classificação por IA de cláusulas potencialmente restritivas.
5. **Entrega:** dashboards, dossiês analíticos, grafo societário e alertas para usuários autenticados.

---

## Funcionalidades principais

### 1. Painel de risco (Dashboard)
Visão consolidada com KPIs: quantidade de certames analisados, valor total adjudicado, distribuição de scores, ranking de risco e alertas por fator.

### 2. Explorador de certames
Tabela interativa de licitações e contratos com filtros por município, objeto, valor, vencedor e faixa de risco. Permite abrir o dossiê analítico de cada processo.

### 3. Dossiê analítico
Página detalhada de um certame, contendo:
- identificação, município, objeto, modalidade e valor adjudicado;
- empresa vencedora, CNPJ, capital social, data de abertura e endereço;
- score total de 0 a 100 e decomposição por fator;
- evidências textuais que justificam cada parcela do score;
- análise semântica do edital (cláusulas restritivas, exigências atípicas);
- auditoria geográfica (endereço geocodificado, validação de fachada e densidade de estabelecimentos em raio de 50 m);
- sócios e vínculos societários;
- sanções CGU vigentes (CEIS/CNEP/CEPIM) associadas à empresa ou a sócios.

### 4. Grafo societário
Visualização de vínculos entre empresas e sócios, destacando concentração de participações, endereços comuns e sobreposição de propostas em certames distintos.

### 5. Metodologia
Página pública explicando os cinco fatores de risco, as faixas de score e os limites de uso dos indicadores como simples indícios.

### 6. Recálculo de score e reanálise de edital
Funções server-side permitindo reprocessar o score de todos os certames e reanalisar um edital por IA a partir de seu PDF, atualizando o banco em tempo real.

### 7. Exportação e alertas (roadmap)
Exportação de dossiês e tabelas para PDF/CSV e alertas por e-mail para novos certames de alto risco.

---

## Modelo de dados

O modelo relacional é centrado no CNPJ como chave de integração entre fontes.

| Tabela | Propósito |
|--------|-----------|
| `empresas` | Dados cadastrais do CNPJ, capital social, data de abertura, endereço, localização geográfica, fachada e estabelecimentos próximos. |
| `socios` | Quadro Societário e Administrativo (QSA) vinculado a cada CNPJ. |
| `sancoes_cgu` | Sanções administrativas e inidoneidades dos cadastros CEIS, CNEP e CEPIM. |
| `licitacoes` | Processos licitatórios e contratos, com município, objeto, modalidade, valor adjudicado e vencedor. |
| `propostas_licitacao` | Propostas de todas as empresas participantes de cada licitação. |
| `auditoria_risco` | Score de risco e evidências calculados para cada licitação. Relação 1:1 com `licitacoes`. |
| `app_user_connections` | (Futuro) chaves cifradas de conexões de usuários com serviços externos. |

---

## Motor de score

O cálculo é determinístico e auditável. Cada certame recebe um score de **0 a 100**, composto por cinco fatores:

| Fator | Peso | Descrição |
|-------|------|-----------|
| Empresa fantasma | 0–25 | Endereço não comercial, ausência de fachada, lote vago, nenhum estabelecimento em 50 m. |
| Tempo de constituição | 0–20 | Empresa constituída há poucos dias em relação à data da licitação. |
| Capital desproporcional | 0–20 | Razão entre valor adjudicado e capital social. |
| Conluio societário | 0–20 | Sócios comuns, endereços compartilhados, sanções vigentes ou empresas sancionadas vencedoras. |
| Cláusulas restritivas no edital | 0–15 | Análise semântica de PDF por IA, identificando exigências atípicas que possam direcionar o certame. |

As faixas de risco são:

- **0–39:** Baixo risco
- **40–59:** Médio risco
- **60–79:** Alto risco
- **80–100:** Risco crítico

O motor gera, para cada fator, uma **evidência textual** explicando o valor atribuído, garantindo transparência e rastreabilidade.

---

## Análise semântica de editais com IA

Para cada licitação, o sistema pode baixar o PDF do edital, extrair seu texto e enviá-lo a um modelo de linguagem (Google Gemini). A resposta é estruturada em:

- `score_restricao`: valor de 0 a 15;
- `clausulas_restritivas`: lista de cláusulas identificadas;
- `motivos`: justificativa de cada classificação;
- `exigencias_atipicas`: exigências técnicas/comerciais fora do padrão;
- `resumo`: texto executivo da análise.

Esse resultado é persistido em `auditoria_risco.analise_ia` e realimenta automaticamente o motor de score.

---

## Auditoria geográfica

A geolocalização do endereço do CNPJ vencedor passa por três verificações:

1. **Geocoding:** conversão do endereço em coordenadas geográficas.
2. **Places API:** busca de estabelecimentos comerciais em um raio de 50 m. Ausência indica endereço potencialmente incompatível com a atividade.
3. **Street View Static:** captura da imagem da fachada para verificação visual complementar.

Esses dados alimentam o fator **Empresa fantasma** e são exibidos no dossiê analítico.

---

## Requisitos e execução local

### Pré-requisitos

- Node.js 20+ ou Bun
- Conta no Supabase (backend, auth e storage)
- Chaves de acesso aos serviços Google Maps e Gemini

### Instalação

```bash
git clone <url-do-repositorio>
cd radar-de-integridade
bun install
# ou: npm install
```

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as variáveis necessárias:

```env
# Supabase
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_PROJECT_ID=<project-id>

# Google Maps (server-side)
GOOGLE_MAPS_API_KEY=<chave>

# AI Gateway / Gemini
LOVABLE_API_KEY=<chave-da-plataforma>
```

> As chaves de servidor (`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_MAPS_API_KEY`, `LOVABLE_API_KEY`) nunca devem ser expostas no frontend. São lidas apenas dentro de `createServerFn` e rotas API.

### Executar em desenvolvimento

```bash
bun run dev
# ou: npm run dev
```

A aplicação estará disponível em `http://localhost:8080`.

### Type check

```bash
bunx tsgo --noEmit
```

---

## Estrutura de diretórios

```text
src/
├── components/radar/      Componentes específicos do Radar (dashboard, dossiê, grafo, tabela)
├── data/radar.ts          Tipos, dados mockados e helpers de negócio
├── data/radar-context.tsx Contexto global de estado do Radar
├── lib/
│   ├── radar.functions.ts    Server functions: carregamento e recálculo de scores
│   ├── score-engine.ts       Motor determinístico de score
│   └── edital-ia.functions.ts Análise semântica de editais com IA
├── routes/                Rotas do TanStack Start
├── integrations/          Clientes Supabase e utilitários de autenticação
└── styles.css             Tokens de design institucional e utilitários Tailwind
```

---

## Roadmap técnico

1. ✅ Schema relacional e seed de demonstração no Supabase
2. ✅ Leitura server-side consolidada (`carregarRadar`)
3. ✅ Dashboard, explorador de certames, dossiê, grafo e metodologia
4. ✅ Redesign institucional (paleta e layout de sistemas de controle externo)
5. ✅ Motor de score server-side com evidências
6. ✅ Análise semântica de editais com IA
7. 🔄 Ingestão real de bases abertas (Transferegov, Portal da Transparência, Receita Federal, CGU)
8. 🔄 Auditoria geográfica real (Geocoding + Places + Street View)
9. 🔄 Jobs agendados para atualização periódica
10. 🔄 Autenticação, perfis e controle de acesso
11. 🔄 Exportação de dossiês e tabelas (PDF/CSV)
12. 🔄 Sistema de alertas por e-mail

---

## Aviso metodológico

Os indicadores, scores e informações gerados pela aplicação são **instrumentos de auxílio à fiscalização** e não conclusões definitivas sobre irregularidades. Os dados de demonstração existem para validar a arquitetura e a interface. Em produção, as análises devem ser sempre confirmadas por auditoria humana e pelos órgãos competentes.

---

## Contato

Diogo Murilo Lopes  
[diogok14@gmail.com](mailto:diogok14@gmail.com)  
[(34) 98828-3960](tel:+5534988283960)  
[LinkedIn](https://linkedin.com/in/diogo-murilo-lopes-068b3524)
