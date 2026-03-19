# Especificação Técnica e Modelagem (MVP)

Este documento define a estrutura tecnológica sugerida e o esqueleto do banco de dados para suportar a arquitetura *Read-Only* do nosso consolidador de investimentos.

## 1. Sugestão de Stack Tecnológica

Para criar um MVP rápido, robusto e escalável para web e mobile (futuramente), recomendo a seguinte combinação:

*   **Frontend (Aplicativo / Interface):** 
    *   **Opção Principal:** `Next.js` (React). Ótimo para começar com uma plataforma acessível pelo navegador com excelente performance (SEO e experiência do usuário).
    *   **Autenticação no Front:** `NextAuth.js (Auth.js)` com provider `Google OAuth 2.0`. O NextAuth gerencia todo o fluxo de login/logout, callbacks e sessão no lado do cliente. Após o login, o backend emite um **JWT próprio** para autenticar as chamadas à API.
    *   **Estilização:** `TailwindCSS` (para criar interfaces modernas e responsivas rapidamente).
*   **Backend (Servidor & Motor de Cálculo):** 
    *   **A Escolha de Ouro:** `Python` + `FastAPI`. O Python é imbatível para mercado financeiro devido às suas bibliotecas de cálculos de dados em massa (`pandas`) e integrações consagradas com APIs de bolsas do mundo todo (Yahoo Finance, `yfinance`, integrações nativas de ferramentas Cripto). O FastAPI garante que esse backend rode na mesma velocidade do Node.js, sendo extremamente enxuto.
*   **Banco de Dados:** 
    *   `PostgreSQL` (Relacional). Essencial para lidar de forma consistente com dinheiro, transações e relacionamento entre usuários e seus milhares de ativos.
    *   **ORM Python:** `SQLAlchemy` ou `SQLModel` (para facilitar a conversa entre o Python e o PostgreSQL).

---

## 2. Autenticação e Autorização (Google OAuth + JWT Próprio)

A autenticação segue um fluxo em duas etapas: o Google prova **quem é** o usuário, e o nosso backend emite um **JWT próprio** que controla **o que ele pode fazer**.

### Fluxo de Login

```
[Usuário clica "Entrar com Google"]
        │
        ▼
[NextAuth.js] ──► Redireciona para Google OAuth
        │
        ▼
[Google] ──► Retorna id_token (JWT do Google com email, nome, foto)
        │
        ▼
[NextAuth Callback] ──► Chama POST /api/auth/login no nosso backend
        │
        ▼
[FastAPI Backend]
   1. Valida o id_token com a lib `google-auth` do Python
   2. Extrai: google_id, email, name, avatar_url
   3. UPSERT na tabela User (cria se não existe, atualiza dados se existe)
   4. Gera um PAR de tokens:
      Access Token (JWT, curta duração):
      {
        "sub": "uuid-do-usuario",
        "plan": "FREE",
        "type": "access",
        "exp": ...  (1 hora)
      }
      Refresh Token (JWT, longa duração):
      {
        "sub": "uuid-do-usuario",
        "type": "refresh",
        "exp": ...  (7 dias)
      }
   5. Retorna ambos pro frontend
        │
        ▼
[Frontend] armazena os tokens (httpOnly cookies)
   → Requests à API usam o Access Token no header Authorization
   → Quando o Access Token expira (401), chama POST /api/auth/refresh com o Refresh Token
   → Recebe um novo Access Token + novo Refresh Token (rotação)
```

### Regras de Autorização

*   **Permissões e planos (`FREE`, `PREMIUM`) são gerenciados no nosso banco**, não no Google. O Google só autentica a identidade.
*   O Access Token carrega o `plan` do usuário. Endpoints premium verificam esse claim antes de processar.
*   **Refresh com rotação:** Quando o Access Token expira (1h), o frontend chama `POST /api/auth/refresh` enviando o Refresh Token. O backend valida, revoga o Refresh Token antigo, e retorna um **novo par** (Access + Refresh). Se o Refresh Token também expirou (7 dias), o usuário precisa fazer login com Google novamente.

### Segurança

*   O `JWT_SECRET` do backend **nunca** é exposto ao frontend.
*   Tokens são transmitidos exclusivamente via **HTTPS**.
*   Cookies de sessão usam flags `httpOnly`, `Secure`, `SameSite=Strict`.

---

## 3. Modelagem Inicial do Banco de Dados (Esquema simplificado)

