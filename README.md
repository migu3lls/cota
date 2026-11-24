<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/brand/cota-logo-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="./public/brand/cota-logo.svg" />
    <img alt="Cota" src="./public/brand/cota-logo.svg" width="190" />
  </picture>

  <p>
    <strong>Cada cota da família sempre em dia.</strong><br />
    Web App <strong>Mobile-First (PWA)</strong>, aberto e <strong>100% local no seu aparelho</strong> para gerenciar assinaturas compartilhadas e cobrar no WhatsApp em 1 toque.
  </p>

  <p>
    <a href="https://github.com/migu3lls/cota/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-18E299.svg" alt="Licença MIT" />
    </a>
    <a href="https://github.com/migu3lls/cota/actions/workflows/ci.yml">
      <img src="https://img.shields.io/github/actions/workflow/status/migu3lls/cota/ci.yml?branch=main&label=CI" alt="CI Status" />
    </a>
    <img src="https://img.shields.io/badge/Storage-100%25_LocalStorage-0D0D0D?logoColor=18E299" alt="100% LocalStorage" />
    <img src="https://img.shields.io/badge/Next.js-16-0D0D0D?logo=next.js" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5" />
  </p>
</div>

---

## O problema que o Cota resolve

Quem paga o plano família de serviços digitais — YouTube Premium, Spotify, Netflix, iCloud+, Apple One, Max, Nintendo Switch Online, Canva — quase sempre passa pela mesma situação: chega o vencimento no cartão, você esquece de avisar todo mundo ou perde a conta de quem já mandou o PIX naquele mês.

O **Cota** resolve isso sem exigir cadastro, login, nuvem ou banco de dados externo:

- **100% privado no seu celular (`localStorage`):** nomes, telefones, valores e sua chave PIX nunca saem do navegador do seu aparelho. Sem Supabase, sem servidor guardando seus dados e sem mensalidade.
- **Cobrança somada em 1 toque no WhatsApp:** se uma mesma pessoa divide 2 ou 3 planos com você no mês, o Cota soma os itens pendentes automaticamente e já abre a conversa do WhatsApp com o detalhamento e sua chave PIX.
- **Lembretes de vencimento:** alertas locais via *Web Notifications API* + *Service Worker* para avisar antes do vencimento, no próprio dia ou quando houver atraso.
- **Feito para instalar na Tela de Início (PWA):** abre em tela cheia no iPhone e no Android, funciona offline e traz ícone opaco com margem calibrada (`28%` de *safe zone*) para evitar o zoom exagerado do iOS.

---

## Funcionalidades em detalhe

### 1. Aba Cobrar (Foco do mês)
- Painel resumo **Obsidian** com o valor que falta receber no mês atual, barra de progresso, total já recebido e quanto realmente sai do seu bolso descontando o que a família paga.
- **Visão Por Pessoa:** agrupa tudo que cada familiar/amigo deve no mês e ordena por urgência (`ATRASADO` → `VENCE HOJE` → `EM BREVE` → `PAGO`).
- **Visão Por Plano:** mostra cada assinatura separada pelo dia do vencimento (`DIA 05`, `DIA 15`) e quantos participantes já quitaram.
- **Navegação mensal (`YYYY-MM`):** consulte meses passados ou adiante pagamentos de meses futuros mantendo o histórico intacto.
- **Botão Desfazer instantâneo:** marcou alguém como pago por engano? Desfaça com 1 toque.

### 2. Divisão flexível da vida real
- **Atalhos prontos:** crie planos populares em segundos com valores e categorias pré-sugeridos (editáveis).
- **Divisão igualitária com ou sem sua vaga:** escolha se você entra na conta das vagas (ex.: R\$ 53,90 dividido por 4 membros + você = 5 vagas de R\$ 10,78) ou se divide apenas entre os participantes selecionados.
- **Valor fixo por pessoa:** ideal quando alguém paga um adicional diferente (como ponto extra de streaming).
- **Vagas de Cortesia (Isentos):** marque mãe, pai ou dependente como *Cortesia* — a pessoa ocupa vaga no cálculo do plano família, mas a cobrança dela fica em `R$ 0,00`.

### 3. Família & Ajustes
- Cadastro rápido de pessoas (inclusive direto de dentro da janela de nova assinatura, sem precisar trocar de aba).
- Configuração da sua **Chave PIX** (Celular, CPF/CNPJ, E-mail ou Aleatória) + modelo editável do texto do WhatsApp com variáveis `{nome}`, `{mes}`, `{itens}`, `{total}` e `{pix}`.
- Alternância entre tema **Claro** e **Obsidian (Escuro)**.
- **Backup Local `.JSON`:** exporte todos os dados para um arquivo no seu celular e restaure quando trocar de aparelho.

---

## Como rodar no seu computador ou celular

### Pré-requisitos
- **Node.js** `v20` ou superior
- **npm** `v10` ou superior

### Passo a passo local

```bash
# 1. Clone o repositório
git clone https://github.com/migu3lls/cota.git
cd cota

# 2. Instale as dependências
npm install

# 3. Inicie em modo desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### Testar direto no celular pela mesma rede Wi-Fi

```bash
npm run dev:mobile
```

O `next.config.ts` detecta automaticamente o IP local da sua placa Wi-Fi e libera o carregamento de fontes e scripts para você testar no navegador do celular via `http://SEU_IP_LOCAL:3000`.

---

