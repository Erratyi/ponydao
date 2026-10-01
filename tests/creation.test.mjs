import test from 'node:test';import assert from 'node:assert/strict';
import {islands,actor,meta,loadModule,memoryStorage} from './fixtures.mjs';
import {createSeedState,applyCommand,projectDao} from '../collaboration.js';
import {createStore} from '../collaboration-store.js';
const ui=await loadModule('../collaboration-ui.js');
test('dao requires trimmed name and summary',()=>{
 const r=applyCommand(createSeedState(islands),{type:'createDao',input:{name:' ',summary:''}},actor('owner'),meta());
 assert.equal(r.code,'VALIDATION');assert.ok(r.fieldErrors.name&&r.fieldErrors.summary);
});
test('new DAO is a local draft with zero content and immutable seed',()=>{
 const s=createSeedState(islands),before=JSON.stringify(s); const r=applyCommand(s,{type:'createDao',input:{name:'测试岛',summary:'本地验收'}},actor('owner'),meta('draft'));
 assert.equal(r.ok,true);assert.equal(r.value.visibility,'draft');assert.equal(JSON.stringify(s),before);
 assert.equal(projectDao(r.state,'draft',actor('guest')),null);
 assert.deepEqual(projectDao(r.state,'draft',actor('owner')).counts,{products:0,projects:0});
});
test('unsafe text renders as text in preview',()=>{
 assert.equal(typeof ui.renderCreateDao,'function');
 const html=ui.renderCreateDao(3,{name:'<script>alert(1)</script>',summary:'安全'});
 assert.equal(html.includes('<script>'),false);assert.ok(html.includes('&lt;script&gt;'));
});
test('field errors and prior input are retained in create dialog',()=>{
 assert.equal(typeof ui.renderCreateDao,'function');
 const html=ui.renderCreateDao(1,{name:'保留输入',summary:''},{summary:'请输入简短介绍'});
 assert.ok(html.includes('保留输入'));assert.ok(html.includes('请输入简短介绍'));
});
test('draft persists after reload without appearing in public discovery',()=>{
 const storage=memoryStorage(),s=createSeedState(islands);const store=createStore(storage,s);
 store.dispatch({type:'createDao',input:{name:'测试岛',summary:'本地'}},actor('owner'),meta('draft'));
 const restored=createStore(storage,s).read();assert.equal(restored.daos.length,4);
 assert.equal(restored.daos.filter(d=>d.visibility==='published').length,3);
});
