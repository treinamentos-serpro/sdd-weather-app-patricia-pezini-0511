<div align="center">

# SDD Weather App

### Treinamento hands-on de **Spec-Driven Development** com **GitHub Copilot**

**Brief → Spec → Plan → Tasks → Code → Test → Review → Ship**

</div>

---

Este repositório é um **laboratório de treinamento de 8 horas** que ensina a
construir software guiado por especificação (**Spec-Driven Development**) usando
o **GitHub Copilot** em todas as etapas. O projeto final é um **Weather App** em
React + TypeScript que consome a API Open-Meteo.

> ## Princípio central
> **NÃO COMECE PELO CÓDIGO.** Sempre: **Spec → Plan → Tasks → Code.**

---

## O workshop

Comece pelo **[Guia do Workshop](workshop/GUIDE.md)** e siga os módulos em ordem.

| # | Módulo | Fase | Duração |
| --- | --- | --- | --- |
| 01 | [Setup](workshop/module-01-setup/README.md) | Preparação | 30 min |
| 02 | [Understanding the Problem](workshop/module-02-discovery/README.md) | Discovery | 45 min |
| 03 | [Writing the Specification](workshop/module-03-spec/README.md) | Spec | 50 min |
| 04 | [Creating the Technical Plan](workshop/module-04-plan/README.md) | Plan | 45 min |
| 05 | [Breaking Down Tasks](workshop/module-05-tasks/README.md) | Tasks | 40 min |
| 06 | [Building the UI](workshop/module-06-ui/README.md) | Code | 60 min |
| 07 | [Integrating APIs](workshop/module-07-api/README.md) | Code | 60 min |
| 08 | [Testing](workshop/module-08-testing/README.md) | Test | 55 min |
| 09 | [Hardening](workshop/module-09-hardening/README.md) | Test | 50 min |
| 10 | [Pull Request Review](workshop/module-10-review/README.md) | Review | 45 min |
| 11 | [Delivery (GitHub Pages)](workshop/module-11-delivery/README.md) | Ship | 30 min |

Cada módulo tem **README.md**, **challenge.md**, **prompts.md** e
**solution.md**.

---

## Começando

### Pré-requisitos

- **Node.js**
- **pnpm** (único gerenciador de pacotes suportado — habilite com `corepack enable`)
- **GitHub Copilot** habilitado no VS Code
- Git e uma conta no GitHub (para PR e deploy)

> O repositório inclui um **DevContainer** com tudo pré-configurado. Abra em um
> Codespace ou em "Reopen in Container" e pule a instalação manual.

### Instalação

```bash
pnpm install
pnpm exec playwright install   # navegadores para os testes E2E
```

### Scripts

```bash
pnpm dev             # servidor de desenvolvimento (Vite)
pnpm build           # build de produção
pnpm preview         # serve o build localmente
pnpm lint            # Biome (lint)
pnpm format          # Biome (formatação)
pnpm check           # Biome (lint + formatação)
pnpm test            # testes unitários (Vitest)
pnpm test:coverage   # cobertura
pnpm test:e2e        # testes E2E (Playwright)
```

---

## Arquitetura do app

```text
src/
├── components/      # apresentação (um componente por arquivo)
│   └── states/      # loading, erro, vazio
├── hooks/           # orquestração (useWeather)
├── services/        # acesso a dados (Open-Meteo) isolado
├── lib/             # funções puras (conversão, formatação, códigos WMO)
├── types/           # contratos compartilhados
├── styles/          # Tailwind + estilos globais
├── App.tsx          # composição da tela
└── main.tsx         # bootstrap React
```

Decisões-chave:

- **Temperaturas em Celsius** internamente; conversão só na apresentação (o
  toggle °C/°F **não** faz nova requisição).
- **Rede isolada** em `services/` — componentes e hooks não conhecem URLs.
- Sempre tratar **loading**, **erro** e **vazio**.

---

## Desenvolver a UI sem API

Execute `pnpm dev` para abrir o protótipo composto em [`App`](src/App.tsx).
A tela inicia em `idle`. Busque “São Paulo” (sem distinção de acentos ou
maiúsculas) para ver o mock; outros nomes mostram o estado vazio. O seletor
“Cenário de demonstração” permite visualizar `idle`, `loading`, `empty`, `error`
e `success`. No cenário de erro, “Tentar novamente” abre o sucesso fictício,
sem simular uma requisição. O cenário loading permanece ativo até escolher
outro cenário e desabilita a busca.

A unidade começa em Celsius e fica somente no estado da UI, preservada entre
cenários; recarregar restaura Celsius. Os componentes convertem na renderização
a partir do mock original. Esta entrega é apenas um protótipo: a seleção de
cidades via API, o hook e a recuperação de falhas reais ainda não estão integrados.

Os contratos compartilhados estão em [`src/types/weather.ts`](src/types/weather.ts).
Para montar componentes sem chamadas de rede, importe o objeto tipado:

```ts
import { mockWeatherData } from './mocks/weather';
```

O caminho acima considera um arquivo diretamente em `src/`. O mock contém
São Paulo, condições atuais e cinco dias consecutivos, de 05/11/2026 a
09/11/2026, no fuso `America/Sao_Paulo`. Todas as temperaturas estão em Celsius.
As datas são fixas para manter o exemplo reproduzível; não representam uma
previsão real nem acompanham o dia atual. O mock não é conectado automaticamente
à aplicação e não deve substituir o serviço de produção.

