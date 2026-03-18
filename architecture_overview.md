# Arquitetura Executiva: App Consolidador de Carteiras (MVP)

**Objetivo:** Aplicativo *Read-Only* (Apenas Leitura) para consolidação e acompanhamento de carteira de investimentos.

**Premissa Inegociável para o MVP:** Risco financeiro zero. Não vamos contratar APIs pagas (como Pluggy, Belvo ou B3 Oficial B2B) no primeiro dia. Toda a infraestrutura inicial será montada em cima de APIs públicas ou gratuitas de mercado.

A arquitetura do produto funcionará baseada em três pilares práticos:

### 1. Renda Variável (Ações, FIIs, BDRs)
*   **Ação do Usuário:** Inserção manual no App (Ativo, Quantidade, Preço Médio).
*   **Motor do App:** O sistema consumirá a API da **brapi.dev** (100% gratuita, feita para o Brasil) para puxar a cotação em tempo real (com 15 min de atraso padrão) e calcular a rentabilidade (Lucro/Prejuízo) instantaneamente na tela.
*   **Por que brapi.dev?** Mais estável que o Yahoo Finance, focada no mercado brasileiro, e lida perfeitamente com os Fundos Imobiliários (FIIs), que são críticos para o investidor nacional.

### 2. Criptomoedas (Bitcoin, Ethereum, etc)
*   **Ação do Usuário:** Inserção da *API Key (Read-Only)* gerada na própria Binance, Mercado Bitcoin ou corretora de preferência.
*   **Motor do App:** Conexão direta via API oficial da corretora de criptomoedas. 
*   **Vantagem:** Totalmente gratuito, automatizado e nativo do ecossistema cripto.

### 3. Renda Fixa (CDBs, Tesouro, Caixa)
*   **Ação do Usuário:** Lançamento 100% manual (Valor investido, Instituição original, Taxa de rendimento).
*   **Motor do App:** O backend simula o rendimento baseado no CDI para atualizar o saldo na tela diariamente.
*   **Justificativa:** É a única forma de contornar a muralha dos bancões sem pagar os absurdos R$ 2.500/mês cobrados pelas empresas de Open Finance (agregadores).

---

### O Caminho da Evolução (Pós-Tração)
Assim que o aplicativo ganhar base de usuários e puder ser monetizado (mensalidade premium):
1.  **Morte do Lançamento Manual:** Contrataremos a **Pluggy/Belvo** via Open Finance Fase 4 para plugar o backend nas contas da XP, BTG, Itaú, etc., puxando tudo (Ações, Tesouro, CDBs) com um clique.
2.  **Morte das simulações de cotação gratuitas:** Passaremos a consumir dados da Bolsa (B3) diretamente através de parceiros institucionais para cotações em *real-time* sem limites.
