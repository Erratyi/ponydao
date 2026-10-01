import { applyCommand, failure } from './collaboration.js';
const key='ponydao-collaboration-v1';
const fields=['daos','entities','plans','tasks','activities'];
const str=v=>typeof v==='string';
function validState(s) {
  if(!fields.every(f=>new Set(s[f].map(x=>x.id)).size===s[f].length))return false;
  const entityFor=x=>s.entities.find(e=>e.id===x.entityId&&e.daoId===x.daoId);
  if(!s.daos.every(d=>str(d.name)&&str(d.summary)&&str(d.logo)&&str(d.goal)&&str(d.collaboration)&&['published','draft'].includes(d.visibility)&&d.ownerId==='mason'&&['ink','blue','gold'].includes(d.theme)))return false;
  if(!s.entities.every(e=>str(e.name)&&str(e.summary)&&s.daos.some(d=>d.id===e.daoId)&&['product','project'].includes(e.kind)&&['external','internal'].includes(e.visibility)))return false;
  if(!s.plans.every(p=>entityFor(p)&&str(p.name)&&str(p.criteria)&&str(p.explanation)&&str(p.startDate)&&str(p.endDate)&&Number.isFinite(Date.parse(p.startDate))&&Number.isFinite(Date.parse(p.endDate))&&p.startDate<=p.endDate&&['未开始','进行中','已完成'].includes(p.status)))return false;
  if(!s.tasks.every(t=>entityFor(t)&&str(t.title)&&str(t.expected)&&['rd-opc','delivery-opc'].includes(t.assignee)&&['待开始','进行中','待确认','已完成','需修改'].includes(t.status)&&(!t.planId||s.plans.some(p=>p.id===t.planId&&p.entityId===t.entityId))&&Array.isArray(t.history)&&t.history.every(x=>['submit','confirm','return'].includes(x.type)&&str(x.createdAt)&&(x.type==='submit'?str(x.text)&&str(x.url):str(x.reason)))))return false;
  return s.activities.every(a=>s.daos.some(d=>d.id===a.daoId)&&(!a.entityId||entityFor(a))&&str(a.actorLabel)&&str(a.type)&&str(a.createdAt)&&Number.isFinite(Date.parse(a.createdAt)));
}
export function createStore(storage,seed) {
  let current=structuredClone(seed), notice='', blocked=false;
  try {
    const raw=storage.getItem(key);
    if(raw) {
      const saved=JSON.parse(raw);
      if(saved.version!==1 || !fields.every(f=>Array.isArray(saved[f]))) throw Error('format');
      for(const f of fields) {
        if(saved[f].some(e=>!e || typeof e.id!=='string')) throw Error('format');
        // Seed facts are never overwritten by local data.
        current[f].push(...saved[f].filter(e=>!seed[f].some(s=>s.id===e.id)));
      }
      if(!validState(current))throw Error('record shape');
    }
  } catch { current=structuredClone(seed); notice='本地资料无法读取，已保留原记录；当前只读浏览。'; blocked=true; }
  return {
    read:()=>structuredClone(current), getNotice:()=>notice,
    dispatch(command,actor,meta) {
      if(blocked) return failure('STORAGE_ERROR');
      const r=applyCommand(current,command,actor,meta);
      if(!r.ok) return r;
      const saved={version:1};
      for(const f of fields) saved[f]=r.state[f].filter(e=>!seed[f].some(s=>s.id===e.id));
      try { storage.setItem(key,JSON.stringify(saved)); } catch { return failure('STORAGE_ERROR'); }
      current=r.state; return r;
    },
  };
}
