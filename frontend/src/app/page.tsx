'use client';

import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

interface EventLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const [transport, setTransport] = useState<string>('N/A');
  const [logs, setLogs] = useState<EventLog[]>([]);

  const addLog = (message: string, type: EventLog['type'] = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [
      { id: Math.random().toString(), timestamp: time, type, message },
      ...prev.slice(0, 49),
    ]);
  };

  useEffect(() => {
    setIsMounted(true);

    function onConnect() {
      setIsConnected(true);
      setSocketId(socket.id);
      setTransport(socket.io.engine.transport.name);
      addLog(`Connected with Socket ID: ${socket.id}`, 'success');

      socket.io.engine.on('upgrade', (transport) => {
        setTransport(transport.name);
        addLog(`Transport upgraded to: ${transport.name}`, 'info');
      });
    }

    function onDisconnect(reason: string) {
      setIsConnected(false);
      setSocketId(undefined);
      setTransport('N/A');
      addLog(`Disconnected: ${reason}`, 'warning');
    }

    function onConnectError(error: Error) {
      addLog(`Connection error: ${error.message}`, 'error');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    if (socket.connected) {
      onConnect();
    } else {
      addLog('Connecting to backend WebSocket server...', 'info');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  const handleReconnect = () => {
    addLog('Initiating manual reconnect...', 'info');
    socket.disconnect();
    socket.connect();
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-600/15 blur-[100px] rounded-full pointer-events-none" />

      <main className="relative w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-indigo-400">
              Phase 0 — Transport Skeleton
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Meta-Office Spatial Audio
            </h1>
          </div>
          <div className="flex items-center space-x-2 bg-slate-950/60 border border-slate-800 rounded-full px-4 py-1.5 text-xs font-medium">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* System Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
              Client Socket ID
            </span>
            <span className="font-mono text-sm font-semibold text-indigo-300 mt-1 block truncate">
              {socketId || 'Not Connected'}
            </span>
          </div>
          <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold">
              Active Transport
            </span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="font-mono text-sm font-semibold text-cyan-300 uppercase">
                {transport}
              </span>
              {transport === 'websocket' && (
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/50 px-2 py-0.5 rounded font-mono">
                  Strict WS
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Event Log Box */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
            <span>Socket Event Log</span>
            <button
              onClick={handleReconnect}
              className="text-indigo-400 hover:text-indigo-300 hover:underline transition"
            >
              Force Reconnect
            </button>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 h-56 overflow-y-auto font-mono text-xs space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
            {logs.length === 0 ? (
              <span className="text-slate-600 italic">No events recorded yet...</span>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 text-slate-300">
                  <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                  <span
                    className={
                      log.type === 'success'
                        ? 'text-emerald-400'
                        : log.type === 'warning'
                        ? 'text-amber-400'
                        : log.type === 'error'
                        ? 'text-rose-400'
                        : 'text-indigo-400'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Phase 0 Acceptance Criteria Notice */}
        <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-4 text-xs text-indigo-200/90 leading-relaxed">
          <strong className="text-indigo-300 font-semibold block mb-1">
            Phase 0 Acceptance Verification:
          </strong>
          Open two browser tabs at <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 font-mono">http://localhost:3000</code>. Each tab will display its distinct Socket ID. Closing one tab will immediately log a disconnection on the server.
        </div>
      </main>
    </div>
  );
}
