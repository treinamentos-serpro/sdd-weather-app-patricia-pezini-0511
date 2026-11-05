# Especificação — Weather App

## Overview

O Weather App é uma aplicação web responsiva para pesquisar uma cidade e consultar sua temperatura e condição meteorológica atuais, além da previsão diária para hoje e os quatro dias seguintes. A interface da primeira versão é pt-BR, usa Open-Meteo como fonte, inicia em Celsius e permite alternar a temperatura para Fahrenheit.

Não há autenticação, geolocalização automática nem persistência de dados no servidor. Os critérios abaixo definem o comportamento do produto; questões externas que ainda exigem validação estão listadas em “Open Questions”.

## Functional Requirements

### RF-01 — Buscar e selecionar uma cidade

A aplicação deve permitir pesquisar pelo nome de uma cidade usando o serviço de geocodificação da Open-Meteo e selecionar um resultado antes de consultar o clima. A busca é enviada pelo formulário; não há busca automática enquanto a pessoa digita. Resultados mostram nome, região/estado e país quando disponíveis, e usam as coordenadas do resultado selecionado nas consultas meteorológicas.

**Critérios de aceite**

- **CA-01.1**
  - **Dado** o campo de busca contém apenas espaços em branco
  - **Quando** a pessoa envia o formulário
  - **Então** a busca não é enviada, a mensagem “Digite o nome de uma cidade.” é exibida e o foco permanece no campo
- **CA-01.2**
  - **Dado** o campo contém um termo não vazio com espaços antes ou depois
  - **Quando** a pessoa envia o formulário
  - **Então** a busca é enviada com os espaços externos removidos e o texto original permanece editável no campo
- **CA-01.3**
  - **Dado** o termo informado é “São Paulo” e a fonte retorna resultados
  - **Quando** a pessoa envia a busca
  - **Então** o parâmetro da requisição, decodificado como UTF-8, é “São Paulo” e os nomes retornados são exibidos como texto, não como marcação
- **CA-01.4**
  - **Dado** o termo contém caracteres de controle ASCII (U+0000–U+001F ou U+007F)
  - **Quando** a pessoa envia o formulário
  - **Então** a busca não é enviada e a aplicação exibe “O nome da cidade contém caracteres inválidos.”
- **CA-01.5**
  - **Dado** a fonte de geocodificação retorna resultados para o termo
  - **Quando** os resultados são exibidos
  - **Então** cada resultado com latitude e longitude numéricas é selecionável e mostra o nome da cidade e os campos de região/estado e país disponíveis na resposta; resultados sem coordenadas válidas não são selecionáveis
- **CA-01.6**
  - **Dado** a fonte retorna cidades homônimas com região ou país diferentes
  - **Quando** os resultados são exibidos
  - **Então** os campos disponíveis que distinguem cada local aparecem em cada opção antes da seleção
- **CA-01.7**
  - **Dado** um resultado com coordenadas foi selecionado
  - **Quando** as consultas meteorológicas são iniciadas
  - **Então** ambas usam as coordenadas exatas desse resultado e a interface identifica o clima com o nome da cidade selecionada
- **CA-01.8**
  - **Dado** a geocodificação termina com sucesso e retorna zero resultados
  - **Quando** a resposta é apresentada
  - **Então** a aplicação exibe “Nenhuma cidade encontrada.”, mantém o termo editável e não inicia consultas meteorológicas
- **CA-01.9**
  - **Dado** a geocodificação retorna resultados, mas nenhum contém coordenadas numéricas válidas
  - **Quando** a aplicação processa a resposta
  - **Então** não apresenta esses resultados como selecionáveis e exibe “Não foi possível buscar cidades. Tente novamente.” com ação “Tentar novamente”

### RF-02 — Consultar condições meteorológicas atuais

A aplicação deve exibir para a cidade selecionada a temperatura atual em Celsius, a descrição pt-BR da condição meteorológica e o horário da observação no fuso horário da cidade. A descrição é derivada do código meteorológico WMO retornado pela fonte.

**Critérios de aceite**

