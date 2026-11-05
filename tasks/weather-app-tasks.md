# Backlog técnico — Weather App

Backlog derivado de [`plans/weather-app-plan.md`](../plans/weather-app-plan.md), que por sua vez consome [`specs/weather-app-spec.md`](../specs/weather-app-spec.md). A ordem de execução é: tipos → funções puras → services → hook → componentes → integração → testes → hardening. Os IDs originais foram preservados para manter a rastreabilidade; a posição no documento, e não o número do ID, define a sequência.

As dependências listadas devem estar concluídas antes do início da tarefa. Além dos pré-requisitos técnicos, T-09 aguarda as funções puras e os testes aguardam T-26 para respeitar a sequência solicitada. Tarefas da mesma entrega sem dependências entre si podem ser executadas em paralelo. Não há mudança de stack nem criação de infraestrutura de teste; Vitest, Testing Library e Playwright já estão no projeto. A entrega de testes concentra a implementação das suítes, sem dispensar lint, build e execução dos testes existentes durante as entregas anteriores.

## Prioridade e tamanho relativo

- **P0:** caminho essencial para consultar clima com integridade e tratar falhas; executar primeiro, respeitando dependências.
- **P1:** completar funcionalidades e validar a qualidade obrigatória da versão.
- **P2:** validação final especializada, após estabilizar os fluxos.
- **P (pequeno):** regra ou apresentação localizada, com poucos cenários.
- **M (médio):** múltiplos estados, validações ou interação entre contratos.
- **G (grande):** maior combinação de estados, concorrência ou matriz de ambientes; recomenda-se execução incremental.

Tamanho representa complexidade relativa, não prazo nem quantidade de arquivos. Prioridade não substitui dependências. P1/P2 não significam opcionais: todos os requisitos aprovados da spec continuam necessários para o release.

| Tarefa | Escopo resumido | Prioridade | Tamanho |
|---|---|---|---|
| T-01 | Contratos de domínio | P0 | P |
| T-02 | Rótulos WMO | P0 | P |
| T-03 | Conversão e formatação | P0 | P |
| T-04 | Testes de conversão | P0 | P |
| T-05 | Validação de cidades | P0 | P |
| T-06 | Testes do mapper de cidades | P0 | P |
| T-07 | Validação de atuais, dias e fuso | P0 | M |
| T-08 | Testes do mapper meteorológico | P0 | M |
| T-09 | Transporte, timeout e erros | P0 | M |
| T-10 | Serviço de geocodificação | P0 | P |
| T-11 | Testes de geocodificação com fetch mockado | P0 | M |
| T-12 | Serviço de forecast | P0 | M |
| T-13 | Testes de forecast com fetch mockado | P0 | M |
| T-14 | Estado, retry e concorrência | P0 | G |
| T-15 | Testes das transições do hook | P0 | M |
| T-16 | Busca e seleção de cidade | P0 | M |
| T-17 | Testes dos estados da busca | P0 | M |
| T-18 | Painel de condições atuais | P0 | P |
| T-19 | Testes do painel atual | P0 | P |
| T-20 | Previsão completa e parcial | P0 | M |
| T-21 | Testes da previsão | P0 | M |
| T-22 | Controle de unidade | P1 | P |
| T-23 | Testes do controle de unidade | P1 | P |
| T-24 | Status e ação de retry | P0 | P |
| T-25 | Testes do status | P0 | P |
| T-26 | Composição da aplicação | P0 | M |
| T-27 | E2E principal desktop/mobile | P0 | M |
| T-28 | E2E de busca vazia e homônimos | P0 | M |
| T-29 | E2E de unidade e reload | P1 | P |
| T-30 | E2E de falhas e parcial | P0 | M |
| T-31 | E2E de respostas concorrentes | P0 | M |
| T-32 | Matriz de compatibilidade e responsividade | P1 | G |
| T-33 | Auditoria de acessibilidade | P1 | M |
| T-34 | Medição de desempenho | P2 | M |
| T-35 | Testes dos códigos WMO | P0 | P |

T-03/T-04 são P0 porque o arredondamento e a formatação também se aplicam a Celsius; somente o controle de alternância e sua validação ficam em P1. T-14 é G pela combinação de busca, forecast, retry e descarte de respostas; T-32 é G pela matriz de navegadores e dispositivos, mesmo concentrando alterações em poucos arquivos.

## Sequência sugerida em fatias verticais

Esta é uma **alternativa incremental** à ordem por camadas mantida nas entregas abaixo, não uma sequência executável com os gates atuais sem ajustes. Para adotá-la:

- Em T-09, exigir apenas T-01 como pré-requisito técnico, removendo a espera artificial por todas as funções puras.
- Evoluir T-14 e T-26 por capacidade: busca primeiro, clima depois e unidade por último. Suas dependências finais permanecem necessárias para concluir a tarefa inteira, mas não para demonstrar um incremento.
- Remover a espera obrigatória por T-26 nos testes unitários/de componentes; cada teste acompanha a implementação que verifica.
- Evoluir T-27 por cenário e não aguardar todos os testes de funcionalidades ainda não entregues para iniciar o E2E da fatia atual. O cenário completo desktop/mobile continua obrigatório ao concluir T-27.

Não é necessário criar outro hook, tela provisória ou fonte de dados de produção. As fatias reutilizam os mesmos arquivos e contratos; mocks ficam restritos aos testes. Uma tarefa que reaparece em outra fatia só é concluída quando todos os seus critérios originais passam.

