import React, { useState } from 'react';
import { usePersistentStore } from '../state/persistentStore';

export default function AgentPanel() {
  const { agents, updateAgent, models, addModel, removeModel, assignModelToAgent } = usePersistentStore();
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModel, setNewModel] = useState({ name: '', source: '', endpoint: '', assignTo: 'all' });

  const handleAddModel = () => {
    if (!newModel.name || !newModel.endpoint) return;
    const modelId = `model-${Date.now()}`;
    addModel({
      id: modelId,
      name: newModel.name,
      source: newModel.source,
      endpoint: newModel.endpoint,
      assignedTo: [newModel.assignTo],
    });
    
    if (newModel.assignTo !== 'none') {
      if (newModel.assignTo === 'all') {
        agents.forEach(a => assignModelToAgent(a.id, modelId));
      } else {
        assignModelToAgent(newModel.assignTo, modelId);
      }
    }
    
    setShowAddModel(false);
    setNewModel({ name: '', source: '', endpoint: '', assignTo: 'all' });
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 'bold' }}>🤖 Agent Swarm Config</div>
        <button 
          onClick={() => setShowAddModel(!showAddModel)}
          style={{ padding: '6px 12px', background: 'rgba(0,255,178,0.1)', border: '1px solid rgba(0,255,178,0.3)', color: '#00FFB2', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontFamily: "'DM Mono', monospace" }}
        >
          {showAddModel ? 'İptal' : '+ Yeni Model Ekle'}
        </button>
      </div>

      {showAddModel && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,255,178,0.3)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#00FFB2' }}>Yeni Yerel Model Tanımla</div>
          
          <input 
            placeholder="Model Adı (ör. Llama 3 8B)" 
            value={newModel.name} 
            onChange={e => setNewModel({...newModel, name: e.target.value})}
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
          />
          <input 
            placeholder="Model Kaynağı (ör. Ollama, NIM API)" 
            value={newModel.source} 
            onChange={e => setNewModel({...newModel, source: e.target.value})}
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
          />
          <input 
            placeholder="Endpoint (ör. http://localhost:11434/v1)" 
            value={newModel.endpoint} 
            onChange={e => setNewModel({...newModel, endpoint: e.target.value})}
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
          />
          
          <select 
            value={newModel.assignTo} 
            onChange={e => setNewModel({...newModel, assignTo: e.target.value})}
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
          >
            <option value="none">Sadece Ekle (Atama Yapma)</option>
            <option value="all">Tüm Ajanlara Ata</option>
            {agents.map(a => <option key={a.id} value={a.id}>Sadece {a.name}</option>)}
          </select>
          
          <button 
            onClick={handleAddModel}
            style={{ padding: '8px', background: 'linear-gradient(135deg, #00FFB2, #009E70)', border: 'none', color: '#000', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Kaydet ve Etkinleştir
          </button>
        </div>
      )}

      {/* Models List */}
      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>Kayıtlı Modeller</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {models.filter(m => m.id !== 'default-local').map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{m.name}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{m.endpoint}</div>
              </div>
              <button 
                onClick={() => removeModel(m.id)}
                style={{ background: 'rgba(255,77,109,0.2)', border: '1px solid rgba(255,77,109,0.4)', color: '#FF4D6D', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
              >
                Sil
              </button>
            </div>
          ))}
          {models.filter(m => m.id !== 'default-local').length === 0 && (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Özel model bulunmuyor.</div>
          )}
        </div>
      </div>
      
      {agents.map(agent => (
        <div key={agent.id} style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{agent.name}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Role: {agent.role}</div>
            </div>
            <div 
              style={{ padding: '4px 12px', borderRadius: '12px', background: agent.enabled ? 'rgba(0,255,0,0.2)' : 'rgba(255,0,0,0.2)', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', color: agent.enabled ? '#00FFB2' : '#FF4D6D' }}
              onClick={() => updateAgent(agent.id, { enabled: !agent.enabled })}
            >
              {agent.enabled ? 'ACTIVE' : 'INACTIVE'}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>Model Ataması</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select 
                value={agent.modelAssignmentType === 'default' ? 'default' : agent.assignedModelId || 'default'}
                onChange={(e) => assignModelToAgent(agent.id, e.target.value)}
                style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', borderRadius: '4px', color: '#fff', fontSize: '11px' }}
              >
                <option value="default">Kendi Yerel Modelini (Default Local LLM) Kullan</option>
                {models.filter(m => m.id !== 'default-local').map(m => (
                  <option key={m.id} value={m.id}>Admin Tarafından Atanan Model: {m.name}</option>
                ))}
              </select>
              {agent.modelAssignmentType === 'assigned' && agent.assignedModelId && agent.assignedModelId !== 'default-local' && (
                <button 
                  onClick={() => removeModel(agent.assignedModelId!)}
                  style={{ background: 'rgba(255,77,109,0.2)', border: '1px solid rgba(255,77,109,0.4)', color: '#FF4D6D', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Seçili Modeli Sil
                </button>
              )}
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Güven Eşiği (Confidence Threshold)</span>
              <span>{agent.confidenceThreshold}%</span>
            </label>
            <input 
              type="range" 
              min="0" max="100" 
              value={agent.confidenceThreshold}
              onChange={(e) => updateAgent(agent.id, { confidenceThreshold: parseInt(e.target.value) })}
              style={{ width: '100%', marginTop: '8px', accentColor: '#00FFB2' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
