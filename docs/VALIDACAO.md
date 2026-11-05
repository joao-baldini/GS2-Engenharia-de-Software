# Validação da entrega

Data: 05/11/2026. Ambiente local: Windows, Node.js 24.18.0, npm 11.16.0 e navegador Chromium integrado. Sem publicação remota nesta etapa, conforme solicitado pelo usuário.

## Verificações automatizadas

- `npm run build`: passou; TypeScript estrito e build Vite para produção.
- `npm test`: 18 casos passaram. Cobrem fatores da prioridade, confiança comunitária, seis fronteiras de recência, prioridade em estados finais, transições válidas/inválidas, limiar da notificação, contrato de entrada, horário UTC, leitura meteorológica inválida/antiga, temperatura amena e estrutura da persistência.
- Workflow GitHub Actions configurado para executar testes e build em push/PR.
- Pacote `dist/` servido com `npm run preview`: dez telas abertas, incluindo acesso direto ao detalhe, sem erros ou avisos no console da sessão de produção.

## Verificações manuais de navegador

| Fluxo | Resultado |
| --- | --- |
| Cadastro comunitário | Relato criado com ID, estado Reportado, origem Comunidade, confiança 60% e sem aviso imediato. |
| Consulta do registro | Busca por título encontrou o relato após navegação; detalhe preservou os dados e fatores. |
| Ciclo do evento | Reportado → Em validação → Confirmado → Alerta emitido → Em monitoramento → Encerrado. Notificação criada na emissão; encerramento zerou prioridade e preservou o histórico. |
| Leitura da central | Marcar todas como lidas zerou o contador; eventos e histórico permaneceram. |
| Fonte externa | Open-Meteo retornou 22,2 °C para a Sé no horário da inspeção, em 05/11/2026. Registro identificado como estimativa meteorológica externa, em monitoramento, sem emissão de alerta. Valor é evidência desta consulta, não uma condição garantida em execuções futuras. |
| Duplicidade da fonte | Segunda importação da mesma observação foi rejeitada com mensagem específica. |
| Sensor simulado | Cenário gerado, processado e aberto no detalhe, com confiança 90%, indicação Simulado, histórico automático e notificação. |
| Preferências | Limiar de 80 salvo e preservado após recarga. A central, com aplicação opcional das preferências, mostrou quatro notificações compatíveis com a sessão de teste. |
| Exportação | CSV baixado; JSON exportado e reaberto com 11 eventos e as preferências da sessão de teste. |
| Estado vazio | Busca sem correspondência mostrou orientação e ação Limpar filtros. |
| Responsividade | Dez rotas conferidas em desktop de 1280 px e celular de 390 × 844 px, sem transbordamento horizontal da página. Tabelas mantêm rolagem interna. |
| Menu móvel | Navegação abre e fecha; seleção troca de tela; Escape fecha o menu e o conteúdo de fundo fica inativo durante a abertura. |
| Rota de evento inexistente | Página de recuperação exibida, com retorno à visão geral. |
| Restauração | Confirmação explícita exibida; restaurar retornou os oito cenários iniciais e as preferências padrão. |

As capturas em `docs/screenshots/` documentam as dez telas em desktop, o painel e o registro no celular. A sessão foi restaurada após os testes. O PDF foi renderizado e revisado visualmente em suas 16 páginas, incluindo os diagramas vetoriais em paisagem.

## Limites

Sem benchmark formal de latência, carga de produção, SLA, ensaio de recuperação, estudo com usuários ou auditoria integral de acessibilidade. Os RNF diferenciam metas e implementação. Não se comprova precisão real dos alertas com dados demonstrativos.

Deploy e vídeo serão publicados pela equipe. Os links reais ainda devem ser inseridos na primeira página do PDF. Abertura pública sem login, reescrita de rotas e headers da Vercel precisam ser conferidos após a publicação.
