# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.
O formato segue o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-11-24

### Adicionado
- **Motor de Cobrança Mensal (`YYYY-MM`):** cálculo em centavos inteiros com visão consolidada *Por Pessoa* e visão *Por Plano*, classificação automática de urgência (`ATRASADO`, `VENCE HOJE`, `EM BREVE`, `PAGO`, `CORTESIA`) e confirmação em 1 toque com opção *Desfazer*.
- **Integração Direta com WhatsApp + PIX:** geração automática do resumo de cobrança em português natural somando todas as cotas pendentes do membro no mês e incluindo a chave PIX configurada.
- **Gestão Flexível de Planos Família:** divisão igualitária (com opção de incluir ou não a vaga do titular), valores fixos personalizados por pessoa, vagas isentas (*Cortesia*) e cadastro rápido inline de participantes.
- **PWA Instalável + Ícone Anti-Zoom para iPhone:** manifesto W3C completo (`manifest.webmanifest`), Service Worker offline (`sw.js`), guia interativo de instalação e ícones PNG renderizados com 4x *supersampling* e 28% de *safe zone* opaca para iOS e Android.
- **Lembretes e Notificações Locais:** integração com *Web Notifications API* + *Service Worker* com controle diário anti-spam e botão de disparo de teste imediato.
- **Portabilidade e Privacidade 100% Local (`localStorage`):** exportação e restauração de backup `.json` com normalização e sanitização contra XSS.
- **Design System 10ATIVAS V2:** tipografia `Sora` + `Geist Mono`, temas *Claro* e *Obsidian* e suíte de testes unitários com Vitest.