Abaixo estruturamos como os dados devem ser guardados no nosso banco de dados para suportar os três pilares (Renda Variável, Fixa e Cripto) sem depender de conexões pagas ativas 24h.

### Tabela `User` (Usuários)
Armazena a identidade do cliente vinculada ao seu Google OAuth.
*   `id` (UUID, Primary Key)
*   `google_id` (String, Unique - *O identificador retornado pelo Google Login*)
*   `name` (String)
*   `email` (String, Unique)
*   `avatar_url` (String, Opcional - *A foto do usuário vinda do Gmail*)
*   `plan` (Enum: `FREE`, `PREMIUM` - Default: `FREE`. *Controla acesso a features premium*)
*   `created_at` (Timestamp)
*   `updated_at` (Timestamp)

### Tabela `WalletConnection` (Conexões)
Armazena as chaves de integração automáticas que o usuário gerou.
*   `id` (UUID, Primary Key)
*   `user_id` (Foreign Key -> User)
*   `type` (Enum: 'BINANCE', 'MERCADO_BITCOIN', 'B3_OAUTH', 'PLUGGY' - *Deixar preparado para o futuro*)
*   `label` (String, Opcional. Ex: "Minha Binance principal" - *UX: usuário pode ter mais de uma conexão*)
*   `api_key_encrypted` (String - **Criptografado com AES-256-GCM**)
*   `api_secret_encrypted` (String - **Criptografado com AES-256-GCM**)
*   `status` (Enum: `ACTIVE`, `ERROR`, `REVOKED` - *Permite sinalizar quando uma key parou de funcionar*)
*   `last_synced_at` (Timestamp - Quando puxamos o saldo pela última vez)
*   `created_at` (Timestamp)

> **⚠️ Segurança das API Keys:** A chave de criptografia (`ENCRYPTION_KEY`) **não fica no banco de dados**. Ela é armazenada como **GitHub Actions Secret** e injetada como variável de ambiente no Container App durante o deploy (via `az containerapp update --set-env-vars`), mesmo padrão usado no TeAchei. No ambiente de desenvolvimento, fica no `.env` local (nunca commitado no Git).

### Tabela `Asset` (O Catálogo de Ativos do App)
Uma lista única e mestra do app. Não pertence ao usuário, mas sim ao mercado. Contém apenas dados **estáticos** do ativo — cotações ficam na tabela `AssetQuote`.
*   `id` (UUID, Primary Key)
*   `ticker` (String, Unique. Ex: "PETR4", "BTC", "TESOURO_IPCA_2035")
*   `name` (String, ex: "Petrobras PN", "Bitcoin")
*   `type` (Enum: 'STOCK', 'FII', 'CRYPTO', 'FIXED_INCOME', 'CASH')
*   `sector` (String, Opcional. Ex: "Petróleo", "Logística" - *útil para filtros futuros*)
*   `created_at` (Timestamp)

### Tabela `AssetQuote` (Histórico de Cotações)
Armazena cada cotação capturada. A cotação atual de um ativo é simplesmente o registro mais recente. Isso dá histórico de preços de graça.
*   `id` (UUID, Primary Key)
*   `asset_id` (Foreign Key -> Asset)
*   `price` (Decimal - Cotação capturada)
*   `fetched_at` (Timestamp - Quando foi buscada)
*   **Índice:** `(asset_id, fetched_at DESC)` — para consultas rápidas do tipo "último preço do ativo X".

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

**Campos exclusivos para Renda Fixa** *(nulláveis — só preenchidos quando o ativo é `FIXED_INCOME`):*
*   `rate_type` (Enum: `CDI_PERCENTAGE`, `CDI_PLUS`, `PREFIXED`, `IPCA_PLUS` - *Tipo de remuneração*)
*   `rate_value` (Decimal - Ex: `110` para "110% CDI", `12.5` para "IPCA + 12.5%", `13.0` para "Pré-fixado 13% a.a.")
*   `investment_date` (Date - Quando aplicou o dinheiro)
*   `maturity_date` (Date - Vencimento do título)
*   `invested_amount` (Decimal - Valor aplicado em R$. *Necessário porque renda fixa não tem "quantity x preço" — o rendimento é calculado sobre o valor investido*)

