# Política de Segurança e Privacidade (Security Policy)

## Arquitetura de Privacidade (Local-First)

O **Cota** foi projetado sob o modelo **Zero-Backend / 100% LocalStorage**:
- Nenhum dado inserido no aplicativo (nomes, números de WhatsApp, chaves PIX ou valores de assinaturas) é transmitido para servidores da aplicação.
- A abertura do WhatsApp ocorre exclusivamente no navegador do próprio dispositivo por meio de links oficiais `https://wa.me/`.
- Arquivos de backup `.json` importados pelo usuário passam por validação estrutural e sanitização contra XSS (`src/lib/sanitize.ts` e `src/lib/storage.ts`) antes de serem gravados no armazenamento local.

## Versões Suportadas

| Versão | Suporte de Segurança |
| :--- | :--- |
| `1.0.x` | Ativo |

## Como Reportar uma Vulnerabilidade

Se você identificar uma vulnerabilidade de segurança (como vetores de *DOM-based XSS* via restauração de JSON, manipulação indevida de `localStorage` ou falha em dependências), **não abra uma Issue pública imediatamente**.

1. Utilize a aba **[Security Advisories](https://github.com/migu3lls/cota/security/advisories/new)** do repositório no GitHub para enviar um relato privado.
2. Inclua os passos para reproduzir o comportamento e o impacto potencial.
3. Analisaremos o relato com prioridade e publicaremos a correção acompanhada dos devidos créditos.