- **CA-02.1**
  - **Dado** a cidade selecionada tem temperatura de 23 °C e código WMO 0 na resposta da fonte e a unidade escolhida é Celsius
  - **Quando** a consulta atual termina com sucesso
  - **Então** a aplicação exibe a cidade selecionada, “23 °C”, “Céu limpo” e o horário de observação retornado, formatado em pt-BR no fuso da cidade
- **CA-02.2**
  - **Dado** há uma cidade selecionada e a fonte retorna temperatura numérica e código WMO reconhecido para as coordenadas selecionadas
  - **Quando** a aplicação exibe as condições atuais
  - **Então** exibe a temperatura arredondada conforme RF-04, com o símbolo da unidade vigente, e o rótulo pt-BR correspondente ao código WMO
- **CA-02.3**
  - **Dado** temperatura, código WMO, horário de observação ou fuso horário está ausente ou inválido na resposta
  - **Quando** a aplicação processa a resposta
  - **Então** a aplicação não exibe um painel atual como válido e mostra “Não foi possível carregar as condições atuais. Tente novamente.” com ação “Tentar novamente”

### RF-03 — Consultar previsão diária de cinco dias

A aplicação deve exibir até cinco registros diários da cidade selecionada, com data local, descrição pt-BR e temperaturas mínima e máxima em Celsius antes da conversão de unidade. “Hoje” é a data atual no fuso horário retornado para a localização pela fonte. Um registro diário é válido quando contém uma data única entre hoje e os quatro dias seguintes, temperaturas mínima/máxima finitas com mínima menor ou igual à máxima e código WMO reconhecido.

**Critérios de aceite**

- **CA-03.1**
  - **Dado** a cidade selecionada tem cinco registros diários válidos para a data local de hoje e os quatro dias seguintes, mesmo que a fonte retorne datas adicionais
  - **Quando** a consulta da previsão termina com sucesso
  - **Então** exibe somente os cinco registros dessas datas em ordem cronológica, com data local, mínima, máxima e descrição em pt-BR
- **CA-03.2**
  - **Dado** a fonte retorna registros diários distintos para a cidade selecionada
  - **Quando** a aplicação exibe a previsão
  - **Então** cada entrada exibe apenas a data, mínima, máxima e descrição do mesmo registro diário, sem misturar dados entre datas
- **CA-03.3**
  - **Dado** a unidade selecionada é Celsius ou Fahrenheit e há registros diários válidos
  - **Quando** a previsão é exibida
  - **Então** todas as mínimas e máximas usam a unidade selecionada, com o símbolo correspondente e o arredondamento definido em RF-04
- **CA-03.4**
  - **Dado** a resposta contém de um a quatro registros diários válidos entre hoje e os quatro dias seguintes
  - **Quando** a aplicação processa a resposta
  - **Então** exibe apenas os registros válidos em ordem, mostra “Previsão incompleta.” e oferece “Tentar novamente”
- **CA-03.5**
  - **Dado** a consulta falha, não contém registro diário válido ou não retorna o fuso horário da cidade
  - **Quando** a aplicação processa a resposta
  - **Então** não exibe uma previsão como válida e mostra “Não foi possível carregar a previsão. Tente novamente.” com ação “Tentar novamente”

### RF-04 — Alternar unidade de temperatura

A aplicação deve permitir alternar por controles identificados como “Celsius (°C)” e “Fahrenheit (°F)” em todas as temperaturas atuais e previstas. Celsius é o padrão. A unidade fica apenas em memória durante a página aberta; recarregar ou abrir uma nova página restaura Celsius. A conversão usa °F = °C × 9/5 + 32, a partir do valor original em Celsius.

**Critérios de aceite**

- **CA-04.1**
  - **Dado** a página é carregada
  - **Quando** os dados são exibidos antes de qualquer alteração de unidade
  - **Então** todas as temperaturas são exibidas em Celsius com o símbolo °C
- **CA-04.2**
  - **Dado** a temperatura original é 0 °C e uma previsão contém 10 °C
  - **Quando** a pessoa seleciona Fahrenheit
  - **Então** os valores são exibidos como 32 °F e 50 °F, respectivamente
