import {can,memberModes} from './collaboration.js';
export const escapeHtml = text => String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const h=escapeHtml;
export function safeResultUrl(text) {
  try {const u=new URL(text);return ['http:','https:'].includes(u.protocol)?u.href:null;} catch{return null;}
}
export const btn=(label,attrs='',primary=false)=>`<button type="button" class="button ${primary?'button-primary':'button-outline'}" ${attrs}>${label}</button>`;
export function field(name,label,draft={},errors={},type='text') {
  const error=errors[name];
  return `<label class="co-field">${h(label)}${type==='textarea'?`<textarea name="${name}" rows="3" ${error?'aria-invalid="true"':''}>${h(draft[name])}</textarea>`:`<input name="${name}" type="${type}" value="${h(draft[name])}" ${error?'aria-invalid="true"':''} />`}${error?`<small class="co-error">${h(error)}</small>`:''}</label>`;
}
export function renderCreateDao(step,draft={},errors={}) {
  const content=step===1?`${field('name','岛名 *',draft,errors)}${field('summary','简短介绍 *',draft,errors,'textarea')}<label class="co-field">Logo（选填，PNG/JPEG/WebP，最大 2 MB）<input type="file" name="logoFile" accept="image/png,image/jpeg,image/webp" /></label>${draft.logo?`<img class="co-logo-preview" src="${h(draft.logo)}" alt="Logo 预览" />`:''}`:step===2?`${field('goal','目标（选填）',draft,errors,'textarea')}${field('collaboration','协作说明（选填，对外可读）',draft,errors,'textarea')}`:`<div class="co-preview"><span class="co-badge">本地草稿</span><h3>${h(draft.name)}</h3><p>${h(draft.summary)}</p>${draft.goal?`<h4>目标</h4><p>${h(draft.goal)}</p>`:''}${draft.collaboration?`<h4>协作说明</h4><p>${h(draft.collaboration)}</p>`:''}</div><p class="co-hint">仅在当前浏览器保存，不会出现在公开发现页。</p>`;
  return `<h2>创建共创岛</h2><ol class="co-wizard-steps">${['基本信息','目标与协作','预览保存'].map((t,i)=>`<li class="${i+1===step?'current':''}">${i+1}　${t}</li>`).join('')}</ol><form id="co-form" novalidate>${content}<p class="co-error" role="alert">${h(errors._form)}</p><div class="co-form-actions">${btn('取消','data-co="close"')}${step>1?btn('上一步','data-co="prev"'):''}${btn(step===3?'保存共创岛':'下一步',`data-co="${step===3?'save':'next'}"`,true)}</div></form>`;
}
const formEnd=errors=>`<p class="co-error" role="alert">${h(errors._form)}</p><div class="co-form-actions">${btn('取消','data-co="close"')}${btn('保存','data-co="save"',true)}</div></form>`;
function planFields(draft,errors,prefix='') {
  return [['name','计划名称 *','text'],['startDate','开始日期 *','date'],['endDate','结束日期 *','date'],['criteria','阶段完成标准 *','textarea']].map(([k,l,t])=>field(prefix+k,l,draft,errors,t)).join('');
}
export function renderEntityForm(kind,draft={},errors={}) {
  return `<h2>新建${kind==='product'?'产品':'项目'}</h2><form id="co-form" novalidate>${field('name','名称 *',draft,errors)}${field('summary','介绍（选填）',draft,errors,'textarea')}<p class="co-hint">${kind==='product'?'研发负责人':'交付负责人'}：暂由岛主管理。新增资料为内部草稿，全岛成员可读。</p><label class="co-check"><input type="checkbox" name="initial" data-co-initial ${draft.initial?'checked':''} /> 同时录入初始计划（可稍后补充）</label>${draft.initial?planFields(draft,errors,'initial_'):''}${formEnd(errors)}`;
}
export function renderWorkflowForm(type,entity,draft={},errors={}) {
  if(type==='plan')return `<h2>新建计划</h2><p class="co-hint">归属：${h(entity.name)}</p><form id="co-form" novalidate>${planFields(draft,errors)}<p class="co-hint">计划可并行，日期允许重叠。按完成标准手动确认完成。</p>${formEnd(errors)}`;
  if(type==='task') {
    if(!entity.plans?.length)return `<h2>新建任务</h2><p class="co-hint">请先在当前产品／项目录入至少一个计划，再分配任务。任务可以关联计划，也可以独立存在。</p>${btn('返回','data-co="close"')}`;
    return `<h2>新建任务</h2><p class="co-hint">归属：${h(entity.name)}</p><form id="co-form" novalidate>${field('title','任务标题 *',draft,errors)}${field('expected','预期成果 *',draft,errors,'textarea')}<label class="co-field">关联计划（可选）<select name="planId"><option value="">独立任务</option>${entity.plans.map(p=>`<option value="${p.id}" ${draft.planId===p.id?'selected':''}>${h(p.name)}</option>`).join('')}</select></label><p class="co-hint">分配给：${entity.kind==='product'?'研发':'交付'} OPC（演示角色，不是真实账号）</p>${formEnd(errors)}`;
  }
  return '';
}
export function renderTaskResult(task,draft={},errors={}) {
  return `<h2>提交成果</h2><p>${h(task.title)}</p><form id="co-form" novalidate>${field('text','成果说明',draft,errors,'textarea')}${field('url','成果链接（http/https）',draft,errors,'url')}<p class="co-hint">说明或链接至少填写一项，不上传文件。</p>${formEnd(errors)}`;
}
export function renderTaskReview(task,decision,draft={},errors={}) {
  return `<h2>${decision==='return'?'退回修改':'确认成果'}</h2><p>${h(task.title)}</p><form id="co-form" novalidate>${decision==='return'?field('reason','退回理由 *',draft,errors,'textarea'):'<p class="co-hint">确认后任务将标记为已完成，计划不会自动结束。</p>'}${formEnd(errors)}`;
}
export function renderPlanFinish(plan,tasks,draft={},errors={}) {
  const pending=tasks.filter(t=>t.planId===plan.id&&t.status!=='已完成');
  return `<h2>确认计划完成</h2><p>${h(plan.name)}</p><p class="co-hint">完成标准：${h(plan.criteria)}</p><form id="co-form" novalidate>${pending.length?`<div class="co-warning">还有 ${pending.length} 项关联任务未完成：${pending.map(t=>h(t.title)).join('、')}。确认计划完成不会改变这些任务的状态。</div>${field('explanation','确认完成的说明 *',draft,errors,'textarea')}`:'<p class="co-hint">没有未完成的关联任务。独立任务不受影响。</p>'}${formEnd(errors)}`;
}
export const moduleLabels={overview:'概览',products:'产品',projects:'项目',plans:'计划',tasks:'任务',assets:'资产',activity:'动态'};
const empty=text=>`<p class="co-empty">${text}</p>`;
const path=(view,module='overview')=>`#/dao/${view.dao.id}/${module}`;
const internal=view=>memberModes.includes(view.actor.mode);
const stateFor=view=>({daos:[view.dao],entities:view.entities,plans:view.plans,tasks:view.tasks});
const allowed=(view,action,target)=>can(view.actor,action,target,stateFor(view));
export function renderPublicCard(view) {
  const d=view.dao;
  return `<article class="island-card" data-island-search="${h((d.name+' '+d.summary).toLowerCase())}"><div class="island-cover island-cover-${d.theme}"><img src="${h(d.logo)}" alt="${h(d.name)} Logo" /></div><div class="island-card-body"><div class="card-eyebrow"><span>共创岛</span><span>${view.counts.products} 个产品 · ${view.counts.projects} 个项目</span></div><h2>${h(d.name)}</h2><p>${h(d.summary)}</p><div class="card-meta"><span>岛主 · 聂梦松</span><a href="#/dao/${d.id}" aria-label="查看${h(d.name)}详情">查看详情 ↗</a></div></div></article>`;
}
export function renderPreview(view,current) {
  return `<div class="co-preview-bar"><span>本地演示视角</span><label>身份 <select data-co-view aria-label="演示身份">${[['owner','岛主'],['nonmember','已登录未加入'],['lead','负责人'],['opc','普通 OPC'],['guest','游客']].map(([v,t])=>`<option value="${v}" ${current.mode===v?'selected':''}>${t}</option>`).join('')}</select></label>${['lead','opc'].includes(current.mode)?`<label>负责对象 <select data-co-scope aria-label="负责对象">${view.entities.map(e=>`<option value="${e.id}" ${current.entityId===e.id?'selected':''}>${e.kind==='product'?'产品':'项目'} · ${h(e.name)}</option>`).join('')}</select></label>`:''}<small>仅演示页面与操作范围，不是真实授权</small></div>`;
}
function entityList(view,kind) {
  return view.entities.filter(e=>e.kind===kind).map(e=>`<a class="co-item co-entity-link" href="${path(view,'entity/'+e.id)}"><div><span class="co-badge">${kind==='product'?'产品':'项目'}${e.visibility==='internal'?' · 内部草稿':''}</span><h3>${h(e.name)}</h3><p>${h(e.summary)||'暂无更多介绍'}</p></div><span>查看 →</span></a>`).join('')||empty('尚未录入'+(kind==='product'?'产品':'项目'));
}
function filter(view,selected) {
  return `<label class="co-filter">归属 <select data-co-filter aria-label="按产品或项目筛选"><option value="">全岛</option>${view.entities.map(e=>`<option value="${e.id}" ${selected===e.id?'selected':''}>${h(e.name)}</option>`).join('')}</select></label>`;
}
export function renderDao(view,route={}) {
  if(!view)return empty('共创岛未找到或当前视角不可访问。');
  let module=route.module||'overview';
  const modules=view.actor.mode==='guest'?['overview']:internal(view)?Object.keys(moduleLabels):['overview','products','projects'];
  if(!modules.includes(module))module='overview';
  let content;
  if(route.entityId&&view.actor.mode!=='guest') {
    const e=view.entities.find(e=>e.id===route.entityId);
    if(!e)content=empty('内容未找到或当前视角不可访问。');
    else content=`<a class="co-back" href="${path(view,e.kind==='product'?'products':'projects')}">← 返回${e.kind==='product'?'产品':'项目'}列表</a><div class="co-content-heading"><div><span class="section-kicker">${e.kind==='product'?'PRODUCT':'PROJECT'}</span><h2>${h(e.name)}</h2></div>${internal(view)&&allowed(view,'createPlan',{daoId:e.daoId,entityId:e.id})?`<details class="co-new-menu"><summary class="button button-primary">新建 ▾</summary><div>${btn('计划',`data-co="new-plan" data-entity="${e.id}"`)}${btn('单个任务',`data-co="new-task" data-entity="${e.id}"`)}</div></details>`:''}</div><p class="co-text">${h(e.summary)||'暂无更多介绍'}</p>${internal(view)?`<p class="co-hint">${e.kind==='product'?'研发负责人':'交付负责人'}：暂由岛主管理。全岛成员可读，操作按职责开放。</p><div class="co-object-grid"><section class="co-panel"><h3>计划</h3>${renderPlans(view,e.id)}</section><section class="co-panel"><h3>任务</h3>${renderTasks(view,e.id)}</section><section class="co-panel co-span"><h3>资产</h3>${empty('尚无已录入的资料、设计文件或交付成果')}</section></div>`:''}`;
  } else if(module==='overview') {
    content=`<div class="co-content-heading"><div><h2>共创岛概览</h2><p class="co-hint">了解这座岛，进入对应板块查看详细内容。</p></div></div><div class="overview-facts"><div><small>产品</small><strong>${view.counts.products} 个</strong></div><div><small>项目</small><strong>${view.counts.projects} 个</strong></div></div>${view.dao.goal?`<p class="co-text">目标：${h(view.dao.goal)}</p>`:''}${view.dao.collaboration?`<p class="co-text">协作说明：${h(view.dao.collaboration)}</p>`:''}`;
    if(view.actor.mode==='guest')content+=`<p class="co-hint">登录后可查看产品与项目介绍。</p><a class="button button-outline" href="#/login">登录查看</a>`;
    else {
      const tasks=[...view.tasks].sort((a,b)=>Number(b.entityId===view.actor.entityId)-Number(a.entityId===view.actor.entityId));
      const entries={products:view.entities.filter(e=>e.kind==='product'),projects:view.entities.filter(e=>e.kind==='project'),plans:view.plans,tasks,assets:[],activity:view.activities.slice().reverse()};
      const blanks={products:'尚未录入产品',projects:'尚未录入项目',plans:'尚未录入计划',tasks:'尚未录入任务',assets:'尚无已录入资料或成果',activity:'尚无本地协作记录'};
      content+=`<div class="co-summary-grid">${modules.filter(k=>k!=='overview').map(k=>`<a class="co-summary" href="${path(view,k)}"><div><h3>${moduleLabels[k]}</h3><span>查看全部 ↗</span></div>${entries[k].slice(0,3).map(x=>`<p>${h(x.name||x.title||activityText(x))}${x.status?` <span class="co-badge">${h(x.status)}</span>`:''}</p>`).join('')||`<p class="co-hint">${blanks[k]}</p>`}</a>`).join('')}</div>`;
    }
  } else {
    content=`<a class="co-back" href="${path(view)}">← 返回概览</a><div class="co-content-heading"><h2>${moduleLabels[module]}</h2>${['plans','tasks','assets'].includes(module)?filter(view,route.filter):''}</div>`;
    if(module==='products'||module==='projects')content+=entityList(view,module==='products'?'product':'project');
    if(module==='plans')content+=renderPlans(view,route.filter);
    if(module==='tasks')content+=renderTasks(view,route.filter);
    if(module==='assets')content+=empty('尚无已录入的产品资料、设计文件或交付成果');
    if(module==='activity')content+=view.activities.slice().reverse().map(a=>`<article class="co-item"><strong>${h(activityText(a))}</strong><small>${h(a.actorLabel)} · ${h(new Date(a.createdAt).toLocaleString('zh-CN'))}</small></article>`).join('')||empty('尚无本地协作记录');
  }
  return `<nav class="detail-tabs co-tabs" aria-label="共创岛内容">${modules.map(k=>`<a href="${path(view,k)}" ${module===k&&!route.entityId?'aria-current="page"':''}>${moduleLabels[k]}</a>`).join('')}</nav><section class="co-content">${content}</section>`;
}
const activityLabels={createDao:'创建了共创岛',createEntity:'新建了产品／项目',createPlan:'录入了计划',setPlanStatus:'更新了计划状态',createTask:'分配了任务',startTask:'开始了任务',submitTask:'提交了成果',reviewTask:'处理了待确认成果'};
function activityText(a){return activityLabels[a.type]||'更新了协作记录';}
function renderPlans(view,entityId) {return view.plans.filter(p=>!entityId||p.entityId===entityId).map(p=>`<article class="co-item" data-owner-entity="${p.entityId}"><span class="co-badge">${h(p.status)}</span><h3>${h(p.name)}</h3><p class="co-hint">${h(view.entities.find(e=>e.id===p.entityId)?.name)} · ${h(p.startDate)} — ${h(p.endDate)}</p><p>${h(p.criteria)}</p>${p.explanation?`<p class="co-hint">完成说明：${h(p.explanation)}</p>`:''}${allowed(view,'setPlanStatus',p)&&p.status!=='已完成'?`<div class="co-row-actions">${p.status==='未开始'?btn('开始计划',`data-co="start-plan" data-plan="${p.id}"`):''}${btn('确认计划完成',`data-co="finish-plan" data-plan="${p.id}"`)}</div>`:''}</article>`).join('')||empty('尚未录入计划');}
function renderTasks(view,entityId) {return view.tasks.filter(t=>!entityId||t.entityId===entityId).map(t=>{
  const e=view.entities.find(e=>e.id===t.entityId),p=view.plans.find(p=>p.id===t.planId);
  const history=t.history.map(x=>`<div class="co-history-item"><span class="co-badge">${x.type==='submit'?'成果提交':x.type==='return'?'退回修改':'已确认'}</span><p>${h(x.text||x.reason||'成果已确认')}</p>${safeResultUrl(x.url)?`<a href="${h(safeResultUrl(x.url))}" target="_blank" rel="noopener noreferrer">查看成果链接 ↗</a>`:''}</div>`).join('');
  const ownActions=allowed(view,'startTask',t)||allowed(view,'submitTask',t);
  return `<article class="co-item" data-owner-entity="${t.entityId}"><span class="co-badge">${h(t.status)}</span><h3>${h(t.title)}</h3><p class="co-hint">${h(e?.name)} · ${p?h(p.name):'独立任务'} · ${t.assignee==='rd-opc'?'研发':'交付'} OPC（演示角色）</p><p>${h(t.expected)}</p>${history?`<details class="co-history"><summary>成果与处理记录（${t.history.length}）</summary>${history}</details>`:''}<div class="co-row-actions">${ownActions&&t.status==='待开始'?btn('开始任务',`data-co="start-task" data-task="${t.id}"`):''}${ownActions&&['进行中','需修改'].includes(t.status)?btn('提交成果',`data-co="submit-task" data-task="${t.id}"`,true):''}${allowed(view,'reviewTask',t)&&t.status==='待确认'?btn('确认成果',`data-co="confirm-task" data-task="${t.id}"`,true)+btn('退回修改',`data-co="return-task" data-task="${t.id}"`):''}</div></article>`;
}).join('')||empty('尚未录入任务');}
