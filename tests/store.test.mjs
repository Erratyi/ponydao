import test from 'node:test';
import assert from 'node:assert/strict';
import {islands, memoryStorage, loadModule, actor, meta} from './fixtures.mjs';
const m=await loadModule('../collaboration.js'), db=await loadModule('../collaboration-store.js');
const seed=()=>{assert.equal(typeof m.createSeedState,'function');return m.createSeedState(islands);};
test('empty storage reads truthful seed and no activity',()=>{
  assert.equal(typeof db.createStore,'function'); const store=db.createStore(memoryStorage(),seed());
  assert.equal(store.read().entities.length,8); assert.equal(store.read().activities.length,0);
});
for(const raw of ['bad json','{"version":99}','{"version":1,"daos":"bad"}']) test('invalid stored data preserved: '+raw,()=>{
  assert.equal(typeof db.createStore,'function'); const storage=memoryStorage({'ponydao-collaboration-v1':raw});
  const store=db.createStore(storage,seed()); assert.ok(store.getNotice());
  assert.equal(store.dispatch({type:'createDao',input:{}},actor('owner'),meta()).code,'STORAGE_ERROR');
  assert.equal(storage.getItem('ponydao-collaboration-v1'),raw);
});
test('failed writes preserve current state',()=>{
  assert.equal(typeof db.createStore,'function');const storage=memoryStorage();
  storage.setItem=()=>{throw Error('quota');}; const store=db.createStore(storage,seed());
  const before=store.read(); const r=store.dispatch({type:'createDao',input:{name:'验收',summary:'本地'}},actor('owner'),meta());
  assert.equal(r.code,'STORAGE_ERROR');assert.deepEqual(store.read(),before);
});
test('reload restores full collaboration lifecycle without altering seed facts',()=>{
 const storage=memoryStorage(),store=db.createStore(storage,seed()),dispatch=(type,input,id,mode='owner')=>{
  const r=store.dispatch({type,input},actor(mode,'xiaoma-product-1'),meta(id));assert.equal(r.ok,true);return r;
 };
 dispatch('createDao',{name:'验收岛',summary:'本地'},'d1');
 dispatch('createEntity',{daoId:'d1',kind:'product',name:'验收产品'},'e1');
 dispatch('createPlan',{daoId:'xiaoma',entityId:'xiaoma-product-1',name:'计划',startDate:'2026-10-01',endDate:'2026-10-03',criteria:'完成验收'},'p1');
 dispatch('createTask',{daoId:'xiaoma',entityId:'xiaoma-product-1',title:'任务',expected:'说明',assignee:'rd-opc',planId:'p1'},'t1');
 dispatch('startTask',{taskId:'t1'},'a1','opc');dispatch('submitTask',{taskId:'t1',text:'第一稿'},'a2','opc');
 dispatch('reviewTask',{taskId:'t1',decision:'return',reason:'完善'},'a3');
 const restored=db.createStore(storage,seed()).read();assert.deepEqual(restored,store.read());
 assert.equal(restored.tasks[0].status,'需修改');assert.equal(restored.tasks[0].history[1].reason,'完善');
 assert.equal(restored.entities.find(e=>e.id==='xiaoma-product-1').name,'行为数据采集电子标签');
});
test('semantically malformed records cause readonly recovery instead of crashing a view',()=>{
 const raw=JSON.stringify({version:1,daos:[],entities:[],plans:[],tasks:[{id:'orphan'}],activities:[]});
 const storage=memoryStorage({'ponydao-collaboration-v1':raw}),store=db.createStore(storage,seed());
 assert.ok(store.getNotice());assert.equal(store.read().tasks.length,0);assert.equal(storage.getItem('ponydao-collaboration-v1'),raw);
});