- **CA-04.3**
  - **Dado** os valores visíveis são 32 °F e 50 °F, correspondentes aos valores de origem 0 °C e 10 °C
  - **Quando** a pessoa seleciona Celsius
  - **Então** os valores são exibidos como 0 °C e 10 °C, respectivamente
- **CA-04.4**
  - **Dado** há uma cidade e uma previsão visíveis, completa ou parcial
  - **Quando** a pessoa alterna a unidade de temperatura
  - **Então** a cidade selecionada e as datas visíveis permanecem inalteradas
- **CA-04.5**
  - **Dado** a pessoa selecionou Fahrenheit e recarrega a página
  - **Quando** os dados são exibidos novamente
  - **Então** a unidade selecionada é Celsius
- **CA-04.6**
  - **Dado** um valor de temperatura em Celsius que convertido resulta em decimal
  - **Quando** a temperatura é exibida em qualquer unidade
  - **Então** a aplicação converte a partir do valor original em Celsius e arredonda para o inteiro mais próximo, com empate de 0,5 arredondado para longe de zero

### RF-05 — Informar e permitir recuperação de falhas de consulta

A aplicação deve distinguir a ausência de resultados de uma falha ao consultar a fonte ou a rede. Em caso de erro HTTP, falha de rede, resposta malformada ou timeout, a aplicação deve informar qual consulta falhou e oferecer repetição manual. Cada requisição expira após 10 segundos; não há repetição automática. As mensagens são “Não foi possível buscar cidades. Tente novamente.”, “Não foi possível carregar as condições atuais. Tente novamente.”, “Não foi possível carregar a previsão. Tente novamente.” e, para timeout, “A consulta excedeu o tempo limite. Tente novamente.”

**Critérios de aceite**

- **CA-05.1**
  - **Dado** a busca de cidades recebe erro HTTP, falha de rede ou resposta malformada
  - **Quando** a aplicação recebe o erro
  - **Então** encerra o carregamento, exibe “Não foi possível buscar cidades. Tente novamente.” em um alerta acessível e oferece “Tentar novamente”
- **CA-05.2**
  - **Dado** a consulta de condições atuais recebe erro HTTP, falha de rede ou resposta malformada
  - **Quando** a aplicação recebe o erro
  - **Então** encerra o carregamento, exibe “Não foi possível carregar as condições atuais. Tente novamente.” em um alerta acessível e oferece “Tentar novamente”
- **CA-05.3**
  - **Dado** a consulta da previsão recebe erro HTTP, falha de rede ou resposta malformada
  - **Quando** a aplicação recebe o erro
  - **Então** encerra o carregamento, exibe “Não foi possível carregar a previsão. Tente novamente.” em um alerta acessível e oferece “Tentar novamente”
- **CA-05.4**
  - **Dado** uma busca ou consulta falhou e o controle “Tentar novamente” está disponível
  - **Quando** a pessoa aciona o controle e a fonte retorna uma resposta válida
  - **Então** uma única nova requisição da mesma operação é enviada, os dados correspondentes são exibidos e o alerta anterior é removido
- **CA-05.5**
  - **Dado** uma busca ou consulta falhou e o controle “Tentar novamente” está disponível
  - **Quando** a pessoa aciona o controle e a fonte retorna outro erro
  - **Então** encerra o carregamento, mantém a mensagem de erro e deixa “Tentar novamente” disponível
- **CA-05.6**
  - **Dado** uma requisição foi iniciada e continua pendente
  - **Quando** completam-se 10 segundos sem resposta
  - **Então** a requisição é encerrada, o carregamento termina e a aplicação exibe “A consulta excedeu o tempo limite. Tente novamente.” com ação “Tentar novamente”
- **CA-05.7**
  - **Dado** uma requisição está pendente
  - **Quando** o estado de carregamento é exibido
  - **Então** a ação que iniciou a requisição fica desabilitada e um estado “Carregando...” é anunciado por tecnologia assistiva