O componente [`SearchBar`](src/components/SearchBar.tsx) recebe
`onSearch(city: string)` e `disabled` (opcional, padrão `false`). O formulário
envia o nome sem espaços externos por botão ou Enter, sem acessar a API.
Entradas vazias ou com caracteres de controle exibem um alerta acessível.
Quando `disabled` está ativo, o campo e o botão ficam desabilitados.

O [`UnitToggle`](src/components/UnitToggle.tsx) é controlado pelas props
`unit: Unit` e `onChange(unit: Unit)`. Os botões °C/°F anunciam a seleção com
`aria-pressed`; Tab/Shift+Tab navegam e Enter/Espaço ativam o botão focado.
O componente apenas notifica a seleção, sem converter dados ou acessar a API.

O [`CurrentWeather`](src/components/CurrentWeather.tsx) recebe `city`, `current`
e `unit` e apresenta cidade, temperatura em destaque, ícone WMO e condição.
Usa [`temperature`](src/lib/temperature.ts) para conversão/arredondamento e
[`weatherCodes`](src/lib/weatherCodes.ts) para ícones. Os ícones são decorativos,
pois a condição já é descrita em texto. Umidade, vento, precipitação e pressão
não fazem parte do contrato atual e não são exibidos.

[`ForecastList`](src/components/ForecastList.tsx) recebe `forecast: ForecastDay[]`
e `unit`, ordena os registros pela data e mostra até cinco cards em grid
responsivo (2/3/5 colunas). [`ForecastCard`](src/components/ForecastCard.tsx)
recebe `day` e `unit` e exibe dia em pt-BR, ícone, condição, máxima e mínima.
[`formatDay`](src/lib/format.ts) preserva a data local sem deslocamento pelo
fuso do navegador. A probabilidade de chuva não integra o contrato atual e
não é exibida. Lista vazia mostra erro; de um a quatro dias mostram aviso de
previsão incompleta. Recuperação de consultas fica a cargo da futura integração.

Os componentes em [`states/`](src/components/states/) podem ser compostos pela
interface sem iniciar consultas:

- [`LoadingState`](src/components/states/LoadingState.tsx): anuncia “Carregando...”
  com `role="status"` e respeita a preferência por movimento reduzido.
- [`ErrorState`](src/components/states/ErrorState.tsx): recebe `message`, anunciada
  com `role="alert"`, e `onRetry` opcional; o botão “Tentar novamente” só aparece
  quando o callback é fornecido.
- [`EmptyState`](src/components/states/EmptyState.tsx): recebe `title` e `hint`,
  associados a uma região acessível.

---

## Acessibilidade e responsividade do protótipo

Melhorias aplicadas na revisão:

- Nomes visíveis e acessíveis idênticos nos controles Celsius/Fahrenheit.
- Resultados vazios, sucesso e mudança de unidade anunciados em região `status`
  persistente, sem retirar o foco da busca.
- Retry devolve foco ao conteúdo; o destino do link de salto tem foco visível.
- Bordas dos campos e dos controles de unidade com contraste reforçado.
- Quebra de texto, campos sem largura mínima implícita e ícones/espaçamentos
  adaptados para evitar transbordamento em telas estreitas e texto ampliado.

[`accessibility.spec.ts`](tests/e2e/accessibility.spec.ts) verifica os cinco
cenários de 320 a 1440 px, texto a 200% em 320 px, teclado, movimento reduzido,
contraste do campo/foco e auditoria axe com regras WCAG 2.2 A/AA. Execute
`pnpm test:e2e` para rodar em Chromium e WebKit móvel.

A auditoria automatizada não certifica conformidade completa: ainda é necessária
validação humana com leitor de tela, modo de alto contraste e a matriz completa
de navegadores da spec. Estados de API e previsão parcial também deverão ser
auditados quando integrados ao protótipo.

---

## Stack

- **TypeScript** (strict) · **React** · **Vite**
- **Tailwind CSS** (tema dark glassmorphism)
- **Vitest** + **Testing Library** (unit) · **Playwright** (E2E)
- **Biome** (lint + formatação)
- **pnpm** (gerenciador de pacotes)
- **Open-Meteo** (geocoding + forecast, sem API key)

---

## Copilot no fluxo SDD

A pasta `.github/` traz a inteligência do laboratório:

- **`agents/`** — personas especializadas: Spec, Plan, Task, Code, Test, Review.
- **`prompts/`** — prompts de produção para cada etapa.
- **`instructions/`** — convenções (React, Tailwind, Testing) aplicadas
  automaticamente.
- **`workflows/`** — CI (lint/build/test/e2e), deploy no Pages e validações que
  **impõem a ordem Spec → Plan → Tasks**.

Veja [AGENTS.md](AGENTS.md) para a descrição de cada agente.

---

## Idioma

- Narrativa, comentários e documentação: **pt-BR**.
- Identificadores de código, nomes de arquivos e termos técnicos: **en-US**.

---

<div align="center">

Construído com ❤️ para capacitar times em **Spec-Driven Development** usando o poder do GitHub Copilot.

</div>
