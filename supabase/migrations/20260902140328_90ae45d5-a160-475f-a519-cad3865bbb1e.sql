create table public.empresas (
  cnpj text primary key,
  razao_social text not null,
  nome_fantasia text,
  data_abertura date not null,
  capital_social numeric(14,2) not null default 0,
  cnae_principal text not null,
  cnae_descricao text not null,
  logradouro text not null,
  numero text not null,
  bairro text not null,
  municipio text not null,
  uf text not null,
  cep text not null,
  latitude double precision not null,
  longitude double precision not null,
  status_localizacao text not null default 'NAO_VALIDADO',
  places_estabelecimentos_raio_50m integer not null default 0,
  fachada text not null default 'comercial',
  created_at timestamptz not null default now()
);
grant select on public.empresas to anon, authenticated;
grant all on public.empresas to service_role;
alter table public.empresas enable row level security;
create policy "Empresas sao dados publicos" on public.empresas for select to anon, authenticated using (true);

create table public.socios (
  id uuid primary key default gen_random_uuid(),
  cnpj text not null references public.empresas(cnpj) on delete cascade,
  nome_socio text not null,
  cpf_mascarado text not null,
  qualificacao_socio text not null,
  data_entrada date not null
);
create index socios_cnpj_idx on public.socios (cnpj);
grant select on public.socios to anon, authenticated;
grant all on public.socios to service_role;
alter table public.socios enable row level security;
create policy "QSA e dado publico" on public.socios for select to anon, authenticated using (true);

create table public.sancoes_cgu (
  id uuid primary key default gen_random_uuid(),
  tipo_sancao text not null,
  cpf_cnpj_sancionado text not null,
  nome_sancionado text not null,
  orgao_sancionador text not null,
  motivo text not null,
  data_inicio_sancao date not null,
  data_fim_sancao date,
  ativo boolean not null default true
);
create index sancoes_cgu_doc_idx on public.sancoes_cgu (cpf_cnpj_sancionado);
grant select on public.sancoes_cgu to anon, authenticated;
grant all on public.sancoes_cgu to service_role;
alter table public.sancoes_cgu enable row level security;
create policy "Sancoes CGU sao publicas" on public.sancoes_cgu for select to anon, authenticated using (true);

create table public.licitacoes (
  id text primary key,
  numero_edital text not null,
  orgao_comprador text not null,
  municipio text not null,
  municipio_ibge text not null,
  uf text not null,
  modalidade text not null,
  objeto text not null,
  valor_estimado numeric(16,2) not null,
  valor_homologado numeric(16,2) not null,
  data_publicacao date not null,
  data_homologacao date not null,
  link_edital_pdf text not null,
  created_at timestamptz not null default now()
);
grant select on public.licitacoes to anon, authenticated;
grant all on public.licitacoes to service_role;
alter table public.licitacoes enable row level security;
create policy "Licitacoes sao publicas" on public.licitacoes for select to anon, authenticated using (true);

create table public.propostas_licitacao (
  id uuid primary key default gen_random_uuid(),
  licitacao_id text not null references public.licitacoes(id) on delete cascade,
  cnpj_fornecedor text not null,
  valor_proposta numeric(16,2) not null,
  classificacao integer not null,
  vencedora boolean not null default false,
  desconto_percentual numeric(6,2) not null default 0
);
create index propostas_licitacao_lic_idx on public.propostas_licitacao (licitacao_id);
grant select on public.propostas_licitacao to anon, authenticated;
grant all on public.propostas_licitacao to service_role;
alter table public.propostas_licitacao enable row level security;
create policy "Propostas sao publicas" on public.propostas_licitacao for select to anon, authenticated using (true);

