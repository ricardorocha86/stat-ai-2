import React from 'react';
import { RewardId } from '../types';

// Flat drawings of the prizes. As a silhouette every shape is painted with one dark ink and the
// texts are left out, so the page holds only the outline. The KitKat hides behind a console outline.
const INK = '#0b1020';

type Paint = (color: string) => string;

const Xarope: React.FC<{ paint: Paint; silhouette: boolean }> = ({ paint }) => (
  <>
    <path d="M38 200 C40 158 66 140 100 140 C134 140 160 158 162 200 Z" fill={paint('#334155')} />
    <path d="M86 140 L100 162 L114 140 Z" fill={paint('#f8fafc')} />
    <rect x="89" y="116" width="22" height="28" rx="6" fill={paint('#d6a06a')} />
    <ellipse cx="64" cy="92" rx="7" ry="10" fill={paint('#d6a06a')} />
    <ellipse cx="136" cy="92" rx="7" ry="10" fill={paint('#d6a06a')} />
    <ellipse cx="100" cy="88" rx="36" ry="40" fill={paint('#e8b583')} />
    <path d="M63 84 C58 52 80 40 100 40 C122 40 144 50 137 84 C132 68 118 60 100 61 C84 61 70 68 63 84 Z" fill={paint('#3b2416')} />
    <g stroke={paint('#3b2416')} strokeWidth="5" strokeLinecap="round">
      <path d="M72 73 L94 81" />
      <path d="M128 73 L106 81" />
    </g>
    <g fill="none" stroke={paint('#1e293b')} strokeWidth="3.5">
      <rect x="72" y="84" width="24" height="16" rx="5" />
      <rect x="104" y="84" width="24" height="16" rx="5" />
      <path d="M96 91 L104 91" />
    </g>
    <circle cx="85" cy="93" r="2.8" fill={paint('#1e293b')} />
    <circle cx="115" cy="93" r="2.8" fill={paint('#1e293b')} />
    <path d="M86 115 Q100 105 114 115" fill="none" stroke={paint('#7c2d12')} strokeWidth="4" strokeLinecap="round" />
    {/* Anger mark */}
    <g fill="none" stroke={paint('#ef4444')} strokeWidth="4" strokeLinecap="round">
      <path d="M146 38 Q150 46 158 46" />
      <path d="M170 40 Q162 44 162 52" />
      <path d="M168 64 Q164 56 156 56" />
      <path d="M144 62 Q152 58 152 50" />
    </g>
    {/* Coffee mug */}
    <path d="M125 150 H159 V184 A6 6 0 0 1 153 190 H131 A6 6 0 0 1 125 184 Z" fill={paint('#f8fafc')} />
    <path d="M159 158 H165 A8 8 0 0 1 165 174 H159" fill="none" stroke={paint('#f8fafc')} strokeWidth="5" />
    <ellipse cx="142" cy="151" rx="16" ry="3" fill={paint('#5b3a1e')} />
    <g fill="none" stroke={paint('#94a3b8')} strokeWidth="3" strokeLinecap="round">
      <path d="M136 141 Q131 134 136 127 Q141 120 136 113" />
      <path d="M148 141 Q143 134 148 127 Q153 120 148 113" />
    </g>
  </>
);

const Foto: React.FC<{ paint: Paint; silhouette: boolean }> = ({ paint }) => (
  <>
    <path d="M100 18 L106 34 L122 36 L109 46 L114 62 L100 52 L86 62 L91 46 L78 36 L94 34 Z" fill={paint('#fde047')} />
    <path d="M10 200 C12 162 36 146 64 146 C92 146 114 162 116 200 Z" fill={paint('#2563eb')} />
    <circle cx="64" cy="106" r="30" fill={paint('#e8b583')} />
    <path d="M34 102 C32 76 50 68 64 68 C82 68 98 78 94 102 C88 88 78 84 64 84 C50 84 40 90 34 102 Z" fill={paint('#3b2416')} />
    <path d="M84 200 C86 166 108 154 136 154 C164 154 186 166 190 200 Z" fill={paint('#f59e0b')} />
    <circle cx="136" cy="116" r="28" fill={paint('#c68a5a')} />
    <path d="M106 124 C100 86 120 80 136 80 C154 80 172 88 166 124 C162 104 152 96 136 96 C120 96 110 104 106 124 Z" fill={paint('#1f2937')} />
  </>
);

