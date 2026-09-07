import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  ExternalLink, 
  ShieldCheck, 
  X,
  Sparkles,
  Server,
  Zap,
  Globe
} from 'lucide-react';
import { AiConfig, AiProviderType } from '../types';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: AiConfig;
  onSaveConfig: (config: AiConfig) => void;
  onClearConfig: () => void;
}

const PROVIDER_TABS: {
  id: AiProviderType;
  label: string;
  badge: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    badge: 'Bawaan / Google',
    icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
  },
  {
    id: 'openai',
    label: 'OpenAI (GPT)',
    badge: 'ChatGPT',
    icon: <Zap className="w-3.5 h-3.5 text-emerald-400" />,
  },
  {
    id: 'claude',
    label: 'Anthropic Claude',
    badge: 'Claude',
    icon: <Key className="w-3.5 h-3.5 text-orange-400" />,
  },
  {
    id: 'custom',
    label: 'Kustom / Lainnya',
    badge: 'DeepSeek, Groq, dll',
    icon: <Server className="w-3.5 h-3.5 text-sky-400" />,
  },
];

const CUSTOM_PRESETS = [
  {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-v4-flash',
    note: 'Kinerja tinggi dengan biaya ekonomis',
  },
  {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'openai/gpt-oss-120b',
    note: 'Kecepatan inferensi ultra-cepat',
  },
  {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'anthropic/claude-sonnet-5',
    note: 'Akses ratusan model AI dalam 1 kunci',
  },
  {
    name: 'Ollama (Lokal)',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama3',
    note: 'Server model lokal tanpa API Key',
  },
];

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
  onClearConfig,
}) => {
  const [provider, setProvider] = useState<AiProviderType>(currentConfig?.provider || 'gemini');
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [model, setModel] = useState(currentConfig?.model || '');
  const [customBaseUrl, setCustomBaseUrl] = useState(currentConfig?.customBaseUrl || '');
  const [customModel, setCustomModel] = useState(currentConfig?.customModel || '');

  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Sync with current props when opened
  useEffect(() => {
    if (isOpen) {
      setProvider(currentConfig?.provider || 'gemini');
      setApiKey(currentConfig?.apiKey || '');
      setModel(currentConfig?.model || '');
      setCustomBaseUrl(currentConfig?.customBaseUrl || '');
      setCustomModel(currentConfig?.customModel || '');
      setVerifyResult(null);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof CUSTOM_PRESETS[0]) => {
    setCustomBaseUrl(preset.baseUrl);
    setCustomModel(preset.model);
    setVerifyResult(null);
  };

  const handleTestConnection = async () => {
    const keyToTest = apiKey.trim();

    if (provider !== 'custom' && !keyToTest) {
      setVerifyResult({
        success: false,
        message: 'Silakan masukkan kunci API sebelum melakukan pengujian.',
      });
      return;
    }

    if (provider === 'gemini' && keyToTest.length < 20) {
      setVerifyResult({
        success: false,
        message: 'Kunci API tampak tidak lengkap. Kunci Google AI Studio biasanya diawali dengan "AIzaSy" (~39 karakter).',
      });
      return;
    }

    if (provider === 'openai' && (!keyToTest.startsWith('sk-') || keyToTest.length < 20)) {
      setVerifyResult({
        success: false,
        message: 'Format kunci OpenAI biasanya diawali dengan "sk-".',
      });
      return;
    }

    if (provider === 'claude' && (!keyToTest.startsWith('sk-ant') && keyToTest.length < 20)) {
      setVerifyResult({
        success: false,
        message: 'Format kunci Anthropic Claude biasanya diawali dengan "sk-ant-".',
      });
      return;
    }

    if (provider === 'custom' && !customBaseUrl.trim()) {
      setVerifyResult({
        success: false,
        message: 'Silakan masukkan Base URL endpoint kustom (misalnya https://api.deepseek.com/v1).',
      });
      return;
    }

    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const res = await fetch('/api/ai/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: keyToTest,
          model: model || undefined,
          customBaseUrl: customBaseUrl.trim() || undefined,
          customModel: customModel.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setVerifyResult({
          success: true,
          message: data.message || 'Koneksi berhasil dan API Key valid!',
        });
      } else {
        setVerifyResult({
          success: false,
          message: data.error || 'Verifikasi gagal. Periksa kembali kunci dan izin akses.',
        });
      }
    } catch (err: any) {
      setVerifyResult({
        success: false,
        message: 'Gagal terhubung ke server untuk menguji koneksi API.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = () => {
    const configToSave: AiConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || undefined,
      customBaseUrl: customBaseUrl.trim() || undefined,
      customModel: customModel.trim() || undefined,
    };
    onSaveConfig(configToSave);
    onClose();
  };

  const handleClear = () => {
    setApiKey('');
    setModel('');
    setCustomBaseUrl('');
    setCustomModel('');
    setVerifyResult(null);
    onClearConfig();
  };

  const hasConfiguredKey = Boolean(currentConfig?.apiKey || (currentConfig?.provider === 'custom' && currentConfig?.customBaseUrl));

  return (
    <div 
      id="api-key-dialog-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        id="api-key-dialog"
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#0E1526] border border-slate-700/90 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 relative space-y-4"
      >
        {/* Close Button */}
        <button
          id="api-key-dialog-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          type="button"
          aria-label="Tutup Dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Dialog Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-10 h-10 rounded-xl bg-[#F2542D]/15 border border-[#F2542D]/30 flex items-center justify-center text-[#F2542D] shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-white font-display">
                Konfigurasi Kunci AI (Gemini, GPT, Claude &amp; Custom)
              </h2>
              {hasConfiguredKey ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
                  Kunci Kustom Aktif
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                  Default Lingkungan
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Pilih penyedia model AI yang ingin Anda gunakan. Kunci disimpan secara aman di peramban lokal (<code className="font-mono text-slate-300">localStorage</code>).
            </p>
          </div>
        </div>

        {/* Provider Tabs */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-semibold text-slate-300">
            Pilih Penyedia AI (Provider)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PROVIDER_TABS.map((tab) => {
              const isSelected = provider === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setProvider(tab.id);
                    setVerifyResult(null);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-[#18233D] border-[#F2542D] shadow-md shadow-[#F2542D]/10 text-white'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    {tab.icon}
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#F2542D]"></span>}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{tab.label}</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">{tab.badge}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Provider Content Form */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3.5">
          {/* 1. Google Gemini */}
          {provider === 'gemini' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Gemini API</span>
                </span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-medium text-[#F2542D] hover:underline inline-flex items-center gap-1"
                >
                  <span>Dapatkan Kunci di Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Model Choice */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">Model Gemini</label>
                <select
                  value={model || 'gemini-3.8-flash'}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#080C16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#F2542D]"
                >
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Direkomendasikan - Cepat &amp; Tajam)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Penalaran Paling Dalam)</option>
                  <option value="gemini-3.6-flash">Gemini 3.6 Flash (Seimbang)</option>
                  <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash-Lite (Paling Hemat)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Generasi Sebelumnya)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Generasi Sebelumnya)</option>
                </select>
              </div>

              {/* API Key Input */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">Google AI Studio API Key</label>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setVerifyResult(null);
                    }}
                    placeholder="Contoh: AIzaSy..."
                    className="w-full bg-[#080C16] border border-slate-700 rounded-lg px-3 py-2 pr-16 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D]"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Dimulai dengan <code className="font-mono text-slate-300">AIzaSy...</code>
                </p>
              </div>
            </>
          )}

          {/* 2. OpenAI GPT */}
          {provider === 'openai' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>OpenAI (ChatGPT / GPT-4o)</span>
                </span>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-medium text-[#F2542D] hover:underline inline-flex items-center gap-1"
                >
                  <span>Buka OpenAI API Keys</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Model Choice */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">Model OpenAI</label>
                <select
                  value={model || 'gpt-5.6-terra'}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#080C16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#F2542D]"
                >
                  <option value="gpt-5.6-terra">GPT-5.6 Terra (Direkomendasikan - Seimbang)</option>
                  <option value="gpt-6-astra">GPT-6 Astra (Kemampuan Analisis Maksimal)</option>
                  <option value="gpt-5.6-sol">GPT-5.6 Sol (Kerja Profesional Kompleks)</option>
                  <option value="gpt-5.6-luna">GPT-5.6 Luna (Paling Hemat Biaya)</option>
                  <option value="gpt-4o">GPT-4o (Generasi Sebelumnya)</option>
                  <option value="gpt-4o-mini">GPT-4o mini (Generasi Sebelumnya)</option>
                </select>
              </div>

              {/* API Key Input */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">OpenAI API Key</label>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setVerifyResult(null);
                    }}
                    placeholder="Contoh: sk-proj-..."
                    className="w-full bg-[#080C16] border border-slate-700 rounded-lg px-3 py-2 pr-16 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D]"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Dimulai dengan <code className="font-mono text-slate-300">sk-...</code> atau <code className="font-mono text-slate-300">sk-proj-...</code>
                </p>
              </div>
            </>
          )}

          {/* 3. Anthropic Claude */}
          {provider === 'claude' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-orange-400" />
                  <span>Anthropic Claude</span>
                </span>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-medium text-[#F2542D] hover:underline inline-flex items-center gap-1"
                >
                  <span>Buka Anthropic Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Model Choice */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">Model Claude</label>
                <select
                  value={model || 'claude-sonnet-5'}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#080C16] border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#F2542D]"
                >
                  <option value="claude-sonnet-5">Claude Sonnet 5 (Direkomendasikan - Seimbang)</option>
                  <option value="claude-opus-5">Claude Opus 5 (Kualitas Tertinggi)</option>
                  <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Respons Tercepat)</option>
                  <option value="claude-fable-5-1">Claude Fable 5.1 (Varian Terbaru)</option>
                </select>
              </div>

              {/* API Key Input */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">Anthropic API Key</label>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setVerifyResult(null);
                    }}
                    placeholder="Contoh: sk-ant-api03-..."
                    className="w-full bg-[#080C16] border border-slate-700 rounded-lg px-3 py-2 pr-16 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D]"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Dimulai dengan <code className="font-mono text-slate-300">sk-ant-...</code>
                </p>
              </div>
            </>
          )}

          {/* 4. Custom (OpenAI Compatible) */}
          {provider === 'custom' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>Kustom OpenAI-Compatible API</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-sky-950/60 border border-sky-600/30 text-sky-400 rounded">
                  Kompatibel Spesifikasi OpenAI
                </span>
              </div>

              {/* Presets Chips */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 block">Isi Cepat dengan Preset Populer:</span>
                <div className="flex flex-wrap gap-1.5">
                  {CUSTOM_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-[11px] text-slate-200 transition cursor-pointer flex items-center gap-1"
                      title={preset.note}
                    >
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Base URL */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">Base URL Endpoint</label>
                <input
                  type="text"
                  value={customBaseUrl}
                  onChange={(e) => {
                    setCustomBaseUrl(e.target.value);
                    setVerifyResult(null);
                  }}
                  placeholder="https://api.deepseek.com/v1 atau http://localhost:11434/v1"
                  className="w-full bg-[#080C16] border border-slate-700 rounded-lg px-3 py-2 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D]"
                />
                <p className="text-[10px] text-slate-500">
                  Endpoint chat completions akan dipanggil otomatis ke <code className="font-mono text-slate-400">/chat/completions</code>.
                </p>
              </div>

              {/* Model Name */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">Nama Model</label>
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => {
                    setCustomModel(e.target.value);
                    setVerifyResult(null);
                  }}
                  placeholder="Contoh: deepseek-chat, llama-3.3-70b-versatile, llama3"
                  className="w-full bg-[#080C16] border border-slate-700 rounded-lg px-3 py-2 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D]"
                />
              </div>

              {/* API Key */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-medium">API Key (Opsional jika server lokal)</label>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setVerifyResult(null);
                    }}
                    placeholder="Masukkan API Key (kosongkan jika tidak membutuhkan autentikasi)"
                    className="w-full bg-[#080C16] border border-slate-700 rounded-lg px-3 py-2 pr-16 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2542D]"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Verification Status Result */}
        {verifyResult && (
          <div
            id="api-key-verify-result"
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              verifyResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}
          >
            {verifyResult.success ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-semibold block font-mono text-[11px]">
                {verifyResult.success ? 'KONEKSI BERHASIL & KUNCI VALID' : 'VERIFIKASI GAGAL'}
              </span>
              <span className="text-[11px] leading-relaxed">{verifyResult.message}</span>
            </div>
          </div>
        )}

        {/* Security & Privacy Notice */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Kunci API Anda tersimpan lokal di peramban dan hanya diteruskan ke endpoint AI untuk proses analisis PRD. Kunci Anda tidak disimpan di basis data publik kami.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Test Connection Button */}
            <button
              id="api-key-test-btn"
              type="button"
              onClick={handleTestConnection}
              disabled={isVerifying || (provider !== 'custom' && !apiKey.trim()) || (provider === 'custom' && !customBaseUrl.trim())}
              className="px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer w-full sm:w-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-[#F2542D]' : 'text-slate-400'}`} />
              <span>{isVerifying ? 'Menguji...' : 'Uji Koneksi & Kunci'}</span>
            </button>

            {/* Clear Button if custom key exists */}
            {hasConfiguredKey && (
              <button
                id="api-key-clear-btn"
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                title="Hapus konfigurasi kustom dan kembali ke default"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Default</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Batal
            </button>
            <button
              id="api-key-save-btn"
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-[#F2542D] hover:bg-[#ff6742] text-white text-xs font-bold transition shadow-lg shadow-[#F2542D]/20 cursor-pointer"
            >
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
