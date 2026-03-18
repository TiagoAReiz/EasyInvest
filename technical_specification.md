# Especificação Técnica e Modelagem (MVP)

Este documento define a estrutura tecnológica sugerida e o esqueleto do banco de dados para suportar a arquitetura *Read-Only* do nosso consolidador de investimentos.

## 1. Sugestão de Stack Tecnológica

Para criar um MVP rápido, robusto e escalável para web e mobile (futuramente), recomendo a seguinte combinação:

*   **Frontend (Aplicativo / Interface):** 
    *   **Opção Principal:** `Next.js` (React). Ótimo para começar com uma plataforma acessível pelo navegador com excelente performance (SEO e experiência do usuário).
    *   **Autenticação:** `Google OAuth` (OAuth 2.0). Simplifica o login para o usuário, remove a necessidade do app de guardar senhas com segurança máxima (risco vazamentos) e passa muita credibilidade na aba de finanças.
    *   **Estilização:** `TailwindCSS` (para criar interfaces modernas e responsivas rapidamente).
*   **Backend (Servidor & Motor de Cálculo):** 
    *   **A Escolha de Ouro:** `Python` + `FastAPI`. O Python é imbatível para mercado financeiro devido às suas bibliotecas de cálculos de dados em massa (`pandas`) e integrações consagradas com APIs de bolsas do mundo todo (Yahoo Finance, `yfinance`, integrações nativas de ferramentas Cripto). O FastAPI garante que esse backend rode na mesma velocidade do Node.js, sendo extremamente enxuto.
*   **Banco de Dados:** 
    *   `PostgreSQL` (Relacional). Essencial para lidar de forma consistente com dinheiro, transações e relacionamento entre usuários e seus milhares de ativos.
    *   **ORM Python:** `SQLAlchemy` ou `SQLModel` (para facilitar a conversa entre o Python e o PostgreSQL).

---

## 2. Modelagem Inicial do Banco de Dados (Esquema simplificado)

Abaixo estruturamos como os dados devem ser guardados no nosso banco de dados para suportar os três pilares (Renda Variável, Fixa e Cripto) sem depender de conexões pagas ativas 24h.

### Tabela `User` (Usuários)
Armazena a identidade do cliente vinculada ao seu Google OAuth.
*   `id` (UUID, Primary Key)
*   `google_id` (String, Unique - *O identificador retornado pelo Google Login*)
*   `name` (String)
*   `email` (String, Unique)
*   `avatar_url` (String, Opcional - *A foto do usuário vinda do Gmail*)
*   `created_at` (Timestamp)

### Tabela `WalletConnection` (Conexões)
Armazena as chaves de integração automáticas que o usuário gerou.
*   `id` (UUID, Primary Key)
*   `user_id` (Foreign Key -> User)
*   `type` (Enum: 'BINANCE', 'B3_OAUTH', 'PLUGGY' - *Deixar preparado para o futuro*)
*   `api_key` (String - Criptografado no banco)
*   `api_secret` (String - Criptografado no banco)
*   `last_synced_at` (Timestamp - Quando puxamos o saldo pela última vez)

### Tabela `Asset` (O Catálogo de Ativos do App)
Uma lista única e mestra do app. Não pertence ao usuário, mas sim ao mercado.
*   `id` (UUID, Primary Key)
*   `ticker` (String, ex: "PETR4", "BTC", "TESOURO_IPCA_2035")
*   `name` (String, ex: "Petrobras PN", "Bitcoin")
*   `type` (Enum: 'STOCK', 'FII', 'CRYPTO', 'FIXED_INCOME', 'CASH')
*   `current_price` (Decimal - *Atualizado via brapi.dev / Yahoo*)
*   `last_price_update` (Timestamp)

### Tabela `PortfolioPosition` (A Carteira do Usuário)
A tabela mais importante. Cruza o "O que existe" (Asset) com "O que o usuário tem" (User).
*   `id` (UUID, Primary Key)
*   `user_id` (Foreign Key -> User)
*   `asset_id` (Foreign Key -> Asset)
*   `quantity` (Decimal - Quantas cotas daquele ativo o usuário tem)
*   `average_price` (Decimal - Quanto o usuário pagou em média)
*   `origin` (Enum: 'MANUAL', 'BINANCE_API', 'B3_API')
*   `institution_name` (String, Opcional. Ex: "XP Investimentos", "Mercado Bitcoin")
*   `created_at` (Timestamp)
*   `updated_at` (Timestamp)

### Tabela `PositionHistory` (O Gráfico de Rentabilidade)
Para montar o gráfico "Evolução do Patrimônio" da tela inicial.
*   `id` (UUID, Primary Key)
*   `user_id` (Foreign Key -> User)
*   `date` (Date - Fechamento do dia)
*   `total_equity` (Decimal - Patrimônio total em R$)
*   `crypto_equity` (Decimal)
*   `stock_equity` (Decimal)
*   `fixed_income_equity` (Decimal)

---

## 3. Fluxo de Dados Diário ("O Motor")

Todo dia no final da tarde, o servidor do nosso App (Node.js) executa uma rotina automática (*CRON Job*):
1.  Olha a tabela `Asset` e vê tudo que é `STOCK` ou `FII` (Ações Brasileiras).
2.  Chama a API gratuita da **brapi.dev**.
3.  Atualiza o campo `current_price` na tabela `Asset`.
4.  Olha a tabela `PortfolioPosition` de cada usuário, multiplica a `quantity` pelo novo `current_price`.
5.  Grava o resultado final do patrimônio do dia na tabela `PositionHistory` para gerar aquele gráfico bonito de subida/descida no celular do usuário.
