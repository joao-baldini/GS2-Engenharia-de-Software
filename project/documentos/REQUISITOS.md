# Requisitos do UrbanRisk

Plataforma web de acompanhamento de alagamentos, calor intenso e interrupções de serviços essenciais em São Paulo.

## Requisitos funcionais

Prioridades: **Essencial** para o fluxo central; **Importante** para recursos de apoio.

### RF01 - Consultar painel integrado

**Prioridade:** Essencial · **Telas:** T01

Apresentar eventos ativos, alertas emitidos prioritários, origens e última alteração local.

**Critério de aceite:** Painel mostra totais derivados dos mesmos registros da lista; encerrados e descartados não contam como ativos.

### RF02 - Explorar visão territorial

**Prioridade:** Essencial · **Telas:** T01

Exibir eventos ativos por bairro, categoria e acesso ao detalhe em um mapa esquemático.

**Critério de aceite:** Marcador abre o evento de maior prioridade do bairro; lista contém todos os registros. Zoom de 100% a 180% e restauração funcionam.

### RF03 - Consultar e filtrar eventos

**Prioridade:** Essencial · **Telas:** T02

Pesquisar título/bairro e filtrar tipo, estado e origem; ordenar por pontuação ou recência.

**Critério de aceite:** Filtros combinam condições; ausência de resultados permite limpar a seleção; estados finais podem ser consultados.

### RF04 - Consultar detalhe do evento

**Prioridade:** Essencial · **Telas:** T03

Apresentar descrição, bairro, horários, severidade, pessoas estimadas, estado e orientação educativa.

**Critério de aceite:** Cada evento tem rota própria e dados consistentes com a lista; endereço inexistente apresenta recuperação.

### RF05 - Explicar prioridade e confiança

**Prioridade:** Essencial · **Telas:** T02, T03, T06

Exibir faixa, pontuação, quatro fatores e confiança fixa da categoria de origem.

**Critério de aceite:** Exemplo de sensor crítico com 1.800 pessoas e até 30 minutos resulta em 98 pontos; origem e indicação de simulação permanecem visíveis.

### RF06 - Registrar ocorrência comunitária

**Prioridade:** Essencial · **Telas:** T05

Receber título, descrição, categoria, bairro, severidade e pessoas estimadas, sem cadastro.

**Critério de aceite:** Entrada válida gera ID local, origem Comunidade, confiança 60% e estado Reportado; não emite notificação imediatamente.

### RF07 - Validar o contrato de entrada

**Prioridade:** Essencial · **Telas:** T05, T07

Rejeitar campos inválidos antes de criar evento; validar valor, unidade e horário meteorológico.

**Critério de aceite:** Texto curto, bairro fora do piloto, impacto negativo/fracionado e leitura inválida geram erro, sem inventar dados ou limpar o formulário.

### RF08 - Processar sensores e boletins simulados

**Prioridade:** Essencial · **Telas:** T07

Normalizar uma leitura fictícia e percorrer validação, confirmação e classificação.

**Critério de aceite:** Um clique gera evento explicitamente simulado, explica a pontuação e cria aviso interno quando elegível.

### RF09 - Importar base pública externa

**Prioridade:** Importante · **Telas:** T07, T03

Consultar temperatura a 2 m para a Sé via Open-Meteo sob demanda, preservando fonte, leitura e horário UTC.

**Critério de aceite:** Timeout em 8 s; unidade °C e leitura de até 2 h; repetição da mesma fonte e horário é bloqueada; abaixo de 30 °C não há alerta.

### RF10 - Gerenciar ciclo de vida

**Prioridade:** Essencial · **Telas:** T03

Permitir transições do grafo UML e manter histórico com horário e motivo.

**Critério de aceite:** Relato pode ser validado, confirmado e alertado; alerta segue para monitoramento e encerramento. Descarte só antes da emissão. Sem reabertura.

### RF11 - Emitir notificação interna

**Prioridade:** Essencial · **Telas:** T04, T03

