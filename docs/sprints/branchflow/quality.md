# Estratégia e Padrões de Branches
Este documento define as diretrizes e boas práticas para a criação, gerenciamento e integração de branches no repositório do projeto. A conformidade com este padrão é obrigatória para assegurar a rastreabilidade, a estabilidade das versões em produção e a coordenação eficiente entre os desenvolvedores.
1. Arquitetura de Branches Principais
 A estrutura base do repositório é composta por duas branches de longa duração:
- **main (ou master)**: Contém o código de produção, estável, testado e pronto para implantação. Modificações diretas são estritamente proibidas.
- **develop:** Branch de integração contínua para o desenvolvimento. Concentra as funcionalidades já revisadas e aprovadas que farão parte da próxima release. Modificações diretas também são proibidas.

 2. Padrões de Nomenclatura de Branches:
- Para garantir a rastreabilidade com as tarefas do Backlog, toda branch temporária deve seguir o padrão de nomenclatura estipulado:

# Prefixo de Tipos Permitidos
Prefixo |  Finalidade
|:---: | :--- |
feature/ | Desenvolvimento de nova funcionalidade ou história de usuário |
docs/ |Atualização exclusiva de documentação ou arquivos auxiliares. |
fix/ | Correção de bug encontrado em ambiente de desenvolvimento/QA.|
refactor/ | Melhoria de código sem alterar comportamento externo  clean code, performance|



# 3. Definição de Feito (Definition of Done)

- Uma tarefa só é considerada oficialmente concluída quando atende a todos os critérios da Definição de Feito (DoD).
- Os critérios específicos para cada funcionalidade ou User Story.
Antes de sinalizar a conclusão, verifique se todos os requisitos técnicos e de negócio listados no card da Sprint foram satisfeitos.


# 4. Regras de Integração (Pull Requests)
Em alinhamento com a Definição de Feito (DoD) e os critérios de Aprovação Obrigatória:
- Vínculo com Tarefa: O título ou descrição do PR deve obrigatoriamente citar o card correspondente da Sprint.  
- Revisão Obrigatória: Cada PR necessita de, no mínimo, uma aprovação de outro desenvolvedor (Peer Review).   
- Sanidade da Branch: O criador do PR é responsável por resolver quaisquer conflitos de mesclagem (merge conflicts) antes de solicitar a revisão.  
- Limpeza do Repositório (Housekeeping): Após a conclusão bem-sucedida da mesclagem (merge), a branch temporária deve ser removida para evitar o acúmulo de ramificações obsoletas no repositório remoto.
