# xTra Player — Playlists (site)

Site estático (sem servidor) para adicionar/remover playlists do app **xTra Player** usando o
**endereço MAC do aparelho** como chave. O que você fizer aqui aparece no app (aba **Playlists**,
botão "Sincronizar agora"), e o que você adicionar/remover no app aparece aqui.

Como é 100% estático, ele usa o **Firebase Realtime Database** (gratuito) como "banco de dados" —
tanto o site quanto o app falam direto com ele por HTTP simples, sem nenhum SDK.

## 1) Crie o banco de dados (grátis, ~5 minutos)

1. Acesse https://console.firebase.google.com e crie um projeto (pode ser gratuito, plano Spark).
2. No menu lateral, vá em **Build > Realtime Database** e clique em **Criar banco de dados**.
   Escolha qualquer região. Nesta etapa, pode iniciar em "modo de teste" — vamos ajustar a regra certa a seguir.
3. Copie a **URL do banco de dados**, mostrada no topo da página (algo como
   `https://SEU-PROJETO-default-rtdb.firebaseio.com` — pode variar um pouco conforme a região).
4. Clique na aba **Regras** e substitua pelo conteúdo abaixo, depois **Publicar**:

```json
{
  "rules": {
    "playlists": {
      "$mac": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

> ⚠️ **Sobre segurança:** essas regras deixam qualquer pessoa que souber um endereço MAC ler/editar
> as playlists daquele MAC — não existe login nem senha, só o próprio MAC funcionando como uma
> espécie de "código de acesso" (é o mesmo esquema usado por ativação "por MAC" nos sistemas tipo
> MAG/Stalker). Isso é adequado para uso pessoal/familiar, mas não compartilhe o MAC em público.

## 2) Configure a URL nos dois lados

Cole a URL do banco (sem barra no final) em **dois lugares**, exatamente igual:

- Neste site: arquivo `app.js`, constante `DB_URL` no topo do arquivo.
- No app Android: arquivo `app/src/main/java/com/xtrasolucoes/xtraplayer/Data.kt`, constante
  `CLOUD_DB_URL` perto do topo do arquivo. Depois disso, gere o APK de novo (Actions > Build APK,
  ou `gradle :app:assembleRelease`).

## 3) Publique o site no GitHub Pages

1. Suba esta pasta (`index.html`, `style.css`, `app.js`) para um repositório no GitHub — pode ser
   o mesmo repositório do app, em uma subpasta, ou um repositório novo só para o site.
2. No repositório, vá em **Settings > Pages**.
3. Em "Source", escolha **Deploy from a branch**, selecione a branch (ex.: `main`) e a pasta onde
   estão os arquivos (`/ (root)` se a pasta for a raiz do repositório, ou `/docs` se você a renomeou
   para `docs`).
4. Salve. Em alguns minutos o GitHub mostra o link do site (algo como
   `https://seu-usuario.github.io/seu-repositorio/`).

## Como usar

1. No aparelho, abra o app > aba **Playlists** e copie o endereço MAC mostrado lá.
2. No site, cole o MAC e toque em **Buscar**.
3. Adicione ou remova playlists por ali.
4. No app, toque em **Sincronizar agora** (ou apenas reabra a aba Playlists) para trazer as
   mudanças para o aparelho.

## Por que "endereço MAC" e não o MAC real do Wi-Fi?

Desde o Android 6 nenhum app consegue mais ler o MAC real da placa de Wi-Fi (por privacidade), e
desde o Android 10 isso vale até para apps com permissões especiais. Por isso o app **gera** um
endereço só dele (no mesmo formato `AA:BB:CC:DD:EE:FF`), uma vez só, na primeira abertura, e usa
esse endereço como identidade — exatamente como fazem os sistemas de ativação "por MAC" mais comuns
em players de IPTV.

## Estrutura dos dados no Firebase

```
playlists/
  AA:BB:CC:DD:EE:FF/        <- um nó por aparelho (MAC)
    items/
      -NxAbC123/            <- chave gerada automaticamente por playlist
        name: "Minha lista"
        type: "m3u" | "xtream"
        server: "http://..."
        user: ""             <- só preenchido quando type = "xtream"
        pass: ""
```
# uploader-playlists-for-xtra
# uploader-playlists-for-xtra
