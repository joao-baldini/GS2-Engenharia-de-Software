"""Gera a documentação técnica em PDF e o documento de requisitos em Markdown.

python scripts/generate_docs.py [--prototype-url https://...] [--video-url https://...]
Dependências: scripts/requirements-docs.txt.
"""
import argparse
import json
import math
import os
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT.parent / 'Documentacao.pdf'
GREEN = colors.HexColor('#215b50')
INK = colors.HexColor('#223b35')
MUTED = colors.HexColor('#65746e')
LINE = colors.HexColor('#dce5de')
PALE = colors.HexColor('#edf3ed')
for name, windows, linux in [('Body','segoeui.ttf','DejaVuSans.ttf'),('Bold','segoeuib.ttf','DejaVuSans-Bold.ttf')]:
    path = Path(os.environ.get('WINDIR','C:/Windows')) / 'Fonts' / windows
    if not path.exists(): path = Path('/usr/share/fonts/truetype/dejavu') / linux
    pdfmetrics.registerFont(TTFont(name, str(path)))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='Bold', italic='Body', boldItalic='Bold')
STYLES = {k: ParagraphStyle(k,fontName='Body',fontSize=size,leading=lead,textColor=INK,spaceAfter=0) for k,size,lead in [('body',10,15.5),('small',8.5,12.5),('tiny',7.3,10),('large',13,19)]}
RF = [
('RF01','Consultar painel integrado','Essencial','Apresentar eventos ativos, alertas emitidos prioritários, origens e última alteração local.','Painel mostra totais derivados dos mesmos registros da lista; encerrados e descartados não contam como ativos.','T01'),
('RF02','Explorar visão territorial','Essencial','Exibir eventos ativos por bairro, categoria e acesso ao detalhe em um mapa esquemático.','Marcador abre o evento de maior prioridade do bairro; lista contém todos os registros. Zoom de 100% a 180% e restauração funcionam.','T01'),
('RF03','Consultar e filtrar eventos','Essencial','Pesquisar título/bairro e filtrar tipo, estado e origem; ordenar por pontuação ou recência.','Filtros combinam condições; ausência de resultados permite limpar a seleção; estados finais podem ser consultados.','T02'),
('RF04','Consultar detalhe do evento','Essencial','Apresentar descrição, bairro, horários, severidade, pessoas estimadas, estado e orientação educativa.','Cada evento tem rota própria e dados consistentes com a lista; endereço inexistente apresenta recuperação.','T03'),
('RF05','Explicar prioridade e confiança','Essencial','Exibir faixa, pontuação, quatro fatores e confiança fixa da categoria de origem.','Exemplo de sensor crítico com 1.800 pessoas e até 30 minutos resulta em 98 pontos; origem e indicação de simulação permanecem visíveis.','T02, T03, T06'),
('RF06','Registrar ocorrência comunitária','Essencial','Receber título, descrição, categoria, bairro, severidade e pessoas estimadas, sem cadastro.','Entrada válida gera ID local, origem Comunidade, confiança 60% e estado Reportado; não emite notificação imediatamente.','T05'),
('RF07','Validar o contrato de entrada','Essencial','Rejeitar campos inválidos antes de criar evento; validar valor, unidade e horário meteorológico.','Texto curto, bairro fora do piloto, impacto negativo/fracionado e leitura inválida geram erro, sem inventar dados ou limpar o formulário.','T05, T07'),
('RF08','Processar sensores e boletins simulados','Essencial','Normalizar uma leitura fictícia e percorrer validação, confirmação e classificação.','Um clique gera evento explicitamente simulado, explica a pontuação e cria aviso interno quando elegível.','T07'),
('RF09','Importar base pública externa','Importante','Consultar temperatura a 2 m para a Sé via Open-Meteo sob demanda, preservando fonte, leitura e horário UTC.','Timeout em 8 s; unidade °C e leitura de até 2 h; repetição da mesma fonte e horário é bloqueada; abaixo de 30 °C não há alerta.','T07, T03'),
('RF10','Gerenciar ciclo de vida','Essencial','Permitir transições do grafo UML e manter histórico com horário e motivo.','Relato pode ser validado, confirmado e alertado; alerta segue para monitoramento e encerramento. Descarte só antes da emissão. Sem reabertura.','T03'),
('RF11','Emitir notificação interna','Essencial','Registrar uma notificação por evento ao entrar em Alerta emitido com prioridade mínima 60.','Notificação fica ligada ao detalhe e contador não lido aumenta; monitoramento sem emissão não gera notificação.','T04, T03'),
('RF12','Ler e filtrar notificações','Essencial','Mostrar todas/não lidas, marcar individualmente ou em lote e aplicar preferências opcionais.','Abrir notificação marca leitura; marcar todas não apaga eventos; estado atual é mostrado ao lado da pontuação histórica da emissão.','T04'),
('RF13','Consultar fontes e rastreabilidade','Essencial','Mostrar categoria, nome declarado da fonte, confiança, data e natureza de todos os registros.','Tela distingue sensores/boletins simulados, relato não verificado e estimativa meteorológica externa.','T06'),
('RF14','Analisar e exportar registros','Importante','Mostrar distribuição por prioridade, origem e bairro; exportar CSV com pontuação e proveniência.','Totais batem com eventos; impacto agregado é identificado como estimativa com possível repetição; CSV trata prefixos de fórmula.','T08'),
('RF15','Persistir preferências e dados locais','Importante','Salvar bairro/tipos/limiar, registros e leituras; exportar JSON e restaurar cenários iniciais com confirmação.','Recarregar preserva sessão quando localStorage está disponível; falha mostra aviso; restauração substitui dados por exemplos.','T09'),
('RF16','Informar escopo e privacidade','Essencial','Apresentar finalidade, tratamento dos dados e identificação da equipe.','Tela Sobre descreve a persistência local, a natureza demonstrativa dos cenários e os cuidados com informações pessoais.','T10, T05'),
]
RNF = [
('RNF01','Tempo de atualização','Eficiência de desempenho / comportamento temporal','Essencial','O painel deve refletir cadastro ou transição local em até 1 s, com até 500 eventos. A recência deve ser recalculada a cada 30 s enquanto a página estiver ativa. A consulta externa deve encerrar a espera após 8 s.','Medir o intervalo entre a ação e a renderização; conferir o temporizador de 30 s e o timeout de 8 s. A importação meteorológica ocorre sob demanda.'),
('RNF02','Disponibilidade e recuperação','Confiabilidade / disponibilidade e recuperabilidade','Essencial','A sessão aberta deve preservar os dados em memória quando o armazenamento local falhar e permitir consultar os registros carregados sem internet. O serviço em produção tem como objetivos 99,5% de disponibilidade mensal, RPO de 24 h e RTO de 4 h.','Interromper rede e escrita local e verificar a continuidade da leitura com aviso de falha. Para o serviço em produção, medir disponibilidade e tempo de restauração de backup.'),
('RNF03','Escalabilidade','Flexibilidade / escalabilidade','Essencial','O protótipo deve limitar cada navegador a 500 eventos, com mensagem ao atingir a capacidade. A arquitetura de referência deve suportar 10.000 eventos/h e 1.000 sessões concorrentes por meio de API sem estado, fila e persistência compartilhada.','O 501º cadastro deve ser rejeitado sem apagar os registros existentes. O dimensionamento de produção é avaliado por carga, taxa de erros e ausência de perda de eventos aceitos.'),
('RNF04','Usabilidade e acessibilidade','Capacidade de interação / operabilidade e inclusividade','Essencial','A interface deve funcionar em 390 px e desktop, com teclado, foco visível, rótulos de campos e distinção de risco por texto e ícone. O registro até o detalhe deve ser concluído em até 2 minutos, com ao menos 80% de sucesso em uma avaliação com cinco participantes.','Percorrer registro, consulta e leitura de origem; verificar foco, menu móvel e ausência de transbordamento da página. Medir tempo e conclusão das tarefas na avaliação de usabilidade.'),
('RNF05','Segurança e proteção de dados','Segurança / confidencialidade e integridade','Essencial','A coleta deve se limitar à descrição do evento, bairro aproximado, tipo, severidade e estimativa de impacto. O sistema deve validar entradas, escapar texto na interface e restringir recursos do navegador. O serviço em produção deve proteger ações de agentes com autenticação e autorização.','Conferir campos coletados, limites de texto e número, tratamento de CSV e configuração CSP/Permissions-Policy. No ambiente hospedado, exigir HTTPS; na API de referência, negar alterações sem permissão.'),
('RNF06','Manutenibilidade','Manutenibilidade / modularidade e testabilidade','Importante','O código deve separar apresentação, aplicação, domínio e dados. As regras de prioridade, estados e validação devem ser funções testáveis, com contratos TypeScript estritos.','Executar a suíte automatizada e o build de produção. Verificar dependências entre src/ui, src/application, src/domain e src/data, mantendo a regra de negócio fora dos componentes visuais.'),
('RNF07','Consistência e rastreabilidade','Adequação funcional / correção funcional','Essencial','O evento deve preservar origem, confiança, horário e histórico em todas as telas. A prioridade atual deve vir de um único motor. Apenas transições previstas no grafo podem alterar o estado.','Comparar lista, detalhe e fontes; testar transição inválida e prioridade zero nos estados finais. A notificação conserva a pontuação de emissão, identificada como histórica.'),
('RNF08','Segurança operacional','Safety / hazard warning (aviso de perigo)','Essencial','Registros simulados devem ter identificação textual. A interface deve comunicar o caráter educativo das orientações e distinguir triagem, confirmação do fluxo e confirmação oficial.','Verificar a marca Simulado nas listas e no detalhe, as informações de origem e confiança e o aviso de escopo no painel, formulário e tela Sobre.'),
]

