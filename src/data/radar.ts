/**
 * Radar de Integridade — camada de dados mock integrando as 5 fontes
 * governamentais mapeadas na especificação:
 *  1. Portal da Transparência / Transferegov (MGI)  -> licitacoes, propostas
 *  2. CNPJ Aberto (Receita Federal)                 -> empresas
 *  3. QSA (Receita Federal)                         -> socios
 *  4/5. Sanções CGU (CEIS, CNEP, CEPIM)             -> sancoes
 * Estruturas espelham o DDL PostgreSQL da especificação técnica.
 */

export type RiskLevel = "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";

export interface Empresa {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  data_abertura: string;
  capital_social: number;
  cnae_principal: string;
  cnae_descricao: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  latitude: number;
  longitude: number;
  status_localizacao:
    | "NAO_VALIDADO"
    | "ESTABELECIMENTO_CONFIRMADO"
    | "RESIDENCIA_UNIFAMILIAR"
    | "LOTE_VAGO";
  places_estabelecimentos_raio_50m: number;
  fachada: "comercial" | "residencial" | "lote-vago";
}

export interface Socio {
  cnpj: string;
  nome_socio: string;
  cpf_mascarado: string;
  qualificacao_socio: string;
  data_entrada: string;
}

export interface SancaoCGU {
  tipo_sancao: "CEIS" | "CNEP" | "CEPIM";
  cpf_cnpj_sancionado: string;
  nome_sancionado: string;
  orgao_sancionador: string;
  motivo: string;
  data_inicio_sancao: string;
  data_fim_sancao?: string;
  ativo: boolean;
}

export interface Proposta {
  cnpj_fornecedor: string;
  valor_proposta: number;
  classificacao: number;
  vencedora: boolean;
  desconto_percentual: number;
}

export interface AnaliseIA {
  tem_clausulas_restritivas: boolean;
  score_restricao: number;
  motivos: string[];
  exigencias_atipicas: { clausula: string; impacto_concorrencia: string }[];
  sintese_objeto: string;
}

export interface Licitacao {
  id: string;
  numero_edital: string;
  orgao_comprador: string;
  municipio: string;
  municipio_ibge: string;
  uf: string;
  modalidade: string;
  objeto: string;
  valor_estimado: number;
  valor_homologado: number;
  data_publicacao: string;
  data_homologacao: string;
  link_edital_pdf: string;
  propostas: Proposta[];
  auditoria: {
    fator_empresa_fantasma: number;
    fator_tempo_constituicao: number;
    fator_capital_desproporcional: number;
    fator_conluio_societario: number;
    fator_clausula_restritiva: number;
    resumo_analise_ia: string;
  };
  analise_ia: AnaliseIA;
}

export const FATORES = [
  { key: "fator_empresa_fantasma", label: "Empresa de fachada / fantasma", peso: 25 },
  { key: "fator_tempo_constituicao", label: "Constituição temporal recente", peso: 20 },
  { key: "fator_capital_desproporcional", label: "Capacidade financeira incompatível", peso: 20 },
  { key: "fator_conluio_societario", label: "Vínculos societários & conluio", peso: 20 },
  { key: "fator_clausula_restritiva", label: "Direcionamento editalício (IA)", peso: 15 },
] as const;

export const FONTES_DADOS = [
  { sigla: "Transferegov / Portal da Transparência", orgao: "MGI" },
  { sigla: "CNPJ Aberto & QSA", orgao: "Receita Federal" },
  { sigla: "CEIS", orgao: "CGU" },
  { sigla: "CNEP", orgao: "CGU" },
  { sigla: "CEPIM", orgao: "CGU" },
];