| Ordem | Fatia e valor visível | Tarefas de implementação | Validação da fatia |
|---|---|---|---|
| 1 | **Buscar e escolher uma cidade:** formulário funcional, resultados com contexto geográfico, seleção explícita, loading, vazio e erro/retry. Ainda sem painel meteorológico. | T-01, T-05, T-09, T-10, T-24, T-16; incrementos de busca/seleção de T-14 e T-26. | T-06, T-11, T-17, T-25; iniciar cenários de busca de T-28. Demonstrar envio de “São Paulo”, seleção sem forecast prematuro e “Nenhuma cidade encontrada.” para fixture vazia. |
| 2 | **Consultar o clima em Celsius:** selecionar uma cidade mostra condições atuais e cinco dias; parcial, falhas e troca de cidade não misturam dados. RF-02/RF-03/RF-05 conectados de ponta a ponta. | T-02, T-03, T-07, T-12, T-18, T-20; incrementos meteorológicos de T-14 e T-26. | T-04, T-35, T-08, T-13, T-19, T-21; parte meteorológica de T-15; T-30, T-31 e fluxo principal de T-27 em desktop/mobile. Concluir T-28 após integrar forecast. |
| 3 | **Escolher Celsius/Fahrenheit:** todas as temperaturas mudam sem nova consulta; cidade e datas permanecem, reload restaura Celsius. Completa RF-04. | T-22; finalizar unidade em T-14 e conexões em T-26. | T-23, T-29; finalizar T-15 e T-27, incluindo as verificações de unidade. Todos os critérios de T-14/T-26 devem estar atendidos antes de encerrá-las. |
| 4 | **Consolidar o release:** mesma aplicação validada na matriz de ambientes, por teclado e com desempenho medido. | Ajustes diretamente decorrentes das verificações, nos componentes ou camadas responsáveis. | T-32, T-33 e T-34, após os testes das fatias anteriores. Registrar resultados e corrigir falhas antes do release; observar também as Open Questions da spec. |

A primeira fatia antecipa uma entrega utilizável de RF-01 sem esperar forecast ou conversão. Responsividade básica, semântica acessível e tratamento de erros fazem parte de cada fatia; a última concentra a auditoria ampliada, não a primeira implementação desses comportamentos. As dependências formais e a ordem por camadas abaixo não foram alteradas por esta sugestão.

## Entrega 1 — Tipos

### T-01 — Definir contratos TypeScript do domínio

- **ID:** T-01
- **Título:** Definir tipos meteorológicos compartilhados
- **Descrição:** Criar os contratos `Unit`, `City`, `CurrentWeather`, `ForecastDay`, `WeatherData` e `WeatherError`, conforme o plano.
- **Critérios de aceite:**
  - O compilador aceita `Unit = 'celsius' | 'fahrenheit'` e rejeita qualquer outro literal.
  - `City` exige `name`, `latitude` e `longitude`; `region` e `country` podem ser omitidos.
  - `CurrentWeather` e `ForecastDay` tipam temperaturas de origem em Celsius; `WeatherData` associa cidade, atuais, previsão e fuso.
  - `WeatherError` limita `kind` e `operation` aos valores definidos no plano; `pnpm build` conclui sem erros de tipos.
- **Dependências:** Nenhuma.
- **Arquivos prováveis:** `src/types/weather.ts`
- **Tipo:** Data

## Entrega 2 — Funções puras

### T-02 — Mapear códigos meteorológicos WMO

- **ID:** T-02
- **Título:** Criar mapeamento de condições WMO para pt-BR
- **Descrição:** Implementar função pura que converte códigos WMO da Open-Meteo em rótulos pt-BR.
- **Critérios de aceite:**
  - Para cada código incluído no mapa, a função retorna exatamente um rótulo pt-BR não vazio.
  - Para código ausente do mapa, a função retorna o resultado inválido definido pelo contrato e não retorna um rótulo de condição.
  - A função recebe o código como argumento, não invoca `fetch` nem lê ou altera estado global.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/weatherCode.ts`
- **Tipo:** Data

### T-03 — Implementar conversão de temperatura

- **ID:** T-03
- **Título:** Converter temperaturas para a unidade selecionada
- **Descrição:** Criar funções puras de conversão e formatação a partir do valor original em Celsius.
- **Critérios de aceite:**
  - Para entradas `0 °C`, `10 °C` e `-40 °C`, a conversão retorna `32 °F`, `50 °F` e `-40 °F`; Celsius permanece inalterado.
  - Valores convertidos são arredondados para o inteiro mais próximo; empates de 0,5 afastam-se de zero.
  - A formatação inclui `°C` para Celsius e `°F` para Fahrenheit.
  - Converter para Fahrenheit e voltar a Celsius usa a entrada original em Celsius, sem usar o valor Fahrenheit arredondado como origem.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/temperature.ts`
- **Tipo:** Data

### T-05 — Validar respostas de geocodificação

