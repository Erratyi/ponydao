import {renderCreateDao,renderEntityForm,renderWorkflowForm,renderPlanFinish,renderTaskResult,renderTaskReview} from './collaboration-ui.js';
export function mountCollaboration({root,store,getActor,setPreview,onNavigate,onRender}) {
  let dialog=null,draft={},step=1,trigger=null,type='dao',entity=null,plan=null,task=null;
  const close=()=>{dialog?.close();dialog?.remove();dialog=null;draft={};step=1;trigger?.focus();};
  const read=()=>{if(!dialog)return;const form=dialog.querySelector('form');if(!form)return;for(const [k,v] of new FormData(form)) if(typeof v==='string')draft[k]=v;if(form.elements.initial)draft.initial=form.elements.initial.checked;};
  const paint=errors=>{dialog.innerHTML=type==='dao'?renderCreateDao(step,draft,errors):type==='product'||type==='project'?renderEntityForm(type,draft,errors):type==='finish'?renderPlanFinish(plan,store.read().tasks,draft,errors):type==='submit'?renderTaskResult(task,draft,errors):['confirm','return'].includes(type)?renderTaskReview(task,type,draft,errors):renderWorkflowForm(type,entity,draft,errors);dialog.querySelector('input,textarea,button')?.focus();};
  const open=(target,kind)=>{type=kind;trigger=target;dialog=document.createElement('dialog');dialog.className='co-dialog';root.append(dialog);paint({});dialog.showModal();dialog.addEventListener('cancel',e=>{e.preventDefault();close();});};
  const dispatch=command=>store.dispatch(command,getActor(),{id:crypto.randomUUID(),now:new Date().toISOString()});
  const errorMessage=r=>r.code==='STORAGE_ERROR'?'保存失败，请检查浏览器本地存储；原状态已保留。':r.code==='FORBIDDEN'?'当前身份没有此操作权限。':'操作未完成，请检查当前状态或填写内容。';
  const runImmediate=command=>{
    const r=dispatch(command);
    if(r.ok){onRender();return;}
    root.querySelector('[data-co-error]')?.remove();
    root.insertAdjacentHTML('beforeend',`<p class="co-storage-notice" role="alert" data-co-error tabindex="-1">${errorMessage(r)}</p>`);
    root.querySelector('[data-co-error]')?.focus();
  };
  const click=e=>{
    const target=e.target.closest('[data-co]');if(!target)return;
    const action=target.dataset.co;
    if(action==='create-dao'){open(target,'dao');return;}
    if(action==='new-product'||action==='new-project'){open(target,action==='new-product'?'product':'project');return;}
    if(action==='new-plan'){entity=store.read().entities.find(x=>x.id===target.dataset.entity);if(entity)open(target,'plan');return;}
    if(action==='new-task'){entity=store.read().entities.find(x=>x.id===target.dataset.entity);if(entity){entity.plans=store.read().plans.filter(p=>p.entityId===entity.id);open(target,'task');}return;}
    if(action==='start-task'){runImmediate({type:'startTask',input:{taskId:target.dataset.task}});return;}
    if(['submit-task','confirm-task','return-task'].includes(action)){task=store.read().tasks.find(x=>x.id===target.dataset.task);if(task)open(target,action.split('-')[0]);return;}
    if(action==='start-plan'){runImmediate({type:'setPlanStatus',input:{planId:target.dataset.plan,status:'进行中'}});return;}
    if(action==='finish-plan'){plan=store.read().plans.find(x=>x.id===target.dataset.plan);if(plan)open(target,'finish');return;}
    if(!dialog)return;
    if(action==='close'){close();return;}
    read();
    if(action==='prev'){step--;paint({});}
    if(action==='next'){
      if(step===1&&(!draft.name?.trim()||!draft.summary?.trim())){paint({name:!draft.name?.trim()?'请输入岛名':'',summary:!draft.summary?.trim()?'请输入简短介绍':''});return;}
      step++;paint({});
    }
    if(action==='save'){
      const daoId=location.hash.split('/')[2];
      let command={type:'createDao',input:draft};
      if(type==='product'||type==='project')command={type:'createEntity',input:{daoId,kind:type,name:draft.name,summary:draft.summary,...(draft.initial?{initialPlan:{name:draft.initial_name,startDate:draft.initial_startDate,endDate:draft.initial_endDate,criteria:draft.initial_criteria}}:{})}};
      if(type==='plan')command={type:'createPlan',input:{...draft,daoId:entity.daoId,entityId:entity.id}};
      if(type==='finish')command={type:'setPlanStatus',input:{planId:plan.id,status:'已完成',explanation:draft.explanation}};
      if(type==='task')command={type:'createTask',input:{...draft,daoId:entity.daoId,entityId:entity.id,assignee:entity.kind==='product'?'rd-opc':'delivery-opc'}};
      if(type==='submit')command={type:'submitTask',input:{...draft,taskId:task.id}};
      if(type==='confirm'||type==='return')command={type:'reviewTask',input:{...draft,taskId:task.id,decision:type}};
      const r=dispatch(command);
      if(!r.ok){paint({...r.fieldErrors,_form:errorMessage(r)});return;}
      close();onRender();root.querySelector('[data-co="create-dao"]')?.focus();
    }
  };
  const change=async e=>{
    if(e.target.matches('[data-co-initial]')){read();paint({});return;}
    if(e.target.matches('[data-co-view]')){const daoId=location.hash.split('/')[2],entity=store.read().entities.find(x=>x.daoId===daoId);setPreview({mode:e.target.value,entityId:entity?.id});onRender();return;}
    if(e.target.matches('[data-co-scope]')){setPreview({...getActor(),entityId:e.target.value});onRender();return;}
    if(e.target.matches('[data-co-filter]')){root.querySelectorAll('[data-owner-entity]').forEach(row=>row.hidden=!!e.target.value&&row.dataset.ownerEntity!==e.target.value);return;}
    if(e.target.name!=='logoFile')return;read();const file=e.target.files?.[0];if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024){paint({_form:'请选择不超过 2 MB 的 PNG/JPEG/WebP 图片。'});return;}
    const reader=new FileReader();reader.onload=()=>{if(dialog){draft.logo=reader.result;paint({});}};reader.readAsDataURL(file);
  };
  const submit=e=>{if(e.target.id==='co-form')e.preventDefault();};
  root.addEventListener('click',click);root.addEventListener('change',change);root.addEventListener('submit',submit);
  return ()=>{close();root.removeEventListener('click',click);root.removeEventListener('change',change);root.removeEventListener('submit',submit);};
}
