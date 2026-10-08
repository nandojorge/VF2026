# Recuperar a versão anterior

Versão original: commit `5834b4d`.
Branch de recuperação no GitHub: `backup/antes-carregamento-2026-10-07`.
Tag local: `backup-antes-carregamento-2026-10-07`.
Cópia completa do histórico Git: `../VF2026-antes-carregamento-2026-10-07.bundle`.

Para voltar à app original mantendo o histórico, reverter o commit da melhoria
com `git revert` na branch main e enviar para o GitHub. O GitHub Pages publica
a reversão automaticamente. Não é necessário apagar o repositório.

A melhoria só acrescenta loading-status.js às páginas. O JavaScript compilado,
os dados e as integrações originais não foram alterados. O botão Tentar novamente
recarrega a página apenas enquanto o ecrã inicial de carregamento está visível.
Não são repetidos pedidos de gravação pela melhoria. O aviso de demora surge
após 20 segundos; uma demora não é apresentada como um erro confirmado.

## Antes da recuperação automática de pedidos

Branch: `backup/antes-recuperacao-2026-10-07` (commit `2f1273e`).
A recuperação automática repete apenas leituras falhadas no arranque, após 5 segundos; não repete gravações. O painel aguarda também a lista de verificação de contactos duplicados.

Validação: falha HTTP 404 simulada numa leitura de contactos; nova tentativa aos 5 segundos, resposta 200 e abertura do painel. As restantes sete leituras foram executadas uma única vez e os indicadores mantiveram os valores da referência. As definições dos recursos e os restantes fluxos foram preservados.

## Antes da pesquisa alargada de contactos

Branch: `backup/antes-pesquisa-contactos-2026-10-07` (commit `ff3db71`).
A lista de contactos passa a pesquisar nome, telefone e email; ignora diferenças de maiúsculas e acentos no nome e separadores comuns no telefone. Durante uma pesquisa apresenta todos os resultados, independentemente da página anterior. A pesquisa e a página mantêm-se durante a sessão ao abrir um contacto e voltar; reiniciar a app limpa este estado.

Validação: testes com dados fictícios para acentos, maiúsculas, email, telefone formatado, campos vazios, ausência de resultados e pesquisa iniciada na página 3. Na app local, pesquisa por nome sem acentos, telefone com espaços e abertura/regresso ao contacto passaram. Recursos e fluxos de outras páginas preservados; expressões da lista isoladas para não alterar outros ecrãs.

## Antes da verificação reforçada de duplicados

Branch: `backup/antes-duplicados-2026-10-07` (commit `12222fe`).
A conversão de entradas atualiza primeiro a lista completa de contactos. Compara telefone sem separadores (incluindo equivalência entre número português de nove dígitos, +351 e 00351) e email sem maiúsculas ou espaços nas extremidades. Campos vazios não contam como correspondência.

Quando encontra correspondências, permite abrir o primeiro contacto, voltar ao formulário ou confirmar explicitamente a criação de outro. Abrir o contacto mantém a entrada por tratar. Uma falha na consulta impede a criação e mantém o formulário.

Validação: 15 cenários de normalização; comparação estrutural dos restantes fluxos, recursos e pedidos de gravação; teste local com contacto fictício, abertura da ficha e cancelamento dos dois avisos. O cancelamento preservou o formulário sem tentar gravar. Testes locais bloquearam todas as gravações; nenhum registo real foi criado.

## Antes da confirmação de gravação de novos contactos

Branch: `backup/antes-confirmacao-gravacao-2026-10-07` (commit `9ca02f1`).
Esta melhoria aplica-se ao formulário Novo Contacto (Page3). Mostra A guardar…, desativa o botão durante o fluxo e só confirma o sucesso depois dos pedidos necessários. Em caso de falha, mantém o formulário e permite retomar o pedido que falhou sem repetir os pedidos anteriores já confirmados. Se a resposta a um POST falhar, informa que o registo pode já existir e pede confirmação antes de repetir esse passo. Não há repetição automática de gravações. O ponto de retoma existe apenas enquanto o formulário permanece aberto; não recarregar a página para repetir uma gravação parcial.

Validação: simulação de sucesso e falha em cada um dos 14 pedidos, retoma sem repetir pedidos anteriores, cancelamento da confirmação de repetição incerta, bloqueio de submissão concorrente e preservação dos campos. Teste no navegador com servidor local fictício: botão desativado durante a gravação, aviso de falha e retoma sem repetir o contador anterior. Recursos, conteúdos dos pedidos HTTP e fluxos das restantes páginas preservados. Nenhum pedido de gravação do teste foi enviado aos serviços reais.

## Antes da edição rápida de leads