- **ID:** T-05
- **Título:** Mapear resultados externos para cidades válidas
- **Descrição:** Implementar função pura que valida a resposta da geocodificação e mapeia nomes, região, país e coordenadas para `City`.
- **Critérios de aceite:**
  - Dada uma resposta externa, o mapper só produz cidades cujo nome, latitude e longitude estejam presentes e cujas coordenadas sejam números finitos.
  - `name`, `admin1`, `country`, `latitude` e `longitude` são mapeados respectivamente para `name`, `region`, `country`, `latitude` e `longitude`.
  - Entradas inválidas são descartadas; campos opcionais ausentes permanecem ausentes, sem valores substitutos.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/weatherMapper.ts`
- **Tipo:** Data

### T-07 — Mapear respostas meteorológicas

- **ID:** T-07
- **Título:** Validar e mapear clima atual e previsão diária
- **Descrição:** Implementar parsing para `CurrentWeather`, `ForecastDay` e os dados meteorológicos agregados da resposta forecast.
- **Critérios de aceite:**
  - Campos atuais obrigatórios (temperatura, código WMO reconhecido, horário e fuso) são validados independentemente dos campos da previsão, e vice-versa.
  - Séries diárias são pareadas pelo índice; data duplicada/fora da janela, temperatura não finita, mínima maior que máxima ou código desconhecido não gera um dia válido.
  - Com um relógio/fuso controlado, a saída inclui somente hoje local e os quatro dias seguintes, em ordem cronológica.
  - A saída preserva valores originais em Celsius e a cidade passada à consulta.
  - A saída permite distinguir previsão com zero, um a quatro ou cinco dias válidos.
- **Dependências:** T-01, T-02.
- **Arquivos prováveis:** `src/lib/weatherMapper.ts`
- **Tipo:** Data

## Entrega 3 — Services

### T-09 — Criar base de requisições HTTP

- **ID:** T-09
- **Título:** Implementar transporte HTTP com timeout e erros tipados
- **Descrição:** Criar a base de serviço compartilhada para `fetch`, validação de status, parsing JSON e timeout de 10 segundos.
- **Critérios de aceite:**
  - Respostas não-2xx, rejeição de rede, JSON inválido e timeout produzem `WeatherError.kind` respectivamente `http`, `network`, `invalid-response` e `timeout`.
  - Com relógio/fetch controlados, requisição ainda pendente é abortada ao completar 10.000 ms e antes disso não é classificada como timeout.
  - Abortamento externo é propagado como cancelamento e não como timeout.
  - Em cada cenário de falha, a promise rejeita com erro tipado; nenhum cenário retorna lista ou dado vazio como sucesso.
- **Dependências:** T-01, T-02, T-03, T-05, T-07.
- **Arquivos prováveis:** `src/services/openMeteo.ts`
- **Tipo:** Data

### T-10 — Consultar geocodificação Open-Meteo

- **ID:** T-10
- **Título:** Implementar busca de cidades pela API
- **Descrição:** Implementar a operação de geocodificação com os parâmetros definidos no plano.
- **Critérios de aceite:**
  - A requisição é `GET` para o endpoint de geocodificação e contém `name` UTF-8 URL-encoded após remoção dos espaços externos, `count=10`, `language=pt` e `format=json`.
  - Uma fixture de sucesso retorna exatamente as cidades válidas produzidas pelo mapper T-05.
  - `results: []` resolve para `City[]` vazio; HTTP/rede/JSON inválido rejeitam com `WeatherError`, sem resolver como lista vazia.
- **Dependências:** T-05, T-09.
- **Arquivos prováveis:** `src/services/openMeteo.ts`
- **Tipo:** Data

### T-12 — Consultar forecast Open-Meteo

- **ID:** T-12
- **Título:** Implementar consulta de condições e previsão
- **Descrição:** Implementar chamada forecast para coordenadas selecionadas e mapear atuais e diários.
- **Critérios de aceite:**
  - A URL de forecast contém `current=temperature_2m,weather_code`, `daily=weather_code,temperature_2m_min,temperature_2m_max`, `temperature_unit=celsius`, `timezone=auto` e `forecast_days=5`.
  - `latitude` e `longitude` enviados são exatamente os da cidade recebida; os dados retornados são mapeados por T-07 e associados à mesma cidade.
  - Fixtures com apenas atuais válidos ou apenas dias válidos preservam a parte válida e identificam separadamente a parte inválida; o mapper valida timezone não vazio e unidades de current/daily em Celsius.
- **Dependências:** T-07, T-09.
- **Arquivos prováveis:** `src/services/openMeteo.ts`
- **Tipo:** Data

## Entrega 4 — Hook

### T-14 — Implementar estado e ações do Weather App

- **ID:** T-14
- **Título:** Orquestrar busca, seleção, clima e repetição
- **Descrição:** Criar `useWeather` com estado tipado e operações para busca, seleção de cidade, consulta, unidade e retry.
- **Critérios de aceite:**
  - Busca, condições atuais e previsão mantêm estados independentes `idle`, `loading`, `success`, `empty` e `error`; previsão também assume `partial` com 1–4 dias válidos.
  - Selecionar uma cidade remove dados meteorológicos da anterior antes do forecast; resposta anterior que chega depois não altera cidade nem dados atuais.
  - Acionar retry chama exatamente uma vez apenas o serviço da operação falha e reutiliza seu termo ou coordenadas.
  - Alternar a unidade altera somente `unit`; nenhum serviço é chamado e nenhuma cidade/data é alterada.
- **Dependências:** T-10, T-12.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`
- **Tipo:** Data

## Entrega 5 — Componentes

### T-24 — Implementar estados visuais de requisição

- **ID:** T-24
- **Título:** Criar componente compartilhado de status
- **Descrição:** Apresentar estados de carregamento e erro com semântica acessível e ação opcional de nova tentativa.
- **Critérios de aceite:**
  - Estado loading renderiza “Carregando...” com semântica `status`; estado error renderiza o texto recebido com semântica `alert`.
  - O botão “Tentar novamente” é renderizado quando há callback e fica ausente quando não há callback.
  - Acionar retry invoca o callback, sem iniciar requisições diretamente nem manter dados de domínio.
- **Dependências:** T-14.
- **Arquivos prováveis:** `src/components/RequestStatus.tsx`
- **Tipo:** UI

