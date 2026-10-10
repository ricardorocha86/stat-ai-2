
import React, { useState, useRef, useEffect } from 'react';
import { UserIcon, CameraIcon, CheckIcon, GraduationCapIcon, BriefcaseIcon, StatAiIcon } from './Icons';
import { UserProfile, UserType, USER_TYPE_LABELS } from '../types';

const USER_TYPE_OPTIONS: { type: UserType; description: string; Icon: React.FC<{ className?: string }> }[] = [
    { type: 'nutrição', description: 'Curso de Nutrição', Icon: GraduationCapIcon },
    { type: 'secretariado', description: 'Curso de Secretariado', Icon: BriefcaseIcon },
    { type: 'convidado', description: 'Conhecer a plataforma', Icon: UserIcon },
];

interface OnboardingModalProps {
    initialProfile: UserProfile;
    onComplete: (updatedProfile: UserProfile, photoFile?: File) => Promise<void>;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ initialProfile, onComplete }) => {
    const [name, setName] = useState(initialProfile.name);
    const [userType, setUserType] = useState<UserType | null>(null);
    // Students of both courses give their registration number; visitants say where they came from.
    const isStudent = userType === 'nutrição' || userType === 'secretariado';
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [origin, setOrigin] = useState('');
    const [photoUrl, setPhotoUrl] = useState(initialProfile.photoBase64 || '');
    const [photoFile, setPhotoFile] = useState<File | undefined>();
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const isStep1Valid = name.trim().length >= 2;
    const isStep2Valid = userType !== null;
    const isStep3Valid = (isStudent && registrationNumber.trim().length > 0) ||
                         (userType === 'convidado' && origin.trim().length > 0);

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (!userType || !isStep3Valid) return;

        setIsSaving(true);
        setSaveError(null);
        try {
            // OTIMIZAÇÃO: Se temos o arquivo da foto, não enviamos o base64 (que é pesado) 
            // no objeto do perfil inicial para evitar travar a memória.
            const updatedProfile: UserProfile = {
                ...initialProfile,
                name,
                userType,
                registrationNumber: isStudent ? registrationNumber : undefined,
                origin: userType === 'convidado' ? origin : undefined,
                isOnboarded: true,
                photoBase64: photoFile ? undefined : photoUrl // Limpa se for subir arquivo
            };

            await onComplete(updatedProfile, photoFile);
        } catch (error) {
            console.error("OnboardingModal: Erro ao salvar cadastro:", error);
            setSaveError("Não foi possível salvar seu cadastro. Confira sua conexão e tente novamente.");
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
                
                {/* Header/Progress */}
                <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 flex flex-col justify-end">
                    <div className="absolute top-4 right-8 opacity-20 transform scale-150 rotate-12">
                         <StatAiIcon className="w-16 h-16 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Configure seu Perfil</h2>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${step >= i ? 'bg-white' : 'bg-white/30'}`} />
                        ))}
                    </div>
                </div>

                <div className="p-8">
                    {/* Step 1: Identity & Photo */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-2xl bg-slate-100 flex items-center justify-center">
                                        {photoUrl ? (
                                            <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-24 h-24 text-slate-300" />
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-transform active:scale-90 z-10"
                                    >
                                        <CameraIcon className="w-8 h-8" />
                                    </button>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handlePhotoChange} 
                                />
                                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl max-w-[320px]">
                                    <p className="text-sm text-yellow-600 font-medium text-center">
                                        ⚠️ A foto do Google costuma ter baixa resolução. Se quiser, troque por uma foto melhor agora.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Como devemos te chamar?</label>
                                <input 
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                    placeholder="Seu nome completo"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Role Selection */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h3 className="text-center font-medium text-slate-600 mb-2">Qual o seu perfil de acesso?</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {USER_TYPE_OPTIONS.map(({ type, description, Icon }) => (
                                    <button
                                        key={type}
                                        onClick={() => setUserType(type)}
                                        className={`relative p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${userType === type ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
                                    >
                                        {userType === type && <CheckIcon className="absolute top-3 right-3 w-5 h-5 text-blue-600" />}
                                        <div className={`p-4 rounded-xl ${userType === type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-slate-900">{USER_TYPE_LABELS[type]}</div>
                                            <div className="text-xs text-slate-500">{description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Specific Info */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                             {isStudent ? (
                                <div className="space-y-4">
                                     <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl text-blue-700 text-sm">
                                        <div className="flex-shrink-0 bg-blue-600 text-white p-1 rounded-md">
                                            <GraduationCapIcon className="w-4 h-4" />
                                        </div>
                                        <p>Precisamos da sua matrícula para validar seu progresso nas turmas oficiais.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">Número de Matrícula</label>
                                        <input 
                                            type="text"
                                            value={registrationNumber}
                                            onChange={(e) => setRegistrationNumber(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                            placeholder="Ex. 21321232"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                             ) : (
                                <div className="space-y-4">
                                     <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl text-blue-700 text-sm">
                                        <div className="flex-shrink-0 bg-blue-600 text-white p-1 rounded-md">
                                            <UserIcon className="w-4 h-4" />
                                        </div>
                                        <p>É um prazer ter você aqui! Gostaríamos de saber um pouco mais sobre você.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">De onde você veio?</label>
                                        <input 
                                            type="text"
                                            value={origin}
                                            onChange={(e) => setOrigin(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                            placeholder="Ex: LinkedIn, Indicação, etc."
                                            autoFocus
                                        />
                                    </div>
                                </div>
                             )}
                        </div>
                    )}

                    {step === 3 && (
                        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            🧪 <strong>Os recursos de IA estão em fase de testes:</strong> o tutor, a correção de respostas e o material interativo ainda estão sendo ajustados. Feedbacks são muito bem-vindos!
                        </p>
                    )}

                    {saveError && (
                        <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                            {saveError}
                        </p>
                    )}

                    {/* Footer Buttons */}
                    <div className="mt-10 flex gap-4">
                        {step > 1 && (
                            <button 
                                onClick={handleBack}
                                disabled={isSaving}
                                className="flex-1 py-4 px-6 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50"
                            >
                                Voltar
                            </button>
                        )}
                        {step < 3 ? (
                            <button 
                                onClick={handleNext}
                                disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                                className="flex-[2] py-4 px-6 rounded-2xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:grayscale disabled:translate-y-0"
                            >
                                Continuar
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmit}
                                disabled={!isStep3Valid || isSaving}
                                className="flex-[2] py-4 px-6 rounded-2xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale disabled:translate-y-0"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Salvando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckIcon className="w-5 h-5" />
                                        <span>Finalizar Cadastro</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