export const empresas: Empresa[] = [
  {
    cnpj: "48213774000119",
    razao_social: "Nova Aurora Suprimentos e Serviços LTDA",
    nome_fantasia: "Nova Aurora",
    data_abertura: "2024-11-18",
    capital_social: 30000,
    cnae_principal: "4649408",
    cnae_descricao: "Comércio atacadista de produtos de higiene e limpeza",
    logradouro: "Rua das Acácias",
    numero: "148",
    bairro: "Jardim Palmeiras",
    municipio: "Feira de Santana",
    uf: "BA",
    cep: "44085120",
    latitude: -12.2578431,
    longitude: -38.9662104,
    status_localizacao: "LOTE_VAGO",
    places_estabelecimentos_raio_50m: 0,
    fachada: "lote-vago",
  },
  {
    cnpj: "31904557000162",
    razao_social: "Construtora Vale Central Engenharia LTDA",
    data_abertura: "2018-03-06",
    capital_social: 1800000,
    cnae_principal: "4120400",
    cnae_descricao: "Construção de edifícios",
    logradouro: "Avenida Sete de Setembro",
    numero: "2210",
    bairro: "Centro",
    municipio: "Salvador",
    uf: "BA",
    cep: "40080002",
    latitude: -12.9812,
    longitude: -38.5124,
    status_localizacao: "ESTABELECIMENTO_CONFIRMADO",
    places_estabelecimentos_raio_50m: 4,
    fachada: "comercial",
  },
  {
    cnpj: "55120388000104",
    razao_social: "Meridiano Tecnologia da Informação LTDA",
    data_abertura: "2025-04-02",
    capital_social: 60000,
    cnae_principal: "6209100",
    cnae_descricao: "Suporte técnico e manutenção em tecnologia da informação",
    logradouro: "Rua Coronel Bento",
    numero: "77",
    bairro: "Vila Nova",
    municipio: "Anápolis",
    uf: "GO",
    cep: "75024310",
    latitude: -16.3281,
    longitude: -48.9531,
    status_localizacao: "RESIDENCIA_UNIFAMILIAR",
    places_estabelecimentos_raio_50m: 0,
    fachada: "residencial",
  },
  {
    cnpj: "55120901000188",
    razao_social: "Horizonte Digital Comércio de Equipamentos LTDA",
    data_abertura: "2025-04-09",
    capital_social: 50000,
    cnae_principal: "4751201",
    cnae_descricao: "Comércio varejista especializado de equipamentos de informática",
    logradouro: "Rua Coronel Bento",
    numero: "77",
    bairro: "Vila Nova",
    municipio: "Anápolis",
    uf: "GO",
    cep: "75024310",
    latitude: -16.3281,
    longitude: -48.9531,
    status_localizacao: "RESIDENCIA_UNIFAMILIAR",
    places_estabelecimentos_raio_50m: 0,
    fachada: "residencial",
  },
  {
    cnpj: "09338771000145",
    razao_social: "Sul Alimentos Distribuidora S/A",
    data_abertura: "2009-07-21",
    capital_social: 4500000,
    cnae_principal: "4639701",
    cnae_descricao: "Comércio atacadista de produtos alimentícios",
    logradouro: "Rodovia BR-116",
    numero: "4550",
    bairro: "Distrito Industrial",
    municipio: "Curitiba",
    uf: "PR",
    cep: "81690000",
    latitude: -25.5211,
    longitude: -49.2312,
    status_localizacao: "ESTABELECIMENTO_CONFIRMADO",
    places_estabelecimentos_raio_50m: 6,
    fachada: "comercial",
  },
  {
    cnpj: "27655102000133",
    razao_social: "Prisma Saúde Equipamentos Hospitalares LTDA",
    data_abertura: "2017-01-30",
    capital_social: 220000,
    cnae_principal: "4645101",
    cnae_descricao: "Comércio atacadista de instrumentos e materiais hospitalares",
    logradouro: "Rua Padre Feijó",
    numero: "301",
    bairro: "Canela",
    municipio: "Recife",
    uf: "PE",
    cep: "50070000",
    latitude: -8.0578,
    longitude: -34.8829,
    status_localizacao: "ESTABELECIMENTO_CONFIRMADO",
    places_estabelecimentos_raio_50m: 3,
    fachada: "comercial",
  },
  {
    cnpj: "41287330000170",
    razao_social: "Instituto Progresso Social e Cultural",
    data_abertura: "2021-02-15",
    capital_social: 12000,
    cnae_principal: "9430800",
    cnae_descricao: "Atividades de associações de defesa de direitos sociais",
    logradouro: "Travessa São Lucas",
    numero: "12",
    bairro: "Cidade Alta",
    municipio: "Natal",
    uf: "RN",
    cep: "59025000",
    latitude: -5.7793,
    longitude: -35.2004,
    status_localizacao: "RESIDENCIA_UNIFAMILIAR",
    places_estabelecimentos_raio_50m: 1,
    fachada: "residencial",
  },
  {
    cnpj: "17402998000110",
    razao_social: "Rota Sul Transportes e Locação LTDA",
    data_abertura: "2013-09-11",
    capital_social: 900000,
    cnae_principal: "4930202",
    cnae_descricao: "Transporte rodoviário de carga",
    logradouro: "Avenida Assis Brasil",
    numero: "7300",
    bairro: "Sarandi",
    municipio: "Porto Alegre",
    uf: "RS",
    cep: "91110000",
    latitude: -30.0031,
    longitude: -51.1789,
    status_localizacao: "ESTABELECIMENTO_CONFIRMADO",
    places_estabelecimentos_raio_50m: 5,
    fachada: "comercial",
  },
  {
    cnpj: "50771204000191",
    razao_social: "Alfa Norte Engenharia e Pavimentação LTDA",
    data_abertura: "2024-08-27",
    capital_social: 100000,
    cnae_principal: "4211101",
    cnae_descricao: "Construção de rodovias e ferrovias",
    logradouro: "Rua Belém",
    numero: "560",
    bairro: "Adrianópolis",
    municipio: "Manaus",
    uf: "AM",
    cep: "69057000",
    latitude: -3.1019,
    longitude: -60.0181,
    status_localizacao: "LOTE_VAGO",
    places_estabelecimentos_raio_50m: 0,
    fachada: "lote-vago",
  },
  {
    cnpj: "50771477000123",
    razao_social: "Terra Firme Obras e Serviços LTDA",
    data_abertura: "2024-09-03",
    capital_social: 80000,
    cnae_principal: "4213800",
    cnae_descricao: "Obras de urbanização",
    logradouro: "Rua Belém",
    numero: "560",
    bairro: "Adrianópolis",
    municipio: "Manaus",
    uf: "AM",
    cep: "69057000",
    latitude: -3.1019,
    longitude: -60.0181,
    status_localizacao: "LOTE_VAGO",
    places_estabelecimentos_raio_50m: 0,
    fachada: "lote-vago",
  },
  {
    cnpj: "22988103000155",
    razao_social: "Papelaria Central Comércio e Serviços LTDA",
    data_abertura: "2015-06-19",
    capital_social: 350000,
    cnae_principal: "4761003",
    cnae_descricao: "Comércio varejista de artigos de papelaria",
    logradouro: "Rua XV de Novembro",
    numero: "812",
    bairro: "Centro",
    municipio: "Campinas",
    uf: "SP",
    cep: "13010000",
    latitude: -22.9056,
    longitude: -47.0608,
    status_localizacao: "ESTABELECIMENTO_CONFIRMADO",
    places_estabelecimentos_raio_50m: 8,
    fachada: "comercial",
  },
  {
    cnpj: "33716840000109",
    razao_social: "Aliança Serviços Terceirizados LTDA",
    data_abertura: "2019-05-08",
    capital_social: 140000,
    cnae_principal: "8011102",
    cnae_descricao: "Serviços de vigilância e segurança privada",
    logradouro: "Avenida Afonso Pena",
    numero: "1900",
    bairro: "Centro",
    municipio: "Belo Horizonte",
    uf: "MG",
    cep: "30130000",
    latitude: -19.9245,
    longitude: -43.9352,
    status_localizacao: "ESTABELECIMENTO_CONFIRMADO",
    places_estabelecimentos_raio_50m: 7,
    fachada: "comercial",
  },
];