### T-16 — Implementar busca e seleção de cidade

- **ID:** T-16
- **Título:** Criar interface de busca e resultados
- **Descrição:** Implementar formulário de busca, validação local e opções selecionáveis de cidade.
- **Critérios de aceite:**
  - Enviar vazio/só espaços não chama o serviço, mostra “Digite o nome de uma cidade.” e mantém foco; controle ASCII U+0000–U+001F/U+007F não chama serviço e mostra a mensagem de caracteres inválidos.
  - Termo não vazio é enviado sem espaços externos; o campo mantém o texto digitado e nomes de resultado são renderizados como texto.
  - Resultados com coordenadas válidas exibem nome e contexto disponível e podem ser selecionados; sem coordenadas não são selecionáveis; homônimos não são selecionados automaticamente.
  - Busca e opções têm nome acessível e seleção é possível por teclado.
- **Dependências:** T-14, T-24.
- **Arquivos prováveis:** `src/components/CitySearch.tsx`
- **Tipo:** UI

### T-18 — Implementar apresentação de condições atuais

- **ID:** T-18
- **Título:** Criar painel de clima atual
- **Descrição:** Exibir cidade, temperatura, descrição WMO em pt-BR e horário local.
- **Critérios de aceite:**
  - Com fixture válida, renderiza nome da cidade, temperatura com unidade, rótulo WMO e horário da observação no fuso da cidade, em pt-BR e formato de 24 horas.
  - Para temperatura 23 °C e código WMO 0, renderiza “23 °C” e “Céu limpo”.
  - O componente recebe valores e callbacks por props; renderizá-lo não chama serviços.
- **Dependências:** T-03, T-14, T-24.
- **Arquivos prováveis:** `src/components/CurrentConditions.tsx`
- **Tipo:** UI

### T-20 — Implementar previsão diária

- **ID:** T-20
- **Título:** Criar lista de previsão de cinco dias
- **Descrição:** Exibir dias válidos em ordem, com datas locais, mínima, máxima e condição.
- **Critérios de aceite:**
  - Com cinco registros válidos, exibe exatamente cinco itens em ordem de data local, com data, mínima, máxima e condição correspondentes ao mesmo registro.
  - Com um a quatro registros válidos, exibe somente esses itens e “Previsão incompleta.” com ação “Tentar novamente”.
  - Em erro ou zero dias válidos, não exibe previsão como válida e mostra a mensagem de falha de previsão com ação “Tentar novamente”.
- **Dependências:** T-03, T-14, T-24.
- **Arquivos prováveis:** `src/components/DailyForecast.tsx`
- **Tipo:** UI

### T-22 — Implementar controle de unidade

- **ID:** T-22
- **Título:** Criar alternância acessível Celsius/Fahrenheit
- **Descrição:** Implementar o controle de unidade e derivar valores na renderização dos painéis.
- **Critérios de aceite:**
  - Existem controles acessíveis com nomes “Celsius (°C)” e “Fahrenheit (°F)”, e o controle ativo reflete a prop `unit`.
  - Alterar `unit` de celsius para fahrenheit e vice-versa chama `onUnitChange` uma vez com o valor correspondente.
  - O controle não chama serviços nem grava unidade em storage; os componentes de temperatura recebem a unidade e convertem a partir do Celsius original.
- **Dependências:** T-03, T-14, T-18, T-20.
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`
- **Tipo:** UI

## Entrega 6 — Integração

### T-26 — Integrar componentes na aplicação

**Incremento de protótipo aprovado:** compor `App` com o mock existente, sem
serviços nem `useWeather`. Header com marca, busca local e unidade em memória;
seletor visível de cenários `idle/loading/empty/error/success`, retry demonstrativo
para sucesso, bootstrap React e estilos Tailwind. A busca compara o nome da
cidade do mock, sem atribuir seus dados a outra cidade. Este incremento não
conclui a integração de API nem substitui os critérios finais abaixo.

- **ID:** T-26
- **Título:** Compor fluxos na tela principal
- **Descrição:** Conectar `useWeather` aos componentes de busca, condições, previsão, unidade e status.
- **Critérios de aceite:**
  - `App` conecta os callbacks de busca, seleção, retry e unidade às props dos componentes correspondentes; não chama `fetch` nem converte/parsa dados.
  - Para cada estado do hook, a UI apresenta loading, empty, error, success e partial no componente correspondente, conforme CA da spec.
  - Ao selecionar cidade B com dados de A visíveis, os dados de A deixam de estar no DOM antes de aparecerem os dados de B.
- **Dependências:** T-14, T-16, T-18, T-20, T-22, T-24.
- **Arquivos prováveis:** `src/App.tsx`
- **Tipo:** UI

## Entrega 7 — Testes

### T-04 — Testar conversão de unidade

- **ID:** T-04
- **Título:** Cobrir conversão e formatação Celsius/Fahrenheit
- **Descrição:** Criar testes unitários dedicados às funções puras de conversão, arredondamento e formatação de temperatura.
- **Critérios de aceite:**
  - Vitest verifica `0 °C → 32 °F`, `10 °C → 50 °F` e `-40 °C → -40 °F`, com os símbolos de unidade correspondentes.
  - Valores originais `1,5 °C` e `-1,5 °C` são exibidos em Celsius como `2 °C` e `-2 °C`; `0,25 °C` e `-18,25 °C` são exibidos em Fahrenheit como `32 °F` e `-1 °F`.
  - Alternar a formatação do mesmo valor original de Celsius para Fahrenheit e de volta mantém o resultado Celsius inicial e não modifica a entrada.
  - A execução dos testes não configura DOM nem realiza chamadas de rede.
- **Dependências:** T-03, T-26.
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`
- **Tipo:** Test

