# Fluxograma Textual do Sistema Super Serviço

Este documento descreve o fluxo principal dos módulos do sistema Super Serviço em um formato textual, simulando um fluxograma.

## 1. Fluxo de Autenticação e Acesso Inicial

```
[Início] --> Usuário acessa a Landing Page ou URL direta
    |
    +--> [LandingPage.jsx]
    |    |
    |    +--> Botão "Login" --> Redireciona para /login
    |    +--> Botão "Cadastre-se" --> Redireciona para /register
    |
    +--> URL /login --> [AuthLayout.jsx] -> [LoginPage.jsx]
    |    |                |
    |    |                +--> Submete Formulário
    |    |                     |
    |    |                     V
    |    |                     [AuthManager.jsx via AuthProvider.jsx] (Supabase Auth: signInWithPassword)
    |    |                         |
    |    |                         +--> Sucesso? --> Sim --> [ProcessAuthChange] --> Define AUTH_STATE
    |    |                         |                     |
    |    |                         |                     V
    |    |                         |                     [Verifica Perfil e Empresas]
    |    |                         |                         |
    |    |                         |                         +--> AUTH_STATE = AUTHENTICATED (Se tem empresa ou é admin/client sem empresa) --> Redireciona para /app
    |    |                         |                         +--> AUTH_STATE = COMPANY_SELECTION_PENDING (Se precisa selecionar empresa) --> Redireciona para /app (MainLayout exibe CompanyManager)
    |    |                         |
    |    |                         +--> Falha? --> Sim --> Exibe erro no LoginPage
    |
    +--> URL /register --> [AuthLayout.jsx] -> [RegisterPage.jsx]
    |    |                 |
    |    |                 +--> Submete Formulário
    |    |                      |
    |    |                      V
    |    |                      [AuthManager.jsx via AuthProvider.jsx] (Supabase Auth: signUp)
    |    |                          |
    |    |                          +--> Sucesso? --> Sim --> Envia email de confirmação --> Redireciona para /login (ou página de "verifique seu email")
    |    |                          +--> Falha? --> Sim --> Exibe erro no RegisterPage
    |
    +--> URL /forgot-password --> [AuthLayout.jsx] -> [ForgotPasswordPage.jsx]
    +--> URL /update-password --> [AuthLayout.jsx] -> [UpdatePasswordPage.jsx]
```

## 2. Navegação e Estrutura Principal (Após Login)

```
[Usuário Autenticado em /app] --> [AppRouter.jsx] --> [ProtectedRoute.jsx]
    |
    +--> [MainLayout.jsx] (Interface Principal)
         |
         +--> Sidebar/Menu (com base no `userProfile.role` e `userProfile.role_in_company`)
         |    |
         |    +--> Item "Dashboard" --> `activeTab = 'dashboard'` --> Renderiza [Dashboard.jsx] (Navega para /app/dashboard)
         |    +--> Item "Chamados" --> `activeTab = 'tickets'` --> Renderiza [TicketManager.jsx] (Navega para /app/tickets)
         |    +--> Item "Solicitações" --> `activeTab = 'requests'` --> Renderiza [ServiceRequestManager.jsx] (Navega para /app/requests)
         |    +--> Item "Ordens de Serviço" --> `activeTab = 'work-orders'` --> Renderiza [WorkOrderManager.jsx] (Navega para /app/work-orders)
         |    +--> Item "Manutenções" --> `activeTab = 'maintenances'` --> Renderiza [MaintenanceManager.jsx] (Navega para /app/maintenances)
         |    +--> Item "Equipamentos" --> `activeTab = 'equipment'` --> Renderiza [EquipmentManager.jsx] (Navega para /app/equipment)
         |    +--> Item "Peças" --> `activeTab = 'parts'` --> Renderiza [PartsManager.jsx] (Navega para /app/parts)
         |    +--> Item "Minhas Empresas" --> `activeTab = 'company-management'` --> Renderiza [CompanyManager.jsx] (Navega para /app/company-management)
         |    +--> Item "Configurações" (Admin) --> `activeTab = 'settings'` --> Renderiza [SettingsPage.jsx] (Navega para /app/settings)
         |
         +--> Área de Conteúdo Principal
              |
              +--> Renderiza componente do `activeTab` OU componente de rota específica (ex: AdminUserPermissions via /app/admin/permissions/:userId)
```

## 3. Fluxo Típico de um Módulo de Gerenciamento (Ex: Equipamentos)

