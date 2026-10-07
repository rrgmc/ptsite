// The screens before login: "Entrar", "Esqueci minha senha" and "Nova senha".
export const auth = {
  logIn: 'Entrar',
  username: 'Usuário',
  password: 'Senha',
  stayLoggedIn: 'Manter conectado por 30 dias',
  forgotPassword: 'Esqueci minha senha',

  // Esqueci minha senha
  forgot: {
    sent: 'Enviamos um link para {email}. Ele vale por 60 minutos. Confira também a caixa de spam.',
    intro: 'Informe o seu usuário ou o seu e-mail. Enviamos um link para você escolher uma nova senha.',
    loginLabel: 'Usuário ou e-mail',
    sendLink: 'Enviar link',
    backToLogin: 'Voltar para o login',
  },

  // Nova senha
  reset: {
    title: 'Nova senha',
    done: 'Senha alterada. Entre com a nova senha.',
    invalidLink: 'Este link não é válido. Peça um novo link.',
    requestNewLink: 'Pedir um novo link',
    choose: 'Escolha uma nova senha para o usuário {username}.',
    save: 'Salvar nova senha',
  },
}