### T-35 — Testar mapeamento de códigos WMO

- **ID:** T-35
- **Título:** Cobrir rótulos meteorológicos e códigos desconhecidos
- **Descrição:** Preservar em uma tarefa separada a cobertura do mapeamento WMO anteriormente agrupada com conversão.
- **Critérios de aceite:**
  - Vitest compara o rótulo retornado para cada código WMO suportado com uma tabela de expectativas independente do mapa de produção; WMO 0 retorna “Céu limpo”.
  - Um código não mapeado produz o resultado inválido do contrato, sem rótulo de condição válida.
  - Os testes passam sem DOM nem chamadas de rede.
- **Dependências:** T-02, T-26.
- **Arquivos prováveis:** `tests/unit/weatherCode.test.ts`
- **Tipo:** Test

### T-06 — Testar mapeamento de cidades

- **ID:** T-06
- **Título:** Cobrir validação de respostas de geocodificação
- **Descrição:** Criar testes unitários para respostas válidas, vazias e com resultados inválidos.
- **Critérios de aceite:**
  - Fixtures verificam mapeamento com região/país presentes e omitidos, e descarte de nome ausente/vazio e coordenadas ausentes, não numéricas ou infinitas.
  - `results: []` produz exatamente uma lista vazia e não lança exceção.
  - A suíte usa apenas fixtures locais e falha se tentar acessar a API pública.
- **Dependências:** T-05, T-26.
- **Arquivos prováveis:** `tests/unit/weatherMapper.test.ts`
- **Tipo:** Test

### T-08 — Testar mapeamento meteorológico

- **ID:** T-08
- **Título:** Cobrir validação de condições atuais e previsão
- **Descrição:** Adicionar testes para mapear respostas forecast completas, parciais e inválidas.
- **Critérios de aceite:**
  - Fixtures verificam atuais válidos e cada campo atual obrigatório ausente/inválido; verificam previsão com cinco, um a quatro e zero dias válidos.
  - As asserções verificam pareamento dos arrays por índice, datas únicas em ordem, fuso controlado e limite inclusivo de hoje até hoje + 4.
  - Uma fixture com atuais inválidos e previsão válida mantém a previsão; uma fixture inversa mantém os atuais.
- **Dependências:** T-07, T-26.
- **Arquivos prováveis:** `tests/unit/weatherMapper.test.ts`
- **Tipo:** Test

### T-11 — Testar serviço de geocodificação

- **ID:** T-11
- **Título:** Cobrir requisições e falhas da busca de cidades
- **Descrição:** Testar a operação de geocodificação com `fetch` mockado.
- **Critérios de aceite:**
  - As asserções verificam endpoint, método, parâmetros e decodificação do termo `São Paulo` para UTF-8.
  - Casos independentes verificam sucesso mapeado, `results: []`, erro HTTP, rejeição de rede, JSON inválido e timeout aos 10.000 ms.
  - `fetch` é mockado em todos os casos e nenhuma requisição sai para a API pública.
  - Mocks de `fetch` e timers controlados são restaurados após cada teste, sem pendências que alterem o resultado do próximo caso.
- **Dependências:** T-10, T-26.
- **Arquivos prováveis:** `tests/unit/openMeteo.test.ts`
- **Tipo:** Test

### T-13 — Testar serviço de forecast

- **ID:** T-13
- **Título:** Cobrir parâmetros e falhas do forecast
- **Descrição:** Testar a consulta de previsão com `fetch` mockado.
- **Critérios de aceite:**
  - As asserções verificam endpoint, método, todos os parâmetros de forecast, coordenadas exatas e unidades Celsius de current/daily.
  - Casos com `fetch` mockado verificam sucesso, HTTP, rede, JSON inválido, campos atuais/fuso/unidades ausentes ou inválidos, arrays diários incompletos e timeout aos 10.000 ms.
  - Em resposta parcial, parte válida é mantida e parte inválida identificada; o resultado sempre carrega a cidade que iniciou a chamada.
  - Todos os casos substituem `fetch` por mock e restauram mocks/timers ao terminar; nenhuma chamada alcança a API pública.
- **Dependências:** T-12, T-26.
- **Arquivos prováveis:** `tests/unit/openMeteo.test.ts`
- **Tipo:** Test

### T-15 — Testar hook e transições de estado

- **ID:** T-15
- **Título:** Cobrir orquestração e respostas concorrentes
- **Descrição:** Testar `useWeather` com os serviços simulados.
- **Critérios de aceite:**
  - Testes com serviços mockados verificam cada estado da busca e dos atuais, e os estados `idle/loading/success/partial/error` da previsão, incluindo 1–4 dias.
  - O contador do serviço confirma que retry chama uma única vez a operação falha com o mesmo termo ou coordenadas.
  - Em teste de concorrência, a resposta da cidade A é resolvida depois da cidade B e o estado final contém somente B.
  - Ao alternar unidade, os contadores de busca e forecast permanecem inalterados.
