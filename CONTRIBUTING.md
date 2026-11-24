# Contribuindo com o Cota

Obrigado pelo interesse em contribuir com o **Cota**! Este projeto é código aberto (MIT) e mantém foco estrito em simplicidade, velocidade no celular e privacidade total no aparelho do usuário.

---

## Configuração do Ambiente

### Pré-requisitos
- **Node.js:** `v20+` (recomendado `v22+`)
- **npm:** `v10+`

### Instalação local

```bash
git clone https://github.com/migu3lls/cota.git
cd cota
npm install
npm run dev
```

---

## Princípios Inegociáveis do Projeto

Antes de propor novas funcionalidades ou alterações arquiteturais, certifique-se de respeitar estes quatro pilares:

1. **100% Local-First e Zero Telemetria Oculta:**
   - Nenhum dado pessoal, telefone, chave PIX ou histórico financeiro pode ser enviado para servidores externos.
   - Não adicione SDKs de rastreamento, analytics invasivos ou dependências obrigatórias de nuvem/BaaS.
2. **Foco Enxuto no Problema:**
   - O Cota existe para resolver **divisão e cobrança de assinaturas compartilhadas**. Evite transformar o app em um gerenciador bancário complexo cheio de gráficos desnecessários.
3. **Integridade Monetária e Sanitização:**
   - Valores monetários devem sempre trafegar em **centavos inteiros** (`totalCents`, `amountCents`).
   - Qualquer novo campo persistido no `localStorage` ou importado via backup `.json` precisa ser normalizado e sanitizado em `src/lib/storage.ts` e coberto por testes em `src/lib/__tests__/`.
4. **Design System 10ATIVAS V2 & Mobile-First:**
   - Mantenha a tipografia `Sora` + `Geist Mono`, a paleta oficial (`#18E299`, `#0FA76E`, `#0D0D0D`), alvos de toque confortáveis (`>= 44px`), inputs com `font-size >= 16px` (para não causar auto-zoom no Safari iOS) e **zero emojis** na interface (use exclusivamente ícones vetoriais `@phosphor-icons/react`).

---

## Checklist antes de abrir um Pull Request

Rode os três comandos abaixo localmente e garanta que todos passem sem erros nem avisos:

```bash
npm run lint
npm test
npm run build
```

### Fluxo de envio
1. Faça um fork do repositório e crie uma branch descritiva (`git checkout -b feat/minha-melhoria` ou `fix/ajuste-calculo`).
2. Use mensagens de commit claras seguindo *Conventional Commits* (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
3. Abra o Pull Request descrevendo o cenário testado (especialmente em telas mobile iOS/Android).
