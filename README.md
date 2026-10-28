# Atlas Training — PWA pessoal

Aplicativo web instalável para controlar treinos, frequência, pesos, medidas e duração das sessões.

## Segurança e privacidade
- Repositório **público**: somente código-fonte estático.
- Não há cadastro, servidor pessoal ou transmissão dos registros do usuário.
- Os registros ficam no **localStorage** do navegador, não criptografados. Não use em dispositivos compartilhados e não confunda isso com armazenamento de nível médico ou backup em nuvem.
- O botão **Exportar backup** gera um arquivo JSON com dados pessoais; guarde-o em local privado.
- Apagar dados do Safari, usar navegação privada ou trocar de aparelho pode eliminar os registros. Faça backups frequentes.
- Integração Spotify **não configurada**: nenhum token, senha, client secret ou credencial está incluído no projeto.
- O código público não torna os registros privados automaticamente acessíveis, mas o armazenamento local depende da segurança do aparelho e da origem do site.
- Evite adicionar scripts de terceiros, anúncios e ferramentas de analytics. Revise alterações antes de mesclar.
- Não insira credenciais do GitHub, Spotify ou outras APIs no repositório.

## Publicação no GitHub Pages
No repositório, abra **Settings → Pages → Build and deployment → Deploy from a branch**, selecione **main** e **/(root)**, clique **Save**.

O endereço esperado, **após a publicação ser habilitada**, é:
https://pedrohenriqueborgeeesps4-ux.github.io/Atlas-training-/

No iPhone, abra o endereço no Safari, toque em **Compartilhar → Adicionar à Tela de Início**.

## Limites da primeira versão
- Registros locais apenas; backup por exportação/importação manual.
- Sem fotos de evolução nesta versão.
- Sem controles integrados do Spotify até implementar OAuth PKCE.
- Cronômetro de treino persiste enquanto o navegador mantiver o armazenamento; os temporizadores de descanso são temporários.
- A ficha de exercícios é uma proposta inicial e deve ser revisada conforme a evolução do usuário.

## Arquivos
- index.html: interface
- app.js: lógica de treino, dados e backup
- manifest.webmanifest: configuração PWA
- sw.js: cache dos recursos estáticos para uso offline
- icon.svg: ícone