Registrar uma notificação por evento ao entrar em Alerta emitido com prioridade mínima 60.

**Critério de aceite:** Notificação fica ligada ao detalhe e contador não lido aumenta; monitoramento sem emissão não gera notificação.

### RF12 - Ler e filtrar notificações

**Prioridade:** Essencial · **Telas:** T04

Mostrar todas/não lidas, marcar individualmente ou em lote e aplicar preferências opcionais.

**Critério de aceite:** Abrir notificação marca leitura; marcar todas não apaga eventos; estado atual é mostrado ao lado da pontuação histórica da emissão.

### RF13 - Consultar fontes e rastreabilidade

**Prioridade:** Essencial · **Telas:** T06

Mostrar categoria, nome declarado da fonte, confiança, data e natureza de todos os registros.

**Critério de aceite:** Tela distingue sensores/boletins simulados, relato não verificado e estimativa meteorológica externa.

### RF14 - Analisar e exportar registros

**Prioridade:** Importante · **Telas:** T08

Mostrar distribuição por prioridade, origem e bairro; exportar CSV com pontuação e proveniência.

**Critério de aceite:** Totais batem com eventos; impacto agregado é identificado como estimativa com possível repetição; CSV trata prefixos de fórmula.

### RF15 - Persistir preferências e dados locais

**Prioridade:** Importante · **Telas:** T09

Salvar bairro/tipos/limiar, registros e leituras; exportar JSON e restaurar cenários iniciais com confirmação.

**Critério de aceite:** Recarregar preserva sessão quando localStorage está disponível; falha mostra aviso; restauração substitui dados por exemplos.

### RF16 - Informar escopo e privacidade

**Prioridade:** Essencial · **Telas:** T10, T05

Apresentar finalidade, tratamento dos dados e identificação da equipe.

**Critério de aceite:** Tela Sobre descreve a persistência local, a natureza demonstrativa dos cenários e os cuidados com informações pessoais.

## Requisitos não funcionais

Classificação pela ISO/IEC 25010:2023. Os requisitos definem critérios de qualidade; os resultados das verificações estão na seção Validação do README.

| ID | Requisito | Classificação ISO/IEC 25010:2023 | Prioridade |
| --- | --- | --- | --- |
| RNF01 | Tempo de atualização | Eficiência de desempenho / comportamento temporal | Essencial |
| RNF02 | Disponibilidade e recuperação | Confiabilidade / disponibilidade e recuperabilidade | Essencial |
| RNF03 | Escalabilidade | Flexibilidade / escalabilidade | Essencial |
| RNF04 | Usabilidade e acessibilidade | Capacidade de interação / operabilidade e inclusividade | Essencial |
| RNF05 | Segurança e proteção de dados | Segurança / confidencialidade e integridade | Essencial |
| RNF06 | Manutenibilidade | Manutenibilidade / modularidade e testabilidade | Importante |
| RNF07 | Consistência e rastreabilidade | Adequação funcional / correção funcional | Essencial |
| RNF08 | Segurança operacional | Safety / hazard warning (aviso de perigo) | Essencial |

### RNF01 - Tempo de atualização

**ISO/IEC 25010:2023:** Eficiência de desempenho / comportamento temporal

**Prioridade:** Essencial

**Requisito:** O painel deve refletir cadastro ou transição local em até 1 s, com até 500 eventos. A recência deve ser recalculada a cada 30 s enquanto a página estiver ativa. A consulta externa deve encerrar a espera após 8 s.

**Critério de aceite e verificação:** Medir o intervalo entre a ação e a renderização; conferir o temporizador de 30 s e o timeout de 8 s. A importação meteorológica ocorre sob demanda.

### RNF02 - Disponibilidade e recuperação

**ISO/IEC 25010:2023:** Confiabilidade / disponibilidade e recuperabilidade

**Prioridade:** Essencial

