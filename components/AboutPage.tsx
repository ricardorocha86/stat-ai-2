import React from 'react';
import { GraduationCapIcon, SparklesIcon, CheckCircleIcon, OwlIcon, TrophyIcon } from './Icons';

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
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-[--text-primary] tracking-tight">Sobre o Aplicativo</h1>
        <p className="mt-2 text-lg text-[--text-secondary]">
            O Stat-AI reúne o material do curso, exercícios com correção e um tutor de IA para apoiar seu estudo de estatística.
        </p>

        <div className="mt-10">
            <h2 className="text-2xl font-bold text-[--text-primary] flex items-center gap-2 mb-6">
                <GraduationCapIcon className="w-7 h-7 text-[--accent]" />
                Como estudar no portal
            </h2>
             <div className="grid md:grid-cols-2 gap-6">
                <FeatureCard icon={<CheckCircleIcon className="w-6 h-6" />} title="Verificação com IA">
                    Digite suas respostas para os exercícios e receba um retorno imediato. O sistema avalia se sua resposta está correta, incorreta ou parcial e explica o que revisar, sem entregar a resposta.
                </FeatureCard>
                 <FeatureCard icon={<SparklesIcon className="w-6 h-6" />} title="Ajuda em Etapas">
                    Travou em um exercício? Abra a ajuda aos poucos: primeiro uma dica, depois como começar e, só se precisar, a resolução completa e a resposta final.
                </FeatureCard>
                 <FeatureCard icon={<OwlIcon className="w-6 h-6" />} title="Tutor de Dúvidas">
                    Converse com o tutor pelo botão da coruja. Ele responde com base nas aulas do curso, e você escolhe a personalidade dele no seu perfil: padrão, rabugento ou amiguinho.
                </FeatureCard>
                 <FeatureCard icon={<SparklesIcon className="w-6 h-6" />} title="Material Interativo">
                    Gere uma versão da aula com exemplos da área que você preferir, no nível de linguagem e tamanho que escolher, e tire dúvidas sobre esse material.
                </FeatureCard>
                 <FeatureCard icon={<TrophyIcon className="w-6 h-6" />} title="Conquistas">
                    A cada 10 exercícios verificados você alcança um novo marco no curso. Os prêmios desses marcos estão sendo renovados e voltam em breve.
                </FeatureCard>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
