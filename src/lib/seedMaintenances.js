import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iweylscfpsfcmfhorfmr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZXlsc2NmcHNmY21maG9yZm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTM0NzAsImV4cCI6MjA2NTA4OTQ3MH0.5Qf9YQZi2cnYYhbWhXvX2bVe3VkFEw31DMqwQjbXf0U';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_USER_ID = 'a2ecf0bd-034d-43a7-a567-4982a087dcdc';

const seedData = async () => {
  console.log('Iniciando o script de seed para manutenções...');

  try {
    console.log(`Buscando perfil do usuário admin: ${ADMIN_USER_ID}`);
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('current_company_id')
      .eq('id', ADMIN_USER_ID)
      .single();

    if (userProfileError) throw new Error(`Erro ao buscar perfil do usuário admin: ${userProfileError.message}`);
    if (!userProfile || !userProfile.current_company_id) {
      throw new Error(`Usuário admin ${ADMIN_USER_ID} não encontrado ou não possui uma empresa atual (current_company_id). Defina uma empresa para este usuário antes de rodar o seed.`);
    }
    
    const COMPANY_ID = userProfile.current_company_id;
    console.log(`Empresa atual do usuário admin encontrada: ${COMPANY_ID}`);

    console.log('Criando equipamentos de teste (se não existirem)...');
    let { data: existingEquipments, error: eqError } = await supabase
      .from('equipments')
      .select('id, name')
      .eq('company_id', COMPANY_ID)
      .limit(2);

    if (eqError) throw eqError;

    let equipment1, equipment2;

    if (existingEquipments && existingEquipments.length >= 2) {
      equipment1 = existingEquipments[0];
      equipment2 = existingEquipments[1];
      console.log(`Equipamentos existentes encontrados: ${equipment1.name}, ${equipment2.name}`);
    } else {
      console.log('Criando novos equipamentos...');
      const equipmentData = [
        { user_id: ADMIN_USER_ID, company_id: COMPANY_ID, name: 'Gerador Principal GTX', type: 'Gerador', location: 'Sala Técnica A', status: 'operacional', qrcode_payload: `equipment_gtx_${Date.now()}` },
        { user_id: ADMIN_USER_ID, company_id: COMPANY_ID, name: 'Bomba Hidráulica BH-500', type: 'Bomba', location: 'Subsolo Bloco B', status: 'operacional', qrcode_payload: `equipment_bh500_${Date.now()}` },
      ];
      const { data: newEquipments, error: newEqError } = await supabase.from('equipments').insert(equipmentData).select();
      if (newEqError) throw newEqError;
      equipment1 = newEquipments[0];
      equipment2 = newEquipments[1];
      console.log(`Novos equipamentos criados: ${equipment1.name}, ${equipment2.name}`);
    }


    console.log('Criando Solicitações de Serviço (SS) de teste...');
    const serviceRequestsData = [
      {
        user_id: ADMIN_USER_ID, company_id: COMPANY_ID, title: 'SS001: Verificação Semanal Gerador',
        description: 'Realizar a verificação semanal completa do Gerador Principal GTX.',
        requester_name: 'Álvaro Admin', equipment_id: equipment1.id, status: 'aberta', urgency: 'medium',
        scheduled_maintenance_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 dias
        maintenance_type: 'preventive',
      },
      {
        user_id: ADMIN_USER_ID, company_id: COMPANY_ID, title: 'SS002: Inspeção Bomba Hidráulica',
        description: 'Inspecionar a Bomba Hidráulica BH-500 para ruídos anormais.',
        requester_name: 'Álvaro Admin', equipment_id: equipment2.id, status: 'aberta', urgency: 'high',
        scheduled_maintenance_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // +1 dia
        maintenance_type: 'inspection',
      },
    ];
    const { data: createdServiceRequests, error: ssError } = await supabase.from('service_requests').insert(serviceRequestsData).select();
    if (ssError) throw ssError;
    console.log(`${createdServiceRequests.length} Solicitações de Serviço criadas.`);


    console.log('Criando Ordens de Serviço (OS) de teste...');
    const workOrdersData = [
      {
        user_id: ADMIN_USER_ID, company_id: COMPANY_ID, title: 'OS001: Reparo Urgente Painel Elétrico',
        description: 'Painel elétrico principal com falha intermitente. Necessita reparo.',
        equipmentid: null, type: 'corrective', priority: 'high', status: 'pending',
        scheduleddate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // +2 dias
        maintenance_type: 'corrective', 
      },
      {
        user_id: ADMIN_USER_ID, company_id: COMPANY_ID, title: 'OS002: Manutenção Preditiva Motor Comp.',
        description: 'Realizar análise preditiva no motor do compressor principal.',
        equipmentid: equipment1.id, type: 'predictive', priority: 'medium', status: 'pending',
        scheduleddate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // +10 dias
        maintenance_type: 'predictive',
      },
    ];
    const { data: createdWorkOrders, error: osError } = await supabase.from('work_orders').insert(workOrdersData).select();
    if (osError) throw osError;
    console.log(`${createdWorkOrders.length} Ordens de Serviço criadas.`);


    console.log('Criando Manutenções de teste...');
    const maintenancesData = [
      {
        company_id: COMPANY_ID, user_id: ADMIN_USER_ID, equipment_id: equipment1.id,
        service_request_id: createdServiceRequests[0].id, 
        title: 'Man. Preventiva Gerador GTX (Originada SS001)', description: 'Verificação semanal completa do Gerador Principal GTX, seguindo checklist.',
        type: 'preventive', status: 'pending', priority: 'medium',
        scheduled_date: createdServiceRequests[0].scheduled_maintenance_date,
        assigned_to_user_id: null, notes: 'Gerada automaticamente a partir da SS001.',
      },
      {
        company_id: COMPANY_ID, user_id: ADMIN_USER_ID, equipment_id: equipment2.id,
        service_request_id: createdServiceRequests[1].id,
        title: 'Insp. Bomba Hidráulica BH-500 (Originada SS002)', description: 'Inspecionar Bomba BH-500 para ruídos, vazamentos e performance.',
        type: 'inspection', status: 'pending', priority: 'high',
        scheduled_date: createdServiceRequests[1].scheduled_maintenance_date,
        assigned_to_user_id: ADMIN_USER_ID, notes: 'Gerada automaticamente a partir da SS002. Atribuída ao Admin para teste.',
      },
      {
        company_id: COMPANY_ID, user_id: ADMIN_USER_ID, equipment_id: null, 
        work_order_id: createdWorkOrders[0].id,
        title: 'Man. Corretiva Painel Elétrico (Originada OS001)', description: 'Reparar falha intermitente no painel elétrico principal da planta.',
        type: 'corrective', status: 'pending', priority: 'critical',
        scheduled_date: createdWorkOrders[0].scheduleddate,
        assigned_to_user_id: null, notes: 'Gerada automaticamente a partir da OS001.',
      },
      {
        company_id: COMPANY_ID, user_id: ADMIN_USER_ID, equipment_id: equipment1.id, 
        work_order_id: createdWorkOrders[1].id,
        title: 'Man. Preditiva Motor Compressor (Originada OS002)', description: 'Análise de vibração e termografia no motor do compressor principal.',
        type: 'predictive', status: 'in_progress', priority: 'medium',
        scheduled_date: createdWorkOrders[1].scheduleddate,
        last_maintenance_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0,10), // 30 dias atrás
        assigned_to_user_id: ADMIN_USER_ID, notes: 'Gerada automaticamente a partir da OS002. Status: Em Andamento para teste.',
      },
    ];

    const { data: createdMaintenances, error: mError } = await supabase.from('maintenances').insert(maintenancesData).select();
    if (mError) throw mError;
    console.log(`${createdMaintenances.length} Manutenções criadas com sucesso!`);

    console.log('Script de seed finalizado com sucesso! 🎉');

  } catch (error) {
    console.error('🚨 Erro durante o script de seed:', error.message);
    if(error.details) console.error('Detalhes do erro:', error.details);
  }
};

seedData();