export const socios: Socio[] = [
  {
    cnpj: "48213774000119",
    nome_socio: "MARCOS ANTONIO DE SOUZA",
    cpf_mascarado: "***.412.885-**",
    qualificacao_socio: "Sócio-Administrador",
    data_entrada: "2024-11-18",
  },
  {
    cnpj: "48213774000119",
    nome_socio: "ELIANE ROCHA SOUZA",
    cpf_mascarado: "***.771.220-**",
    qualificacao_socio: "Sócia",
    data_entrada: "2024-11-18",
  },
  {
    cnpj: "31904557000162",
    nome_socio: "RICARDO PEREIRA LIMA",
    cpf_mascarado: "***.005.334-**",
    qualificacao_socio: "Sócio-Administrador",
    data_entrada: "2018-03-06",
  },
  {
    cnpj: "55120388000104",
    nome_socio: "JULIANA MENDES TAVARES",
    cpf_mascarado: "***.318.907-**",
    qualificacao_socio: "Sócia-Administradora",
    data_entrada: "2025-04-02",
  },
  {
    cnpj: "55120388000104",
    nome_socio: "PAULO HENRIQUE TAVARES",
    cpf_mascarado: "***.652.148-**",
    qualificacao_socio: "Sócio",
    data_entrada: "2025-04-02",
  },
  {
    cnpj: "55120901000188",
    nome_socio: "PAULO HENRIQUE TAVARES",
    cpf_mascarado: "***.652.148-**",
    qualificacao_socio: "Sócio-Administrador",
    data_entrada: "2025-04-09",
  },
  {
    cnpj: "55120901000188",
    nome_socio: "CARLA TAVARES DE ASSIS",
    cpf_mascarado: "***.909.771-**",
    qualificacao_socio: "Sócia",
    data_entrada: "2025-04-09",
  },
  {
    cnpj: "09338771000145",
    nome_socio: "HELENA KOWALSKI",
    cpf_mascarado: "***.220.118-**",
    qualificacao_socio: "Diretora",
    data_entrada: "2009-07-21",
  },
  {
    cnpj: "27655102000133",
    nome_socio: "FERNANDO ALVES DE MELO",
    cpf_mascarado: "***.884.006-**",
    qualificacao_socio: "Sócio-Administrador",
    data_entrada: "2017-01-30",
  },
  {
    cnpj: "41287330000170",
    nome_socio: "SANDRA REGINA BATISTA",
    cpf_mascarado: "***.117.554-**",
    qualificacao_socio: "Presidente",
    data_entrada: "2021-02-15",
  },
  {
    cnpj: "17402998000110",
    nome_socio: "GILBERTO SCHNEIDER",
    cpf_mascarado: "***.443.201-**",
    qualificacao_socio: "Sócio-Administrador",
    data_entrada: "2013-09-11",
  },
  {
    cnpj: "50771204000191",
    nome_socio: "ANDRE LUIZ FONSECA",
    cpf_mascarado: "***.556.019-**",
    qualificacao_socio: "Sócio-Administrador",
    data_entrada: "2024-08-27",
  },
  {
    cnpj: "50771204000191",
    nome_socio: "TEREZA FONSECA DA CRUZ",
    cpf_mascarado: "***.008.472-**",
    qualificacao_socio: "Sócia",
    data_entrada: "2024-08-27",
  },
  {
    cnpj: "50771477000123",
    nome_socio: "ANDRE LUIZ FONSECA",
    cpf_mascarado: "***.556.019-**",
    qualificacao_socio: "Procurador",
    data_entrada: "2024-09-03",
  },
  {
    cnpj: "50771477000123",
    nome_socio: "MARIA DO CARMO FONSECA",
    cpf_mascarado: "***.774.330-**",
    qualificacao_socio: "Sócia-Administradora",
    data_entrada: "2024-09-03",
  },
  {
    cnpj: "22988103000155",
    nome_socio: "LUCIA HELENA PRADO",
    cpf_mascarado: "***.661.900-**",
    qualificacao_socio: "Sócia-Administradora",
    data_entrada: "2015-06-19",
  },
  {
    cnpj: "33716840000109",
    nome_socio: "ROBERTO CARLOS DIAS",
    cpf_mascarado: "***.339.812-**",
    qualificacao_socio: "Sócio-Administrador",
    data_entrada: "2019-05-08",
  },
];

