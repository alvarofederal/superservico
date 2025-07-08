# Visão Geral do Sistema Super Serviço (SaaS MVP)

## 1. Introdução

Este documento fornece uma visão geral do sistema Super Serviço, um SaaS (Software as a Service) focado na gestão de manutenção e serviços. Ele descreve os principais módulos, suas funcionalidades e as tecnologias empregadas.

## 2. Tecnologias Utilizadas

O sistema é construído com as seguintes tecnologias:

-   **Frontend:**
    -   **Vite:** Build tool e servidor de desenvolvimento.
    -   **React 18.2.0:** Biblioteca para construção da interface do usuário.
    -   **React Router 6.16.0:** Para navegação e roteamento.
    -   **TailwindCSS 3.3.2:** Framework CSS para estilização.
    -   **shadcn/ui:** Coleção de componentes de UI (construídos com Radix UI).
    -   **Lucide React 0.292.0:** Biblioteca de ícones.
    -   **Framer Motion 10.16.4:** Para animações.
    -   **Recharts:** Para gráficos e visualização de dados.
    -   **React Dropzone**: Para upload de arquivos com arrastar e soltar.
-   **Backend & Banco de Dados:**
    -   **Supabase:** Plataforma BaaS (Backend as a Service) utilizando PostgreSQL.
        -   Autenticação
        -   Banco de Dados (PostgreSQL)
        -   Storage (para arquivos como imagens de chamados)
        -   Edge Functions (para lógica de backend segura, como gerenciamento de usuários admin)
-   **Linguagem de Programação:**
    -   **JavaScript (.jsx para componentes React, .js para utilitários).**

## 3. Estrutura de Pastas Principal (src)

-   `src/components/`: Contém os componentes React reutilizáveis e específicos de módulos.
    -   `auth/`: Componentes relacionados à autenticação.
    -   `admin/`: Componentes para funcionalidades administrativas.
    -   `budget-analytics/`: Componentes para a análise de orçamento.
    -   `company/`: Componentes para gerenciamento de empresas.
    -   `equipment/`: Componentes para gerenciamento de equipamentos.
    -   `layout/`: Componentes de layout principal (ex: `MainLayout.jsx`).
    -   `maintenance/`: Componentes para gerenciamento de manutenções.
    -   `parts/`: Componentes para gerenciamento de peças.
    -   `routing/`: Componentes relacionados ao roteamento (ex: `AppRouter.jsx`, `ProtectedRoute.jsx`).
    -   `tickets/`: Componentes para o sistema de chamados.
    -   `ui/`: Componentes base do shadcn/ui.
-   `src/context/`: Contém os providers de contexto (ex: `AuthProvider.jsx`).
-   `src/hooks/`: Contém hooks customizados (ex: `useAuth.js`, `useLocalStorage.js`).
-   `src/lib/`: Contém bibliotecas auxiliares e clientes (ex: `supabaseClient.js`, `utils.js`).
-   `src/pages/`: Contém componentes de página completos (ex: `LandingPage.jsx`).
-   `src/App.jsx`: Componente raiz da aplicação.
-   `src/main.jsx`: Ponto de entrada da aplicação React.

## 4. Módulos Implementados

### 4.1. Autenticação de Usuário

-   **Objetivo:** Gerenciar o acesso dos usuários ao sistema.
-   **Funcionalidades:**
    -   Login com email e senha.
    -   Registro de novos usuários.
    -   Recuperação de senha (Esqueci minha senha).
    -   Atualização de senha (após recuperação).
    -   Logout.
    -   Gerenciamento de sessão e perfil do usuário.
-   **Componentes Chave:** `AuthLayout.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`, `ForgotPasswordPage.jsx`, `UpdatePasswordPage.jsx`, `AuthManager.jsx`, `AuthProvider.jsx`.
-   **Tabelas Supabase:** `auth.users`, `public.profiles`.
-   **Fluxo:** Usuário acessa, se registra ou faz login. Supabase Auth gerencia a autenticação. `AuthProvider` mantém o estado global do usuário.

