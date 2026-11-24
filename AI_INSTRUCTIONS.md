# AI_INSTRUCTIONS.md — Diretriz Mestra e Padrão de Engenharia (Cota · 10ATIVAS V2)

Este arquivo é a **Documentação Viva** do aplicativo **Cota** (gestão mobile-first de assinaturas compartilhadas em família), construído sob o **Design System 10ATIVAS V2**.

---

## 1. Papel e Protocolos Ativos
- **Papel:** Engenheiro de Software Especialista, Arquiteto de Produto Mobile-First e Design Engineer.
- **Diretrizes Visuais e de Produto:**
  - **Design System Oficial:** 10ATIVAS V2 (`Sora` + `Geist Mono`, Verde `#18E299`, Verde Profundo `#0FA76E`, Verde Suave `#E8FFF5`, Obsidian `#0D0D0D`, Branco `#FFFFFF`).
  - **Anti-Slop & Precisão UI:** Zero emojis na interface (uso exclusivo de ícones vetoriais `@phosphor-icons/react` e marca oficial 10Ativas), sem gradientes roxos/neon, sem preto puro `#000000`, hierarquia clara e foco absoluto na ação principal (cobrar e confirmar recebimento).
  - **Copywriting (`escrita-natural-ptbr`):** Textos diretos, naturais em português brasileiro, sem jargões artificiais.

---

## 2. Decisão Arquitetural Explícita (Local-First / Sem Supabase)
Por requisito explícito do proprietário do produto, este aplicativo opera **100% no dispositivo do usuário (Local-First PWA)**:
1. **Persistência Exclusiva em `localStorage` (`cobrar_10a_v1`):** Nenhum dado pessoal, telefone, chave PIX ou histórico financeiro sai do aparelho. Sem dependência de Supabase ou servidores externos.
2. **Instalável no Aparelho (PWA Standalone):** `manifest.webmanifest` + Service Worker (`public/sw.js`) para funcionamento offline imediato na tela inicial do iOS e Android.
3. **Portabilidade e Segurança Local:** Sanitização estrita contra XSS na entrada e na importação de backups (`src/lib/sanitize.ts`), validação de esquema JSON ao restaurar dados e exportação local `.json` em um toque.
4. **Notificações Locais Inteligentes:** Uso da Web Notifications API integrada ao Service Worker (`registration.showNotification`) com verificação automática de vencimentos, lembretes prévios e controle diário anti-spam (`lastNotifiedDate`).

---

## 3. Tokens e Regras de Interface (10ATIVAS V2)
Consulte [`public/brand/DESIGN.md`](./public/brand/DESIGN.md):
- **Fontes:** `Sora` (Display, Títulos, Botões e Corpo) + `Geist Mono` (Valores em R$, datas de vencimento, badges de status, chaves PIX e contadores `tabular-nums`).
- **Raios:** `9999px` (pills, botões primários, filtros, inputs compactos), `16px` e `24px` (cards e painéis).
- **Motion:** Transições rápidas (`160–260ms`) com curva `cubic-bezier(0.22, 1, 0.36, 1)` e respeito integral a `prefers-reduced-motion`.
