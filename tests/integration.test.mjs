import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as data from '../data.js';
import * as model from '../collaboration.js';
import {createStore} from '../collaboration-store.js';
import * as ui from '../collaboration-ui.js';
import {mountCollaboration} from '../collaboration-controller.js';
import {memoryStorage,meta} from './fixtures.mjs';

// Browser shell adapters only: run the actual main.js with the real model/store/UI.
function boot({hash='#/dao/xiaoma',signedIn=true,storage=memoryStorage()}={}) {
  const root={innerHTML:'',addEventListener(){},removeEventListener(){},querySelector(){return null;},insertAdjacentHTML(_,html){this.innerHTML+=html;}};
  const documentListeners={};
  const document={title:'',querySelector:s=>s==='#app'?root:null,addEventListener(name,fn){(documentListeners[name]??=[]).push(fn);}};
  const location={hash},sessionStorage=memoryStorage();
  if(signedIn)data.startDemoSession(sessionStorage);
  let controller;
  const sandbox={...data,...model,...ui,h:ui.escapeHtml,createStore,
    mountCollaboration:options=>{controller=options;return ()=>{};},
    document,location,sessionStorage,structuredClone,
    window:{localStorage:storage,addEventListener(){},scrollTo(){}},requestAnimationFrame:fn=>fn()};
  const code=readFileSync(new URL('../main.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
  runInNewContext(code,sandbox);
  return {root,document,location,sessionStorage,controller:()=>controller,click:event=>documentListeners.click.forEach(fn=>fn(event))};
}
function draftStorage() {
  const storage=memoryStorage(),store=createStore(storage,model.createSeedState(data.islands));
  assert.equal(store.dispatch({type:'createDao',input:{name:'Private Draft',summary:'内部草稿'}},{mode:'owner'},meta('private')).ok,true);
  return storage;
}
test('personal center creation uses signed-in account, not detail preview role',()=>{
  const app=boot();
  for(const mode of ['nonmember','guest','lead','opc']) {
    app.controller().setPreview({mode,entityId:'xiaoma-product-1'});
    app.location.hash='#/hub/dao';app.controller().onRender();
    assert.equal(app.controller().getActor().mode,'owner');
    assert.equal(app.controller().store.dispatch({type:'createDao',input:{name:'Test '+mode,summary:'验收'}},app.controller().getActor(),meta(mode)).ok,true);
  }
});
test('restricted draft preview retains recovery selector without exposing draft content',()=>{
  const app=boot({hash:'#/dao/private',storage:draftStorage()});
  for(const mode of ['nonmember','guest']) {
    app.controller().setPreview({mode});app.controller().onRender();
    assert.ok(app.root.innerHTML.includes('data-co-view'));
    assert.ok(app.root.innerHTML.includes('当前演示视角无法访问本地草稿'));
    assert.equal(app.root.innerHTML.includes('Private Draft'),false);
  }
  app.controller().setPreview({mode:'owner'});app.controller().onRender();
  assert.ok(app.root.innerHTML.includes('Private Draft'));
});
test('unauthorized draft title uses the same read projection as page content',()=>{
  const app=boot({hash:'#/dao/private',signedIn:false,storage:draftStorage()});
  assert.equal(app.document.title.includes('Private Draft'),false);
  assert.ok(app.document.title.includes('页面未找到'));
});
test('logout clears detail preview before subsequent signed-in browsing',()=>{
  const app=boot();app.controller().setPreview({mode:'lead',entityId:'xiaoma-product-1'});
  app.click({target:{closest:selector=>selector==='[data-logout]'?{}:null},preventDefault(){}});
  assert.equal(data.isDemoSignedIn(app.sessionStorage),false);
  assert.equal(app.controller().getActor().mode,'guest');
  data.startDemoSession(app.sessionStorage);app.location.hash='#/dao/xiaoma';app.controller().onRender();
  assert.equal(app.controller().getActor().mode,'owner');
});
for(const action of ['start-plan','start-task'])test(`${action} reports storage failure and leaves status unchanged`,()=>{
  let state=model.createSeedState(data.islands);
  state=model.applyCommand(state,{type:'createPlan',input:{daoId:'xiaoma',entityId:'xiaoma-product-1',name:'阶段',startDate:'2026-10-01',endDate:'2026-10-02',criteria:'完成'}},{mode:'owner'},meta('p')).state;
  state=model.applyCommand(state,{type:'createTask',input:{daoId:'xiaoma',entityId:'xiaoma-product-1',title:'任务',expected:'成果',assignee:'rd-opc'}},{mode:'owner'},meta('t')).state;
  const store=createStore({getItem(){return null;},setItem(){throw Error('quota');}},state);
  const listeners={},root={innerHTML:'',addEventListener:(name,fn)=>listeners[name]=fn,removeEventListener(){},querySelector(){return null;},insertAdjacentHTML(_,html){this.innerHTML+=html;}};
  const dispose=mountCollaboration({root,store,getActor:()=>({mode:'owner'}),onRender:()=>assert.fail('failed save must not report success')});
  listeners.click({target:{closest:()=>({dataset:{co:action,plan:'p',task:'t'}})}});
  assert.ok(root.innerHTML.includes('role="alert"'));
  assert.ok(root.innerHTML.includes('保存失败'));
  assert.equal(store.read().plans[0].status,'未开始');
  assert.equal(store.read().tasks[0].status,'待开始');
  dispose();
});
