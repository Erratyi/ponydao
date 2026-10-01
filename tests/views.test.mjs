import test from 'node:test';import assert from 'node:assert/strict';
import {islands,actor} from './fixtures.mjs';import {createSeedState,projectDao} from '../collaboration.js';import * as ui from '../collaboration-ui.js';
const view=mode=>projectDao(createSeedState(islands),'xiaoma',actor(mode,'xiaoma-product-1'));
test('guest cannot use deep links to read entity names or internal workflows',()=>{
 assert.equal(typeof ui.renderDao,'function');
 for(const route of [{module:'overview'},{module:'tasks'},{entityId:'xiaoma-product-1'}]){
 const html=ui.renderDao(view('guest'),route);assert.equal(html.includes('行为数据采集电子标签'),false);assert.equal(html.includes('data-co="new-plan"'),false);
 }
});
test('nonmember can see product introduction but not collaboration',()=>{
 assert.equal(typeof ui.renderDao,'function');const html=ui.renderDao(view('nonmember'),{entityId:'xiaoma-product-1'});
 assert.ok(html.includes('行为数据采集电子标签'));assert.equal(html.includes('data-co="new-task"'),false);assert.equal(html.includes('尚未录入计划'),false);
});
test('owner overview has six summaries without duplicate plan creation',()=>{
 assert.equal(typeof ui.renderDao,'function');const html=ui.renderDao(view('owner'),{module:'overview'});
 assert.ok(html.includes('/products'));assert.ok(html.includes('/projects'));assert.ok(html.includes('/plans'));assert.ok(html.includes('/tasks'));assert.ok(html.includes('/assets'));assert.ok(html.includes('/activity'));
 assert.equal(html.includes('data-co="new-plan"'),false);
});
test('OPC reads other object workspace without modifying it',()=>{
 assert.equal(typeof ui.renderDao,'function');const html=ui.renderDao(view('opc'),{entityId:'xiaoma-project-1'});
 assert.ok(html.includes('艾莱依2026项目'));assert.ok(html.includes('尚未录入计划'));assert.equal(html.includes('data-co="new-plan"'),false);
});
test('owner creates plans only inside object workspaces',()=>{
 assert.equal(typeof ui.renderDao,'function');assert.ok(ui.renderDao(view('owner'),{entityId:'xiaoma-product-1'}).includes('data-co="new-plan"'));
 assert.equal(ui.renderDao(view('owner'),{module:'plans'}).includes('data-co="new-plan"'),false);
});
test('unknown entity does not fall back to another entity',()=>{
 assert.equal(typeof ui.renderDao,'function');const html=ui.renderDao(view('owner'),{entityId:'missing'});
 assert.ok(html.includes('未找到'));assert.equal(html.includes('行为数据采集电子标签'),false);
});
test('public cards expose counts only and not searchable entity names',()=>{
 assert.equal(typeof ui.renderPublicCard,'function');const s=createSeedState(islands),html=ui.renderPublicCard(projectDao(s,'xiaoma',actor('guest')));
 assert.ok(html.includes('1 个产品 · 1 个项目'));assert.equal(html.includes('行为数据采集电子标签'),false);
 assert.ok(ui.renderPublicCard(projectDao(s,'anjun',actor('guest'))).includes('1 个产品 · 3 个项目'));
});
