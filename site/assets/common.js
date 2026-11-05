'use strict';
(() => {
 const menu=document.querySelector('#main-nav'), trigger=document.querySelector('[data-menu-toggle]');
 if(!menu || !trigger)return;
 document.documentElement.classList.add('omq-js');
 const state=(val)=>{trigger.setAttribute('aria-expanded',String(val));menu.classList.toggle('is-open',val);};
 trigger.addEventListener('click',()=>state(trigger.getAttribute('aria-expanded')!=='true'));
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&trigger.getAttribute('aria-expanded')==='true'){state(false);trigger.focus()}});
 document.addEventListener('click',ev=>{if(trigger.getAttribute('aria-expanded')==='true'&&!ev.target.closest('header[data-header]'))state(false)});
})();