- **Dependências:** T-14, T-26.
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`
- **Tipo:** Test

### T-17 — Testar estados do componente de busca

- **ID:** T-17
- **Título:** Cobrir busca, vazio, erro e seleção por teclado
- **Descrição:** Criar testes de componente para os estados e interações de `CitySearch`.
- **Critérios de aceite:**
  - Testing Library renderiza idle/loading/success/empty/error e verifica o texto exato de vazio, validação e falha.
  - Com props de loading, encontra `status` com “Carregando...” e envio desabilitado; com empty, encontra “Nenhuma cidade encontrada.”, campo editável e zero opções selecionáveis.
  - Com error, encontra `alert` com “Não foi possível buscar cidades. Tente novamente.” e o botão “Tentar novamente”; acioná-lo chama o callback exatamente uma vez.
  - Testes verificam que vazio e caracteres de controle não chamam serviço, que termo externo é aparado na chamada sem alterar o campo e que nomes são texto.
  - Fixtures com homônimos e coordenadas inválidas verificam contexto, seleção explícita, foco e seleção por teclado.
- **Dependências:** T-16, T-26.
- **Arquivos prováveis:** `tests/components/CitySearch.test.tsx`
- **Tipo:** Test

### T-19 — Testar painel de condições atuais

- **ID:** T-19
- **Título:** Cobrir estados do painel atual
- **Descrição:** Testar renderização e mensagens do componente de condições atuais.
- **Critérios de aceite:**
  - Testing Library verifica ausência de painel atual válido em idle/loading/error e renderização do painel apenas em success.
  - Com fixture de sucesso para 23 °C/WMO 0, verifica “23 °C”, “Céu limpo” e horário formatado.
  - Em error, verifica a mensagem “Não foi possível carregar as condições atuais. Tente novamente.” e o botão acessível “Tentar novamente”.
- **Dependências:** T-18, T-26.
- **Arquivos prováveis:** `tests/components/CurrentConditions.test.tsx`
- **Tipo:** Test

### T-21 — Testar lista de previsão diária

- **ID:** T-21
- **Título:** Cobrir estados da previsão
- **Descrição:** Testar renderização de previsão completa, parcial e indisponível.
- **Critérios de aceite:**
  - Fixtures de 5, 1, 4 e 0 dias válidos verificam respectivamente previsão completa, parcial em seus limites e estado de erro.
  - As asserções verificam ordem cronológica, associação de data/mínima/máxima/condição por registro, texto “Previsão incompleta.” e mensagem/ação de erro exatas.
  - Estados idle e loading não renderizam dias como válidos.
- **Dependências:** T-20, T-26.
- **Arquivos prováveis:** `tests/components/DailyForecast.test.tsx`
- **Tipo:** Test

### T-23 — Testar controle de unidade

- **ID:** T-23
- **Título:** Cobrir alternância visual de unidade
- **Descrição:** Testar rótulos e interação do controle Celsius/Fahrenheit.
- **Critérios de aceite:**
  - Testing Library localiza os dois controles pelos nomes acessíveis definidos e verifica qual está selecionado.
  - Selecionar cada controle chama `onUnitChange` exatamente uma vez com `celsius` ou `fahrenheit`, respectivamente.
  - A interação não executa serviços nem altera cidade ou datas recebidas por props.
- **Dependências:** T-22, T-26.
- **Arquivos prováveis:** `tests/components/UnitToggle.test.tsx`
- **Tipo:** Test

### T-25 — Testar componente de status

- **ID:** T-25
- **Título:** Cobrir anúncio de loading e erro
- **Descrição:** Testar os estados acessíveis e a ação de retry do componente compartilhado.
- **Critérios de aceite:**
  - Testing Library verifica role `status` com “Carregando...”, role `alert` com a mensagem fornecida e ausência de botão sem callback.
  - Com callback, o botão acessível “Tentar novamente” existe e acioná-lo incrementa o contador do callback de 0 para 1.
- **Dependências:** T-24, T-26.
- **Arquivos prováveis:** `tests/components/RequestStatus.test.tsx`
- **Tipo:** Test

### T-27 — Testar fluxo E2E de consulta meteorológica

- **ID:** T-27
- **Título:** Validar fluxo feliz com Playwright
- **Descrição:** Cobrir o mesmo fluxo principal de busca, seleção, atuais e previsão completa em desktop e mobile com Playwright e APIs interceptadas.
- **Critérios de aceite:**
  - Com fixtures fixas para geocodificação e forecast, pesquisar e selecionar São Paulo exibe a cidade, 23 °C, “Céu limpo” e exatamente cinco registros diários esperados.
  - As requisições de geocodificação e forecast são interceptadas; o teste falha se uma chamada externa não interceptada for necessária.
  - O cenário completo passa em 1280 × 800 e 360 × 800, com relógio fixo para que as cinco datas esperadas não dependam do dia da execução.
  - Em 360 × 800, busca e seleção são operáveis, os painéis podem ser alcançados por rolagem vertical e `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
- **Dependências:** T-04, T-35, T-06, T-08, T-11, T-13, T-15, T-17, T-19, T-21, T-23, T-25, T-26.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test

### T-28 — Testar busca E2E sem resultado e homônimos

- **ID:** T-28
- **Título:** Validar resultados de busca no navegador
- **Descrição:** Cobrir a busca sem resultados e a seleção explícita entre cidades homônimas.
- **Critérios de aceite:**
  - Fixture vazia exibe “Nenhuma cidade encontrada.”, mantém o termo no campo e mantém em zero o contador de chamadas forecast.
  - Fixture com cidades homônimas exibe região/país disponíveis e nenhuma cidade é selecionada antes de ação explícita.
  - Fixture com resultados sem coordenadas válidas não oferece opção selecionável e exibe a mensagem de falha de busca e retry.
- **Dependências:** T-27.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test

### T-29 — Testar unidade E2E

