import assert from 'node:assert/strict';
import test from 'node:test';
import { createComponentHarness, elements, flushAsync } from './component-test-harness.mjs';

const customer = 'customer-1';
function mount() {
  const reads=[],writes=[];
  const supabase={rpc(name,args){return new Promise(done=>(name==='admin_pricing'?reads:writes).push({name,args,done}));}};
  const harness=createComponentHarness('components/CustomerBenefitControl.tsx',{
    supabase,window:{dispatchEvent(){}},
    imports:{'lucide-react':{BadgeCheck:'svg',Info:'svg',Loader2:'svg'},'@/components/ConfirmDialog':{__esModule:true,default:'confirm-dialog'}},
  });
  const render=(refreshKey=0)=>harness.render({userId:customer,customerName:'Cliente de verificação',refreshKey});
  render();harness.flushTimeouts();
  const status = async(enabled=false)=>{await flushAsync();reads.at(-1).done({data:{enabled,products:[],audit:[]},error:null});await flushAsync();return render();};
  const toggle=tree=>elements(tree,'button').find(b=>b.props['aria-label']);
  const dialog=tree=>elements(tree,'confirm-dialog')[0];
  return {harness,reads,writes,render,status,toggle,dialog};
}

test('benefit control does not interpret an unread status as inactive or allow a write',async()=>{
  const m=mount();await flushAsync();assert.equal(m.toggle(m.render()).props.disabled,true);
  m.reads[0].done({data:null,error:{message:'denied'}});await flushAsync();
  assert.equal(m.toggle(m.render()).props.disabled,true);assert.equal(elements(m.render(),'input').length,0);
  assert.equal(m.writes.length,0);m.harness.unmount();
});

test('opening and cancelling confirmation do not change the benefit',async()=>{
  const m=mount();let tree=await m.status();m.toggle(tree).props.onClick();tree=m.render();
  assert.equal(m.dialog(tree).props.open,true);assert.equal(m.writes.length,0);
  m.dialog(tree).props.onCancel();assert.equal(m.dialog(m.render()).props.open,false);assert.equal(m.writes.length,0);m.harness.unmount();
});

for(const enabled of [false,true])test(`confirmed ${enabled?'deactivation':'activation'} changes only access and re-reads its persisted state`,async()=>{
  const m=mount();let tree=await m.status(enabled);m.toggle(tree).props.onClick();m.dialog(m.render()).props.onConfirm();await flushAsync();
  assert.equal(m.writes.length,1);assert.equal(m.writes[0].name,'admin_set_pricing');
  assert.deepEqual({...m.writes[0].args},{p_action:'access',p_user_id:customer,p_code:null,p_price:null,p_enabled:!enabled});
  // A repeated confirmation while the request is pending cannot duplicate it.
  m.dialog(m.render()).props.onConfirm();assert.equal(m.writes.length,1);
  m.writes[0].done({error:null});await flushAsync();
  assert.equal(m.toggle(m.render()).props.disabled,true,'Await a fresh authoritative read before another write');
  tree=await m.status(!enabled);assert.match(m.toggle(tree).props['aria-label'],!enabled?/Desativar/:/Ativar/);
  assert.equal(m.dialog(tree).props.open,false);assert.equal(elements(tree,'input').length,0);m.harness.unmount();
});

test('a failed save keeps its error visible after re-reading the unchanged server state',async()=>{
  const m=mount();let tree=await m.status();m.toggle(tree).props.onClick();m.dialog(m.render()).props.onConfirm();await flushAsync();
  m.writes[0].done({error:{message:'denied'}});await flushAsync();tree=await m.status(false);
  assert.match(m.toggle(tree).props['aria-label'],/Ativar/);assert.equal(elements(tree).some(e=>e.props?.role==='alert'),true);
  assert.equal(m.dialog(tree).props.open,false);m.harness.unmount();
});

test('a stale read cannot overwrite the state of a more recent read',async()=>{
  const m=mount();await flushAsync();m.render(1);m.harness.flushTimeouts();await flushAsync();
  m.reads[1].done({data:{enabled:true},error:null});await flushAsync();
  m.reads[0].done({data:{enabled:false},error:null});await flushAsync();
  assert.match(m.toggle(m.render(1)).props['aria-label'],/Desativar/);m.harness.unmount();
});

test('a save finishing after the card unmounts cannot update state or start another read',async()=>{
  const m=mount();let tree=await m.status();m.toggle(tree).props.onClick();m.dialog(m.render()).props.onConfirm();await flushAsync();
  m.harness.unmount();m.writes[0].done({error:null});await flushAsync();
  assert.equal(m.reads.length,1);assert.equal(m.harness.updatesAfterUnmount,0);
});
