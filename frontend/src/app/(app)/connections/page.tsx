'use client';

import { useState } from 'react';
import { Activity, AlertCircle, Link as LinkIcon, RefreshCw, Trash2, ChevronDown, ShieldCheck, Loader2, Plug, CheckCircle2 } from 'lucide-react';
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
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!formType || !formApiKey || !formApiSecret) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    setSyncMessage(null);
    try {
      const result = await addConnection({
        type: formType as ConnectionTypeEnum,
        label: formLabel || undefined,
        api_key: formApiKey,
        api_secret: formApiSecret,
      });
      setFormType('');
      setFormLabel('');
      setFormApiKey('');
      setFormApiSecret('');
      // Mostrar feedback do sync inicial
      const summary = (result as any)?.sync_summary;
      if (summary) {
        const total = summary.created + summary.updated;
        setSyncMessage(`${total} ativo${total !== 1 ? 's' : ''} sincronizado${total !== 1 ? 's' : ''}`);
        setTimeout(() => setSyncMessage(null), 5000);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao conectar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover esta conexão? Suas posições importadas serão mantidas.')) return;
    setDeletingId(id);
    try {
      await removeConnection(id);
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    setSyncMessage(null);
    try {
      const result = await syncConnection(id);
      const summary = (result as any)?.sync_summary;
      if (summary) {
        const total = summary.created + summary.updated;
        setSyncMessage(`${total} ativo${total !== 1 ? 's' : ''} sincronizado${total !== 1 ? 's' : ''}`);
        setTimeout(() => setSyncMessage(null), 5000);
      }
    } catch {
      // silently fail
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="flex flex-col px-4 pt-8 pb-10 lg:px-8 lg:pt-10 space-y-8 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <header className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-outfit)]">Conexões</h1>
        <p className="text-sm text-muted mt-1">Integre suas contas e deixe o robô fazer o resto.</p>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-negative/10 text-negative font-medium rounded-2xl p-4 text-sm ring-1 ring-negative/20">
          {error}
        </div>
      )}

      {/* Sync Success Banner */}
      {syncMessage && (
        <div className="bg-positive/10 text-positive font-medium rounded-2xl p-4 text-sm ring-1 ring-positive/20 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} />
          {syncMessage}
        </div>
      )}

      {/* ── Two Column Layout (Desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── Left Column: Form ── */}
        <div className="lg:col-span-5 lg:order-1 order-2 w-full animate-fade-in stagger-2">
          <section className="glass-card rounded-3xl p-7 lg:p-8 space-y-7 relative gold-top-accent">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface border border-border/60 shadow-inner">
                <LinkIcon size={20} className="text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground font-[family-name:var(--font-outfit)]">Nova Corretora</h2>
                <p className="text-[12px] font-medium text-muted-secondary">Sincronização Read-Only</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-muted uppercase tracking-wider pl-0.5">Instituição</label>
                <div className="relative group">
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full appearance-none bg-surface border border-border/80 rounded-2xl py-3.5 px-4 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all hover:border-border-hover"
                  >
                    <option value="">Selecione uma opção...</option>
                    {exchangeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-secondary pointer-events-none group-hover:text-muted transition-colors" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-muted uppercase tracking-wider pl-0.5">Nome Customizado</label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="Ex: Binance Secundária"
                  className="w-full bg-surface border border-border/80 rounded-2xl py-3.5 px-4 text-foreground text-sm placeholder:text-muted-tertiary focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all hover:border-border-hover"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-muted uppercase tracking-wider pl-0.5">API Key (Pública)</label>
                <input
                  type="text"
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  placeholder="Cole aqui..."
                  className="w-full bg-surface border border-border/80 rounded-2xl py-3.5 px-4 text-accent text-sm placeholder:text-muted-tertiary focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all font-mono tracking-tight"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-muted uppercase tracking-wider pl-0.5">API Secret (Privada)</label>
                <input
                  type="password"
                  value={formApiSecret}
                  onChange={(e) => setFormApiSecret(e.target.value)}
                  placeholder="Cole aqui..."
                  className="w-full bg-surface border border-border/80 rounded-2xl py-3.5 px-4 text-accent text-sm placeholder:text-muted-tertiary focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all font-mono tracking-tight"
                />
              </div>

              {formError && (
                <p className="text-sm text-negative font-medium bg-negative/5 px-3 py-2 rounded-lg border border-negative/10">{formError}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full btn-accent py-4 rounded-xl text-sm transition-all duration-200 mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                {isSubmitting ? 'Validando...' : 'Conectar Carteira'}
              </button>

              <div className="flex items-start gap-3 pt-4 border-t border-border/40 mt-4">
                <div className="p-1.5 bg-positive/10 rounded-lg">
                  <ShieldCheck size={16} className="text-positive shrink-0" />
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  Criptografado com <strong className="text-foreground font-medium">AES-256</strong>. Exija permissões apenas de leitura (Read-Only) na sua corretora. Nunca armazenamos permissões de saque.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ── Right Column: Connected List ── */}
        <div className="lg:col-span-7 lg:order-2 order-1 space-y-4 animate-fade-in stagger-1">
          <h2 className="text-[11px] font-bold text-muted-secondary uppercase tracking-widest pl-1 mb-2">Contas Ativas</h2>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              <Skeleton className="h-32 rounded-3xl" />
              <Skeleton className="h-32 rounded-3xl" />
            </div>
          ) : connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-tertiary glass-card rounded-3xl border-dashed">
              <Plug size={40} className="mb-4 text-border-hover" />
              <p className="font-bold text-foreground font-[family-name:var(--font-outfit)]">Nenhuma integração</p>
              <p className="text-sm text-muted-secondary mt-1 text-center max-w-xs">Sincronize sua primeira conta usando o formulário ao lado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {connections.map((conn) => {
                const isActive = conn.status === ConnectionStatusEnum.ACTIVE;
                return (
                  <div key={conn.id} className="glass-card rounded-3xl p-5 flex flex-col space-y-4 transition-all duration-200 hover:bg-card-hover relative overflow-hidden group">
                    {/* Status side bar indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isActive ? 'bg-positive' : 'bg-negative'}`} />

                    <div className="flex items-start justify-between pl-2">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-surface flex items-center justify-center text-foreground border border-border/60 shadow-inner group-hover:border-accent/20 transition-colors">
                          <LinkIcon size={20} className={isActive ? 'text-accent' : 'text-muted-secondary'} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-foreground font-bold text-lg font-[family-name:var(--font-outfit)] group-hover:text-accent transition-colors">
                            {conn.label || exchangeLabels[conn.type] || conn.type}
                          </span>
                          <span className="text-[11px] text-muted-secondary flex items-center gap-1.5 font-medium mt-0.5">
                            <span className="uppercase text-[9px] tracking-wider bg-surface px-1.5 py-0.5 rounded text-muted">Última Sync</span>
                            <RefreshCw size={10} /> {formatDate(conn.last_synced_at)}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border ${
                        isActive
                          ? 'bg-positive/[0.05] text-positive border-positive/10'
                          : 'bg-negative/[0.05] text-negative border-negative/10'
                      }`}>
                        {isActive ? (
                          <><Activity size={10} strokeWidth={3} /> Online</>
                        ) : (
                          <><AlertCircle size={10} strokeWidth={3} /> Erro</>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/40 pl-2">
                      <button
                        onClick={() => handleSync(conn.id)}
                        disabled={syncingId === conn.id}
                        className="text-[13px] font-bold text-muted hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {syncingId === conn.id ? (
                          <Loader2 size={14} className="animate-spin text-accent" />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        Forçar Sincronização
                      </button>
                      <button
                        onClick={() => handleDelete(conn.id)}
                        disabled={deletingId === conn.id}
                        className="text-muted-secondary hover:text-negative transition-colors p-2 rounded-xl hover:bg-negative/10 disabled:opacity-50"
                        title="Remover conexão"
                      >
                        {deletingId === conn.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