- **ID:** T-29
- **Título:** Validar alternância e reinicialização de unidade
- **Descrição:** Verificar conversão na UI e retorno a Celsius após reload.
- **Critérios de aceite:**
  - Com fixture contendo 0 °C e 10 °C, selecionar Fahrenheit exibe 32 °F e 50 °F nos atuais/diários; contadores de chamadas Open-Meteo não aumentam.
  - Após recarregar a página, o controle selecionado e todas as temperaturas exibidas voltam a Celsius.
- **Dependências:** T-27.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test

### T-30 — Testar falhas e previsão parcial E2E

- **ID:** T-30
- **Título:** Validar recuperação de falhas no navegador
- **Descrição:** Cobrir erros HTTP/rede, timeout, retry e resposta parcial.
- **Critérios de aceite:**
  - Uma fixture de erro por operação mostra a mensagem RF-05 correspondente e retry; ao retornar sucesso, uma única nova chamada da mesma operação remove o alerta e mostra os dados.
  - Timeout controlado em 10 segundos mostra “A consulta excedeu o tempo limite. Tente novamente.” e mantém retry disponível.
  - Forecast com 1–4 dias válidos exibe apenas esses dias, “Previsão incompleta.” e retry; com zero dias válidos não exibe previsão válida.
- **Dependências:** T-27.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test

### T-31 — Testar concorrência E2E

- **ID:** T-31
- **Título:** Descartar resposta de cidade anterior
- **Descrição:** Simular resposta atrasada após selecionar uma cidade diferente.
- **Critérios de aceite:**
  - O teste mantém a resposta de A pendente, seleciona B, resolve B e só então resolve A.
  - Depois de cada resolução, a UI mostra B e seus dados; nome, temperatura, condição e datas de A não aparecem como dados atuais.
- **Dependências:** T-27.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test

## Entrega 8 — Hardening

### T-32 — Validar viewport mobile e desktop

- **ID:** T-32
- **Título:** Testar responsividade dos fluxos essenciais
- **Descrição:** Executar fluxos representativos em viewports desktop e mobile.
- **Critérios de aceite:**
  - O fluxo essencial passa em viewports 1280 × 800 e 360 × 800.
  - A matriz de validação registra resultado para os dois últimos releases estáveis de Chrome, Edge, Firefox e Safari disponíveis na data do release e para Safari no iOS e Chrome no Android; a tarefa só é aceita com resultado registrado para cada entrada.
  - Em 360 × 800, `document.documentElement.scrollWidth` não excede `clientWidth`; busca, resultados, unidade e retry são visíveis e operáveis.
- **Dependências:** T-27, T-28, T-29, T-30, T-31.
- **Arquivos prováveis:** `tests/e2e/weather-app.spec.ts`
- **Tipo:** Test

### T-33 — Validar acessibilidade

- **ID:** T-33
- **Título:** Verificar acessibilidade dos fluxos essenciais
- **Descrição:** Executar auditoria automatizada e revisão manual por teclado conforme WCAG 2.2 AA.
- **Critérios de aceite:**
  - A auditoria automatizada configurada para WCAG 2.2 AA retorna zero violações de nível A/AA nas telas de busca, loading, vazio, sucesso, parcial e erro.
  - Sem mouse, Tab/Shift+Tab alcançam campo, envio, opções, controles C/F e retry; Enter seleciona/envia e Space/Enter aciona os controles, sem armadilha de foco.
  - Loading tem role `status` e erro role `alert` em cada estado testado.
- **Dependências:** T-32.
- **Arquivos prováveis:** `tests/e2e/accessibility.spec.ts`
- **Tipo:** Test

### T-34 — Validar desempenho de renderização

- **ID:** T-34
- **Título:** Medir renderização com respostas controladas
- **Descrição:** Verificar a meta de pintura após recebimento e parse de resposta meteorológica.
- **Critérios de aceite:**
  - Em 360 × 800 e 1280 × 800, cada série contém 30 medições entre recebimento/parse de resposta válida e pintura do conteúdo atualizado; em cada série, ao menos 29 valores são ≤500 ms.
  - O relatório identifica viewport, as 30 durações e a quantidade de execuções dentro do limite.
  - As respostas são fixtures controladas e o intervalo medido não inclui latência de rede da API pública.
- **Dependências:** T-32.
- **Arquivos prováveis:** `tests/e2e/performance.spec.ts`
- **Tipo:** Test

## Rastreabilidade com a especificação

### Requisitos funcionais → tarefas de implementação

Os vínculos abaixo indicam cobertura planejada, não implementação concluída. A coluna de implementação inclui contratos e infraestrutura compartilhados; tarefas de teste são listadas separadamente.

| Requisito funcional da spec | Tarefas de implementação | Tarefas de teste funcional | Sem tarefa correspondente? |
|---|---|---|---|
| RF-01 — Buscar e selecionar uma cidade | T-01 (contratos), T-05 (validação de cidades), T-09 (transporte), T-10 (geocodificação), T-12 (coordenadas no forecast), T-14 (estado/seleção), T-16 (busca e resultados), T-24 (status), T-26 (integração) | T-06, T-11, T-13, T-15, T-17, T-27, T-28 | Não |
| RF-02 — Consultar condições meteorológicas atuais | T-01 (contratos), T-02 (WMO), T-03 (temperatura), T-07 (mapeamento), T-09 (transporte), T-12 (forecast), T-14 (estado), T-18 (painel atual), T-24 (status), T-26 (integração) | T-04, T-08, T-13, T-15, T-19, T-27, T-30, T-35 | Não |
| RF-03 — Consultar previsão diária de cinco dias | T-01 (contratos), T-02 (WMO), T-03 (temperatura), T-07 (validação/janela de datas), T-09 (transporte), T-12 (forecast), T-14 (estado/parcial), T-20 (previsão), T-24 (status), T-26 (integração) | T-04, T-08, T-13, T-15, T-21, T-27, T-30, T-35 | Não |
| RF-04 — Alternar unidade de temperatura | T-01 (unidade), T-03 (conversão/arredondamento), T-14 (unidade em memória), T-18 e T-20 (temperaturas na UI), T-22 (controle C/F), T-26 (integração) | T-04, T-15, T-23, T-29 | Não |
| RF-05 — Informar e permitir recuperação de falhas de consulta | T-01 (erros tipados), T-05 e T-07 (validação), T-09 (erros/timeout), T-10 e T-12 (serviços), T-14 (retry/respostas obsoletas), T-16, T-18 e T-20 (estados por consulta), T-24 (loading/alerta/retry), T-26 (integração) | T-06, T-08, T-11, T-13, T-15, T-17, T-19, T-21, T-25, T-30, T-31 | Não |

