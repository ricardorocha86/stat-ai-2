import React from 'react';
import { BriefcaseIcon, GraduationCapIcon, SparklesIcon, DownloadIcon, CheckCircleIcon } from './Icons';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-[--bg-card] p-6 rounded-lg border border-[--border-color] shadow-sm">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center bg-[--accent]/10 text-[--accent] rounded-lg">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-[--text-primary]">{title}</h3>
        </div>
        <p className="text-sm text-[--text-secondary] leading-relaxed">
            {children}
        </p>
    </div>
);


const AboutPage: React.FC = () => {
  return (
    <div className="flex-1 p-6 lg:p-8 bg-[--bg-main] overflow-y-auto h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-[--text-primary] tracking-tight">Sobre o Aplicativo</h1>
        <p className="mt-2 text-lg text-[--text-secondary]">
            Este é um assistente de IA projetado para otimizar o ensino e o aprendizado da estatística.
        </p>

        <div className="mt-10">
            <h2 className="text-2xl font-bold text-[--text-primary] flex items-center gap-2 mb-6">
                <BriefcaseIcon className="w-7 h-7 text-[--accent]" />
                Modo Professor
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
                <FeatureCard icon={<SparklesIcon className="w-6 h-6" />} title="Geração Inteligente">
                    Use o painel de chat para gerar exercícios de estatística sobre qualquer tópico do curso. Peça variações de dificuldade, tipo ou formato, e a IA criará conteúdo original e relevante em segundos.
                </FeatureCard>
                 <FeatureCard icon={<DownloadIcon className="w-6 h-6" />} title="Exportação para PDF">
                    Exporte listas de exercícios para PDFs com aparência profissional. Você pode customizar a exportação para incluir apenas a aula atual, a unidade inteira ou o curso completo, com diferentes níveis de detalhe no gabarito.
                </FeatureCard>
            </div>
        </div>

        <div className="mt-12">
            <h2 className="text-2xl font-bold text-[--text-primary] flex items-center gap-2 mb-6">
                <GraduationCapIcon className="w-7 h-7 text-[--accent]" />
                Modo Aluno
            </h2>
             <div className="grid md:grid-cols-2 gap-6">
                <FeatureCard icon={<CheckCircleIcon className="w-6 h-6" />} title="Verificação com IA">
                    Digite suas respostas para os exercícios e receba feedback instantâneo de uma IA. O sistema avalia se sua resposta está correta, incorreta ou parcial e fornece dicas construtivas para te guiar.
                </FeatureCard>
                 <FeatureCard icon={<SparklesIcon className="w-6 h-6" />} title="Gabarito em Etapas">
                    Não fique preso! Em vez de ver a resposta completa de uma vez, você pode solicitar ajuda gradualmente: comece com uma dica, peça um guia inicial e, só se necessário, veja a solução completa.
                </FeatureCard>
                 <FeatureCard icon={<SparklesIcon className="w-6 h-6" />} title="Assistente de Dúvidas">
                    Converse com o "Oráculo Estatístico", um chatbot especialista e mal-humorado que responde a qualquer dúvida sobre a matéria. Suas explicações são sempre precisas, criativas e direto ao ponto.
                </FeatureCard>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;