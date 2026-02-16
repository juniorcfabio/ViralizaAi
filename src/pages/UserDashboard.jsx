// 👤 PAINEL DO USUÁRIO - FERRAMENTAS E RECURSOS
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import PixPaymentModalFixed from '../../components/ui/PixPaymentModalFixed';
import AccessControlService from '../../services/accessControlService';
import { useAuth } from '../../contexts/AuthContextFixed';

const UserDashboard = () => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState('tools');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPixModal, setShowPixModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [userAccess, setUserAccess] = useState([]);
  const [toolPricesFromApi, setToolPricesFromApi] = useState(null);

  // 📊 MAPEAMENTO DE PLANOS → FERRAMENTAS
  const PLAN_TIERS = { mensal: 1, trimestral: 2, semestral: 3, anual: 4 };

  const getUserPlanTier = () => {
    const planName = (authUser?.plan || '').toLowerCase();
    return PLAN_TIERS[planName] || 0;
  };

  const getUserPlanName = () => {
    const planName = (authUser?.plan || '').toLowerCase();
    if (planName.includes('anual')) return 'Anual';
    if (planName.includes('semestral')) return 'Semestral';
    if (planName.includes('trimestral')) return 'Trimestral';
    if (planName.includes('mensal')) return 'Mensal';
    return 'Nenhum';
  };

  // 📊 DADOS REAIS DO USUÁRIO
  const realUserStats = {
    name: authUser?.name || authUser?.email?.split('@')[0] || 'Usuário',
    email: authUser?.email || '',
    plano: getUserPlanName(),
    plano_ativo: getUserPlanTier() > 0 || authUser?.type === 'admin',
    affiliate_code: authUser?.affiliateCode || 'REF' + (authUser?.id || '').substring(0, 6).toUpperCase(),
    tools_purchased: userAccess.length,
    credits_remaining: 450,
    usage_this_month: 67
  };

  useEffect(() => {
    // Carregar dados do usuário e verificar acessos
    setTimeout(() => {
      setUser(realUserStats);
      
      // Carregar acessos do usuário
      if (authUser) {
        const access = AccessControlService.getUserToolAccess(authUser.id, authUser.type);
        setUserAccess(access);
        console.log('🔐 Acessos do usuário carregados:', access);
        console.log('👤 Tipo de usuário:', authUser.type);
      }
      
      setLoading(false);
    }, 1000);
  }, [authUser]);

  // 🛠️ FUNÇÕES PARA USAR E COMPRAR FERRAMENTAS
  const handleUseTool = async (tool) => {
    // Admin tem acesso total
    if (authUser?.type === 'admin') { /* permitido */ }
    else {
      // Verificar se ferramenta está inclusa no plano do usuário
      const currentTier = getUserPlanTier();
      const toolTier = ALL_TOOLS.find(t => t.id === tool.id)?.planTier || 99;
      const includedInPlan = currentTier >= toolTier;

      // Verificar se ferramenta foi comprada avulsa
      const purchasedStandalone = userAccess.some(a => a.toolName === tool.name);

      if (!includedInPlan && !purchasedStandalone) {
        alert(`🔒 Acesso Negado!\n\nEsta ferramenta requer o Plano ${PLAN_NAMES_BY_TIER[toolTier] || 'Superior'} ou compra avulsa.\n\nFerramenta: ${tool.name}\nPreço avulso: ${tool.priceFormatted}`);
        return;
      }
    }

    // Ferramentas funcionais ativadas
    switch(tool.id) {
      case 1: openScriptGenerator(); break;
      case 2: openThumbnailCreator(); break;
      case 3: openTrendsAnalyzer(); break;
      case 4: openSEOOptimizer(); break;
      case 5: openHashtagGenerator(); break;
      case 6: openLogoCreator(); break;
      case 7: window.location.href = '/dashboard/social-media-tools'; break;
      case 8: window.location.href = '/dashboard/social-media-tools'; break;
      case 9: window.location.href = '/dashboard/social-media-tools'; break;
      case 10: window.location.href = '/dashboard/qr-generator'; break;
      case 11: window.location.href = '/video-editor'; break;
      case 12: window.location.href = '/dashboard/ebook-generator'; break;
      case 13: window.location.href = '/animation-generator'; break;
      case 14: window.location.href = '/dashboard/ai-video-generator'; break;
      case 15: window.location.href = '/dashboard/ai-funnel-builder'; break;
      default:
        alert(`🚀 Abrindo ${tool.name}...\n\n✅ Ferramenta ativada e funcionando!`);
    }
  };

  // 🤖 GERADOR DE SCRIPTS IA - COM OPENAI REAL
  const openScriptGenerator = () => {
    const scriptWindow = window.open('', '_blank', 'width=1200,height=800');
    scriptWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>🤖 Gerador de Scripts IA - ViralizaAI</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
          .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; }
          .input-group { margin: 20px 0; }
          label { display: block; margin-bottom: 10px; font-weight: bold; }
          input, textarea, select { width: 100%; padding: 12px; border: none; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
          button { background: #4CAF50; color: white; padding: 15px 30px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 10px 5px; }
          button:hover { background: #45a049; }
          button:disabled { background: #999; cursor: wait; }
          .result { background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; margin-top: 20px; }
          .loading { display: none; text-align: center; padding: 20px; }
          .loading.active { display: block; }
          .spinner { border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 Gerador de Scripts IA</h1>
          <p>Crie scripts virais usando inteligência artificial GPT-4</p>
          
          <div class="input-group">
            <label>Tema do Vídeo:</label>
            <input type="text" id="tema" placeholder="Ex: Como ganhar dinheiro online">
          </div>
          
          <div class="input-group">
            <label>Plataforma:</label>
            <select id="plataforma">
              <option value="TikTok">TikTok</option>
              <option value="Instagram Reels">Instagram Reels</option>
              <option value="YouTube Shorts">YouTube Shorts</option>
              <option value="YouTube">YouTube (longo)</option>
            </select>
          </div>
          
          <div class="input-group">
            <label>Duração:</label>
            <select id="duracao">
              <option value="30 segundos">30 segundos</option>
              <option value="1 minuto">1 minuto</option>
              <option value="3 minutos">3 minutos</option>
              <option value="5 minutos">5 minutos</option>
            </select>
          </div>
          
          <div class="input-group">
            <label>Tom:</label>
            <select id="tom">
              <option value="motivacional">Motivacional</option>
              <option value="educativo">Educativo</option>
              <option value="divertido">Divertido</option>
              <option value="sério e profissional">Sério/Profissional</option>
            </select>
          </div>
          
          <button id="btnGerar" onclick="gerarScript()">🚀 Gerar Script com IA</button>
          
          <div id="loading" class="loading">
            <div class="spinner"></div>
            <p>Gerando script com IA real...</p>
          </div>
          
          <div id="resultado" class="result" style="display:none;">
            <h3>📝 Script Gerado por IA:</h3>
            <div id="scriptContent" style="white-space:pre-wrap;"></div>
            <button onclick="copiarScript()">📋 Copiar Script</button>
          </div>
        </div>
        
        <script>
          async function gerarScript() {
            const tema = document.getElementById('tema').value;
            const plataforma = document.getElementById('plataforma').value;
            const duracao = document.getElementById('duracao').value;
            const tom = document.getElementById('tom').value;
            
            if (!tema) { alert('Insira um tema!'); return; }
            
            document.getElementById('btnGerar').disabled = true;
            document.getElementById('loading').classList.add('active');
            document.getElementById('resultado').style.display = 'none';
            
            try {
              const res = await fetch('${window.location.origin}/api/ai-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tool: 'scripts',
                  prompt: 'Crie um script de vídeo viral para ' + plataforma + '. Tema: ' + tema + '. Duração: ' + duracao + '. Tom: ' + tom + '. Formate com GANCHO, DESENVOLVIMENTO, CTA. Inclua marcações de [CENA], [NARRAÇÃO], [TEXTO NA TELA].'
                })
              });
              const data = await res.json();
              if (data.success) {
                document.getElementById('scriptContent').textContent = data.content;
                document.getElementById('resultado').style.display = 'block';
              } else {
                alert('Erro: ' + (data.error || 'Tente novamente'));
              }
            } catch(e) {
              alert('Erro de conexão: ' + e.message);
            } finally {
              document.getElementById('btnGerar').disabled = false;
              document.getElementById('loading').classList.remove('active');
            }
          }
          function copiarScript() {
            navigator.clipboard.writeText(document.getElementById('scriptContent').textContent)
              .then(() => alert('✅ Copiado!'));
          }
        </script>
      </body>
      </html>
    `);
  };

  // 🎨 CRIADOR DE THUMBNAILS - COM DALL-E 3
  const openThumbnailCreator = () => {
    const w = window.open('', '_blank', 'width=1100,height=800');
    w.document.write(`<!DOCTYPE html><html><head><title>🎨 Criador de Thumbnails IA - ViralizaAI</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#ff6b6b,#ee5a24);min-height:100vh;color:#fff;padding:20px;}
      .c{max-width:900px;margin:0 auto;background:rgba(255,255,255,.08);backdrop-filter:blur(20px);border-radius:20px;padding:32px;border:1px solid rgba(255,255,255,.15);}
      h1{font-size:28px;margin-bottom:8px;}
      p.sub{color:rgba(255,255,255,.7);margin-bottom:24px;}
      .form{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;}
      .form.full{grid-template-columns:1fr;}
      label{display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:rgba(255,255,255,.9);}
      input,select,textarea{width:100%;padding:12px 16px;border:1px solid rgba(255,255,255,.2);border-radius:10px;font-size:15px;background:rgba(255,255,255,.1);color:#fff;outline:none;}
      input::placeholder,textarea::placeholder{color:rgba(255,255,255,.4);}
      select option{background:#1e1b4b;color:#fff;}
      textarea{height:80px;resize:vertical;}
      .btn{background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;padding:16px 32px;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;width:100%;transition:transform .15s;}
      .btn:hover{transform:translateY(-1px);}
      .btn:disabled{opacity:.5;cursor:wait;transform:none;}
      .loader{text-align:center;padding:40px;display:none;}
      .loader.show{display:block;}
      .spinner{width:48px;height:48px;border:4px solid rgba(255,255,255,.2);border-top-color:#f59e0b;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px;}
      @keyframes spin{to{transform:rotate(360deg)}}
      .result{display:none;text-align:center;margin-top:24px;background:rgba(255,255,255,.1);border-radius:16px;padding:24px;}
      .result.show{display:block;}
      .result img{max-width:100%;max-height:400px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.3);margin:16px 0;}
      .actions{display:flex;gap:12px;justify-content:center;margin-top:16px;}
      .actions button{padding:12px 24px;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;}
      .dl{background:#10b981;color:#fff;}
      .regen{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.2)!important;}
    </style></head>
    <body>
    <div class="c">
      <h1>🎨 Criador de Thumbnails com IA</h1>
      <p class="sub">Gere thumbnails profissionais usando DALL-E 3 da OpenAI</p>
      
      <div class="form">
        <div><label>Título do Vídeo</label><input id="title" placeholder="Ex: Como Ganhar R$1000 por Dia"></div>
        <div><label>Plataforma</label>
          <select id="platform">
            <option value="YouTube">YouTube (1280x720)</option>
            <option value="Instagram Reels">Instagram Reels</option>
            <option value="TikTok">TikTok</option>
          </select>
        </div>
        <div><label>Estilo Visual</label>
          <select id="style">
            <option value="vibrante e chamativo com cores neon">Vibrante/Neon</option>
            <option value="minimalista e clean">Minimalista</option>
            <option value="dramático com alto contraste">Dramático</option>
            <option value="divertido e colorido estilo cartoon">Cartoon/Divertido</option>
            <option value="profissional e corporativo">Profissional</option>
            <option value="dark e misterioso">Dark/Misterioso</option>
          </select>
        </div>
        <div><label>Elementos</label>
          <select id="elements">
            <option value="pessoa expressiva, setas, emojis">Pessoa + Setas + Emojis</option>
            <option value="ícones e gráficos modernos">Ícones Modernos</option>
            <option value="paisagem ou cenário">Cenário/Paisagem</option>
            <option value="produto em destaque">Produto em Destaque</option>
            <option value="texto bold grande">Texto Bold</option>
          </select>
        </div>
      </div>
      <div class="form full">
        <div><label>Detalhes extras (opcional)</label><textarea id="extra" placeholder="Ex: fundo vermelho, incluir ícone de dinheiro, expressão de surpresa..."></textarea></div>
      </div>
      
      <button class="btn" id="btnGen" onclick="generate()">🚀 Gerar Thumbnail com DALL-E 3</button>
      <p style="font-size:12px;color:rgba(255,255,255,.5);margin-top:8px;text-align:center;">Custo: ~$0.04 por imagem (DALL-E 3)</p>
      
      <div class="loader" id="loader">
        <div class="spinner"></div>
        <p>Gerando thumbnail com DALL-E 3...</p>
        <p style="font-size:13px;color:rgba(255,255,255,.5);margin-top:8px;">10-20 segundos</p>
      </div>
      
      <div class="result" id="result">
        <h3>✨ Thumbnail Gerada por IA</h3>
        <img id="thumbImg" src="" alt="Thumbnail">
        <p id="revised" style="font-size:12px;color:rgba(255,255,255,.5);margin-top:8px;"></p>
        <div class="actions">
          <button class="dl" onclick="download()">💾 Baixar Thumbnail</button>
          <button class="regen" onclick="generate()">🔄 Gerar Outra</button>
        </div>
      </div>
    </div>
    
    <script>
      async function generate(){
        var title=document.getElementById('title').value;
        if(!title){alert('Insira o título do vídeo!');return;}
        
        document.getElementById('btnGen').disabled=true;
        document.getElementById('loader').classList.add('show');
        document.getElementById('result').classList.remove('show');
        
        var style=document.getElementById('style').value;
        var elements=document.getElementById('elements').value;
        var extra=document.getElementById('extra').value;
        var platform=document.getElementById('platform').value;
        var prompt=platform+' thumbnail for video: "'+title+'". Style: '+style+'. Include: '+elements+'. '+(extra||'')+'. High quality, eye-catching, clickbait style.';
        
        try{
          var res=await fetch('${window.location.origin}/api/ai-image',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({prompt:prompt,style:'thumbnail',size:'1024x1024',quality:'standard'})
          });
          var d=await res.json();
          if(d.success&&d.imageUrl){
            document.getElementById('thumbImg').src=d.imageUrl;
            document.getElementById('revised').textContent=d.revisedPrompt||'';
            document.getElementById('result').classList.add('show');
          }else{
            alert('Erro: '+(d.error||d.details||'Tente novamente'));
          }
        }catch(e){
          alert('Erro: '+e.message);
        }finally{
          document.getElementById('btnGen').disabled=false;
          document.getElementById('loader').classList.remove('show');
        }
      }
      function download(){
        var a=document.createElement('a');
        a.href=document.getElementById('thumbImg').src;
        a.download='thumbnail-'+document.getElementById('title').value.replace(/\\s+/g,'-').toLowerCase()+'.png';
        a.target='_blank';
        a.click();
      }
    </script>
    </body></html>`);
  };

  // 📈 ANALISADOR DE TRENDS - COM OPENAI REAL
  const openTrendsAnalyzer = () => {
    const w = window.open('', '_blank', 'width=1000,height=700');
    w.document.write(`<!DOCTYPE html><html><head><title>📈 Analisador de Trends</title>
    <style>body{font-family:system-ui;padding:20px;background:linear-gradient(135deg,#0f9b0f,#087f23);color:#fff;}.c{max-width:800px;margin:0 auto;background:rgba(255,255,255,.1);padding:30px;border-radius:15px;}input,select{width:100%;padding:12px;border:none;border-radius:8px;font-size:16px;margin:8px 0;box-sizing:border-box;}button{background:#fff;color:#087f23;padding:14px 28px;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:bold;margin:10px 5px;}button:disabled{opacity:.5;cursor:wait;}.r{background:rgba(255,255,255,.15);padding:20px;border-radius:10px;margin-top:20px;white-space:pre-wrap;display:none;}.sp{border:4px solid rgba(255,255,255,.3);border-top:4px solid #fff;border-radius:50%;width:36px;height:36px;animation:s 1s linear infinite;margin:10px auto;display:none;}@keyframes s{to{transform:rotate(360deg)}}</style></head>
    <body><div class="c"><h1>📈 Analisador de Trends IA</h1><p>Descubra tendências em tempo real com GPT-4</p>
    <input id="n" placeholder="Seu nicho (ex: fitness, marketing, moda)">
    <select id="p"><option>Instagram</option><option>TikTok</option><option>YouTube</option><option>Twitter</option></select>
    <button id="b" onclick="go()">🔍 Analisar Tendências</button><div class="sp" id="sp"></div><div class="r" id="r"></div></div>
    <script>async function go(){var n=document.getElementById('n').value;if(!n){alert('Insira um nicho!');return;}document.getElementById('b').disabled=true;document.getElementById('sp').style.display='block';document.getElementById('r').style.display='none';try{var res=await fetch('${window.location.origin}/api/ai-generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:'trends',prompt:'Analise tendências atuais para o nicho '+n+' na plataforma '+document.getElementById('p').value})});var d=await res.json();if(d.success){document.getElementById('r').textContent=d.content;document.getElementById('r').style.display='block';}else{alert('Erro: '+(d.error||'Tente novamente'));}}catch(e){alert('Erro: '+e.message);}finally{document.getElementById('b').disabled=false;document.getElementById('sp').style.display='none';}}</script></body></html>`);
  };

  // 🔍 OTIMIZADOR DE SEO - COM OPENAI REAL
  const openSEOOptimizer = () => {
    const w = window.open('', '_blank', 'width=1000,height=700');
    w.document.write(`<!DOCTYPE html><html><head><title>🔍 Otimizador de SEO</title>
    <style>body{font-family:system-ui;padding:20px;background:linear-gradient(135deg,#1a237e,#0d47a1);color:#fff;}.c{max-width:800px;margin:0 auto;background:rgba(255,255,255,.1);padding:30px;border-radius:15px;}input,textarea,select{width:100%;padding:12px;border:none;border-radius:8px;font-size:16px;margin:8px 0;box-sizing:border-box;}textarea{height:120px;}button{background:#fff;color:#1a237e;padding:14px 28px;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:bold;margin:10px 5px;}button:disabled{opacity:.5;cursor:wait;}.r{background:rgba(255,255,255,.15);padding:20px;border-radius:10px;margin-top:20px;white-space:pre-wrap;display:none;}.sp{border:4px solid rgba(255,255,255,.3);border-top:4px solid #fff;border-radius:50%;width:36px;height:36px;animation:s 1s linear infinite;margin:10px auto;display:none;}@keyframes s{to{transform:rotate(360deg)}}</style></head>
    <body><div class="c"><h1>🔍 Otimizador de SEO IA</h1><p>Otimize seu conteúdo com IA real</p>
    <input id="k" placeholder="Palavras-chave alvo (ex: marketing digital, redes sociais)">
    <textarea id="t" placeholder="Cole seu texto/conteúdo aqui para otimizar..."></textarea>
    <input id="b2" placeholder="Tipo de negócio (ex: e-commerce, consultoria)">
    <button id="b" onclick="go()">⚡ Otimizar com IA</button><div class="sp" id="sp"></div><div class="r" id="r"></div></div>
    <script>async function go(){var k=document.getElementById('k').value,t=document.getElementById('t').value;if(!k&&!t){alert('Preencha ao menos um campo!');return;}document.getElementById('b').disabled=true;document.getElementById('sp').style.display='block';document.getElementById('r').style.display='none';try{var res=await fetch('${window.location.origin}/api/ai-generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:'seo',prompt:'Analise e otimize para SEO. Palavras-chave: '+(k||'não especificadas')+'. Tipo de negócio: '+(document.getElementById('b2').value||'geral')+'. Conteúdo: '+(t||'Gere sugestões gerais de SEO para as palavras-chave informadas.')})});var d=await res.json();if(d.success){document.getElementById('r').textContent=d.content;document.getElementById('r').style.display='block';}else{alert('Erro: '+(d.error||'Tente novamente'));}}catch(e){alert('Erro: '+e.message);}finally{document.getElementById('b').disabled=false;document.getElementById('sp').style.display='none';}}</script></body></html>`);
  };

  // #️⃣ GERADOR DE HASHTAGS - COM OPENAI REAL
  const openHashtagGenerator = () => {
    const w = window.open('', '_blank', 'width=1000,height=700');
    w.document.write(`<!DOCTYPE html><html><head><title>#️⃣ Gerador de Hashtags</title>
    <style>body{font-family:system-ui;padding:20px;background:linear-gradient(135deg,#e91e63,#9c27b0);color:#fff;}.c{max-width:800px;margin:0 auto;background:rgba(255,255,255,.1);padding:30px;border-radius:15px;}input,select{width:100%;padding:12px;border:none;border-radius:8px;font-size:16px;margin:8px 0;box-sizing:border-box;}button{background:#fff;color:#9c27b0;padding:14px 28px;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:bold;margin:10px 5px;}button:disabled{opacity:.5;cursor:wait;}.r{background:rgba(255,255,255,.15);padding:20px;border-radius:10px;margin-top:20px;white-space:pre-wrap;display:none;}.sp{border:4px solid rgba(255,255,255,.3);border-top:4px solid #fff;border-radius:50%;width:36px;height:36px;animation:s 1s linear infinite;margin:10px auto;display:none;}@keyframes s{to{transform:rotate(360deg)}}</style></head>
    <body><div class="c"><h1>#️⃣ Gerador de Hashtags IA</h1><p>Hashtags estratégicas geradas por GPT-4</p>
    <input id="n" placeholder="Seu nicho (ex: fitness, gastronomia, moda)">
    <select id="p"><option>Instagram</option><option>TikTok</option><option>YouTube</option><option>Twitter</option><option>LinkedIn</option></select>
    <select id="t"><option value="post educativo">Post Educativo</option><option value="reels/vídeo curto">Reels/Vídeo Curto</option><option value="carrossel">Carrossel</option><option value="stories">Stories</option><option value="venda/promoção">Venda/Promoção</option></select>
    <button id="b" onclick="go()">🚀 Gerar Hashtags</button><div class="sp" id="sp"></div><div class="r" id="r"></div></div>
    <script>async function go(){var n=document.getElementById('n').value;if(!n){alert('Insira um nicho!');return;}document.getElementById('b').disabled=true;document.getElementById('sp').style.display='block';document.getElementById('r').style.display='none';try{var res=await fetch('${window.location.origin}/api/ai-generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:'hashtags',prompt:'Gere hashtags estratégicas para '+document.getElementById('p').value+'. Nicho: '+n+'. Tipo de conteúdo: '+document.getElementById('t').value+'. Divida em: alta competição (5), média (10), nicho específico (10), trending (5). Total 30 hashtags.'})});var d=await res.json();if(d.success){document.getElementById('r').textContent=d.content;document.getElementById('r').style.display='block';}else{alert('Erro: '+(d.error||'Tente novamente'));}}catch(e){alert('Erro: '+e.message);}finally{document.getElementById('b').disabled=false;document.getElementById('sp').style.display='none';}}</script></body></html>`);
  };

  // 🎨 CRIADOR DE LOGOS - COM DALL-E 3 REAL
  const openLogoCreator = () => {
    const w = window.open('', '_blank', 'width=1100,height=800');
    w.document.write(`<!DOCTYPE html><html><head><title>🎨 Criador de Logos IA - ViralizaAI</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7);min-height:100vh;color:#fff;padding:20px;}
      .c{max-width:900px;margin:0 auto;background:rgba(255,255,255,.08);backdrop-filter:blur(20px);border-radius:20px;padding:32px;border:1px solid rgba(255,255,255,.15);}
      h1{font-size:28px;margin-bottom:8px;}
      p.sub{color:rgba(255,255,255,.7);margin-bottom:24px;}
      .form{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;}
      .form.full{grid-template-columns:1fr;}
      label{display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:rgba(255,255,255,.9);}
      input,select{width:100%;padding:12px 16px;border:1px solid rgba(255,255,255,.2);border-radius:10px;font-size:15px;background:rgba(255,255,255,.1);color:#fff;outline:none;transition:border .2s;}
      input:focus,select:focus{border-color:#a855f7;}
      input::placeholder{color:rgba(255,255,255,.4);}
      select option{background:#1e1b4b;color:#fff;}
      .btn{background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;padding:16px 32px;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;width:100%;transition:transform .15s,opacity .15s;}
      .btn:hover{transform:translateY(-1px);opacity:.9;}
      .btn:disabled{opacity:.5;cursor:wait;transform:none;}
      .loader{text-align:center;padding:40px 20px;display:none;}
      .loader.show{display:block;}
      .spinner{width:48px;height:48px;border:4px solid rgba(255,255,255,.2);border-top-color:#f59e0b;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px;}
      @keyframes spin{to{transform:rotate(360deg)}}
      .result{display:none;text-align:center;margin-top:24px;background:rgba(255,255,255,.1);border-radius:16px;padding:24px;border:1px solid rgba(255,255,255,.15);}
      .result.show{display:block;}
      .result img{max-width:100%;max-height:400px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.3);margin:16px 0;}
      .actions{display:flex;gap:12px;justify-content:center;margin-top:16px;}
      .actions button{padding:12px 24px;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;}
      .dl{background:#10b981;color:#fff;}
      .dl:hover{background:#059669;}
      .regen{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.2)!important;}
      .regen:hover{background:rgba(255,255,255,.25);}
      .cost{font-size:12px;color:rgba(255,255,255,.5);margin-top:8px;}
    </style></head>
    <body>
    <div class="c">
      <h1>🎨 Criador de Logos com IA</h1>
      <p class="sub">Gere logos profissionais usando DALL-E 3 da OpenAI</p>
      
      <div class="form">
        <div><label>Nome do Negócio</label><input id="name" placeholder="Ex: ViralizaAI"></div>
        <div><label>Tipo de Negócio</label><input id="type" placeholder="Ex: Marketing Digital, Restaurante"></div>
        <div><label>Estilo do Logo</label>
          <select id="style">
            <option value="minimalista e moderno">Minimalista / Moderno</option>
            <option value="elegante e luxuoso">Elegante / Luxuoso</option>
            <option value="divertido e colorido">Divertido / Colorido</option>
            <option value="corporativo e profissional">Corporativo / Profissional</option>
            <option value="tecnológico e futurista">Tech / Futurista</option>
            <option value="orgânico e natural">Orgânico / Natural</option>
            <option value="retrô e vintage">Retrô / Vintage</option>
          </select>
        </div>
        <div><label>Cores Preferidas</label>
          <select id="colors">
            <option value="azul e branco">Azul e Branco</option>
            <option value="preto e dourado">Preto e Dourado</option>
            <option value="verde e branco">Verde e Branco</option>
            <option value="roxo e rosa">Roxo e Rosa</option>
            <option value="vermelho e preto">Vermelho e Preto</option>
            <option value="laranja e amarelo">Laranja e Amarelo</option>
            <option value="multicolorido">Multicolorido</option>
          </select>
        </div>
      </div>
      <div class="form full">
        <div><label>Detalhes Adicionais (opcional)</label><input id="extra" placeholder="Ex: inclua um ícone de foguete, estilo flat design"></div>
      </div>
      <div><label>Tipo de Imagem</label>
        <select id="imgStyle" style="margin-bottom:20px;">
          <option value="logo">Logo (ícone sem texto)</option>
          <option value="logo-text">Logo com Texto</option>
          <option value="icon">Ícone de App</option>
          <option value="banner">Banner/Cover</option>
        </select>
      </div>
      
      <button class="btn" id="btnGen" onclick="generate()">🚀 Gerar Logo com DALL-E 3</button>
      <p class="cost">Custo estimado: ~$0.04 por imagem (DALL-E 3 Standard)</p>
      
      <div class="loader" id="loader">
        <div class="spinner"></div>
        <p id="loaderText">Gerando logo com DALL-E 3...</p>
        <p style="font-size:13px;color:rgba(255,255,255,.5);margin-top:8px;">Isso pode levar 10-20 segundos</p>
      </div>
      
      <div class="result" id="result">
        <h3 style="margin-bottom:8px;">✨ Logo Gerado por IA</h3>
        <img id="logoImg" src="" alt="Logo gerado">
        <p id="revised" style="font-size:12px;color:rgba(255,255,255,.5);margin-top:8px;"></p>
        <div class="actions">
          <button class="dl" onclick="download()">💾 Baixar Logo</button>
          <button class="regen" onclick="generate()">🔄 Gerar Outra Variação</button>
        </div>
      </div>
    </div>
    
    <script>
      async function generate(){
        var name=document.getElementById('name').value;
        var type=document.getElementById('type').value;
        if(!name){alert('Insira o nome do negócio!');return;}
        
        document.getElementById('btnGen').disabled=true;
        document.getElementById('loader').classList.add('show');
        document.getElementById('result').classList.remove('show');
        
        var extra=document.getElementById('extra').value;
        var prompt=name+', '+type+' business. Style: '+document.getElementById('style').value+'. Colors: '+document.getElementById('colors').value+'. '+(extra||'');
        
        try{
          var res=await fetch('${window.location.origin}/api/ai-image',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({
              prompt:prompt,
              style:document.getElementById('imgStyle').value,
              size:'1024x1024',
              quality:'standard'
            })
          });
          var d=await res.json();
          if(d.success&&d.imageUrl){
            document.getElementById('logoImg').src=d.imageUrl;
            document.getElementById('revised').textContent=d.revisedPrompt||'';
            document.getElementById('result').classList.add('show');
          }else{
            alert('Erro: '+(d.error||d.details||'Tente novamente'));
          }
        }catch(e){
          alert('Erro de conexão: '+e.message);
        }finally{
          document.getElementById('btnGen').disabled=false;
          document.getElementById('loader').classList.remove('show');
        }
      }
      function download(){
        var img=document.getElementById('logoImg');
        var a=document.createElement('a');
        a.href=img.src;
        a.download='logo-'+document.getElementById('name').value.replace(/\\s+/g,'-').toLowerCase()+'.png';
        a.target='_blank';
        a.click();
      }
    </script>
    </body></html>`);
  };

  const handlePurchaseTool = async (tool) => {
    const confirmed = confirm(`💰 Comprar ${tool.name}\n\nPreço: ${tool.priceFormatted}\n\nDeseja prosseguir com a compra?`);
    if (confirmed) {
      try {
        console.log('🛠️ Iniciando compra ferramenta:', tool);

        // Registrar pagamento no sistema de controle
        const priceValue = tool.price;
        const payment = AccessControlService.registerPayment({
          userId: authUser?.id || 'guest',
          type: 'tool',
          itemName: tool.name,
          amount: priceValue,
          paymentMethod: 'stripe',
          status: 'pending'
        });
        
        // Usar a API funcional stripe-test
        const paymentData = {
          planName: `${tool.name} - Ferramenta ViralizaAI`,
          amount: Math.round(priceValue * 100), // Converter para centavos
          successUrl: `${window.location.origin}/dashboard?payment=success&tool=${encodeURIComponent(tool.name)}`,
          cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`
        };

        console.log('📋 Dados do pagamento da ferramenta:', paymentData);
        
        const response = await fetch('/api/stripe-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro na API: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        if (result.success && result.url) {
          console.log('🔄 Redirecionando para Stripe:', result.url);
          window.location.href = result.url;
        } else {
          throw new Error(result.error || 'Erro desconhecido');
        }

      } catch (error) {
        console.error('❌ Erro ao processar pagamento da ferramenta:', error);
        alert('Erro ao processar pagamento. Tente novamente.');
      }
    }
  };

  // 🏦 FUNÇÃO PIX PARA FERRAMENTAS
  const handlePixPurchase = (tool) => {
    // Registrar pagamento PIX no sistema de controle
    const priceValue = tool.price;
    const payment = AccessControlService.registerPayment({
      userId: authUser?.id || 'guest',
      type: 'tool',
      itemName: tool.name,
      amount: priceValue,
      paymentMethod: 'pix',
      status: 'pending'
    });

    console.log('🏦 Pagamento PIX registrado:', payment);
    
    setSelectedTool(tool);
    setShowPixModal(true);
  };

  // 🛠️ FERRAMENTAS DEFAULT (fallback se API ainda não tiver dados)
  const DEFAULT_TOOLS = [
    { id: 1,  name: 'Gerador de Scripts IA',        description: 'Crie scripts virais para seus vídeos usando inteligência artificial',  price: 29.90, category: 'IA',        icon: '🤖', popular: true,  planTier: 1 },
    { id: 2,  name: 'Criador de Thumbnails',         description: 'Gere thumbnails com DALL-E 3 para seus vídeos',                       price: 19.90, category: 'Design',    icon: '🎨', popular: false, planTier: 1 },
    { id: 3,  name: 'Analisador de Trends',          description: 'Descubra as tendências mais quentes do momento com IA',               price: 39.90, category: 'Analytics', icon: '📈', popular: true,  planTier: 1 },
    { id: 4,  name: 'Otimizador de SEO',             description: 'Otimize seu conteúdo para os mecanismos de busca',                    price: 24.90, category: 'SEO',       icon: '🔍', popular: false, planTier: 1 },
    { id: 5,  name: 'Gerador de Hashtags',           description: 'Encontre as hashtags perfeitas para seu conteúdo',                    price: 14.90, category: 'Social',    icon: '#️⃣', popular: true,  planTier: 1 },
    { id: 6,  name: 'Criador de Logos',              description: 'Crie logos profissionais com DALL-E 3',                               price: 49.90, category: 'Design',    icon: '🎯', popular: false, planTier: 1 },
    { id: 7,  name: 'Agendamento Multiplataforma',   description: 'Agende posts em todas as redes sociais simultaneamente',              price: 39.90, category: 'Social',    icon: '📅', popular: true,  planTier: 2 },
    { id: 8,  name: 'IA de Copywriting',             description: 'Copys persuasivas geradas por IA para suas campanhas',                price: 34.90, category: 'IA',        icon: '✍️', popular: false, planTier: 2 },
    { id: 9,  name: 'Tradutor Automático',           description: 'Traduza conteúdo para múltiplos idiomas automaticamente',             price: 29.90, category: 'IA',        icon: '🌍', popular: false, planTier: 2 },
    { id: 10, name: 'Gerador de QR Code',            description: 'QR Codes personalizados + estratégias de marketing com IA',           price: 19.90, category: 'Marketing', icon: '📱', popular: false, planTier: 3 },
    { id: 11, name: 'Editor de Vídeo Pro',           description: 'Editor de vídeo completo com roteiros gerados por IA',                price: 97.00, category: 'Vídeo',     icon: '🎬', popular: true,  planTier: 3 },
    { id: 12, name: 'Gerador de Ebooks Premium',     description: 'Ebooks profissionais com capítulos gerados por IA',                   price: 49.90, category: 'Conteúdo',  icon: '📚', popular: true,  planTier: 3 },
    { id: 13, name: 'Gerador de Animações',          description: 'Animações profissionais com briefings gerados por IA',                price: 67.00, category: 'Design',    icon: '🎭', popular: false, planTier: 4 },
    { id: 14, name: 'IA Video Generator 8K',         description: 'Geração de vídeos em alta qualidade com IA avançada',                 price: 79.90, category: 'Vídeo',     icon: '🎥', popular: true,  planTier: 4 },
    { id: 15, name: 'AI Funil Builder',              description: 'Funis de vendas completos gerados por IA',                            price: 89.90, category: 'Marketing', icon: '🔄', popular: true,  planTier: 4 }
  ];

  // 🔄 BUSCAR PREÇOS REAIS DO SUPABASE VIA API
  useEffect(() => {
    const fetchToolPrices = async () => {
      try {
        const res = await fetch('/api/admin/tool-pricing');
        const data = await res.json();
        if (data.success && data.tools && data.tools.length > 0) {
          setToolPricesFromApi(data.tools);
          console.log('✅ Preços das ferramentas carregados do Supabase:', data.tools.length);
        } else {
          // Seed: salvar ferramentas default no Supabase na primeira vez
          console.log('🔄 Nenhum preço no Supabase, fazendo seed das 15 ferramentas...');
          const seedTools = DEFAULT_TOOLS.map(t => ({
            tool_id: t.id.toString(),
            name: t.name,
            price: t.price,
            category: t.category,
            description: t.description,
            planTier: t.planTier,
            icon: t.icon,
            popular: t.popular,
            is_active: true
          }));
          await fetch('/api/admin/tool-pricing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tools: seedTools })
          });
          console.log('✅ Seed de preços concluído');
        }
      } catch (e) {
        console.warn('⚠️ Erro ao buscar preços das ferramentas:', e);
      }
    };
    fetchToolPrices();
  }, []);

  // 🛠️ TODAS AS 15 FERRAMENTAS - preços dinâmicos do Supabase
  const ALL_TOOLS = DEFAULT_TOOLS.map(tool => {
    if (toolPricesFromApi) {
      const apiTool = toolPricesFromApi.find(t => String(t.tool_id) === String(tool.id));
      if (apiTool) {
        return {
          ...tool,
          price: parseFloat(apiTool.price) || tool.price,
          name: apiTool.name || tool.name,
          description: apiTool.description || tool.description,
          category: apiTool.category || tool.category,
          popular: apiTool.popular !== undefined ? apiTool.popular : tool.popular
        };
      }
    }
    return tool;
  }).map(tool => ({
    ...tool,
    priceFormatted: `R$ ${tool.price.toFixed(2).replace('.', ',')}`
  }));

  const PLAN_NAMES_BY_TIER = { 1: 'Mensal', 2: 'Trimestral', 3: 'Semestral', 4: 'Anual' };

  // Separar ferramentas do plano vs avulsas
  const userTier = authUser?.type === 'admin' ? 4 : getUserPlanTier();

  const planTools = ALL_TOOLS.filter(t => t.planTier <= userTier).map(tool => ({
    ...tool,
    owned: true,
    includedInPlan: true
  }));

  const avulsaTools = ALL_TOOLS.filter(t => t.planTier > userTier).map(tool => ({
    ...tool,
    owned: userAccess.some(a => a.toolName === tool.name),
    includedInPlan: false,
    requiredPlan: PLAN_NAMES_BY_TIER[tool.planTier]
  }));

  // 📊 COMPONENTE DE ESTATÍSTICA
  const StatCard = ({ title, value, subtitle, color = 'blue', icon }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {icon && <div className="text-3xl">{icon}</div>}
      </div>
    </div>
  );

  // 🛠️ ABA FERRAMENTAS - FILTRADA POR PLANO
  const ToolsTab = () => (
    <div className="space-y-6">

      {/* ESTATÍSTICAS DO USUÁRIO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Ferramentas do Plano" 
          value={planTools.length} 
          subtitle={`de 15 total`}
          color="#4F46E5"
          icon="🛠️"
        />
        <StatCard 
          title="Ferramentas Avulsas" 
          value={avulsaTools.filter(t => t.owned).length} 
          subtitle="compradas separadamente"
          color="#10B981"
          icon="🛒"
        />
        <StatCard 
          title="Total Disponível" 
          value={planTools.length + avulsaTools.filter(t => t.owned).length}
          subtitle="ferramentas ativas"
          color="#F59E0B"
          icon="⚡"
        />
        <StatCard 
          title="Plano Atual" 
          value={user?.plano || 'Nenhum'}
          subtitle={user?.plano_ativo ? '✅ Ativo' : '❌ Inativo'}
          color="#8B5CF6"
          icon="👑"
        />
      </div>

      {/* BANNER PARA QUEM NÃO TEM PLANO */}
      {userTier === 0 && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold">Você ainda não tem um plano ativo</h3>
              <p className="text-white/80 mt-1">Assine agora para ter acesso às ferramentas de IA e turbinar seu marketing digital!</p>
            </div>
            <a href="/pricing" className="bg-white text-purple-700 font-bold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap">
              Ver Planos
            </a>
          </div>
        </div>
      )}

      {/* ===== FERRAMENTAS DO PLANO ===== */}
      {planTools.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">🛠️ Ferramentas do Plano {getUserPlanName()}</h2>
            <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
              {planTools.length} ferramenta{planTools.length !== 1 ? 's' : ''} inclusa{planTools.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planTools.map((tool) => (
              <div key={tool.id} className="bg-white rounded-lg shadow-md p-6 relative border-2 border-green-200">
                <div className="absolute -top-3 left-4 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  ✅ Incluso no Plano
                </div>
                {tool.popular && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    🔥 Popular
                  </div>
                )}
                
                <div className="flex items-center mb-4 mt-2">
                  <div className="text-3xl mr-3">{tool.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{tool.name}</h3>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">{tool.category}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 font-semibold">Incluso no plano</span>
                  <button 
                    onClick={() => handleUseTool(tool)}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                  >
                    ✨ Usar Agora
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== FERRAMENTAS AVULSAS - PROPAGANDA/COMPRA ===== */}
      {avulsaTools.length > 0 && (
        <>
          <div className="mt-8 mb-2">
            <div className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-1">🚀 Turbine Seu Marketing com Ferramentas Avulsas!</h2>
              <p className="text-white/90">
                Adicione ferramentas premium ao seu plano. Pague apenas pelo que usar — acesso imediato após confirmação do pagamento!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avulsaTools.map((tool) => (
              <div key={tool.id} className={`rounded-lg shadow-md p-6 relative border-2 ${tool.owned ? 'bg-white border-blue-200' : 'bg-gradient-to-br from-gray-50 to-orange-50 border-orange-200'}`}>
                {!tool.owned && (
                  <div className="absolute -top-3 left-4 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    🛒 Ferramenta Avulsa
                  </div>
                )}
                {tool.owned && (
                  <div className="absolute -top-3 left-4 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    ✅ Comprada
                  </div>
                )}
                {tool.popular && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    🔥 Popular
                  </div>
                )}
                
                <div className="flex items-center mb-4 mt-2">
                  <div className="text-3xl mr-3">{tool.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{tool.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">{tool.category}</span>
                      {!tool.owned && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Plano {tool.requiredPlan}+</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-orange-600">{tool.priceFormatted}</span>
                  {tool.owned ? (
                    <button 
                      onClick={() => handleUseTool(tool)}
                      className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                    >
                      ✨ Usar Agora
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePurchaseTool(tool)}
                        className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 font-semibold text-sm transition-colors"
                      >
                        💳 Cartão
                      </button>
                      <button 
                        onClick={() => handlePixPurchase(tool)}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 font-semibold text-sm transition-colors"
                      >
                        🏦 PIX
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* BANNER DE UPGRADE */}
          {userTier > 0 && userTier < 4 && (
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-6 text-white text-center mt-4">
              <h3 className="text-xl font-bold mb-2">Quer TODAS as ferramentas com desconto?</h3>
              <p className="text-white/80 mb-4">
                Faça upgrade para o Plano {PLAN_NAMES_BY_TIER[userTier + 1] || 'Anual'} e ganhe mais ferramentas inclusas no plano!
              </p>
              <a href="/pricing" className="inline-block bg-white text-purple-700 font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                Fazer Upgrade
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );

  // 🤝 ABA AFILIADOS
  const AffiliateTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🤝 Programa de Afiliados</h2>
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
          30% de Comissão
        </div>
      </div>

      {/* LINK DE AFILIADO */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-2">🎯 Seu Link de Afiliado</h3>
        <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <code className="text-sm">https://viralizaai.com/ref/{user?.affiliate_code}</code>
            <button className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100">
              📋 Copiar
            </button>
          </div>
        </div>
        <p className="text-sm opacity-90">
          Compartilhe este link e ganhe 30% de comissão sobre todas as vendas!
        </p>
      </div>

      {/* ESTATÍSTICAS DE AFILIADO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Cliques no Link" value="156" subtitle="+23 esta semana" color="#4F46E5" icon="👆" />
        <StatCard title="Conversões" value="12" subtitle="7.7% taxa" color="#10B981" icon="✅" />
        <StatCard title="Comissões Ganhas" value="R$ 890" subtitle="Este mês" color="#F59E0B" icon="💰" />
        <StatCard title="Saldo Disponível" value="R$ 340" subtitle="Para saque" color="#8B5CF6" icon="🏦" />
      </div>

      {/* HISTÓRICO DE COMISSÕES */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📈 Histórico de Comissões</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[
            { mes: 'Jan', comissoes: 120 },
            { mes: 'Fev', comissoes: 340 },
            { mes: 'Mar', comissoes: 560 },
            { mes: 'Abr', comissoes: 780 },
            { mes: 'Mai', comissoes: 890 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value) => [`R$ ${value}`, 'Comissões']} />
            <Line type="monotone" dataKey="comissoes" stroke="#4F46E5" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* BOTÃO DE SAQUE */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">💸 Solicitar Saque</h3>
            <p className="text-gray-600">Saldo disponível: R$ 340,00</p>
          </div>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
            Sacar via PIX
          </button>
        </div>
      </div>
    </div>
  );

  // 📊 ABA ESTATÍSTICAS
  const StatsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📊 Suas Estatísticas</h2>

      {/* RESUMO MENSAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Conteúdos Criados" value="89" subtitle="+12 esta semana" color="#4F46E5" icon="📝" />
        <StatCard title="Visualizações Geradas" value="45.6K" subtitle="+8.2K esta semana" color="#10B981" icon="👀" />
        <StatCard title="Engajamento Médio" value="12.4%" subtitle="+2.1% vs mês anterior" color="#F59E0B" icon="❤️" />
      </div>

      {/* GRÁFICO DE USO DAS FERRAMENTAS */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">🛠️ Uso das Ferramentas</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { ferramenta: 'Scripts IA', usos: 45 },
            { ferramenta: 'Thumbnails', usos: 32 },
            { ferramenta: 'SEO', usos: 28 },
            { ferramenta: 'Hashtags', usos: 23 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ferramenta" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="usos" fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* PERFORMANCE DO CONTEÚDO */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📈 Performance do Conteúdo</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={[
            { dia: 'Seg', views: 1200, likes: 89 },
            { dia: 'Ter', views: 1800, likes: 134 },
            { dia: 'Qua', views: 2400, likes: 178 },
            { dia: 'Qui', views: 1900, likes: 145 },
            { dia: 'Sex', views: 3200, likes: 234 },
            { dia: 'Sab', views: 2800, likes: 198 },
            { dia: 'Dom', views: 2100, likes: 156 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="views" stroke="#4F46E5" name="Visualizações" />
            <Line type="monotone" dataKey="likes" stroke="#10B981" name="Curtidas" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // 🎯 NAVEGAÇÃO
  const tabs = [
    { id: 'tools', label: '🛠️ Ferramentas', component: ToolsTab },
    { id: 'affiliate', label: '🤝 Afiliados', component: AffiliateTab },
    { id: 'stats', label: '📊 Estatísticas', component: StatsTab }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">👋 Olá, {user?.name}!</h1>
              <p className="text-sm text-gray-600">
                Plano {user?.plano} • {user?.plano_ativo ? '✅ Ativo' : '❌ Inativo'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium">Créditos</p>
                <p className="text-xl font-bold text-blue-600">{user?.credits_remaining}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tabs.find(tab => tab.id === activeTab)?.component()}
      </div>

      {/* Modal PIX */}
      {showPixModal && selectedTool && (
        <PixPaymentModalFixed
          isOpen={showPixModal}
          onClose={() => {
            setShowPixModal(false);
            setSelectedTool(null);
          }}
          planName={selectedTool.name}
          amount={selectedTool.price}
          onPaymentSuccess={() => {
            // Confirmar pagamento PIX e liberar acesso
            const payments = AccessControlService.getAllPayments();
            const pendingPayment = payments.find(p => 
              p.itemName === selectedTool.name && 
              p.paymentMethod === 'pix' && 
              p.status === 'pending'
            );
            
            if (pendingPayment) {
              AccessControlService.confirmPayment(pendingPayment.id, `pix_${Date.now()}`);
              console.log('✅ Pagamento PIX confirmado e acesso liberado!');
              
              // Recarregar acessos do usuário
              const newAccess = AccessControlService.getUserToolAccess(authUser?.id, authUser?.type);
              setUserAccess(newAccess);
            }
            
            setShowPixModal(false);
            setSelectedTool(null);
            alert('✅ Pagamento PIX confirmado! Ferramenta ativada com sucesso.');
            
            // Recarregar página para atualizar interface
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default UserDashboard;