## Como instalar no seu celular com Notificações e Offline (Recomendado)

Os navegadores mobile (Safari no iOS e Chrome no Android) exigem conexão segura **`HTTPS`** para registrar o *Service Worker* offline e liberar **Notificações Nativas do Sistema** fora do `localhost`.

Como o **Cota** não usa banco de dados nem variáveis de ambiente, você pode hospedar sua própria instância gratuitamente em menos de 1 minuto:

1. Faça um fork deste repositório ou conecte-o direto na **Vercel**, **Cloudflare Pages** ou **Netlify** (comando de build: `npm run build`).
2. Abra o link `https://...` gerado no navegador do seu celular:
   - **No iPhone (Safari):** toque em **Compartilhar** → **Adicionar à Tela de Início** → abra o app **Cota** pela Tela de Início e ative as notificações na aba **Ajustes**.
   - **No Android (Chrome):** toque no botão **Instalar Cota no aparelho** (ou menu de 3 pontos → **Instalar aplicativo**).

> Mesmo hospedando o front-end estático na Vercel/Cloudflare, **nenhum dado seu passa pelo servidor**: cada pessoa que abrir o link terá seu próprio cofre isolado no `localStorage` do próprio aparelho.

---

## Arquitetura e Decisões Técnicas

```text
cota/
├── docs/
│   └── ARCHITECTURE_FASE_ZERO.md     # PDR, TDR, Fluxo do Usuário e Diagrama de Dados
├── public/
│   ├── apple-touch-icon.png          # Ícone 180x180 RGB opaco (28% safe zone anti-zoom iOS)
│   ├── favicon.svg                   # Favicon vetorial Cota
│   ├── manifest.webmanifest          # Manifesto PWA Standalone (ícones 'any' e 'maskable' separados)
│   ├── sw.js                         # Service Worker (cache offline v2 + click de notificações)
│   ├── brand/                        # Logos vetoriais Cota + Design System 10Ativas V2
│   └── icons/                        # Ícones PNG 192x192 e 512x512 renderizados em 4x supersampling
└── src/
    ├── app/                          # App Router Next.js 16, fontes Sora + Geist Mono e tokens CSS
    ├── components/
    │   ├── CobrarApp.tsx             # Orquestrador principal, sincronização LocalStorage e abas
    │   ├── modals/                   # Bottom sheets mobile (Assinatura, Pessoa e Guia PWA)
    │   ├── tabs/                     # Telas Cobrar, Planos, Família e Ajustes
    │   └── ui/                       # Logo adaptativa, monogramas, badges e primitivas
    ├── lib/
    │   ├── billing.ts                # Motor de rateio em centavos inteiros, urgência e texto WhatsApp
    │   ├── notifications.ts          # Permissão, Service Worker e disparo diário anti-spam
    │   ├── presets.ts                # Catálogo de atalhos e dados de exemplo para teste rápido
    │   ├── sanitize.ts               # Sanitização contra XSS, formatação BRL e telefones
    │   ├── storage.ts                # Leitura/gravação versionada (cobrar_10a_v1) e backup JSON
    │   └── __tests__/billing.test.ts # Suíte de testes unitários (Vitest)
    └── types/
        └── cobrar.ts                 # Contratos TypeScript estritos
```

### Destaques de engenharia
- **Zero erro de centavos (`IEEE 754`):** todos os cálculos financeiros rodam em **centavos inteiros** (`5390` = `R$ 53,90`), evitando dízimas de ponto flutuante na soma das cotas.
- **Ícones PWA calibrados para iOS e Android:** o iOS aplica máscara *squircle* e dá zoom automático quando encontra transparência ou arte colada nas bordas. O `apple-touch-icon.png` do Cota é gerado em **PNG 24-bit opaco (`#0D0D0D`)** sem cantos pré-arredondados e com **28% de área de respiro**, além de separar estritamente `purpose: "any"` e `purpose: "maskable"` no manifesto W3C.
- **Sanitização na restauração de backup:** todo arquivo `.json` importado passa por `normalizeStore()` (`src/lib/storage.ts`) e `sanitizeText()` (`src/lib/sanitize.ts`), descartando chaves malformadas, valores negativos ou tags HTML/scripts.
- **Design System 10ATIVAS V2:** tipografia **Sora** + **Geist Mono** (`tabular-nums`), paleta de alto contraste (`#18E299`, `#0FA76E`, `#0D0D0D`) e suporte completo a `prefers-reduced-motion`.

---

## Scripts disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local em `http://localhost:3000` |
| `npm run dev:mobile` | Inicia o servidor acessível na rede Wi-Fi (`0.0.0.0:3000`) |
| `npm run lint` | Executa análise estática com ESLint 9 + regras React 19 / TypeScript |
| `npm test` | Roda os testes unitários do motor financeiro e sanitização (Vitest) |
| `npm run build` | Gera o build otimizado e pré-renderizado de produção |
| `npm start` | Serve o build de produção |

---

## Como contribuir

Contribuições são muito bem-vindas! Leia o guia em [CONTRIBUTING.md](./CONTRIBUTING.md) antes de abrir uma Issue ou Pull Request.

Para reportar falhas de segurança, consulte [SECURITY.md](./SECURITY.md).

---

## Licença

Distribuído sob a licença **MIT**. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

Criado por **Miguel Silva** ([@migu3lls](https://github.com/migu3lls)) no padrão **10ATIVAS V2**.
