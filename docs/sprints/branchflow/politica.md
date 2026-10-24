git git # Padrões de Desenvolvimento - GitHub
Este documento estabelece as regras de colaboração, governança e boas práticas do repositório para garantir a integridade do projeto, a rastreabilidade das contribuições e a qualidade das entregas da equipe.

# Política de Branches
Ambiente da Sprint e Desenvolvimento
A branch develop é a nossa branch principal de integração contínua durante a Sprint.
- Base Unificada: Toda nova funcionalidade, correção ou documentação deve ser criada a partir da branch develop.
- Integração: É na develop que consolidamos as contribuições dos membros da equipe para testar a aplicação de forma integrada antes de qualquer entrega final.
- Release (main): O merge para a branch main representa uma versão estável e ocorrerá apenas no encerramento da Sprint ou entrega oficial, após validação total do grupo.

Regra de Verticalidade por Funcionalidade

Para garantir entregas utilizáveis e testáveis, é expressamente proibido separar branches por camadas técnicas (ex: branch apenas para Banco de Dados, apenas para Controller ou apenas para a Interface).  Padrão: tipo/id-descricao-da-feature 
Exemplo Correto: 
feature02-calculo-inadimplencia-regional (Inclui a regra de negócio no backend, o schema do banco de dados easviews da interface).
Exemplo Incorreto: feature/02-apenas-backend-dashboard
Tipos Permitidos de Branches

- **feature/**: `Desenvolvimento de novas funcionalidades previstas no Backlog ou nas Issues do projeto.` 
- **fix/**: `Correção de erros e bugs reportados durante o desenvolvimento ou testes.`
- **docs/**: `Documentação, manuais técnicos, diagramas (VPC, BPMN) e guias da Fatec/instituição.`
- **refactor/**: `Melhoria e limpeza de código existente sem alteração de seu comportamento final.`



# Fluxo de Trabalho (Pull Requests)  
Para evitar regresso de bugs e manter a qualidade do código:  

1. Criação: Abra o Pull Request (PR) direcionando sua branch (tipo/id-...) para a branch develop.
2. Checklist de Autoria: O autor deve preencher as verificações confirmando que a entrega é vertical (completa) e que o código foi testado.
3. Revisão por Pares (Code Review): Pelo menos 1 colega de equipe deve revisar o código.
4. Aprovação: O merge só é liberado após a aprovação formal do revisor e a resolução total de conflitos.

# GitHub Features 
1. Branch Protection (Proteção de Branch)
As branches main e develop possuem regras de proteção ativas no repositório:
- Push Direto Desativado: Não é permitido enviar alterações diretamente (git push). Todo código entra estritamente via Pull Request.
- Revisão Obrigatória: Exige no mínimo 1 aprovação para liberação do merge.
2. Pull Request Template

Ao abrir um PR, o GitHub carregará automaticamente o checklist padrão. O autor deve assinalar que:
   - A funcionalidade foi entregue de ponta a ponta (Verticalidade).

   - Todos os testes locais foram executados e aprovados.