```
[MainLayout.jsx] --> Usuário clica em "Equipamentos" (Navega para /app/equipment)
    |
    V
[EquipmentManager.jsx] (Lista e Filtros)
    |
    +--> Carrega equipamentos da empresa atual via Supabase (`equipments` table)
    |
    +--> Botão "Novo Equipamento"
    |    |
    |    V
    |    [Dialog com EquipmentForm.jsx] (para Novo)
    |        |
    |        +--> Usuário preenche dados
    |        +--> Botão "Cadastrar"
    |             |
    |             V
    |             [EquipmentManager.handleFormSubmit]
    |                 |
    |                 +--> Insere dados na tabela `equipments` (Supabase)
    |                 +--> Gera QRCode Payload e atualiza equipamento
    |                 +--> Atualiza lista de equipamentos (global e local)
    |                 +--> Fecha Dialog, Exibe Toast
    |
    +--> Lista de [EquipmentCard.jsx]
         |
         +--> Card específico: Botão "Editar"
         |    |
         |    V
         |    [Dialog com EquipmentForm.jsx] (com `initialData`)
         |        |
         |        +--> Usuário edita dados
         |        +--> Botão "Atualizar"
         |             |
         |             V
         |             [EquipmentManager.handleFormSubmit] (lógica de update)
         |                 |
         |                 +--> Atualiza dados na tabela `equipments`
         |                 +--> Atualiza lista, Fecha Dialog, Exibe Toast
         |
         +--> Card específico: Botão "Ver QR" (ícone de olho)
         |    |
         |    V
         |    [EquipmentManager.handleShowQrModal] --> Abre [QRCodeDisplayModal.jsx]
         |
         +--> Card específico: (QRCode visível no card)
    |
    +--> Botão "Escanear Equipamento"
         |
         V
         [QRCodeScannerComponent.jsx]
             |
             +--> Leitura com Sucesso (URL do equipamento)
             |    |
             |    V
             |    [EquipmentManager.handleScanSuccess]
             |        |
             |        +--> Busca dados do equipamento pelo ID (Supabase)
             |        +--> Abre [EquipmentDetailsModal.jsx] com os dados
             |
             +--> Leitura com Erro --> Exibe Toast
```

## 4. Fluxo de Gerenciamento de Empresas

```
[MainLayout.jsx] --> Usuário clica em "Minhas Empresas" (Navega para /app/company-management)
    |
    V
[CompanyManager.jsx]
    |
    +--> Se NENHUMA empresa: Exibe Card "Crie Sua Primeira Empresa"
    |    |
    |    +--> Botão "Criar Minha Primeira Empresa" --> Abre Dialog "Criar Nova Empresa" com [CreateCompanyForm.jsx]
    |
    +--> Se TEM empresas: Exibe [CompanyList.jsx] (Lista de Empresas) e Área de Detalhes
         |
         +--> [CompanyList.jsx]: Usuário seleciona uma empresa
         |    |
         |    V
         |    [CompanyManager.handleSelectCompanyForView] --> Atualiza `selectedCompanyId`
         |        |
         |        V
         |        Renderiza [CompanyDetails.jsx] para a empresa selecionada
         |            |
         |            +--> Exibe informações da empresa
         |            +--> Exibe [CompanyMembersTable.jsx]
         |            |    |
         |            |    +--> Botão "Convidar Usuário" --> Abre Dialog [InviteUserForm.jsx]
         |            |         |
         |            |         +--> Submete convite --> [CompanyManager.handleInviteUser]
         |            |              | (RPC `get_user_id_by_email`, Insert `company_users`)
         |            |
         |            +--> Opção "Remover" membro --> [CompanyManager.handleRemoveUserFromCompany]
         |
         +--> Se `selectedCompanyId` != `userProfile.current_company_id`:
              Exibe Barra Inferior "Confirmar e Continuar"
                  |
                  +--> Botão "Confirmar" --> [CompanyManager.handleConfirmCompanySelection]
                       |
                       V
                       [AuthProvider.selectCompany] --> Atualiza `current_company_id` no `profiles`
                           |
                           V
                           [AuthProvider.refreshAuthData] --> Recarrega dados para nova empresa

    +--> Botão "Nova Empresa"
         |
         V
         [Dialog com CreateCompanyForm.jsx]
             |
             +--> Submete --> [CompanyManager.handleCreateCompany]
                  | (Insert `companies`, `handle_new_company_owner` trigger adiciona a `company_users` e atualiza `current_company_id`)
                  V
                  [AuthProvider.selectCompany] (para a nova empresa)
```