class Document:
    def __init__(self, config):
        OUT.parent.mkdir(parents=True,exist_ok=True)
        self.c=canvas.Canvas(str(OUT),pagesize=A4)
        self.c.setTitle('UrbanRisk - Documentação Técnica - Global Solution 2026.2')
        self.c.setAuthor('João Viviani Baldini; Giuliano Ferreira Venceslau; Enrico Nikolay Meirelles Zeronian')
        self.page=0; self.config=config
    def start(self,title,sub='',wide=False):
        if self.page: self.c.showPage()
        self.page+=1; self.w,self.height=landscape(A4) if wide else A4
        self.c.setPageSize((self.w,self.height)); self.y=self.height-52
        self.c.setFillColor(GREEN);self.c.rect(0,self.height-10,self.w,10,fill=1,stroke=0)
        self.c.setFont('Bold',9);self.c.drawString(43,self.y,'urbanrisk')
        self.c.setFont('Body',8);self.c.setFillColor(MUTED);self.c.drawRightString(self.w-43,self.y,'Engenharia de Software | Global Solution 2026.2')
        self.y-=44;self.c.setFillColor(INK);self.c.setFont('Bold',23);self.c.drawString(43,self.y,title)
        self.y-=23
        if sub:self.p(sub,'small',gap=15)
        self.c.setStrokeColor(LINE);self.c.line(43,40,self.w-43,40)
        self.c.setFillColor(MUTED);self.c.setFont('Body',8);self.c.drawString(43,26,'Versão 2.0 | '+self.config['date']);self.c.drawRightString(self.w-43,26,str(self.page))
        self.c.bookmarkPage(f'pagina-{self.page}')
        outline=title + (' - ' + sub.split('|')[0].strip() if title in ('Requisitos funcionais','Requisitos não funcionais') else '')
        self.c.addOutlineEntry(outline,f'pagina-{self.page}',level=0,closed=False)
    def p(self,text,style='body',x=43,width=None,gap=11):
        width=width or self.w-86
        para=Paragraph(text,STYLES[style]);_,height=para.wrap(width,1000)
        if self.y-height<54:raise ValueError(f'Overflow página {self.page}: {text[:65]} y={self.y}')
        para.drawOn(self.c,x,self.y-height);self.y-=height+gap
    def h(self,text):
        self.y-=9;self.c.setFont('Bold',13);self.c.setFillColor(GREEN);self.c.drawString(43,self.y,text);self.y-=22
    def note(self,text):
        para=Paragraph(text,STYLES['small']);_,height=para.wrap(self.w-114,900)
        if self.y-height-30<54:raise ValueError('Note overflow '+str(self.page))
        self.c.setFillColor(PALE);self.c.roundRect(43,self.y-height-23,self.w-86,height+23,6,fill=1,stroke=0)
        para.drawOn(self.c,57,self.y-height-10);self.y-=height+39
    def table(self,headers,rows,widths):
        data=[[Paragraph(escape(str(v)),STYLES['small']) for v in row] for row in [headers]+rows]
        table=Table(data,colWidths=widths,hAlign='LEFT')
        table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),PALE),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10),('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,-1),.5,LINE),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9)]))
        _,h=table.wrap(self.w-86,1000)
        if self.y-h<54:raise ValueError('Table overflow '+str(self.page))
        table.drawOn(self.c,43,self.y-h);self.y-=h+18
    def req(self,row):
        code,title,priority,desc,accept,screens=row
        self.p(f'<b>{code} | {title}</b>','large',gap=5)
        self.p(f'<font color="#215b50">Prioridade: {priority} | Telas: {screens}</font>','small',gap=6)
        self.p(desc,'body',gap=5)
        self.p('<b>Aceite:</b> '+accept,'small',gap=18)
    def save(self):self.c.save()

def label(c,x,y,text,size=9,color=INK,center=False):
    c.setFillColor(color);c.setFont('Body',size)
    if center:c.drawCentredString(x,y,text)
    else:c.drawString(x,y,text)
def arrow(c,x1,y1,x2,y2,text='',dashed=False,size=8,filled=False):
    c.setStrokeColor(GREEN);c.setLineWidth(.8)
    if dashed:c.setDash(3,3)
    c.line(x1,y1,x2,y2);c.setDash()
    a=math.atan2(y2-y1,x2-x1);n=6
    if filled:
        p=c.beginPath();p.moveTo(x2,y2);p.lineTo(x2-n*math.cos(a-.4),y2-n*math.sin(a-.4));p.lineTo(x2-n*math.cos(a+.4),y2-n*math.sin(a+.4));p.close()
        c.setFillColor(GREEN);c.drawPath(p,fill=1,stroke=1)
    else:
        c.line(x2,y2,x2-n*math.cos(a-.4),y2-n*math.sin(a-.4));c.line(x2,y2,x2-n*math.cos(a+.4),y2-n*math.sin(a+.4))
    if text:label(c,(x1+x2)/2,(y1+y2)/2+5,text,size,center=True)
def box(c,x,y,w,h,title,subtitle='',fill=PALE):
    c.setFillColor(fill);c.setStrokeColor(LINE);c.roundRect(x,y,w,h,8,fill=1,stroke=1)
    label(c,x+w/2,y+h/2+(4 if subtitle else -3),title,10,center=True)
    if subtitle:label(c,x+w/2,y+h/2-12,subtitle,8,MUTED,True)

def sequence(d):
    d.start('Diagrama UML de sequência',wide=True)
    c=d.c; xs=[69,182,300,415,531,647,770]; names=[['Origem'],['Interface /','adaptador'],['Serviço de','eventos'],['Motor de','risco'],['Repositório','local'],['Central de','notificações'],['Pessoa /','agente demo']]
    top=449
    for x,lines in zip(xs,names):
        c.setFillColor(PALE);c.setStrokeColor(LINE);c.rect(x-45,top,90,35,fill=1,stroke=1)
        for i,s in enumerate(lines):label(c,x,top+23-i*12,s,8.5,center=True)
        c.setStrokeColor(colors.HexColor('#b8c8bc'));c.setDash(3,3);c.line(x,top,x,100);c.setDash()
    arrow(c,xs[0],431,xs[1],431,'dado recebido / consulta',filled=True)
    arrow(c,xs[1],408,xs[2],408,'validar e normalizar',filled=True)
    c.setStrokeColor(LINE);c.rect(123,97,679,297,stroke=1,fill=0);label(c,129,382,'alt [inválido / indisponível]',8)
    arrow(c,xs[2],360,xs[1],360,'erro; sem criar evento',True)
    c.setStrokeColor(LINE);c.setDash(3,3);c.line(123,346,802,346);c.setDash();label(c,129,338,'else [dado válido]',7.5)
    c.setStrokeColor(LINE);c.rect(123,274,679,63,stroke=1,fill=0);label(c,129,325,'opt [origem comunitária: aguardar análise do agente]',8)
    arrow(c,xs[2],309,xs[4],309,'salvar Reportado',filled=True)
    arrow(c,xs[6],289,xs[2],289,'iniciar validação e confirmar via interface',filled=True)
    arrow(c,xs[2],254,xs[3],254,'calcular prioridade',filled=True)
    arrow(c,xs[3],233,xs[2],233,'pontuação, confiança e fatores',True)
    c.setStrokeColor(LINE);c.rect(256,99,546,117,stroke=1,fill=0);label(c,263,204,'alt [decisão de emitir e pontuação >= 60]',8)
    arrow(c,xs[2],185,xs[4],185,'salvar Alerta emitido + aviso',filled=True)
    arrow(c,xs[2],164,xs[5],164,'publicar aviso interno',filled=True)
    arrow(c,xs[5],143,xs[6],143,'mostrar notificação',size=7,filled=True)
    c.setStrokeColor(LINE);c.setDash(3,3);c.line(256,132,802,132);c.setDash();label(c,263,121,'else [pontuação < 60 ou decisão de acompanhar]',7.5)
    arrow(c,xs[2],103,xs[4],103,'salvar Em monitoramento; sem aviso',size=7,filled=True)
    label(c,43,78,'Fontes externas: validação e confirmação automáticas, sem comprovação oficial. Comunidade: passos manuais.',8,MUTED)
    label(c,43,64,'Persistência via efeito React; falha do localStorage gera aviso e mantém a sessão em memória. A leitura do aviso também é salva.',8,MUTED)

def state_diagram(d):
    d.start('Diagrama UML de estados','Estados, eventos disparadores e condições de transição. O grafo corresponde a src/domain/model.ts.',True)
    c=d.c
    c.setFillColor(GREEN);c.circle(58,403,6,fill=1,stroke=0)
    box(c,95,380,135,46,'Reportado')
    box(c,307,380,145,46,'Em validação')
    box(c,533,380,138,46,'Confirmado')
    box(c,533,246,138,46,'Alerta emitido')
    box(c,307,246,145,46,'Em monitoramento')
    box(c,95,246,135,46,'Encerrado')
    box(c,533,117,138,46,'Descartado')
    arrow(c,64,403,95,403)
    label(c,47,442,'dado estruturalmente válido',8,MUTED)
    arrow(c,230,403,307,403,'iniciar validação',size=7)
    arrow(c,452,403,533,403,'confirmar',size=8)
    arrow(c,602,380,602,292)
    label(c,616,345,'emitir alerta',8);label(c,616,332,'[pontuação >= 60]',8)
    arrow(c,533,269,452,269,'acompanhar',size=7)
    arrow(c,307,269,230,269,'encerrar',size=8)
    # Confirmação pode levar diretamente ao monitoramento por decisão do agente.
    c.setStrokeColor(GREEN);c.line(533,386,487,386);c.line(487,386,487,318);c.line(487,318,380,318);arrow(c,380,318,380,292)
    label(c,324,335,'acompanhar [score < 60',7.4);label(c,324,323,'ou decisão do agente]',7.4)
    # Descarte prévio à emissão: de validação ou confirmação.
    c.setStrokeColor(GREEN);c.line(379,426,379,458);c.line(379,458,750,458);c.line(750,458,750,140);arrow(c,750,140,671,140)
    label(c,455,465,'descartar [rejeição na validação]',7.5)
    label(c,690,234,'descartar',8);label(c,690,221,'[rejeição antes',7);label(c,690,210,'da emissão]',7)
    c.setStrokeColor(GREEN);c.line(671,403,712,403);c.line(712,403,712,155);arrow(c,712,155,671,155)
    arrow(c,162,246,162,218);c.setStrokeColor(GREEN);c.circle(162,207,8,fill=0,stroke=1);c.setFillColor(GREEN);c.circle(162,207,5,fill=1,stroke=0)
    arrow(c,602,117,602,89);c.setStrokeColor(GREEN);c.circle(602,78,8,fill=0,stroke=1);c.setFillColor(GREEN);c.circle(602,78,5,fill=1,stroke=0)
    box(c,43,92,395,87,'Regras de interpretação','Confirmação demonstra o fluxo, sem verificação oficial.',fill=colors.HexColor('#f7f8f4'))
    label(c,62,109,'Estados finais: prioridade zero e sem reabertura.',8,MUTED)
    label(c,43,64,'Fonte externa percorre os primeiros estados automaticamente. Relato comunitário aguarda ações manuais.',8,MUTED)

def architecture(d):
    d.start('Arquitetura em camadas','Aplicação web estática, com processamento e armazenamento no navegador.',True)
    c=d.c
    box(c,43,400,211,55,'Comunidade','Formulário sem identificação')
    box(c,315,400,211,55,'Sensor / boletim','Simulador local, dados fictícios')
    box(c,587,400,211,55,'Open-Meteo','HTTPS sob demanda; Sé fixa')
    box(c,43,288,490,65,'Apresentação | src/ui','Rotas, painel, detalhe, formulários, fontes e central')
    box(c,43,181,490,65,'Aplicação + negócio | src/application e domain','Store, importação, validação, motor de risco e estados')
    box(c,43,74,490,65,'Dados | src/data','Seed + repository -> localStorage por navegador')
    box(c,588,288,210,65,'Notificações','Avisos internos + leitura no store')
    box(c,588,181,210,65,'Proteção dos dados','Minimização + validação + escape')
    box(c,588,74,210,65,'Hospedagem | Vercel','Arquivos estáticos, HTTPS e headers')
    arrow(c,148,400,148,353,'registro')
    arrow(c,420,400,420,353,'simulação')
    c.setStrokeColor(GREEN);c.line(693,400,693,375);c.line(693,375,551,375);c.line(551,375,551,215);arrow(c,551,215,533,215)
    arrow(c,288,288,288,246,'comando / consulta')
    arrow(c,288,181,288,139,'persistência local')
    arrow(c,533,235,588,310)
    arrow(c,588,202,533,202)
    label(c,540,253,'aviso',7.5,MUTED)
    label(c,548,185,'controles',7,MUTED)
    label(c,43,52,'Persistência por navegador. A camada de aplicação organiza o processamento e a emissão de avisos internos.',8,MUTED)

def write_requirements():
    lines=['# Requisitos do UrbanRisk', '',
        'Plataforma web de acompanhamento de alagamentos, calor intenso e interrupções de serviços essenciais em São Paulo.', '',
        '## Requisitos funcionais', '',
        'Prioridades: **Essencial** para o fluxo central; **Importante** para recursos de apoio.', '']
    for code,title,priority,description,acceptance,screens in RF:
        lines.extend([f'### {code} - {title}', '', f'**Prioridade:** {priority} · **Telas:** {screens}', '',
            description, '', f'**Critério de aceite:** {acceptance}', ''])
    lines.extend(['## Requisitos não funcionais', '',
        'Classificação pela ISO/IEC 25010:2023. Os requisitos definem critérios de qualidade; os resultados das verificações estão na seção Validação do README.', '',
        '| ID | Requisito | Classificação ISO/IEC 25010:2023 | Prioridade |',
        '| --- | --- | --- | --- |'])
    for code,title,category,priority,description,verification in RNF:
        lines.append(f'| {code} | {title} | {category} | {priority} |')
    lines.append('')
    for code,title,category,priority,description,verification in RNF:
        lines.extend([f'### {code} - {title}', '', f'**ISO/IEC 25010:2023:** {category}', '',
            f'**Prioridade:** {priority}', '', f'**Requisito:** {description}', '',
            f'**Critério de aceite e verificação:** {verification}', ''])
    (ROOT/'documentos'/'REQUISITOS.md').write_text('\n'.join(lines),encoding='utf-8')

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--prototype-url');parser.add_argument('--video-url');args=parser.parse_args()
    cfg=json.loads((ROOT/'documentos/projeto.json').read_text(encoding='utf-8'))
    for k,v in [('prototype_url',args.prototype_url),('video_url',args.video_url)]:
        if v:
            if not v.startswith('https://'):raise ValueError('Os links devem usar HTTPS.')
            cfg[k]=v
    d=Document(cfg)
    d.start('Urban Risk Intelligence Platform','Documentação técnica da solução web | Global Solution 2026.2')
    d.p('Monitoramento e priorização de riscos urbanos em São Paulo.','large',gap=20)
    d.h('Identificação da equipe')
    d.table(['Nome completo','RM'],[['João Viviani Baldini','558596'],['Giuliano Ferreira Venceslau','558674'],['Enrico Nikolay Meirelles Zeronian','558557']],[407,102])
    d.h('Acesso ao projeto')
    for title,key in [('Repositório','repository_url'),('Aplicação web','prototype_url'),('Vídeo de apresentação','video_url')]:
        if cfg.get(key):
            d.p('<b>'+title+'</b>','body',gap=4)
            d.p(f'<link href="{escape(cfg[key])}" color="#215b50">{escape(cfg[key])}</link>','small',gap=13)
    d.h('Conteúdo')
    d.p('Problema, público-alvo e personas - página 2<br/>Requisitos funcionais (RF01 a RF16) - páginas 3 a 6<br/><b>Requisitos não funcionais (RNF01 a RNF08) - páginas 7 e 8</b><br/>Regras de negócio - página 9<br/>Diagramas UML de sequência e estados - páginas 10 e 11<br/>Arquitetura, disponibilidade, escala e proteção de dados - páginas 12 e 13<br/>Rastreabilidade das telas - página 14<br/>Validação e indicadores - página 15<br/>Referências técnicas - página 16','body')

    d.start('Problema, público-alvo e personas','Contexto de uso e escopo da solução')
    d.h('Problema e objetivo')
    d.p('Alagamentos, calor intenso e interrupções de serviços afetam deslocamentos e rotinas. Os sinais chegam de fontes diferentes e com confiabilidade desigual. Uma lista sem origem ou prioridade pode aumentar a incerteza. O UrbanRisk reúne esses sinais, explica uma prioridade de triagem e permite acompanhar o ciclo do evento.')
    d.p('Público-alvo: moradores, agentes locais de proteção comunitária e operadores de serviços essenciais. O piloto abrange oito bairros de São Paulo: Sé, Mooca, Ipiranga, Vila Mariana, Pinheiros, Santana, Lapa e Butantã.')
    d.h('Personas de projeto')
    d.p('<b>Marina, moradora e usuária de transporte público.</b> Consulta riscos próximos e registra uma observação sem se cadastrar. Precisa compreender rapidamente a origem, a data e o limite da informação. Sucesso: localizar um evento e sua orientação com poucos passos.')
    d.p('<b>Rafael, agente local de proteção comunitária.</b> Analisa sinais e decide quais ocorrências devem gerar atenção prioritária. Precisa da justificativa da pontuação, do histórico e de controles para validar, emitir, acompanhar e encerrar eventos.')
    d.p('<b>Cláudia, operadora de serviço essencial.</b> Consulta interrupções por bairro e origem e acompanha sua evolução. Precisa diferenciar relatos comunitários de boletins e visualizar o estado de cada evento.')
    d.h('Escopo da aplicação web')
    d.p('Dez telas em português, com painel, mapa esquemático, consulta, registro, central de notificações, fontes, ingestão, análises, preferências e privacidade. O processamento ocorre no navegador e a sessão é preservada no localStorage. Oito cenários iniciais e o simulador usam dados fictícios identificados; a importação Open-Meteo consulta temperatura externa sob demanda.')
    d.p('A versão web opera por navegador, com ações de agente demonstrativas e avisos internos. A arquitetura de referência do serviço em produção acrescenta API, armazenamento compartilhado, controle de acesso e processamento por fila.')

    for i in range(0,len(RF),4):
        d.start('Requisitos funcionais',f'RF{i+1:02d} a RF{i+4:02d} | Essencial = obrigatório ao fluxo central; Importante = apoio à operação.')
        for row in RF[i:i+4]:d.req(row)

    for i in range(0,len(RNF),4):
        d.start('Requisitos não funcionais',f'RNF{i+1:02d} a RNF{i+4:02d} | Classificação pela ISO/IEC 25010:2023')
        for code,title,category,priority,target,verification in RNF[i:i+4]:
            d.p(f'<b>{code} | {title}</b>','large',gap=4)
            d.p(f'<font color="#215b50">{category} | {priority}</font>','small',gap=5)
            d.p(target,'small',gap=5)
            d.p('<b>Critério de aceite e verificação:</b> '+verification,'small',gap=17)

    d.start('Regras de negócio','Classificação de prioridade, confiança, notificação e ciclo de vida')
    d.p('<b>RB01.</b> Confiança por categoria: sensor 90%, base pública 95%, comunidade 60%. O formulário não promove origem. As porcentagens são hipóteses de triagem, não probabilidade de autenticidade.')
    d.p('<b>RB02.</b> Prioridade = severidade + contribuição da confiança + impacto estimado + recência. A pontuação varia de 0 a 100. Encerrado e Descartado recebem zero, sem apagar o histórico.')
    d.table(['Fator','Regra implementada'],[
      ['Severidade (máx. 45)','Baixa 10; moderada 22; alta 34; crítica 45.'],
      ['Confiança (máx. 25)','round((confiança / 100) × 25): sensor 23, pública 24, comunidade 15.'],
      ['Impacto (máx. 20)','min(20, round(log10(max(1, pessoas estimadas)) × 6)). Zero significa impacto desconhecido.'],
      ['Recência (máx. 10)','Idade em minutos inteiros: até 30 = 10; até 120 = 7; até 1.440 = 3; depois = 0.'],
      ['Faixas','Crítico >= 80; alto >= 60; moderado >= 40; baixo < 40.']],[138,371])
    d.p('<b>RB03.</b> Notificar somente quando o evento entra em Alerta emitido e tem pelo menos 60 pontos. Uma notificação por evento. O relato comunitário aguarda validação manual; a entrada externa percorre validação e confirmação automaticamente no fluxo demonstrativo.')
    d.p('<b>RB04.</b> Acompanhamento pode ser escolhido mesmo acima de 60 pontos. Estados finais não reabrem. Notificações mantêm a pontuação da emissão; o detalhe usa prioridade atual. Recência muda a cada 30 s, sem refazer a emissão.')
    d.p('<b>RB05.</b> Open-Meteo: temperatura a 2 m da Sé, consulta sob demanda; dados de até 2 h e no máximo 5 min futuros; °C; faixa técnica de -30 a 60. Severidade: abaixo de 30 baixa; 30 a &lt;34 moderada; 34 a &lt;38 alta; >=38 crítica. Abaixo de 30 não se notifica. Pessoas estimadas = 0. Uma mesma fonte/horário não é importada novamente.')
    d.note('<b>Exemplo:</b> sensor crítico, 1.800 pessoas e leitura recente: 45 + 23 + 20 + 10 = <b>98</b>. Mesmo cenário comunitário: 45 + 15 + 20 + 10 = <b>90</b>. Pontuação alta não dispensa a etapa de validação no fluxo comunitário.')
    sequence(d);state_diagram(d);architecture(d)

    d.start('Disponibilidade, escala e proteção','Arquitetura de referência do serviço em produção')
    d.h('Processamento e escalabilidade - RNF01 e RNF03')
    d.p('A apresentação estática permanece em CDN/Vercel. Uma API sem estado concentra validação, paginação e autorização. Adaptadores autenticados normalizam sensores e bases públicas. PostgreSQL armazena eventos, histórico e notificações, com índices por estado, bairro e data de observação.')
    d.p('Uma fila durável desacopla o recebimento do processamento. A chave idempotente combina fonte, identificador e horário; tentativas têm limite e fila de erros. Uma outbox transacional vincula a gravação do evento ao despacho da notificação. O objetivo de dimensionamento é 10.000 eventos/h e 1.000 sessões simultâneas.')
    d.h('Continuidade - RNF02')
    d.p('O serviço adota monitoramento de latência p95, erros e profundidade da fila, com health checks e alertas operacionais. O objetivo de disponibilidade é 99,5% ao mês. Backups diários e restauração controlada atendem aos objetivos RPO de 24 h e RTO de 4 h.')
    d.h('Proteção dos dados - RNF05')
    d.p('A finalidade é descrever o evento urbano e seu impacto aproximado. O formulário coleta bairro, situação, tipo, severidade e estimativa de pessoas, com orientação para evitar dados pessoais nos campos livres. A aplicação usa escape de texto, limites de entrada, configuração CSP e bloqueio de câmera, microfone e geolocalização.')
    d.p('No serviço em produção, agentes possuem autenticação, autorização por função e trilha de auditoria. A política de tratamento define controlador, operadores, hipótese legal aplicável, retenção por finalidade, descarte e canal de direitos do titular. Logs e exportações seguem a minimização dos dados; segredos e backups têm acesso restrito.')
    d.h('Fontes e notificações')
    d.p('O protótipo consulta diretamente o Open-Meteo com a coordenada fixa da Sé. Um coletor central no serviço em produção pode reduzir chamadas externas e concentrar validação de proveniência. A notificação interna pertence à aplicação; os canais remotos são consumidores separados, sujeitos à preferência e autorização de recebimento.')

    d.start('Rastreabilidade das telas','Dez telas funcionais, além da recuperação para rota ou evento inexistente')
    rows=[
      ['T01','Visão geral /','RF01, RF02, RF05','Totais, mapa, prioridades e registro.'],['T02','Eventos /alertas','RF03, RF05','Busca, filtros, ordenação e detalhe.'],['T03','Detalhe /alertas/:id','RF04, RF05, RF10, RF11','Fatores, confiança, histórico e transições.'],['T04','Central /notificacoes','RF11, RF12','Leitura, filtros e abertura do evento.'],['T05','Registro /registrar','RF06, RF07, RF16','Formulário validado e confirmação de contexto.'],['T06','Fontes /fontes','RF05, RF13','Origem, confiança e rastreabilidade.'],['T07','Entrada /ingestao','RF07, RF08, RF09','Simulação e importação externa.'],['T08','Análises /analises','RF14','Distribuições, bairro e CSV.'],['T09','Preferências /preferencias','RF15','Filtros, JSON e restauração.'],['T10','Sobre /sobre','RF16','Escopo, limites, privacidade e equipe.'],
    ]
    d.table(['ID','Tela / rota','Requisitos','Evidência navegável'],rows,[35,145,110,219])
    d.h('Fluxos completos')
    d.p('<b>Comunidade:</b> T01 -> T05 -> T03 (Reportado -> Em validação -> Confirmado -> Alerta emitido) -> T04 -> T03 (Em monitoramento -> Encerrado).','small')
    d.p('<b>Fonte externa:</b> T07 -> validar resposta/simulação -> classificar -> T03 -> T04 se elegível. Origem e confiança também ficam acessíveis em T06.','small')
    d.p('<b>Acompanhamento:</b> T02 -> filtrar -> T03; T08 -> analisar/exportar; T09 -> salvar preferências -> T04 com aplicação opcional.','small')

    d.start('Validação e indicadores','Verificações do protótipo e critérios de qualidade do sistema')
    d.h('Verificação funcional')
    d.p('<b>Compilação:</b> TypeScript estrito e build Vite concluídos. <b>Testes automatizados:</b> 18 casos aprovados, cobrindo prioridade, confiança, seis fronteiras de recência, estados finais, transições inválidas, emissão por limiar, validação, horário UTC, leitura meteorológica e estrutura de persistência.')
    d.table(['Fluxo','Resultado observado'],[
      ['Registro e ciclo do evento','Cadastro comunitário, validação, confirmação, emissão, monitoramento e encerramento; histórico preservado e prioridade zero no estado final.'],
      ['Fontes e notificações','Importação Open-Meteo, rejeição de leitura repetida, simulação de sensor e leitura de notificações conferidas.'],
      ['Interface e dados','Dez telas em desktop de 1280 px e celular de 390 × 844 px; busca vazia, rota inexistente, menu móvel, preferências, exportações e restauração conferidos.']],[130,379])
    d.h('Indicadores de sucesso')
    d.table(['Indicador','Medição','Objetivo'],[
      ['Tempo de atualização','Intervalo entre ação aceita e renderização do painel.','Até 1 s para alteração local; recência a cada 30 s.'],
      ['Qualidade dos alertas','Comparação com ocorrências rotuladas por agentes; precisão e falsos positivos por origem.','Precisão de pelo menos 80% em avaliação de campo.'],
      ['Facilidade de uso','Conclusão de tarefas por cinco participantes; tempo de registro e identificação da origem.','Pelo menos 80% de conclusão; registro em até 2 min.']],[105,245,159])
    d.p('Os resultados acima comprovam os fluxos verificados do protótipo. Os objetivos de desempenho, disponibilidade, carga e avaliação de campo são critérios de qualidade da arquitetura, distintos das verificações funcionais.','small')

    d.start('Referências técnicas','Norma de qualidade, proteção de dados, fonte meteorológica e hospedagem')
    refs=[
      ('ISO/IEC 25010:2023','Systems and software engineering - Systems and software Quality Requirements and Evaluation (SQuaRE) - Product quality model. https://www.iso.org/standard/78176.html'),
      ('Lei 13.709/2018','Lei Geral de Proteção de Dados Pessoais. Texto atualizado: https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html'),
      ('Open-Meteo','Weather Forecast API. Documentação de temperatura a 2 m e condições atuais: https://open-meteo.com/en/docs'),
      ('Vercel','Vite on Vercel. Configuração de build e rotas: https://vercel.com/docs/frameworks/frontend/vite'),
    ]
    for title,desc in refs:d.p(f'<b>{title}.</b> {escape(desc)}','body',gap=24)
    d.save()
    write_requirements()
    print(f'PDF criado: {OUT} ({d.page} páginas)')

if __name__=='__main__':main()