Branch: `backup/antes-edicao-leads-rapida-2026-10-07` (commit `df3d6c4`).
Depois de confirmar o PUT de edição, a app atualiza os quatro campos enviados na lead local e regressa à ficha sem aguardar a releitura da lista. A gravação usa uma cópia dos valores submetidos. Os restantes campos e registos mantêm-se.

A leitura de reconciliação continua em segundo plano para recuperar campos calculados pelo servidor. Só incorpora a lead quando os quatro campos do servidor correspondem à gravação pendente e os valores locais ainda correspondem a essa gravação. Uma resposta antiga não substitui uma edição mais recente. Leituras falhadas ou ainda desatualizadas ficam pendentes e voltam a ser tentadas ao abrir o painel. Esta melhoria reduz a espera antes de regressar à ficha; não elimina a leitura de reconciliação nem reduz o tempo do PUT no serviço externo.

Se não houver uma lead correspondente na lista local, mantém-se a leitura completa antes do regresso. Se essa leitura falhar depois de gravar, Atualizar lista repete apenas a leitura. Falhas na gravação mantêm os campos e não alteram a lista local. O botão fica desativado durante o pedido.

Validação: payload equivalente ao original; campos e registos não editados preservados; códigos numéricos e textuais; motivo limpo quando aplicável; falha de PUT; lista ausente; falha da leitura alternativa e repetição sem novo PUT; bloqueio concorrente; reconciliação de campos calculados; resposta antiga e edição mais recente protegidas. Navegador com serviços fictícios e pedidos externos bloqueados: estado local atualizado, botão desativado, reconciliação concluída e navegação para outro ecrã antes de terminar a leitura artificialmente lenta (3 segundos). Recursos existentes e restantes fluxos preservados; adicionada apenas uma leitura condicional ao foco do painel.

Referência de semântica do PUT: https://docs.steinhq.com/update-rows (campos omitidos mantêm-se; resposta devolve o intervalo atualizado).

## Antes da edição rápida de contactos

Branch: `backup/antes-edicao-contactos-rapida-2026-10-07` (commit `2e254f5`).
Na edição de contactos (Page5), o PUT confirmado atualiza os nove campos enviados na lista local e na lista de verificação de duplicados. A integração PATCH mantém-se antes do regresso à ficha, incluindo os avisos e registos de erro originais. Os dados e o endereço da integração são capturados ao submeter para corresponderem à mesma gravação. O nome da ficha atual também é atualizado.

A releitura da lista ocorre em segundo plano e incorpora apenas o contacto correspondente quando os campos locais e os campos recebidos ainda coincidem com a gravação pendente. Recupera assim campos calculados sem substituir edições mais recentes. Uma reconciliação falhada/desatualizada volta a ser tentada ao abrir o painel. Se o contacto estiver ausente da lista local, mantém-se a leitura completa como alternativa; uma falha nessa leitura permite repetir só a leitura. Falhas de PUT preservam o formulário e os registos de erro existentes. A melhoria retira a leitura completa do caminho normal de espera; não acelera o PUT nem elimina a espera pela integração PATCH.

Validação: payloads e endereço da integração equivalentes aos originais, captura estável durante alterações, nove campos atualizados e restantes preservados, registos não editados intactos, verificação de duplicados atualizada, falha de PUT com registo de erro, leitura alternativa e repetição sem novo PUT, bloqueio concorrente, campos calculados reconciliados, resposta antiga/edição recente protegidas e caminhos de erro da integração mantidos. No navegador, serviços locais fictícios com pedidos externos bloqueados: PUT de 1 segundo, PATCH de 1 segundo e leitura de 4 segundos; a navegação ocorreu depois do PATCH e antes do fim da leitura, que concluiu no novo ecrã. Nenhuma gravação real foi feita nos testes.

## Edição de ações — 8 de outubro de 2026
Ponto de recuperação: `backup/antes-edicao-acoes-rapida-2026-10-08` (c9bb792).
A edição na página 6 aguarda a confirmação do PUT e atualiza a ação em memória antes de regressar. A leitura completa decorre em segundo plano, com proteção contra respostas antigas e novas edições. Mantém os dados, filtros, histórico e registo de erros anteriores. Se a ação não estiver em memória, mantém a leitura original; a repetição após falha desta leitura não repete o PUT confirmado. O botão impede submissões simultâneas.
Verificação: sintaxe JavaScript, recursos e restantes fluxos inalterados; testes com dados fictícios para fechar/reabrir, payload original, preservação de campos, falhas, repetição só da leitura e reconciliação. Nenhuma gravação real foi feita nos testes.

