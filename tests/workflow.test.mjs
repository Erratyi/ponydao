import test from 'node:test';import assert from 'node:assert/strict';
import {islands,actor,meta} from './fixtures.mjs';import {createSeedState,applyCommand,projectDao} from '../collaboration.js';import * as ui from '../collaboration-ui.js';
const seed=()=>createSeedState(islands),own=actor('owner'),eid='xiaoma-product-1';
const plan={daoId:'xiaoma',entityId:eid,name:'验收计划',startDate:'2026-10-01',endDate:'2026-10-10',criteria:'完成本地演示验收'};
const run=(s,type,input,a=own,id='p1')=>applyCommand(s,{type,input},a,meta(id));
test('multiple new products/projects are parallel internal drafts',()=>{
 let s=seed();for(const [id,kind] of [['e1','product'],['e2','project'],['e3','product']]){
  const r=run(s,'createEntity',{daoId:'xiaoma',kind,name:id},own,id);assert.equal(r.ok,true);s=r.state;
 }
 assert.deepEqual(projectDao(s,'xiaoma',own).counts,{products:3,projects:2});assert.equal(projectDao(s,'xiaoma',actor('nonmember')).entities.length,2);
});
test('invalid initial plan saves neither entity nor plan',()=>{
 const s=seed(),r=run(s,'createEntity',{daoId:'xiaoma',kind:'product',name:'测试',initialPlan:{...plan,endDate:'2026-09-01'}},own,'e1');
 assert.equal(r.code,'VALIDATION');assert.equal(s.entities.length,8);assert.equal(s.plans.length,0);
});
test('valid initial plan atomically binds to the new entity',()=>{
 const r=run(seed(),'createEntity',{daoId:'xiaoma',kind:'project',name:'验收',initialPlan:plan},own,'e1');assert.equal(r.ok,true);
 assert.equal(r.state.plans[0].entityId,'e1');assert.equal(r.state.plans[0].status,'未开始');
});
test('plans allow overlapping dates but reject reversed or invalid dates and missing criteria',()=>{
 const first=run(seed(),'createPlan',plan);assert.equal(first.ok,true);
 assert.equal(run(first.state,'createPlan',{...plan,name:'并行'},own,'p2').ok,true);
 for(const bad of [{endDate:'2026-09-30'},{startDate:'2026-02-31'},{criteria:''}])assert.equal(run(seed(),'createPlan',{...plan,...bad}).code,'VALIDATION');
});
test('lead can create own plan but not another object and OPC cannot create',()=>{
 assert.equal(run(seed(),'createPlan',plan,actor('lead',eid)).ok,true);
 assert.equal(run(seed(),'createPlan',plan,actor('lead','xiaoma-project-1')).code,'FORBIDDEN');
 assert.equal(run(seed(),'createPlan',plan,actor('opc',eid)).code,'FORBIDDEN');
});
test('plan completion needs explanation for pending linked tasks and never changes task state',()=>{
 const s=run(seed(),'createPlan',plan).state;
 s.tasks.push({id:'t1',daoId:'xiaoma',entityId:eid,planId:'p1',status:'进行中'});
 s.tasks.push({id:'t2',daoId:'xiaoma',entityId:eid,planId:null,status:'待开始'});
 assert.equal(run(s,'setPlanStatus',{planId:'p1',status:'已完成'}).code,'VALIDATION');
 const r=run(s,'setPlanStatus',{planId:'p1',status:'已完成',explanation:'按阶段标准完成，遗留任务继续处理'},own,'finish');
 assert.equal(r.ok,true);assert.equal(r.state.plans[0].status,'已完成');assert.deepEqual(r.state.tasks.map(t=>t.status),['进行中','待开始']);
});
test('all completed tasks do not auto-complete a plan',()=>{
 const s=run(seed(),'createPlan',plan).state;s.tasks.push({id:'t1',daoId:'xiaoma',entityId:eid,planId:'p1',status:'已完成'});
 assert.equal(projectDao(s,'xiaoma',own).plans[0].status,'未开始');
});
test('entity form retains optional initial planning and appropriate lead label',()=>{
 assert.equal(typeof ui.renderEntityForm,'function');
 const html=ui.renderEntityForm('project',{name:'新项目',initial:true,initial_name:'阶段一'},{});
 assert.ok(html.includes('交付负责人'));assert.ok(html.includes('阶段一'));assert.ok(html.includes('新项目'));
});
test('plan form fixes entity affiliation and retains date validation errors',()=>{
 assert.equal(typeof ui.renderWorkflowForm,'function');
 const html=ui.renderWorkflowForm('plan',{id:eid,name:'电子标签',kind:'product'},{startDate:'2026-10-01'},{endDate:'日期倒序'});
 assert.ok(html.includes('电子标签'));assert.ok(html.includes('日期倒序'));assert.ok(html.includes('2026-10-01'));
});
const taskInput={daoId:'xiaoma',entityId:eid,title:'本地演示任务',expected:'说明或链接',assignee:'rd-opc',planId:'p1'};
function withTask(){const s=run(seed(),'createPlan',plan).state;const r=run(s,'createTask',taskInput,own,'t1');assert.equal(r.ok,true);return r.state;}
test('task requires recorded plan even when independent',()=>{
 assert.equal(run(seed(),'createTask',{...taskInput,planId:null},own,'t1').code,'PLAN_REQUIRED');
 const s=run(seed(),'createPlan',plan).state;const r=run(s,'createTask',{...taskInput,planId:null},own,'t1');assert.equal(r.ok,true);assert.equal(r.value.planId,null);
});
test('cross-object plan association and mismatched OPC role are rejected',()=>{
 const s=run(seed(),'createPlan',plan).state;
 assert.equal(run(s,'createTask',{...taskInput,planId:'other'},own,'t1').code,'VALIDATION');
 assert.equal(run(s,'createTask',{...taskInput,assignee:'delivery-opc'},own,'t1').code,'VALIDATION');
});
test('OPC can update assigned object only, not others or review results',()=>{
 const s=withTask();assert.equal(run(s,'startTask',{taskId:'t1'},actor('opc','xiaoma-project-1'),'start').code,'FORBIDDEN');
 assert.equal(run(s,'startTask',{taskId:'t1'},actor('opc',eid),'start').ok,true);
 assert.equal(run(s,'reviewTask',{taskId:'t1',decision:'confirm'},actor('opc',eid),'review').code,'FORBIDDEN');
});
test('submit needs an active task and text or safe URL, blocks repeat submission',()=>{
 const s=withTask(),opc=actor('opc',eid);
 assert.equal(run(s,'submitTask',{taskId:'t1',text:'未开始'},opc,'submit').code,'INVALID_TRANSITION');
 const active=run(s,'startTask',{taskId:'t1'},opc,'start').state;
 assert.equal(run(active,'submitTask',{taskId:'t1'},opc,'submit').code,'VALIDATION');
 assert.equal(run(active,'submitTask',{taskId:'t1',url:'javascript:alert(1)'},opc,'submit').code,'VALIDATION');
 const r=run(active,'submitTask',{taskId:'t1',url:'https://example.com/result'},opc,'submit');assert.equal(r.value.status,'待确认');
 const count=r.state.activities.length;assert.equal(run(r.state,'submitTask',{taskId:'t1',text:'再次'},opc,'again').code,'INVALID_TRANSITION');assert.equal(r.state.activities.length,count);
});
test('return with reason, resubmit and owner confirmation preserve history',()=>{
 const opc=actor('opc',eid);let s=withTask();s=run(s,'startTask',{taskId:'t1'},opc,'start').state;
 s=run(s,'submitTask',{taskId:'t1',text:'第一版'},opc,'submit').state;
 assert.equal(run(s,'reviewTask',{taskId:'t1',decision:'return'},own,'return').code,'VALIDATION');
 assert.equal(run(s,'reviewTask',{taskId:'t1',decision:'confirm'},actor('lead','xiaoma-project-1'),'review').code,'FORBIDDEN');
 s=run(s,'reviewTask',{taskId:'t1',decision:'return',reason:'补充说明'},own,'return').state;
 assert.equal(s.tasks[0].status,'需修改');assert.equal(s.tasks[0].history[1].reason,'补充说明');
 s=run(s,'submitTask',{taskId:'t1',text:'第二版'},opc,'again').state;
 const r=run(s,'reviewTask',{taskId:'t1',decision:'confirm'},own,'confirm');assert.equal(r.value.status,'已完成');assert.equal(r.value.history.length,4);assert.equal(r.state.plans[0].status,'未开始');
});
test('task form and result form represent independent tasks and safe result links',()=>{
 const s=run(seed(),'createPlan',plan).state;
 assert.ok(ui.renderWorkflowForm('task',{id:eid,name:'标签',kind:'product',plans:s.plans},{},{}).includes('独立任务'));
 assert.equal(typeof ui.renderTaskResult,'function');assert.ok(ui.renderTaskResult({title:'验收'},{text:'<script>x</script>'},{}).includes('&lt;script&gt;'));
});
