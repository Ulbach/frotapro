
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LogOut, LogIn, Car, Settings, X, Info, Database, RefreshCw, ChevronLeft, MapPin, AlertCircle, CheckCircle2, Wand2, WifiOff, LayoutDashboard, Truck, Calendar, User, ShieldCheck, Hash, Trash2, Code2, HelpCircle
} from 'lucide-react';
import { AppTab, VehicleLog, ListagemData } from './types';
import { sheetsService } from './services/googleSheets';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(localStorage.getItem('FROTA_SCRIPT_URL') || '');
  const [listas, setListas] = useState<ListagemData>({ veiculos: [], motoristas: [], segurancas: [] });
  const [historico, setHistorico] = useState<VehicleLog[]>([]);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Verifica se o modo usuário está ativado via URL (?view=user)
  const isUserView = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'user';
  }, []);

  const fetchData = useCallback(async (isSilent = false) => {
    const scriptUrl = localStorage.getItem('FROTA_SCRIPT_URL');
    if (!scriptUrl) {
      setLoading(false);
      return;
    }

    if (!isSilent) setLoading(true);
    try {
      const listasRes = await sheetsService.getListas();
      setListas(listasRes);
      
      const historicoRes = await sheetsService.getHistorico();
      setHistorico(historicoRes);
    } catch (err: any) {
      console.error("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000); 
  };

  const handleInitSheet = async () => {
    const trimmedUrl = tempUrl.trim();
    if (!trimmedUrl) return alert("Cole a URL do Script primeiro.");
    
    setLoading(true);
    const result = await sheetsService.initSpreadsheet(trimmedUrl);
    
    if (result.success) {
      localStorage.setItem('FROTA_SCRIPT_URL', trimmedUrl);
      if (result.data) setListas(result.data);
      showToast("Sincronizado!", "success");
      fetchData(true);
      setShowSettings(false);
    } else {
      showToast(result.error || "Erro de conexão.", "error");
    }
    setLoading(false);
  };

  const handleClearData = async () => {
    if (window.confirm("⚠️ DESEJA LIMPAR O HISTÓRICO? Isso apagará todos os registros da planilha.")) {
      setLoading(true);
      const success = await sheetsService.clearHistorico();
      if (success) {
        showToast("Histórico limpo!", "success");
        setHistorico([]);
        fetchData(true);
      } else {
        showToast("Erro ao limpar dados.", "error");
      }
      setLoading(false);
    }
  };

  const vehiclesOut = historico.filter(log => log.status === 'FORA');
  const isConnected = !!localStorage.getItem('FROTA_SCRIPT_URL');

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10 text-slate-900 font-['Inter']">
      {/* Toast Notifier */}
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl animate-in slide-in-from-top-full duration-300 ${message.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'} text-white border border-white/10 backdrop-blur-sm max-w-[90vw]`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-[11px] uppercase tracking-wider">{message.text}</span>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#EBECF0] w-full max-w-sm rounded-[2rem] shadow-2xl border border-white/40 overflow-hidden">
            <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold uppercase tracking-widest text-[10px]">Configurações</h3>
              <button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-all"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                  URL do Google Script
                  {isConnected && <span className="text-emerald-500 flex items-center gap-1 font-bold">● CONECTADO</span>}
                </label>
                <textarea 
                  rows={2} 
                  className="w-full px-4 py-3 bg-white rounded-xl outline-none text-[10px] font-mono shadow-inner border border-slate-200 focus:border-teal-500 transition-all text-slate-600" 
                  value={tempUrl} 
                  onChange={(e) => setTempUrl(e.target.value)} 
                  placeholder="Link /exec do script" 
                />
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={handleInitSheet} 
                  disabled={loading}
                  className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                  Sincronizar Planilha
                </button>

                <button 
                  onClick={handleClearData}
                  disabled={loading}
                  className="w-full py-4 bg-white text-rose-600 border border-rose-100 rounded-xl font-bold uppercase tracking-widest text-[11px] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Limpar Histórico
                </button>
              </div>

              <div className="pt-6 border-t border-slate-200 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full text-[8px] font-bold text-slate-400 tracking-widest">
                  <Code2 size={10} className="text-teal-500" /> BY ULBACH
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto">
        {activeTab === AppTab.DASHBOARD && (
          <div className="animate-in fade-in duration-500">
            {/* Header Original */}
            <div className="relative h-56 w-full overflow-hidden rounded-b-[2.5rem] shadow-xl mb-6">
              <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" alt="Banner" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
              
              <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
                <div className={`px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2 ${isConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                   <div className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                   <span className="text-[7px] font-bold uppercase tracking-widest">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
                
                {/* Oculta botão de configurações se estiver no modo user */}
                {!isUserView && (
                  <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white border border-white/10 hover:bg-white/20 transition-all">
                    <Settings size={18} />
                  </button>
                )}
              </div>

              <div className="absolute bottom-10 left-0 right-0 text-center px-4">
                <h1 className="text-2xl font-bold text-white tracking-[0.2em] uppercase italic">FROTA PRO</h1>
                <p className="text-[8px] text-teal-400 font-bold uppercase tracking-widest mt-2">CONTROLE DE VEÍCULOS</p>
              </div>
            </div>

            <div className="px-5 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setActiveTab(AppTab.SAIDA)} className="flex flex-col items-center py-8 bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-all active:scale-95 border border-slate-100 group">
                  <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-3 group-hover:bg-rose-500 group-hover:text-white transition-all"><LogOut size={28} /></div>
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Registrar Saída</span>
                </button>
                <button onClick={() => setActiveTab(AppTab.RETORNO)} className="flex flex-col items-center py-8 bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-all active:scale-95 border border-slate-100 group">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-all"><LogIn size={28} /></div>
                  <span className="font-bold text-slate-700 uppercase text-[10px] tracking-widest">Registrar Entrada</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2 text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                  <div className="flex items-center gap-2"><LayoutDashboard size={14} className="text-teal-600" /> Movimentação Recente</div>
                  <button onClick={() => fetchData(true)} className={loading ? 'animate-spin' : ''}><RefreshCw size={14} /></button>
                </div>

                <div className="space-y-3 pb-4">
                  {loading ? (
                    <div className="py-12 text-center bg-white rounded-[2rem] shadow-sm"><RefreshCw className="animate-spin mx-auto text-slate-200" size={30} /></div>
                  ) : historico.length === 0 ? (
                    <div className="py-12 text-center bg-white rounded-[2rem] border border-dashed border-slate-200 px-8">
                      <Truck size={30} className="text-slate-200 mx-auto mb-3" />
                      <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Nenhum registro encontrado</p>
                    </div>
                  ) : (
                    historico.slice(-4).reverse().map((log, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-teal-100 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${log.status === 'FORA' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}><Car size={22} /></div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs uppercase">{log.veiculo}</p>
                            <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">{log.motorista}</p>
                          </div>
                        </div>
                        <div className={`text-[8px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${log.status === 'FORA' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{log.status}</div>
                      </div>
                    ))
                  )}
                  {historico.length > 4 && <button onClick={() => setActiveTab(AppTab.HISTORICO)} className="w-full py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-teal-600 bg-white rounded-xl border border-slate-100">Ver Histórico Completo</button>}
                </div>
                
                <div className="text-center py-6">
                  <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-slate-300">BY ULBACH</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-5 pt-6 pb-20">
          {activeTab !== AppTab.DASHBOARD && (
            <button onClick={() => setActiveTab(AppTab.DASHBOARD)} className="mb-6 flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-800 transition-all">
              <ChevronLeft size={18} className="text-teal-500" /> Voltar ao Painel
            </button>
          )}
          {activeTab === AppTab.SAIDA && <SaidaForm listas={listas} historico={historico} vehiclesOut={vehiclesOut} onSuccess={() => { showToast("Saída registrada!", "success"); setActiveTab(AppTab.DASHBOARD); fetchData(true); }} />}
          {activeTab === AppTab.RETORNO && <RetornoForm listas={listas} vehiclesOut={vehiclesOut} onSuccess={() => { showToast("Retorno registrado!", "success"); setActiveTab(AppTab.DASHBOARD); fetchData(true); }} />}
          {activeTab === AppTab.HISTORICO && <HistoricoCompleto historico={historico} />}
          
          {activeTab !== AppTab.DASHBOARD && (
            <div className="text-center py-10">
              <p className="text-[8px] font-bold uppercase tracking-[0.4em] text-slate-200">BY ULBACH</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const SaidaForm = ({ listas, historico, vehiclesOut, onSuccess }: any) => {
  const [formData, setFormData] = useState({ veiculo: '', motorista: '', seguranca: '', kmSaida: '', destino: '' });
  const [loading, setLoading] = useState(false);

  // Busca o KM anterior (último retorno registrado) do veículo selecionado para orientação
  const lastKm = useMemo(() => {
    if (!formData.veiculo) return null;
    const records = historico
      .filter((h: any) => h.veiculo === formData.veiculo && h.kmRetorno !== undefined)
      .sort((a: any, b: any) => new Date(b.dataRetorno || '').getTime() - new Date(a.dataRetorno || '').getTime());
    return records[0]?.kmRetorno || null;
  }, [formData.veiculo, historico]);

  const isKmLowerThanLast = useMemo(() => {
    if (lastKm === null || !formData.kmSaida) return false;
    return Number(formData.kmSaida) < lastKm;
  }, [formData.kmSaida, lastKm]);
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.veiculo || !formData.motorista || !formData.kmSaida) return alert("Preencha os campos obrigatórios.");
    if (vehiclesOut.some((v:any) => v.veiculo === formData.veiculo)) return alert("Veículo já está fora!");
    
    // Alerta de segurança caso o KM informado seja menor que o anterior
    if (lastKm !== null && Number(formData.kmSaida) < lastKm) {
      const confirm = window.confirm(`Atenção: O KM informado é menor que o anterior (${lastKm}). Deseja prosseguir com esse valor?`);
      if (!confirm) return;
    }

    setLoading(true);
    const success = await sheetsService.salvarRegistro({...formData, kmSaida: Number(formData.kmSaida), dataSaida: new Date().toISOString(), status: 'FORA'});
    if (success) onSuccess(); else { alert("Erro ao salvar."); setLoading(false); }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
        <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center"><LogOut size={20} /></div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800">Registrar Saída</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Veículo</label>
          <select required className="w-full p-3.5 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-rose-400 focus:bg-white transition-all appearance-none" value={formData.veiculo} onChange={e => setFormData({...formData, veiculo: e.target.value})}><option value="">Selecione...</option>{listas.veiculos.map((v:any) => <option key={v} value={v}>{v}</option>)}</select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Motorista</label>
          <select required className="w-full p-3.5 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-rose-400 focus:bg-white transition-all appearance-none" value={formData.motorista} onChange={e => setFormData({...formData, motorista: e.target.value})}><option value="">Selecione...</option>{listas.motoristas.map((m:any) => <option key={m} value={m}>{m}</option>)}</select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">KM ATUAL</label>
          <input required type="number" placeholder="Digite o KM ATUAL" className={`w-full p-3.5 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:bg-white border transition-all ${isKmLowerThanLast ? 'border-rose-500 focus:border-rose-500 bg-rose-50' : 'border-transparent focus:border-rose-400'}`} value={formData.kmSaida} onChange={e => setFormData({...formData, kmSaida: e.target.value})} />
          <div className="flex justify-between items-center px-1 mt-1">
            {lastKm !== null && (
              <p className="text-[8px] font-bold text-rose-600 uppercase tracking-widest">KM ANTERIOR: {lastKm}</p>
            )}
            {isKmLowerThanLast && (
              <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest animate-pulse">⚠️ VALOR MENOR QUE O ANTERIOR!</p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Destino</label>
          <input required type="text" placeholder="Local de destino" className="w-full p-3.5 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:border-rose-400 focus:bg-white border border-transparent transition-all" value={formData.destino} onChange={e => setFormData({...formData, destino: e.target.value})} />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Segurança</label>
          <select required className="w-full p-3.5 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-rose-400 focus:bg-white border border-transparent transition-all appearance-none" value={formData.seguranca} onChange={e => setFormData({...formData, seguranca: e.target.value})}><option value="">Selecione...</option>{listas.segurancas.map((s:any) => <option key={s} value={s}>{s}</option>)}</select>
        </div>
      </div>

      <button disabled={loading} onClick={handleSubmit} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all mt-2">CONFIRMAR SAÍDA</button>
    </div>
  );
};

const RetornoForm = ({ listas, vehiclesOut, onSuccess }: any) => {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [kmRetorno, setKmRetorno] = useState('');
  const [motoristaRetorno, setMotoristaRetorno] = useState('');
  const [segurancaRetorno, setSegurancaRetorno] = useState('');
  const [loading, setLoading] = useState(false);
  
  const logRef = vehiclesOut.find((v:any) => v.veiculo === selectedVehicle);

  useEffect(() => {
    if (logRef) {
      setMotoristaRetorno(logRef.motorista);
      setSegurancaRetorno(logRef.seguranca);
    }
  }, [logRef]);

  const isKmLowerThanDeparture = useMemo(() => {
    if (!logRef || !kmRetorno) return false;
    return Number(kmRetorno) < logRef.kmSaida;
  }, [kmRetorno, logRef]);
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!logRef || !kmRetorno || !motoristaRetorno || !segurancaRetorno) return alert("Preencha todos os dados.");
    
    // Alerta de segurança caso o KM informado seja menor que o de saída
    if (Number(kmRetorno) < logRef.kmSaida) {
      const confirm = window.confirm(`Atenção: O KM informado é menor que o KM de saída (${logRef.kmSaida}). Deseja prosseguir?`);
      if (!confirm) return;
    }

    setLoading(true);
    const success = await sheetsService.salvarRegistro({
      veiculo: selectedVehicle, 
      motorista: motoristaRetorno, 
      seguranca: segurancaRetorno, 
      kmRetorno: Number(kmRetorno), 
      kmRodado: Number(kmRetorno) - logRef.kmSaida, 
      dataRetorno: new Date().toISOString(), 
      status: 'DISPONÍVEL'
    });
    if (success) onSuccess(); else { alert("Erro ao salvar."); setLoading(false); }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center"><LogIn size={20} /></div>
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800">Registrar Entrada</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Veículo</label>
          <select required className="w-full p-3.5 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-teal-500 focus:bg-white transition-all appearance-none" value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}><option value="">Selecione...</option>{vehiclesOut.map((v:any) => <option key={v.veiculo} value={v.veiculo}>{v.veiculo}</option>)}</select>
        </div>

        {logRef && (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between text-[9px] font-bold uppercase text-emerald-700">
            <div><span className="opacity-50">KM Saída:</span> {logRef.kmSaida}</div>
            <div className="text-right"><span className="opacity-50">Quem saiu:</span> {logRef.motorista}</div>
          </div>
        )}

        {selectedVehicle && (
          <>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                Motorista na Chegada
                <span className="text-teal-600 text-[8px] italic">(Pode alterar se mudou)</span>
              </label>
              <select required className="w-full p-3.5 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-teal-500 focus:bg-white transition-all appearance-none" value={motoristaRetorno} onChange={e => setMotoristaRetorno(e.target.value)}><option value="">Selecione...</option>{listas.motoristas.map((m:any) => <option key={m} value={m}>{m}</option>)}</select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">KM Atual de Retorno</label>
              <input required type="number" placeholder="Digite o KM final" className={`w-full p-3.5 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:bg-white border transition-all ${isKmLowerThanDeparture ? 'border-rose-500 focus:border-rose-500 bg-rose-50' : 'border-transparent focus:border-teal-500'}`} value={kmRetorno} onChange={e => setKmRetorno(e.target.value)} />
              {isKmLowerThanDeparture && (
                <div className="px-1 mt-1">
                  <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest animate-pulse">⚠️ VALOR MENOR QUE O KM DE SAÍDA!</p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                Segurança na Chegada
                <span className="text-teal-600 text-[8px] italic">(Pode alterar se mudou)</span>
              </label>
              <select required className="w-full p-3.5 bg-slate-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-teal-500 focus:bg-white transition-all appearance-none" value={segurancaRetorno} onChange={e => setSegurancaRetorno(e.target.value)}><option value="">Selecione...</option>{listas.segurancas.map((s:any) => <option key={s} value={s}>{s}</option>)}</select>
            </div>
          </>
        )}
      </div>

      <button disabled={loading || !selectedVehicle} onClick={handleSubmit} className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg active:scale-95 transition-all mt-2">REGISTRAR RETORNO</button>
    </div>
  );
};

const HistoricoCompleto = ({ historico }: any) => (
  <div className="space-y-4 animate-in fade-in duration-500 pb-10">
    <h2 className="font-bold text-slate-400 text-[9px] uppercase tracking-widest px-2">Histórico Completo</h2>
    {historico.slice().reverse().map((log:any, i:number) => (
      <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className={`absolute left-0 top-0 h-full w-1.5 ${log.status === 'FORA' ? 'bg-rose-400' : 'bg-emerald-400'}`}></div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm uppercase italic">{log.veiculo}</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{log.motorista}</p>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-md">
              {new Date(log.dataSaida).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 text-[9px] font-bold text-slate-500 uppercase">
          <div className="flex flex-col gap-1">
            <span className="text-slate-300 text-[8px]">Destino</span>
            <div className="flex items-center gap-1 truncate"><MapPin size={10} className="text-rose-400 shrink-0"/> {log.destino || '---'}</div>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-slate-300 text-[8px]">Status</span>
            <div className={log.status === 'FORA' ? 'text-rose-500' : 'text-emerald-500'}>{log.status === 'FORA' ? 'EM USO' : `${log.kmRodado} KM RODADOS`}</div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default App;
