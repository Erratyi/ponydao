// Local presentation model, not a production authorization boundary.
export const memberModes = ['owner', 'lead', 'opc'];
export function createSeedState(islands) {
  return {
    daos: islands.map(d=>({id:d.id,name:d.name,summary:'以产品和项目为载体，汇聚伙伴，共同推进。',logo:d.logo,theme:d.theme,ownerId:'mason',visibility:'published',goal:'',collaboration:''})),
    entities: islands.flatMap(d=>[
      {id:`${d.id}-product-1`,daoId:d.id,kind:'product',name:d.product,summary:'',visibility:'external'},
      ...d.projects.map((name,i)=>({id:`${d.id}-project-${i+1}`,daoId:d.id,kind:'project',name,summary:'',visibility:'external'})),
    ]), plans:[], tasks:[], activities:[],
  };
}
export function can(actor, action, target, state) {
  if (!actor || !memberModes.includes(actor.mode)) return false;
  if (action==='createDao') return actor.mode==='owner';
  const dao=state.daos.find(d=>d.id===target.daoId);
  if (!dao) return false;
  if (actor.mode==='owner') return dao.ownerId==='mason';
  if (action==='createEntity') return false;
  if (actor.entityId!==target.entityId) return false;
  if (actor.mode==='lead') return true;
  const entity=state.entities.find(e=>e.id===target.entityId);
  return ['startTask','submitTask'].includes(action) && target.assignee===(entity?.kind==='product'?'rd-opc':'delivery-opc');
}
export function projectDao(state,daoId,actor) {
  const dao=state.daos.find(d=>d.id===daoId);
  const internal=memberModes.includes(actor?.mode);
  if (!dao || (dao.visibility==='draft' && !internal)) return null;
  const all=state.entities.filter(e=>e.daoId===daoId);
  const entities=actor?.mode==='guest'?[]:all.filter(e=>internal||e.visibility==='external');
  const view={dao,actor,counts:{products:all.filter(e=>e.kind==='product').length,projects:all.filter(e=>e.kind==='project').length},entities,
    plans:internal?state.plans.filter(e=>e.daoId===daoId):[],tasks:internal?state.tasks.filter(e=>e.daoId===daoId):[],activities:internal?state.activities.filter(e=>e.daoId===daoId):[]};
  return structuredClone(view);
}
export function failure(code,fieldErrors={}) { return {ok:false,code,fieldErrors}; }
const text=v=>String(v??'').trim();
function planErrors(i) {
  const errors={};for(const key of ['name','startDate','endDate','criteria'])if(!text(i[key]))errors[key]='此项必填';
  for(const key of ['startDate','endDate']){
    const date=text(i[key]);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)errors[key]='请输入有效日期';
  }
  if(!errors.startDate&&!errors.endDate&&i.endDate<i.startDate)errors.endDate='结束日期不能早于开始日期';
  return errors;
}
function newPlan(i,id) {return {id,daoId:i.daoId,entityId:i.entityId,name:text(i.name),startDate:i.startDate,endDate:i.endDate,criteria:text(i.criteria),status:'未开始',explanation:''};}
function success(state,value,type,actor,meta) {
  state.activities.push({id:`${meta.id}-activity`,daoId:value.daoId||value.id,entityId:value.entityId||(type==='createEntity'?value.id:null),type,actorLabel:actor.mode==='owner'?'岛主':actor.mode==='lead'?'负责人（演示）':'OPC（演示）',createdAt:meta.now,subjectId:value.id});
  return {ok:true,state,value};
}
export function applyCommand(state,command,actor,meta) {
  const i=command.input||{};
  if(command.type==='createTask'){
    const entity=state.entities.find(e=>e.id===i.entityId&&e.daoId===i.daoId);if(!entity)return failure('NOT_FOUND');
    if(!can(actor,'createTask',i,state))return failure('FORBIDDEN');
    if(!state.plans.some(p=>p.entityId===entity.id))return failure('PLAN_REQUIRED');
    const errors={};if(!text(i.title))errors.title='请输入标题';if(!text(i.expected))errors.expected='请输入预期成果';
    if(i.planId&&!state.plans.some(p=>p.id===i.planId&&p.entityId===entity.id))errors.planId='请选择当前对象的计划';
    if(i.assignee!==(entity.kind==='product'?'rd-opc':'delivery-opc'))errors.assignee='请选择对应的 OPC 演示角色';
    if(Object.keys(errors).length)return failure('VALIDATION',errors);
    if(state.tasks.some(t=>t.id===meta.id))return failure('INVALID_TRANSITION');
    const next=structuredClone(state),task={id:meta.id,daoId:entity.daoId,entityId:entity.id,planId:i.planId||null,title:text(i.title),expected:text(i.expected),assignee:i.assignee,status:'待开始',history:[]};
    next.tasks.push(task);return success(next,task,command.type,actor,meta);
  }
  if(['startTask','submitTask','reviewTask'].includes(command.type)){
    const task=state.tasks.find(t=>t.id===i.taskId);if(!task)return failure('NOT_FOUND');
    if(!can(actor,command.type,task,state))return failure('FORBIDDEN');
    const next=structuredClone(state),value=next.tasks.find(t=>t.id===task.id);
    if(command.type==='startTask'){
      if(task.status!=='待开始')return failure('INVALID_TRANSITION');value.status='进行中';
    }
    if(command.type==='submitTask'){
      if(!['进行中','需修改'].includes(task.status))return failure('INVALID_TRANSITION');
      const url=text(i.url);let safe=true;
      if(url){try{safe=['http:','https:'].includes(new URL(url).protocol);}catch{safe=false;}}
      if(!safe)return failure('VALIDATION',{url:'仅支持完整的 http/https 链接'});
      if(!text(i.text)&&!url)return failure('VALIDATION',{text:'请填写成果说明或链接'});
      value.status='待确认';value.history.push({type:'submit',text:text(i.text),url,createdAt:meta.now});
    }
    if(command.type==='reviewTask'){
      if(task.status!=='待确认'||!['confirm','return'].includes(i.decision))return failure('INVALID_TRANSITION');
      if(i.decision==='return'&&!text(i.reason))return failure('VALIDATION',{reason:'退回需填写理由'});
      value.status=i.decision==='confirm'?'已完成':'需修改';value.history.push({type:i.decision,reason:text(i.reason),createdAt:meta.now});
    }
    return success(next,value,command.type,actor,meta);
  }
  if(command.type==='createEntity'){
    if(!can(actor,'createEntity',{daoId:i.daoId},state))return failure('FORBIDDEN');
    if(!['product','project'].includes(i.kind)||!text(i.name))return failure('VALIDATION',{name:'请输入名称',kind:'请选择产品或项目'});
    const errors=i.initialPlan?planErrors(i.initialPlan):{};if(Object.keys(errors).length)return failure('VALIDATION',Object.fromEntries(Object.entries(errors).map(([k,v])=>['initial_'+k,v])));
    if(state.entities.some(e=>e.id===meta.id))return failure('INVALID_TRANSITION');
    const next=structuredClone(state), entity={id:meta.id,daoId:i.daoId,kind:i.kind,name:text(i.name),summary:text(i.summary),visibility:'internal'};
    next.entities.push(entity);if(i.initialPlan)next.plans.push(newPlan({...i.initialPlan,daoId:i.daoId,entityId:entity.id},meta.id+'-plan'));
    return success(next,entity,command.type,actor,meta);
  }
  if(command.type==='createPlan'){
    const entity=state.entities.find(e=>e.id===i.entityId&&e.daoId===i.daoId);if(!entity)return failure('NOT_FOUND');
    if(!can(actor,'createPlan',i,state))return failure('FORBIDDEN');
    const errors=planErrors(i);if(Object.keys(errors).length)return failure('VALIDATION',errors);
    if(state.plans.some(e=>e.id===meta.id))return failure('INVALID_TRANSITION');
    const next=structuredClone(state),plan=newPlan(i,meta.id);next.plans.push(plan);return success(next,plan,command.type,actor,meta);
  }
  if(command.type==='setPlanStatus'){
    const plan=state.plans.find(p=>p.id===i.planId);if(!plan)return failure('NOT_FOUND');
    if(!can(actor,'setPlanStatus',plan,state))return failure('FORBIDDEN');
    if(!['进行中','已完成'].includes(i.status)||plan.status==='已完成'||plan.status===i.status)return failure('INVALID_TRANSITION');
    if(i.status==='已完成'&&state.tasks.some(t=>t.planId===plan.id&&t.status!=='已完成')&&!text(i.explanation))return failure('VALIDATION',{explanation:'关联任务仍未完成，请说明确认计划完成的原因'});
    const next=structuredClone(state),value=next.plans.find(p=>p.id===plan.id);value.status=i.status;value.explanation=text(i.explanation);
    return success(next,value,command.type,actor,meta);
  }
  if(command.type!=='createDao') return failure('INVALID_TRANSITION');
  if(!can(actor,'createDao',{},state)) return failure('FORBIDDEN');
  const name=text(i.name), summary=text(i.summary);
  if(!name||!summary) return failure('VALIDATION',{...(!name?{name:'请输入岛名'}:{}),...(!summary?{summary:'请输入简短介绍'}:{})});
  if(state.daos.some(d=>d.id===meta.id)) return failure('INVALID_TRANSITION');
  const next=structuredClone(state), dao={id:meta.id,name,summary,goal:i.goal||'',collaboration:i.collaboration||'',logo:i.logo||'',theme:'blue',ownerId:'mason',visibility:'draft'};
  next.daos.push(dao);
  return success(next,dao,command.type,actor,meta);
}