const Bombom: React.FC<{ paint: Paint; silhouette: boolean }> = ({ paint, silhouette }) => (
  <>
    <path d="M60 100 L16 70 Q8 100 16 130 Z" fill={paint('#f9a8d4')} />
    <path d="M140 100 L184 70 Q192 100 184 130 Z" fill={paint('#f9a8d4')} />
    <g stroke={paint('#fbcfe8')} strokeWidth="2">
      <path d="M22 82 L56 98 M18 100 L56 100 M22 118 L56 102" />
      <path d="M178 82 L144 98 M182 100 L144 100 M178 118 L144 102" />
    </g>
    <rect x="52" y="89" width="14" height="22" rx="5" fill={paint('#db2777')} />
    <rect x="134" y="89" width="14" height="22" rx="5" fill={paint('#db2777')} />
    <ellipse cx="100" cy="100" rx="46" ry="38" fill={paint('#ec4899')} />
    {!silhouette && (
      <>
        <ellipse cx="82" cy="82" rx="16" ry="7" fill="#fbcfe8" opacity="0.6" />
        <text x="100" y="98" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="14" fill="#fff">Sonho de</text>
        <text x="100" y="116" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="16" fill="#fff">Valsa</text>
      </>
    )}
  </>
);

const Bonus: React.FC<{ paint: Paint; silhouette: boolean }> = ({ paint, silhouette }) => (
  <>
    <g fill={paint('#fde047')}>
      <path d="M30 34 L34 44 L44 48 L34 52 L30 62 L26 52 L16 48 L26 44 Z" />
      <path d="M170 146 L173 154 L181 157 L173 160 L170 168 L167 160 L159 157 L167 154 Z" />
      <path d="M168 30 L170 36 L176 38 L170 40 L168 46 L166 40 L160 38 L166 36 Z" />
    </g>
    <g transform="rotate(-8 100 100)">
      <path d="M24 62 H176 V88 A12 12 0 0 0 176 112 V138 H24 V112 A12 12 0 0 0 24 88 Z" fill={paint('#fbbf24')} />
      <rect x="38" y="72" width="124" height="56" rx="6" fill="none" stroke={paint('#b45309')} strokeWidth="2" strokeDasharray="5 4" />
      {!silhouette && (
        <>
          <text x="100" y="106" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="34" fill="#7c2d12">+0,2</text>
          <text x="100" y="121" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9" letterSpacing="2" fill="#92400e">MÉDIA FINAL</text>
        </>
      )}
    </g>
  </>
);

// What the silhouette promises for the last prize.
// The standing console with flared panels on its base, and a controller beside it.
const Console: React.FC = () => (
  <>
    <path d="M34 14 C54 9 84 9 104 14 C95 56 89 102 92 152 C93 162 96 168 99 172 L41 172 C44 168 47 162 48 152 C51 102 45 56 34 14 Z" fill={INK} />
    <ellipse cx="70" cy="177" rx="36" ry="6" fill={INK} />
    <path d="M124 150 C126 141 134 139 143 140 L171 140 C180 139 188 141 190 150 L198 179 C200 190 189 194 183 185 L175 172 L141 172 L133 185 C127 194 116 190 118 179 Z" fill={INK} />
  </>
);

// The KitKat stands where the console was, with one finger where the controller was.
const KitKat: React.FC = () => (
  <>
    <ellipse cx="100" cy="180" rx="78" ry="6" fill="#000" opacity="0.18" />
    <rect x="42" y="18" width="56" height="156" rx="8" fill="#d6001c" />
    <rect x="42" y="18" width="56" height="12" rx="4" fill="#a30015" />
    <rect x="42" y="162" width="56" height="12" rx="4" fill="#a30015" />
    <ellipse cx="70" cy="96" rx="20" ry="54" fill="#fff" />
    <text x="70" y="96" transform="rotate(-90 70 96)" textAnchor="middle" dominantBaseline="central" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontSize="22" fill="#d6001c">KitKat</text>
    <rect x="116" y="156" width="78" height="20" rx="4" fill="#7b3f1d" />
    <path d="M135 159 V173 M155 159 V173 M175 159 V173" stroke="#5a2c13" strokeWidth="2.5" />
  </>
);

const RewardArt: React.FC<{ id: RewardId; silhouette: boolean; className?: string }> = ({ id, silhouette, className }) => {
  const paint: Paint = color => (silhouette ? INK : color);
  const props = { paint, silhouette };
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      {id === 'xarope' && <Xarope {...props} />}
      {id === 'foto' && <Foto {...props} />}
      {id === 'bombom' && <Bombom {...props} />}
      {id === 'bonus' && <Bonus {...props} />}
      {id === 'kitkat' && (silhouette ? <Console /> : <KitKat />)}
    </svg>
  );
};

export default RewardArt;