### 4.2. Layout Principal e Navegação

-   **Objetivo:** Fornecer uma interface consistente e navegação entre os módulos.
-   **Funcionalidades:**
    -   Barra lateral de navegação (sidebar).
    -   Menu responsivo para dispositivos móveis.
    -   Alternância de tema (Claro/Escuro).
    -   Dropdown para seleção de empresa ativa.
    -   Exibição do perfil do usuário e opção de logout.
    -   Roteamento protegido para acesso aos módulos.
-   **Componentes Chave:** `MainLayout.jsx`, `AppRouter.jsx`, `ProtectedRoute.jsx`.
-   **Fluxo:** Após login, `MainLayout` é renderizado, exibindo o menu de navegação e o conteúdo do módulo ativo. `AppRouter` controla qual componente é renderizado com base na URL.

### 4.3. Dashboard

-   **Objetivo:** Apresentar uma visão geral e indicadores chave do sistema.
-   **Funcionalidades:**
    -   Exibição de métricas (total de equipamentos, ordens de serviço, etc.).
    -   Gráficos de tendência (ex: custos mensais, status das OS).
    -   Alertas (ex: manutenções atrasadas, peças com estoque baixo).
    -   (Dados de exemplo para gráficos atualmente).
-   **Componentes Chave:** `Dashboard.jsx`.
-   **Tabelas Supabase:** `equipments`, `work_orders`, `parts`, `service_requests`.
-   **Fluxo:** Coleta dados de várias tabelas para apresentar um resumo visual.

### 4.4. Gerenciamento de Empresas

-   **Objetivo:** Permitir que usuários criem, gerenciem e participem de empresas.
-   **Funcionalidades:**
    -   Criação de novas empresas.
    -   Listagem de empresas às quais o usuário pertence.
    -   Seleção da empresa ativa (contexto da aplicação).
    -   Visualização de detalhes da empresa.
    -   Convite de novos usuários para a empresa (com definição de papel).
    -   Remoção de membros da empresa.
    -   Atribuição de papéis dentro da empresa (ex: `company_admin`, `company_technician`).
-   **Componentes Chave:** `CompanyManager.jsx`, `CreateCompanyForm.jsx`, `CompanyList.jsx`, `CompanyDetails.jsx`, `InviteUserForm.jsx`.
-   **Tabelas Supabase:** `companies`, `company_users`, `profiles`.
-   **Fluxo:** Usuário pode criar uma empresa, tornando-se seu proprietário (`company_admin`). Outros usuários podem ser convidados. O `current_company_id` no perfil do usuário define o contexto para outras operações.

### 4.5. Gerenciamento de Equipamentos

-   **Objetivo:** Cadastrar e gerenciar os ativos da empresa.
-   **Funcionalidades:**
    -   CRUD (Criar, Ler, Atualizar, Excluir) de equipamentos.
    -   Campos: nome, tipo, modelo, número de série, localização, status, datas de manutenção, notas.
    -   Geração e visualização de QR Code para cada equipamento (link para visualização rápida).
    -   Leitura de QR Code para identificação rápida de equipamentos.
    -   Filtros (por status) e busca.
-   **Componentes Chave:** `EquipmentManager.jsx`, `EquipmentForm.jsx` (refatorado de `EquipmentManager.jsx`), `EquipmentCard.jsx` (refatorado de `EquipmentManager.jsx`), `QRCodeStylized.jsx`, `QRCodeDisplayModal.jsx`, `QRCodeScannerComponent.jsx`, `EquipmentDetailsModal.jsx`.
-   **Tabelas Supabase:** `equipments`.
-   **Fluxo:** Usuários associados a uma empresa podem adicionar e gerenciar os equipamentos dessa empresa.

### 4.6. Gerenciamento de Peças e Componentes

