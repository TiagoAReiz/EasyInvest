# Pesquisa de Integrações: App de Acompanhamento de Carteiras

Construir um aplicativo para consolidar e acompanhar carteiras de investimentos exige estratégias diferentes dependendo da classe de ativos (tradicional vs. cripto) e do modelo de integração (direta vs. agregadores).

Abaixo detalhamos o cenário atual das integrações com as principais corretoras brasileiras e globais.

## 1. O Caminho Mais Escalável: Hubs Consolidadores B2B

Tentar integrar **diretamente corretora por corretora (XP, Rico, Clear, BTG)** é um processo muito custoso, que exige parcerias comerciais complexas, homologações demoradas e manutenção constante (pois APIs mudam ou quebram). O padrão de mercado para apps de consolidação é utilizar **provedores de dados de Open Finance e "Web Scraping" (Banking as a Service/Data providers)**.

**Principais players no Brasil:**
*   **Pluggy:** Startup brasileira muito forte na consolidação de dados financeiros via Open Finance e web scraping automatizado. Possui conectores prontos para XP, Rico, Clear, BTG, Nubank, Banco Inter, etc. É a solução mais rápida para obter saldo/posição do usuário na XP ou Clear, por exemplo.
*   **Gorila (GorilaCORE):** O Gorila é um famoso app B2C de consolidação de carteiras, mas eles pivotaram fortemente para B2B. A API GorilaCORE permite que você crie o *seu* app de carteira usando toda a inteligência e o motor de cálculo e busca de cotas deles. Eles acessam dezenas de bancos e corretoras.
*   **Belvo:** Outra gigante multinacional de Open Finance na América Latina. Oferece APIs para buscar dados não só de contas correntes, mas de portfólios de investimento no Brasil.

## 2. O "Pulo do Gato" para Renda Variável: B3 Área do Investidor

Para ações, FIIs, Tesouro Direto e BDRs, existe um atalho poderoso.
A **B3 (Bolsa de Valores)** possui o portal "Área do Investidor", centralizando tudo o que está atrelado ao CPF do usuário, não importa se ele comprou na Clear, BTG ou Rico.
*   **Como os apps fazem:** Apps como Status Invest, Trademap e Kinvo costuma oferecer uma integração "Conectar com a B3". O usuário autoriza a conexão, e a plataforma importa todo o portfólio de bolsa em uma única chamada.
*   **Vantagem:** Você "mata" Clear, XP, Rico, NuInvest, etc., de uma vez só, para os ativos custodiados na B3.

## 3. O Cenário de Integração Direta (Corretoras Tradicionais)

Caso o objetivo seja fugir de agregadores e construir integrações diretas:

*   **Open Finance (Fase 4 - Investimentos):** É a iniciativa oficial do Banco Central. Bancos, corretoras e fintechs estão sendo obrigados a criar APIs padronizadas para compartilhamento de dados de investimentos mediante autorização do cliente. Instituições como Banco do Brasil, Santander e grandes corretoras já estão implementando. Essa é a maneira "oficial" e de longo prazo.
*   **BTG Pactual:** Possui um **Portal do Desenvolvedor** público (BTG Empresas). Eles são conhecidos por ter uma das APIs abertas mais robustas do mercado brasileiro (Banking e Investimentos), facilitando o Open Finance e integrações B2B.
*   **A "Família XP" (XP, Rico e Clear):**
    *   Possuem APIs ativas para o ecossistema do Open Finance.
    *   Foram identificados portais dedicados a parceiros e integrações focadas no uso B2B da B3 via plataformas parceiras (como a *Cedro Technologies*, muito usada pela XP e Rico para fornecer infraestrutura tecnológica de *market data*).
    *   **Clear:** Focada no Trader de varejo ("corretagem zero"). Geralmente, não tem uma API pública escancarada para B2C; os dados devem ser puxados indiretamente pelo Open Finance, pela B3 ou por APIs de agregadores (tipo Pluggy).

## 4. O Cenário Cripto: Integração Direta e Aberta

Ao contrário do mercado tradicional, o mercado de criptomoedas **nasceu voltado para APIs e desenvolvedores**. É o lado mais fácil da integração.

*   **Binance:** Possui a API mais bem documentada do mundo financeiro. Você não precisa fechar parceria com a Binance. A jornada é: O usuário entra na conta Binance dele > Gera uma **Chave API (API Key)** definindo permissão estrita de **"Somente Leitura" (Read-Only)** > Cola a chave no seu app. Seu app acessa os balanços perfeitamente.
*   **Mercado Bitcoin, Foxbit, Bitso:** Quase todas as grandes exchanges que operam no Brasil seguem a mesma regra da Binance (API pública REST, uso com Chaves API fornecidas pelo cliente final).
*   **Bitcoin Puro e Redes Descentralizadas (DeFi):** Se o cliente tiver criptomoedas em carteiras frias (Ledger, Trezor) ou carteiras DeFi (Metamask), ele não usa uma corretora. Para isso, você integra com serviços de *Blockchain Explorers* (ex: APIs do Etherscan) para redes Ethereum, ou usa agregadores Web3 como as APIs da **Zapper**, **Moralis** ou **DeBank**, pedindo apenas para o cliente colar o endereço público (Public Key) da carteira dele.

---

## Sugestão de Arquitetura para o seu App (Foco Exclusivo em Acompanhamento / Read-Only)

Como o objetivo do aplicativo é **apenas acompanhamento** (e não o envio de ordens de compra e venda), a arquitetura fica muito mais simples, rápida e barata de ser implementada. Você **não precisará** criar parcerias comerciais pesadas diretamente com XP ou BTG para enviar ordens (como o TradeMap fazia no início).

A estratégia ideal é a consolidação de leitura (Read-Only):

1.  **Cripto (Fácil e Barata):** Crie formulários onde o cliente cola as `API Keys (Leitura)` da Binance, Mercado Bitcoin, etc., ou o endereço público (Public Key) da carteira On-Chain dele. O app consome as APIs públicas à vontade.
2.  **Renda Variável Geral (O atalho da B3):** Plugar uma integração OAuth (Conectar com a B3) com a **"Área do Investidor da B3"**. O usuário loga, dá o consentimento, e o app extrai o histórico consolidado de todas as corretoras do cliente (Ações, BDRs, FIIs e Tesouro Direto) numa única chamada.
    *   **Como ter Cotações Gratuitas (MVP):** Para cruzar o histórico da B3 com os preços atuais (e calcular rentabilidade), você pode usar **APIs gratuitas de cotação com atraso (15 min)**. As melhores opções para o mercado brasileiro hoje são:
        *   **brapi.dev:** Possui plano gratuito generoso focado na B3 (Ações, FIIs, BDRs), fácil de usar com Node.js ou Python.
        *   **Yahoo Finance (via pacote `yfinance` ou wrappers):** O método mais clássico e 100% gratuito (ticker da empresa + `.SA`, ex: `PETR4.SA`).
        *   **HG Brasil Finance:** API nacional com plano gratuito básico que inclui cotações e moedas.
3.  **Contas e Renda Fixa Privada (A dor de cabeça resolvida por terceiros):** Para puxar o saldo de Conta Corrente, CDBs, LCIs da XP, BTG, Itaú, etc., contrate o serviço de um **Agregador Open Finance (como Pluggy ou Belvo)**. Eles te dão um "widget" pronto. O cliente escolhe a instituição, digita a senha dentro de um ambiente seguro, e a Pluggy devolve o saldo de fundos e renda fixa padronizado para o seu banco de dados, atuando como o verdadeiro Open Finance.
