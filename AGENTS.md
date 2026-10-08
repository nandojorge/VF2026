# Instruções do projeto VF2026

- Preservar todas as funcionalidades da app nas otimizações.
- Antes de cada alteração publicada, guardar um ponto de recuperação no GitHub e documentá-lo em RECUPERACAO.md.
- Em cada atualização da app, incrementar o número de versão visível no arranque. A versão atual é 4.0.55; o valor está em `buildVersion` no bundle `_next/static/chunks/pages/_app-f6904a460351655b.js`. Incrementar o último número na próxima atualização, salvo indicação diferente do utilizador.
- Atualizar também a versão de cache dos scripts nos ficheiros HTML e verificar a publicação no GitHub Pages.
- Usar dados fictícios nos testes de gravação.
- Prioridade de interface: funcionamento mobile, elegante e sem falhas; desktop pode manter o mesmo formato mobile centrado. Preservar todos os menus, campos e ações.

- Usar sempre e sem exceção as fontes originais da app em todos os componentes, incluindo mensagens, calendários e notificações. Preservar famílias por componente e fontes de ícones; variantes inexistentes devem resolver para ficheiros originais da mesma família, sem introduzir fontes externas.
