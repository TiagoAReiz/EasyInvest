# Plano de Desenvolvimento do App de Acompanhamento de Carteira

Este documento lista as tarefas necessárias para conceber e construir um aplicativo focado exclusivamente na leitura e consolidação de dados financeiros, sem envio de ordens (Read-Only).

- [/] 1. Definir Arquitetura de Integração B2B
  - [x] Pesquisar APIs do mercado (B3, Pluggy, Gorila, Cripto)
  - [ ] Validar viabilidade técnica do uso da API da B3 e Pluggy
- [x] 2. Definir Stack Tecnológica
  - [x] Escolher framework Frontend (React Native vs Next.js) sugerido na spec.
  - [x] Escolher Backend e Banco de Dados (Node + Postgres Prisma) sugerido na spec.
- [x] 3. Modelagem de Dados
  - [x] Desenhar esquema para representar Ativos (Renda Fixa, Variável, Cripto).
  - [x] Desenhar esquema para Sincronizações e Posições Históricas.
- [ ] 4. Prototipação UI/UX
  - [ ] Tela principal (Dashboard de Consolidação)
  - [ ] Tela de Conexões (Pluggy/Open Finance, B3, Chaves Binance)
- [/] 5. Implementação Inicial (MVP)
  - [x] Setup do projeto (Frontend e Backend)
  - [ ] Integrar primeira fonte de dados (ex: API da Binance por ser aberta e gratuita)
