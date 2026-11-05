# Referência técnica

Requisitos: Node.js 24 e npm. Nenhuma variável de ambiente ou serviço pago é necessário.

```sh
npm ci
npm run dev
```

Aplicação local: `http://127.0.0.1:5173`. Verificações e pacote estático:

```sh
npm test
npm run build
npm run preview
```

O build gera `dist/`. A configuração Vercel já declara framework, comando de build, saída, reescrita SPA e cabeçalhos. Não há funções serverless nem banco a provisionar. O usuário fará a publicação pela própria conta.

## Reproduzir a documentação

Python 3.11+ e ReportLab, com Segoe UI no Windows ou DejaVu Sans no Linux:

```sh
python -m pip install -r scripts/requirements-docs.txt
python scripts/generate_docs.py
```

Os links da primeira página vêm de `docs/entrega.json`. Preencha os campos `prototype_url` e `video_url` com URLs HTTPS reais após publicar e execute novamente o gerador. Alternativamente:

```sh
python scripts/generate_docs.py --prototype-url https://SEU-DEPLOY --video-url https://SEU-VIDEO
```

Os valores ilustrativos acima são argumentos de exemplo, não links da entrega. O PDF final fica em `output/pdf/UrbanRisk-Documentacao-Tecnica.pdf`. As fontes PlantUML e Mermaid estão em `docs/diagramas`; o PDF já contém desenhos vetoriais legíveis desses modelos e não exige instalar Java/PlantUML para ser gerado.

## Dados e manutenção

- Chave local: `urbanrisk-es:v1`. O armazenamento persiste eventos, histórico, avisos e preferências.
- Limite: 500 eventos e 500 notificações por navegador. Não há sincronização entre dispositivos. Abas da mesma origem recebem alterações pelo evento `storage`; não há controle transacional para escrita concorrente.
- A recência é recalculada a cada 30 segundos; a importação externa é manual, com timeout de 8 segundos. O relógio local afeta a demonstração.
- Origem comunitária fixa: 60% de confiança. Sensor: 90%; base pública: 95%. Dados simulados carregam marca explícita.
- Ações de agente são abertas para avaliação do protótipo. Em produção, controles precisam existir no servidor.
- A página já aberta funciona com os dados em memória sem internet. Recarregamento offline não é garantido: não há service worker.
- Exportação CSV trata prefixos de fórmula; JSON contém os textos digitados. Ambos devem ser revisados antes de compartilhar.

## Organização

```text
src/ui              rotas, telas e componentes
src/application     estado, notificações e adaptador meteorológico
src/domain          contratos, validação, prioridade e estados
src/data            repositório local e dados iniciais
docs/diagramas      fontes editáveis dos modelos
output/pdf          documento único da entrega
scripts             gerador do documento
```