create table public.auditoria_risco (
  licitacao_id text primary key references public.licitacoes(id) on delete cascade,
  fator_empresa_fantasma integer not null default 0,
  fator_tempo_constituicao integer not null default 0,
  fator_capital_desproporcional integer not null default 0,
  fator_conluio_societario integer not null default 0,
  fator_clausula_restritiva integer not null default 0,
  resumo_analise_ia text not null default '',
  analise_ia jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
grant select on public.auditoria_risco to anon, authenticated;
grant all on public.auditoria_risco to service_role;
alter table public.auditoria_risco enable row level security;
create policy "Auditoria de risco e publica" on public.auditoria_risco for select to anon, authenticated using (true);

insert into public.empresas (cnpj, razao_social, nome_fantasia, data_abertura, capital_social, cnae_principal, cnae_descricao, logradouro, numero, bairro, municipio, uf, cep, latitude, longitude, status_localizacao, places_estabelecimentos_raio_50m, fachada) values
('48213774000119', 'Nova Aurora Suprimentos e Serviços LTDA', 'Nova Aurora', '2025-11-18', 30000, '4649408', 'Comércio atacadista de produtos de higiene e limpeza', 'Rua das Acácias', '148', 'Jardim Palmeiras', 'Feira de Santana', 'BA', '44085120', -12.2578431, -38.9662104, 'LOTE_VAGO', 0, 'lote-vago'),
('31904557000162', 'Construtora Vale Central Engenharia LTDA', null, '2018-03-06', 1800000, '4120400', 'Construção de edifícios', 'Avenida Sete de Setembro', '2210', 'Centro', 'Salvador', 'BA', '40080002', -12.9812, -38.5124, 'ESTABELECIMENTO_CONFIRMADO', 4, 'comercial'),
('55120388000104', 'Meridiano Tecnologia da Informação LTDA', null, '2025-04-02', 60000, '6209100', 'Suporte técnico e manutenção em tecnologia da informação', 'Rua Coronel Bento', '77', 'Vila Nova', 'Anápolis', 'GO', '75024310', -16.3281, -48.9531, 'RESIDENCIA_UNIFAMILIAR', 0, 'residencial'),
('55120901000188', 'Horizonte Digital Comércio de Equipamentos LTDA', null, '2025-04-09', 50000, '4751201', 'Comércio varejista especializado de equipamentos de informática', 'Rua Coronel Bento', '77', 'Vila Nova', 'Anápolis', 'GO', '75024310', -16.3281, -48.9531, 'RESIDENCIA_UNIFAMILIAR', 0, 'residencial'),
('09338771000145', 'Sul Alimentos Distribuidora S/A', null, '2009-07-21', 4500000, '4639701', 'Comércio atacadista de produtos alimentícios', 'Rodovia BR-116', '4550', 'Distrito Industrial', 'Curitiba', 'PR', '81690000', -25.5211, -49.2312, 'ESTABELECIMENTO_CONFIRMADO', 6, 'comercial'),
('27655102000133', 'Prisma Saúde Equipamentos Hospitalares LTDA', null, '2017-01-30', 220000, '4645101', 'Comércio atacadista de instrumentos e materiais hospitalares', 'Rua Padre Feijó', '301', 'Canela', 'Recife', 'PE', '50070000', -8.0578, -34.8829, 'ESTABELECIMENTO_CONFIRMADO', 3, 'comercial'),
('41287330000170', 'Instituto Progresso Social e Cultural', null, '2021-02-15', 12000, '9430800', 'Atividades de associações de defesa de direitos sociais', 'Travessa São Lucas', '12', 'Cidade Alta', 'Natal', 'RN', '59025000', -5.7793, -35.2004, 'RESIDENCIA_UNIFAMILIAR', 1, 'residencial'),
('17402998000110', 'Rota Sul Transportes e Locação LTDA', null, '2013-09-11', 900000, '4930202', 'Transporte rodoviário de carga', 'Avenida Assis Brasil', '7300', 'Sarandi', 'Porto Alegre', 'RS', '91110000', -30.0031, -51.1789, 'ESTABELECIMENTO_CONFIRMADO', 5, 'comercial'),
('50771204000191', 'Alfa Norte Engenharia e Pavimentação LTDA', null, '2024-08-27', 100000, '4211101', 'Construção de rodovias e ferrovias', 'Rua Belém', '560', 'Adrianópolis', 'Manaus', 'AM', '69057000', -3.1019, -60.0181, 'LOTE_VAGO', 0, 'lote-vago'),
('50771477000123', 'Terra Firme Obras e Serviços LTDA', null, '2024-09-03', 80000, '4213800', 'Obras de urbanização', 'Rua Belém', '560', 'Adrianópolis', 'Manaus', 'AM', '69057000', -3.1019, -60.0181, 'LOTE_VAGO', 0, 'lote-vago'),
('22988103000155', 'Papelaria Central Comércio e Serviços LTDA', null, '2015-06-19', 350000, '4761003', 'Comércio varejista de artigos de papelaria', 'Rua XV de Novembro', '812', 'Centro', 'Campinas', 'SP', '13010000', -22.9056, -47.0608, 'ESTABELECIMENTO_CONFIRMADO', 8, 'comercial'),
('33716840000109', 'Aliança Serviços Terceirizados LTDA', null, '2019-05-08', 140000, '8011102', 'Serviços de vigilância e segurança privada', 'Avenida Afonso Pena', '1900', 'Centro', 'Belo Horizonte', 'MG', '30130000', -19.9245, -43.9352, 'ESTABELECIMENTO_CONFIRMADO', 7, 'comercial');

insert into public.socios (cnpj, nome_socio, cpf_mascarado, qualificacao_socio, data_entrada) values
('48213774000119', 'MARCOS ANTONIO DE SOUZA', '***.412.885-**', 'Sócio-Administrador', '2025-11-18'),
('48213774000119', 'ELIANE ROCHA SOUZA', '***.771.220-**', 'Sócia', '2025-11-18'),
('31904557000162', 'RICARDO PEREIRA LIMA', '***.005.334-**', 'Sócio-Administrador', '2018-03-06'),
('55120388000104', 'JULIANA MENDES TAVARES', '***.318.907-**', 'Sócia-Administradora', '2025-04-02'),
('55120388000104', 'PAULO HENRIQUE TAVARES', '***.652.148-**', 'Sócio', '2025-04-02'),
('55120901000188', 'PAULO HENRIQUE TAVARES', '***.652.148-**', 'Sócio-Administrador', '2025-04-09'),
('55120901000188', 'CARLA TAVARES DE ASSIS', '***.909.771-**', 'Sócia', '2025-04-09'),
('09338771000145', 'HELENA KOWALSKI', '***.220.118-**', 'Diretora', '2009-07-21'),
('27655102000133', 'FERNANDO ALVES DE MELO', '***.884.006-**', 'Sócio-Administrador', '2017-01-30'),
('41287330000170', 'SANDRA REGINA BATISTA', '***.117.554-**', 'Presidente', '2021-02-15'),
('17402998000110', 'GILBERTO SCHNEIDER', '***.443.201-**', 'Sócio-Administrador', '2013-09-11'),
('50771204000191', 'ANDRE LUIZ FONSECA', '***.556.019-**', 'Sócio-Administrador', '2024-08-27'),
('50771204000191', 'TEREZA FONSECA DA CRUZ', '***.008.472-**', 'Sócia', '2024-08-27'),
('50771477000123', 'ANDRE LUIZ FONSECA', '***.556.019-**', 'Procurador', '2024-09-03'),
('50771477000123', 'MARIA DO CARMO FONSECA', '***.774.330-**', 'Sócia-Administradora', '2024-09-03'),
('22988103000155', 'LUCIA HELENA PRADO', '***.661.900-**', 'Sócia-Administradora', '2015-06-19'),
('33716840000109', 'ROBERTO CARLOS DIAS', '***.339.812-**', 'Sócio-Administrador', '2019-05-08');

insert into public.sancoes_cgu (tipo_sancao, cpf_cnpj_sancionado, nome_sancionado, orgao_sancionador, motivo, data_inicio_sancao, data_fim_sancao, ativo) values
('CEIS', '48213774000119', 'Nova Aurora Suprimentos e Serviços LTDA', 'Prefeitura Municipal de Feira de Santana (BA)', 'Impedimento de licitar — fraude na execução de contrato (art. 156, III, Lei 14.133/2021)', '2026-01-12', '2028-01-12', true),
('CNEP', '50771204000191', 'Alfa Norte Engenharia e Pavimentação LTDA', 'Controladoria-Geral do Estado do Amazonas', 'Ato lesivo à administração pública — Lei 12.846/2013, multa aplicada', '2026-03-04', null, true),
('CEPIM', '41287330000170', 'Instituto Progresso Social e Cultural', 'Ministério da Cidadania', 'Impedimento para celebração de convênios — prestação de contas rejeitada', '2025-08-19', null, true),
('CEIS', '27655102000133', 'Prisma Saúde Equipamentos Hospitalares LTDA', 'Ministério da Saúde', 'Suspensão temporária — atraso injustificado na entrega (sanção encerrada)', '2022-05-10', '2023-05-10', false);

insert into public.licitacoes (id, numero_edital, orgao_comprador, municipio, municipio_ibge, uf, modalidade, objeto, valor_estimado, valor_homologado, data_publicacao, data_homologacao, link_edital_pdf) values
('lic-001', 'PE 041/2026', 'Prefeitura Municipal de Feira de Santana — Secretaria de Saúde', 'Feira de Santana', '2910800', 'BA', 'Pregão Eletrônico', 'Aquisição de materiais de higiene e limpeza para a rede municipal de saúde', 1450000, 1428000, '2026-02-10', '2026-03-18', 'https://www.gov.br/transferegov/edital/pe-041-2026.pdf'),
('lic-002', 'CC 007/2026', 'Governo do Estado do Amazonas — Secretaria de Infraestrutura', 'Manaus', '1302603', 'AM', 'Concorrência', 'Pavimentação asfáltica e drenagem de vias urbanas na zona norte', 8900000, 8845000, '2026-01-22', '2026-04-02', 'https://www.gov.br/transferegov/edital/cc-007-2026.pdf'),
('lic-003', 'PE 118/2026', 'Prefeitura Municipal de Anápolis — Secretaria de Educação', 'Anápolis', '5201108', 'GO', 'Pregão Eletrônico', 'Aquisição de notebooks e serviços de suporte técnico para laboratórios escolares', 2350000, 2298000, '2026-05-06', '2026-06-20', 'https://www.gov.br/transferegov/edital/pe-118-2026.pdf'),
('lic-004', 'TC 019/2026', 'Ministério da Cidadania — Coordenação de Parcerias', 'Natal', '2408102', 'RN', 'Termo de Colaboração', 'Execução de projeto socioeducativo para adolescentes em vulnerabilidade', 780000, 780000, '2026-03-11', '2026-04-25', 'https://www.gov.br/transferegov/edital/tc-019-2026.pdf'),
('lic-005', 'PE 233/2026', 'Prefeitura Municipal de Recife — Secretaria de Saúde', 'Recife', '2611606', 'PE', 'Pregão Eletrônico', 'Aquisição de equipamentos hospitalares para unidades de pronto atendimento', 5600000, 5210000, '2026-04-14', '2026-06-02', 'https://www.gov.br/transferegov/edital/pe-233-2026.pdf'),
('lic-006', 'PE 075/2026', 'Prefeitura Municipal de Belo Horizonte — Administração', 'Belo Horizonte', '3106200', 'MG', 'Pregão Eletrônico', 'Contratação de serviços continuados de vigilância patrimonial armada', 4200000, 4085000, '2026-02-27', '2026-04-10', 'https://www.gov.br/transferegov/edital/pe-075-2026.pdf'),
('lic-007', 'PE 302/2026', 'Governo do Estado do Paraná — Secretaria de Educação', 'Curitiba', '4106902', 'PR', 'Pregão Eletrônico', 'Aquisição de gêneros alimentícios para a merenda escolar da rede estadual', 12400000, 11180000, '2026-01-15', '2026-03-05', 'https://www.gov.br/transferegov/edital/pe-302-2026.pdf'),
('lic-008', 'PE 058/2026', 'Prefeitura Municipal de Porto Alegre — Secretaria de Obras', 'Porto Alegre', '4314902', 'RS', 'Pregão Eletrônico', 'Locação de caminhões e equipamentos para serviços de manutenção urbana', 3150000, 2980000, '2026-03-02', '2026-04-18', 'https://www.gov.br/transferegov/edital/pe-058-2026.pdf'),
('lic-009', 'DL 014/2026', 'Prefeitura Municipal de Campinas — Secretaria de Administração', 'Campinas', '3509502', 'SP', 'Dispensa Eletrônica', 'Aquisição de material de expediente e suprimentos de escritório', 210000, 198500, '2026-05-19', '2026-06-04', 'https://www.gov.br/transferegov/edital/dl-014-2026.pdf'),
('lic-010', 'CC 022/2026', 'Governo do Estado da Bahia — Secretaria de Infraestrutura', 'Salvador', '2927408', 'BA', 'Concorrência', 'Construção de unidade escolar de tempo integral com 18 salas de aula', 15800000, 15240000, '2026-02-05', '2026-05-12', 'https://www.gov.br/transferegov/edital/cc-022-2026.pdf');

insert into public.propostas_licitacao (licitacao_id, cnpj_fornecedor, valor_proposta, classificacao, vencedora, desconto_percentual) values
('lic-001', '48213774000119', 1428000, 1, true, 1.52),
('lic-001', '22988103000155', 1447500, 2, false, 0.17),
('lic-002', '50771204000191', 8845000, 1, true, 0.62),
('lic-002', '50771477000123', 8878000, 2, false, 0.25),
('lic-002', '31904557000162', 8720000, 3, false, 2.02),
('lic-003', '55120388000104', 2298000, 1, true, 2.21),
('lic-003', '55120901000188', 2331000, 2, false, 0.81),
('lic-004', '41287330000170', 780000, 1, true, 0),
('lic-005', '27655102000133', 5210000, 1, true, 6.96),
('lic-005', '09338771000145', 5390000, 2, false, 3.75),
('lic-005', '22988103000155', 5480000, 3, false, 2.14),
('lic-006', '33716840000109', 4085000, 1, true, 2.74),
('lic-006', '17402998000110', 4150000, 2, false, 1.19),
('lic-007', '09338771000145', 11180000, 1, true, 9.84),
('lic-007', '22988103000155', 11890000, 2, false, 4.11),
('lic-008', '17402998000110', 2980000, 1, true, 5.4),
('lic-008', '31904557000162', 3090000, 2, false, 1.9),
('lic-009', '22988103000155', 198500, 1, true, 5.48),
('lic-010', '31904557000162', 15240000, 1, true, 3.54),
('lic-010', '50771477000123', 15690000, 2, false, 0.7);

insert into public.auditoria_risco (licitacao_id, fator_empresa_fantasma, fator_tempo_constituicao, fator_capital_desproporcional, fator_conluio_societario, fator_clausula_restritiva, resumo_analise_ia, analise_ia) values
('lic-001', 25, 20, 20, 10, 13, 'Certame com convergência de indícios graves: fornecedora aberta 84 dias antes da publicação do edital, capital social de R$ 30 mil frente a contrato de R$ 1,43 milhão (47x), endereço fiscal correspondente a lote vago sem estabelecimento indexado no raio de 50 m e sanção CEIS ativa. Recomenda-se representação imediata ao órgão de controle.', '{"tem_clausulas_restritivas":true,"score_restricao":13,"motivos":["Exigência de atestado de capacidade técnica com quantitativo superior a 100% do objeto","Prazo de entrega de 24 horas sem justificativa de urgência nos autos","Especificação de embalagem que corresponde a um único fabricante"],"exigencias_atipicas":[{"clausula":"Item 8.3.2 — apresentação de certidão de regularidade emitida por entidade privada de classe.","impacto_concorrencia":"Exigência sem previsão legal na Lei 14.133/2021; restringe participação a fornecedores previamente associados."},{"clausula":"Item 9.1 — entrega integral em 24 horas após a ordem de fornecimento.","impacto_concorrencia":"Inviabiliza licitantes de outras praças, favorecendo empresa local previamente estocada."}],"sintese_objeto":"Fornecimento parcelado de materiais de higiene e limpeza por 12 meses para unidades básicas de saúde."}'::jsonb),
('lic-002', 25, 20, 20, 20, 8, 'Primeira e segunda colocadas compartilham o mesmo endereço fiscal e o sócio-administrador da vencedora figura como procurador da segunda colocada — padrão clássico de conluio para simulação de disputa. Ambas abertas em 2024, com capital social somado inferior a 3% do valor adjudicado, e vencedora sancionada no CNEP.', '{"tem_clausulas_restritivas":true,"score_restricao":8,"motivos":["Exigência de sede ou filial no município como condição de habilitação","Qualificação técnica restrita a obra de mesma natureza executada nos últimos 12 meses"],"exigencias_atipicas":[{"clausula":"Item 7.4 — comprovação de sede administrativa no município de Manaus.","impacto_concorrencia":"Cláusula de localidade vedada pela jurisprudência do TCU; exclui empresas de outras unidades federativas."}],"sintese_objeto":"Execução de 14,2 km de pavimentação asfáltica, drenagem pluvial e sinalização viária."}'::jsonb),
('lic-003', 18, 20, 20, 18, 10, 'Duas licitantes constituídas com 7 dias de intervalo, mesmo endereço residencial e sócio em comum. Capital social de R$ 60 mil contra contrato de R$ 2,3 milhões (38x). Street View aponta residência unifamiliar sem identificação comercial.', '{"tem_clausulas_restritivas":true,"score_restricao":10,"motivos":["Especificação técnica com combinação de atributos compatível com um único modelo de mercado","Exigência de amostra física em fase preliminar de habilitação"],"exigencias_atipicas":[{"clausula":"Anexo I — processador, chassi e certificação específicos de fabricante único.","impacto_concorrencia":"Direcionamento de marca vedado pelo art. 41 da Lei 14.133/2021, salvo justificativa técnica ausente nos autos."},{"clausula":"Item 6.7 — entrega de amostra em 3 dias na fase de habilitação.","impacto_concorrencia":"Onera licitantes remotos e antecipa custo não previsto em lei."}],"sintese_objeto":"Fornecimento de 1.150 notebooks educacionais com garantia on-site de 36 meses."}'::jsonb),
('lic-004', 15, 6, 20, 6, 9, 'Entidade com impedimento ativo no CEPIM celebrando termo de colaboração de R$ 780 mil. Sede corresponde a imóvel residencial sem estrutura compatível com o plano de trabalho apresentado. Chamamento público com um único proponente.', '{"tem_clausulas_restritivas":true,"score_restricao":9,"motivos":["Chamamento com prazo de 5 dias para apresentação de propostas","Exigência de experiência prévia com o próprio órgão concedente"],"exigencias_atipicas":[{"clausula":"Item 4.2 — comprovação de parceria anterior com o concedente.","impacto_concorrencia":"Restringe o universo de OSCs elegíveis a parceiras históricas do próprio órgão."}],"sintese_objeto":"Atendimento socioeducativo a 400 adolescentes em contraturno escolar por 12 meses."}'::jsonb),
('lic-005', 2, 0, 20, 4, 6, 'Fornecedora estabelecida e com fachada comercial confirmada, porém capital social de R$ 220 mil representa 4% do valor adjudicado (23x de desproporção). Registra sanção CEIS já encerrada em 2023. Disputa efetiva com três licitantes e desconto relevante.', '{"tem_clausulas_restritivas":true,"score_restricao":6,"motivos":["Exigência de assistência técnica autorizada na capital do estado"],"exigencias_atipicas":[{"clausula":"Item 10.2 — rede autorizada de assistência técnica sediada em Recife.","impacto_concorrencia":"Restringe parcialmente a concorrência, mas guarda relação com a criticidade do equipamento."}],"sintese_objeto":"Aquisição de 38 equipamentos hospitalares (monitores, ventiladores e desfibriladores) com instalação."}'::jsonb),
('lic-006', 0, 0, 20, 5, 7, 'Serviço continuado com desproporção esperada entre capital social e valor global plurianual. Sem sanções, endereço comercial confirmado e disputa com desconto compatível. Alerta moderado para exigência de habilitação técnica acima do usual.', '{"tem_clausulas_restritivas":true,"score_restricao":7,"motivos":["Atestado exigindo efetivo superior ao contratado no objeto"],"exigencias_atipicas":[{"clausula":"Item 8.1 — atestado com 120 postos de vigilância simultâneos.","impacto_concorrencia":"Quantitativo acima do objeto licitado (86 postos); reduz o universo de licitantes."}],"sintese_objeto":"Vigilância armada em 86 postos por 12 meses, prorrogáveis."}'::jsonb),
('lic-007', 0, 0, 8, 0, 2, 'Certame íntegro: fornecedora com 16 anos de atividade, capital social robusto, sede industrial confirmada por Places API e desconto de 9,8% frente ao estimado. Nenhuma cláusula restritiva relevante identificada.', '{"tem_clausulas_restritivas":false,"score_restricao":2,"motivos":[],"exigencias_atipicas":[],"sintese_objeto":"Fornecimento de gêneros alimentícios não perecíveis e hortifruti para 1.200 escolas."}'::jsonb),
('lic-008', 0, 0, 6, 2, 3, 'Contratação regular. Frota própria comprovada, capital social de R$ 900 mil e disputa com desconto de 5,4%. Sem indícios de direcionamento ou vínculo entre licitantes.', '{"tem_clausulas_restritivas":false,"score_restricao":3,"motivos":[],"exigencias_atipicas":[],"sintese_objeto":"Locação de 22 veículos e equipamentos com operador por 12 meses."}'::jsonb),
('lic-009', 0, 0, 0, 0, 4, 'Dispensa de baixo vulto dentro dos limites legais. Fornecedora com 11 anos de atuação e capital social superior ao valor contratado. Risco residual apenas pela ausência de disputa, inerente à modalidade.', '{"tem_clausulas_restritivas":false,"score_restricao":4,"motivos":[],"exigencias_atipicas":[],"sintese_objeto":"Aquisição pontual de material de expediente para 34 unidades administrativas."}'::jsonb),
('lic-010', 0, 0, 12, 8, 5, 'Obra de grande vulto com vencedora estabelecida e sede confirmada. Alerta moderado: segunda colocada integra grupo com indícios de conluio em outro certame do radar, e relação capital/contrato de 8,5x.', '{"tem_clausulas_restritivas":false,"score_restricao":5,"motivos":[],"exigencias_atipicas":[],"sintese_objeto":"Construção de 4.800 m² de área edificada, quadra coberta e laboratórios, prazo de 18 meses."}'::jsonb);