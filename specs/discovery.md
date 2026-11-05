# Discovery — Aplicação de previsão do tempo

## Contexto

A empresa solicitou uma aplicação que permita consultar condições meteorológicas de cidades e acompanhar a previsão para os próximos dias. A experiência deve funcionar também em dispositivos móveis.

O briefing define as capacidades principais, mas ainda não determina o público prioritário, as fontes de dados, o comportamento detalhado da busca nem os critérios mensuráveis de qualidade. Esta análise registra o que está definido e destaca as decisões necessárias antes da especificação do produto.

## Personas propostas

As personas abaixo são hipóteses baseadas nas tarefas sugeridas pelo briefing, não resultados de pesquisa com usuários. Devem ser validadas antes de orientar decisões de escopo. As métricas são propostas para instrumentação; metas e método de coleta ainda precisam ser acordados.

| Persona | Objetivo principal | Contexto de uso (web/mobile) | Métrica de sucesso proposta |
|---|---|---|---|
| **Quem consulta antes de sair:** precisa decidir o que vestir ou se deve levar proteção contra o tempo. | Consultar rapidamente as condições atuais e a previsão da própria cidade. | Principalmente mobile, em consultas rápidas antes de sair; web também pode ser usada para uma consulta com mais detalhes. | **Taxa de consulta concluída:** percentual de sessões de busca que chegam à exibição do clima da cidade escolhida sem erro. |
| **Quem planeja atividades com antecedência:** precisa escolher quando realizar uma atividade ao ar livre. | Comparar a previsão dos próximos dias para escolher um dia mais adequado. | Web em tela maior para planejar; mobile para revisitar a previsão durante o dia. | **Taxa de consulta da previsão:** percentual de sessões com uma cidade selecionada em que a pessoa visualiza a previsão de cinco dias. |
| **Quem consulta o tempo em uma cidade diferente:** precisa verificar as condições de um destino ou de outra localidade antes de se deslocar. | Encontrar e confirmar a cidade correta entre locais com nomes iguais ou semelhantes, e consultar suas condições. | Mobile durante a preparação ou o deslocamento; web ao pesquisar ou planejar com antecedência. | **Taxa de seleção correta sem nova busca:** percentual de sessões em que uma cidade é selecionada e os dados são exibidos sem uma nova busca imediata por outra localidade. |

## Requisitos Funcionais

- **RF-01 — Buscar cidades:** permitir que a pessoa usuária pesquise uma cidade e selecione o local desejado para consultar o clima. O comportamento para nomes duplicados ou resultados sem correspondência precisa ser definido.
- **RF-02 — Consultar clima atual:** apresentar as condições meteorológicas atuais da cidade selecionada.
- **RF-03 — Consultar previsão:** apresentar uma previsão do tempo para cinco dias da cidade selecionada, considerando hoje e os quatro dias seguintes. A granularidade e o fuso horário ainda precisam ser definidos.
- **RF-04 — Alternar unidades:** permitir alternar entre Celsius e Fahrenheit para os valores de temperatura apresentados.

## Requisitos Não-Funcionais

- **RNF-01 — Responsividade e uso em dispositivos móveis:** conteúdo e controles devem se adaptar a diferentes tamanhos de tela; busca, consulta das condições atuais, previsão e alternância de unidades devem permanecer utilizáveis em dispositivos móveis.
- **RNF-02 — Usabilidade:** busca, seleção de cidade e alternância de unidade devem ser compreensíveis e operáveis sem instruções externas.
- **RNF-03 — Acessibilidade:** interface e controles devem ser acessíveis, inclusive por teclado e tecnologias assistivas; o nível de conformidade esperado ainda precisa ser acordado.
- **RNF-04 — Atualidade e confiabilidade dos dados:** informações meteorológicas devem indicar condições correspondentes ao local e ao período consultados. Fonte, frequência de atualização e comportamento diante de indisponibilidade ainda precisam ser definidos.
- **RNF-05 — Desempenho:** busca e apresentação de dados devem ocorrer em tempo adequado ao uso, inclusive em dispositivos móveis. Metas de tempo e condições de rede devem ser definidas.

## Riscos

Probabilidade classificada qualitativamente como **baixa**, **média** ou **alta**; as estimativas devem ser revistas conforme público, fonte de dados e requisitos forem definidos.

