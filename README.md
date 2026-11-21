# xTra Player — conta e playlists

Site estático hospedado no GitHub Pages. Usa Firebase Authentication (e-mail/senha) e Realtime Database.

## O que foi implementado nesta branch
- Cadastro de membros com e-mail e senha.
- Login e logout.
- Playlists vinculadas ao UID autenticado, não ao MAC.
- Painel administrativo para visualizar e gerenciar playlists de todas as contas marcadas como administradoras no banco.
- O cadastro público nunca concede privilégios administrativos.

## Configuração Firebase
Projeto: `xtrasoluctions`

Realtime Database: `https://xtrasoluctions-default-rtdb.europe-west1.firebasedatabase.app`

1. Em Firebase Console → Authentication → Sign-in method, habilite **E-mail/senha**.
2. Em Realtime Database → Rules, publique o conteúdo de `database.rules.json`.
3. Cadastre sua conta pelo site.
4. Em Authentication → Users, copie o UID da sua conta.
5. Em Realtime Database → Data, crie `admins/SEU_UID` com valor booleano `true`.
6. Saia e entre novamente no site. Seu painel mostrará ADMINISTRADOR.

O nó `admins` não pode ser gravado por clientes. Só o console ou um ambiente administrativo confiável deve conceder esse privilégio.

## Estrutura
```
admins/UID_DO_ADMIN: true
users/UID/
  profile/{name,email,createdAt}
  playlists/items/ID/{name,type,server,user,pass,createdAt}
```

Cada membro lê e escreve apenas no próprio nó. Administradores podem ler e gerenciar os nós de todos os usuários.

## Estado da integração Android
A atualização Android está sendo preparada na branch `feat/firebase-auth-accounts` do repositório `succotash`, com login Firebase e sincronização por `users/{uid}/playlists/items`. Aguarde a aprovação dos dois pull requests, a confirmação do build e a migração controlada dos registros antigos por MAC antes de publicar as regras definitivas. Não publique as novas regras enquanto o app antigo ainda estiver em uso, pois ele perderá acesso ao caminho legado.

## Credenciais Xtream
As credenciais ficam protegidas pelas regras de UID, mas qualquer cliente autenticado pode ler as próprias credenciais. Use senhas exclusivas e não compartilhe capturas ou logs com essas informações.


## Ferramentas administrativas do site
- Busca de membros por nome, e-mail ou UID.
- Alteração do nome exibido do membro.
- Edição e remoção de playlists de qualquer membro.
- Exclusão do nó de dados do membro (`users/UID`), após duas confirmações.

**Limite importante:** o painel web é um cliente Firebase sem Firebase Admin SDK. Por segurança, ele não consegue excluir, bloquear ou redefinir a senha da identidade em Authentication. Apagar `users/UID` remove perfil e playlists do Realtime Database, mas a pessoa ainda poderá entrar e criar dados novamente. A exclusão/desativação real da conta exige backend confiável com Firebase Admin SDK (por exemplo, Cloud Functions/servidor protegido), nunca uma chave administrativa no navegador.