export const sancoes: SancaoCGU[] = [
  {
    tipo_sancao: "CEIS",
    cpf_cnpj_sancionado: "48213774000119",
    nome_sancionado: "Nova Aurora Suprimentos e Serviços LTDA",
    orgao_sancionador: "Prefeitura Municipal de Feira de Santana (BA)",
    motivo: "Impedimento de licitar — fraude na execução de contrato (art. 156, III, Lei 14.133/2021)",
    data_inicio_sancao: "2026-01-12",
    data_fim_sancao: "2028-01-12",
    ativo: true,
  },
  {
    tipo_sancao: "CNEP",
    cpf_cnpj_sancionado: "50771204000191",
    nome_sancionado: "Alfa Norte Engenharia e Pavimentação LTDA",
    orgao_sancionador: "Controladoria-Geral do Estado do Amazonas",
    motivo: "Ato lesivo à administração pública — Lei 12.846/2013, multa aplicada",
    data_inicio_sancao: "2026-03-04",
    ativo: true,
  },
  {
    tipo_sancao: "CEPIM",
    cpf_cnpj_sancionado: "41287330000170",
    nome_sancionado: "Instituto Progresso Social e Cultural",
    orgao_sancionador: "Ministério da Cidadania",
    motivo: "Impedimento para celebração de convênios — prestação de contas rejeitada",
    data_inicio_sancao: "2025-08-19",
    ativo: true,
  },
  {
    tipo_sancao: "CEIS",
    cpf_cnpj_sancionado: "27655102000133",
    nome_sancionado: "Prisma Saúde Equipamentos Hospitalares LTDA",
    orgao_sancionador: "Ministério da Saúde",
    motivo: "Suspensão temporária — atraso injustificado na entrega (sanção encerrada)",
    data_inicio_sancao: "2022-05-10",
    data_fim_sancao: "2023-05-10",
    ativo: false,
  },
];