| Risco | Probabilidade (baixa, média ou alta) | Impacto | Mitigação |
|---|---|---|---|
| **Ambiguidade na busca de cidades:** cidades com nomes iguais ou semelhantes podem levar à seleção do local errado. | Média | Alto — a pessoa pode consultar dados meteorológicos de outra localidade e perder confiança no produto. | Exibir contexto suficiente para diferenciar resultados, como região e país, conforme disponibilidade da fonte; validar a seleção em buscas com nomes duplicados. |
| **Indisponibilidade ou limitações da fonte meteorológica:** interrupções, limites de uso ou cobertura insuficiente podem impedir consultas. | Média | Alto — clima atual e previsão podem ficar indisponíveis ou incompletos. | Avaliar cobertura, limites, licença e confiabilidade antes de escolher a fonte; definir estados de erro e ausência de dados e, se apropriado, uma estratégia de contingência. |
| **Interpretação inconsistente da previsão de cinco dias:** a granularidade da previsão e a forma de agrupar os dias ainda não estão definidas. | Média | Médio — implementação e expectativa do usuário podem divergir, exigindo retrabalho e reduzindo a utilidade da previsão. | Definir na especificação o nível de detalhe, o fuso horário e os critérios de aceite; validar a apresentação com usuários. |
| **Diferenças de fuso horário e atualização:** a data local ou o horário da observação podem ser apresentados incorretamente. | Média | Alto — previsão pode parecer referente ao dia errado ou ser percebida como desatualizada. | Usar o fuso horário da localidade para agrupar e exibir períodos; definir frequência de atualização e indicar horário da observação/atualização quando disponível. |
| **Experiência móvel comprometida:** densidade de informações, controles pequenos ou rede lenta podem dificultar a consulta. | Média | Médio — tarefas centrais podem ficar difíceis ou lentas nos dispositivos previstos pelo briefing. | Validar os fluxos em telas pequenas, garantir controles operáveis e legíveis e testar carregamento em condições de rede representativas. |
| **Conversão de unidades inconsistente:** alternar para Fahrenheit pode deixar valores sem conversão ou produzir arredondamentos inesperados. | Média | Médio — valores contraditórios ou pouco claros podem reduzir a confiança nos dados. | Definir quais campos de temperatura são convertidos e uma regra consistente de arredondamento; testar a alternância em todos os componentes que exibem temperatura. |

## Decisões

| Decisão | Justificativa | Perguntas em aberto que resolve |
|---|---|---|
| **Fonte de dados: Open-Meteo, sem API key.** | Atende à necessidade de dados meteorológicos sem exigir uma chave de API na integração inicial. A cobertura, os limites de uso e os termos aplicáveis ainda devem ser verificados. | **Q9, parcialmente:** define a fonte e elimina a necessidade de obter/gerenciar uma API key; não resolve cobertura, limites, licença, atribuição ou adequação ao uso previsto. |
| **Horizonte da previsão de cinco dias: hoje + quatro dias seguintes.** | Torna explícito como contar os cinco dias e alinha a previsão às consultas que começam no dia atual. | **Q7, parcialmente:** resolve a inclusão de hoje; granularidade da previsão e fuso horário de agrupamento continuam em aberto. |
| **Unidade padrão: Celsius.** | Define um padrão inicial claro para apresentar temperaturas. | **Q11, parcialmente:** resolve a unidade inicial; duração e armazenamento da preferência após alternância continuam em aberto. A escolha de unidades para vento e precipitação também permanece em aberto (Q10). |
| **Sem autenticação e sem persistência de servidor.** | Mantém a primeira versão sem contas e evita armazenar dados de usuário no servidor. | **Q17, parcialmente:** resolve que contas não fazem parte do escopo e que não haverá persistência de servidor; favoritos, histórico ou outras preferências armazenados localmente continuam por decidir. |
| **Idioma da interface: português do Brasil (pt-BR).** | Define o idioma dos textos e controles da interface para a primeira versão. | **Q12, parcialmente:** resolve o idioma da UI; suporte a outros idiomas e convenções regionais específicas, como formato de data/hora, ainda precisa ser definido. |

## Perguntas em Aberto (Open Questions)

Cada pergunta abaixo representa uma decisão que o briefing não fecha. O impacto indica o risco de avançar para a especificação e implementação sem essa resposta.

1. **Quem é o público prioritário e quais tarefas ou situações de uso devem ser atendidas primeiro?**  
   **Impacto se ficar sem resposta:** prioridades de conteúdo, fluxo e acessibilidade podem ser definidas para usuários ou necessidades erradas; fica difícil avaliar se a primeira versão resolve o problema.
2. **Qual resultado de negócio ou necessidade do usuário define o sucesso do produto e como será medido?**  
   **Impacto se ficar sem resposta:** não haverá critério objetivo para priorizar escopo nem para decidir se o produto atende ao briefing.
3. **Quais países e localidades precisam ser cobertos? A aplicação deve atender apenas cidades ou também regiões rurais e localidades menores?**  
   **Impacto se ficar sem resposta:** a cobertura do serviço de busca e da previsão pode ser inadequada para parte do público, descoberta apenas depois da escolha da fonte.
4. **A busca aceita somente nomes de cidades ou também códigos postais, regiões, sugestões enquanto digita e localização atual do dispositivo?**  
   **Impacto se ficar sem resposta:** escopo, permissões de localização e desenho do fluxo de busca permanecem indefinidos; implementar opções desnecessárias ou omitir uma forma essencial de consulta pode gerar retrabalho.
5. **Como diferenciar locais homônimos e quais dados de contexto devem aparecer para cada resultado (por exemplo, estado/província e país)?**  
   **Impacto se ficar sem resposta:** a pessoa pode selecionar a cidade errada e receber informações meteorológicas de outro local.
