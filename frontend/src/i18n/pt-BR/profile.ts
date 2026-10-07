// "Meu perfil": a player's own details, photo and password.
export const profile = {
  title: 'Meu perfil',
  username: ({ username }: { username: string }) => `Usuário: ${username}`,
  myData: 'Meus dados',
  myPhoto: 'Minha foto',
  myPassword: 'Minha senha',
  /** An account with no player, such as an admin who does not play. */
  noPlayer: 'Este acesso não está ligado a um jogador, então só tem a senha.',

  // Password form
  currentPassword: 'Senha atual',
  changePassword: 'Alterar senha',
  passwordChanged: 'Senha alterada.',

  // Details form
  nicknameHelp: 'O nome que aparece na classificação e nos resultados.',
  fullName: 'Nome completo',
  email: 'E-mail',
  emailHelp: 'Só você e os administradores veem.',
  birthDate: 'Data de nascimento',
  birthDateHelp: 'Só você e os administradores veem.',
  saved: 'Dados salvos.',
}
