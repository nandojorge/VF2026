/* Presentation feedback while the native flow starts; no requests or writes. */
(function(){
'use strict';var current,observer,timer;
function clear(){if(!current)return;current.button.classList.remove('vf-submit-accepted');current.status.remove();current=null;if(observer)observer.disconnect();clearTimeout(timer);}
function find(target){var button=target.closest('button,[role="button"]');if(button)return button;for(var el=target,n=0;el&&n<5;el=el.parentElement,n++){if(/^(Submeter|Retomar gravação|Tentar novamente|Atualizar listas)$/.test(el.textContent.trim())&&getComputedStyle(el).cursor==='pointer')return el;}return null;}
document.addEventListener('click',function(event){
if(!/page\.Page(?:3|29)\.html$/.test(location.pathname))return;
var button=find(event.target);if(!button||button.disabled||button.getAttribute('aria-disabled')==='true'||! /^(Submeter|Retomar gravação|Tentar novamente|Atualizar listas)$/.test(button.textContent.trim()))return;
if(current)return;
var status=document.createElement('div');status.className='vf-submit-immediate';status.setAttribute('role','status');status.textContent='A processar o pedido…';button.after(status);button.classList.add('vf-submit-accepted');current={button:button,status:status};
observer=new MutationObserver(function(){if(!button.isConnected||document.querySelector('[role="alertdialog"]')){clear();return;}var progress=Array.from(document.querySelectorAll('[data-testid]')).some(function(el){return /vf-progress/.test(el.getAttribute('data-testid'))&&getComputedStyle(el).display!=='none';});if(progress)clear();});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','aria-disabled']});
timer=setTimeout(clear,15000);
},true);
window.addEventListener('popstate',clear);
}());
