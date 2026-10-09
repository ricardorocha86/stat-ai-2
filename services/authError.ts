export const getGoogleLoginError = (error: unknown): string => {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code) : '';

  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Este endereço não está autorizado para login. No acesso local, use localhost.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela de login. Permita pop-ups para este site e tente novamente.';
    case 'auth/popup-closed-by-user':
      return 'A janela de login foi fechada antes de concluir. Clique em Entrar com Google para tentar novamente.';
    case 'auth/cancelled-popup-request':
      return 'Outra tentativa de login foi iniciada. Aguarde a janela do Google ou tente novamente.';
    case 'auth/network-request-failed':
      return 'Não foi possível conectar ao Google. Confira sua conexão e tente novamente.';
    case 'auth/operation-not-allowed':
      return 'O login com Google ainda não está habilitado na plataforma.';
    default:
      return 'Não foi possível entrar com Google. Tente novamente.';
  }
};
