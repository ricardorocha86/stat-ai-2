
import React, { useState, useRef } from 'react';
import { UserProfile, ChatbotStyle } from '../types';
import { UserIcon, CameraIcon, CheckIcon, SaveIcon } from './Icons';

interface ProfilePageProps {
    userProfile: UserProfile;
    onUpdateProfile: (updatedProfile: UserProfile, photoFile?: File) => Promise<void>;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ userProfile, onUpdateProfile }) => {
    const [name, setName] = useState(userProfile.name);
    const [chatbotStyle, setChatbotStyle] = useState<ChatbotStyle>(userProfile.chatbotStyle || 'Padrão');
    const [photoUrl, setPhotoUrl] = useState(() => {
        if (!userProfile.photoBase64) return '';
        if (userProfile.photoBase64.startsWith('http') || userProfile.photoBase64.startsWith('data:')) return userProfile.photoBase64;
        return `data:${userProfile.photoMimeType || 'image/png'};base64,${userProfile.photoBase64}`;
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [photoFile, setPhotoFile] = useState<File | undefined>();
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

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        try {
            const updatedProfile: UserProfile = {
                ...userProfile,
                name,
                chatbotStyle,
                // A new photo is uploaded as a file; otherwise keep the stored one, never the local preview.
                photoBase64: photoFile ? undefined : userProfile.photoBase64
            };
            await onUpdateProfile(updatedProfile, photoFile);
            setPhotoFile(undefined);
            setSaveStatus({ type: 'success', message: 'Perfil atualizado.' });
        } catch (error) {
            console.error("Error saving profile:", error);
            setSaveStatus({ type: 'error', message: 'Não foi possível salvar o perfil. Tente novamente.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-10 text-center sm:text-left">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Meu Perfil</h1>
                <p className="text-slate-500">Gerencie sua identidade e preferências no portal.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Pic Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center">
                        <div className="relative group mb-6">
                            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-blue-50 shadow-lg bg-slate-50 flex items-center justify-center">
                                {photoUrl ? (
                                    <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-20 h-20 text-slate-300" />
                                )}
                            </div>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-transform active:scale-95"
                            >
                                <CameraIcon className="w-5 h-5" />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handlePhotoChange} 
                            />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 text-center mb-1">{name}</h2>
                        <p className="text-sm text-slate-500 mb-4">{userProfile.email}</p>
                        
                        <div className="w-full pt-6 mt-6 border-t border-slate-100">
                             <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">TIPO DE USUÁRIO</div>
                             <div className="flex items-center gap-2 text-slate-700">
                                 <span className="capitalize font-medium">{userProfile.userType}</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Settings Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Dados Pessoais</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Como devemos te chamar?</label>
                                <input 
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900"
                                    placeholder="Seu nome"
                                />
                            </div>
                            
                            {userProfile.userType === 'nutrição' && (
                                <div className="space-y-2 opacity-60">
                                    <label className="text-sm font-semibold text-slate-700 ml-1">Número de Matrícula</label>
                                    <input 
                                        type="text"
                                        value={userProfile.registrationNumber || ''}
                                        disabled
                                        className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl text-slate-700 cursor-not-allowed"
                                    />
                                    <p className="text-[10px] text-slate-500 ml-1">A matrícula não pode ser alterada manualmente.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Preferências da IA</h3>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Personalidade do Oráculo</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {(['Padrão', 'Xarope', 'Amiguinho'] as ChatbotStyle[]).map((style) => (
                                    <button 
                                        key={style}
                                        onClick={() => setChatbotStyle(style)}
                                        className={`p-4 rounded-2xl border-2 transition-all text-left ${chatbotStyle === style ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
                                    >
                                        <div className="font-bold text-slate-900">{style}</div>
                                        <div className="text-[10px] text-slate-500 mt-1">
                                            {style === 'Padrão' && 'Equilibrado e didático.'}
                                            {style === 'Xarope' && 'Rabugento e minimalista.'}
                                            {style === 'Amiguinho' && 'Entusiasmado e amigável.'}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-4">
                        {saveStatus && (
                            <p role="status" className={`text-sm font-medium ${saveStatus.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                                {saveStatus.message}
                            </p>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-2xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <SaveIcon className="w-5 h-5" />
                            )}
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
