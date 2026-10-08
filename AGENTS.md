# Instruções do projeto VF2026

- Preservar todas as funcionalidades da app nas otimizações.
- Antes de cada alteração publicada, guardar um ponto de recuperação no GitHub e documentá-lo em RECUPERACAO.md.
- Em cada atualização da app, incrementar o número de versão visível no arranque. A versão atual é 4.0.48; o valor está em `buildVersion` no bundle `_next/static/chunks/pages/_app-f6904a460351655b.js`. Incrementar o último número na próxima atualização, salvo indicação diferente do utilizador.
- Atualizar também a versão de cache dos scripts nos ficheiros HTML e verificar a publicação no GitHub Pages.
- Usar dados fictícios nos testes de gravação.