**Requisito:** A sessão aberta deve preservar os dados em memória quando o armazenamento local falhar e permitir consultar os registros carregados sem internet. O serviço em produção tem como objetivos 99,5% de disponibilidade mensal, RPO de 24 h e RTO de 4 h.

**Critério de aceite e verificação:** Interromper rede e escrita local e verificar a continuidade da leitura com aviso de falha. Para o serviço em produção, medir disponibilidade e tempo de restauração de backup.

### RNF03 - Escalabilidade

**ISO/IEC 25010:2023:** Flexibilidade / escalabilidade

**Prioridade:** Essencial

**Requisito:** O protótipo deve limitar cada navegador a 500 eventos, com mensagem ao atingir a capacidade. A arquitetura de referência deve suportar 10.000 eventos/h e 1.000 sessões concorrentes por meio de API sem estado, fila e persistência compartilhada.

**Critério de aceite e verificação:** O 501º cadastro deve ser rejeitado sem apagar os registros existentes. O dimensionamento de produção é avaliado por carga, taxa de erros e ausência de perda de eventos aceitos.

### RNF04 - Usabilidade e acessibilidade

**ISO/IEC 25010:2023:** Capacidade de interação / operabilidade e inclusividade

**Prioridade:** Essencial

**Requisito:** A interface deve funcionar em 390 px e desktop, com teclado, foco visível, rótulos de campos e distinção de risco por texto e ícone. O registro até o detalhe deve ser concluído em até 2 minutos, com ao menos 80% de sucesso em uma avaliação com cinco participantes.

**Critério de aceite e verificação:** Percorrer registro, consulta e leitura de origem; verificar foco, menu móvel e ausência de transbordamento da página. Medir tempo e conclusão das tarefas na avaliação de usabilidade.

### RNF05 - Segurança e proteção de dados

**ISO/IEC 25010:2023:** Segurança / confidencialidade e integridade

**Prioridade:** Essencial

**Requisito:** A coleta deve se limitar à descrição do evento, bairro aproximado, tipo, severidade e estimativa de impacto. O sistema deve validar entradas, escapar texto na interface e restringir recursos do navegador. O serviço em produção deve proteger ações de agentes com autenticação e autorização.

**Critério de aceite e verificação:** Conferir campos coletados, limites de texto e número, tratamento de CSV e configuração CSP/Permissions-Policy. No ambiente hospedado, exigir HTTPS; na API de referência, negar alterações sem permissão.

### RNF06 - Manutenibilidade

**ISO/IEC 25010:2023:** Manutenibilidade / modularidade e testabilidade

**Prioridade:** Importante

**Requisito:** O código deve separar apresentação, aplicação, domínio e dados. As regras de prioridade, estados e validação devem ser funções testáveis, com contratos TypeScript estritos.

**Critério de aceite e verificação:** Executar a suíte automatizada e o build de produção. Verificar dependências entre src/ui, src/application, src/domain e src/data, mantendo a regra de negócio fora dos componentes visuais.

### RNF07 - Consistência e rastreabilidade

**ISO/IEC 25010:2023:** Adequação funcional / correção funcional

**Prioridade:** Essencial

**Requisito:** O evento deve preservar origem, confiança, horário e histórico em todas as telas. A prioridade atual deve vir de um único motor. Apenas transições previstas no grafo podem alterar o estado.

**Critério de aceite e verificação:** Comparar lista, detalhe e fontes; testar transição inválida e prioridade zero nos estados finais. A notificação conserva a pontuação de emissão, identificada como histórica.

### RNF08 - Segurança operacional

**ISO/IEC 25010:2023:** Safety / hazard warning (aviso de perigo)

**Prioridade:** Essencial

**Requisito:** Registros simulados devem ter identificação textual. A interface deve comunicar o caráter educativo das orientações e distinguir triagem, confirmação do fluxo e confirmação oficial.

**Critério de aceite e verificação:** Verificar a marca Simulado nas listas e no detalhe, as informações de origem e confiança e o aviso de escopo no painel, formulário e tela Sobre.
