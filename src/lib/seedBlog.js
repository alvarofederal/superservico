import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = 'https://iweylscfpsfcmfhorfmr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZXlsc2NmcHNmY21maG9yZm1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUxMzQ3MCwiZXhwIjoyMDY1MDg5NDcwfQ.v1Bfqrn-pMo8S3H-i-52v52i9sX5h_a3z8_5y3z_5yA';
const supabase = createClient(supabaseUrl, supabaseKey);

const slugify = (text) => {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const postsToSeed = [
  {
    title: '5 Dicas para Otimizar a Manutenção Preventiva na sua Empresa',
    content: `
      <h1>Introdução à Manutenção Preventiva</h1>
      <p>A manutenção preventiva é uma estratégia essencial para garantir a longevidade e a eficiência dos equipamentos. Ao contrário da manutenção corretiva, que atua após a falha, a preventiva busca evitar que os problemas ocorram. Neste post, vamos explorar 5 dicas práticas para implementar um programa de manutenção preventiva de sucesso.</p>
      
      <h2>1. Crie um Inventário Detalhado de Equipamentos</h2>
      <p>O primeiro passo é saber exatamente o que você tem. Liste todos os equipamentos críticos, incluindo informações como modelo, número de série, data de aquisição e manuais técnicos. Isso servirá como base para todo o seu planejamento.</p>
      
      <h2>2. Siga as Recomendações do Fabricante</h2>
      <p>Os manuais dos fabricantes são sua melhor fonte de informação. Eles contêm os intervalos recomendados para inspeções, lubrificação, troca de peças e outras tarefas essenciais para o bom funcionamento do ativo.</p>
      
      <h2>3. Utilize um Software de Gestão (CMMS)</h2>
      <p>Gerenciar tudo em planilhas é um convite ao erro. Um sistema como o <strong>Super Serviço</strong> automatiza o agendamento, centraliza o histórico de manutenções e fornece dados valiosos para a tomada de decisão.</p>
      <img  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71" alt="Dashboard com gráficos de manutenção" />
      
      <h2>4. Treine sua Equipe</h2>
      <p>Sua equipe técnica precisa estar capacitada para executar as tarefas de manutenção corretamente. Invista em treinamentos sobre os procedimentos padrão, segurança e o uso do software de gestão.</p>

      <h2>5. Monitore e Ajuste</h2>
      <p>Um plano de manutenção não é estático. Monitore indicadores de performance (KPIs) como MTBF (Tempo Médio Entre Falhas) e MTTR (Tempo Médio Para Reparo) para identificar oportunidades de melhoria e ajustar os intervalos das suas manutenções.</p>
      <p>Seguindo estas dicas, você estará no caminho certo para reduzir custos, aumentar a produtividade e garantir a segurança das suas operações. Comece hoje mesmo a transformar a gestão de manutenção da sua empresa!</p>
    `,
    status: 'published',
    cover_image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop',
  },
  {
    title: 'A Revolução da Indústria 4.0 na Manutenção Industrial',
    content: `
      <h1>O que é a Indústria 4.0?</h1>
      <p>A Indústria 4.0, ou a Quarta Revolução Industrial, refere-se à automação e troca de dados nas tecnologias de manufatura. Ela engloba conceitos como Internet das Coisas (IoT), computação em nuvem e inteligência artificial, transformando radicalmente a forma como as fábricas operam.</p>
      
      <h2>Manutenção Preditiva: A Estrela da Indústria 4.0</h2>
      <p>Uma das maiores mudanças trazidas pela Indústria 4.0 é a ascensão da <strong>manutenção preditiva</strong>. Utilizando sensores de IoT instalados nos equipamentos, é possível coletar dados em tempo real sobre vibração, temperatura, e outros parâmetros de funcionamento.</p>
      
      <blockquote>Esses dados são analisados por algoritmos de inteligência artificial que podem prever falhas antes que elas aconteçam, permitindo que a equipe de manutenção atue de forma proativa.</blockquote>
      
      <h2>Benefícios da Manutenção na Indústria 4.0</h2>
      <ul>
        <li><strong>Redução de Custos:</strong> Intervenções são feitas apenas quando necessárias, evitando trocas de peças desnecessárias.</li>
        <li><strong>Aumento do Uptime:</strong> A previsão de falhas minimiza paradas não planejadas.</li>
        <li><strong>Maior Segurança:</strong> Equipamentos com risco de falha catastrófica são identificados precocemente.</li>
        <li><strong>Otimização de Recursos:</strong> As equipes de manutenção podem planejar suas atividades com muito mais eficiência.</li>
      </ul>
      <p>A adoção de tecnologias da Indústria 4.0 não é mais um luxo, mas uma necessidade competitiva. Ferramentas como o Super Serviço estão preparadas para integrar e gerenciar os dados gerados por essa nova era, transformando informações em ações estratégicas para o seu negócio.</p>
    `,
    status: 'published',
    cover_image_url: 'https://images.unsplash.com/photo-1581091870622-9db435a2366b?q=80&w=2070&auto=format&fit=crop',
  }
];

const seedBlogPosts = async () => {
  console.log('Iniciando o processo de seeding de postagens do blog...');

  const { data: adminUser, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (userError || !adminUser) {
    console.error('Erro ao buscar usuário admin ou nenhum admin encontrado:', userError?.message);
    console.log('Por favor, certifique-se de que existe pelo menos um usuário com a role "admin" na tabela "profiles".');
    return;
  }

  const authorId = adminUser.id;
  console.log(`Usuário admin encontrado com ID: ${authorId}. Usando como autor das postagens.`);

  const postsWithAuthorAndSlug = postsToSeed.map(post => ({
    ...post,
    id: uuidv4(),
    author_id: authorId,
    slug: slugify(post.title),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  console.log(`Deletando ${postsWithAuthorAndSlug.length} postagens existentes para evitar duplicatas...`);
  const slugsToDelete = postsWithAuthorAndSlug.map(p => p.slug);
  const { error: deleteError } = await supabase.from('blog_posts').delete().in('slug', slugsToDelete);
  
  if (deleteError) {
      console.error('Erro ao deletar postagens antigas:', deleteError.message);
      return;
  }
  console.log('Postagens antigas com os mesmos slugs foram deletadas com sucesso.');

  console.log(`Inserindo ${postsWithAuthorAndSlug.length} novas postagens...`);
  const { data, error } = await supabase.from('blog_posts').insert(postsWithAuthorAndSlug).select();

  if (error) {
    console.error('Erro ao inserir postagens no banco de dados:', error.message);
  } else {
    console.log('Seeding de postagens do blog concluído com sucesso!');
    console.log(`${data.length} postagens foram inseridas.`);
  }
};

seedBlogPosts();