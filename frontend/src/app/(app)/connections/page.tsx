'use client';

import { useState } from 'react';
import { Activity, AlertCircle, Link as LinkIcon, RefreshCw, Trash2, ChevronDown, ShieldCheck, Loader2, Plug } from 'lucide-react';
import { useConnections } from '@/hooks/useConnections';
import { ConnectionTypeEnum, ConnectionStatusEnum } from '@/lib/types';
import Skeleton from '@/components/Skeleton';

const exchangeOptions = [
  { value: ConnectionTypeEnum.BINANCE, label: 'Binance' },
  { value: ConnectionTypeEnum.MERCADO_BITCOIN, label: 'Mercado Bitcoin' },
];

const exchangeLabels: Record<string, string> = {
  [ConnectionTypeEnum.BINANCE]: 'Binance',
  [ConnectionTypeEnum.MERCADO_BITCOIN]: 'Mercado Bitcoin',
  [ConnectionTypeEnum.B3_OAUTH]: 'B3',
  [ConnectionTypeEnum.PLUGGY]: 'Pluggy',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Nunca';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export default function ConnectionsPage() {
  const { connections, isLoading, error, addConnection, removeConnection, syncConnection } = useConnections();

  const [formType, setFormType] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formApiSecret, setFormApiSecret] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!formType || !formApiKey || !formApiSecret) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await addConnection({
        type: formType as ConnectionTypeEnum,
        label: formLabel || undefined,
        api_key: formApiKey,
        api_secret: formApiSecret,
      });
      setFormType('');
      setFormLabel('');
      setFormApiKey('');
      setFormApiSecret('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao conectar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta conexão?')) return;
    setDeletingId(id);
    try {
      await removeConnection(id);
    } catch {
      // silently fail, connection stays in list
    } finally {
      setDeletingId(null);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await syncConnection(id);
    } catch {
      // silently fail
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="flex flex-col px-4 pt-10 pb-8 lg:px-8 lg:pt-8 space-y-8 max-w-4xl mx-auto">

      {/* Header */}
      <header className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">Conexões</h1>
        <p className="text-sm text-zinc-500 mt-1">Integre suas corretoras com chaves Read-Only.</p>
      </header>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 text-red-400 rounded-xl p-4 text-sm ring-1 ring-red-500/20">
          {error}
        </div>
      )}

      {/* Connected Exchanges */}
      <section className="space-y-3 animate-fade-in stagger-1">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider pl-1">Suas Conexões</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        ) : connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500 animate-fade-in">
            <Plug size={32} className="mb-3 text-zinc-700" />
            <p className="font-medium">Nenhuma conexão configurada.</p>
            <p className="text-sm text-zinc-600 mt-1">Conecte uma corretora abaixo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {connections.map((conn) => (
              <div key={conn.id} className="glass-card rounded-2xl p-4 flex flex-col space-y-3 transition-all duration-200 hover:bg-card-hover">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300 ring-1 ring-zinc-700/50">
                      <LinkIcon size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-semibold">
                        {conn.label || exchangeLabels[conn.type] || conn.type}
                      </span>
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <RefreshCw size={9} /> {formatDate(conn.last_synced_at)}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                    conn.status === ConnectionStatusEnum.ACTIVE
                      ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                  }`}>
                    {conn.status === ConnectionStatusEnum.ACTIVE ? (
                      <><Activity size={9} /> Ativo</>
                    ) : (
                      <><AlertCircle size={9} /> Erro</>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-zinc-800/50">
                  <button
                    onClick={() => handleSync(conn.id)}
                    disabled={syncingId === conn.id}
                    className="text-xs text-zinc-500 hover:text-blue-400 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {syncingId === conn.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                    Sincronizar
                  </button>
                  <button
                    onClick={() => handleDelete(conn.id)}
                    disabled={deletingId === conn.id}
                    className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {deletingId === conn.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add New Connection */}
      <section className="glass-card rounded-2xl p-6 space-y-6 animate-fade-in stagger-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 ring-1 ring-blue-500/20">
            <LinkIcon size={18} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Nova Conexão</h2>
            <p className="text-xs text-zinc-500">Conecte uma corretora de criptomoedas.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 pl-0.5">Corretora (Exchange)</label>
            <div className="relative">
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full appearance-none bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
              >
                <option value="">Selecione...</option>
                {exchangeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 pl-0.5">Label (opcional)</label>
            <input
              type="text"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              placeholder="Ex: Minha conta Binance"
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 pl-0.5">API Key (Leitura)</label>
            <input
              type="text"
              value={formApiKey}
              onChange={(e) => setFormApiKey(e.target.value)}
              placeholder="Cole sua chave pública gerada na exchange..."
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 pl-0.5">API Secret</label>
            <input
              type="password"
              value={formApiSecret}
              onChange={(e) => setFormApiSecret(e.target.value)}
              placeholder="Cole sua chave secreta..."
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3.5 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all font-mono text-sm"
            />
          </div>

          {formError && (
            <p className="text-sm text-red-400">{formError}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-600/20 mt-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            {isSubmitting ? 'Conectando...' : 'Conectar Corretora'}
          </button>

          <div className="flex items-start gap-2 p-3 bg-zinc-800/30 rounded-xl">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Suas chaves são criptografadas com AES-256 e armazenadas de forma segura. Utilizamos apenas permissões de leitura — nunca movimentamos seus ativos.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