### Tabela `PositionHistory` (O Gráfico de Rentabilidade)
Para montar o gráfico "Evolução do Patrimônio" da tela inicial.
*   `id` (UUID, Primary Key)
*   `user_id` (Foreign Key -> User)
*   `date` (Date - Fechamento do dia)
*   `total_equity` (Decimal - Patrimônio total em R$)
*   `crypto_equity` (Decimal)
*   `stock_equity` (Decimal)
*   `fixed_income_equity` (Decimal)
*   **Constraint:** `UNIQUE(user_id, date)` — garante idempotência (CRON rodar 2x no mesmo dia não duplica).
*   **Índice:** `(user_id, date DESC)` — otimiza queries do gráfico ("últimos 30/90/365 dias do usuário X").

> **Retenção de dados:** No MVP, manter todos os registros. Após atingir escala (+10k usuários), considerar agregar dados antigos: manter granularidade diária por 1 ano, semanal por 2 anos, mensal além disso.

---

## 4. Fluxo de Dados Diário ("O Motor")

Todo dia no final da tarde, o backend **FastAPI** executa uma rotina automática (*CRON Job* via `APScheduler` ou task scheduler):

**Etapa 1 — Renda Variável (Ações, FIIs, BDRs):**
1.  Olha a tabela `Asset` e vê tudo que é `STOCK` ou `FII`.
2.  Chama a API gratuita da **brapi.dev** (em batch, agrupando tickers para minimizar requests).
3.  **Insere** um novo registro na tabela `AssetQuote` com o preço e timestamp atuais.

**Etapa 2 — Renda Fixa (CDBs, Tesouro, LCIs):**
4.  Busca a taxa CDI diária atualizada via **API do Banco Central (SGS)** (série 12, gratuita).
5.  Para cada `PortfolioPosition` de renda fixa, calcula o rendimento acumulado usando `rate_type`, `rate_value`, `invested_amount` e a taxa CDI obtida.

**Etapa 3 — Criptomoedas (Binance, Mercado Bitcoin, etc.):**
6.  Consulta a tabela `WalletConnection` e filtra as conexões com `status = ACTIVE`.
7.  Para cada conexão, chama a **API oficial da exchange** (ex: Binance `/api/v3/account`, Mercado Bitcoin `/api/v4/accounts`) usando as API Keys descriptografadas em memória.
8.  Sincroniza os saldos retornados: atualiza `quantity` na `PortfolioPosition` (com `origin = 'BINANCE_API'` ou equivalente).
9.  Busca cotações atuais dos ativos crypto via API pública da exchange (sem necessidade de key) e **insere** na `AssetQuote`.
10. Se uma API Key retornar erro de autenticação (revogada ou expirada), atualiza o `status` da `WalletConnection` para `ERROR` para alertar o usuário na próxima abertura do app.

**Etapa 4 — Consolidação:**
11. Olha a tabela `PortfolioPosition` de cada usuário, multiplica `quantity` pelo preço mais recente da `AssetQuote` (para renda variável e cripto) e usa o saldo simulado (para renda fixa).
12. Grava o resultado final do patrimônio do dia na tabela `PositionHistory` (com constraint `UNIQUE(user_id, date)` para garantir idempotência).

**Resiliência:**
*   **brapi.dev ou API do BCB fora:** Registra erro em log, usa últimos dados disponíveis, retenta na próxima execução.
*   **Exchange fora (Binance, MB):** Mantém o último saldo sincronizado, marca `WalletConnection.status = ERROR` se persistir por 3 tentativas consecutivas.
*   **API Key inválida:** Marca `status = ERROR` imediatamente, não retenta (requer ação do usuário).

---

## 5. Endpoints da API (MVP)

Todas as rotas protegidas exigem o JWT próprio no header `Authorization: Bearer <token>`. O backend valida o token via middleware antes de processar qualquer request.

### Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/auth/login` | Público | Recebe `id_token` do Google, faz UPSERT no User, retorna JWT próprio |
| `POST` | `/api/auth/refresh` | JWT | Renova o JWT antes de expirar |
| `GET` | `/api/auth/me` | JWT | Retorna dados do usuário logado (id, name, email, plan) |

### Portfólio (Carteira)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/portfolio` | JWT | Retorna todas as posições do usuário com cotação atual |
| `GET` | `/api/portfolio/summary` | JWT | Retorna o patrimônio consolidado (total, por classe de ativo) |
| `POST` | `/api/portfolio/position` | JWT | Cria posição manual (ações, FIIs, renda fixa) |
| `PUT` | `/api/portfolio/position/{id}` | JWT | Edita posição existente (ex: ajustar preço médio) |
| `DELETE` | `/api/portfolio/position/{id}` | JWT | Remove posição da carteira |