-   **Objetivo:** Controlar o estoque de peças utilizadas em manutenções.
-   **Funcionalidades:**
    -   CRUD de peças.
    -   Campos: nome, código, categoria, fornecedor, quantidade, quantidade mínima, custo, localização.
    -   Alertas visuais para peças com estoque baixo.
    -   Cálculo do valor total do estoque.
    -   Filtros (por categoria) e busca.
-   **Componentes Chave:** `PartsManager.jsx`, `PartForm.jsx`, `PartCard.jsx`.
-   **Tabelas Supabase:** `parts`.
-   **Fluxo:** Usuários gerenciam o inventário de peças, atualizando quantidades e custos.

### 4.7. Gerenciamento de Solicitações de Serviço

-   **Objetivo:** Permitir que usuários (incluindo clientes) abram solicitações de manutenção ou suporte.
-   **Funcionalidades:**
    -   CRUD de solicitações de serviço.
    -   Campos: título, descrição, solicitante, contato, equipamento (opcional), urgência, status.
    -   Agendamento de data/tipo de manutenção a partir da SS.
    -   Conversão de uma solicitação de serviço em uma Ordem de Serviço.
    -   Filtros (por status, urgência) e busca.
-   **Componentes Chave:** `ServiceRequestManager.jsx`, `ServiceRequestForm.jsx`, `ServiceRequestCard.jsx`.
-   **Tabelas Supabase:** `service_requests`, `equipments`.
-   **Fluxo:** Usuários criam solicitações. Técnicos ou administradores podem analisar e converter em OS.

### 4.8. Gerenciamento de Ordens de Serviço (OS)

-   **Objetivo:** Planejar, executar e acompanhar os trabalhos de manutenção.
-   **Funcionalidades:**
    -   CRUD de ordens de serviço.
    -   Campos: título, descrição, equipamento, tipo de OS, prioridade, status, responsável, data agendada, custos (estimado/real), horas (estimada/real), notas.
    -   Criação de OS a partir de uma Solicitação de Serviço.
    -   Criação de entrada de manutenção automática se data agendada for fornecida na OS.
    -   Filtros (por status, prioridade) e busca.
-   **Componentes Chave:** `WorkOrderManager.jsx`, `WorkOrderForm.jsx`, `WorkOrderCard.jsx`.
-   **Tabelas Supabase:** `work_orders`, `equipments`.
-   **Fluxo:** OS são criadas (manualmente ou via SS), atribuídas e seu progresso é atualizado.

### 4.9. Gerenciamento de Manutenções

-   **Objetivo:** Agendar, registrar e acompanhar todas as atividades de manutenção.
-   **Funcionalidades:**
    -   CRUD de registros de manutenção.
    -   Campos: título, descrição, equipamento, tipo, status, prioridade, data agendada, data de conclusão, responsável.
    -   Timeline visual para o histórico e progresso de uma manutenção.
    -   Filtros (status, tipo, data) e busca.
    -   Atualização de status da manutenção.
-   **Componentes Chave:** `MaintenanceManager.jsx`, `MaintenanceForm.jsx`, `MaintenanceTable.jsx`, `MaintenanceDetailsModal.jsx`, `MaintenanceTimelineModal.jsx`.
-   **Tabelas Supabase:** `maintenances`, `equipments`, `profiles`.
-   **Fluxo:** Manutenções são agendadas (manualmente, via SS ou OS) e seu ciclo de vida é acompanhado.

### 4.10. Gerenciamento de Chamados (Tickets)

-   **Objetivo:** Permitir que usuários reportem erros ou problemas na aplicação, com anexos.
-   **Funcionalidades:**
    -   Abertura de chamados com título, descrição, prioridade, módulo da aplicação.
    -   Upload de até 5 imagens por chamado (PNG, JPEG, JPG; máx 1MB/imagem).
    -   Pré-visualização de imagens antes do envio.
    -   Listagem de chamados com filtros (status, prioridade, módulo, data).
    -   Visualização de detalhes do chamado, incluindo imagens e comentários.
    -   Adição de comentários aos chamados.
    -   Administradores podem alterar status do chamado.
