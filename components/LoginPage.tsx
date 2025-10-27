import React from 'react';
import { GoogleIcon, StatAiIcon } from './Icons';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return (
    <div className="w-screen h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="w-full max-w-4xl mx-auto flex bg-white shadow-2xl rounded-2xl overflow-hidden">
        {/* Coluna da Esquerda - Branding */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-gradient-to-b from-slate-900 to-slate-800 p-12 text-white">
          <StatAiIcon className="w-16 h-16 text-blue-400" />
          <h1 className="mt-6 text-3xl font-bold text-center">
            Stat-AI 2.0
          </h1>
          <p className="mt-2 text-center text-slate-300">
            O futuro da educação em estatística, potencializado por Inteligência Artificial.
          </p>
        </div>
        
        {/* Coluna da Direita - Login */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center md:hidden mb-8">
            <StatAiIcon className="w-10 h-10 text-blue-500 mx-auto" />
            <h1 className="mt-4 text-2xl font-bold text-slate-800">Stat-AI 2.0</h1>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 text-center">Acesse sua conta</h2>
          <p className="mt-2 text-slate-600 text-center">
            Bem-vindo de volta! Entre para continuar sua jornada de aprendizado.
          </p>
          <div className="mt-8">
            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-3 bg-slate-800 text-white font-semibold py-3 px-4 rounded-lg hover:bg-slate-900 transition-all duration-300 shadow-md transform hover:-translate-y-0.5"
            >
              <GoogleIcon className="w-6 h-6" />
              Entrar com Google
            </button>
          </div>
          <p className="mt-8 text-xs text-slate-500 text-center">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;