export const licitacoes: Licitacao[] = [
  {
    id: "lic-001",
    numero_edital: "PE 041/2026",
    orgao_comprador: "Prefeitura Municipal de Feira de Santana — Secretaria de Saúde",
    municipio: "Feira de Santana",
    municipio_ibge: "2910800",
    uf: "BA",
    modalidade: "Pregão Eletrônico",
    objeto: "Aquisição de materiais de higiene e limpeza para a rede municipal de saúde",
    valor_estimado: 1450000,
    valor_homologado: 1428000,
    data_publicacao: "2026-02-10",
    data_homologacao: "2026-03-18",
    link_edital_pdf: "https://www.gov.br/transferegov/edital/pe-041-2026.pdf",
    propostas: [
      {
        cnpj_fornecedor: "48213774000119",
        valor_proposta: 1428000,
        classificacao: 1,
        vencedora: true,
        desconto_percentual: 1.52,
      },
      {
        cnpj_fornecedor: "22988103000155",
        valor_proposta: 1447500,
        classificacao: 2,
        vencedora: false,
        desconto_percentual: 0.17,
      },
    ],
    auditoria: {
      fator_empresa_fantasma: 25,
      fator_tempo_constituicao: 20,
      fator_capital_desproporcional: 20,
      fator_conluio_societario: 10,
      fator_clausula_restritiva: 13,
      resumo_analise_ia:
        "Certame com convergência de indícios graves: fornecedora aberta 84 dias antes da publicação do edital, capital social de R$ 30 mil frente a contrato de R$ 1,43 milhão (47x), endereço fiscal correspondente a lote vago sem estabelecimento indexado no raio de 50 m e sanção CEIS ativa. Recomenda-se representação imediata ao órgão de controle.",
    },
    analise_ia: {
      tem_clausulas_restritivas: true,
      score_restricao: 13,
      motivos: [
        "Exigência de atestado de capacidade técnica com quantitativo superior a 100% do objeto",
        "Prazo de entrega de 24 horas sem justificativa de urgência nos autos",
        "Especificação de embalagem que corresponde a um único fabricante",
      ],
      exigencias_atipicas: [
        {
          clausula:
            "Item 8.3.2 — apresentação de certidão de regularidade emitida por entidade privada de classe.",
          impacto_concorrencia:
            "Exigência sem previsão legal na Lei 14.133/2021; restringe participação a fornecedores previamente associados.",
        },
        {
          clausula: "Item 9.1 — entrega integral em 24 horas após a ordem de fornecimento.",
          impacto_concorrencia:
            "Inviabiliza licitantes de outras praças, favorecendo empresa local previamente estocada.",
        },
      ],
      sintese_objeto:
        "Fornecimento parcelado de materiais de higiene e limpeza por 12 meses para unidades básicas de saúde.",
    },
  },
  {
    id: "lic-002",
    numero_edital: "CC 007/2026",
    orgao_comprador: "Governo do Estado do Amazonas — Secretaria de Infraestrutura",
    municipio: "Manaus",
    municipio_ibge: "1302603",
    uf: "AM",
    modalidade: "Concorrência",
    objeto: "Pavimentação asfáltica e drenagem de vias urbanas na zona norte",
    valor_estimado: 8900000,
    valor_homologado: 8845000,
    data_publicacao: "2026-01-22",
    data_homologacao: "2026-04-02",
    link_edital_pdf: "https://www.gov.br/transferegov/edital/cc-007-2026.pdf",
    propostas: [
      {
        cnpj_fornecedor: "50771204000191",
        valor_proposta: 8845000,
        classificacao: 1,
        vencedora: true,
        desconto_percentual: 0.62,
      },
      {
        cnpj_fornecedor: "50771477000123",
        valor_proposta: 8878000,
        classificacao: 2,
        vencedora: false,
        desconto_percentual: 0.25,
      },
      {
        cnpj_fornecedor: "31904557000162",
        valor_proposta: 8720000,
        classificacao: 3,
        vencedora: false,
        desconto_percentual: 2.02,
      },
    ],
    auditoria: {
      fator_empresa_fantasma: 25,
      fator_tempo_constituicao: 20,
      fator_capital_desproporcional: 20,
      fator_conluio_societario: 20,
      fator_clausula_restritiva: 8,
      resumo_analise_ia:
        "Primeira e segunda colocadas compartilham o mesmo endereço fiscal e o sócio-administrador da vencedora figura como procurador da segunda colocada — padrão clássico de conluio para simulação de disputa. Ambas abertas em 2024, com capital social somado inferior a 3% do valor adjudicado, e vencedora sancionada no CNEP.",
    },
    analise_ia: {
      tem_clausulas_restritivas: true,
      score_restricao: 8,
      motivos: [
        "Exigência de sede ou filial no município como condição de habilitação",
        "Qualificação técnica restrita a obra de mesma natureza executada nos últimos 12 meses",
      ],
      exigencias_atipicas: [
        {
          clausula: "Item 7.4 — comprovação de sede administrativa no município de Manaus.",
          impacto_concorrencia:
            "Cláusula de localidade vedada pela jurisprudência do TCU; exclui empresas de outras unidades federativas.",
        },
      ],
      sintese_objeto:
        "Execução de 14,2 km de pavimentação asfáltica, drenagem pluvial e sinalização viária.",
    },
  },
  {
    id: "lic-003",
    numero_edital: "PE 118/2026",
    orgao_comprador: "Prefeitura Municipal de Anápolis — Secretaria de Educação",
    municipio: "Anápolis",
    municipio_ibge: "5201108",
    uf: "GO",
    modalidade: "Pregão Eletrônico",
    objeto: "Aquisição de notebooks e serviços de suporte técnico para laboratórios escolares",
    valor_estimado: 2350000,
    valor_homologado: 2298000,
    data_publicacao: "2026-05-06",
    data_homologacao: "2026-06-20",
    link_edital_pdf: "https://www.gov.br/transferegov/edital/pe-118-2026.pdf",
    propostas: [
      {
        cnpj_fornecedor: "55120388000104",
        valor_proposta: 2298000,
        classificacao: 1,
        vencedora: true,
        desconto_percentual: 2.21,
      },
      {
        cnpj_fornecedor: "55120901000188",
        valor_proposta: 2331000,
        classificacao: 2,
        vencedora: false,
        desconto_percentual: 0.81,
      },
    ],
    auditoria: {
      fator_empresa_fantasma: 18,
      fator_tempo_constituicao: 20,
      fator_capital_desproporcional: 20,
      fator_conluio_societario: 18,
      fator_clausula_restritiva: 10,
      resumo_analise_ia:
        "Duas licitantes constituídas com 7 dias de intervalo, mesmo endereço residencial e sócio em comum. Capital social de R$ 60 mil contra contrato de R$ 2,3 milhões (38x). Street View aponta residência unifamiliar sem identificação comercial.",
    },
    analise_ia: {
      tem_clausulas_restritivas: true,
      score_restricao: 10,
      motivos: [
        "Especificação técnica com combinação de atributos compatível com um único modelo de mercado",
        "Exigência de amostra física em fase preliminar de habilitação",
      ],
      exigencias_atipicas: [
        {
          clausula: "Anexo I — processador, chassi e certificação específicos de fabricante único.",
          impacto_concorrencia:
            "Direcionamento de marca vedado pelo art. 41 da Lei 14.133/2021, salvo justificativa técnica ausente nos autos.",
        },
        {
          clausula: "Item 6.7 — entrega de amostra em 3 dias na fase de habilitação.",
          impacto_concorrencia: "Onera licitantes remotos e antecipa custo não previsto em lei.",
        },
      ],
      sintese_objeto: "Fornecimento de 1.150 notebooks educacionais com garantia on-site de 36 meses.",
    },
  },
  {
    id: "lic-004",
    numero_edital: "TC 019/2026",
    orgao_comprador: "Ministério da Cidadania — Coordenação de Parcerias",
    municipio: "Natal",
    municipio_ibge: "2408102",
    uf: "RN",
    modalidade: "Termo de Colaboração",
    objeto: "Execução de projeto socioeducativo para adolescentes em vulnerabilidade",
    valor_estimado: 780000,
    valor_homologado: 780000,
    data_publicacao: "2026-03-11",
    data_homologacao: "2026-04-25",
    link_edital_pdf: "https://www.gov.br/transferegov/edital/tc-019-2026.pdf",
    propostas: [
      {
        cnpj_fornecedor: "41287330000170",
        valor_proposta: 780000,
        classificacao: 1,
        vencedora: true,
        desconto_percentual: 0,
      },
    ],
    auditoria: {
      fator_empresa_fantasma: 15,
      fator_tempo_constituicao: 6,
      fator_capital_desproporcional: 20,
      fator_conluio_societario: 6,
      fator_clausula_restritiva: 9,
      resumo_analise_ia:
        "Entidade com impedimento ativo no CEPIM celebrando termo de colaboração de R$ 780 mil. Sede corresponde a imóvel residencial sem estrutura compatível com o plano de trabalho apresentado. Chamamento público com um único proponente.",
    },
    analise_ia: {
      tem_clausulas_restritivas: true,
      score_restricao: 9,
      motivos: [
        "Chamamento com prazo de 5 dias para apresentação de propostas",
        "Exigência de experiência prévia com o próprio órgão concedente",
      ],
      exigencias_atipicas: [
        {
          clausula: "Item 4.2 — comprovação de parceria anterior com o concedente.",
          impacto_concorrencia:
            "Restringe o universo de OSCs elegíveis a parceiras históricas do próprio órgão.",
        },
      ],
      sintese_objeto:
        "Atendimento socioeducativo a 400 adolescentes em contraturno escolar por 12 meses.",
    },
  },
  {
    id: "lic-005",
    numero_edital: "PE 233/2026",
    orgao_comprador: "Prefeitura Municipal de Recife — Secretaria de Saúde",
    municipio: "Recife",
    municipio_ibge: "2611606",
    uf: "PE",
    modalidade: "Pregão Eletrônico",
    objeto: "Aquisição de equipamentos hospitalares para unidades de pronto atendimento",
    valor_estimado: 5600000,
    valor_homologado: 5210000,
    data_publicacao: "2026-04-14",
    data_homologacao: "2026-06-02",
    link_edital_pdf: "https://www.gov.br/transferegov/edital/pe-233-2026.pdf",
    propostas: [
      {
        cnpj_fornecedor: "27655102000133",
        valor_proposta: 5210000,
        classificacao: 1,
        vencedora: true,
        desconto_percentual: 6.96,
      },
      {
        cnpj_fornecedor: "09338771000145",
        valor_proposta: 5390000,
        classificacao: 2,
        vencedora: false,
        desconto_percentual: 3.75,
      },
      {
        cnpj_fornecedor: "22988103000155",
        valor_proposta: 5480000,
        classificacao: 3,
        vencedora: false,
        desconto_percentual: 2.14,
      },
    ],
    auditoria: {
      fator_empresa_fantasma: 2,
      fator_tempo_constituicao: 0,
      fator_capital_desproporcional: 20,
      fator_conluio_societario: 4,
      fator_clausula_restritiva: 6,
      resumo_analise_ia:
        "Fornecedora estabelecida e com fachada comercial confirmada, porém capital social de R$ 220 mil representa 4% do valor adjudicado (23x de desproporção). Registra sanção CEIS já encerrada em 2023. Disputa efetiva com três licitantes e desconto relevante.",
    },
    analise_ia: {
      tem_clausulas_restritivas: true,
      score_restricao: 6,
      motivos: ["Exigência de assistência técnica autorizada na capital do estado"],
      exigencias_atipicas: [
        {
          clausula: "Item 10.2 — rede autorizada de assistência técnica sediada em Recife.",
          impacto_concorrencia:
            "Restringe parcialmente a concorrência, mas guarda relação com a criticidade do equipamento.",
        },
      ],
      sintese_objeto:
        "Aquisição de 38 equipamentos hospitalares (monitores, ventiladores e desfibriladores) com instalação.",
    },
  },
  {
    id: "lic-006",
    numero_edital: "PE 075/2026",
    orgao_comprador: "Prefeitura Municipal de Belo Horizonte — Administração",
    municipio: "Belo Horizonte",
    municipio_ibge: "3106200",
    uf: "MG",
    modalidade: "Pregão Eletrônico",
    objeto: "Contratação de serviços continuados de vigilância patrimonial armada",
    valor_estimado: 4200000,
    valor_homologado: 4085000,
    data_publicacao: "2026-02-27",
    data_homologacao: "2026-04-10",
    link_edital_pdf: "https://www.gov.br/transferegov/edital/pe-075-2026.pdf",
    propostas: [
      {
        cnpj_fornecedor: "33716840000109",
        valor_proposta: 4085000,
        classificacao: 1,
        vencedora: true,
        desconto_percentual: 2.74,
      },
      {
        cnpj_fornecedor: "17402998000110",
        valor_proposta: 4150000,
        classificacao: 2,
        vencedora: false,
        desconto_percentual: 1.19,
      },
    ],
    auditoria: {
      fator_empresa_fantasma: 0,
      fator_tempo_constituicao: 0,
      fator_capital_desproporcional: 20,
      fator_conluio_societario: 5,
      fator_clausula_restritiva: 7,
      resumo_analise_ia:
        "Serviço continuado com desproporção esperada entre capital social e valor global plurianual. Sem sanções, endereço comercial confirmado e disputa com desconto compatível. Alerta moderado para exigência de habilitação técnica acima do usual.",
    },
    analise_ia: {
      tem_clausulas_restritivas: true,
      score_restricao: 7,
      motivos: ["Atestado exigindo efetivo superior ao contratado no objeto"],
      exigencias_atipicas: [
        {
          clausula: "Item 8.1 — atestado com 120 postos de vigilância simultâneos.",
          impacto_concorrencia:
            "Quantitativo acima do objeto licitado (86 postos); reduz o universo de licitantes.",
        },
      ],
      sintese_objeto: "Vigilância armada em 86 postos por 12 meses, prorrogáveis.",
    },
  },
  {
    id: "lic-007",
    numero_edital: "PE 302/2026",
    orgao_comprador: "Governo do Estado do Paraná — Secretaria de Educação",
    municipio: "Curitiba",
    municipio_ibge: "4106902",
    uf: "PR",
    modalidade: "Pregão Eletrônico",
    objeto: "Aquisição de gêneros alimentícios para a merenda escolar da rede estadual",
    valor_estimado: 12400000,
    valor_homologado: 11180000,
    data_publicacao: "2026-01-15",
    data_homologacao: "2026-03-05",
    link_edital_pdf: "https://www.gov.br/transferegov/edital/pe-302-2026.pdf",
    propostas: [
      {
        cnpj_fornecedor: "09338771000145",
        valor_proposta: 11180000,
        classificacao: 1,
        vencedora: true,
        desconto_percentual: 9.84,
      },
      {
        cnpj_fornecedor: "22988103000155",
        valor_proposta: 11890000,
        classificacao: 2,
        vencedora: false,
        desconto_percentual: 4.11,
      },
    ],
    auditoria: {
      fator_empresa_fantasma: 0,
      fator_tempo_constituicao: 0,
      fator_capital_desproporcional: 8,
      fator_conluio_societario: 0,
      fator_clausula_restritiva: 2,
      resumo_analise_ia:
        "Certame íntegro: fornecedora com 16 anos de atividade, capital social robusto, sede industrial confirmada por Places API e desconto de 9,8% frente ao estimado. Nenhuma cláusula restritiva relevante identificada.",
    },
    analise_ia: {
      tem_clausulas_restritivas: false,
      score_restricao: 2,
      motivos: [],
      exigencias_atipicas: [],
      sintese_objeto:
        "Fornecimento de gêneros alimentícios não perecíveis e hortifruti para 1.200 escolas.",
    },
  },
  {
    id: "lic-008",
    numero_edital: "PE 058/2026",
    orgao_comprador: "Prefeitura Municipal de Porto Alegre — Secretaria de Obras",
    municipio: "Porto Alegre",
    municipio_ibge: "4314902",
    uf: "RS",
    modalidade: "Pregão Eletrônico",
    objeto: "Locação de caminhões e equipamentos para serviços de manutenção urbana",
    valor_estimado: 3150000,
    valor_homologado: 2980000,
    data_publicacao: "2026-03-02",
    data_homologacao: "2026-04-18",
    link_edital_pdf: "https://www.gov.br/transferegov/edital/pe-058-2026.pdf",
    propostas: [
      {
        cnpj_fornecedor: "17402998000110",
        valor_proposta: 2980000,
        classificacao: 1,
        vencedora: true,
        desconto_percentual: 5.4,
      },
      {
        cnpj_fornecedor: "31904557000162",
        valor_proposta: 3090000,
        classificacao: 2,
        vencedora: false,
        desconto_percentual: 1.9,
      },
    ],
    auditoria: {
      fator_empresa_fantasma: 0,
      fator_tempo_constituicao: 0,
      fator_capital_desproporcional: 6,
      fator_conluio_societario: 2,
      fator_clausula_restritiva: 3,
      resumo_analise_ia:
        "Contratação regular. Frota própria comprovada, capital social de R$ 900 mil e disputa com desconto de 5,4%. Sem indícios de direcionamento ou vínculo entre licitantes.",
    },
    analise_ia: {
      tem_clausulas_restritivas: false,
      score_restricao: 3,
      motivos: [],
      exigencias_atipicas: [],
      sintese_objeto: "Locação de 22 veículos e equipamentos com operador por 12 meses.",
    },
  },
  {
    id: "lic-009",
    numero_edital: "DL 014/2026",
    orgao_comprador: "Prefeitura Municipal de Campinas — Secretaria de Administração",
    municipio: "Campinas",
    municipio_ibge: "3509502",
    uf: "SP",
    modalidade: "Dispensa Eletrônica",
    objeto: "Aquisição de material de expediente e suprimentos de escritório",
    valor_estimado: 210000,
    valor_homologado: 198500,
    data_publicacao: "2026-05-19",
    data_homologacao: "2026-06-04",
    link_edital_pdf: "https://www.gov.br/transferegov/edital/dl-014-2026.pdf",
    propostas: [
      {
        cnpj_fornecedor: "22988103000155",
        valor_proposta: 198500,
        classificacao: 1,
        vencedora: true,
        desconto_percentual: 5.48,
      },
    ],
    auditoria: {
      fator_empresa_fantasma: 0,
      fator_tempo_constituicao: 0,
      fator_capital_desproporcional: 0,
      fator_conluio_societario: 0,
      fator_clausula_restritiva: 4,
      resumo_analise_ia:
        "Dispensa de baixo vulto dentro dos limites legais. Fornecedora com 11 anos de atuação e capital social superior ao valor contratado. Risco residual apenas pela ausência de disputa, inerente à modalidade.",
    },
    analise_ia: {
      tem_clausulas_restritivas: false,
      score_restricao: 4,
      motivos: [],
      exigencias_atipicas: [],
      sintese_objeto: "Aquisição pontual de material de expediente para 34 unidades administrativas.",
    },
  },
  {
    id: "lic-010",
    numero_edital: "CC 022/2026",
    orgao_comprador: "Governo do Estado da Bahia — Secretaria de Infraestrutura",
    municipio: "Salvador",
    municipio_ibge: "2927408",
    uf: "BA",
    modalidade: "Concorrência",
    objeto: "Construção de unidade escolar de tempo integral com 18 salas de aula",
    valor_estimado: 15800000,
    valor_homologado: 15240000,
    data_publicacao: "2026-02-05",
    data_homologacao: "2026-05-12",
    link_edital_pdf: "https://www.gov.br/transferegov/edital/cc-022-2026.pdf",
    propostas: [
      {
        cnpj_fornecedor: "31904557000162",
        valor_proposta: 15240000,
        classificacao: 1,
        vencedora: true,
        desconto_percentual: 3.54,
      },
      {
        cnpj_fornecedor: "50771477000123",
        valor_proposta: 15690000,
        classificacao: 2,
        vencedora: false,
        desconto_percentual: 0.7,
      },
    ],
    auditoria: {
      fator_empresa_fantasma: 0,
      fator_tempo_constituicao: 0,
      fator_capital_desproporcional: 12,
      fator_conluio_societario: 8,
      fator_clausula_restritiva: 5,
      resumo_analise_ia:
        "Obra de grande vulto com vencedora estabelecida e sede confirmada. Alerta moderado: segunda colocada integra grupo com indícios de conluio em outro certame do radar, e relação capital/contrato de 8,5x.",
    },
    analise_ia: {
      tem_clausulas_restritivas: false,
      score_restricao: 5,
      motivos: [],
      exigencias_atipicas: [],
      sintese_objeto:
        "Construção de 4.800 m² de área edificada, quadra coberta e laboratórios, prazo de 18 meses.",
    },
  },
];

