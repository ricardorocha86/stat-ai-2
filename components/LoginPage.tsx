
import React, { useState } from 'react';
import { GoogleIcon, StatAiIcon } from './Icons';
import CoverShowcase from './CoverShowcase';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../services/firebaseConfig";
import { getGoogleLoginError } from "../services/authError";

// App's onAuthStateChanged listener takes over after a successful sign-in.
const LoginPage: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
      if (isLoggingIn) return;
      setIsLoggingIn(true);
      setLoginError(null);
      const provider = new GoogleAuthProvider();
      try {
          await signInWithPopup(auth, provider);
      } catch (error) {
          console.error("Erro no login com Google:", error);
          setLoginError(getGoogleLoginError(error));
      } finally {
          setIsLoggingIn(false);
      }
  };

  return (
    <div className="w-screen h-screen flex flex-col lg:flex-row overflow-hidden font-sans bg-slate-50">
      
      {/* LADO ESQUERDO (Topo no mobile): Área da Imagem */}
      <div className="relative w-full lg:w-[65%] h-[40%] lg:h-full flex items-center justify-center p-4 lg:p-16 bg-slate-100 flex-shrink-0">

        <CoverShowcase
          frameClassName="h-full max-h-[90%] w-full max-w-[90%] lg:max-h-[75vh]"
          controlsClassName="absolute bottom-4 left-1/2 -translate-x-1/2 lg:bottom-8"
        />

        {/* Logo discreto no topo - Escondido em telas pequenas para economizar espaço */}
        <div className="absolute top-4 left-4 lg:top-8 lg:left-8 hidden lg:block">
             <div className="flex items-center gap-2">
                <div className="bg-white p-1.5 rounded-lg shadow-sm">
                    <StatAiIcon className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-slate-700 font-bold tracking-tight text-lg">Stat-AI</span>
             </div>
        </div>
      </div>

      {/* LADO DIREITO (Baixo no mobile): Login */}
      <div className="w-full lg:w-[35%] h-[60%] lg:h-full flex flex-col justify-center px-8 sm:px-14 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 shadow-2xl z-10 overflow-y-auto">
        <div className="max-w-sm w-full mx-auto py-8 lg:py-0">
            <div className="mb-6 lg:mb-10 text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-blue-600 text-white mb-4 lg:mb-6 lg:hidden shadow-lg shadow-blue-200">
                    <StatAiIcon className="w-6 h-6 lg:w-8 lg:h-8" />
                </div>
                <h1 className="text-2xl lg:text-4xl font-extrabold text-slate-900 mb-2 lg:mb-3 tracking-tight">Bem-vindo</h1>
                <p className="text-slate-500 text-sm lg:text-lg">Faça login para acessar o portal do aluno.</p>
            </div>

            {/* Botão de Login */}
            <button
                disabled={isLoggingIn}
                onClick={handleGoogleLogin}
                className={`w-full flex items-center justify-center gap-4 bg-blue-600 text-white font-bold py-3 lg:py-4 px-6 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-blue-500/40 transform hover:-translate-y-0.5 group text-sm lg:text-base ${isLoggingIn ? 'opacity-70 cursor-wait' : ''}`}
            >
                <div className="bg-white p-1 rounded-full">
                    {isLoggingIn ? (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                    ) : (
                        <GoogleIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                    )}
                </div>
                <span>{isLoggingIn ? 'Autenticando...' : 'Entrar com Google'}</span>
            </button>
            
            {loginError && (
              <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {loginError}
              </p>
            )}

            <div className="mt-8 lg:mt-10 pt-6 lg:pt-8 border-t border-slate-100 text-center">
                <p className="text-[10px] lg:text-xs text-slate-400 font-semibold tracking-wide uppercase">Stat-AI V2.0 - Portal de Estatística</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