- **CA-05.8**
  - **Dado** a pessoa seleciona uma nova cidade enquanto consultas da cidade anterior ainda estão pendentes
  - **Quando** uma resposta da cidade anterior chega após a seleção nova
  - **Então** essa resposta é descartada e não altera os dados nem o nome da cidade atualmente exibidos
- **CA-05.9**
  - **Dado** há dados meteorológicos visíveis para uma cidade e a pessoa seleciona outra
  - **Quando** as consultas para a nova cidade começam
  - **Então** os dados meteorológicos anteriores são removidos e a interface mostra carregamento para a nova seleção até receber sua resposta

## User Stories

- **US-01 — RF-01 (Buscar e selecionar uma cidade):** Como quem consulta o tempo em uma cidade diferente, quero buscar e comparar localidades com nomes iguais ou semelhantes para selecionar o destino correto antes de consultar o clima.
- **US-02 — RF-02 (Consultar condições meteorológicas atuais):** Como quem consulta antes de sair, quero ver a temperatura e a condição meteorológica atual da minha cidade para decidir o que vestir ou levar.
- **US-03 — RF-03 (Consultar previsão diária de cinco dias):** Como quem planeja atividades com antecedência, quero consultar a previsão diária de hoje e dos quatro dias seguintes para escolher quando realizar uma atividade ao ar livre.
- **US-04 — RF-04 (Alternar unidade de temperatura):** Como quem consulta antes de sair, quero alternar entre Celsius e Fahrenheit durante minha sessão para interpretar as temperaturas na unidade que prefiro.
- **US-05 — RF-05 (Recuperar falhas de consulta):** Como quem consulta o tempo em uma cidade diferente, quero receber uma mensagem quando a busca ou consulta falhar e poder tentar novamente para obter as informações do meu destino.

## Acceptance Criteria

Uma versão é funcionalmente aprovada quando todos os critérios CA-01.1–CA-05.9 passam com respostas controladas da fonte e os testes E2E confirmam os fluxos de busca, seleção, consulta, alternância de unidade e recuperação de falha. Os critérios de qualidade e compatibilidade estão definidos nos RNFs abaixo.

## Non-Functional Requirements

- **RNF-01 — Responsividade e compatibilidade:** os fluxos funcionais devem operar em viewports de 360 × 800 px e 1280 × 800 px, nos dois últimos releases estáveis de Chrome, Edge, Firefox e Safari disponíveis na data do release. A viewport móvel deve ser testada também no Safari para iOS e Chrome para Android. Não pode haver rolagem horizontal da página nem controle necessário fora da viewport ou inacessível por redimensionamento.
- **RNF-02 — Acessibilidade:** cumprir WCAG 2.2 nível AA. Todos os fluxos devem ser operáveis por teclado; campos e botões devem ter nome acessível; resultados e erros devem ter semântica apropriada; carregamento deve ser anunciado como status e erro como alerta. Validar com teste automatizado de acessibilidade e revisão manual por teclado.
- **RNF-03 — Desempenho:** medir do recebimento e parse da resposta válida até a pintura do conteúdo atualizado; o intervalo deve ser ≤500 ms em pelo menos 29 de 30 execuções em cada viewport de RNF-01, usando respostas de teste controladas. Requisições externas expiram em 10 segundos conforme RF-05.
- **RNF-04 — Integridade dos dados:** temperatura, condição, localização e data exibidas devem vir da resposta associada à seleção atual. Uma resposta atrasada de uma seleção anterior nunca pode substituir a seleção ou os dados atuais.
- **RNF-05 — Privacidade e transporte:** não solicitar permissão de localização, não coletar identificadores pessoais e não persistir consultas, coordenadas ou unidade em servidor, cookies ou armazenamento do navegador. O texto digitado e as coordenadas da cidade selecionada são enviados à Open-Meteo por HTTPS; a aplicação não os envia a outros destinos.
- **RNF-06 — Idioma, datas e horário:** interface, estados e descrições meteorológicas devem estar em pt-BR. Datas usam a localidade pt-BR e são agrupadas no fuso horário retornado para a cidade; horários usam formato de 24 horas e o mesmo fuso.

## Edge Cases