### Histórico / Gráficos

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/portfolio/history?period=30d` | JWT | Retorna dados do `PositionHistory` para o gráfico de evolução. Aceita `period`: `7d`, `30d`, `90d`, `1y`, `all` |

### Ativos (Catálogo)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/assets/search?q=PETR` | JWT | Busca ativos no catálogo por ticker ou nome |
| `GET` | `/api/assets/{id}/quotes?period=30d` | JWT | Histórico de cotações de um ativo específico |

### Conexões (Exchanges Cripto)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/connections` | JWT | Lista todas as conexões do usuário |
| `POST` | `/api/connections` | JWT | Registra nova API Key de exchange (criptografada antes de gravar) |
| `DELETE` | `/api/connections/{id}` | JWT | Remove uma conexão |
| `POST` | `/api/connections/{id}/sync` | JWT | Força um sync manual com a exchange |

---

## 6. Estratégia de Cache

Para evitar que centenas de usuários simultâneos façam a mesma query ao banco, usamos cache em camadas:

*   **Tecnologia:** `Redis` (ou cache in-memory simples como `cachetools` do Python no MVP).
*   **O que cachear e por quanto tempo:**

| Dado | TTL | Justificativa |
|------|-----|---------------|
| Cotações (`AssetQuote` mais recente) | 5 min | Brapi já tem delay de 15 min, não precisa de refresh constante |
| Catálogo de ativos (`Asset`) | 1 hora | Dados estáticos, raramente mudam |
| Portfólio do usuário (`PortfolioPosition`) | 30 seg | Invalida ao criar/editar/deletar posição |
| Taxa CDI do dia | 24 horas | Muda 1x por dia útil |

*   **Invalidação:** Sempre que o usuário cria, edita ou deleta uma posição, o cache do portfólio dele é invalidado (cache-aside pattern).
*   **MVP simplificado:** Se Redis adicionar complexidade demais no dia 1, usar `cachetools.TTLCache` em memória no próprio FastAPI. Migra pra Redis quando escalar.

---

## 7. Infraestrutura e Deploy (MVP)

Arquitetura simples e direta, usando **Vercel** pro front e **Azure** pro backend:

| Componente | Serviço | Detalhes |
|------------|---------|----------|
| **Frontend** (Next.js) | Vercel | Deploy automático via Git push. Free tier. |
| **Backend** (FastAPI) | Azure Container Apps | Container rodando a imagem do backend. Escala automática. |
| **Imagens Docker** | Azure Container Registry (ACR) | Armazena as imagens do backend. Pipeline faz build → push → deploy. |
| **Banco de Dados** (PostgreSQL) | Azure Database for PostgreSQL | Managed, backups automáticos, SSL obrigatório. |
| **Cache** | `cachetools.TTLCache` (in-memory) | No MVP, cache em memória no próprio FastAPI. Migra pra Redis (Azure Cache) quando escalar. |
| **CRON Jobs** | Azure Container Apps Jobs ou APScheduler no container | Execução diária do motor de consolidação. |

### Ambientes

*   **Desenvolvimento:** Local com Docker Compose (FastAPI + PostgreSQL). Arquivo `.env.local` com secrets de dev.
*   **Produção:** 
    *   **Frontend:** Deploy automático via Vercel ao fazer push na branch `main`.
    *   **Backend:** Pipeline CI/CD (GitHub Actions) faz build da imagem Docker → push pro ACR → deploy no Container Apps.
    *   Variáveis de ambiente configuradas nos painéis do Vercel e do Azure (nunca no código).

### Variáveis de Ambiente Essenciais

```
# Auth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=...
JWT_ACCESS_TOKEN_EXPIRATION_SECONDS=3600       # 1 hora
JWT_REFRESH_TOKEN_EXPIRATION_SECONDS=604800     # 7 dias

# Database
DATABASE_URL=postgresql://...@<servidor>.postgres.database.azure.com:5432/<db>?sslmode=require

# APIs Externas
BRAPI_BASE_URL=https://brapi.dev/api
BCB_SGS_BASE_URL=https://api.bcb.gov.br/dados/serie

# Criptografia
ENCRYPTION_KEY=...  # Chave AES-256 para WalletConnection

# Azure (usado no CI/CD)
AZURE_CONTAINER_REGISTRY=<nome>.azurecr.io
```