-   **Componentes Chave:** `TicketManager.jsx`, `TicketForm.jsx`, `TicketTable.jsx`, `TicketDetailsModal.jsx`, `ImageUploadInput.jsx`.
-   **Tabelas Supabase:** `tickets`, `ticket_images`, `ticket_comments`.
-   **Supabase Storage:** Bucket `ticket-attachments` para armazenar as imagens.
-   **Fluxo:** Usuário cria um chamado, anexa imagens. Admins e o próprio usuário podem interagir com comentários e status.

### 4.11. Configurações de Administrador

-   **Objetivo:** Fornecer ferramentas para administradores globais do sistema.
-   **Funcionalidades (Acesso restrito a 'admin'):**
    -   **Gerenciamento de Usuários do Sistema:**
        -   CRUD de usuários (via Edge Functions para contornar RLS do Supabase Auth).
        -   Atribuição de papéis globais (admin, technician, client).
    -   **Gerenciamento de Permissões de Usuário:**
        -   Atribuição granular de acesso a funcionalidades específicas do sistema para cada usuário.
    -   **Gerenciamento de Licenças e Contratos:**
        -   CRUD de registros de licenças de software, contratos de serviço e assinaturas.
        -   Campos: nome, tipo, fornecedor, datas, custo, frequência, status, notas.
        -   Filtros e métricas rápidas.
-   **Componentes Chave:**
    -   `SettingsPage.jsx` (Hub central para configurações).
    -   `UserManagementPage.jsx`, `UserForm.jsx`.
    -   `AdminUserPermissions.jsx`.
    -   `LicenseContractManager.jsx`, `LicenseContractForm.jsx`.
-   **Tabelas Supabase:** `profiles`, `user_permissions`, `licenses_contracts`.
-   **Supabase Edge Functions:** `list-admin-users`, `create-admin-user`, `update-admin-user`, `delete-admin-user`, `get-admin-user-details`.
-   **Fluxo:** Administradores acessam a página de Configurações para gerenciar aspectos globais do sistema.

### 4.12. Análise de Orçamento (Budget Analytics)

-   **Objetivo:** Fornecer insights sobre os custos de manutenção.
-   **Funcionalidades:**
    -   Visualização de métricas chave (custo total, custo médio, total de OS).
    -   Gráficos de custo por tipo de manutenção.
    -   Gráficos de tendência mensal de custos.
    -   Listagem de equipamentos com maiores custos.
    -   Detalhamento de ordens de serviço filtradas.
    -   Filtros por período e categoria de manutenção.
-   **Componentes Chave:** `BudgetAnalytics.jsx` e seus subcomponentes (`KeyMetrics.jsx`, `CostByTypeChart.jsx`, etc.).
-   **Tabelas Supabase:** `work_orders`, `equipments`.
-   **Fluxo:** Coleta dados das ordens de serviço e equipamentos para gerar visualizações financeiras.

## 5. Funcionalidades Transversais

-   **Responsividade:** A interface é projetada para se adaptar a diferentes tamanhos de tela.
-   **Notificações Toast:** Feedback visual para ações do usuário (sucesso, erro, aviso).
-   **Gerenciamento de Estado:** Principalmente local nos componentes, com uso de Context API para autenticação e dados globais do usuário/empresa.
-   **Segurança:**
    -   Políticas de Row Level Security (RLS) no Supabase para controlar o acesso aos dados.
    -   Validações de entrada no frontend e backend (implícito pelas constraints do DB).
    -   Uso de Edge Functions para operações administrativas que exigem privilégios elevados.

## 6. Próximos Passos Potenciais (Não Implementado)

-   Internacionalização (i18n).
-   Notificações por e-mail.
-   Relatórios mais avançados e exportáveis.
-   Integração com calendários externos.
-   Módulo de Checklist para OS.
-   Dashboards personalizáveis por usuário.

Este documento será atualizado conforme o sistema evolui.