- **Busca sem resultados:** exibir “Nenhuma cidade encontrada.”; manter o termo editável e não consultar clima.
- **Entrada vazia ou inválida:** não enviar requisição e exibir a mensagem definida em RF-01.
- **Homônimos:** exibir os campos de região/estado e país disponíveis antes da seleção; nunca escolher automaticamente um resultado.
- **Falha/timeout:** encerrar carregamento, preservar termo ou cidade selecionada, exibir erro e oferecer nova tentativa; não converter falha em lista vazia nem reutilizar dados de outra cidade.
- **Resposta incompleta:** condições atuais sem qualquer campo obrigatório são erro. Previsão com 1–4 dias válidos é parcial; com zero dias válidos é erro. Nunca inventar valores ou datas.
- **Mudança de cidade durante requisições:** descartar respostas tardias da seleção anterior.
- **Virada do dia:** calcular “hoje” e agrupar os cinco dias no fuso horário retornado para a cidade.
- **Alternância de unidade:** converter todos os valores de temperatura visíveis, sem alterar cidade ou datas.

## Assumptions

- A aplicação usa o serviço de geocodificação da Open-Meteo para pesquisar cidades e a API de previsão da Open-Meteo para condições atuais e diárias; as consultas meteorológicas solicitam o fuso automático da localização e não exigem chave de API.
- A consulta de previsão solicita cinco dias diários; inclui hoje e os quatro dias seguintes na data local retornada e apresenta mínima, máxima e condição.
- Cada código WMO suportado pela Open-Meteo é traduzido para sua descrição pt-BR correspondente; códigos desconhecidos são tratados como dado inválido e não exibidos como condição válida.
- As temperaturas são obtidas em Celsius, convertidas a partir do valor original e arredondadas para inteiro mais próximo, com empate de 0,5 para longe de zero.
- A unidade permanece apenas enquanto a página está aberta; recarga restaura Celsius.
- A consulta depende de conectividade e disponibilidade dos serviços Open-Meteo; não há cache, modo offline ou garantia de disponibilidade.

## Risks

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Indisponibilidade, limite de uso ou cobertura insuficiente da Open-Meteo. | Média | Alto — buscas ou consultas podem falhar em localidades necessárias. | Confirmar cobertura e condições de uso antes do release; tratar indisponibilidade conforme RF-05. |
| Localidade homônima selecionada incorretamente. | Média | Alto — os dados exibidos não correspondem ao destino pretendido. | Exibir contexto geográfico disponível e exigir seleção explícita conforme RF-01. |
| Resposta inválida ou atrasada apresentar dados ausentes ou de outra cidade. | Média | Alto — pode induzir decisões com informação incorreta. | Validar campos obrigatórios, descartar respostas obsoletas e testar respostas parciais conforme RF-02, RF-03 e RF-05. |
| Descrição meteorológica não traduzida ou conversão incorreta de temperatura. | Baixa | Médio — reduz compreensão e confiança. | Testar códigos WMO cobertos, código desconhecido e conversões com arredondamento em Celsius e Fahrenheit. |

## Out of Scope

O seguinte não faz parte da primeira versão descrita nesta especificação:

- Autenticação, contas de usuário ou persistência de dados no servidor.
- Localização atual por GPS ou seleção automática de cidade.
- Favoritos, histórico, alertas meteorológicos ou acompanhamento persistente de múltiplas cidades.
- Funcionamento offline ou garantia de apresentação de dados em cache.
- Interface em idiomas além de pt-BR.
- Aplicações nativas para sistemas móveis.
- Previsões horárias; a granularidade aprovada para esta versão é diária.

## Open Questions

1. **A cobertura geográfica e as condições de uso da Open-Meteo (incluindo geocodificação, limites e atribuição) são adequadas ao lançamento?** Confirmar antes do release; se não forem, rever a fonte sem alterar os contratos de tela definidos.
2. **Os objetivos de compatibilidade e desempenho definidos em RNF-01 e RNF-03 são aprovados para o público e os dispositivos de lançamento?** Aprovar antes de usar esses valores como gate final de release.
