# Revisão da app — 4.0.52

## Correções

- **Primeira gravação de pagamentos:** a criação e edição reconhecem estado inicial indefinido como uma nova operação, em vez de entrarem no percurso de retoma.
- **Captura de campos e códigos:** os valores do formulário e parâmetros de navegação são obtidos explicitamente; o motor da app não permite enumerá-los como um objeto JavaScript normal. A edição mantém os identificadores do pagamento e movimento nos pedidos.
- **Validação antes da edição:** se faltar um dos identificadores, a operação para antes de enviar qualquer gravação e pede para reabrir o pagamento.
- **Dependências das expressões:** acrescentadas 13 referências em falta nos pedidos da criação de pagamentos. No navegador, confirmou-se que valor, conta, datas e códigos passaram a constar dos pedidos.
- **Data da criação de sessão:** a sincronização externa recebe um datetime ISO completo mesmo quando o formulário contém apenas a data.
- **Carregamento mobile:** largura e altura usam a janela disponível, em vez das dimensões físicas do ecrã, evitando o transbordo horizontal observado numa janela de 360 px.

## Verificação

- 557 fluxos examinados para ligações internas quebradas: nenhuma.
- 2.278 expressões verificadas quanto a sintaxe e dependências de campos: aprovadas.
- Referências locais a recursos nos HTML verificadas, incluindo caminhos com caracteres codificados.
- 30 ecrãs principais abertos no navegador local com dados fictícios a 360 px. Sem erros de JavaScript observados. Depois da correção de largura, os 30 ecrãs não apresentaram transbordo horizontal nos cenários examinados.
- Criação e edição de pagamentos testadas no motor real no navegador, com API fictícia; corpos enviados inspecionados. Na edição, confirmados `codigopagamentos` e `id_despesa` nas condições dos pedidos.
- Testes de fluxos de gravação: criação/edição de pagamentos e sessões, comissão, honorários, cancelamento, erros de pedidos, retoma, proteção contra clique repetido e repetição de consultas sem repetir gravações.
- Regressão de criação/edição de contactos, leads e ações: payloads, falhas, estado local e reconciliação em segundo plano.
- Teste permanente: `node scripts/check-app.cjs`, sem rede nem gravações reais. Inclui o comportamento de objetos não enumeráveis e acesso apenas às dependências declaradas, que os testes antigos não simulavam.

## Limites

Esta revisão não garante a ausência de todos os erros possíveis. A inspeção dos 30 ecrãs é uma verificação de abertura, erros de execução e largura; não cobre todas as combinações de campos, histórico e dados de produção. Não foram efetuadas gravações reais nem testes em dispositivos físicos iOS/Android. Permissões, disponibilidade e respostas reais dos serviços externos não são validadas pelos testes com API fictícia. A proposta de redesign mantém-se separada: esta atualização preserva o aspeto e as funcionalidades existentes.

## Recuperação

Versão anterior: 4.0.51, commit c985038.
Branch remoto: `backup/antes-auditoria-4.0.52`.