## 5. Fluxo de Gerenciamento de Chamados (Tickets)

```
[MainLayout.jsx] --> Usuário clica em "Chamados" (Navega para /app/tickets)
    |
    V
[TicketManager.jsx]
    |
    +--> Carrega chamados (tabela `tickets` e `profiles` para nome do criador)
    |
    +--> Botão "Novo Chamado"
    |    |
    |    V
    |    [Dialog com TicketForm.jsx]
    |        |
    |        +--> Usuário preenche dados (título, descrição, prioridade, módulo)
    |        +--> [ImageUploadInput.jsx]: Usuário anexa imagens (opcional)
    |        |    |
    |        |    +--> Validação de arquivos, pré-visualização
    |        |
    |        +--> Botão "Abrir Chamado"
    |             |
    |             V
    |             [TicketForm.onSubmit]
    |                 |
    |                 +--> Insere dados na tabela `tickets`
    |                 +--> Se imagens anexadas:
    |                 |    |
    |                 |    +--> Upload para Supabase Storage (bucket `ticket-attachments`)
    |                 |    +--> Insere metadados na tabela `ticket_images`
    |                 |
    |                 +--> [TicketManager.handleFormSubmitSuccess] --> Atualiza lista, Fecha Dialog, Exibe Toast
    |
    +--> [TicketTable.jsx] (Exibe lista de chamados)
         |
         +--> Linha do Chamado: Botão "Visualizar Detalhes"
         |    |
         |    V
         |    [TicketManager.openDetailsModal] --> Abre [TicketDetailsModal.jsx] com dados do chamado
         |        |
         |        +--> Carrega imagens (`ticket_images`) e comentários (`ticket_comments`) associados
         |        +--> Permite adicionar novos comentários
         |        +--> (Admin/CompanyAdmin) Permite alterar status do chamado
         |
         +--> Linha do Chamado: Botão "Editar" (Admin/CompanyAdmin)
         |    |
         |    V
         |    [Dialog com TicketForm.jsx] (com `initialData`) --> (Fluxo similar ao de novo chamado, mas para update)
         |
         +--> Linha do Chamado: Botão "Excluir" (Admin/CompanyAdmin)
              |
              V
              [TicketManager.handleDeleteTicket]
                  |
                  +--> (Confirmação)
                  +--> Remove imagens do Storage (se implementado no backend da exclusão)
                  +--> Remove da tabela `ticket_images` e `ticket_comments` (via CASCADE FK)
                  +--> Remove da tabela `tickets`
                  +--> Atualiza lista, Exibe Toast
```

## 6. Fluxo de Configurações (Administrador)

```
[MainLayout.jsx] --> Usuário Admin clica em "Configurações" (Navega para /app/settings)
    |
    V
[SettingsPage.jsx] (Hub de Configurações)
    |
    +--> Card "Gerenciamento de Usuários"
    |    |
    |    +--> Botão "Acessar" --> Navega para /app/settings/user-management (Rota mapeada para UserManagementPage.jsx)
    |         |
    |         V
    |         [UserManagementPage.jsx]
    |             |
    |             +--> Lista usuários (via Edge Function `list-admin-users`)
    |             +--> Botão "Novo Usuário" --> Dialog com [UserForm.jsx]
    |             |    | (Cria via Edge Function `create-admin-user`)
    |             |
    |             +--> Ações por usuário: Editar (via Edge Function `update-admin-user`),
    |             |                       Excluir (via Edge Function `delete-admin-user`),
    |             |                       Permissões --> Navega para /app/settings/permissions/:userId (Rota mapeada para AdminUserPermissions.jsx)
    |             |                           |
    |             |                           V
    |             |                           [AdminUserPermissions.jsx]
    |             |                               |
    |             |                               +--> Carrega dados do usuário (Edge Function `get-admin-user-details`) e permissões (`user_permissions` table)
    |             |                               +--> Permite marcar/desmarcar acesso a funcionalidades
    |             |                               +--> Salva permissões (Upsert na `user_permissions` table)
    |
    +--> Card "Gestão de Licenças e Contratos"
         |
         +--> Botão "Acessar" --> Navega para /app/settings/licenses-contracts (Rota mapeada para LicenseContractManager.jsx)
              |
              V
              [LicenseContractManager.jsx] (CRUD para tabela `licenses_contracts`)
```

Este fluxograma textual simplifica muitos detalhes, mas cobre as interações principais entre os componentes e os fluxos de dados essenciais, incluindo as rotas de navegação.