## Criação de ações — 8 de outubro de 2026
Ponto de recuperação: `backup/antes-criacao-acoes-rapida-2026-10-08` (97a54a4).
Mantém o cálculo do número e a ordem contador PUT → ação POST, com os mesmos corpos de pedido. Após confirmação da criação, acrescenta a ação à lista local com os dados do contacto e regressa; a leitura completa decorre em segundo plano, conciliando os campos calculados sem substituir edições posteriores. Este fluxo não tinha notificações associadas. Os restantes fluxos e recursos foram preservados.
O botão bloqueia submissões simultâneas. Uma falha do contador não envia a criação. Se a criação não for confirmada, consulta a lista antes de qualquer repetição: uma ação idêntica já existente conclui o fluxo, um conflito de número bloqueia a repetição e uma ausência exige confirmação explícita do risco de duplicado. Falha da consulta mantém os dados e permite verificar novamente sem reenviar o POST nem atualizar novamente o contador confirmado. A numeração original continua a depender do contador existente; esta alteração não cria uma reserva transacional entre utilizadores.
Verificação: sintaxe, ligações do fluxo, recursos/restantes fluxos/componentes preservados; testes fictícios de payloads, ramos da numeração, sucesso, falhas, confirmação/cancelamento, verificação de POST incerto e respostas antigas. No navegador local, PUT e POST simulados de 1 s cada permitiram regressar em cerca de 2 s, enquanto o GET de 5 s continuou e sincronizou após sair da página. Não foram criadas ações reais nos testes.

## Versão 4.0.43 — tabelas de apoio em sessão
Ponto de recuperação: `backup/antes-cache-apoio-2026-10-08` (eb2d4ce).
Os 19 fluxos de leitura de `tabelas` e `concelhos` partilham uma cache apenas em memória durante a sessão. A primeira leitura mantém o pedido original; as seguintes preenchem imediatamente o formulário com os dados disponíveis. Na mudança do minuto, o primeiro formulário que utiliza o recurso consulta novamente a API em segundo plano. A cache atualizada evita novas consultas nesse minuto; uma atualização em curso não é duplicada quando já existem dados. Leituras iniciais simultâneas sem cache mantêm os pedidos originais para não deixar formulários sem opções. Uma falha mantém os dados em cache e permite nova tentativa na próxima utilização; uma lista vazia confirmada também é válida. Reabrir/recarregar a app inicia uma sessão nova.
Versão visível incrementada de 4.0.42 para 4.0.43 e scripts HTML atualizados. AGENTS.md regista a instrução do utilizador para incrementar a versão em cada atualização.
Verificação: testes dos 19 fluxos (primeira leitura, reutilização, atualização, falha, lista vazia e consulta em curso); restantes fluxos, componentes e recursos inalterados. No navegador local, o formulário mostrou a opção em cache e depois a opção atualizada pela consulta simulada de 5 segundos. Nenhuma gravação real foi feita.

## Versão 4.0.44 — pesquisa de contactos
Ponto de recuperação: `backup/antes-lista-contactos-4.0.44` (d2af931).
A expressão da lista normaliza a pesquisa e separa as palavras uma vez por atualização. Cada nome é normalizado apenas uma vez por contacto, e o ramo sem pesquisa usa diretamente a paginação, sem executar o filtro completo. Mantém os resultados por nome, telefone e email, acentos, espaços, ordem dos contactos e a apresentação de todos os resultados de pesquisa. Não altera fluxos de navegação, estado de pesquisa/página, componentes nem recursos.
Verificação: 60 comparações com a expressão anterior e testes de navegador com contactos fictícios (nome com palavras intermédias, telefone formatado e email). Com 205 contactos, a contagem de REPLACE_ALL passou de 20.944 para 34 na pesquisa vazia e de 45.372 para 13.906 em “alice marques”. Estas contagens medem trabalho de normalização, não o tempo de resposta da API. Versão visível e scripts HTML incrementados para 4.0.44.

## Versão 4.0.45 — contadores do painel
Ponto de recuperação: `backup/antes-painel-4.0.45` (3401129).
Os 18 contadores baseados nas seis listas globais são calculados numa passagem por lista e guardados em memória. Os 47 pontos que alteram essas listas recalculam apenas o grupo afetado, antes de continuar as ligações originais; inclui atualizações locais após gravação e reconciliação em segundo plano. O foco do painel recalcula os seis grupos, incluindo os contadores dependentes da data. Enquanto um contador ainda não tiver sido calculado, mantém a expressão anterior como recurso. Os contadores de entradas mantêm o fluxo original. Não há novos pedidos à API nem alteração de payloads.
Verificação: comparação dos 18 contadores em 20 conjuntos de dados, listas vazias, tipos/estados, alteração local e mudança de dia. Remover os 47 nós de cálculo recupera exatamente os fluxos anteriores, incluindo corpos dos pedidos e continuações. No navegador, uma criação fictícia atualizou o contador e a sincronização posterior manteve-o correto. Versão visível e scripts HTML incrementados para 4.0.45. Nenhuma gravação real foi feita nos testes.
