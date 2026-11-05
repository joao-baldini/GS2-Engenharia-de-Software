# UrbanRisk

**Global Solution 2026.2 · Engenharia de Software**

Aplicação web de monitoramento de alagamentos, calor intenso e interrupções de serviços essenciais em São Paulo. Reúne observações de sensores, bases públicas e relatos comunitários, calcula a prioridade dos eventos e apresenta a origem e a confiança de cada informação.

**[Acessar aplicação web](https://gs2-eng-software-2026.vercel.app)**

**[Documentação técnica em PDF](Documentacao.pdf)** · **[Diagramas UML](project/documentos/diagramas)** · **[Requisitos funcionais e não funcionais](project/documentos/REQUISITOS.md)**

![Painel do UrbanRisk](project/documentos/imagens/painel-desktop.png)

## Equipe

| Integrante | RM |
| --- | --- |
| João Viviani Baldini | 558596 |
| Giuliano Ferreira Venceslau | 558674 |
| Enrico Nikolay Meirelles Zeronian | 558557 |

## Funcionalidades

- Painel com indicadores, mapa esquemático e eventos prioritários.
- Busca, filtros e ordenação de eventos e alertas.
- Detalhe com origem, confiança, severidade, pontuação, fatores e histórico.
- Registro comunitário com validação e localização aproximada por bairro.
- Ciclo de vida: reportado, em validação, confirmado, alerta emitido, em monitoramento, encerrado ou descartado.
- Central de notificações com leitura individual, em lote e filtros por preferência.
- Simulador de sensor/boletim e importação de temperatura do Open-Meteo.
- Análises por risco, fonte e bairro; exportações CSV e JSON.
- Preferências, restauração dos cenários iniciais e informações de privacidade.

São dez telas: visão geral, eventos, detalhe, notificações, registro, fontes, entrada de dados, análises, preferências e sobre.

## Requisitos não funcionais

| ID | Requisito | ISO/IEC 25010:2023 | Critério principal |
| --- | --- | --- | --- |
| RNF01 | Tempo de atualização | Eficiência de desempenho | Alteração local em até 1 s; recência recalculada a cada 30 s; timeout externo de 8 s. |
| RNF02 | Disponibilidade e recuperação | Confiabilidade | Preservação da sessão diante de falha local; objetivo de disponibilidade de 99,5% para o serviço em produção. |
| RNF03 | Escalabilidade | Flexibilidade | Limite de 500 eventos no navegador; arquitetura de referência dimensionada para 10.000 eventos/h e 1.000 sessões concorrentes. |
| RNF04 | Usabilidade e acessibilidade | Capacidade de interação | Navegação por teclado, foco visível, informação além da cor e adaptação a 390 px e desktop. |
| RNF05 | Segurança e proteção de dados | Segurança | Coleta mínima, bairro aproximado, validação de entradas e políticas de segurança do navegador. |
| RNF06 | Manutenibilidade | Manutenibilidade | Separação em camadas, TypeScript estrito e regras de negócio testáveis. |
| RNF07 | Consistência e rastreabilidade | Adequação funcional | Motor único de prioridade, proveniência consistente e transições restritas ao grafo de estados. |
| RNF08 | Segurança operacional | Safety | Identificação textual dos dados simulados e comunicação clara do caráter educativo dos alertas. |

As especificações completas, prioridades e critérios de aceite dos **16 RF e 8 RNF** estão no [documento de requisitos](project/documentos/REQUISITOS.md) e no [PDF](Documentacao.pdf). Metas do serviço em produção são objetivos da arquitetura de referência; os resultados das verificações do protótipo estão na seção Validação.

## Execução

Requisitos: **Node.js 24** e npm. Comandos a partir da raiz do repositório:

```sh
npm --prefix project ci
npm --prefix project run dev
```

Endereço local: [http://127.0.0.1:5173](http://127.0.0.1:5173).

```sh
# Testes
npm --prefix project test

# Build de produção
npm --prefix project run build

# Prévia do build
npm --prefix project run preview
```

**Vercel:** diretório raiz `project`, framework Vite e saída `dist`. A configuração está em [project/vercel.json](project/vercel.json). O aplicativo não exige variáveis de ambiente.

## Validação

Ambiente de verificação: Windows, Node.js 24.18.0, npm 11.16.0 e Chromium. Data: 05/11/2026.

| Verificação | Resultado |
| --- | --- |
| Compilação de produção | TypeScript estrito e build Vite concluídos. |
| Testes automatizados | 18 casos aprovados: prioridade, confiança, fronteiras de recência, transições, emissão de alerta, validação, leitura meteorológica e persistência. |
| Registro comunitário | Relato criado como Reportado, confiança de 60%, com dados preservados na navegação e sem notificação antecipada. |
| Ciclo do evento | Validação, confirmação, emissão, monitoramento e encerramento executados; prioridade zerada no estado final e histórico preservado. |
| Notificações | Emissão refletida na central; leitura individual/em lote preserva o evento. |
| Fonte pública | Temperatura importada do Open-Meteo e observação repetida rejeitada. Temperatura amena permanece em monitoramento. |
| Sensor simulado | Evento classificado com origem, confiança, marca de simulação e notificação correspondente. |
| Preferências e exportações | Preferências preservadas após recarga; CSV e JSON exportados e conferidos. |
| Interface responsiva | Dez telas verificadas em 1280 px e 390 × 844 px, com rolagem interna nas tabelas. |
| Navegação e recuperação | Menu móvel, Escape, busca sem resultado, endereço inexistente e restauração dos exemplos conferidos. |
| Pacote de produção | Dez telas abertas com acesso direto ao detalhe e sem erros no console. |
| Deploy web | Aplicação acessível publicamente na Vercel, sem login. Painel renderizado no navegador; página inicial, detalhe, fontes, registro e notificações responderam HTTP 200. Cabeçalhos CSP e Permissions-Policy conferidos. |

[Capturas das telas](project/documentos/imagens).

As verificações registram o funcionamento do protótipo. Metas de disponibilidade, carga e precisão dos alertas são critérios de qualidade do sistema, e não resultados de benchmark ou de estudo de campo.

## Arquitetura e dados

React, TypeScript e Vite, com camadas de apresentação (`src/ui`), aplicação (`src/application`), negócio (`src/domain`) e dados (`src/data`). O processamento ocorre no navegador e os registros ficam no `localStorage`, na chave `urbanrisk-es:v1`. Cada navegador mantém sua própria sessão.

Os oito cenários iniciais e as entradas do simulador são fictícios. O Open-Meteo fornece uma estimativa meteorológica para a coordenada fixa da Sé. Confiança por categoria: sensor 90%, base pública 95% e comunidade 60%; esses valores são pesos de triagem.

O registro comunitário coleta bairro aproximado e descrição da situação. A central utiliza avisos internos. O protótipo opera sem servidor compartilhado, autenticação de agentes ou envio de push remoto.

## Estrutura

```text
Documentacao.pdf
README.md
project/
  src/
  public/
  documentos/
    REQUISITOS.md
    projeto.json
    diagramas/
    imagens/
  scripts/
  package.json
  vercel.json
```

O [PDF](Documentacao.pdf) reúne problema, personas, requisitos, regras de negócio, UML de sequência e estados, arquitetura e rastreabilidade. Os modelos editáveis ficam em `project/documentos/diagramas`.

O gerador está em `project/scripts/generate_docs.py`. Ele usa Python 3.11+, ReportLab e Segoe UI no Windows ou DejaVu Sans no Linux; os metadados são lidos de `project/documentos/projeto.json`.