**Requisitos funcionais sem tarefa correspondente:** nenhum dos cinco RFs. Essa conclusão indica existência de tarefas para cada requisito; não substitui a aprovação de todos os seus critérios de aceite. T-32–T-34 complementam a cobertura com hardening de compatibilidade, acessibilidade e desempenho.

### Tarefas → critérios de aceite e requisitos não funcionais

Cada tarefa aponta para os critérios de aceite (CA) ou requisitos não funcionais (RNF) que sua entrega implementa ou verifica. Tarefas de contratos e infraestrutura não criam requisitos de produto; seus vínculos indicam os comportamentos da spec que habilitam.

| Tarefa | Critérios/RNFs da spec |
|---|---|
| T-01 | CA-01.5, CA-01.7, CA-02.1–CA-02.3, CA-03.1–CA-03.5, CA-04.1–CA-04.6, CA-05.1–CA-05.9 |
| T-02 | CA-02.1–CA-02.3, CA-03.1–CA-03.5 |
| T-03 | CA-02.2, CA-03.3, CA-04.2, CA-04.3, CA-04.6 |
| T-04 | CA-02.2, CA-03.3, CA-04.2, CA-04.3, CA-04.6 |
| T-05 | CA-01.5, CA-01.7, CA-01.9 |
| T-06 | CA-01.5, CA-01.8, CA-01.9 |
| T-07 | CA-02.1–CA-02.3, CA-03.1–CA-03.5, RNF-04, RNF-06 |
| T-08 | CA-02.1–CA-02.3, CA-03.1–CA-03.5, RNF-04, RNF-06 |
| T-09 | CA-02.3, CA-03.5, CA-05.1–CA-05.7 |
| T-10 | CA-01.2, CA-01.3, CA-01.8, CA-01.9, CA-05.1 |
| T-11 | CA-01.3, CA-01.8, CA-01.9, CA-05.1, CA-05.6 |
| T-12 | CA-01.7, CA-02.1–CA-02.3, CA-03.1–CA-03.5, CA-05.2, CA-05.3, RNF-04, RNF-06 |
| T-13 | CA-01.7, CA-02.1–CA-02.3, CA-03.1–CA-03.5, CA-05.2, CA-05.3, CA-05.6, RNF-04 |
| T-14 | CA-01.1–CA-01.9, CA-02.3, CA-03.4, CA-03.5, CA-04.1–CA-04.6, CA-05.4–CA-05.9, RNF-04 |
| T-15 | CA-01.1–CA-01.9, CA-02.3, CA-03.4, CA-03.5, CA-04.1–CA-04.6, CA-05.4–CA-05.9, RNF-04 |
| T-16 | CA-01.1–CA-01.9, RNF-02 |
| T-17 | CA-01.1–CA-01.9, CA-05.1, RNF-02 |
| T-18 | CA-02.1–CA-02.3, CA-04.1–CA-04.3, CA-04.6, RNF-04, RNF-06 |
| T-19 | CA-02.1–CA-02.3, CA-05.2, CA-05.5, CA-05.7, RNF-02, RNF-06 |
| T-20 | CA-03.1–CA-03.5, CA-04.1–CA-04.6, RNF-06 |
| T-21 | CA-03.1–CA-03.5, CA-05.3, CA-05.5, CA-05.7, RNF-06 |
| T-22 | CA-02.2, CA-03.3, CA-04.1–CA-04.6 |
| T-23 | CA-04.1–CA-04.6 |
| T-24 | CA-05.1–CA-05.7, RNF-02 |
| T-25 | CA-05.1–CA-05.7, RNF-02 |
| T-26 | CA-01.7, CA-02.1–CA-02.3, CA-03.1–CA-03.5, CA-04.1–CA-04.6, CA-05.4–CA-05.9, RNF-04, RNF-06 |
| T-27 | CA-01.2–CA-01.7, CA-02.1, CA-02.2, CA-03.1–CA-03.3, CA-04.1, CA-04.2, RNF-01 |
| T-28 | CA-01.1, CA-01.5, CA-01.6, CA-01.8, CA-01.9 |
| T-29 | CA-04.1–CA-04.6 |
| T-30 | CA-02.3, CA-03.4, CA-03.5, CA-05.1–CA-05.7 |
| T-31 | CA-05.8, CA-05.9, RNF-04 |
| T-32 | RNF-01 |
| T-33 | CA-01.1, CA-05.1, CA-05.7, RNF-02 |
| T-34 | RNF-03 |
| T-35 | CA-02.1–CA-02.3, CA-03.1–CA-03.5, RNF-06 |