6. **Quais campos e horários definem “condições meteorológicas atuais” (por exemplo, temperatura, sensação térmica, condição, precipitação, vento e umidade)?**  
   **Impacto se ficar sem resposta:** equipes podem entregar interpretações diferentes de “clima atual”, comprometendo consistência, layout e critérios de aceite.
7. **A previsão de hoje + quatro dias seguintes será diária, horária ou ambas, e em qual fuso horário serão agrupados os dias?**  
   **Impacto se ficar sem resposta:** o nível de detalhe e a data local dos períodos podem divergir das expectativas ou mostrar previsão para o dia errado.
8. **Com que frequência os dados devem ser atualizados e a interface deve mostrar quando foram observados ou atualizados?**  
   **Impacto se ficar sem resposta:** dados desatualizados podem ser apresentados como atuais e não haverá critério verificável de atualidade.
9. **A fonte escolhida, Open-Meteo, atende à cobertura necessária e quais restrições de licença, atribuição, limites de requisição ou uso se aplicam?**  
   **Impacto se ficar sem resposta:** a fonte pode não cobrir as localidades necessárias ou seus termos e limites podem inviabilizar o uso previsto.
10. **Celsius/Fahrenheit se aplica somente à temperatura? Quais unidades devem ser usadas para vento, precipitação e outras medidas, se exibidas?**  
    **Impacto se ficar sem resposta:** valores podem misturar convenções ou ser interpretados incorretamente, afetando confiança e segurança de uso.
11. **Quando a pessoa alternar de Celsius para Fahrenheit, a preferência dura apenas a sessão ou é salva no dispositivo?**  
    **Impacto se ficar sem resposta:** a unidade escolhida pode se perder entre visitas ou persistir sem expectativa clara.
12. **Além da interface em pt-BR, quais convenções regionais devem ser usadas (formato de data/hora, separadores e nomes de localidades)?**  
    **Impacto se ficar sem resposta:** datas e valores podem ser ambíguos ou apresentados de forma inconsistente para o público-alvo.
13. **O que deve acontecer em busca sem resultados, falha da fonte, resposta incompleta ou ausência de conexão? Deve haver tentativa novamente ou dados em cache?**  
    **Impacto se ficar sem resposta:** erros podem deixar a pessoa sem orientação, sem recuperação clara ou vendo dados antigos sem indicação.
14. **Quais metas mensuráveis de desempenho se aplicam à busca e à exibição, em quais condições de rede e dispositivos?**  
    **Impacto se ficar sem resposta:** “tempo adequado” não pode ser testado objetivamente e problemas de lentidão podem ser descobertos somente após a entrega.
15. **Quais navegadores, sistemas operacionais e tamanhos de tela devem ser suportados? “Funcionar em dispositivos móveis” significa web responsiva ou também experiência nativa/instalável?**  
    **Impacto se ficar sem resposta:** não será possível definir a estratégia de interface nem a matriz de testes; uma expectativa de aplicação nativa pode ser confundida com suporte web responsivo.
16. **Qual padrão ou nível de conformidade de acessibilidade é exigido e há necessidades prioritárias além de teclado e tecnologias assistivas?**  
    **Impacto se ficar sem resposta:** “acessível” permanece subjetivo, impedindo critérios de aceite e aumentando o risco de barreiras para pessoas com deficiência.
17. **A primeira versão deve oferecer cidades favoritas, histórico, múltiplas cidades ou alertas meteorológicos, e algum desses dados deve ser salvo localmente?**  
    **Impacto se ficar sem resposta:** funcionalidades locais e notificações podem ser omitidas apesar de esperadas, ou adicionadas sem validação e ampliando indevidamente o escopo.
18. **Se localização atual for incluída, quais permissões e práticas de privacidade/armazenamento são aceitáveis?**  
    **Impacto se ficar sem resposta:** pode haver solicitação de dados de localização sem consentimento ou transparência adequados, além de incerteza sobre retenção e tratamento desses dados.

## Suposições (Assumptions)

- A consulta começa pela busca e seleção explícita de uma cidade; localização automática por GPS não está confirmada.
- A aplicação atende consultas de cidades, sem que o briefing exija contas, histórico ou favoritos.
- Celsius e Fahrenheit são as duas unidades de temperatura necessárias para a primeira versão.
- A previsão de cinco dias inclui hoje e os quatro dias seguintes; a granularidade e o fuso horário ainda precisam ser definidos.
- O uso depende de acesso à fonte Open-Meteo e, em condições normais, de conectividade com a internet; cobertura, limites e termos de uso ainda precisam ser verificados.
- A primeira versão não terá autenticação nem persistência de servidor; armazenamento local de favoritos, histórico ou preferências não está definido.
- O idioma da interface será pt-BR; convenções regionais de data, hora e números ainda precisam ser definidas.
- O suporte a dispositivos móveis exige uma interface responsiva, sem pressupor uma aplicação nativa para cada plataforma.
- As suposições acima são provisórias e devem ser confirmadas ou substituídas durante a elaboração da especificação do produto.