export function scoreOf(l: Licitacao): number {
  const a = l.auditoria;
  return (
    a.fator_empresa_fantasma +
    a.fator_tempo_constituicao +
    a.fator_capital_desproporcional +
    a.fator_conluio_societario +
    a.fator_clausula_restritiva
  );
}

export function riskLevelOf(score: number): RiskLevel {
  if (score >= 80) return "CRITICO";
  if (score >= 60) return "ALTO";
  if (score >= 30) return "MEDIO";
  return "BAIXO";
}

export const RISK_META: Record<
  RiskLevel,
  { label: string; faixa: string; token: string; soft: string }
> = {
  BAIXO: { label: "Baixo", faixa: "0–29", token: "risk-low", soft: "risk-low-soft" },
  MEDIO: { label: "Moderado", faixa: "30–59", token: "risk-medium", soft: "risk-medium-soft" },
  ALTO: { label: "Alto", faixa: "60–79", token: "risk-high", soft: "risk-high-soft" },
  CRITICO: {
    label: "Crítico",
    faixa: "80–100",
    token: "risk-critical",
    soft: "risk-critical-soft",
  },
};

export function empresaByCnpj(cnpj: string): Empresa | undefined {
  return empresas.find((e) => e.cnpj === cnpj);
}

export function sociosByCnpj(cnpj: string): Socio[] {
  return socios.filter((s) => s.cnpj === cnpj);
}

