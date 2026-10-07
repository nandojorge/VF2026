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
