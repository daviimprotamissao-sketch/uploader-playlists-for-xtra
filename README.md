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

## Importante: Android ainda não migrado
O aplicativo Android atual ainda usa `playlists/{mac}/items`. Esta branch prepara o site e o esquema autenticado, mas a sincronização Android ainda precisa ser atualizada para `users/{uid}/playlists/items` antes de aplicar as regras no banco. Não publique as novas regras antes dessa migração, pois o app antigo perderia o acesso às playlists.

## Credenciais Xtream
As credenciais ficam protegidas pelas regras de UID, mas qualquer cliente autenticado pode ler as próprias credenciais. Use senhas exclusivas e não compartilhe capturas ou logs com essas informações.
