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