export function sancoesByCnpj(cnpj: string): SancaoCGU[] {
  return sancoes.filter((s) => s.cpf_cnpj_sancionado === cnpj);
}

export function vencedora(l: Licitacao): Proposta {
  return (l.propostas.find((p) => p.vencedora) ?? l.propostas[0]) as Proposta;
}

export function diasEntre(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function formatBRL(v: number, compact = false): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(v);
}

export function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR");
}

/** Pares de licitantes com sócio ou endereço em comum (base do grafo de conluio). */
export interface VinculoAresta {
  a: string;
  b: string;
  tipo: "socio_comum" | "endereco_comum";
  detalhe: string;
  licitacao?: string | undefined;
}

export function arestasVinculos(): VinculoAresta[] {
  const out: VinculoAresta[] = [];
  for (let i = 0; i < empresas.length; i++) {
    for (let j = i + 1; j < empresas.length; j++) {
      const e1 = empresas[i] as Empresa;
      const e2 = empresas[j] as Empresa;
      const s1 = sociosByCnpj(e1.cnpj);
      const s2 = sociosByCnpj(e2.cnpj);
      const comum = s1.find((s) => s2.some((o) => o.cpf_mascarado === s.cpf_mascarado));
      const certame = licitacoes.find(
        (l) =>
          l.propostas.some((p) => p.cnpj_fornecedor === e1.cnpj) &&
          l.propostas.some((p) => p.cnpj_fornecedor === e2.cnpj),
      );
      if (comum) {
        out.push({
          a: e1.cnpj,
          b: e2.cnpj,
          tipo: "socio_comum",
          detalhe: `Sócio em comum: ${comum.nome_socio} (${comum.cpf_mascarado})`,
          licitacao: certame?.numero_edital,
        });
      } else if (
        e1.cep === e2.cep &&
        e1.numero === e2.numero &&
        e1.logradouro === e2.logradouro
      ) {
        out.push({
          a: e1.cnpj,
          b: e2.cnpj,
          tipo: "endereco_comum",
          detalhe: `Mesmo endereço fiscal: ${e1.logradouro}, ${e1.numero} — ${e1.municipio}/${e1.uf}`,
          licitacao: certame?.numero_edital,
        });
      }
    }
  }
  return out;
}
