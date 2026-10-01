import test from 'node:test';
import assert from 'node:assert/strict';
import { islands, actor, loadModule } from './fixtures.mjs';
const m = await loadModule('../collaboration.js');
function seed() { assert.equal(typeof m.createSeedState, 'function'); return m.createSeedState(islands); }
test('seed preserves three DAOs and parallel product/project facts', () => {
  const s=seed(); assert.equal(s.daos.length,3);
  assert.equal(s.entities.filter(e=>e.kind==='product').length,3);
  assert.equal(s.entities.filter(e=>e.kind==='project').length,5);
  assert.equal(s.plans.length+s.tasks.length+s.activities.length,0);
});
test('guest projection does not include product names', () => {
  const v=m.projectDao(seed(),'xiaoma',actor('guest'));
  assert.equal(JSON.stringify(v).includes('行为数据采集电子标签'),false);
  assert.equal(v.entities.length,0); assert.deepEqual(v.counts,{products:1,projects:1});
});
test('nonmember only sees external entities', () => {
  const s=seed(); s.entities.push({id:'internal',daoId:'xiaoma',kind:'product',name:'内部资料',visibility:'internal'});
  assert.equal(m.projectDao(s,'xiaoma',actor('nonmember')).entities.length,2);
});
test('members read the entire DAO including unrelated internal drafts', () => {
  const s=seed(); s.entities.push({id:'internal',daoId:'xiaoma',kind:'product',name:'内部资料',visibility:'internal'});
  for (const mode of ['opc','lead','owner']) assert.equal(m.projectDao(s,'xiaoma',actor(mode,'xiaoma-product-1')).entities.length,3);
});
test('nonowners cannot manage unrelated work or OPC review own result', () => {
  const s=seed(), target={daoId:'xiaoma',entityId:'xiaoma-project-1',assignee:'delivery-opc'};
  assert.equal(m.can(actor('lead','xiaoma-product-1'),'createPlan',target,s),false);
  assert.equal(m.can(actor('opc','xiaoma-project-1'),'reviewTask',target,s),false);
  assert.equal(m.can(actor('owner'),'createPlan',target,s),true);
});
test('draft DAO is not readable by guest or nonmember', () => {
  const s=seed(); s.daos[0].visibility='draft';
  assert.equal(m.projectDao(s,'xiaoma',actor('guest')),null);
  assert.equal(m.projectDao(s,'xiaoma',actor('nonmember')),null);
});
