import{t as e}from"./rolldown-runtime-DK3Fl9T5.js";function t(e){let t=Object.create(null);for(let n of e.split(`,`))t[n]=1;return e=>e in t}var n={},r=[],i=()=>{},a=()=>!1,o=e=>e.charCodeAt(0)===111&&e.charCodeAt(1)===110&&(e.charCodeAt(2)>122||e.charCodeAt(2)<97),s=e=>e.startsWith(`onUpdate:`),c=Object.assign,l=(e,t)=>{let n=e.indexOf(t);n>-1&&e.splice(n,1)},u=Object.prototype.hasOwnProperty,d=(e,t)=>u.call(e,t),f=Array.isArray,p=e=>C(e)===`[object Map]`,m=e=>C(e)===`[object Set]`,h=e=>C(e)===`[object Date]`,g=e=>C(e)===`[object RegExp]`,_=e=>typeof e==`function`,v=e=>typeof e==`string`,y=e=>typeof e==`symbol`,b=e=>typeof e==`object`&&!!e,x=e=>(b(e)||_(e))&&_(e.then)&&_(e.catch),S=Object.prototype.toString,C=e=>S.call(e),w=e=>C(e).slice(8,-1),T=e=>C(e)===`[object Object]`,E=e=>v(e)&&e!==`NaN`&&e[0]!==`-`&&``+parseInt(e,10)===e,D=t(`,key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted`),ee=e=>{let t=Object.create(null);return(n=>t[n]||(t[n]=e(n)))},te=/-\w/g,O=ee(e=>e.replace(te,e=>e.slice(1).toUpperCase())),ne=/\B([A-Z])/g,re=ee(e=>e.replace(ne,`-$1`).toLowerCase()),ie=ee(e=>e.charAt(0).toUpperCase()+e.slice(1)),ae=ee(e=>e?`on${ie(e)}`:``),k=(e,t)=>!Object.is(e,t),oe=(e,...t)=>{for(let n=0;n<e.length;n++)e[n](...t)},se=(e,t,n,r=!1)=>{Object.defineProperty(e,t,{configurable:!0,enumerable:!1,writable:r,value:n})},ce=e=>{let t=parseFloat(e);return isNaN(t)?e:t},le=e=>{let t=v(e)?Number(e):NaN;return isNaN(t)?e:t},ue,de=()=>ue||=typeof globalThis<`u`?globalThis:typeof self<`u`?self:typeof window<`u`?window:typeof global<`u`?global:{},fe=t(`Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt,console,Error,Symbol`);function pe(e){if(f(e)){let t={};for(let n=0;n<e.length;n++){let r=e[n],i=v(r)?_e(r):pe(r);if(i)for(let e in i)t[e]=i[e]}return t}if(v(e)||b(e))return e}var me=/;(?![^(]*\))/g,he=/:([^]+)/,ge=/"(?:[^"\\]|\\[^])*"|'(?:[^'\\]|\\[^])*'|\\[^]|\/\*[^]*?\*\//g;function _e(e){let t={};return e.replace(ge,e=>e.startsWith(`/*`)?``:e).split(me).forEach(e=>{if(e){let n=e.split(he);n.length>1&&(t[n[0].trim()]=n[1].trim())}}),t}function ve(e){let t=``;if(v(e))t=e;else if(f(e))for(let n=0;n<e.length;n++){let r=ve(e[n]);r&&(t+=r+` `)}else if(b(e))for(let n in e)e[n]&&(t+=n+` `);return t.trim()}function ye(e){if(!e)return null;let{class:t,style:n}=e;return t&&!v(t)&&(e.class=ve(t)),n&&(e.style=pe(n)),e}var be=t(`itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,playsinline,readonly`);function xe(e){return!!e||e===``}function Se(e,t,n){if(e.length!==t.length)return!1;let r=!0;for(let i=0;r&&i<e.length;i++)r=Ee(e[i],t[i],n);return r}function Ce(e,t,n){if(e.size!==t.size)return!1;let r=Array.from(t),i=new Uint8Array(r.length);for(let t of e){let e=-1;for(let a=0;a<r.length;a++)if(!i[a]&&Ee(t,r[a],n)){e=a;break}if(e<0)return!1;i[e]=1}return!0}function we(e,t,n){let r=p(e),i=p(t);if(r||i||(r=m(e),i=m(t),r||i))return r&&i?Ce(e,t,n):!1;if(Object.keys(e).length!==Object.keys(t).length)return!1;for(let r in e){let i=e.hasOwnProperty(r),a=t.hasOwnProperty(r);if(i&&!a||!i&&a||!Ee(e[r],t[r],n))return!1}return String(e)===String(t)}function Te(e,t,n,r){n||=[new Map,new Map];let[i,a]=n;if(i.has(e)||a.has(t))return i.get(e)===t&&a.get(t)===e;i.set(e,t),a.set(t,e);let o=r(e,t,n);return i.delete(e),a.delete(t),o}function Ee(e,t,n){if(e===t)return!0;let r=h(e),i=h(t);return r||i?r&&i?e.getTime()===t.getTime():!1:(r=y(e),i=y(t),r||i?e===t:(r=f(e),i=f(t),r||i?r&&i?Te(e,t,n,Se):!1:(r=b(e),i=b(t),r||i?!r||!i?!1:Te(e,t,n,we):String(e)===String(t))))}function De(e,t){return e.findIndex(e=>Ee(e,t))}var Oe=e=>!!(e&&e.__v_isRef===!0),ke=e=>v(e)?e:e==null?``:f(e)||b(e)&&(e.toString===S||!_(e.toString))?Oe(e)?ke(e.value):JSON.stringify(e,Ae,2):String(e),Ae=(e,t)=>Oe(t)?Ae(e,t.value):p(t)?{[`Map(${t.size})`]:[...t.entries()].reduce((e,[t,n],r)=>(e[je(t,r)+` =>`]=n,e),{})}:m(t)?{[`Set(${t.size})`]:[...t.values()].map(e=>je(e))}:y(t)?je(t):b(t)&&!f(t)&&!T(t)?String(t):t,je=(e,t=``)=>y(e)?`Symbol(${e.description??t})`:e;function Me(e){return e==null?`initial`:typeof e==`string`?e===``?` `:e:String(e)}var A,Ne=class{constructor(e=!1){this.detached=e,this._active=!0,this._on=0,this.effects=[],this.cleanups=[],this._isPaused=!1,this._warnOnRun=!0,this.__v_skip=!0,!e&&A&&(A.active?(this.parent=A,this.index=(A.scopes||(A.scopes=[])).push(this)-1):(this._active=!1,this._warnOnRun=!1))}get active(){return this._active}pause(){if(this._active){this._isPaused=!0;let e,t;if(this.scopes){let n=this.scopes.slice();for(e=0,t=n.length;e<t;e++)n[e].pause()}for(e=0,t=this.effects.length;e<t;e++)this.effects[e].pause()}}resume(){if(this._active&&this._isPaused){this._isPaused=!1;let e,t;if(this.scopes){let n=this.scopes.slice();for(e=0,t=n.length;e<t;e++)n[e].resume()}let n=this.effects.slice();for(e=0,t=n.length;e<t;e++)n[e].resume()}}run(e){if(this._active){let t=A;try{return A=this,e()}finally{A=t}}}on(){++this._on===1&&(this.prevScope=A,A=this)}off(){if(this._on>0&&--this._on===0){if(A===this)A=this.prevScope;else{let e=A;for(;e;){if(e.prevScope===this){e.prevScope=this.prevScope;break}e=e.prevScope}}this.prevScope=void 0}}stop(e){if(this._active){this._active=!1;let t,n;for(t=0,n=this.effects.length;t<n;t++)this.effects[t].stop();for(this.effects.length=0,t=0,n=this.cleanups.length;t<n;t++)this.cleanups[t]();if(this.cleanups.length=0,this.scopes){let e=this.scopes.slice();for(t=0,n=e.length;t<n;t++)e[t].stop(!0);this.scopes.length=0}if(!this.detached&&this.parent&&!e){let e=this.parent.scopes.pop();e&&e!==this&&(this.parent.scopes[this.index]=e,e.index=this.index)}this.parent=void 0}}};function Pe(e){return new Ne(e)}function Fe(){return A}function Ie(e,t=!1){A&&A.cleanups.push(e)}var j,Le=new WeakSet,Re=class{constructor(e){this.fn=e,this.deps=void 0,this.depsTail=void 0,this.flags=5,this.next=void 0,this.cleanup=void 0,this.scheduler=void 0,A&&(A.active?A.effects.push(this):this.flags&=-2)}pause(){this.flags|=64}resume(){this.flags&64&&(this.flags&=-65,Le.has(this)&&(Le.delete(this),this.trigger()))}notify(){this.flags&2&&!(this.flags&32)||this.flags&8||He(this)}run(){if(!(this.flags&1))return this.fn();this.flags|=2,rt(this),Ge(this);let e=j,t=$e;j=this,$e=!0;try{return this.fn()}finally{Ke(this),j=e,$e=t,this.flags&=-3}}stop(){if(this.flags&1){for(let e=this.deps;e;e=e.nextDep)Ye(e);this.deps=this.depsTail=void 0,rt(this),this.onStop&&this.onStop(),this.flags&=-2}}trigger(){this.flags&64?Le.add(this):this.scheduler?this.scheduler():this.runIfDirty()}runIfDirty(){qe(this)&&this.run()}get dirty(){return qe(this)}},ze=0,Be,Ve;function He(e,t=!1){e.flags|=8,t?(e.next=Ve,Ve=e):(e.next=Be,Be=e)}function Ue(){ze++}function We(){if(--ze>0)return;if(Ve){let e=Ve;for(Ve=void 0;e;){let t=e.next;e.next=void 0,e.flags&=-9,e=t}}let e;for(;Be;){let t=Be;for(Be=void 0;t;){let n=t.next;if(t.next=void 0,t.flags&=-9,t.flags&1)try{t.trigger()}catch(t){e||=t}t=n}}if(e)throw e}function Ge(e){for(let t=e.deps;t;t=t.nextDep)t.version=-1,t.prevActiveLink=t.dep.activeLink,t.dep.activeLink=t}function Ke(e){let t,n=e.depsTail,r=n;for(;r;){let e=r.prevDep;r.version===-1?(r===n&&(n=e),Ye(r),Xe(r)):t=r,r.dep.activeLink=r.prevActiveLink,r.prevActiveLink=void 0,r=e}e.deps=t,e.depsTail=n}function qe(e){for(let t=e.deps;t;t=t.nextDep)if(t.dep.version!==t.version||t.dep.computed&&(Je(t.dep.computed)||t.dep.version!==t.version))return!0;return!!e._dirty}function Je(e){if(e.flags&4&&!(e.flags&16)||(e.flags&=-17,e.globalVersion===it)||(e.globalVersion=it,!e.isSSR&&e.flags&128&&(!e.deps&&!e._dirty||!qe(e))))return;e.flags|=2;let t=e.dep,n=j,r=$e;j=e,$e=!0;try{Ge(e);let n=e.fn(e._value);(t.version===0||k(n,e._value))&&(e.flags|=128,e._value=n,t.version++)}catch(e){throw t.version++,e}finally{j=n,$e=r,Ke(e),e.flags&=-3}}function Ye(e,t=!1){let{dep:n,prevSub:r,nextSub:i}=e;if(r&&(r.nextSub=i,e.prevSub=void 0),i&&(i.prevSub=r,e.nextSub=void 0),n.subs===e&&(n.subs=r,!r&&n.computed)){n.computed.flags&=-5;for(let e=n.computed.deps;e;e=e.nextDep)Ye(e,!0)}!t&&!--n.sc&&n.map&&n.map.delete(n.key)}function Xe(e){let{prevDep:t,nextDep:n}=e;t&&(t.nextDep=n,e.prevDep=void 0),n&&(n.prevDep=t,e.nextDep=void 0)}function Ze(e,t){e.effect instanceof Re&&(e=e.effect.fn);let n=new Re(e);t&&c(n,t);try{n.run()}catch(e){throw n.stop(),e}let r=n.run.bind(n);return r.effect=n,r}function Qe(e){e.effect.stop()}var $e=!0,et=[];function tt(){et.push($e),$e=!1}function nt(){let e=et.pop();$e=e===void 0||e}function rt(e){let{cleanup:t}=e;if(e.cleanup=void 0,t){let e=j;j=void 0;try{t()}finally{j=e}}}var it=0,at=class{constructor(e,t){this.sub=e,this.dep=t,this.version=t.version,this.nextDep=this.prevDep=this.nextSub=this.prevSub=this.prevActiveLink=void 0}},ot=class{constructor(e){this.computed=e,this.version=0,this.activeLink=void 0,this.subs=void 0,this.map=void 0,this.key=void 0,this.sc=0,this.__v_skip=!0}track(e){if(!j||!$e||j===this.computed)return;let t=this.activeLink;if(t===void 0||t.sub!==j)t=this.activeLink=new at(j,this),j.deps?(t.prevDep=j.depsTail,j.depsTail.nextDep=t,j.depsTail=t):j.deps=j.depsTail=t,st(t);else if(t.version===-1&&(t.version=this.version,t.nextDep)){let e=t.nextDep;e.prevDep=t.prevDep,t.prevDep&&(t.prevDep.nextDep=e),t.prevDep=j.depsTail,t.nextDep=void 0,j.depsTail.nextDep=t,j.depsTail=t,j.deps===t&&(j.deps=e)}return t}trigger(e){this.version++,it++,this.notify(e)}notify(e){Ue();try{for(let e=this.subs;e;e=e.prevSub)e.sub.notify()&&e.sub.dep.notify()}finally{We()}}};function st(e){if(e.dep.sc++,e.sub.flags&4){let t=e.dep.computed;if(t&&!e.dep.subs){t.flags|=20;for(let e=t.deps;e;e=e.nextDep)st(e)}let n=e.dep.subs;n!==e&&(e.prevSub=n,n&&(n.nextSub=e)),e.dep.subs=e}}var ct=new WeakMap,lt=Symbol(``),ut=Symbol(``),dt=Symbol(``);function M(e,t,n){if($e&&j){let t=ct.get(e);t||ct.set(e,t=new Map);let r=t.get(n);r||(t.set(n,r=new ot),r.map=t,r.key=n),r.track()}}function ft(e,t,n,r,i,a){let o=ct.get(e);if(!o){it++;return}let s=e=>{e&&e.trigger()};if(Ue(),t===`clear`)o.forEach(s);else{let i=f(e),a=i&&E(n);if(i&&n===`length`){let e=Number(r);o.forEach((t,n)=>{(n===`length`||n===dt||!y(n)&&n>=e)&&s(t)})}else switch((n!==void 0||o.has(void 0))&&s(o.get(n)),a&&s(o.get(dt)),t){case`add`:i?a&&s(o.get(`length`)):(s(o.get(lt)),p(e)&&s(o.get(ut)));break;case`delete`:i||(s(o.get(lt)),p(e)&&s(o.get(ut)));break;case`set`:p(e)&&s(o.get(lt))}}We()}function pt(e,t){let n=ct.get(e);return n&&n.get(t)}function mt(e){let t=F(e);return t===e||(M(t,`iterate`,dt),P(e))?t:tn(e)?N(e)?t.map(e=>an(I(e))):t.map(an):t.map(I)}function ht(e){return M(e=F(e),`iterate`,dt),e}function gt(e,t){return tn(e)?an(N(e)?I(t):t):I(t)}var _t={__proto__:null,[Symbol.iterator](){return vt(this,Symbol.iterator,e=>gt(this,e))},concat(...e){return mt(this).concat(...e.map(e=>f(e)?mt(e):e))},entries(){return vt(this,`entries`,e=>(e[1]=gt(this,e[1]),e))},every(e,t){return xt(this,`every`,e,t,void 0,arguments)},filter(e,t){return xt(this,`filter`,e,t,e=>e.map(e=>gt(this,e)),arguments)},find(e,t){return xt(this,`find`,e,t,e=>gt(this,e),arguments)},findIndex(e,t){return xt(this,`findIndex`,e,t,void 0,arguments)},findLast(e,t){return xt(this,`findLast`,e,t,e=>gt(this,e),arguments)},findLastIndex(e,t){return xt(this,`findLastIndex`,e,t,void 0,arguments)},forEach(e,t){return xt(this,`forEach`,e,t,void 0,arguments)},includes(...e){return Ct(this,`includes`,e)},indexOf(...e){return Ct(this,`indexOf`,e)},join(e){return mt(this).join(e)},lastIndexOf(...e){return Ct(this,`lastIndexOf`,e)},map(e,t){return xt(this,`map`,e,t,void 0,arguments)},pop(){return wt(this,`pop`)},push(...e){return wt(this,`push`,e)},reduce(e,...t){return St(this,`reduce`,e,t)},reduceRight(e,...t){return St(this,`reduceRight`,e,t)},shift(){return wt(this,`shift`)},some(e,t){return xt(this,`some`,e,t,void 0,arguments)},splice(...e){return wt(this,`splice`,e)},toReversed(){return mt(this).toReversed()},toSorted(e){return mt(this).toSorted(e)},toSpliced(...e){return mt(this).toSpliced(...e)},unshift(...e){return wt(this,`unshift`,e)},values(){return vt(this,`values`,e=>gt(this,e))}};function vt(e,t,n){let r=ht(e),i=r[t],a=i.call(r);if(r!==e&&!P(e)){if(a[Symbol.toStringTag]===`Array Iterator`){let e=Object.create(Object.getPrototypeOf(a));return e.next=()=>yt(a.next(),n),i!==bt[t]&&Object.defineProperties(e,{return:{get(){let e=a.return;return typeof e==`function`?e.bind(a):e}},throw:{get(){let e=a.throw;return typeof e==`function`?e.bind(a):e}}}),e}a._next=a.next,a.next=()=>yt(a._next(),n)}return a}function yt(e,t){return e.done||(e.value=t(e.value)),e}var bt=Array.prototype;function xt(e,t,n,r,i,a){let o=ht(e),s=o!==e&&!P(e),c=o[t];if(c!==bt[t]){let t=c.apply(e,a);return s?I(t):t}let l=n;o!==e&&(s?l=function(t,r){return n.call(this,gt(e,t),r,e)}:n.length>2&&(l=function(t,r){return n.call(this,t,r,e)}));let u=c.call(o,l,r);return s&&i?i(u):u}function St(e,t,n,r){let i=ht(e),a=i!==e&&!P(e),o=n,s=!1;i!==e&&(a?(s=r.length===0,o=function(t,r,i){return s&&(s=!1,t=gt(e,t)),n.call(this,t,gt(e,r),i,e)}):n.length>3&&(o=function(t,r,i){return n.call(this,t,r,i,e)}));let c=i[t](o,...r);return s?gt(e,c):c}function Ct(e,t,n){let r=F(e);M(r,`iterate`,dt);let i=r[t](...n);return(i===-1||i===!1)&&nn(n[0])?(n[0]=F(n[0]),r[t](...n)):i}function wt(e,t,n=[]){tt(),Ue();let r=F(e)[t].apply(e,n);return We(),nt(),r}var Tt=t(`__proto__,__v_isRef,__isVue`),Et=new Set(Object.getOwnPropertyNames(Symbol).filter(e=>e!==`arguments`&&e!==`caller`).map(e=>Symbol[e]).filter(y));function Dt(e){y(e)||(e=String(e));let t=F(this);return M(t,`has`,e),t.hasOwnProperty(e)}var Ot=class{constructor(e=!1,t=!1){this._isReadonly=e,this._isShallow=t}get(e,t,n){if(t===`__v_skip`)return e.__v_skip;let r=this._isReadonly,i=this._isShallow;if(t===`__v_isReactive`)return!r;if(t===`__v_isReadonly`)return r;if(t===`__v_isShallow`)return i;if(t===`__v_raw`)return n===(r?i?Jt:qt:i?Kt:Gt).get(e)||Object.getPrototypeOf(e)===Object.getPrototypeOf(n)?e:void 0;let a=f(e);if(!r){let e;if(a&&(e=_t[t]))return e;if(t===`hasOwnProperty`)return Dt}let o=Reflect.get(e,t,L(e)?e:n);if((y(t)?Et.has(t):Tt(t))||(r||M(e,`get`,t),i))return o;if(L(o)){let e=a&&E(t)?o:o.value;return r&&b(e)?Qt(e):e}return b(o)?r?Qt(o):Xt(o):o}},kt=class extends Ot{constructor(e=!1){super(!1,e)}set(e,t,n,r){let i=e[t],a=f(e)&&E(t);if(!this._isShallow){let e=tn(i);if(!P(n)&&!tn(n)&&(i=F(i),n=F(n)),!a&&L(i)&&!L(n))return e||(i.value=n),!0}let o=a?Number(t)<e.length:d(e,t),s=Reflect.set(e,t,n,L(e)?e:r);return e===F(r)&&s&&(o?k(n,i)&&ft(e,`set`,t,n,i):ft(e,`add`,t,n)),s}deleteProperty(e,t){let n=d(e,t),r=e[t],i=Reflect.deleteProperty(e,t);return i&&n&&ft(e,`delete`,t,void 0,r),i}has(e,t){let n=Reflect.has(e,t);return(!y(t)||!Et.has(t))&&M(e,`has`,t),n}ownKeys(e){return M(e,`iterate`,f(e)?`length`:lt),Reflect.ownKeys(e)}},At=class extends Ot{constructor(e=!1){super(!0,e)}set(e,t){return!0}deleteProperty(e,t){return!0}},jt=new kt,Mt=new At,Nt=new kt(!0),Pt=new At(!0),Ft=e=>e,It=e=>Reflect.getPrototypeOf(e);function Lt(e,t,n){return function(...r){let i=this.__v_raw,a=F(i),o=p(a),s=e===`entries`||e===Symbol.iterator&&o,l=e===`keys`&&o,u=i[e](...r),d=n?Ft:t?an:I;return!t&&M(a,`iterate`,l?ut:lt),c(Object.create(u),{next(){let{value:e,done:t}=u.next();return t?{value:e,done:t}:{value:s?[d(e[0]),d(e[1])]:d(e),done:t}}})}}function Rt(e){return function(...t){return e===`delete`?!1:e===`clear`?void 0:this}}function zt(e,t){let n={get(n){let r=this.__v_raw,i=F(r),a=F(n);e||(k(n,a)&&M(i,`get`,n),M(i,`get`,a));let{has:o}=It(i),s=t?Ft:e?an:I;if(o.call(i,n))return s(r.get(n));if(o.call(i,a))return s(r.get(a));r!==i&&r.get(n)},get size(){let t=this.__v_raw;return!e&&M(F(t),`iterate`,lt),t.size},has(t){let n=this.__v_raw,r=F(n),i=F(t);return e||(k(t,i)&&M(r,`has`,t),M(r,`has`,i)),t===i?n.has(t):n.has(t)||n.has(i)},forEach(n,r){let i=this,a=i.__v_raw,o=F(a),s=t?Ft:e?an:I;return!e&&M(o,`iterate`,lt),a.forEach((e,t)=>n.call(r,s(e),s(t),i))}};return c(n,e?{add:Rt(`add`),set:Rt(`set`),delete:Rt(`delete`),clear:Rt(`clear`)}:{add(e){let n=F(this),r=It(n),i=F(e),a=!t&&!P(e)&&!tn(e)?i:e;return r.has.call(n,a)||k(e,a)&&r.has.call(n,e)||k(i,a)&&r.has.call(n,i)||(n.add(a),ft(n,`add`,a,a)),this},set(e,n){!t&&!P(n)&&!tn(n)&&(n=F(n));let r=F(this),{has:i,get:a}=It(r),o=i.call(r,e);o||=(e=F(e),i.call(r,e));let s=a.call(r,e);return r.set(e,n),o?k(n,s)&&ft(r,`set`,e,n,s):ft(r,`add`,e,n),this},delete(e){let t=F(this),{has:n,get:r}=It(t),i=n.call(t,e);i||=(e=F(e),n.call(t,e));let a=r?r.call(t,e):void 0,o=t.delete(e);return i&&ft(t,`delete`,e,void 0,a),o},clear(){let e=F(this),t=e.size!==0,n=e.clear();return t&&ft(e,`clear`,void 0,void 0,void 0),n}}),[`keys`,`values`,`entries`,Symbol.iterator].forEach(r=>{n[r]=Lt(r,e,t)}),n}function Bt(e,t){let n=zt(e,t);return(r,i,a)=>i===`__v_isReactive`?!e:i===`__v_isReadonly`?e:i===`__v_isShallow`?t:i===`__v_raw`?r:Reflect.get(d(n,i)&&i in r?n:r,i,a)}var Vt={get:Bt(!1,!1)},Ht={get:Bt(!1,!0)},Ut={get:Bt(!0,!1)},Wt={get:Bt(!0,!0)},Gt=new WeakMap,Kt=new WeakMap,qt=new WeakMap,Jt=new WeakMap;function Yt(e){switch(e){case`Object`:case`Array`:return 1;case`Map`:case`Set`:case`WeakMap`:case`WeakSet`:return 2;default:return 0}}function Xt(e){return tn(e)?e:en(e,!1,jt,Vt,Gt)}function Zt(e){return en(e,!1,Nt,Ht,Kt)}function Qt(e){return en(e,!0,Mt,Ut,qt)}function $t(e){return en(e,!0,Pt,Wt,Jt)}function en(e,t,n,r,i){if(!b(e)||e.__v_raw&&!(t&&e.__v_isReactive)||e.__v_skip||!Object.isExtensible(e))return e;let a=i.get(e);if(a)return a;let o=Yt(w(e));if(o===0)return e;let s=new Proxy(e,o===2?r:n);return i.set(e,s),s}function N(e){return tn(e)?N(e.__v_raw):!!(e&&e.__v_isReactive)}function tn(e){return!!(e&&e.__v_isReadonly)}function P(e){return!!(e&&e.__v_isShallow)}function nn(e){return e?!!e.__v_raw:!1}function F(e){let t=e&&e.__v_raw;return t?F(t):e}function rn(e){return!d(e,`__v_skip`)&&Object.isExtensible(e)&&se(e,`__v_skip`,!0),e}var I=e=>b(e)?Xt(e):e,an=e=>b(e)?Qt(e):e;function L(e){return e?e.__v_isRef===!0:!1}function R(e){return sn(e,!1)}function on(e){return sn(e,!0)}function sn(e,t){return L(e)?e:new cn(e,t)}var cn=class{constructor(e,t){this.dep=new ot,this.__v_isRef=!0,this.__v_isShallow=!1,this._rawValue=t?e:F(e),this._value=t?e:I(e),this.__v_isShallow=t}get value(){return this.dep.track(),this._value}set value(e){let t=this._rawValue,n=this.__v_isShallow||P(e)||tn(e);e=n?e:F(e),k(e,t)&&(this._rawValue=e,this._value=n?e:I(e),this.dep.trigger())}};function ln(e){e.dep&&e.dep.trigger()}function un(e){return L(e)?e.value:e}function dn(e){return _(e)?e():un(e)}var fn={get:(e,t,n)=>t===`__v_raw`?e:un(Reflect.get(e,t,n)),set:(e,t,n,r)=>{let i=e[t];return L(i)&&!L(n)?(i.value=n,!0):Reflect.set(e,t,n,r)}};function pn(e){return N(e)?e:new Proxy(e,fn)}var mn=class{constructor(e){this.__v_isRef=!0,this._value=void 0;let t=this.dep=new ot,{get:n,set:r}=e(t.track.bind(t),t.trigger.bind(t));this._get=n,this._set=r}get value(){return this._value=this._get()}set value(e){this._set(e)}};function hn(e){return new mn(e)}function gn(e){let t=f(e)?Array(e.length):{};for(let n in e)t[n]=bn(e,n);return t}var _n=class{constructor(e,t,n){this._object=e,this._defaultValue=n,this.__v_isRef=!0,this._value=void 0,this._key=y(t)?t:String(t),this._raw=F(e);let r=!0,i=e;if(!f(e)||y(this._key)||!E(this._key))do r=!nn(i)||P(i);while(r&&(i=i.__v_raw));this._shallow=r}get value(){let e=this._object[this._key];return this._shallow&&(e=un(e)),this._value=e===void 0?this._defaultValue:e}set value(e){if(this._shallow&&L(this._raw[this._key])){let t=this._object[this._key];if(L(t)){t.value=e;return}}this._object[this._key]=e}get dep(){return pt(this._raw,this._key)}},vn=class{constructor(e){this._getter=e,this.__v_isRef=!0,this.__v_isReadonly=!0,this._value=void 0}get value(){return this._value=this._getter()}};function yn(e,t,n){return L(e)?e:_(e)?new vn(e):b(e)&&arguments.length>1?bn(e,t,n):R(e)}function bn(e,t,n){return new _n(e,t,n)}var xn=class{constructor(e,t,n){this.fn=e,this.setter=t,this._value=void 0,this.dep=new ot(this),this.__v_isRef=!0,this.deps=void 0,this.depsTail=void 0,this.flags=16,this.globalVersion=it-1,this.next=void 0,this.effect=this,this.__v_isReadonly=!t,this.isSSR=n}notify(){if(this.flags|=16,!(this.flags&8)&&j!==this)return He(this,!0),!0}get value(){let e=this.dep.track();return Je(this),e&&(e.version=this.dep.version),this._value}set value(e){this.setter&&this.setter(e)}};function Sn(e,t,n=!1){let r,i;return _(e)?r=e:(r=e.get,i=e.set),new xn(r,i,n)}var Cn={GET:`get`,HAS:`has`,ITERATE:`iterate`},wn={SET:`set`,ADD:`add`,DELETE:`delete`,CLEAR:`clear`},Tn={},En=new WeakMap,Dn=void 0;function On(){return Dn}function kn(e,t=!1,n=Dn){if(n){let t=En.get(n);t||En.set(n,t=[]),t.push(e)}}function An(e,t,r=n){let{immediate:a,deep:o,once:s,scheduler:c,augmentJob:u,call:d}=r,p=e=>o?e:P(e)||o===!1||o===0?jn(e,1):jn(e),m,h,g,v,y=!1,b=!1;if(L(e)?(h=()=>e.value,y=P(e)):N(e)?(h=()=>p(e),y=!0):f(e)?(b=!0,y=e.some(e=>N(e)||P(e)),h=()=>e.map(e=>{if(L(e))return e.value;if(N(e))return p(e);if(_(e))return d?d(e,2):e()})):h=_(e)?t?d?()=>d(e,2):e:()=>{if(g){tt();try{g()}finally{nt()}}let t=Dn;Dn=m;try{return d?d(e,3,[v]):e(v)}finally{Dn=t}}:i,t&&o){let e=h,t=o===!0?1/0:o;h=()=>jn(e(),t)}let x=Fe(),S=()=>{m.stop(),x&&x.active&&l(x.effects,m)};if(s&&t){let e=t;t=(...t)=>{try{return e(...t)}finally{S()}}}let C=b?Array(e.length).fill(Tn):Tn,w=e=>{if(m.flags&1&&(m.dirty||e)){if(t){let n=m.run();if(e||o||y||(b?n.some((e,t)=>k(e,C[t])):k(n,C))){let e=Dn;tt();try{g&&g(),Dn=m;let e=[n,C===Tn?void 0:b&&C[0]===Tn?[]:C,v];C=n,d?d(t,3,e):t(...e)}finally{Dn=e,nt()}}}else m.run()}};return u&&u(w),m=new Re(h),m.scheduler=c?()=>c(w,!1):w,v=e=>kn(e,!1,m),g=m.onStop=()=>{let e=En.get(m);if(e){if(d)d(e,4);else for(let t of e)t();En.delete(m)}},t?a?w(!0):C=m.run():c?c(w.bind(null,!0),!0):m.run(),S.pause=m.pause.bind(m),S.resume=m.resume.bind(m),S.stop=S,S}function jn(e,t=1/0,n){if(t<=0||!b(e)||e.__v_skip||(n||=new Map,(n.get(e)||0)>=t))return e;if(n.set(e,t),t--,L(e))jn(e.value,t,n);else if(f(e))for(let r=0;r<e.length;r++)jn(e[r],t,n);else if(m(e)||p(e))e.forEach(e=>{jn(e,t,n)});else if(T(e)){for(let r in e)jn(e[r],t,n);for(let r of Object.getOwnPropertySymbols(e))Object.prototype.propertyIsEnumerable.call(e,r)&&jn(e[r],t,n)}return e}var Mn=[];function Nn(e){Mn.push(e)}function Pn(){Mn.pop()}function Fn(e,t){}var In={SETUP_FUNCTION:0,0:`SETUP_FUNCTION`,RENDER_FUNCTION:1,1:`RENDER_FUNCTION`,NATIVE_EVENT_HANDLER:5,5:`NATIVE_EVENT_HANDLER`,COMPONENT_EVENT_HANDLER:6,6:`COMPONENT_EVENT_HANDLER`,VNODE_HOOK:7,7:`VNODE_HOOK`,DIRECTIVE_HOOK:8,8:`DIRECTIVE_HOOK`,TRANSITION_HOOK:9,9:`TRANSITION_HOOK`,APP_ERROR_HANDLER:10,10:`APP_ERROR_HANDLER`,APP_WARN_HANDLER:11,11:`APP_WARN_HANDLER`,FUNCTION_REF:12,12:`FUNCTION_REF`,ASYNC_COMPONENT_LOADER:13,13:`ASYNC_COMPONENT_LOADER`,SCHEDULER:14,14:`SCHEDULER`,COMPONENT_UPDATE:15,15:`COMPONENT_UPDATE`,APP_UNMOUNT_CLEANUP:16,16:`APP_UNMOUNT_CLEANUP`},Ln={sp:`serverPrefetch hook`,bc:`beforeCreate hook`,c:`created hook`,bm:`beforeMount hook`,m:`mounted hook`,bu:`beforeUpdate hook`,u:`updated`,bum:`beforeUnmount hook`,um:`unmounted hook`,a:`activated hook`,da:`deactivated hook`,ec:`errorCaptured hook`,rtc:`renderTracked hook`,rtg:`renderTriggered hook`,0:`setup function`,1:`render function`,2:`watcher getter`,3:`watcher callback`,4:`watcher cleanup function`,5:`native event handler`,6:`component event handler`,7:`vnode hook`,8:`directive hook`,9:`transition hook`,10:`app errorHandler`,11:`app warnHandler`,12:`ref function`,13:`async component loader`,14:`scheduler flush`,15:`component update`,16:`app unmount cleanup function`};function Rn(e,t,n,r){try{return r?e(...r):e()}catch(e){zn(e,t,n)}}function z(e,t,n,r){if(_(e)){let i=Rn(e,t,n,r);return i&&x(i)&&i.catch(e=>{zn(e,t,n)}),i}if(f(e)){let i=[];for(let a=0;a<e.length;a++)i.push(z(e[a],t,n,r));return i}}function zn(e,t,r,i=!0){let a=t?t.vnode:null,{errorHandler:o,throwUnhandledErrorInProduction:s}=t&&t.appContext.config||n;if(t){let n=t.parent,i=t.proxy,a=`https://vuejs.org/error-reference/#runtime-${r}`;for(;n;){let t=n.ec;if(t){for(let n=0;n<t.length;n++)if(t[n](e,i,a)===!1)return}n=n.parent}if(o){tt(),Rn(o,null,10,[e,i,a]),nt();return}}Bn(e,r,a,i,s)}function Bn(e,t,n,r=!0,i=!1){if(i)throw e;console.error(e)}var B=[],Vn=-1,Hn=[],Un=null,Wn=0,Gn=Promise.resolve(),Kn=null;function qn(e){let t=Kn||Gn;return e?t.then(this?e.bind(this):e):t}function Jn(e){let t=Vn+1,n=B.length;for(;t<n;){let r=t+n>>>1,i=B[r],a=nr(i);a<e||a===e&&i.flags&2?t=r+1:n=r}return t}function Yn(e){if(!(e.flags&1)){let t=nr(e),n=B[B.length-1];!n||!(e.flags&2)&&t>=nr(n)?B.push(e):B.splice(Jn(t),0,e),e.flags|=1,Xn()}}function Xn(){Kn||=Gn.then(rr)}function Zn(e){if(!f(e))Un&&e.id===-1?Un.splice(Wn+1,0,e):e.flags&1||(Hn.push(e),e.flags|=1);else for(let t=0;t<e.length;t++)Hn.push(e[t]);Xn()}function Qn(e,t,n,r=Vn+1){for(;r<B.length;r++){let n=B[r];if(n&&n.flags&2){if(e&&n.id!==e.uid||t!==void 0&&!(n.id>=t))continue;B.splice(r,1),r=e?r-1:Vn,n.flags&4&&(n.flags&=-2),n(),n.flags&4||(n.flags&=-2)}}}function $n(e,t,n=0){if(Hn.length){let e=Hn,r=0;if(t){e=[];for(let i=0;i<Hn.length;i++){let a=Hn[i];(a.i===void 0?t.has(a):!a.i||a.i.uid<n)?Hn[r++]=a:e.push(a)}}let i=[...new Set(e)].sort((e,t)=>nr(e)-nr(t));if(Hn.length=r,Un){for(let e=0;e<i.length;e++)Un.push(i[e]);return}for(Un=i,Wn=0;Wn<Un.length;Wn++){let e=Un[Wn];e.flags&4&&(e.flags&=-2),e.flags&8||e(),e.flags&=-2}Un=null,Wn=0}}var er=!1;function tr(e,t){if(er){e();return}let n=t===void 0?void 0:new Set(Hn);e(),er=!0;try{Qn(void 0,t),$n(void 0,n,t)}finally{er=!1}}var nr=e=>e.id==null?e.flags&2?-1:1/0:e.id;function rr(e){try{for(Vn=0;Vn<B.length;Vn++){let e=B[Vn];e&&!(e.flags&8)&&(e.flags&4&&(e.flags&=-2),Rn(e,e.i,e.i?15:14),e.flags&4||(e.flags&=-2))}}finally{for(;Vn<B.length;Vn++){let e=B[Vn];e&&(e.flags&=-2)}Vn=-1,B.length=0,$n(e),Kn=null,(B.length||Hn.length)&&rr(e)}}var ir,ar=[];function or(e,t){ir=e,ir?(ir.enabled=!0,ar.forEach(({event:e,args:t})=>ir.emit(e,...t)),ar=[]):typeof window<`u`&&window.HTMLElement&&!(window.navigator?.userAgent)?.includes(`jsdom`)?((t.__VUE_DEVTOOLS_HOOK_REPLAY__=t.__VUE_DEVTOOLS_HOOK_REPLAY__||[]).push(e=>{or(e,t)}),setTimeout(()=>{ir||(t.__VUE_DEVTOOLS_HOOK_REPLAY__=null,ar=[])},3e3)):ar=[]}var V=null,sr=null;function cr(e){let t=V;return V=e,sr=e&&e.type.__scopeId||null,t}function lr(e){sr=e}function ur(){sr=null}var dr=e=>fr;function fr(e,t=V,n){if(!t||e._n)return e;let r=(...n)=>{r._d&&cs(-1);let i=cr(t),a=is.length,o;try{o=e(...n)}finally{for(let e=is.length;e>a;e--)os();cr(i),r._d&&cs(1)}return o};return r._n=!0,r._c=!0,r._d=!0,r}function pr(e,t){if(V===null)return e;let r=Js(V),i=e.dirs||=[];for(let e=0;e<t.length;e++){let[a,o,s,c=n]=t[e];a&&(_(a)&&(a={mounted:a,updated:a}),a.deep&&jn(o),i.push({dir:a,instance:r,value:o,oldValue:void 0,arg:s,modifiers:c}))}return e}function mr(e,t,n,r){let i=e.dirs,a=t&&t.dirs;for(let o=0;o<i.length;o++){let s=i[o];a&&(s.oldValue=a[o].value);let c=s.dir[r];c&&(tt(),z(c,n,8,[e.el,s,e,t]),nt())}}function hr(e,t){if(Q){let n=Q.provides,r=Q.parent&&Q.parent.provides;r===n&&(n=Q.provides=Object.create(r)),n[e]=t}}function gr(e,t,n=!1){let r=js();if(r||Qa){let i=Qa?Qa._context.provides:r?r.parent==null||r.ce?r.vnode.appContext&&r.vnode.appContext.provides:r.parent.provides:void 0;if(i&&e in i)return i[e];if(arguments.length>1)return n&&_(t)?t.call(r&&r.proxy):t}}function _r(){return!!(js()||Qa)}var vr=Symbol.for(`v-scx`),yr=()=>gr(vr);function br(e,t){return wr(e,null,t)}function xr(e,t){return wr(e,null,{flush:`post`})}function Sr(e,t){return wr(e,null,{flush:`sync`})}function Cr(e,t,n){return wr(e,t,n)}function wr(e,t,r=n){let{immediate:a,deep:o,flush:s,once:l}=r,u=c({},r),d=t&&a||!t&&s!==`post`,f;if(Ls){if(s===`sync`){let e=yr();f=e.__watcherHandles||=[]}else if(!d){let e=()=>{};return e.stop=i,e.resume=i,e.pause=i,e}}let p=Q;u.call=(e,t,n)=>z(e,p,t,n);let m=!1;s===`post`?u.scheduler=e=>{e.i=p,G(e,p&&p.suspense)}:s!==`sync`&&(m=!0,u.scheduler=(e,t)=>{t?e():Yn(e)}),u.augmentJob=e=>{t&&(e.flags|=4),m&&(e.flags|=2,p&&(e.id=p.uid,e.i=p))};let h=An(e,t,u);return Ls&&(f?f.push(h):d&&h()),h}function Tr(e,t,n){let r=this.proxy,i=v(e)?e.includes(`.`)?Er(r,e):()=>r[e]:e.bind(r,r),a;_(t)?a=t:(a=t.handler,n=t);let o=Ps(this),s=wr(i,a.bind(r),n);return o(),s}function Er(e,t){let n=t.split(`.`);return()=>{let t=e;for(let e=0;e<n.length&&t;e++)t=t[n[e]];return t}}var Dr=new WeakMap,Or=Symbol(`_vte`),kr=e=>e.__isTeleport,Ar=e=>e&&(e.disabled||e.disabled===``),jr=e=>e&&(e.defer||e.defer===``),Mr=e=>typeof SVGElement<`u`&&e instanceof SVGElement,Nr=e=>typeof MathMLElement==`function`&&e instanceof MathMLElement,Pr=(e,t)=>{let n=e&&e.to;return v(n)?t?t(n):null:n},Fr={name:`Teleport`,__isTeleport:!0,process(e,t,n,r,i,a,o,s,c,l){let{mc:u,pc:d,pbc:f,o:{insert:p,querySelector:m,createText:h,createComment:g,parentNode:_}}=l,v=Ar(t.props),{dynamicChildren:y}=t,b=(e,t,n)=>{e.shapeFlag&16&&u(e.children,t,n,i,a,o,s,c)},x=(e=t)=>{let n=Ar(e.props),r=e.target=Pr(e.props,m),a=Br(r,e,h,p);r&&(o!==`svg`&&Mr(r)?o=`svg`:o!==`mathml`&&Nr(r)&&(o=`mathml`),i&&i.isCE&&(i.ce._teleportTargets||(i.ce._teleportTargets=new Set)).add(r),n||(b(e,r,a),zr(e,!1)))},S=e=>{let t=()=>{if(Dr.get(e)===t){if(Dr.delete(e),Ar(e.props)){let t=_(e.el)||n;b(e,t,e.anchor),zr(e,!0)}x(e)}};Dr.set(e,t),G(t,a)};if(e==null){let e=t.el=h(``),i=t.anchor=h(``);if(p(e,n,r),p(i,n,r),jr(t.props)||a&&a.pendingBranch){S(t);return}v&&(b(t,n,i),zr(t,!0)),x()}else{t.el=e.el;let r=t.anchor=e.anchor,u=Dr.get(e);if(u){u.flags|=8,Dr.delete(e),S(t);return}t.targetStart=e.targetStart;let p=t.target=e.target,h=t.targetAnchor=e.targetAnchor,g=Ar(e.props),_=g?n:p,b=g?r:h;if(o===`svg`||Mr(p)?o=`svg`:(o===`mathml`||Nr(p))&&(o=`mathml`),y?(f(e.dynamicChildren,y,_,i,a,o,s),Ro(e,t,!0)):c||d(e,t,_,b,i,a,o,s,!1),v)g?t.props&&e.props&&t.props.to!==e.props.to&&(t.props.to=e.props.to):Ir(t,n,r,l,1);else if((t.props&&t.props.to)!==(e.props&&e.props.to)){let e=Pr(t.props,m);e&&(t.target=e,Ir(t,e,null,l,0))}else g&&Ir(t,p,h,l,1);zr(t,v)}},remove(e,t,n,{um:r,o:{remove:i}},a){let{shapeFlag:o,children:s,anchor:c,targetStart:l,targetAnchor:u,target:d,props:f}=e,p=Ar(f),m=a||!p,h=Dr.get(e);if(h&&(h.flags|=8,Dr.delete(e)),d&&(i(l),i(u)),a&&i(c),!h&&(p||d)&&o&16)for(let e=0;e<s.length;e++){let i=s[e];r(i,t,n,m,!!i.dynamicChildren)}},move:Ir,hydrate:Lr};function Ir(e,t,n,{o:{insert:r},m:i},a=2){a===0&&(e.targetStart&&r(e.targetStart,t,n),r(e.targetAnchor,t,n),n=e.targetAnchor);let{el:o,anchor:s,shapeFlag:c,children:l,props:u}=e,d=a===2;if(d&&r(o,t,n),!Dr.has(e)&&(!d||Ar(u))&&c&16)for(let e=0;e<l.length;e++)i(l[e],t,n,2);d&&r(s,t,n)}function Lr(e,t,n,r,i,a,{o:{nextSibling:o,parentNode:s,querySelector:c,insert:l,createText:u}},d){function f(e,n){let r=n;for(;r;){if(r&&r.nodeType===8){if(r.data===`teleport start anchor`)t.targetStart=r;else if(r.data===`teleport anchor`){t.targetAnchor=r,e._lpa=t.targetAnchor&&o(t.targetAnchor);break}}r=o(r)}}function p(e,t){t.anchor=d(o(e),t,s(e),n,r,i,a)}let m=t.target=Pr(t.props,c),h=Ar(t.props);if(m){let c=m._lpa||m.firstChild;t.shapeFlag&16&&(h?(p(e,t),f(m,c),t.targetAnchor||Br(m,t,u,l,s(e)===m?e:null)):(t.anchor=o(e),f(m,c),t.targetAnchor||Br(m,t,u,l),d(c&&o(c),t,m,n,r,i,a))),zr(t,h)}else h&&t.shapeFlag&16&&(p(e,t),t.targetStart=e,t.targetAnchor=o(e));return t.anchor&&o(t.anchor)}var Rr=Fr;function zr(e,t){let n=e.ctx;if(n&&n.ut){let r,i;for(t?(r=e.el,i=e.anchor):(r=e.targetStart,i=e.targetAnchor);r&&r!==i;)r.nodeType===1&&r.setAttribute(`data-v-owner`,n.uid),r=r.nextSibling;n.ut()}}function Br(e,t,n,r,i=null){let a=t.targetStart=n(``),o=t.targetAnchor=n(``);return a[Or]=o,e&&(r(a,e,i),r(o,e,i)),o}var H=Symbol(`_leaveCb`),Vr=Symbol(`_enterCb`);function Hr(){let e={isMounted:!1,isLeaving:!1,isUnmounting:!1,leavingVNodes:new Map};return qi(()=>{e.isMounted=!0}),Xi(()=>{e.isUnmounting=!0}),e}var U=[Function,Array],Ur={mode:String,appear:Boolean,persisted:Boolean,onBeforeEnter:U,onEnter:U,onAfterEnter:U,onEnterCancelled:U,onBeforeLeave:U,onLeave:U,onAfterLeave:U,onLeaveCancelled:U,onBeforeAppear:U,onAppear:U,onAfterAppear:U,onAppearCancelled:U},Wr={name:`BaseTransition`,props:Ur,setup(e,{slots:t}){let n=js(),r=Hr();return()=>{let i=t.default&&Qr(t.default(),!0),a=i&&i.length?Gr(i):n.subTree?Cs():void 0;if(!a)return;let o=F(e),{mode:s}=o;if(r.isLeaving)return Yr(a);let c=Xr(a);if(!c)return Yr(a);let l=Jr(c,o,r,n,e=>l=e);c.type!==q&&Zr(c,l);let u=n.subTree&&Xr(n.subTree);if(u&&u.type!==q&&!ps(u,c)&&$r(n.subTree)){let e=Jr(u,o,r,n);if(Zr(u,e),s===`out-in`&&c.type!==q)return r.isLeaving=!0,e.afterLeave=()=>{r.isLeaving=!1,n.job.flags&8||n.update(),delete e.afterLeave,u=void 0},Yr(a);s===`in-out`&&c.type!==q?e.delayLeave=(e,t,n)=>{let i=qr(r,u);i[String(u.key)]=u,e[H]=()=>{t(),e[H]=void 0,delete l.delayedLeave,u=void 0},l.delayedLeave=()=>{n(),delete l.delayedLeave,u=void 0}}:u=void 0}else u&&=void 0;return a}}};function Gr(e){let t=e[0];if(e.length>1){for(let n of e)if(n.type!==q){t=n;break}}return t}var Kr=Wr;function qr(e,t){let{leavingVNodes:n}=e,r=n.get(t.type);return r||(r=Object.create(null),n.set(t.type,r)),r}function Jr(e,t,n,r,i){let{appear:a,mode:o,persisted:s=!1,onBeforeEnter:c,onEnter:l,onAfterEnter:u,onEnterCancelled:d,onBeforeLeave:p,onLeave:m,onAfterLeave:h,onLeaveCancelled:g,onBeforeAppear:_,onAppear:v,onAfterAppear:y,onAppearCancelled:b}=t,x=String(e.key),S=qr(n,e),C=(e,t)=>{e&&z(e,r,9,t)},w=(e,t)=>{let n=t[1];C(e,t),f(e)?e.every(e=>e.length<=1)&&n():e.length<=1&&n()},T={mode:o,persisted:s,beforeEnter(t){let r=c;if(!n.isMounted){if(a)r=_||c;else return}t[H]&&t[H](!0);let i=S[x];if(i&&ps(e,i)){let e=i.el[H];if(!e){let t=$r(i);e=t&&t.el[H]}e&&e()}C(r,[t])},enter(t){if(S[x]===e)return;let r=l,i=u,o=d;if(!n.isMounted){if(a)r=v||l,i=y||u,o=b||d;else return}let s=!1;t[Vr]=e=>{s||(s=!0,C(e?o:i,[t]),T.delayedLeave&&T.delayedLeave(),t[Vr]=void 0)};let c=t[Vr].bind(null,!1);r?w(r,[t,c]):c()},leave(t,r){let i=String(e.key);if(t[Vr]&&t[Vr](!0),n.isUnmounting)return r();C(p,[t]);let a=!1;t[H]=n=>{a||(a=!0,r(),C(n?g:h,[t]),t[H]=void 0,S[i]===e&&delete S[i])};let o=t[H].bind(null,!1);S[i]=e,m?w(m,[t,o]):o()},clone(e){let a=Jr(e,t,n,r,i);return i&&i(a),a}};return T}function Yr(e){if(Fi(e))return e=bs(e),e.children=null,e}function Xr(e){if(!Fi(e))return kr(e.type)&&e.children?Gr(e.children):e;if(e.component)return e.component.subTree;let{shapeFlag:t,children:n}=e;if(n){if(t&16)return n[0];if(t&32&&_(n.default))return n.default()}}function Zr(e,t){if(e.shapeFlag&6&&e.component){e.transition=t;let n=e.component.subTree;Zr(kr(n.type)&&Xr(n)||n,t)}else if(e.shapeFlag&128)e.ssContent.transition=t.clone(e.ssContent),e.ssFallback.transition=t.clone(e.ssFallback);else if(e.transition=t,e.type===K&&f(e.children)){let n=oo(e.children,!1);n&&Zr(n,t)}}function Qr(e,t=!1,n){let r=[],i=0;for(let a=0;a<e.length;a++){let o=e[a],s=n==null?o.key:String(n)+String(o.key==null?a:o.key);o.type===K?(o.patchFlag&128&&i++,r=r.concat(Qr(o.children,t,s))):(t||o.type!==q)&&r.push(s==null?o:bs(o,{key:s}))}if(i>1)for(let e=0;e<r.length;e++)r[e].patchFlag=-2;return r}function $r(e){if(e.component)return $r(e.component.subTree);if(e.type===K){let t=f(e.children)&&oo(e.children,!1);return t?$r(t):void 0}if(e.type!==q)return e}function ei(e,t){return _(e)?c({name:e.name},t,{setup:e}):e}function ti(){let e=js();return e?(e.appContext.config.idPrefix||`v`)+`-`+e.ids[0]+e.ids[1]++:``}function ni(e){e.ids=[e.ids[0]+e.ids[2]+++`-`,0,0]}function ri(e){let t=js(),r=on(null);if(t){let i=t.refs===n?t.refs={}:t.refs;Object.defineProperty(i,e,{enumerable:!0,get:()=>r.value,set:e=>r.value=e})}return r}function ii(e,t){let n;return!!((n=Object.getOwnPropertyDescriptor(e,t))&&!n.configurable)}var ai=new WeakMap;function oi(e,t,r,i,o=!1){if(f(e)){e.forEach((e,n)=>oi(e,t&&(f(t)?t[n]:t),r,i,o));return}if(Mi(i)&&!o){i.shapeFlag&512&&i.type.__asyncResolved&&i.component.subTree.component&&oi(e,t,r,i.component.subTree);return}let s=i.shapeFlag&4?Js(i.component):i.el,c=o?null:s,{i:u,r:p}=e,m=t&&t.r,h=u.refs===n?u.refs={}:u.refs,g=u.setupState,y=F(g),b=g===n?a:e=>!ii(h,e)&&d(y,e),x=(e,t)=>!(t&&ii(h,t));if(m!=null&&m!==p){if(si(t),v(m))h[m]=null,b(m)&&(g[m]=null);else if(L(m)){let e=t;x(m,e.k)&&(m.value=null),e.k&&(h[e.k]=null)}}if(_(p))Rn(p,u,12,[c,h]);else{let t=v(p),n=L(p);if(t||n){let i=()=>{if(e.f){let n=t?b(p)?g[p]:h[p]:x(p)||!e.k?p.value:h[e.k];if(o)f(n)&&l(n,s);else if(f(n))n.includes(s)||n.push(s);else if(t)h[p]=[s],b(p)&&(g[p]=h[p]);else{let t=[s];x(p,e.k)&&(p.value=t),e.k&&(h[e.k]=t)}}else t?(h[p]=c,b(p)&&(g[p]=c)):n&&(x(p,e.k)&&(p.value=c),e.k&&(h[e.k]=c))};if(c){let t=()=>{i(),ai.delete(e)};t.id=-1,ai.set(e,t),G(t,r)}else si(e),i()}}}function si(e){let t=ai.get(e);t&&(t.flags|=8,ai.delete(e))}var ci=!1,li=()=>{ci||=(console.error(`Hydration completed but contains mismatches.`),!0)},ui=e=>e.namespaceURI.includes(`svg`)&&e.tagName!==`foreignObject`,di=e=>e.namespaceURI.includes(`MathML`),fi=e=>{if(e.nodeType===1){if(ui(e))return`svg`;if(di(e))return`mathml`}},pi=e=>e.nodeType===8;function mi(e){let{mt:t,p:n,o:{patchProp:r,createText:i,nextSibling:a,parentNode:s,remove:c,insert:l,createComment:u}}=e,d=(e,t)=>{t.hasChildNodes()?(f(t.firstChild,e,null,null,null),$n(),t._vnode=e):(n(null,e,t),$n(),t._vnode=e)},f=(n,r,o,c,u,d=!1)=>{d||=!!r.dynamicChildren;let b=pi(n)&&n.data===`[`,x=()=>g(n,r,o,c,u,b),{type:S,ref:C,shapeFlag:w,patchFlag:T}=r,E=n.nodeType;r.el=n,T===-2&&(d=!1,r.dynamicChildren=null);let D=null;switch(S){case ns:E===3?(n.data!==r.children&&(li(),n.data=r.children),D=a(n)):r.children===``?(l(r.el=i(``),s(n),n),D=n):D=x();break;case q:y(n)?(D=a(n),v(r.el=n.content.firstChild,n,o)):D=E!==8||b?x():a(n);break;case rs:if(b&&(n=a(n),E=n.nodeType),E===1||E===3){D=n;let e=!r.children.length;for(let t=0;t<r.staticCount;t++)e&&(r.children+=D.nodeType===1?D.outerHTML:D.data),t===r.staticCount-1&&(r.anchor=D),D=a(D);return b?a(D):D}x();break;case K:D=b?h(n,r,o,c,u,d):x();break;default:if(w&1)D=(E!==1||r.type.toLowerCase()!==n.tagName.toLowerCase())&&!y(n)?x():p(n,r,o,c,u,d);else if(w&6){r.slotScopeIds=u;let e=s(n);if(D=b?_(n):pi(n)&&n.data===`teleport start`?_(n,n.data,`teleport end`):a(n),t(r,e,null,o,c,fi(e),d),(Mi(r)||r.component.asyncDep)&&!r.component.subTree){let t;b?(t=Y(rs),t.anchor=D?D.previousSibling:e.lastChild):t=n.nodeType===3?xs(``):Y(n.nodeType===8?q:`div`),t.el=n,r.component.subTree=t}}else w&64?D=E===8?r.type.hydrate(n,r,o,c,u,d,e,m):x():w&128&&(D=r.type.hydrate(n,r,o,c,fi(s(n)),u,d,e,f))}return C!=null&&oi(C,null,c,r),D},p=(e,t,n,i,a,s)=>{s||=!!t.dynamicChildren;let{type:l,dynamicProps:u,props:d,patchFlag:f,shapeFlag:p,dirs:h,transition:g}=t,_=l===`input`||l===`option`,b=!!u;if(_||b||f!==-1){h&&mr(t,null,n,`created`);let l=!1;if(y(e)){l=Lo(null,g)&&n&&n.vnode.props&&n.vnode.props.appear;let r=e.content.firstChild;if(l){let e=r.getAttribute(`class`);e&&(r.$cls=e),g.beforeEnter(r)}v(r,e,n),t.el=e=r}if(p&16&&!(d&&(d.innerHTML||d.textContent))){let r=m(e.firstChild,t,e,n,i,a,s);for(r&&!yi(e,1)&&li();r;){let e=r;r=r.nextSibling,c(e)}}else if(p&8){let n=t.children;n[0]===`
`&&(e.tagName===`PRE`||e.tagName===`TEXTAREA`)&&(n=n.slice(1));let{textContent:r}=e;r!==n&&r!==n.replace(/\r\n|\r/g,`
`)&&(yi(e,0)||li(),e.textContent=t.children)}if(d){if(_||b||!s||f&48){let t=e.tagName.includes(`-`),i=e.namespaceURI.includes(`svg`)?`svg`:e.namespaceURI.includes(`MathML`)?`mathml`:void 0;for(let a in d)if(_&&(a.endsWith(`value`)||a===`indeterminate`)||o(a)&&!D(a)||a[0]===`.`||t&&!D(a)||u&&u.includes(a)){if(gi(e,a,d[a]))continue;r(e,a,null,d[a],i,n)}}else if(d.onClick)r(e,`onClick`,null,d.onClick,void 0,n);else if(f&4&&N(d.style))for(let e in d.style)d.style[e]}let x;(x=d&&d.onVnodeBeforeMount)&&Z(x,n,t),h&&mr(t,null,n,`beforeMount`),((x=d&&d.onVnodeMounted)||h||l)&&$o(()=>{x&&Z(x,n,t),l&&g.enter(e),h&&mr(t,null,n,`mounted`)},i)}return e.nextSibling},m=(e,t,r,o,s,c,u)=>{u||=!!t.dynamicChildren;let d=t.children,p=d.length,m=!1;for(let t=0;t<p;t++){let h=u?d[t]:d[t]=X(d[t]),g=h.type===ns;e?(g&&!u&&t+1<p&&X(d[t+1]).type===ns&&(l(i(e.data.slice(h.children.length)),r,a(e)),e.data=h.children),e=f(e,h,o,s,c,u)):g&&!h.children?l(h.el=i(``),r):(m||(m=!0,yi(r,1)||li()),n(null,h,r,null,o,s,fi(r),c))}return e},h=(e,t,n,r,i,o)=>{let{slotScopeIds:c}=t;c&&(i=i?i.concat(c):c);let d=s(e),f=m(a(e),t,d,n,r,i,o);return f&&pi(f)&&f.data===`]`?a(t.anchor=f):(li(),l(t.anchor=u(`]`),d,f),f)},g=(e,t,r,i,o,l)=>{if(xi(e,t)||li(),t.el=null,l){let t=_(e);for(;;){let n=a(e);if(n&&n!==t)c(n);else break}}let u=a(e),d=s(e);return c(e),n(null,t,d,u,r,i,fi(d),o),r&&(r.vnode.el=t.el,po(r,t.el)),u},_=(e,t=`[`,n=`]`)=>{let r=0;for(;e;)if(e=a(e),e&&pi(e)&&(e.data===t&&r++,e.data===n)){if(r===0)return a(e);r--}return e},v=(e,t,n)=>{let r=t.parentNode;r&&r.replaceChild(e,t);let i=n;for(;i;)i.vnode.el===t&&(i.vnode.el=i.subTree.el=e),i=i.parent},y=e=>e.nodeType===1&&e.tagName===`TEMPLATE`;return[d,f]}var hi=new Set([`src`,`srcset`,`href`,`poster`]);function gi(e,t,n){return hi.has(t)?e.getAttribute(t)===(n==null?null:`${n}`):!1}var _i=`data-allow-mismatch`,vi={0:`text`,1:`children`,2:`class`,3:`style`,4:`attribute`};function yi(e,t){if(t===0||t===1)for(;e&&!e.hasAttribute(_i);)e=e.parentElement;return bi(e&&e.getAttribute(_i),t)}function bi(e,t){if(e==null)return!1;if(e===``)return!0;{let n=e.split(`,`);return t===0&&n.includes(`children`)?!0:n.includes(vi[t])}}function xi(e,t){return yi(e.parentElement,1)||Si(e)||Ci(t)}function Si(e){return e.nodeType===1&&bi(e.getAttribute(_i),1)}function Ci({props:e}){let t=e&&e[_i];return typeof t==`string`&&bi(t,1)}var wi=de().requestIdleCallback||(e=>setTimeout(e,1)),Ti=de().cancelIdleCallback||(e=>clearTimeout(e)),Ei=(e=1e4)=>t=>{let n=wi(t,{timeout:e});return()=>Ti(n)};function Di(e){let{top:t,left:n,bottom:r,right:i}=e.getBoundingClientRect(),{innerHeight:a,innerWidth:o}=window;return(t>0&&t<a||r>0&&r<a)&&(n>0&&n<o||i>0&&i<o)}var Oi=e=>(t,n)=>{let r=new IntersectionObserver(e=>{for(let n of e)if(n.isIntersecting){r.disconnect(),t();break}},e),i=e=>{if(Di(e))return t(),r.disconnect(),!1;if(getComputedStyle(e).display===`contents`){for(let t=0;t<e.children.length;t++)if(i(e.children[t])===!1)return!1}r.observe(e)};return n(e=>{if(e instanceof Element)return i(e)}),()=>r.disconnect()},ki=e=>t=>{if(e){let n=matchMedia(e);if(n.matches)t();else return n.addEventListener(`change`,t,{once:!0}),()=>n.removeEventListener(`change`,t)}},Ai=(e=[])=>(t,n)=>{v(e)&&(e=[e]);let r=!1,i=e=>{r||(r=!0,a(),t(),e.target.dispatchEvent(new e.constructor(e.type,e)))},a=()=>{n(t=>{for(let n of e)t.removeEventListener(n,i)})};return n(t=>{for(let n of e)t.addEventListener(n,i,{once:!0})}),a};function ji(e,t){if(pi(e)&&e.data===`[`){let n=1,r=e.nextSibling;for(;r;){if(r.nodeType===1){if(t(r)===!1)break}else if(pi(r)){if(r.data===`]`){if(--n===0)break}else r.data===`[`&&n++}r=r.nextSibling}}else t(e)}var Mi=e=>!!e.type.__asyncLoader;function Ni(e){_(e)&&(e={loader:e});let{loader:t,loadingComponent:n,errorComponent:r,delay:i=200,hydrate:a,timeout:o,suspensible:s=!0,onError:c}=e,l=null,u,d=0,f=()=>(d++,l=null,p()),p=()=>{let e;return l||(e=l=t().catch(e=>{if(e=e instanceof Error?e:Error(String(e)),c)return new Promise((t,n)=>{c(e,()=>t(f()),()=>n(e),d+1)});throw e}).then(t=>e!==l&&l?l:(t&&(t.__esModule||t[Symbol.toStringTag]===`Module`)&&(t=t.default),u=t,t)))};return ei({name:`AsyncComponentWrapper`,__asyncLoader:p,__asyncHydrate(e,t,n){let r=e.isConnected,i=!1;(t.bu||=[]).push(()=>i=!0);let o=()=>{i||!e.parentNode||r&&!e.isConnected||n()},s=a?()=>{let n=a(o,t=>ji(e,t));n&&(t.bum||=[]).push(n)}:o;u?s():p().then(()=>!t.isUnmounted&&s())},get __asyncResolved(){return u},setup(){let e=Q;if(ni(e),u)return()=>Pi(u,e);let t=t=>{l=null,zn(t,e,13,!r)};if(s&&e.suspense||Ls)return p().then(t=>()=>Pi(t,e)).catch(e=>(t(e),()=>r?Y(r,{error:e}):null));let a=R(!1),c=R(),d=R(!!i),f,m;return Zi(()=>{f!=null&&clearTimeout(f),m!=null&&clearTimeout(m)}),i&&(m=setTimeout(()=>{e.isUnmounted||(d.value=!1)},i)),o!=null&&(f=setTimeout(()=>{if(!e.isUnmounted&&!a.value&&!c.value){let e=Error(`Async component timed out after ${o}ms.`);t(e),c.value=e}},o)),p().then(()=>{e.isUnmounted||(a.value=!0,e.parent&&Fi(e.parent.vnode)&&e.parent.update())}).catch(n=>{e.isUnmounted?l=null:(t(n),c.value=n)}),()=>{if(a.value&&u)return Pi(u,e);if(c.value&&r)return Y(r,{error:c.value});if(n&&!d.value)return Pi(n,e)}}})}function Pi(e,t){let{ref:n,props:r,children:i,ce:a}=t.vnode,o=Y(e,r,i);return o.ref=n,o.ce=a,delete t.vnode.ce,o}var Fi=e=>e.type.__isKeepAlive,Ii={name:`KeepAlive`,__isKeepAlive:!0,props:{include:[String,RegExp,Array],exclude:[String,RegExp,Array],max:[String,Number]},setup(e,{slots:t}){let n=js(),r=n.ctx;if(!r.renderer)return()=>{let e=t.default&&t.default();return e&&e.length===1?e[0]:e};let i=new Map,a=new Set,o=null,s=n.suspense,{renderer:{p:c,m:l,um:u,o:{createElement:d}}}=r,f=d(`div`);r.activate=(e,t,n,r,i)=>{let a=e.component;l(e,t,n,0,s),c(a.vnode,e,t,n,a,s,r,e.slotScopeIds,i),G(()=>{a.isDeactivated=!1,a.a&&oe(a.a);let t=e.props&&e.props.onVnodeMounted;t&&Z(t,a.parent,e)},s)},r.deactivate=e=>{let t=e.component;Vo(t.m),Vo(t.a),l(e,f,null,1,s),G(()=>{t.da&&oe(t.da);let n=e.props&&e.props.onVnodeUnmounted;n&&Z(n,t.parent,e),t.isDeactivated=!0},s)};function p(e){Hi(e),u(e,n,s,!0)}function m(e){i.forEach((t,n)=>{let r=Ys(Mi(t)?t.type.__asyncResolved||{}:t.type);r&&!e(r)&&h(n)})}function h(e){let t=i.get(e);t&&(!o||!ps(t,o))?p(t):o&&(Hi(o),t&&Hi(t)),i.delete(e),a.delete(e)}Cr(()=>[e.include,e.exclude],([e,t])=>{e&&m(t=>Li(e,t)),t&&m(e=>!Li(t,e))},{flush:`post`,deep:!0});let g=null,_=()=>{g!=null&&(Uo(n.subTree.type)?G(()=>{let e=Ui(n.subTree);e.component&&i.set(g,e)},n.subTree.suspense):i.set(g,Ui(n.subTree)))};return qi(_),Yi(_),Xi(()=>{i.forEach(e=>{let{subTree:t,suspense:r}=n,i=Ui(t);if(e.type===i.type&&e.key===i.key){Hi(i);let e=i.component.da;e&&G(e,r)}else p(e)})}),()=>{if(g=null,!t.default)return o=null;let n=t.default(),r=n[0];if(n.length>1)return o=null,n;if(!fs(r)||!(r.shapeFlag&4)&&!(r.shapeFlag&128))return o=null,r;let s=Ui(r);if(s.type===q)return o=null,s;let c=s.type,l=Ys(Mi(s)?s.type.__asyncResolved||{}:c),{include:u,exclude:d,max:f}=e;if(u&&(!l||!Li(u,l))||d&&l&&Li(d,l))return s.shapeFlag&=-257,o=s,r;let p=s.key==null?c:s.key,m=i.get(p);return s.el&&(s=bs(s),r.shapeFlag&128&&(r.ssContent=s)),g=p,m?(s.el=m.el,s.component=m.component,s.transition&&Zr(s,s.transition),s.shapeFlag|=512,a.delete(p),a.add(p)):(a.add(p),f&&a.size>parseInt(f,10)&&h(a.values().next().value)),s.shapeFlag|=256,o=s,Uo(r.type)?r:s}}};function Li(e,t){return f(e)?e.some(e=>Li(e,t)):v(e)?e.split(`,`).includes(t):g(e)?(e.lastIndex=0,e.test(t)):!1}function Ri(e,t){Bi(e,`a`,t)}function zi(e,t){Bi(e,`da`,t)}function Bi(e,t,n=Q){let r=e.__wdc||=()=>{let t=n;for(;t;){if(t.isDeactivated)return;t=t.parent}return e()};if(Wi(t,r,n),n){let e=n.parent;for(;e&&e.parent;)Fi(e.parent.vnode)&&Vi(r,t,n,e),e=e.parent}}function Vi(e,t,n,r){let i=Wi(t,e,r,!0);Zi(()=>{l(r[t],i)},n)}function Hi(e){e.shapeFlag&=-257,e.shapeFlag&=-513}function Ui(e){return e.shapeFlag&128?e.ssContent:e}function Wi(e,t,n=Q,r=!1){if(n){let i=n[e]||(n[e]=[]),a=t.__weh||=(...r)=>{tt();let i=Ps(n),a=z(t,n,e,r);return i(),nt(),a};return r?i.unshift(a):i.push(a),a}}var Gi=e=>(t,n=Q)=>{(!Ls||e===`sp`)&&Wi(e,(...e)=>t(...e),n)},Ki=Gi(`bm`),qi=Gi(`m`),Ji=Gi(`bu`),Yi=Gi(`u`),Xi=Gi(`bum`),Zi=Gi(`um`),Qi=Gi(`sp`),$i=Gi(`rtg`),ea=Gi(`rtc`);function ta(e,t=Q){Wi(`ec`,e,t)}var na=`components`,ra=`directives`;function ia(e,t){return ca(na,e,!0,t)||e}var aa=Symbol.for(`v-ndc`);function oa(e){return v(e)?ca(na,e,!1)||e:e||aa}function sa(e){return ca(ra,e)}function ca(e,t,n=!0,r=!1){let i=V||Q;if(i){let n=i.type;if(e===na){let e=Ys(n,!1);if(e&&(e===t||e===O(t)||e===ie(O(t))))return n}let a=la(i[e]||n[e],t)||la(i.appContext[e],t);return!a&&r?n:a}}function la(e,t){return e&&(e[t]||e[O(t)]||e[ie(O(t))])}function ua(e,t,n,r){let i,a=n&&n[r],o=f(e);if(o||v(e)){let n=o&&N(e),r=!1,s=!1;n&&(r=!P(e),s=tn(e),e=ht(e)),i=Array(e.length);for(let n=0,o=e.length;n<o;n++)i[n]=t(r?s?an(I(e[n])):I(e[n]):e[n],n,void 0,a&&a[n])}else if(typeof e==`number`){if(!Number.isInteger(e)||e<0)i=[];else{i=Array(e);for(let n=0;n<e;n++)i[n]=t(n+1,n,void 0,a&&a[n])}}else if(b(e)){if(e[Symbol.iterator])i=Array.from(e,(e,n)=>t(e,n,void 0,a&&a[n]));else{let n=Object.keys(e);i=Array(n.length);for(let r=0,o=n.length;r<o;r++){let o=n[r];i[r]=t(e[o],o,r,a&&a[r])}}}else i=[];return n&&(n[r]=i),i}function da(e,t){for(let n=0;n<t.length;n++){let r=t[n];if(f(r))for(let t=0;t<r.length;t++)e[r[t].name]=r[t].fn;else r&&(e[r.name]=r.key?(...e)=>{let t=r.fn(...e);return t&&(t.key=r.key),t}:r.fn)}return e}function fa(e,t,n,r,i,a){if(n??={},V.ce||V.parent&&Mi(V.parent)&&V.parent.ce){let e=a!=null&&n.key==null?c({},n,{key:a}):n,i=Object.keys(e).length>0;return t!=="default"&&(e.name=t),as(),ds(K,null,[Y(`slot`,e,r&&r())],i?-2:64)}let o=e[t];o&&o._c&&(o._d=!1);let s=is.length;as();let l;try{let i=o&&pa(o(n)),s=n.key||a||i&&i.key;l=ds(K,{key:(s&&!y(s)?s:`_${t}`)+(!i&&r?`_fb`:``)},i||(r?r():[]),i&&e._===1?64:-2)}catch(e){for(let e=is.length;e>s;e--)os();throw e}finally{o&&o._c&&(o._d=!0)}return!i&&l.scopeId&&(l.slotScopeIds=[l.scopeId+`-s`]),l}function pa(e){return e.some(e=>!fs(e)||!(e.type===q||e.type===K&&!pa(e.children)))?e:null}function ma(e,t){let n={};for(let r in e)n[t&&/[A-Z]/.test(r)?`on:${r}`:ae(r)]=e[r];return n}var ha=e=>e?Is(e)?Js(e):ha(e.parent):null,ga=c(Object.create(null),{$:e=>e,$el:e=>e.vnode.el,$data:e=>e.data,$props:e=>e.props,$attrs:e=>e.attrs,$slots:e=>e.slots,$refs:e=>e.refs,$parent:e=>ha(e.parent),$root:e=>ha(e.root),$host:e=>e.ce,$emit:e=>e.emit,$options:e=>Ba(e),$forceUpdate:e=>e.f||=()=>{Yn(e.update)},$nextTick:e=>e.n||=qn.bind(e.proxy),$watch:e=>Tr.bind(e)}),_a=(e,t)=>e!==n&&!e.__isScriptSetup&&d(e,t),va={get({_:e},t){if(t===`__v_skip`)return!0;let{ctx:r,setupState:i,data:a,props:o,accessCache:s,type:c,appContext:l}=e;if(t[0]!==`$`){let e=s[t];if(e!==void 0)switch(e){case 1:return i[t];case 2:return a[t];case 4:return r[t];case 3:return o[t]}else if(_a(i,t))return s[t]=1,i[t];else if(a!==n&&d(a,t))return s[t]=2,a[t];else if(d(o,t))return s[t]=3,o[t];else if(r!==n&&d(r,t))return s[t]=4,r[t];else Fa&&(s[t]=0)}let u=ga[t],f,p;if(u)return t===`$attrs`&&M(e.attrs,`get`,``),u(e);if((f=c.__cssModules)&&(f=f[t]))return f;if(r!==n&&d(r,t))return s[t]=4,r[t];if(p=l.config.globalProperties,d(p,t))return p[t]},set({_:e},t,r){let{data:i,setupState:a,ctx:o}=e;return _a(a,t)?(a[t]=r,!0):i!==n&&d(i,t)?(i[t]=r,!0):d(e.props,t)||t[0]===`$`&&t.slice(1)in e?!1:(o[t]=r,!0)},has({_:{data:e,setupState:t,accessCache:r,ctx:i,appContext:a,props:o,type:s}},c){let l;return!!(r[c]||e!==n&&c[0]!==`$`&&d(e,c)||_a(t,c)||d(o,c)||d(i,c)||d(ga,c)||d(a.config.globalProperties,c)||(l=s.__cssModules)&&l[c])},defineProperty(e,t,n){return n.get==null?d(n,`value`)&&this.set(e,t,n.value,null):e._.accessCache[t]=0,Reflect.defineProperty(e,t,n)}},ya=c({},va,{get(e,t){if(t!==Symbol.unscopables)return va.get(e,t,e)},has(e,t){return t[0]!==`_`&&!fe(t)}});function ba(){return null}function xa(){return null}function Sa(e){}function Ca(e){}function wa(){return null}function Ta(){}function Ea(e,t){return null}function Da(){return ka(`useSlots`).slots}function Oa(){return ka(`useAttrs`).attrs}function ka(e){let t=js();return t.setupContext||=qs(t)}function Aa(e){return f(e)?e.reduce((e,t)=>(e[t]=null,e),{}):e}function ja(e,t){let n=Aa(e);for(let e in t){if(e.startsWith(`__skip`))continue;let r=n[e];r?f(r)||_(r)?r=n[e]={type:r,default:t[e]}:r.default=t[e]:r===null&&(r=n[e]={default:t[e]}),r&&t[`__skip_${e}`]&&(r.skipFactory=!0)}return n}function Ma(e,t){return!e||!t?e||t:f(e)&&f(t)?e.concat(t):c({},Aa(e),Aa(t))}function Na(e,t){let n={};for(let r in e)t.includes(r)||Object.defineProperty(n,r,{enumerable:!0,get:()=>e[r]});return n}function Pa(e){let t=js(),n=Ls,r=e();Fs(),n&&Ns(!1);let i=()=>{Ps(t),n&&Ns(!0)},a=()=>{js()!==t&&t.scope.off(),Fs(),n&&Ns(!1)};return x(r)&&(r=r.catch(e=>{throw i(),Promise.resolve().then(()=>Promise.resolve().then(a)),e})),[r,()=>{i(),Promise.resolve().then(a)}]}var Fa=!0;function Ia(e){let t=Ba(e),n=e.proxy,r=e.ctx;Fa=!1,t.beforeCreate&&Ra(t.beforeCreate,e,`bc`);let{data:a,computed:o,methods:s,watch:c,provide:l,inject:u,created:d,beforeMount:p,mounted:m,beforeUpdate:h,updated:g,activated:v,deactivated:y,beforeDestroy:x,beforeUnmount:S,destroyed:C,unmounted:w,render:T,renderTracked:E,renderTriggered:D,errorCaptured:ee,serverPrefetch:te,expose:O,inheritAttrs:ne,components:re,directives:ie,filters:ae}=t;if(u&&La(u,r,null),s)for(let e in s){let t=s[e];_(t)&&(r[e]=t.bind(n))}if(a){let t=a.call(n,n);b(t)&&(e.data=Xt(t))}if(Fa=!0,o)for(let e in o){let t=o[e],a=Zs({get:_(t)?t.bind(n,n):_(t.get)?t.get.bind(n,n):i,set:!_(t)&&_(t.set)?t.set.bind(n):i});Object.defineProperty(r,e,{enumerable:!0,configurable:!0,get:()=>a.value,set:e=>a.value=e})}if(c)for(let e in c)za(c[e],r,n,e);if(l){let e=_(l)?l.call(n):l;Reflect.ownKeys(e).forEach(t=>{hr(t,e[t])})}d&&Ra(d,e,`c`);function k(e,t){f(t)?t.forEach(t=>e(t.bind(n))):t&&e(t.bind(n))}if(k(Ki,p),k(qi,m),k(Ji,h),k(Yi,g),k(Ri,v),k(zi,y),k(ta,ee),k(ea,E),k($i,D),k(Xi,S),k(Zi,w),k(Qi,te),f(O)){if(O.length){let t=e.exposed||={};O.forEach(e=>{Object.defineProperty(t,e,{get:()=>n[e],set:t=>n[e]=t,enumerable:!0})})}else e.exposed||={}}T&&e.render===i&&(e.render=T),ne!=null&&(e.inheritAttrs=ne),re&&(e.components=re),ie&&(e.directives=ie),te&&ni(e)}function La(e,t,n=i){f(e)&&(e=Ga(e));for(let n in e){let r=e[n],i;i=b(r)?`default`in r?gr(r.from||n,r.default,!0):gr(r.from||n):gr(r),L(i)?Object.defineProperty(t,n,{enumerable:!0,configurable:!0,get:()=>i.value,set:e=>i.value=e}):t[n]=i}}function Ra(e,t,n){z(f(e)?e.map(e=>e.bind(t.proxy)):e.bind(t.proxy),t,n)}function za(e,t,n,r){let i=r.includes(`.`)?Er(n,r):()=>n[r];if(v(e)){let n=t[e];_(n)&&Cr(i,n)}else if(_(e))Cr(i,e.bind(n));else if(b(e)){if(f(e))e.forEach(e=>za(e,t,n,r));else{let r=_(e.handler)?e.handler.bind(n):t[e.handler];_(r)&&Cr(i,r,e)}}}function Ba(e){let t=e.type,{mixins:n,extends:r}=t,{mixins:i,optionsCache:a,config:{optionMergeStrategies:o}}=e.appContext,s=a.get(t),c;return s?c=s:!i.length&&!n&&!r?c=t:(c={},i.length&&i.forEach(e=>Va(c,e,o,!0)),Va(c,t,o)),b(t)&&a.set(t,c),c}function Va(e,t,n,r=!1){let{mixins:i,extends:a}=t;a&&Va(e,a,n,!0),i&&i.forEach(t=>Va(e,t,n,!0));for(let i in t)if(!(r&&i===`expose`)){let r=Ha[i]||n&&n[i];e[i]=r?r(e[i],t[i]):t[i]}return e}var Ha={data:Ua,props:qa,emits:qa,methods:Ka,computed:Ka,beforeCreate:W,created:W,beforeMount:W,mounted:W,beforeUpdate:W,updated:W,beforeDestroy:W,beforeUnmount:W,destroyed:W,unmounted:W,activated:W,deactivated:W,errorCaptured:W,serverPrefetch:W,components:Ka,directives:Ka,watch:Ja,provide:Ua,inject:Wa};function Ua(e,t){return t?e?function(){return c(_(e)?e.call(this,this):e,_(t)?t.call(this,this):t)}:t:e}function Wa(e,t){return Ka(Ga(e),Ga(t))}function Ga(e){if(f(e)){let t={};for(let n=0;n<e.length;n++)t[e[n]]=e[n];return t}return e}function W(e,t){return e?[...new Set([].concat(e,t))]:t}function Ka(e,t){return e?c(Object.create(null),e,t):t}function qa(e,t){return e?f(e)&&f(t)?[...new Set([...e,...t])]:c(Object.create(null),Aa(e),Aa(t??{})):t}function Ja(e,t){if(!e)return t;if(!t)return e;let n=c(Object.create(null),e);for(let r in t)n[r]=W(e[r],t[r]);return n}function Ya(){return{app:null,config:{isNativeTag:a,performance:!1,globalProperties:{},optionMergeStrategies:{},errorHandler:void 0,warnHandler:void 0,compilerOptions:{}},mixins:[],components:{},directives:{},provides:Object.create(null),optionsCache:new WeakMap,propsCache:new WeakMap,emitsCache:new WeakMap}}var Xa=0;function Za(e,t){return function(n,r=null){_(n)||(n=c({},n)),r!=null&&!b(r)&&(r=null);let i=Ya(),a=new WeakSet,o=[],s=!1,l=i.app={_uid:Xa++,_component:n,_props:r,_container:null,_context:i,_instance:null,version:nc,get config(){return i.config},set config(e){},use(e,...t){return a.has(e)||(e&&_(e.install)?(a.add(e),e.install(l,...t)):_(e)&&(a.add(e),e(l,...t))),l},mixin(e){return i.mixins.includes(e)||i.mixins.push(e),l},component(e,t){return t?(i.components[e]=t,l):i.components[e]},directive(e,t){return t?(i.directives[e]=t,l):i.directives[e]},mount(a,o,c){if(!s){let u=l._ceVNode||Y(n,r);return u.appContext=i,c===!0?c=`svg`:c===!1&&(c=void 0),o&&t?t(u,a):e(u,a,c),s=!0,l._container=a,a.__vue_app__=l,Js(u.component)}},onUnmount(e){o.push(e)},unmount(){s&&(z(o,l._instance,16),e(null,l._container),delete l._container.__vue_app__)},provide(e,t){return i.provides[e]=t,l},runWithContext(e){let t=Qa;Qa=l;try{return e()}finally{Qa=t}}};return l}}var Qa=null;function $a(e,t,r=n){let i=js(),a=O(t),o=re(t),s=eo(e,a),c=hn((s,c)=>{let l,u=n,d;return Sr(()=>{let t=e[a];k(l,t)&&(l=t,c())}),{get(){return s(),r.get?r.get(l):l},set(e){let s=r.set?r.set(e):e;if(!k(s,l)&&!(u!==n&&k(e,u)))return;let f=i.vnode.props,p=!!(f&&(t in f||a in f||o in f)&&(`onUpdate:${t}`in f||`onUpdate:${a}`in f||`onUpdate:${o}`in f));p||(l=e,c()),i.emit(`update:${t}`,s),k(e,u)&&(k(e,s)&&!k(s,d)||p&&u!==n&&!k(s,l))&&c(),u=e,d=s}}});return c[Symbol.iterator]=()=>{let e=0;return{next(){return e<2?{value:e++?s||n:c,done:!1}:{done:!0}}}},c}var eo=(e,t)=>t===`modelValue`||t===`model-value`?e.modelModifiers:e[`${t}Modifiers`]||e[`${O(t)}Modifiers`]||e[`${re(t)}Modifiers`];function to(e,t,...r){if(e.isUnmounted)return;let i=e.vnode.props||n,a=r,o=t.startsWith(`update:`),s=o&&eo(i,t.slice(7));s&&(s.trim&&(a=r.map(e=>v(e)?e.trim():e)),s.number&&(a=a.map(ce)));let c,l=i[c=ae(t)]||i[c=ae(O(t))];!l&&o&&(l=i[c=ae(re(t))]),l&&z(l,e,6,a);let u=i[c+`Once`];if(u){if(!e.emitted)e.emitted={};else if(e.emitted[c])return;e.emitted[c]=!0,z(u,e,6,a)}}var no=new WeakMap;function ro(e,t,n=!1){let r=n?no:t.emitsCache,i=r.get(e);if(i!==void 0)return i;let a=e.emits,o={},s=!1;if(!_(e)){let r=e=>{let n=ro(e,t,!0);n&&(s=!0,c(o,n))};!n&&t.mixins.length&&t.mixins.forEach(r),e.extends&&r(e.extends),e.mixins&&e.mixins.forEach(r)}return!a&&!s?(b(e)&&r.set(e,null),null):(f(a)?a.forEach(e=>o[e]=null):c(o,a),b(e)&&r.set(e,o),o)}function io(e,t){return!e||!o(t)?!1:(t=t.slice(2),t=t===`Once`?t:t.replace(/Once$/,``),d(e,t[0].toLowerCase()+t.slice(1))||d(e,re(t))||d(e,t))}function ao(e){let{type:t,vnode:n,proxy:r,withProxy:i,propsOptions:[a],slots:o,attrs:c,emit:l,render:u,renderCache:d,props:f,data:p,setupState:m,ctx:h,inheritAttrs:g}=e,_=cr(e),v,y;try{if(n.shapeFlag&4){let e=i||r,t=e;v=X(u.call(t,e,d,f,m,p,h)),y=c}else{let e=t;v=X(e.length>1?e(f,{attrs:c,slots:o,emit:l}):e(f,null)),y=t.props?c:so(c)}}catch(t){is.length=0,zn(t,e,1),v=Y(q)}let b=v;if(y&&g!==!1){let e=Object.keys(y),{shapeFlag:t}=b;e.length&&t&7&&(a&&e.some(s)&&(y=co(y,a)),b=bs(b,y,!1,!0))}return n.dirs&&(b=bs(b,null,!1,!0),b.dirs=b.dirs?b.dirs.concat(n.dirs):n.dirs),n.transition&&Zr(kr(b.type)&&Xr(b)||b,n.transition),v=b,cr(_),v}function oo(e,t=!0){let n;for(let t=0;t<e.length;t++){let r=e[t];if(fs(r)){if(r.type!==q||r.children===`v-if`){if(n)return;n=r}}else return}return n}var so=e=>{let t;for(let n in e)(n===`class`||n===`style`||o(n))&&((t||={})[n]=e[n]);return t},co=(e,t)=>{let n={};for(let r in e)(!s(r)||!(r.slice(9)in t))&&(n[r]=e[r]);return n};function lo(e,t,n){let{props:r,children:i,component:a}=e,{props:o,children:s,patchFlag:c}=t,l=a.emitsOptions;if(t.dirs||t.transition)return!0;if(n&&c>=0){if(c&1024)return!0;if(c&16)return r?uo(r,o,l):!!o;if(c&8){let e=t.dynamicProps;for(let t=0;t<e.length;t++){let n=e[t];if(fo(o,r,n)&&!io(l,n))return!0}}}else return(i||s)&&(!s||!s.$stable)?!0:r===o?!1:r?!o||uo(r,o,l):!!o;return!1}function uo(e,t,n){let r=Object.keys(t);if(r.length!==Object.keys(e).length)return!0;for(let i=0;i<r.length;i++){let a=r[i];if(!d(e,a)||fo(t,e,a)&&!io(n,a))return!0}return!1}function fo(e,t,n){let r=e[n],i=t[n];return n===`style`&&b(r)&&b(i)?!Ee(r,i):r!==i}function po({vnode:e,parent:t,suspense:n},r){for(;t;){let n=t.subTree;if(n.suspense&&n.suspense.activeBranch===e&&(n.suspense.vnode.el=n.el=r,e=n),n===e)(e=t.vnode).el=r,t=t.parent;else break}n&&n.activeBranch===e&&(n.vnode.el=r)}var mo={},ho=()=>Object.create(mo),go=e=>Object.getPrototypeOf(e)===mo;function _o(e,t,n,r=!1){let i={},a=ho();e.propsDefaults=Object.create(null),yo(e,t,i,a);for(let t in e.propsOptions[0])t in i||(i[t]=void 0);e.props=n?r?i:Zt(i):e.type.props?i:a,e.attrs=a}function vo(e,t,n,r){let{props:i,attrs:a,vnode:{patchFlag:o}}=e,s=F(i),[c]=e.propsOptions,l=!1;if((r||o>0)&&!(o&16)){if(o&8){let n=e.vnode.dynamicProps;for(let r=0;r<n.length;r++){let o=n[r];if(io(e.emitsOptions,o))continue;let u=t[o];if(c){if(d(a,o))u!==a[o]&&(a[o]=u,l=!0);else{let t=O(o);i[t]=bo(c,s,t,u,e,!1)}}else u!==a[o]&&(a[o]=u,l=!0)}}}else{yo(e,t,i,a)&&(l=!0);let r;for(let a in s)(!t||!d(t,a)&&((r=re(a))===a||!d(t,r)))&&(c?n&&(n[a]!==void 0||n[r]!==void 0)&&(i[a]=bo(c,s,a,void 0,e,!0)):delete i[a]);if(a!==s)for(let e in a)(!t||!d(t,e))&&(delete a[e],l=!0)}l&&ft(e.attrs,`set`,``)}function yo(e,t,r,i){let[a,o]=e.propsOptions,s=!1,c;if(t)for(let n in t){if(D(n))continue;let l=t[n],u;a&&d(a,u=O(n))?!o||!o.includes(u)?r[u]=l:(c||={})[u]=l:io(e.emitsOptions,n)||(!(n in i)||l!==i[n])&&(i[n]=l,s=!0)}if(o){let t=F(r),i=c||n;for(let n=0;n<o.length;n++){let s=o[n];r[s]=bo(a,t,s,i[s],e,!d(i,s))}}return s}function bo(e,t,n,r,i,a){let o=e[n];if(o!=null){let e=d(o,`default`);if(e&&r===void 0){let e=o.default;if(o.type!==Function&&!o.skipFactory&&_(e)){let{propsDefaults:a}=i;if(n in a)r=a[n];else{let o=Ps(i);r=a[n]=e.call(null,t),o()}}else r=e;i.ce&&i.ce._setProp(n,r)}o[0]&&(a&&!e?r=!1:o[1]&&(r===``||r===re(n))&&(r=!0))}return r}var xo=new WeakMap;function So(e,t,i=!1){let a=i?xo:t.propsCache,o=a.get(e);if(o)return o;let s=e.props,l={},u=[],p=!1;if(!_(e)){let n=e=>{p=!0;let[n,r]=So(e,t,!0);c(l,n),r&&u.push(...r)};!i&&t.mixins.length&&t.mixins.forEach(n),e.extends&&n(e.extends),e.mixins&&e.mixins.forEach(n)}if(!s&&!p)return b(e)&&a.set(e,r),r;if(f(s))for(let e=0;e<s.length;e++){let t=O(s[e]);Co(t)&&(l[t]=n)}else if(s)for(let e in s){let t=O(e);if(Co(t)){let n=s[e],r=l[t]=f(n)||_(n)?{type:n}:c({},n),i=r.type,a=!1,o=!0;if(f(i))for(let e=0;e<i.length;++e){let t=i[e],n=_(t)&&t.name;if(n===`Boolean`){a=!0;break}n===`String`&&(o=!1)}else a=_(i)&&i.name===`Boolean`;r[0]=a,r[1]=o,(a||d(r,`default`))&&u.push(t)}}let m=[l,u];return b(e)&&a.set(e,m),m}function Co(e){return e[0]!==`$`&&!D(e)}var wo=e=>e===`_`||e===`_ctx`||e===`$stable`,To=e=>f(e)?e.map(X):[X(e)],Eo=(e,t,n)=>{if(t._n)return t;let r=fr((...e)=>To(t(...e)),n);return r._c=!1,r},Do=(e,t,n)=>{let r=e._ctx;for(let n in e){if(wo(n))continue;let i=e[n];if(_(i))t[n]=Eo(n,i,r);else if(i!=null){let e=To(i);t[n]=()=>e}}},Oo=(e,t)=>{let n=To(t);e.slots.default=()=>n},ko=(e,t,n)=>{for(let r in t)(n||!wo(r))&&(e[r]=t[r])},Ao=(e,t,n)=>{let r=e.slots=ho();if(e.vnode.shapeFlag&32){let e=t._;e?(ko(r,t,n),n&&se(r,`_`,e,!0)):Do(t,r)}else t&&Oo(e,t)},jo=(e,t,r)=>{let{vnode:i,slots:a}=e,o=!0,s=n;if(i.shapeFlag&32){let e=t._;e?r&&e===1?o=!1:ko(a,t,r):(o=!t.$stable,Do(t,a)),s=t}else t&&(Oo(e,t),s={default:1});if(o)for(let e in a)!wo(e)&&s[e]==null&&delete a[e]},G=$o;function Mo(e){return Po(e)}function No(e){return Po(e,mi)}function Po(e,t){let a=de();a.__VUE__=!0;let{insert:o,remove:s,patchProp:c,createElement:l,createText:u,createComment:d,setText:f,setElementText:p,parentNode:m,nextSibling:h,setScopeId:g=i,insertStaticContent:_}=e,v=(e,t,n,i=null,a=null,o=null,s=void 0,c=null,l=!!t.dynamicChildren)=>{if(e===t)return;e&&!ps(e,t)&&(i=ye(e),me(e,a,o,!0),e=null),t.patchFlag===-2&&(l=!1,t.dynamicChildren=null),t.dynamicChildren&&e&&e.dynamicChildren&&e.dynamicChildren.hasOnce&&(t.dynamicChildren===r&&(t.dynamicChildren=[]),t.dynamicChildren.hasOnce=!0);let{type:u,ref:d,shapeFlag:f}=t;switch(u){case ns:y(e,t,n,i);break;case q:b(e,t,n,i);break;case rs:e??x(t,n,i,s);break;case K:re(e,t,n,i,a,o,s,c,l);break;default:f&1?w(e,t,n,i,a,o,s,c,l):f&6?ie(e,t,n,i,a,o,s,c,l):(f&64||f&128)&&u.process(e,t,n,i,a,o,s,c,l,xe)}d!=null&&a?oi(d,e&&e.ref,o,t||e,!t):d==null&&e&&e.ref!=null&&oi(e.ref,null,o,e,!0)},y=(e,t,n,r)=>{if(e==null)o(t.el=u(t.children),n,r);else{let n=t.el=e.el;t.children!==e.children&&f(n,t.children)}},b=(e,t,n,r)=>{e==null?o(t.el=d(t.children||``),n,r):t.el=e.el},x=(e,t,n,r)=>{[e.el,e.anchor]=_(e.children,t,n,r,e.el,e.anchor)},S=({el:e,anchor:t},n,r)=>{let i;for(;e&&e!==t;)i=h(e),o(e,n,r),e=i;o(t,n,r)},C=({el:e,anchor:t})=>{let n;for(;e&&e!==t;)n=h(e),s(e),e=n;s(t)},w=(e,t,n,r,i,a,o,s,c)=>{if(t.type===`svg`?o=`svg`:t.type===`math`&&(o=`mathml`),e==null)T(t,n,r,i,a,o,s,c);else{let n=e.el&&e.el._isVueCE?e.el:null;try{n&&n._beginPatch(),te(e,t,i,a,o,s,c)}finally{n&&n._endPatch()}}},T=(e,t,n,r,i,a,s,u)=>{let d,f,{props:m,shapeFlag:h,transition:g,dirs:_}=e;if(d=e.el=l(e.type,a,m&&m.is,m),h&8?p(d,e.children):h&16&&ee(e.children,d,null,r,i,Fo(e,a),s,u),_&&mr(e,null,r,`created`),E(d,e,e.scopeId,s,r),m){for(let e in m)e!==`value`&&!D(e)&&c(d,e,null,m[e],a,r);`value`in m&&c(d,`value`,null,m.value,a),(f=m.onVnodeBeforeMount)&&Z(f,r,e)}_&&mr(e,null,r,`beforeMount`);let v=Lo(i,g);v&&g.beforeEnter(d),o(d,t,n),((f=m&&m.onVnodeMounted)||v||_)&&G(()=>{try{f&&Z(f,r,e),v&&g.enter(d),_&&mr(e,null,r,`mounted`)}finally{}},i)},E=(e,t,n,r,i)=>{if(n&&g(e,n),r)for(let t=0;t<r.length;t++)g(e,r[t]);if(i){let n=i.subTree;if(t===n||Uo(n.type)&&(n.ssContent===t||n.ssFallback===t)){let t=i.vnode;E(e,t,t.scopeId,t.slotScopeIds,i.parent)}}},ee=(e,t,n,r,i,a,o,s,c=0)=>{for(let l=c;l<e.length;l++){let c=e[l]=s?ws(e[l]):X(e[l]);v(null,c,t,n,r,i,a,o,s)}},te=(e,t,r,i,a,o,s)=>{let l=t.el=e.el,{patchFlag:u,dynamicChildren:d,dirs:f}=t;u|=e.patchFlag&16;let m=e.props||n,h=t.props||n,g;if(r&&Io(r,!1),(g=h.onVnodeBeforeUpdate)&&Z(g,r,t,e),f&&mr(t,e,r,`beforeUpdate`),r&&Io(r,!0),d&&(!e.dynamicChildren||e.dynamicChildren.length!==d.length)&&(u=0,s=!1,d=null),(m.innerHTML&&h.innerHTML==null||m.textContent&&h.textContent==null)&&p(l,``),d?O(e.dynamicChildren,d,l,r,i,Fo(t,a),o):s||le(e,t,l,null,r,i,Fo(t,a),o,!1),u>0){if(u&16)ne(l,m,h,r,a);else if(u&2&&m.class!==h.class&&c(l,`class`,null,h.class,a),u&4&&c(l,`style`,m.style,h.style,a),u&8){let e=t.dynamicProps;for(let t=0;t<e.length;t++){let n=e[t],i=m[n],o=h[n];(o!==i||n===`value`)&&c(l,n,i,o,a,r)}}u&1&&e.children!==t.children&&p(l,t.children)}else!s&&d==null&&ne(l,m,h,r,a);((g=h.onVnodeUpdated)||f)&&G(()=>{g&&Z(g,r,t,e),f&&mr(t,e,r,`updated`)},i)},O=(e,t,n,r,i,a,o)=>{for(let s=0;s<t.length;s++){let c=e[s],l=t[s],u=c.el||Ho(c),d=u&&(c.type===K||!ps(c,l)||c.shapeFlag&198)?m(u):n;v(c,l,d,null,r,i,a,o,!0)}},ne=(e,t,r,i,a)=>{if(t!==r){if(t!==n)for(let n in t)!D(n)&&!(n in r)&&c(e,n,t[n],null,a,i);for(let n in r){if(D(n))continue;let o=r[n],s=t[n];o!==s&&n!==`value`&&c(e,n,s,o,a,i)}`value`in r&&c(e,`value`,t.value,r.value,a)}},re=(e,t,n,r,i,a,s,c,l)=>{let d=t.el=e?e.el:u(``),f=t.anchor=e?e.anchor:u(``),{patchFlag:p,dynamicChildren:m,slotScopeIds:h}=t;h&&(c=c?c.concat(h):h),e==null?(o(d,n,r),o(f,n,r),ee(t.children||[],n,f,i,a,s,c,l)):p>0&&p&64&&m&&e.dynamicChildren&&e.dynamicChildren.length===m.length?(O(e.dynamicChildren,m,n,i,a,s,c),(t.key!=null||i&&t===i.subTree)&&Ro(e,t,!0)):le(e,t,n,f,i,a,s,c,l)},ie=(e,t,n,r,i,a,o,s,c)=>{t.slotScopeIds=s,e==null?t.shapeFlag&512?i.ctx.activate(t,n,r,o,c):ae(t,n,r,i,a,o,c):k(e,t,c)},ae=(e,t,n,r,i,a,o)=>{let s=e.component=As(e,r,i);if(Fi(e)&&(s.ctx.renderer=xe),Rs(s,!1,o),s.asyncDep){if(i&&i.registerDep(s,se,o,a),!e.el){let r=s.subTree=Y(q);b(null,r,t,n),e.placeholder=r.el}}else se(s,e,t,n,i,a,o)},k=(e,t,n)=>{let r=t.component=e.component;if(lo(e,t,n)){if(r.asyncDep&&!r.asyncResolved){t.el=e.el,t.placeholder=e.placeholder,ce(r,t,n);return}r.next=t,r.update()}else t.el=e.el,t.placeholder=e.placeholder,r.vnode=t},se=(e,t,n,r,i,a,o)=>{let s=()=>{if(e.isMounted){let{next:t,bu:n,u:r,parent:s,vnode:c}=e;{let n=Bo(e);if(n){t&&(t.el=c.el,ce(e,t,o)),n.asyncDep.then(()=>{G(()=>{e.isUnmounted||l()},i)});return}}let u=t,d;Io(e,!1),t?(t.el=c.el,ce(e,t,o)):t=c,n&&oe(n),(d=t.props&&t.props.onVnodeBeforeUpdate)&&Z(d,s,t,c),Io(e,!0);let f=ao(e),p=e.subTree;e.subTree=f,v(p,f,m(p.el),ye(p),e,i,a),t.el=f.el,u===null&&po(e,f.el),r&&G(r,i),(d=t.props&&t.props.onVnodeUpdated)&&G(()=>Z(d,s,t,c),i)}else{let o,{el:s,props:c}=t,{bm:l,m:u,parent:d,root:f,type:p}=e,m=Mi(t);if(Io(e,!1),l&&oe(l),!m&&(o=c&&c.onVnodeBeforeMount)&&Z(o,d,t),Io(e,!0),s&&Ce){let t=()=>{e.subTree=ao(e),Ce(s,e.subTree,e,i,null)};m&&p.__asyncHydrate?p.__asyncHydrate(s,e,t):t()}else{f.ce&&f.ce._hasShadowRoot()&&f.ce._injectChildStyle(p,e.parent?e.parent.type:void 0);let o=e.subTree=ao(e);v(null,o,n,r,e,i,a),t.el=o.el}if(u&&G(u,i),!m&&(o=c&&c.onVnodeMounted)){let e=t;G(()=>Z(o,d,e),i)}(t.shapeFlag&256||d&&Mi(d.vnode)&&d.vnode.shapeFlag&256)&&e.a&&G(e.a,i),e.isMounted=!0,t=n=r=null}};e.scope.on();let c=e.effect=new Re(s);e.scope.off();let l=e.update=c.run.bind(c),u=e.job=c.runIfDirty.bind(c);u.i=e,u.id=e.uid,c.scheduler=()=>Yn(u),Io(e,!0),l()},ce=(e,t,n)=>{t.component=e;let r=e.vnode.props;e.vnode=t,e.next=null,vo(e,t.props,r,n),jo(e,t.children,n),tt(),Qn(e),nt()},le=(e,t,n,r,i,a,o,s,c=!1)=>{let l=e&&e.children,u=e?e.shapeFlag:0,d=t.children,{patchFlag:f,shapeFlag:m}=t;if(f>0){if(f&128){fe(l,d,n,r,i,a,o,s,c);return}if(f&256){ue(l,d,n,r,i,a,o,s,c);return}}m&8?(u&16&&ve(l,i,a),d!==l&&p(n,d)):u&16?m&16?fe(l,d,n,r,i,a,o,s,c):ve(l,i,a,!0):(u&8&&p(n,``),m&16&&ee(d,n,r,i,a,o,s,c))},ue=(e,t,n,i,a,o,s,c,l)=>{e||=r,t||=r;let u=e.length,d=t.length,f=Math.min(u,d),p=0;for(;p<f;p++){let r=t[p]=l?ws(t[p]):X(t[p]);v(e[p],r,n,null,a,o,s,c,l)}u>d?ve(e,a,o,!0,!1,f):ee(t,n,i,a,o,s,c,l,f)},fe=(e,t,n,i,a,o,s,c,l)=>{let u=0,d=t.length,f=e.length-1,p=d-1;for(;u<=f&&u<=p;){let r=e[u],i=t[u]=l?ws(t[u]):X(t[u]);if(ps(r,i))v(r,i,n,null,a,o,s,c,l);else break;u++}for(;u<=f&&u<=p;){let r=e[f],i=t[p]=l?ws(t[p]):X(t[p]);if(ps(r,i))v(r,i,n,null,a,o,s,c,l);else break;f--,p--}if(u>f){if(u<=p){let e=p+1,r=e<d?t[e].el:i;for(;u<=p;)v(null,t[u]=l?ws(t[u]):X(t[u]),n,r,a,o,s,c,l),u++}}else if(u>p)for(;u<=f;)me(e[u],a,o,!0),u++;else{let m=u,h=u,g=new Map;for(u=h;u<=p;u++){let e=t[u]=l?ws(t[u]):X(t[u]);e.key!=null&&g.set(e.key,u)}let _,y=0,b=p-h+1,x=!1,S=0,C=Array(b);for(u=0;u<b;u++)C[u]=0;for(u=m;u<=f;u++){let r=e[u];if(y>=b){me(r,a,o,!0);continue}let i;if(r.key!=null)i=g.get(r.key);else for(_=h;_<=p;_++)if(C[_-h]===0&&ps(r,t[_])){i=_;break}i===void 0?me(r,a,o,!0):(C[i-h]=u+1,i>=S?S=i:x=!0,v(r,t[i],n,null,a,o,s,c,l),y++)}let w=x?zo(C):r;for(_=w.length-1,u=b-1;u>=0;u--){let e=h+u,r=t[e],f=t[e+1],p=e+1<d?f.el||Ho(f):i;C[u]===0?v(null,r,n,p,a,o,s,c,l):x&&(_<0||u!==w[_]?pe(r,n,p,2):_--)}}},pe=(e,t,n,r,i=null)=>{let{el:a,type:c,transition:l,children:u,shapeFlag:d}=e;if(d&6)pe(e.component.subTree,t,n,r);else if(d&128)e.suspense.move(t,n,r);else if(d&64)c.move(e,t,n,xe);else if(c===K){o(a,t,n);for(let e=0;e<u.length;e++)pe(u[e],t,n,r);o(e.anchor,t,n)}else if(c===rs)S(e,t,n);else if(r!==2&&d&1&&l){if(r===0)l.persisted&&!a[H]?o(a,t,n):(l.beforeEnter(a),o(a,t,n),G(()=>l.enter(a),i));else{let{leave:r,delayLeave:i,afterLeave:c}=l,u=()=>{e.ctx.isUnmounted?s(a):o(a,t,n)},d=()=>{let e=a._isLeaving||!!a[H];a._isLeaving&&a[H](!0),l.persisted&&!e?u():r(a,()=>{u(),c&&c()})};i?i(a,u,d):d()}}else o(a,t,n)},me=(e,t,n,r=!1,i=!1)=>{let{type:a,props:o,ref:s,children:c,dynamicChildren:l,shapeFlag:u,patchFlag:d,dirs:f,cacheIndex:p,memo:m}=e;if((d===-2||l&&l.hasOnce)&&(i=!1),s!=null&&(tt(),oi(s,null,n,e,!0),nt()),p!=null&&(!e.ctx||e.ctx===t)&&(t.renderCache[p]=void 0),u&256){t.ctx.deactivate(e);return}let h=u&1&&f,g=!Mi(e),_;if(g&&(_=o&&o.onVnodeBeforeUnmount)&&Z(_,t,e),u&6)_e(e.component,n,r);else{if(u&128){e.suspense.unmount(n,r);return}h&&mr(e,null,t,`beforeUnmount`),u&64?e.type.remove(e,t,n,xe,r):l&&!l.hasOnce&&(a!==K||d>0&&d&64)?ve(l,t,n,!1,!0):(a===K&&d&384||!i&&u&16)&&ve(c,t,n),r&&he(e)}let v=m!=null&&p==null;(g&&(_=o&&o.onVnodeUnmounted)||h||v)&&G(()=>{_&&Z(_,t,e),h&&mr(e,null,t,`unmounted`),v&&(e.el=null)},n)},he=e=>{let{type:t,el:n,anchor:r,transition:i}=e,a=t===K;if(a&&!i){ge(n,r);return}if(t===rs){C(e),i&&!i.persisted&&i.afterLeave&&i.afterLeave();return}let o=a?$r(e):e,c=()=>{a?m(n)&&ge(n,r):s(n),i&&!i.persisted&&i.afterLeave&&i.afterLeave()};if(o&&o.shapeFlag&1&&i&&!i.persisted){let{leave:e,delayLeave:t}=i,n=o.el,r=()=>e(n,c);t?t(n,c,r):r()}else c()},ge=(e,t)=>{let n;for(;e!==t;)n=h(e),s(e),e=n;s(t)},_e=(e,t,n)=>{let{bum:r,scope:i,job:a,subTree:o,um:s,m:c,a:l}=e;Vo(c),Vo(l),r&&oe(r),i.stop(),a?(a.flags|=8,me(o,e,t,n)):e.vnode.el&&o&&(o.transition=e.vnode.transition,me(o,e,t,n)),s&&G(s,t),G(()=>{e.isUnmounted=!0},t)},ve=(e,t,n,r=!1,i=!1,a=0)=>{for(let o=a;o<e.length;o++)me(e[o],t,n,r,i)},ye=e=>{if(e.shapeFlag&6)return ye(e.component.subTree);if(e.shapeFlag&128)return e.suspense.next();let t=h(e.anchor||e.el),n=t&&t[Or];return n?h(n):t},be=(e,t,n)=>{tr(()=>{e==null?t._vnode&&me(t._vnode,null,null,!0):v(t._vnode||null,e,t,null,null,null,n),t._vnode=e},e&&t._vnode?void 0:e&&e.component?e.component.uid:ks())},xe={p:v,um:me,m:pe,r:he,mt:ae,mc:ee,pc:le,pbc:O,n:ye,o:e},Se,Ce;return t&&([Se,Ce]=t(xe)),{render:be,hydrate:Se,createApp:Za(be,Se)}}function Fo({type:e,props:t},n){return n===`svg`&&e===`foreignObject`||n===`mathml`&&e===`annotation-xml`&&t&&t.encoding&&t.encoding.includes(`html`)?void 0:n}function Io({effect:e,job:t},n){n?(e.flags|=32,t.flags|=4):(e.flags&=-33,t.flags&=-5)}function Lo(e,t){return(!e||e&&!e.pendingBranch)&&t&&!t.persisted}function Ro(e,t,n=!1){let r=e.children,i=t.children;if(f(r)&&f(i))for(let e=0;e<r.length;e++){let t=r[e],a=i[e];a.shapeFlag&1&&!a.dynamicChildren&&((a.patchFlag<=0||a.patchFlag===32)&&(a=i[e]=ws(i[e]),a.el=t.el),!n&&a.patchFlag!==-2&&Ro(t,a)),a.type===ns&&(a.patchFlag===-1&&(a=i[e]=ws(a)),a.el=t.el),a.type===q&&!a.el&&(a.el=t.el)}}function zo(e){let t=e.slice(),n=[0],r,i,a,o,s,c=e.length;for(r=0;r<c;r++){let c=e[r];if(c!==0){if(i=n[n.length-1],e[i]<c){t[r]=i,n.push(r);continue}for(a=0,o=n.length-1;a<o;)s=a+o>>1,e[n[s]]<c?a=s+1:o=s;c<e[n[a]]&&(a>0&&(t[r]=n[a-1]),n[a]=r)}}for(a=n.length,o=n[a-1];a-->0;)n[a]=o,o=t[o];return n}function Bo(e){let t=e.subTree.component;if(t)return t.asyncDep&&!t.asyncResolved?t:Bo(t)}function Vo(e){if(e)for(let t=0;t<e.length;t++)e[t].flags|=8}function Ho(e){if(e.placeholder)return e.placeholder;let t=e.component;return t?Ho(t.subTree):null}var Uo=e=>e.__isSuspense,Wo=0,Go={name:`Suspense`,__isSuspense:!0,process(e,t,n,r,i,a,o,s,c,l){if(e==null)qo(t,n,r,i,a,o,s,c,l);else{if(a&&a.deps>0&&!e.suspense.isInFallback&&!a.isHydrating){t.suspense=e.suspense,t.suspense.vnode=t,t.el=e.el;return}Jo(e,t,n,r,i,o,s,c,l)}},hydrate:Xo,normalize:Zo};function Ko(e,t){let n=e.props&&e.props[t];_(n)&&n()}function qo(e,t,n,r,i,a,o,s,c){let{p:l,o:{createElement:u}}=c,d=u(`div`),f=e.suspense=Yo(e,i,r,t,d,n,a,o,s,c);l(null,f.pendingBranch=e.ssContent,d,null,r,f,a,o),f.deps>0?(Ko(e,`onPending`),Ko(e,`onFallback`),l(null,e.ssFallback,t,n,r,null,a,o),es(f,e.ssFallback)):f.resolve(!1,!0)}function Jo(e,t,n,r,i,a,o,s,{p:c,um:l,o:{createElement:u}}){let d=t.suspense=e.suspense;d.vnode=t,t.el=e.el;let f=t.ssContent,p=t.ssFallback,{activeBranch:m,pendingBranch:h,isInFallback:g,isHydrating:_}=d;if(h)d.pendingBranch=f,ps(h,f)?(d.deps++,c(h,f,_?n:d.hiddenContainer,null,i,d,a,o,s),d.deps--,d.deps<=0?d.resolve():g&&!_&&!d.isFallbackMountPending&&(c(m,p,n,r,i,null,a,o,s),es(d,p))):(d.pendingId=Wo++,_?(d.isHydrating=!1,d.activeBranch=h):l(h,i,d),d.deps=0,d.effects.length=0,d.hiddenContainer=u(`div`),g?(c(null,f,d.hiddenContainer,null,i,d,a,o,s),d.deps<=0?d.resolve():d.isFallbackMountPending||(c(m,p,n,r,i,null,a,o,s),es(d,p))):m&&ps(m,f)?(c(m,f,n,r,i,d,a,o,s),d.resolve(!0)):(c(null,f,d.hiddenContainer,null,i,d,a,o,s),d.deps<=0&&d.resolve()));else if(m&&ps(m,f))c(m,f,n,r,i,d,a,o,s),es(d,f);else if(Ko(t,`onPending`),d.pendingBranch=f,d.pendingId=f.shapeFlag&512?f.component.suspenseId:Wo++,c(null,f,d.hiddenContainer,null,i,d,a,o,s),d.deps<=0)d.resolve();else{let{timeout:e,pendingId:t}=d;e>0?setTimeout(()=>{d.pendingId===t&&d.fallback(p)},e):e===0&&d.fallback(p)}}function Yo(e,t,n,r,i,a,o,s,c,l,u=!1){let{p:d,m:f,um:p,n:m,o:{parentNode:h,remove:g}}=l,_,v=ts(e);v&&t&&t.pendingBranch&&(_=t.pendingId,t.deps++);let y=e.props?le(e.props.timeout):void 0,b=a,x={vnode:e,parent:t,parentComponent:n,namespace:o,container:r,hiddenContainer:i,deps:0,pendingId:Wo++,timeout:typeof y==`number`?y:-1,activeBranch:null,isFallbackMountPending:!1,pendingBranch:null,isInFallback:!u,isHydrating:u,isUnmounted:!1,effects:[],resolve(e=!1,n=!1){let{vnode:r,activeBranch:i,pendingBranch:o,pendingId:s,effects:c,parentComponent:l,container:u,isInFallback:d}=x,g=!1;if(x.isHydrating)x.isHydrating=!1;else if(!e){g=i&&o.transition&&o.transition.mode===`out-in`;let e=!1;g&&(i.transition.afterLeave=()=>{s===x.pendingId&&(f(o,u,a===b&&!e?m(i):a,0),Zn(c),d&&r.ssFallback&&(r.ssFallback.el=null))}),i&&!x.isFallbackMountPending&&(h(i.el)===u&&(a=m(i),e=!0),p(i,l,x,!0),!g&&d&&r.ssFallback&&G(()=>r.ssFallback.el=null,x)),g||f(o,u,a,0)}x.isFallbackMountPending=!1,es(x,o),x.pendingBranch=null,x.isInFallback=!1;let y=x.parent,S=!1;for(;y;){if(y.pendingBranch){for(let e=0;e<c.length;e++)y.effects.push(c[e]);S=!0;break}y=y.parent}!S&&!g&&Zn(c),x.effects=[],v&&t&&t.pendingBranch&&_===t.pendingId&&(_=void 0,t.deps--,t.deps===0&&!n&&t.resolve()),Ko(r,`onResolve`)},fallback(e){if(!x.pendingBranch)return;let{vnode:t,activeBranch:n,parentComponent:r,container:i,namespace:a}=x;Ko(t,`onFallback`);let o=m(n),l=()=>{if(x.isFallbackMountPending=!1,!x.isInFallback)return;let e=x.vnode.ssFallback;d(null,e,i,o,r,null,a,s,c),es(x,e)},u=e.transition&&e.transition.mode===`out-in`;u&&(x.isFallbackMountPending=!0,n.transition.afterLeave=l),x.isInFallback=!0,p(n,r,null,!0),u||l()},move(e,t,n){x.activeBranch&&f(x.activeBranch,e,t,n),x.container=e},next(){return x.activeBranch&&m(x.activeBranch)},registerDep(e,t,n,r){let i=!!x.pendingBranch;i&&x.deps++;let a=e.vnode.el;e.asyncDep.catch(t=>{zn(t,e,0)}).then(o=>{if(e.isUnmounted||x.isUnmounted||x.pendingId!==e.suspenseId)return;if(Fs(),!e.scope.active){i&&--x.deps===0&&x.resolve();return}e.asyncResolved=!0;let{vnode:s}=e;Bs(e,o,!1),a&&(s.el=a);let c=!a&&e.subTree.el;t(e,s,h(a||e.subTree.el),a?null:m(e.subTree),x,r,n),c&&(s.placeholder=null,g(c)),po(e,s.el),i&&--x.deps===0&&x.resolve()})},unmount(e,t){x.isUnmounted=!0,x.activeBranch&&p(x.activeBranch,n,e,t),x.pendingBranch&&p(x.pendingBranch,n,e,t)}};return x}function Xo(e,t,n,r,i,a,o,s,c){let l=t.suspense=Yo(t,r,n,e.parentNode,document.createElement(`div`),null,i,a,o,s,!0),u=c(e,l.pendingBranch=t.ssContent,n,l,a,o);return l.deps===0&&l.resolve(!1,!0),u}function Zo(e){let{shapeFlag:t,children:n}=e,r=t&32;e.ssContent=Qo(r?n.default:n),e.ssFallback=r?Qo(n.fallback):Y(q)}function Qo(e){let t;if(_(e)){let n=ss&&e._c;n&&(e._d=!1,as()),e=e(),n&&(e._d=!0,t=J,os())}return f(e)&&(e=oo(e)),e=X(e),t&&!e.dynamicChildren&&(e.dynamicChildren=t.filter(t=>t!==e)),e}function $o(e,t){t&&t.pendingBranch?f(e)?t.effects.push(...e):t.effects.push(e):Zn(e)}function es(e,t){e.activeBranch=t;let{vnode:n,parentComponent:r}=e,i=t.el;for(;!i&&t.component;)t=t.component.subTree,i=t.el;n.el=i,r&&r.subTree===n&&(r.vnode.el=i,po(r,i))}function ts(e){let t=e.props&&e.props.suspensible;return t!=null&&t!==!1}var K=Symbol.for(`v-fgt`),ns=Symbol.for(`v-txt`),q=Symbol.for(`v-cmt`),rs=Symbol.for(`v-stc`),is=[],J=null;function as(e=!1){is.push(J=e?null:[])}function os(){is.pop(),J=is[is.length-1]||null}var ss=1;function cs(e,t=!1){ss+=e,e<0&&J&&t&&(J.hasOnce=!0)}function ls(e){return e.dynamicChildren=ss>0?J||r:null,os(),ss>0&&J&&J.push(e),e}function us(e,t,n,r,i,a){return ls(_s(e,t,n,r,i,a,!0))}function ds(e,t,n,r,i){return ls(Y(e,t,n,r,i,!0))}function fs(e){return e?e.__v_isVNode===!0:!1}function ps(e,t){return e.type===t.type&&e.key===t.key}function ms(e){}var hs=({key:e})=>e??null,gs=({ref:e,ref_key:t,ref_for:n})=>(typeof e==`number`&&(e=``+e),e==null?null:v(e)||L(e)||_(e)?{i:V,r:e,k:t,f:!!n}:e);function _s(e,t=null,n=null,r=0,i=null,a=e===K?0:1,o=!1,s=!1){let c={__v_isVNode:!0,__v_skip:!0,type:e,props:t,key:t&&hs(t),ref:t&&gs(t),scopeId:sr,slotScopeIds:null,children:n,component:null,suspense:null,ssContent:null,ssFallback:null,dirs:null,transition:null,el:null,anchor:null,target:null,targetStart:null,targetAnchor:null,staticCount:0,shapeFlag:a,patchFlag:r,dynamicProps:i,dynamicChildren:null,appContext:null,ctx:V};return s?(Ts(c,n),a&128&&e.normalize(c)):n&&(c.shapeFlag|=v(n)?8:16),ss>0&&!o&&J&&(c.patchFlag>0||a&6)&&c.patchFlag!==32&&J.push(c),c}var Y=vs;function vs(e,t=null,n=null,r=0,i=null,a=!1){if((!e||e===aa)&&(e=q),fs(e)){let r=bs(e,t,!0);return n&&Ts(r,n),ss>0&&!a&&J&&(r.shapeFlag&6?J[J.indexOf(e)]=r:J.push(r)),r.patchFlag=-2,r}if(Xs(e)&&(e=e.__vccOpts),t){t=ys(t);let{class:e,style:n}=t;e&&!v(e)&&(t.class=ve(e)),b(n)&&(nn(n)&&!f(n)&&(n=c({},n)),t.style=pe(n))}let o=v(e)?1:Uo(e)?128:kr(e)?64:b(e)?4:_(e)?2:0;return _s(e,t,n,r,i,o,a,!0)}function ys(e){return e?nn(e)||go(e)?c({},e):e:null}function bs(e,t,n=!1,r=!1){let{props:i,ref:a,patchFlag:o,children:s,transition:c}=e,l=t?Es(i||{},t):i,u={__v_isVNode:!0,__v_skip:!0,type:e.type,props:l,key:l&&hs(l),ref:t&&t.ref?n&&a?f(a)?a.concat(gs(t)):[a,gs(t)]:gs(t):a,scopeId:e.scopeId,slotScopeIds:e.slotScopeIds,children:s,target:e.target,targetStart:e.targetStart,targetAnchor:e.targetAnchor,staticCount:e.staticCount,shapeFlag:e.shapeFlag,patchFlag:t&&e.type!==K?o===-1?16:o|16:o,dynamicProps:e.dynamicProps,dynamicChildren:e.dynamicChildren,appContext:e.appContext,dirs:e.dirs,transition:c,component:e.component,suspense:e.suspense,ssContent:e.ssContent&&bs(e.ssContent),ssFallback:e.ssFallback&&bs(e.ssFallback),placeholder:e.placeholder,el:e.el,anchor:e.anchor,ctx:e.ctx,ce:e.ce,cacheIndex:e.cacheIndex};return c&&r&&Zr(u,c.clone(u)),u}function xs(e=` `,t=0){return Y(ns,null,e,t)}function Ss(e,t){let n=Y(rs,null,e);return n.staticCount=t,n}function Cs(e=``,t=!1){return t?(as(),ds(q,null,e)):Y(q,null,e)}function X(e){return e==null||typeof e==`boolean`?Y(q):f(e)?Y(K,null,e.slice()):fs(e)?ws(e):Y(ns,null,String(e))}function ws(e){return e.el===null&&e.patchFlag!==-1||e.memo?e:bs(e)}function Ts(e,t){let n=0,{shapeFlag:r}=e;if(t==null)t=null;else if(f(t))n=16;else if(typeof t==`object`){if(r&65){let n=t.default;n&&(n._c&&(n._d=!1),Ts(e,n()),n._c&&(n._d=!0));return}{n=32;let r=t._;!r&&!go(t)?t._ctx=V:r===3&&V&&(V.slots._===1?t._=1:(t._=2,e.patchFlag|=1024))}}else if(_(t)){if(r&65){Ts(e,{default:t});return}t={default:t,_ctx:V},n=32}else t=String(t),r&64?(n=16,t=[xs(t)]):n=8;e.children=t,e.shapeFlag|=n}function Es(...e){let t={};for(let n=0;n<e.length;n++){let r=e[n];for(let e in r)if(e===`class`)t.class!==r.class&&(t.class=ve([t.class,r.class]));else if(e===`style`)t.style=pe([t.style,r.style]);else if(o(e)){let n=t[e],i=r[e];i&&n!==i&&!(f(n)&&n.includes(i))?t[e]=n?[].concat(n,i):i:i==null&&n==null&&!s(e)&&(t[e]=i)}else e!==``&&(t[e]=r[e])}return t}function Z(e,t,n,r=null){z(e,t,7,[n,r])}var Ds=Ya(),Os=0;function ks(){return Os}function As(e,t,r){let i=e.type,a=(t?t.appContext:e.appContext)||Ds,o={uid:Os++,vnode:e,type:i,parent:t,appContext:a,root:null,next:null,subTree:null,effect:null,update:null,job:null,scope:new Ne(!0),render:null,proxy:null,exposed:null,exposeProxy:null,withProxy:null,provides:t?t.provides:Object.create(a.provides),ids:t?t.ids:[``,0,0],accessCache:null,renderCache:[],components:null,directives:null,propsOptions:So(i,a),emitsOptions:ro(i,a),emit:null,emitted:null,propsDefaults:n,inheritAttrs:i.inheritAttrs,ctx:n,data:n,props:n,attrs:n,slots:n,refs:n,setupState:n,setupContext:null,suspense:r,suspenseId:r?r.pendingId:0,asyncDep:null,asyncResolved:!1,isMounted:!1,isUnmounted:!1,isDeactivated:!1,bc:null,c:null,bm:null,m:null,bu:null,u:null,um:null,bum:null,da:null,a:null,rtg:null,rtc:null,ec:null,sp:null};return o.ctx={_:o},o.root=t?t.root:o,o.emit=to.bind(null,o),e.ce&&e.ce(o),o}var Q=null,js=()=>Q||V,Ms,Ns;{let e=de(),t=(t,n)=>{let r;return(r=e[t])||(r=e[t]=[]),r.push(n),e=>{r.length>1?r.forEach(t=>t(e)):r[0](e)}};Ms=t(`__VUE_INSTANCE_SETTERS__`,e=>Q=e),Ns=t(`__VUE_SSR_SETTERS__`,e=>Ls=e)}var Ps=e=>{let t=Q;return Ms(e),e.scope.on(),()=>{e.scope.off(),Ms(t)}},Fs=()=>{Q&&Q.scope.off(),Ms(null)};function Is(e){return e.vnode.shapeFlag&4}var Ls=!1;function Rs(e,t=!1,n=!1){t&&Ns(t);let{props:r,children:i}=e.vnode,a=Is(e);_o(e,r,a,t),Ao(e,i,n||t);let o=a?zs(e,t):void 0;return t&&Ns(!1),o}function zs(e,t){let n=e.type;e.accessCache=Object.create(null),e.proxy=new Proxy(e.ctx,va);let{setup:r}=n;if(r){tt();let n=e.setupContext=r.length>1?qs(e):null,i=Ps(e),a=Rn(r,e,0,[e.props,n]),o=x(a);if(nt(),i(),(o||e.sp)&&!Mi(e)&&ni(e),o){if(a.then(Fs,Fs),t)return a.then(n=>{Ns(!0);try{Bs(e,n,t)}finally{Ns(!1)}}).catch(t=>{zn(t,e,0)});e.asyncDep=a}else Bs(e,a,t)}else Gs(e,t)}function Bs(e,t,n){_(t)?e.type.__ssrInlineRender?e.ssrRender=t:e.render=t:b(t)&&(e.setupState=pn(t)),Gs(e,n)}var Vs,Hs;function Us(e){Vs=e,Hs=e=>{e.render._rc&&(e.withProxy=new Proxy(e.ctx,ya))}}var Ws=()=>!Vs;function Gs(e,t,n){let r=e.type;if(!e.render){if(!t&&Vs&&!r.render){let t=r.template||Ba(e).template;if(t){let{isCustomElement:n,compilerOptions:i}=e.appContext.config,{delimiters:a,compilerOptions:o}=r,s=c(c({isCustomElement:n,delimiters:a},i),o);r.render=Vs(t,s)}}e.render=r.render||i,Hs&&Hs(e)}{let t=Ps(e);tt();try{Ia(e)}finally{nt(),t()}}}var Ks={get(e,t){return M(e,`get`,``),e[t]}};function qs(e){return{attrs:new Proxy(e.attrs,Ks),slots:e.slots,emit:e.emit,expose:t=>{e.exposed=t||{}}}}function Js(e){return e.exposed?e.exposeProxy||=new Proxy(pn(rn(e.exposed)),{get(t,n){if(n in t)return t[n];if(n in ga)return ga[n](e)},has(e,t){return t in e||t in ga}}):e.proxy}function Ys(e,t=!0){return _(e)?e.displayName||e.name:e.name||t&&e.__name}function Xs(e){return _(e)&&`__vccOpts`in e}var Zs=(e,t)=>Sn(e,t,Ls);function Qs(e,t,n){try{cs(-1);let r=arguments.length;return r===2?b(t)&&!f(t)?fs(t)?Y(e,null,[t]):Y(e,t):Y(e,null,t):(r>3?n=Array.prototype.slice.call(arguments,2):r===3&&fs(n)&&(n=[n]),Y(e,t,n))}finally{cs(1)}}function $s(){}function ec(e,t,n,r){let i=n[r];if(i&&tc(i,e))return i;let a=t();return a.memo=e.slice(),a.cacheIndex=r,n[r]=a}function tc(e,t){let n=e.memo;if(n.length!=t.length)return!1;for(let e=0;e<n.length;e++)if(k(n[e],t[e]))return!1;return ss>0&&J&&J.push(e),!0}var nc=`3.5.44`,rc=i,ic=Ln,ac=ir,oc=or,sc={createComponentInstance:As,setupComponent:Rs,renderComponentRoot:ao,setCurrentRenderingInstance:cr,isVNode:fs,normalizeVNode:X,getComponentPublicInstance:Js,ensureValidVNode:pa,pushWarningContext:Nn,popWarningContext:Pn},cc=e({MutationType:()=>hc,acceptHMRUpdate:()=>Ac,createPinia:()=>Oc,defineStore:()=>Gc,disposePinia:()=>kc,getActivePinia:()=>fc,mapActions:()=>Zc,mapGetters:()=>Xc,mapState:()=>Yc,mapStores:()=>Jc,mapWritableState:()=>Qc,setActivePinia:()=>dc,setMapStoreSuffix:()=>qc,shouldHydrate:()=>Bc,skipHydrate:()=>zc,storeToRefs:()=>$c}),lc=typeof window<`u`,uc,dc=e=>uc=e,fc=()=>_r()&&gr(pc)||uc,pc=Symbol();function mc(e){return e&&typeof e==`object`&&Object.prototype.toString.call(e)===`[object Object]`&&typeof e.toJSON!=`function`}var hc;(function(e){e.direct=`direct`,e.patchObject=`patch object`,e.patchFunction=`patch function`})(hc||={});var gc=typeof window==`object`&&window.window===window?window:typeof self==`object`&&self.self===self?self:typeof global==`object`&&global.global===global?global:typeof globalThis==`object`?globalThis:{HTMLElement:null};function _c(e,{autoBom:t=!1}={}){return t&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)?new Blob([`﻿`,e],{type:e.type}):e}function vc(e,t,n){let r=new XMLHttpRequest;r.open(`GET`,e),r.responseType=`blob`,r.onload=function(){Cc(r.response,t,n)},r.onerror=function(){console.error(`could not download file`)},r.send()}function yc(e){let t=new XMLHttpRequest;t.open(`HEAD`,e,!1);try{t.send()}catch{}return t.status>=200&&t.status<=299}function bc(e){try{e.dispatchEvent(new MouseEvent(`click`))}catch{let t=new MouseEvent(`click`,{bubbles:!0,cancelable:!0,view:window,detail:0,screenX:80,screenY:20,clientX:80,clientY:20,ctrlKey:!1,altKey:!1,shiftKey:!1,metaKey:!1,button:0,relatedTarget:null});e.dispatchEvent(t)}}var xc=typeof navigator==`object`?navigator:{userAgent:``},Sc=/Macintosh/.test(xc.userAgent)&&/AppleWebKit/.test(xc.userAgent)&&!/Safari/.test(xc.userAgent),Cc=lc?typeof HTMLAnchorElement<`u`&&`download`in HTMLAnchorElement.prototype&&!Sc?wc:`msSaveOrOpenBlob`in xc?Tc:Ec:()=>{};function wc(e,t=`download`,n){let r=document.createElement(`a`);r.download=t,r.rel=`noopener`,typeof e==`string`?(r.href=e,r.origin===location.origin?bc(r):yc(r.href)?vc(e,t,n):(r.target=`_blank`,bc(r))):(r.href=URL.createObjectURL(e),setTimeout(function(){URL.revokeObjectURL(r.href)},4e4),setTimeout(function(){bc(r)},0))}function Tc(e,t=`download`,n){if(typeof e==`string`){if(yc(e))vc(e,t,n);else{let t=document.createElement(`a`);t.href=e,t.target=`_blank`,setTimeout(function(){bc(t)})}}else navigator.msSaveOrOpenBlob(_c(e,n),t)}function Ec(e,t,n,r){if(r||=open(``,`_blank`),r&&(r.document.title=r.document.body.innerText=`downloading...`),typeof e==`string`)return vc(e,t,n);let i=e.type===`application/octet-stream`,a=/constructor/i.test(String(gc.HTMLElement))||`safari`in gc,o=/CriOS\/[\d]+/.test(navigator.userAgent);if((o||i&&a||Sc)&&typeof FileReader<`u`){let t=new FileReader;t.onloadend=function(){let e=t.result;if(typeof e!=`string`)throw r=null,Error(`Wrong reader.result type`);e=o?e:e.replace(/^data:[^;]*;/,`data:attachment/file;`),r?r.location.href=e:location.assign(e),r=null},t.readAsDataURL(e)}else{let t=URL.createObjectURL(e);r?r.location.assign(t):location.href=t,r=null,setTimeout(function(){URL.revokeObjectURL(t)},4e4)}}var{assign:Dc}=Object;function Oc(){let e=Pe(!0),t=e.run(()=>R({})),n=[],r=[],i=rn({install(e){dc(i),i._a=e,e.provide(pc,i),e.config.globalProperties.$pinia=i,r.forEach(e=>n.push(e)),r=[]},use(e){return this._a?n.push(e):r.push(e),this},_p:n,_a:null,_e:e,_s:new Map,state:t});return i}function kc(e){e._e.stop(),e._s.clear(),e._p.splice(0),e.state.value={},e._a=null}function Ac(e,t){return()=>{}}var jc=()=>{};function Mc(e,t,n,r=jc){e.add(t);let i=()=>{e.delete(t)&&r()};return!n&&Fe()&&Ie(i),i}function Nc(e,...t){e.forEach(e=>{e(...t)})}var Pc=e=>e(),Fc=Symbol(),Ic=Symbol();function Lc(e,t){e instanceof Map&&t instanceof Map?t.forEach((t,n)=>e.set(n,t)):e instanceof Set&&t instanceof Set&&t.forEach(e.add,e);for(let n in t){if(!t.hasOwnProperty(n))continue;let r=t[n],i=e[n];e[n]=mc(i)&&mc(r)&&e.hasOwnProperty(n)&&!L(r)&&!N(r)?Lc(i,r):r}return e}var Rc=Symbol();function zc(e){return Object.defineProperty(e,Rc,{})}function Bc(e){return!mc(e)||!Object.prototype.hasOwnProperty.call(e,Rc)}var{assign:Vc}=Object;function Hc(e){return!!(L(e)&&e.effect)}function Uc(e,t,n,r){let{state:i,actions:a,getters:o}=t,s=n.state.value[e],c;function l(){return s||(n.state.value[e]=i?i():{}),Vc(gn(n.state.value[e]),a,Object.keys(o||{}).reduce((t,r)=>(t[r]=rn(Zs(()=>{dc(n);let t=n._s.get(e);return o[r].call(t,t)})),t),{}))}return c=Wc(e,l,t,n,r,!0),c}function Wc(e,t,n={},r,i,a){let o,s=Vc({actions:{}},n),c={deep:!0},l,u,d=new Set,f=new Set,p,m=r.state.value[e];!a&&!m&&(r.state.value[e]={});let h;function g(t){let n;l=u=!1,typeof t==`function`?(t(r.state.value[e]),n={type:hc.patchFunction,storeId:e,events:p}):(Lc(r.state.value[e],t),n={type:hc.patchObject,payload:t,storeId:e,events:p});let i=h=Symbol();qn().then(()=>{h===i&&(l=!0)}),u=!0,Nc(d,n,r.state.value[e])}let _=a?function(){let{state:e}=n,t=e?e():{};this.$patch(e=>{Vc(e,t)})}:jc;function v(){o.stop(),d.clear(),f.clear(),r._s.delete(e)}let y=(t,n=``)=>{if(Fc in t)return t[Ic]=n,t;let i=function(){dc(r);let n=Array.from(arguments),a=new Set,o=new Set;function s(e){a.add(e)}function c(e){o.add(e)}Nc(f,{args:n,name:i[Ic],store:b,after:s,onError:c});let l;try{l=t.apply(this&&this.$id===e?this:b,n)}catch(e){throw Nc(o,e),e}return l instanceof Promise?l.then(e=>(Nc(a,e),e)).catch(e=>(Nc(o,e),Promise.reject(e))):(Nc(a,l),l)};return i[Fc]=!0,i[Ic]=n,i},b=Xt({_p:r,$id:e,$onAction:Mc.bind(null,f),$patch:g,$reset:_,$subscribe(t,n={}){let i=Mc(d,t,n.detached,()=>a()),a=o.run(()=>Cr(()=>r.state.value[e],r=>{(n.flush===`sync`?u:l)&&t({storeId:e,type:hc.direct,events:p},r)},Vc({},c,n)));return i},$dispose:v});r._s.set(e,b);let x=(r._a&&r._a.runWithContext||Pc)(()=>r._e.run(()=>(o=Pe()).run(()=>t({action:y}))));for(let t in x){let n=x[t];L(n)&&!Hc(n)||N(n)?a||(m&&Bc(n)&&(L(n)?n.value=m[t]:Lc(n,m[t])),r.state.value[e][t]=n):typeof n==`function`&&(x[t]=y(n,t),s.actions[t]=n)}return Vc(b,x),Vc(F(b),x),Object.defineProperty(b,"$state",{get:()=>r.state.value[e],set:e=>{g(t=>{Vc(t,e)})}}),r._p.forEach(e=>{Vc(b,o.run(()=>e({store:b,app:r._a,pinia:r,options:s})))}),m&&a&&n.hydrate&&n.hydrate(b.$state,m),l=!0,u=!0,b}function Gc(e,t,n){let r,i=typeof t==`function`;r=i?n:t;function a(n,a){let o=_r();return n||=o?gr(pc,null):null,n&&dc(n),n=uc,n._s.has(e)||(i?Wc(e,t,r,n):Uc(e,r,n)),n._s.get(e)}return a.$id=e,a}var Kc=`Store`;function qc(e){Kc=e}function Jc(...e){return e.reduce((e,t)=>(e[t.$id+Kc]=function(){return t(this.$pinia)},e),{})}function Yc(e,t){return Array.isArray(t)?t.reduce((t,n)=>(t[n]=function(){return e(this.$pinia)[n]},t),{}):Object.keys(t).reduce((n,r)=>(n[r]=function(){let n=e(this.$pinia),i=t[r];return typeof i==`function`?i.call(this,n):n[i]},n),{})}var Xc=Yc;function Zc(e,t){return Array.isArray(t)?t.reduce((t,n)=>(t[n]=function(...t){return e(this.$pinia)[n](...t)},t),{}):Object.keys(t).reduce((n,r)=>(n[r]=function(...n){return e(this.$pinia)[t[r]](...n)},n),{})}function Qc(e,t){return Array.isArray(t)?t.reduce((t,n)=>(t[n]={get(){return e(this.$pinia)[n]},set(t){return e(this.$pinia)[n]=t}},t),{}):Object.keys(t).reduce((n,r)=>(n[r]={get(){return e(this.$pinia)[t[r]]},set(n){return e(this.$pinia)[t[r]]=n}},n),{})}function $c(e){let t=F(e),n={};for(let r in t){let i=t[r];i.effect?n[r]=Zs({get:()=>e[r],set(t){e[r]=t}}):(L(i)||N(i))&&(n[r]=yn(e,r))}return n}var el=class extends Error{constructor(e){super(e),this.name=`CheckFailed`}},tl=e=>typeof e==`string`?`« ${e} »`:JSON.stringify(e);function $(e,t=`La valeur`){return{toBe(n){if(e!==n)throw new el(`${t} : attendu ${tl(n)}, obtenu ${tl(e)}.`)},toEqual(n){if(JSON.stringify(e)!==JSON.stringify(n))throw new el(`${t} : attendu ${tl(n)}, obtenu ${tl(e)}.`)},toContain(n){if(typeof e!=`string`||!e.includes(n))throw new el(`${t} devrait contenir ${tl(n)} (obtenu ${tl(e)}).`)},notToContain(n){if(typeof e==`string`&&e.includes(n))throw new el(`${t} ne devrait pas contenir ${tl(n)}.`)},toBeTruthy(){if(!e)throw new el(`${t} devrait être vrai/présent.`)},toBeFalsy(){if(e)throw new el(`${t} devrait être faux/absent.`)},toBeGreaterThan(n){if(!(typeof e==`number`&&e>n))throw new el(`${t} : attendu plus de ${n}, obtenu ${tl(e)}.`)}}}var nl=`const salaries = [
  { id: 1, prenom: 'Léa', nom: 'Martin', service: 'Comptabilité' },
  { id: 2, prenom: 'Hugo', nom: 'Bernard', service: 'Informatique' },
  { id: 3, prenom: 'Chloé', nom: 'Petit', service: 'RH' },
  { id: 4, prenom: 'Nathan', nom: 'Durand', service: 'Informatique' },
  { id: 5, prenom: 'Inès', nom: 'Leroy', service: 'Comptabilité' },
]`,rl={id:1,title:`Réactivité`,icon:`pi pi-bolt`,color:`#42b883`,summary:`Le cœur de Vue : des variables qui mettent l'écran à jour toutes seules.`,lessons:[{id:`1-1`,title:`ref et le template`,minutes:10,goal:`Créer une valeur réactive et l’afficher, la modifier au clic.`,blocks:[{t:`p`,text:"Dans un composant, tout se passe dans `<script setup>`. On y déclare l'état avec **`ref()`** : une petite boîte qui contient une valeur. Quand la valeur change, Vue met à jour l'affichage tout seul."},{t:`code`,lang:`vue`,title:`Compteur.vue`,code:`<script setup>
const total = ref(0)          // pas d'import : auto-importé, comme au travail

function ajouter() {
  total.value++               // dans le script : .value
}
<\/script>

<template>
  <p>Total : {{ total }}</p>   <!-- dans le template : pas de .value -->
  <button @click="ajouter">+1</button>
  <button @click="total = 0">Remettre à zéro</button>
</template>`},{t:`list`,items:["`{{ total }}` affiche une valeur (interpolation).",'`@click="ajouter"` appelle une fonction ; on peut aussi écrire une petite instruction : `@click="total = 0"`.',"Dans le **script** on écrit `total.value`, dans le **template** juste `total` (Vue « déballe » la boîte)."]},{t:`sql`,text:"Une `ref` ressemble à une variable déclarée dans un bloc PL/SQL. La différence : chaque endroit de l'écran qui l'utilise est recalculé automatiquement quand elle change, comme si les `SELECT` affichés se relançaient seuls.",code:`DECLARE
  v_total NUMBER := 0;   -- const total = ref(0)
BEGIN
  v_total := v_total + 1; -- total.value++
END;`},{t:`warn`,text:"Une variable normale (`let total = 0`) change bien en mémoire, mais **l'écran ne bouge pas** : Vue ne la surveille pas. C'est l'erreur n°1 des débutants."}],exercise:{kind:`build`,task:"Le compteur d'heures supplémentaires ne réagit pas aux clics. Rends `heures` réactif, puis fais marcher les trois boutons : **+1**, **−1** (sans jamais descendre sous 0) et **Réinitialiser**.",open:`App.vue`,files:{"App.vue":`<script setup>
let heures = 0

function ajouter() {
  heures++
}

function retirer() {
  // à compléter : -1, mais jamais en dessous de 0
}

function reinitialiser() {
  // à compléter
}
<\/script>

<template>
  <div class="carte">
    <h2>Heures supplémentaires</h2>
    <p class="valeur"><span data-test="valeur">{{ heures }}</span> h</p>
    <div class="actions">
      <button data-test="moins" @click="retirer">−1</button>
      <button data-test="plus" @click="ajouter">+1</button>
      <button data-test="reset" @click="reinitialiser">Réinitialiser</button>
    </div>
  </div>
</template>

<style>
.carte { font-family: system-ui; padding: 16px; }
.valeur { font-size: 32px; font-weight: 800; margin: 8px 0 16px; }
.actions { display: flex; gap: 8px; }
.actions button { padding: 8px 14px; border-radius: 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; }
</style>`},solution:{"App.vue":`<script setup>
const heures = ref(0)

function ajouter() {
  heures.value++
}

function retirer() {
  if (heures.value > 0) heures.value--
}

function reinitialiser() {
  heures.value = 0
}
<\/script>

<template>
  <div class="carte">
    <h2>Heures supplémentaires</h2>
    <p class="valeur"><span data-test="valeur">{{ heures }}</span> h</p>
    <div class="actions">
      <button data-test="moins" @click="retirer">−1</button>
      <button data-test="plus" @click="ajouter">+1</button>
      <button data-test="reset" @click="reinitialiser">Réinitialiser</button>
    </div>
  </div>
</template>

<style>
.carte { font-family: system-ui; padding: 16px; }
.valeur { font-size: 32px; font-weight: 800; margin: 8px 0 16px; }
.actions { display: flex; gap: 8px; }
.actions button { padding: 8px 14px; border-radius: 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; }
</style>`},tests:[{name:`Affiche 0 au départ`,run:e=>$(e.text(`[data-test=valeur]`),`Le compteur`).toBe(`0`)},{name:`+1 deux fois affiche 2`,run:async e=>{await e.click(`[data-test=plus]`),await e.click(`[data-test=plus]`),$(e.text(`[data-test=valeur]`),`Après deux clics sur +1, le compteur`).toBe(`2`)}},{name:`−1 ne descend jamais sous 0`,run:async e=>{await e.click(`[data-test=plus]`),await e.click(`[data-test=moins]`),await e.click(`[data-test=moins]`),$(e.text(`[data-test=valeur]`),`Après +1, −1, −1, le compteur`).toBe(`0`)}},{name:`Réinitialiser remet à 0`,run:async e=>{for(let t=0;t<3;t++)await e.click(`[data-test=plus]`);await e.click(`[data-test=reset]`),$(e.text(`[data-test=valeur]`),`Après réinitialisation, le compteur`).toBe(`0`)}}],hints:["Remplace `let heures = 0` par `const heures = ref(0)`.","Dans les fonctions, il faut maintenant écrire `heures.value` (et pas `heures`).","`retirer` : `if (heures.value > 0) heures.value--`."]},cards:[{id:`1-1a`,q:"Comment lire la valeur d’une ref dans le `<script setup>` ?",choices:["`total`","`total.value`","`total()`","`$total`"],answer:1,explain:"Dans le script, une ref est un objet : la valeur est dans `.value`. Le template, lui, la déballe automatiquement."},{id:`1-1b`,q:"Que se passe-t-il à l’écran si on fait `compteur++` sur `let compteur = 0` ?",choices:[`L'écran se met à jour`,`Rien ne change à l'écran`,`Une erreur est levée`,`Vue recharge la page`],answer:1,explain:"La variable change en mémoire, mais Vue ne la surveille pas : il faut `ref()` pour qu'il réagisse."},{id:`1-1c`,q:"Dans le template, comment afficher la ref `total` ?",choices:["`{{ total.value }}`","`{{ total }}`","`{ total }`",'`v-text="total.value"`'],answer:1,explain:"Le template déballe les refs : `{{ total }}` suffit. `total.value` marcherait aussi mais n’est pas l’usage."}]},{id:`1-2`,title:`computed : les valeurs calculées`,minutes:12,goal:`Dériver une liste filtrée et un total d’un état, sans les stocker.`,blocks:[{t:`p`,text:"Un **`computed`** est une valeur calculée à partir d'autres valeurs réactives. Vue la met en **cache** et ne la recalcule que si ses sources changent."},{t:`code`,lang:`vue`,code:`<script setup>
const recherche = ref('')
const salaries = ref([...])

const resultats = computed(() =>
  salaries.value.filter(s => s.nom.toLowerCase().includes(recherche.value.toLowerCase()))
)
<\/script>

<template>
  <input v-model="recherche" placeholder="Rechercher">
  <p>{{ resultats.length }} résultat(s)</p>
  <ul>
    <li v-for="s in resultats" :key="s.id">{{ s.prenom }} {{ s.nom }}</li>
  </ul>
</template>`},{t:`list`,items:["`v-model` relie un champ à une ref dans les deux sens.","`v-for` répète un élément ; **`:key`** doit être un identifiant unique et stable (l'`id`, jamais l'index si la liste bouge).",`On ne modifie jamais un computed : on modifie ses sources.`]},{t:`sql`,text:`Un computed, c'est une **vue SQL** ou une colonne calculée : on décrit le calcul une fois, le résultat suit toujours les données.`,code:`CREATE VIEW resultats AS
  SELECT * FROM salaries
  WHERE LOWER(nom) LIKE '%' || LOWER(:recherche) || '%';`},{t:`tip`,text:"Au travail, les tableaux de colonnes et les champs de formulaire sont souvent dans un `computed` : ils se recalculent dès que les données changent."}],exercise:{kind:`build`,task:"La recherche ne filtre rien. Crée un `computed` **`resultats`** qui garde les salariés dont le **nom ou le prénom** contient la recherche (sans tenir compte des majuscules), affiche-les, et mets à jour le compteur « N résultat(s) ».",open:`App.vue`,files:{"App.vue":`<script setup>
${nl}

const recherche = ref('')

// à compléter : const resultats = computed(...)
<\/script>

<template>
  <div class="page">
    <input data-test="recherche" v-model="recherche" placeholder="Nom ou prénom">
    <p data-test="compte">{{ salaries.length }} résultat(s)</p>
    <ul>
      <li v-for="s in salaries" :key="s.id" data-test="ligne">{{ s.prenom }} {{ s.nom }} · {{ s.service }}</li>
    </ul>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 16px; }
input { padding: 8px 12px; border: 1px solid #ccc; border-radius: 8px; width: 100%; max-width: 320px; }
li { padding: 6px 0; border-bottom: 1px solid #eee; list-style: none; }
ul { padding: 0; }
</style>`},solution:{"App.vue":`<script setup>
${nl}

const recherche = ref('')

const resultats = computed(() => {
  const q = recherche.value.trim().toLowerCase()
  return salaries.filter(s => (s.nom + ' ' + s.prenom).toLowerCase().includes(q))
})
<\/script>

<template>
  <div class="page">
    <input data-test="recherche" v-model="recherche" placeholder="Nom ou prénom">
    <p data-test="compte">{{ resultats.length }} résultat(s)</p>
    <ul>
      <li v-for="s in resultats" :key="s.id" data-test="ligne">{{ s.prenom }} {{ s.nom }} · {{ s.service }}</li>
    </ul>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 16px; }
input { padding: 8px 12px; border: 1px solid #ccc; border-radius: 8px; width: 100%; max-width: 320px; }
li { padding: 6px 0; border-bottom: 1px solid #eee; list-style: none; }
ul { padding: 0; }
</style>`},tests:[{name:`Sans recherche : 5 salariés`,run:e=>{$(e.findAll(`[data-test=ligne]`).length,`Nombre de lignes`).toBe(5),$(e.text(`[data-test=compte]`)).toBe(`5 résultat(s)`)}},{name:`Filtre sur le nom`,run:async e=>{await e.input(`[data-test=recherche]`,`mar`),$(e.findAll(`[data-test=ligne]`).length,`Lignes pour « mar »`).toBe(1),$(e.text(`[data-test=ligne]`)).toContain(`Martin`)}},{name:`Filtre sur le prénom, sans tenir compte des majuscules`,run:async e=>{await e.input(`[data-test=recherche]`,`HUGO`),$(e.findAll(`[data-test=ligne]`).length,`Lignes pour « HUGO »`).toBe(1)}},{name:`Le compteur suit le filtre`,run:async e=>{await e.input(`[data-test=recherche]`,`e`);let t=e.findAll(`[data-test=ligne]`).length;$(e.text(`[data-test=compte]`)).toBe(t+` résultat(s)`),$(t,`Lignes pour « e »`).toBe(3),await e.input(`[data-test=recherche]`,`zz`),$(e.text(`[data-test=compte]`)).toBe(`0 résultat(s)`)}}],hints:["`const resultats = computed(() => salaries.filter(...))`","Compare en minuscules : `(s.nom + ' ' + s.prenom).toLowerCase().includes(recherche.value.toLowerCase())`.","Dans le template, remplace `salaries` par `resultats` (dans le `v-for` et dans le compteur)."]},cards:[{id:`1-2a`,q:"Quand un `computed` est-il recalculé ?",choices:[`À chaque affichage`,`Toutes les secondes`,`Quand une de ses sources réactives change`,`Jamais`],answer:2,explain:`Il est mis en cache et recalculé seulement quand une valeur réactive qu’il lit change.`},{id:`1-2b`,q:"Quelle `:key` choisir dans un `v-for` sur des salariés ?",choices:[`L'index de la boucle`,"`s.id`","`Math.random()`",`Aucune`],answer:1,explain:"Un identifiant unique et stable. L’index pose problème quand la liste est triée/filtrée ; `Math.random()` recrée tout à chaque rendu."},{id:`1-2c`,q:"Peut-on écrire `resultats.value = []` sur un computed ?",choices:[`Oui, toujours`,`Non : on modifie ses sources`,`Oui si on l’a déclaré avec ref`,`Seulement dans onMounted`],answer:1,explain:`Un computed est en lecture seule (sauf getter/setter explicite) : on change les données dont il dépend.`}]},{id:`1-3`,title:`watch : réagir à un changement`,minutes:12,goal:`Déclencher une action quand une valeur change (remettre la pagination à 1).`,blocks:[{t:`p`,text:"`computed` **calcule** une valeur ; **`watch`** **exécute une action** quand une valeur change : recharger des données, réinitialiser un champ, sauvegarder…"},{t:`code`,lang:`js`,code:`const service = ref('Tous')
const page = ref(1)

watch(service, (nouveau, ancien) => {
  page.value = 1                      // nouveau filtre → on revient page 1
})

// Plusieurs sources, ou une propriété d'objet :
watch([service, () => filtres.actif], () => recharger())

// Exécuter aussi tout de suite au montage :
watch(() => route.params.ID, charger, { immediate: true })`},{t:`list`,items:["Source = une ref, un tableau de sources, ou une fonction `() => objet.propriete`.","Le callback reçoit `(nouvelle, ancienne)` valeur.","`{ immediate: true }` lance le callback dès le départ ; `{ deep: true }` surveille l'intérieur d'un objet."]},{t:`sql`,text:"`watch` ressemble à un **trigger** : « APRÈS mise à jour de service, remettre page à 1 ». On ne s'en sert pas pour calculer une valeur (ça, c'est `computed`, comme une vue)."},{t:`warn`,text:"Ne surveille pas une propriété en écrivant `watch(filtres.actif, …)` : tu passes la *valeur* (true/false), pas la source. Écris `watch(() => filtres.actif, …)`."}],exercise:{kind:`build`,task:"Quand on change de **service**, la liste repart page 1… sauf qu'ici elle reste sur la page en cours (et peut afficher une page vide). Ajoute un `watch` sur `service` qui remet `page` à **1**.",open:`App.vue`,files:{"App.vue":`<script setup>
const TOUS = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  nom: 'Salarié ' + (i + 1),
  service: ['RH', 'Informatique', 'Comptabilité'][i % 3],
}))
const PAR_PAGE = 5

const service = ref('Tous')
const page = ref(1)

const filtres = computed(() => service.value === 'Tous' ? TOUS : TOUS.filter(s => s.service === service.value))
const nbPages = computed(() => Math.max(1, Math.ceil(filtres.value.length / PAR_PAGE)))
const visibles = computed(() => filtres.value.slice((page.value - 1) * PAR_PAGE, page.value * PAR_PAGE))

// à compléter : quand service change, revenir à la page 1
<\/script>

<template>
  <div class="page">
    <select data-test="service" v-model="service">
      <option>Tous</option><option>RH</option><option>Informatique</option><option>Comptabilité</option>
    </select>
    <ul><li v-for="s in visibles" :key="s.id" data-test="ligne">{{ s.nom }} · {{ s.service }}</li></ul>
    <div class="pager">
      <button data-test="prec" :disabled="page === 1" @click="page--">‹</button>
      <span data-test="page">{{ page }} / {{ nbPages }}</span>
      <button data-test="suiv" :disabled="page === nbPages" @click="page++">›</button>
    </div>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 16px; }
ul { padding: 0; } li { list-style: none; padding: 6px 0; border-bottom: 1px solid #eee; }
.pager { display: flex; gap: 12px; align-items: center; }
</style>`},solution:{"App.vue":`<script setup>
const TOUS = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  nom: 'Salarié ' + (i + 1),
  service: ['RH', 'Informatique', 'Comptabilité'][i % 3],
}))
const PAR_PAGE = 5

const service = ref('Tous')
const page = ref(1)

const filtres = computed(() => service.value === 'Tous' ? TOUS : TOUS.filter(s => s.service === service.value))
const nbPages = computed(() => Math.max(1, Math.ceil(filtres.value.length / PAR_PAGE)))
const visibles = computed(() => filtres.value.slice((page.value - 1) * PAR_PAGE, page.value * PAR_PAGE))

watch(service, () => {
  page.value = 1
})
<\/script>

<template>
  <div class="page">
    <select data-test="service" v-model="service">
      <option>Tous</option><option>RH</option><option>Informatique</option><option>Comptabilité</option>
    </select>
    <ul><li v-for="s in visibles" :key="s.id" data-test="ligne">{{ s.nom }} · {{ s.service }}</li></ul>
    <div class="pager">
      <button data-test="prec" :disabled="page === 1" @click="page--">‹</button>
      <span data-test="page">{{ page }} / {{ nbPages }}</span>
      <button data-test="suiv" :disabled="page === nbPages" @click="page++">›</button>
    </div>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 16px; }
ul { padding: 0; } li { list-style: none; padding: 6px 0; border-bottom: 1px solid #eee; }
.pager { display: flex; gap: 12px; align-items: center; }
</style>`},tests:[{name:`La pagination fonctionne (5 par page, 5 pages)`,run:async e=>{$(e.text(`[data-test=page]`)).toBe(`1 / 5`),await e.click(`[data-test=suiv]`),$(e.text(`[data-test=page]`)).toBe(`2 / 5`)}},{name:`Changer de service revient à la page 1`,run:async e=>{for(let t=0;t<4;t++)await e.click(`[data-test=suiv]`);$(e.text(`[data-test=page]`)).toBe(`5 / 5`),await e.select(`[data-test=service]`,`RH`),$(e.text(`[data-test=page]`),`Page affichée après changement de service`).toBe(`1 / 2`),$(e.findAll(`[data-test=ligne]`).length,`Lignes visibles`).toBe(5)}},{name:`Plusieurs changements de suite`,run:async e=>{await e.click(`[data-test=suiv]`),await e.select(`[data-test=service]`,`Informatique`),await e.click(`[data-test=suiv]`),await e.select(`[data-test=service]`,`Tous`),$(e.text(`[data-test=page]`)).toBe(`1 / 5`)}}],hints:["La forme : `watch(source, () => { ... })`.","`watch(service, () => { page.value = 1 })`"]},cards:[{id:`1-3a`,q:`Pour « remettre la page à 1 quand le filtre change », on utilise…`,choices:[`un computed`,`un watch`,`un v-if`,`onMounted`],answer:1,explain:"C'est une action déclenchée par un changement → `watch`. `computed` sert à calculer une valeur."},{id:`1-3b`,q:"Comment surveiller la propriété `actif` de l’objet réactif `filtres` ?",choices:["`watch(filtres.actif, cb)`","`watch(() => filtres.actif, cb)`",'`watch("filtres.actif", cb)`',"`watch(actif, cb)`"],answer:1,explain:"Il faut une source réactive : une fonction qui lit la propriété. `filtres.actif` seul passe juste la valeur du moment."},{id:`1-3c`,q:"À quoi sert `{ immediate: true }` ?",choices:[`À exécuter le callback tout de suite, puis à chaque changement`,`À surveiller en profondeur`,`À exécuter une seule fois`,`À accélérer le rendu`],answer:0,explain:"Sans `immediate`, le callback attend le premier changement. Pratique pour charger des données au montage ET quand un paramètre change."}]},{id:`1-4`,title:`Piège : la réactivité perdue`,minutes:10,goal:`Reconnaître et corriger une déstructuration qui casse la réactivité.`,blocks:[{t:`p`,text:"**`reactive()`** rend tout un objet réactif (pratique pour un formulaire). Mais si tu **déstructures** cet objet, tu récupères de simples copies des valeurs : elles ne suivent plus."},{t:`code`,lang:`js`,code:`const form = reactive({ nom: '', jours: 1 })

const { nom } = form          // ❌ nom = '' pour toujours
const { jours } = toRefs(form) // ✅ jours est une ref liée à form.jours

// Le plus simple : utiliser form.nom directement dans le template.`},{t:`list`,items:["`ref` : pour une valeur seule (nombre, texte, tableau) → `.value` dans le script.","`reactive` : pour un objet → pas de `.value`, mais ne jamais le déstructurer ni le remplacer entièrement (`form = {...}` casse le lien).","En cas de doute, `ref` partout fonctionne toujours."]},{t:`sql`,text:"Déstructurer, c'est comme faire `SELECT nom INTO v_nom FROM form` : tu obtiens la valeur **à cet instant**, pas un lien vers la ligne."}],exercise:{kind:`bug`,task:`**Trouve le bug.** Dans ce formulaire d'absence, le récapitulatif ne se met jamais à jour quand on tape. Corrige-le sans changer le template du formulaire.`,open:`App.vue`,files:{"App.vue":`<script setup>
const form = reactive({
  type: 'Congés payés',
  jours: 1,
  commentaire: '',
})

const { type, jours, commentaire } = form

const resume = computed(() => type + ' · ' + jours + ' jour(s)' + (commentaire ? ' · ' + commentaire : ''))
<\/script>

<template>
  <div class="page">
    <select data-test="type" v-model="form.type">
      <option>Congés payés</option><option>RTT</option><option>Maladie</option>
    </select>
    <input data-test="jours" type="number" min="1" v-model.number="form.jours">
    <input data-test="commentaire" v-model="form.commentaire" placeholder="Commentaire">
    <p class="resume" data-test="resume">{{ resume }}</p>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 16px; display: grid; gap: 8px; max-width: 360px; }
.resume { font-weight: 700; }
</style>`},solution:{"App.vue":`<script setup>
const form = reactive({
  type: 'Congés payés',
  jours: 1,
  commentaire: '',
})

const resume = computed(() => form.type + ' · ' + form.jours + ' jour(s)' + (form.commentaire ? ' · ' + form.commentaire : ''))
<\/script>

<template>
  <div class="page">
    <select data-test="type" v-model="form.type">
      <option>Congés payés</option><option>RTT</option><option>Maladie</option>
    </select>
    <input data-test="jours" type="number" min="1" v-model.number="form.jours">
    <input data-test="commentaire" v-model="form.commentaire" placeholder="Commentaire">
    <p class="resume" data-test="resume">{{ resume }}</p>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 16px; display: grid; gap: 8px; max-width: 360px; }
.resume { font-weight: 700; }
</style>`},tests:[{name:`Récapitulatif initial`,run:e=>$(e.text(`[data-test=resume]`)).toBe(`Congés payés · 1 jour(s)`)},{name:`Suit le type et le nombre de jours`,run:async e=>{await e.select(`[data-test=type]`,`RTT`),await e.input(`[data-test=jours]`,`3`),$(e.text(`[data-test=resume]`),`Récapitulatif`).toBe(`RTT · 3 jour(s)`)}},{name:`Ajoute le commentaire quand il existe`,run:async e=>{await e.input(`[data-test=commentaire]`,`Mariage`),$(e.text(`[data-test=resume]`)).toBe(`Congés payés · 1 jour(s) · Mariage`)}}],hints:["La ligne `const { type, jours, commentaire } = form` copie les valeurs une fois pour toutes.","Supprime cette ligne et utilise `form.type`, `form.jours`, `form.commentaire` dans le computed (ou `toRefs(form)` + `.value`)."]},cards:[{id:`1-4a`,q:'Que donne `const { nom } = reactive({ nom: "" })` ?',choices:[`Une ref liée`,`Une copie figée de la valeur`,`Une erreur`,`Un computed`],answer:1,explain:"La déstructuration copie la valeur du moment : plus de lien réactif. Utiliser `obj.nom` ou `toRefs(obj)`."},{id:`1-4b`,q:`Quel outil garde le lien en déstructurant un reactive ?`,choices:["`toRefs()`","`unref()`","`JSON.parse`","`Object.assign`"],answer:0,explain:"`toRefs(form)` renvoie une ref par propriété, liée à l’objet d’origine."},{id:`1-4c`,q:"Remplacer tout l’objet : `form = { ... }` sur un `const form = reactive(...)`…",choices:[`Fonctionne`,`Casse le lien (et const l’interdit)`,`Recharge la page`,`Vide le formulaire proprement`],answer:1,explain:"On modifie les propriétés (`form.nom = …`) ou on utilise `Object.assign(form, nouvelles)`. Avec une `ref`, `form.value = {...}` fonctionne."}]}]},il=`<style>
.carte { border: 1px solid #e3e3e3; border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; font-family: system-ui; }
.carte h3 { margin: 0; font-size: 16px; }
.carte p { margin: 4px 0 0; color: #666; font-size: 14px; }
</style>`,al={id:2,title:`Composants`,icon:`pi pi-th-large`,color:`#3b82f6`,summary:`Découper l’écran en briques réutilisables qui communiquent.`,lessons:[{id:`2-1`,title:`Props : passer des données`,minutes:12,goal:`Créer un composant réutilisable qui reçoit ses données par props.`,blocks:[{t:`p`,text:"Un composant reçoit des données de son parent via des **props**, déclarées avec `defineProps`. Les props sont en **lecture seule** pour l’enfant."},{t:`code`,lang:`vue`,title:`components/CarteSalarie.vue`,code:`<script setup>
const props = defineProps({
  salarie: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})
<\/script>

<template>
  <div class="carte">
    <h3>{{ salarie.prenom }} {{ salarie.nom }}</h3>
    <p v-if="!compact">{{ salarie.service }}</p>
  </div>
</template>`},{t:`code`,lang:`vue`,title:`Parent`,code:`<CarteSalarie v-for="s in salaries" :key="s.id" :salarie="s" compact />`},{t:`list`,items:['`:salarie="s"` (avec `:`, raccourci de `v-bind`) passe une **expression** JavaScript ; `titre="Bonjour"` (sans `:`) passe un **texte**.',"Un booléen écrit seul (`compact`) vaut `true`.","Dans le template, les props sont accessibles directement ; dans le script, via `props.salarie`."]},{t:`sql`,text:`Les props sont les **paramètres IN** d’une procédure : l’appelant les fournit, la procédure les lit mais ne les modifie pas.`,code:`PROCEDURE afficher_carte(p_salarie IN t_salarie, p_compact IN BOOLEAN DEFAULT FALSE);`}],exercise:{kind:`build`,task:"`CarteSalarie.vue` affiche toujours « Prénom Nom ». Déclare les props **`salarie`** (objet, requis) et **`compact`** (booléen, `false` par défaut), affiche le vrai salarié, et masque le service quand `compact` est vrai. Dans `App.vue`, passe chaque salarié à la carte.",open:`components/CarteSalarie.vue`,files:{"components/CarteSalarie.vue":`<script setup>
// à compléter : defineProps(...)
<\/script>

<template>
  <div class="carte" data-test="carte">
    <h3 data-test="nom">Prénom Nom</h3>
    <p data-test="service">Service</p>
  </div>
</template>

${il}`,"App.vue":`<script setup>
import CarteSalarie from './components/CarteSalarie.vue'

const salaries = [
  { id: 1, prenom: 'Léa', nom: 'Martin', service: 'Comptabilité' },
  { id: 2, prenom: 'Hugo', nom: 'Bernard', service: 'Informatique' },
  { id: 3, prenom: 'Chloé', nom: 'Petit', service: 'RH' },
]
const compact = ref(false)
<\/script>

<template>
  <label><input type="checkbox" data-test="compact" v-model="compact"> Vue compacte</label>
  <CarteSalarie v-for="s in salaries" :key="s.id" />
</template>`},solution:{"components/CarteSalarie.vue":`<script setup>
defineProps({
  salarie: { type: Object, required: true },
  compact: { type: Boolean, default: false },
})
<\/script>

<template>
  <div class="carte" data-test="carte">
    <h3 data-test="nom">{{ salarie.prenom }} {{ salarie.nom }}</h3>
    <p v-if="!compact" data-test="service">{{ salarie.service }}</p>
  </div>
</template>

${il}`,"App.vue":`<script setup>
import CarteSalarie from './components/CarteSalarie.vue'

const salaries = [
  { id: 1, prenom: 'Léa', nom: 'Martin', service: 'Comptabilité' },
  { id: 2, prenom: 'Hugo', nom: 'Bernard', service: 'Informatique' },
  { id: 3, prenom: 'Chloé', nom: 'Petit', service: 'RH' },
]
const compact = ref(false)
<\/script>

<template>
  <label><input type="checkbox" data-test="compact" v-model="compact"> Vue compacte</label>
  <CarteSalarie v-for="s in salaries" :key="s.id" :salarie="s" :compact="compact" />
</template>`},tests:[{name:`Une carte par salarié, avec son nom`,run:e=>{$(e.findAll(`[data-test=nom]`).map(e=>e.textContent?.trim()),`Noms affichés`).toEqual([`Léa Martin`,`Hugo Bernard`,`Chloé Petit`])}},{name:`Le service est affiché par défaut`,run:e=>$(e.findAll(`[data-test=service]`).map(e=>e.textContent?.trim()),`Services`).toEqual([`Comptabilité`,`Informatique`,`RH`])},{name:`Vue compacte : services masqués`,run:async e=>{await e.check(`[data-test=compact]`),$(e.findAll(`[data-test=service]`).length,`Services visibles en vue compacte`).toBe(0)}},{name:`Pas d’avertissement de props manquantes`,run:e=>$(e.warnings.filter(e=>e.includes(`Missing required prop`)).length,`Avertissements « prop requise manquante »`).toBe(0)}],hints:["Dans l'enfant : `defineProps({ salarie: { type: Object, required: true }, compact: { type: Boolean, default: false } })`.",'Template de la carte : `{{ salarie.prenom }} {{ salarie.nom }}` et `v-if="!compact"` sur le service.','Dans App.vue : `<CarteSalarie ... :salarie="s" :compact="compact" />`.']},cards:[{id:`2-1a`,q:'Différence entre `titre="total"` et `:titre="total"` ?',choices:[`Aucune`,`Le premier passe le texte « total », le second la valeur de la variable total`,`Le premier est réactif, pas le second`,`Le second est interdit`],answer:1,explain:"Le `:` (v-bind) évalue une expression JavaScript. Sans `:`, c’est une chaîne littérale."},{id:`2-1b`,q:"Un enfant peut-il modifier une prop (`props.salarie = …`) ?",choices:[`Oui`,`Non : les props sont en lecture seule (il faut émettre un événement)`,`Seulement les objets`,`Seulement dans onMounted`],answer:1,explain:"Flux de données à sens unique : le parent possède la donnée. L’enfant demande un changement via `emit`."},{id:`2-1c`,q:"`<Carte compact />` passe quelle valeur à une prop Boolean ?",choices:['`""`',"`true`",'`"compact"`',"`undefined`"],answer:1,explain:"Pour une prop de type Boolean, l’attribut présent sans valeur vaut `true`."}]},{id:`2-2`,title:`Emits et v-model sur un composant`,minutes:14,goal:`Faire remonter une action au parent et créer un champ compatible v-model.`,blocks:[{t:`p`,text:"L'enfant ne modifie pas les props : il **émet un événement**, le parent décide. Pour un champ réutilisable, la convention `v-model` = prop **`modelValue`** + événement **`update:modelValue`**."},{t:`code`,lang:`vue`,title:`components/ChampJours.vue`,code:`<script setup>
const props = defineProps({ modelValue: { type: Number, default: 0 } })
const emit = defineEmits(['update:modelValue', 'valider'])

function plus() { emit('update:modelValue', props.modelValue + 1) }
<\/script>

<template>
  <button @click="plus">+</button> {{ modelValue }}
  <button @click="emit('valider')">Valider</button>
</template>`},{t:`code`,lang:`vue`,title:`Parent`,code:`<ChampJours v-model="jours" @valider="enregistrer" />
<!-- équivaut à : :modelValue="jours" @update:modelValue="v => jours = v" -->`},{t:`tip`,text:"Depuis Vue 3.4, `const modele = defineModel()` fait les deux d'un coup : `modele.value++` émet automatiquement l'événement. Au travail tu verras surtout la forme `modelValue` + `emit`, mais les deux sont valables."},{t:`sql`,text:`C'est le principe d'un paramètre **IN OUT** : la valeur entre, l'enfant propose la nouvelle valeur, et c'est l'appelant qui la récupère.`}],exercise:{kind:`build`,task:"Termine `ChampJours.vue` pour qu'il marche avec `v-model` : les boutons **−** et **+** émettent `update:modelValue` (minimum 0, maximum `max`), et **Valider** émet `valider`. Le parent est déjà prêt.",open:`components/ChampJours.vue`,readonly:[`App.vue`],files:{"components/ChampJours.vue":`<script setup>
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  max: { type: Number, default: 25 },
})
// à compléter : defineEmits + fonctions moins / plus
<\/script>

<template>
  <div class="champ">
    <button data-test="moins">−</button>
    <strong data-test="valeur">{{ modelValue }}</strong>
    <button data-test="plus">+</button>
    <button data-test="valider" class="ok">Valider</button>
  </div>
</template>

<style>
.champ { display: flex; gap: 10px; align-items: center; font-family: system-ui; }
.champ button { padding: 6px 12px; border-radius: 8px; border: 1px solid #ccc; background: #fff; }
.champ .ok { background: #42b883; color: #fff; border-color: transparent; }
</style>`,"App.vue":`<script setup>
import ChampJours from './components/ChampJours.vue'

const jours = ref(2)
const message = ref('')

function enregistrer() {
  message.value = 'Demande de ' + jours.value + ' jour(s) enregistrée'
}
<\/script>

<template>
  <p>Jours demandés : <span data-test="parent">{{ jours }}</span></p>
  <ChampJours v-model="jours" :max="5" @valider="enregistrer" />
  <p data-test="message">{{ message }}</p>
</template>`},solution:{"components/ChampJours.vue":`<script setup>
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  max: { type: Number, default: 25 },
})
const emit = defineEmits(['update:modelValue', 'valider'])

function moins() {
  if (props.modelValue > 0) emit('update:modelValue', props.modelValue - 1)
}
function plus() {
  if (props.modelValue < props.max) emit('update:modelValue', props.modelValue + 1)
}
<\/script>

<template>
  <div class="champ">
    <button data-test="moins" @click="moins">−</button>
    <strong data-test="valeur">{{ modelValue }}</strong>
    <button data-test="plus" @click="plus">+</button>
    <button data-test="valider" class="ok" @click="emit('valider')">Valider</button>
  </div>
</template>

<style>
.champ { display: flex; gap: 10px; align-items: center; font-family: system-ui; }
.champ button { padding: 6px 12px; border-radius: 8px; border: 1px solid #ccc; background: #fff; }
.champ .ok { background: #42b883; color: #fff; border-color: transparent; }
</style>`},tests:[{name:`+ met à jour le parent (v-model)`,run:async e=>{await e.click(`[data-test=plus]`),$(e.text(`[data-test=parent]`),`Valeur dans le parent`).toBe(`3`),$(e.text(`[data-test=valeur]`),`Valeur affichée par le champ`).toBe(`3`)}},{name:`− met à jour le parent, jamais sous 0`,run:async e=>{for(let t=0;t<4;t++)await e.click(`[data-test=moins]`);$(e.text(`[data-test=parent]`)).toBe(`0`)}},{name:`Respecte le maximum (5)`,run:async e=>{for(let t=0;t<6;t++)await e.click(`[data-test=plus]`);$(e.text(`[data-test=parent]`)).toBe(`5`)}},{name:`Valider prévient le parent`,run:async e=>{await e.click(`[data-test=plus]`),await e.click(`[data-test=valider]`),$(e.text(`[data-test=message]`)).toBe(`Demande de 3 jour(s) enregistrée`)}}],hints:["`const emit = defineEmits(['update:modelValue', 'valider'])`","`function plus() { if (props.modelValue < props.max) emit('update:modelValue', props.modelValue + 1) }`",'Branche les boutons : `@click="plus"`, `@click="moins"`, `@click="emit(\'valider\')"`.']},cards:[{id:`2-2a`,q:'`v-model="jours"` sur un composant correspond à…',choices:["`:value` + `@input`","`:modelValue` + `@update:modelValue`","`:jours` + `@jours`","`v-bind` seul"],answer:1,explain:"Sur un composant Vue 3, v-model = prop `modelValue` + événement `update:modelValue`."},{id:`2-2b`,q:`Comment un enfant prévient-il son parent d’une action ?`,choices:[`En modifiant une prop`,'`emit("nom", données)`',"Avec `window.parent`","Avec `return`"],answer:1,explain:"On déclare l’événement avec `defineEmits` et on l’émet ; le parent écoute avec `@nom`."},{id:`2-2c`,q:"Que fait `defineModel()` (Vue 3.4+) ?",choices:[`Crée un store`,`Déclare la prop modelValue et émet update:modelValue automatiquement`,`Valide un formulaire`,`Remplace Pinia`],answer:1,explain:"Raccourci : `const m = defineModel()` puis `m.value = …` émet la mise à jour vers le v-model du parent."}]},{id:`2-3`,title:`Slots nommés et à portée`,minutes:15,goal:`Personnaliser une cellule de tableau avec #cell-nom="{ row }".`,blocks:[{t:`p`,text:'Un **slot** est un emplacement que le parent remplit. Un slot **nommé** a un nom (`<slot name="pied">`). Un slot **à portée** renvoie des données au parent (`<slot :row="ligne">`) : c\'est ce qui permet `#cell-nom="{ row }"`.'},{t:`code`,lang:`vue`,title:`Tableau.vue (enfant)`,code:`<tr v-for="row in lignes" :key="row.id">
  <td v-for="col in colonnes" :key="col.field">
    <!-- slot dynamique « cell-<champ> », avec la ligne en paramètre -->
    <slot :name="'cell-' + col.field" :row="row">
      {{ row[col.field] }}   <!-- contenu par défaut -->
    </slot>
  </td>
</tr>`},{t:`code`,lang:`vue`,title:`Parent`,code:`<Tableau :colonnes="colonnes" :lignes="salaries">
  <template #cell-statut="{ row }">
    <span :class="row.actif ? 'ok' : 'off'">{{ row.actif ? 'Actif' : 'Sorti' }}</span>
  </template>
</Tableau>`},{t:`list`,items:["`#nom` est le raccourci de `v-slot:nom`.",'`{ row }` déstructure les données envoyées par l’enfant (ici `:row="row"`).',"Sans template `#cell-x` fourni, c’est le contenu par défaut qui s’affiche."]},{t:`sql`,text:`C'est comme un **curseur** que l'enfant parcourt en te laissant décider du rendu de chaque colonne : l'enfant fait la boucle, toi tu fournis le « format » de la cellule.`}],exercise:{kind:`build`,task:"Dans `TableauSimple.vue`, chaque cellule doit proposer un **slot à portée** nommé `cell-<champ>` qui reçoit la ligne (`row`), avec la valeur brute par défaut. Puis dans `App.vue`, utilise `#cell-actif` pour afficher un badge **« Actif »** / **« Sorti »** au lieu de true/false.",open:`components/TableauSimple.vue`,files:{"components/TableauSimple.vue":`<script setup>
defineProps({
  colonnes: { type: Array, required: true }, // [{ field, label }]
  lignes: { type: Array, required: true },
})
<\/script>

<template>
  <table class="tableau">
    <thead>
      <tr><th v-for="col in colonnes" :key="col.field">{{ col.label }}</th></tr>
    </thead>
    <tbody>
      <tr v-for="row in lignes" :key="row.id" data-test="ligne">
        <td v-for="col in colonnes" :key="col.field" :data-test="'cell-' + col.field">
          {{ row[col.field] }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style>
.tableau { border-collapse: collapse; font-family: system-ui; width: 100%; }
.tableau th, .tableau td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
.badge { padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge.ok { background: #dcfce7; color: #166534; } .badge.off { background: #f3f4f6; color: #6b7280; }
</style>`,"App.vue":`<script setup>
import TableauSimple from './components/TableauSimple.vue'

const colonnes = [
  { field: 'nom', label: 'Nom' },
  { field: 'service', label: 'Service' },
  { field: 'actif', label: 'Statut' },
]
const salaries = [
  { id: 1, nom: 'Martin', service: 'Comptabilité', actif: true },
  { id: 2, nom: 'Durand', service: 'Informatique', actif: false },
  { id: 3, nom: 'Petit', service: 'RH', actif: true },
]
<\/script>

<template>
  <TableauSimple :colonnes="colonnes" :lignes="salaries">
    <!-- à compléter : #cell-actif="{ row }" -->
  </TableauSimple>
</template>`},solution:{"components/TableauSimple.vue":`<script setup>
defineProps({
  colonnes: { type: Array, required: true }, // [{ field, label }]
  lignes: { type: Array, required: true },
})
<\/script>

<template>
  <table class="tableau">
    <thead>
      <tr><th v-for="col in colonnes" :key="col.field">{{ col.label }}</th></tr>
    </thead>
    <tbody>
      <tr v-for="row in lignes" :key="row.id" data-test="ligne">
        <td v-for="col in colonnes" :key="col.field" :data-test="'cell-' + col.field">
          <slot :name="'cell-' + col.field" :row="row">{{ row[col.field] }}</slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style>
.tableau { border-collapse: collapse; font-family: system-ui; width: 100%; }
.tableau th, .tableau td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
.badge { padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge.ok { background: #dcfce7; color: #166534; } .badge.off { background: #f3f4f6; color: #6b7280; }
</style>`,"App.vue":`<script setup>
import TableauSimple from './components/TableauSimple.vue'

const colonnes = [
  { field: 'nom', label: 'Nom' },
  { field: 'service', label: 'Service' },
  { field: 'actif', label: 'Statut' },
]
const salaries = [
  { id: 1, nom: 'Martin', service: 'Comptabilité', actif: true },
  { id: 2, nom: 'Durand', service: 'Informatique', actif: false },
  { id: 3, nom: 'Petit', service: 'RH', actif: true },
]
<\/script>

<template>
  <TableauSimple :colonnes="colonnes" :lignes="salaries">
    <template #cell-actif="{ row }">
      <span class="badge" :class="row.actif ? 'ok' : 'off'">{{ row.actif ? 'Actif' : 'Sorti' }}</span>
    </template>
  </TableauSimple>
</template>`},tests:[{name:`Les autres colonnes gardent la valeur par défaut`,run:e=>{$(e.findAll(`[data-test=cell-nom]`).map(e=>e.textContent?.trim()),`Colonne Nom`).toEqual([`Martin`,`Durand`,`Petit`])}},{name:`La colonne Statut affiche Actif / Sorti`,run:e=>$(e.findAll(`[data-test=cell-actif]`).map(e=>e.textContent?.trim()),`Colonne Statut`).toEqual([`Actif`,`Sorti`,`Actif`])},{name:`Le badge est un élément .badge fourni par le parent`,run:e=>$(e.findAll(`[data-test=cell-actif] .badge`).length,`Badges`).toBe(3)}],hints:[`Dans la cellule de l'enfant : \`<slot :name="'cell-' + col.field" :row="row">{{ row[col.field] }}</slot>\`.`,'Dans App.vue : `<template #cell-actif="{ row }"> ... </template>` à l’intérieur de `<TableauSimple>`.',`Le badge : \`<span class="badge" :class="row.actif ? 'ok' : 'off'">{{ row.actif ? 'Actif' : 'Sorti' }}</span>\`.`]},cards:[{id:`2-3a`,q:'Dans `<template #cell-nom="{ row }">`, d’où vient `row` ?',choices:[`Du parent`,'De l\'enfant, via `<slot :row="...">`',`De Pinia`,`Du routeur`],answer:1,explain:`C'est un slot à portée : l’enfant passe des données au contenu fourni par le parent.`},{id:`2-3b`,q:"Que s’affiche-t-il si le parent ne fournit pas `#cell-service` ?",choices:[`Rien`,`Une erreur`,"Le contenu par défaut placé entre `<slot>` et `</slot>`","`undefined`"],answer:2,explain:"Le contenu à l’intérieur de la balise `<slot>` est le rendu par défaut."},{id:`2-3c`,q:"Que signifie `#pied` ?",choices:[`Un id CSS`,"Le raccourci de `v-slot:pied`",`Une ancre de lien`,`Un commentaire`],answer:1,explain:"`#` est le raccourci de `v-slot:`."}]},{id:`2-4`,title:`Refs de template et defineExpose`,minutes:12,goal:`Accéder à un élément du DOM et appeler une méthode d’un composant enfant.`,blocks:[{t:`p`,text:'Une **ref de template** donne accès à un élément HTML ou à un composant : on déclare `const champ = ref(null)` et on met `ref="champ"` sur la balise. Elle est remplie **après le montage**.'},{t:`code`,lang:`vue`,code:`<script setup>
const champ = ref(null)
onMounted(() => champ.value.focus())   // élément HTML
<\/script>
<template><input ref="champ"></template>`},{t:`p`,text:"Par défaut, un composant `<script setup>` est **fermé** : le parent ne voit rien de l'intérieur. Pour lui ouvrir des méthodes, on utilise **`defineExpose`**."},{t:`code`,lang:`vue`,code:`<!-- Formulaire.vue -->
<script setup>
const nom = ref('')
function reinitialiser() { nom.value = '' }
defineExpose({ reinitialiser })
<\/script>

<!-- Parent -->
<script setup>
const formulaire = ref(null)
<\/script>
<template>
  <Formulaire ref="formulaire" />
  <button @click="formulaire.reinitialiser()">Effacer</button>
</template>`},{t:`tip`,text:"À utiliser avec modération : la plupart du temps, props + emits suffisent. `defineExpose` sert pour des actions impératives (réinitialiser, valider, donner le focus)."}],exercise:{kind:`build`,task:"1) `FormulaireConge.vue` doit **exposer** `reinitialiser()` et `focus()`. 2) Dans `App.vue`, crée la ref de template et branche les boutons **Effacer** (réinitialise le formulaire) et **Saisir** (donne le focus au champ motif).",open:`components/FormulaireConge.vue`,files:{"components/FormulaireConge.vue":`<script setup>
const motif = ref('')
const jours = ref(1)
const champMotif = ref(null)

function reinitialiser() {
  motif.value = ''
  jours.value = 1
}

function focus() {
  champMotif.value.focus()
}
// à compléter : exposer reinitialiser et focus
<\/script>

<template>
  <div class="form">
    <input ref="champMotif" data-test="motif" v-model="motif" placeholder="Motif">
    <input data-test="jours" type="number" v-model.number="jours">
    <p data-test="apercu">{{ motif || '—' }} · {{ jours }} j</p>
  </div>
</template>

<style>
.form { display: grid; gap: 8px; max-width: 320px; font-family: system-ui; }
</style>`,"App.vue":`<script setup>
import FormulaireConge from './components/FormulaireConge.vue'
// à compléter : ref de template
<\/script>

<template>
  <FormulaireConge />
  <div style="display:flex; gap:8px; margin-top:8px">
    <button data-test="effacer">Effacer</button>
    <button data-test="saisir">Saisir</button>
  </div>
</template>`},solution:{"components/FormulaireConge.vue":`<script setup>
const motif = ref('')
const jours = ref(1)
const champMotif = ref(null)

function reinitialiser() {
  motif.value = ''
  jours.value = 1
}

function focus() {
  champMotif.value.focus()
}
defineExpose({ reinitialiser, focus })
<\/script>

<template>
  <div class="form">
    <input ref="champMotif" data-test="motif" v-model="motif" placeholder="Motif">
    <input data-test="jours" type="number" v-model.number="jours">
    <p data-test="apercu">{{ motif || '—' }} · {{ jours }} j</p>
  </div>
</template>

<style>
.form { display: grid; gap: 8px; max-width: 320px; font-family: system-ui; }
</style>`,"App.vue":`<script setup>
import FormulaireConge from './components/FormulaireConge.vue'
const formulaire = ref(null)
<\/script>

<template>
  <FormulaireConge ref="formulaire" />
  <div style="display:flex; gap:8px; margin-top:8px">
    <button data-test="effacer" @click="formulaire.reinitialiser()">Effacer</button>
    <button data-test="saisir" @click="formulaire.focus()">Saisir</button>
  </div>
</template>`},tests:[{name:`Effacer réinitialise le formulaire de l’enfant`,run:async e=>{await e.input(`[data-test=motif]`,`Déménagement`),await e.input(`[data-test=jours]`,`3`),$(e.text(`[data-test=apercu]`)).toBe(`Déménagement · 3 j`),await e.click(`[data-test=effacer]`),$(e.text(`[data-test=apercu]`),`Aperçu après Effacer`).toBe(`— · 1 j`)}},{name:`Saisir donne le focus au champ motif`,run:async e=>{document.activeElement?.blur?.(),await e.click(`[data-test=saisir]`),$(document.activeElement===e.find(`[data-test=motif]`),`Le champ motif a le focus`).toBeTruthy()}}],hints:["Dans l'enfant : `defineExpose({ reinitialiser, focus })`.",'Dans App.vue : `const formulaire = ref(null)` et `<FormulaireConge ref="formulaire" />`.','Boutons : `@click="formulaire.reinitialiser()"` et `@click="formulaire.focus()"`.']},cards:[{id:`2-4a`,q:`Quand une ref de template est-elle remplie ?`,choices:[`Dès la déclaration`,`Après le montage (onMounted)`,`Avant le setup`,`Jamais automatiquement`],answer:1,explain:"L'élément n'existe qu'une fois rendu : avant `onMounted`, la ref vaut `null`."},{id:`2-4b`,q:"Sans `defineExpose`, que voit le parent d’un composant `<script setup>` ?",choices:[`Toutes ses variables`,`Rien de son état interne`,`Seulement ses props`,`Seulement ses refs`],answer:1,explain:"Les composants `<script setup>` sont fermés par défaut : on choisit explicitement ce qu’on expose."},{id:`2-4c`,q:`Quand préférer props/emits à defineExpose ?`,choices:[`Jamais`,`Presque toujours : defineExpose sert aux actions impératives (focus, reset)`,`Seulement avec Pinia`,`Pour les listes`],answer:1,explain:"Les données circulent normalement par props/emits ; `defineExpose` est une porte de service."}]}]},ol=`export const salaries = [
  { id: 1, prenom: 'Léa', nom: 'Martin', service: 'Comptabilité', poste: 'Comptable' },
  { id: 2, prenom: 'Hugo', nom: 'Bernard', service: 'Informatique', poste: 'Développeur' },
  { id: 3, prenom: 'Chloé', nom: 'Petit', service: 'RH', poste: 'Chargée RH' },
]`,sl={id:3,title:`Routage par fichiers`,icon:`pi pi-directions`,color:`#a855f7`,summary:`Un fichier = une URL : pages, paramètres _ID, navigation.`,lessons:[{id:`3-1`,title:`pages/, router-link et router-view`,minutes:12,goal:`Ajouter une page en créant un fichier, et naviguer entre les pages.`,blocks:[{t:`p`,text:"Avec le **routage par fichiers**, tu ne déclares pas les routes à la main : chaque fichier de `pages/` devient une URL."},{t:`code`,lang:`js`,title:`Correspondance fichiers → URL`,code:`pages/index.vue                 → /
pages/salaries/index.vue        → /salaries
pages/salaries/_ID.vue          → /salaries/123      (paramètre ID)
pages/salaries/_ID/detail.vue   → /salaries/123/detail
pages/salaries/components/…     → aucune URL (composants de la page)`},{t:`code`,lang:`vue`,title:`App.vue : le layout`,code:`<template>
  <nav>
    <router-link to="/">Accueil</router-link>
    <router-link to="/salaries">Salariés</router-link>
  </nav>
  <router-view />   <!-- la page de l'URL courante s'affiche ici -->
</template>`},{t:`list`,items:["`<router-link>` génère un lien qui change de page **sans recharger** l’application.","Le lien actif reçoit la classe `router-link-active` (pratique pour le menu).","`<router-view />` est l’emplacement où la page courante s’affiche."]},{t:`tip`,text:`Dans cet exercice, utilise le bouton **＋ Fichier** de l'éditeur pour créer la nouvelle page.`}],exercise:{kind:`build`,task:"Le menu affiche des liens mais aucune page ne s'affiche. 1) Dans `App.vue`, transforme les liens en `<router-link>` et ajoute **`<router-view />`**. 2) **Crée** la page `pages/absences/index.vue` qui affiche un titre `<h1>Absences</h1>`.",open:`App.vue`,files:{"App.vue":`<template>
  <div class="layout">
    <nav class="menu">
      <a href="#" data-test="lien-accueil">Accueil</a>
      <a href="#" data-test="lien-salaries">Salariés</a>
      <a href="#" data-test="lien-absences">Absences</a>
    </nav>
    <main class="contenu">
      <!-- à compléter : la page courante doit s'afficher ici -->
    </main>
  </div>
</template>

<style>
.layout { font-family: system-ui; }
.menu { display: flex; gap: 12px; padding: 10px; background: #f4f4f5; border-radius: 10px; }
.menu a { color: #334155; text-decoration: none; font-weight: 600; }
.menu a.router-link-active { color: #42b883; }
.contenu { padding: 12px 4px; }
</style>`,"pages/index.vue":`<template>
  <h1>Tableau de bord</h1>
</template>`,"pages/salaries/index.vue":`<template>
  <h1>Salariés</h1>
</template>`},solution:{"App.vue":(e=>`<template>
  <div class="layout">
    <nav class="menu">
${e}
    </nav>
    <main class="contenu">
      <router-view />
    </main>
  </div>
</template>

<style>
.layout { font-family: system-ui; }
.menu { display: flex; gap: 12px; padding: 10px; background: #f4f4f5; border-radius: 10px; }
.menu a { color: #334155; text-decoration: none; font-weight: 600; }
.menu a.router-link-active { color: #42b883; }
.contenu { padding: 12px 4px; }
</style>`)(`      <router-link to="/" data-test="lien-accueil">Accueil</router-link>
      <router-link to="/salaries" data-test="lien-salaries">Salariés</router-link>
      <router-link to="/absences" data-test="lien-absences">Absences</router-link>`),"pages/absences/index.vue":`<template>
  <h1>Absences</h1>
</template>`},tests:[{name:`La page d’accueil s’affiche`,run:e=>$(e.text(`h1`),`Titre de la page /`).toBe(`Tableau de bord`)},{name:`Le lien Salariés affiche la page salariés`,run:async e=>{await e.click(`[data-test=lien-salaries]`),await e.flush(),$(e.text(`h1`),`Titre après clic sur Salariés`).toBe(`Salariés`)}},{name:`La page /absences existe`,run:async e=>{await e.click(`[data-test=lien-absences]`),await e.flush(),$(e.router?.currentRoute.value.path,`URL`).toBe(`/absences`),$(e.text(`h1`),`Titre de la page /absences`).toBe(`Absences`)}},{name:`Les liens sont des router-link (classe active)`,run:async e=>{await e.click(`[data-test=lien-salaries]`),await e.flush(),$(e.get(`[data-test=lien-salaries]`).classList.contains(`router-link-active`),`Classe router-link-active sur le lien Salariés`).toBeTruthy()}}],hints:['Remplace chaque `<a href="#">` par `<router-link to="/...">` (garde les `data-test`).',"Mets `<router-view />` dans `<main>`.","Crée le fichier `pages/absences/index.vue` avec `<template><h1>Absences</h1></template>`."]},cards:[{id:`3-1a`,q:"Quelle URL donne le fichier `pages/conges/index.vue` ?",choices:[`/conges/index`,`/conges`,`/pages/conges`,`/index/conges`],answer:1,explain:"`index.vue` correspond à la racine de son dossier : `/conges`."},{id:`3-1b`,q:"À quoi sert `<router-view />` ?",choices:[`À créer un lien`,`À afficher la page correspondant à l’URL courante`,`À déclarer une route`,`À recharger la page`],answer:1,explain:`C’est l’emplacement où le routeur affiche le composant de la page active.`},{id:`3-1c`,q:"Un fichier dans `pages/salaries/components/` a-t-il une URL ?",choices:[`Oui`,`Non : ce sont des composants de la page`,`Seulement s’il s’appelle index.vue`,`Oui, /components`],answer:1,explain:"Les dossiers `components/` sont exclus du routage : ils contiennent les briques de la page."}]},{id:`3-2`,title:`_ID.vue et useRoute`,minutes:14,goal:`Créer une page détail qui lit le paramètre de l’URL.`,blocks:[{t:`p`,text:"Un fichier `_ID.vue` crée une route **dynamique** : `/salaries/1`, `/salaries/2`… La valeur est lue avec **`useRoute()`** dans `route.params.ID`."},{t:`code`,lang:`vue`,title:`pages/salaries/_ID.vue`,code:`<script setup>
const route = useRoute()
const id = computed(() => Number(route.params.ID))   // les paramètres sont des textes
const salarie = computed(() => salaries.find(s => s.id === id.value))
<\/script>

<template>
  <h1 v-if="salarie">{{ salarie.prenom }} {{ salarie.nom }}</h1>
  <p v-else>Salarié introuvable</p>
</template>`},{t:`code`,lang:`vue`,title:`Lien vers une fiche`,code:`<router-link :to="'/salaries/' + s.id">{{ s.nom }}</router-link>`},{t:`warn`,text:"`route.params.ID` est **toujours une chaîne** (`'2'`). Comparer avec `===` à un nombre échoue : convertis avec `Number(...)`."},{t:`sql`,text:"C'est le `WHERE id = :ID` de ta page : le paramètre arrive dans l'URL au lieu d'une variable de liaison."}],exercise:{kind:`build`,task:"1) Dans la liste, chaque nom doit être un lien vers `/salaries/<id>`. 2) Dans `_ID.vue`, affiche le salarié correspondant au paramètre **ID** (prénom nom, poste) et « Salarié introuvable » si l’ID n’existe pas.",open:`pages/salaries/_ID.vue`,readonly:[`App.vue`,`lib/donnees.js`],files:{"App.vue":`<template><router-view /></template>`,"lib/donnees.js":ol,"pages/salaries/index.vue":`<script setup>
import { salaries } from '@/lib/donnees'
<\/script>

<template>
  <h1>Salariés</h1>
  <ul>
    <li v-for="s in salaries" :key="s.id">
      <span data-test="lien">{{ s.prenom }} {{ s.nom }}</span>
    </li>
  </ul>
</template>`,"pages/salaries/_ID.vue":`<script setup>
import { salaries } from '@/lib/donnees'
// à compléter : lire le paramètre ID et retrouver le salarié
<\/script>

<template>
  <h1 data-test="titre">Fiche salarié</h1>
  <p data-test="poste"></p>
</template>`,"pages/index.vue":`<template><router-link to="/salaries">Voir les salariés</router-link></template>`},solution:{"pages/salaries/index.vue":`<script setup>
import { salaries } from '@/lib/donnees'
<\/script>

<template>
  <h1>Salariés</h1>
  <ul>
    <li v-for="s in salaries" :key="s.id">
      <router-link :to="'/salaries/' + s.id" data-test="lien">{{ s.prenom }} {{ s.nom }}</router-link>
    </li>
  </ul>
</template>`,"pages/salaries/_ID.vue":`<script setup>
import { salaries } from '@/lib/donnees'

const route = useRoute()
const salarie = computed(() => salaries.find(s => s.id === Number(route.params.ID)))
<\/script>

<template>
  <template v-if="salarie">
    <h1 data-test="titre">{{ salarie.prenom }} {{ salarie.nom }}</h1>
    <p data-test="poste">{{ salarie.poste }}</p>
  </template>
  <p v-else data-test="introuvable">Salarié introuvable</p>
</template>`},tests:[{name:`Accès direct à /salaries/3`,run:async e=>{await e.go(`/salaries/3`),$(e.text(`[data-test=titre]`),`Titre de la fiche 3`).toBe(`Chloé Petit`),$(e.text(`[data-test=poste]`)).toBe(`Chargée RH`)}},{name:`Clic sur un nom de la liste`,run:async e=>{await e.go(`/salaries`);let t=e.findAll(`[data-test=lien]`);$(t.length,`Liens`).toBe(3),t[1].click(),await e.flush(),await e.flush(),$(e.router?.currentRoute.value.path,`URL après clic sur Hugo`).toBe(`/salaries/2`),$(e.text(`[data-test=titre]`)).toBe(`Hugo Bernard`)}},{name:`ID inconnu → « Salarié introuvable »`,run:async e=>{await e.go(`/salaries/99`),$(e.text(),`Page /salaries/99`).toContain(`Salarié introuvable`)}}],hints:["Dans `_ID.vue` : `const route = useRoute()` puis `computed(() => salaries.find(s => s.id === Number(route.params.ID)))`.",`Lien : \`<router-link :to="'/salaries/' + s.id" data-test="lien">\`.`,'Utilise `v-if="salarie"` / `v-else` pour le cas introuvable.']},cards:[{id:`3-2a`,q:"Quelle URL correspond à `pages/conges/_ID.vue` ?",choices:[`/conges/_ID`,`/conges/:ID (ex. /conges/42)`,`/conges?ID=`,`/_ID/conges`],answer:1,explain:"Le préfixe `_` crée un paramètre dynamique nommé ID."},{id:`3-2b`,q:"Que vaut `route.params.ID` pour l’URL `/salaries/7` ?",choices:["`7` (nombre)","`'7'` (chaîne)","`undefined`","`[7]`"],answer:1,explain:"Les paramètres d’URL sont des chaînes : `Number(route.params.ID)` pour comparer avec un id numérique."},{id:`3-2c`,q:"Comment faire un lien vers la fiche `s.id` ?",choices:['`<router-link to="/salaries/s.id">`',`\`<router-link :to="'/salaries/' + s.id">\``,'`<a href="/salaries/{s.id}">`','`<router-view :to="s.id">`'],answer:1,explain:"`:to` (avec deux-points) évalue l’expression ; sans `:`, `s.id` serait du texte."}]},{id:`3-3`,title:`router.push, sous-pages et <route>`,minutes:14,goal:`Naviguer par code, créer une sous-page _ID/detail et utiliser la meta de route.`,blocks:[{t:`p`,text:"Pour naviguer **depuis le code** (après un enregistrement, sur un clic de ligne…), on utilise **`useRouter()`** et `router.push(...)`."},{t:`code`,lang:`js`,code:`const router = useRouter()
const route = useRoute()

function voirDetail() {
  router.push('/salaries/' + route.params.ID + '/detail')
}
// router.back()  → page précédente
// router.replace(...) → sans ajouter à l'historique`},{t:`p`,text:"Le bloc **`<route>`** d'un fichier de page ajoute des **méta-données** à sa route (titre, droits, onglet du menu…). Le layout peut les lire via `route.meta`."},{t:`code`,lang:`vue`,title:`pages/salaries/_ID/detail.vue`,code:`<template>…</template>

<route>
{ "meta": { "titre": "Détail du salarié" } }
</route>`},{t:`list`,items:["`useRoute()` = l’URL **courante** (lecture : params, query, meta).","`useRouter()` = le **routeur** (actions : push, back, replace).","Dans un template, `$route` et `$router` sont aussi disponibles."]}],exercise:{kind:`build`,task:"1) Sur la fiche `_ID.vue`, le bouton **Voir le détail** doit aller à `/salaries/<ID>/detail` avec `router.push`. 2) Dans `detail.vue`, ajoute un bloc `<route>` avec `meta.titre` = **« Détail du salarié »** (le layout l'affiche dans l'en-tête). 3) Le bouton **Retour** revient à la fiche.",open:`pages/salaries/_ID.vue`,readonly:[`App.vue`,`lib/donnees.js`],files:{"App.vue":`<script setup>
const route = useRoute()
<\/script>

<template>
  <header class="entete" data-test="entete">{{ route.meta.titre || 'Application' }}</header>
  <router-view />
</template>

<style>
.entete { font: 700 18px system-ui; padding: 10px; border-bottom: 1px solid #eee; }
</style>`,"lib/donnees.js":ol,"pages/index.vue":`<template><router-link to="/salaries/2">Fiche de Hugo</router-link></template>`,"pages/salaries/_ID.vue":`<script setup>
import { salaries } from '@/lib/donnees'

const route = useRoute()
const salarie = computed(() => salaries.find(s => s.id === Number(route.params.ID)))

function voirDetail() {
  // à compléter
}
<\/script>

<template>
  <h1 data-test="titre">{{ salarie?.prenom }} {{ salarie?.nom }}</h1>
  <button data-test="detail" @click="voirDetail">Voir le détail</button>
</template>

<route>
{ "meta": { "titre": "Fiche salarié" } }
</route>`,"pages/salaries/_ID/detail.vue":`<script setup>
import { salaries } from '@/lib/donnees'

const route = useRoute()
const salarie = computed(() => salaries.find(s => s.id === Number(route.params.ID)))

function retour() {
  // à compléter : revenir à la fiche /salaries/<ID>
}
<\/script>

<template>
  <p data-test="info">{{ salarie?.prenom }} · {{ salarie?.service }} · {{ salarie?.poste }}</p>
  <button data-test="retour" @click="retour">Retour</button>
</template>`},solution:{"pages/salaries/_ID.vue":`<script setup>
import { salaries } from '@/lib/donnees'

const route = useRoute()
const router = useRouter()
const salarie = computed(() => salaries.find(s => s.id === Number(route.params.ID)))

function voirDetail() {
  router.push('/salaries/' + route.params.ID + '/detail')
}
<\/script>

<template>
  <h1 data-test="titre">{{ salarie?.prenom }} {{ salarie?.nom }}</h1>
  <button data-test="detail" @click="voirDetail">Voir le détail</button>
</template>

<route>
{ "meta": { "titre": "Fiche salarié" } }
</route>`,"pages/salaries/_ID/detail.vue":`<script setup>
import { salaries } from '@/lib/donnees'

const route = useRoute()
const router = useRouter()
const salarie = computed(() => salaries.find(s => s.id === Number(route.params.ID)))

function retour() {
  router.push('/salaries/' + route.params.ID)
}
<\/script>

<template>
  <p data-test="info">{{ salarie?.prenom }} · {{ salarie?.service }} · {{ salarie?.poste }}</p>
  <button data-test="retour" @click="retour">Retour</button>
</template>

<route>
{ "meta": { "titre": "Détail du salarié" } }
</route>`},tests:[{name:`Voir le détail navigue vers /salaries/2/detail`,run:async e=>{await e.go(`/salaries/2`),await e.click(`[data-test=detail]`),await e.flush(),$(e.router?.currentRoute.value.path,`URL`).toBe(`/salaries/2/detail`),$(e.text(`[data-test=info]`)).toBe(`Hugo · Informatique · Développeur`)}},{name:`L’en-tête affiche la meta de la sous-page`,run:async e=>{await e.go(`/salaries/2/detail`),$(e.text(`[data-test=entete]`),`En-tête sur la page détail`).toBe(`Détail du salarié`)}},{name:`Retour ramène à la fiche`,run:async e=>{await e.go(`/salaries/1/detail`),await e.click(`[data-test=retour]`),await e.flush(),$(e.router?.currentRoute.value.path).toBe(`/salaries/1`),$(e.text(`[data-test=entete]`)).toBe(`Fiche salarié`)}}],hints:["`const router = useRouter()` puis `router.push('/salaries/' + route.params.ID + '/detail')`.",'Ajoute en bas de `detail.vue` : `<route>{ "meta": { "titre": "Détail du salarié" } }</route>`.',"`retour()` : `router.push('/salaries/' + route.params.ID)`."]},cards:[{id:`3-3a`,q:`Pour naviguer après un enregistrement, on utilise…`,choices:["`useRoute().push()`","`useRouter().push()`","`window.location = …`","`<router-view>`"],answer:1,explain:"`useRouter()` donne le routeur (actions). `useRoute()` donne l’URL courante (lecture)."},{id:`3-3b`,q:"À quoi sert le bloc `<route>` dans un fichier de page ?",choices:[`À écrire du CSS`,`À ajouter des méta-données à la route (titre, droits…)`,`À importer le routeur`,`À créer un sous-composant`],answer:1,explain:"Son contenu (JSON) est fusionné dans la définition de la route ; `meta` est lisible via `route.meta`."},{id:`3-3c`,q:"Quelle URL pour `pages/salaries/_ID/detail.vue` ?",choices:[`/salaries/detail`,`/salaries/:ID/detail`,`/detail/:ID`,`/salaries/_ID/detail`],answer:1,explain:"Le dossier `_ID` donne le paramètre, `detail.vue` la sous-page."}]}]},cl={id:4,title:`Appels serveur`,icon:`pi pi-cloud-download`,color:`#f59e0b`,summary:`Charger et envoyer des données : chargement, erreurs, cas réels.`,lessons:[{id:`4-1`,title:`async/await, chargement et erreurs`,minutes:15,goal:`Charger une liste avec un état de chargement et une gestion d’erreur.`,blocks:[{t:`p`,text:"Un appel serveur renvoie une **Promise** : la réponse arrive plus tard. On l'attend avec **`await`** dans une fonction **`async`**, et on gère trois états : **chargement**, **erreur**, **données**."},{t:`code`,lang:`vue`,code:`<script setup>
import { fetchSalaries } from '@/lib/api'

const salaries = ref([])
const chargement = ref(false)
const erreur = ref(null)

async function charger() {
  chargement.value = true
  erreur.value = null
  try {
    salaries.value = await fetchSalaries()
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false     // toujours exécuté, succès ou échec
  }
}

onMounted(charger)
<\/script>

<template>
  <ProgressSpinner v-if="chargement" />
  <p v-else-if="erreur">{{ erreur }} <button @click="charger">Réessayer</button></p>
  <ul v-else>…</ul>
</template>`},{t:`code`,lang:`js`,title:`Même chose avec .then (style que tu croiseras aussi)`,code:`fetchSalaries()
  .then(data => { salaries.value = data })
  .catch(e => { erreur.value = e.message })
  .finally(() => { chargement.value = false })`},{t:`warn`,text:"Oublier `await` : `salaries.value = fetchSalaries()` met une **Promise** dans la ref, pas la liste. Résultat : rien ne s'affiche (ou `v-for` sur un objet bizarre)."},{t:`sql`,text:"`try/catch/finally` ≈ `BEGIN … EXCEPTION WHEN OTHERS THEN … END` ; `finally` n'a pas d'équivalent direct : c'est le code exécuté dans **tous** les cas.",code:`BEGIN
  charger_salaries;
EXCEPTION
  WHEN OTHERS THEN v_erreur := SQLERRM;
END;`},{t:`code`,lang:`js`,title:`Le serveur fictif des exercices`,code:`// Module fourni (serveur FICTIF, latence simulée) :
// import { fetchSalaries, fetchSalarie, saveAbsence, ApiError } from '@/lib/api'
//   fetchSalaries(filtre?)  → Promise<Salarie[]>
//   fetchSalarie(id)        → Promise<Salarie>   (ApiError 404 si inconnu)
//   saveAbsence(absence)    → Promise<Absence>   (ApiError 400 si dates invalides)
//   err.status, err.message`}],exercise:{kind:`build`,task:"La liste ne s'affiche jamais (il manque `await`…), et il n'y a ni chargement ni erreur. Écris `charger()` proprement : **chargement** pendant l'appel (`data-test=\"chargement\"`), message d'**erreur** en cas d'échec (`data-test=\"erreur\"`) avec un bouton **Réessayer**, puis la liste.",open:`App.vue`,files:{"App.vue":`<script setup>
import { fetchSalaries } from '@/lib/api'

const salaries = ref([])
const chargement = ref(false)
const erreur = ref(null)

function charger() {
  salaries.value = fetchSalaries()
}

onMounted(charger)
<\/script>

<template>
  <div class="page">
    <button data-test="actualiser" @click="charger">Actualiser</button>
    <p v-if="chargement" data-test="chargement">Chargement…</p>
    <p v-else-if="erreur" data-test="erreur" class="erreur">
      {{ erreur }} <button data-test="reessayer" @click="charger">Réessayer</button>
    </p>
    <ul v-else>
      <li v-for="s in salaries" :key="s.id" data-test="ligne">{{ s.prenom }} {{ s.nom }}</li>
    </ul>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 12px; }
.erreur { color: #b91c1c; }
</style>`},solution:{"App.vue":`<script setup>
import { fetchSalaries } from '@/lib/api'

const salaries = ref([])
const chargement = ref(false)
const erreur = ref(null)

async function charger() {
  chargement.value = true
  erreur.value = null
  try {
    salaries.value = await fetchSalaries()
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
}

onMounted(charger)
<\/script>

<template>
  <div class="page">
    <button data-test="actualiser" @click="charger">Actualiser</button>
    <p v-if="chargement" data-test="chargement">Chargement…</p>
    <p v-else-if="erreur" data-test="erreur" class="erreur">
      {{ erreur }} <button data-test="reessayer" @click="charger">Réessayer</button>
    </p>
    <ul v-else>
      <li v-for="s in salaries" :key="s.id" data-test="ligne">{{ s.prenom }} {{ s.nom }}</li>
    </ul>
  </div>
</template>

<style>
.page { font-family: system-ui; padding: 12px; }
.erreur { color: #b91c1c; }
</style>`},tests:[{name:`La liste se charge (6 salariés)`,run:async e=>{await e.until(()=>e.findAll(`[data-test=ligne]`).length>0,`la liste devrait apparaître`),$(e.findAll(`[data-test=ligne]`).length,`Lignes`).toBe(6)}},{name:`Chargement visible pendant l’appel`,run:async e=>{await e.until(()=>e.findAll(`[data-test=ligne]`).length>0,`chargement initial`),e.api.delay=150,e.get(`[data-test=actualiser]`).click(),await e.flush(),$(e.exists(`[data-test=chargement]`),`Indicateur « Chargement… » pendant l’appel`).toBeTruthy(),await e.until(()=>!e.exists(`[data-test=chargement]`),`fin du chargement`),$(e.findAll(`[data-test=ligne]`).length).toBe(6)}},{name:`Erreur affichée, puis Réessayer fonctionne`,run:async e=>{await e.until(()=>e.findAll(`[data-test=ligne]`).length>0,`chargement initial`),e.api.failNext=500,await e.click(`[data-test=actualiser]`),await e.until(()=>e.exists(`[data-test=erreur]`),`le message d’erreur devrait apparaître`),$(e.text(`[data-test=erreur]`)).toContain(`Erreur serveur`),await e.click(`[data-test=reessayer]`),await e.until(()=>e.findAll(`[data-test=ligne]`).length===6,`la liste après Réessayer`)}}],hints:["Ajoute `async` devant `function charger()` et `await` devant `fetchSalaries()`.","Entoure l’appel de `try { … } catch (e) { erreur.value = e.message } finally { chargement.value = false }`.","Au début : `chargement.value = true` et `erreur.value = null`."]},cards:[{id:`4-1a`,q:"Que contient `salaries.value` après `salaries.value = fetchSalaries()` (sans await) ?",choices:[`La liste`,`Une Promise`,`undefined`,`Une erreur`],answer:1,explain:"Sans `await`, on stocke la promesse elle-même, pas son résultat."},{id:`4-1b`,q:"Le bloc `finally` s’exécute…",choices:[`Seulement en cas de succès`,`Seulement en cas d’erreur`,`Dans tous les cas`,`Jamais avec await`],answer:2,explain:"Idéal pour remettre `chargement` à false quoi qu’il arrive."},{id:`4-1c`,q:"Pourquoi remettre `erreur.value = null` au début de `charger()` ?",choices:[`Par habitude`,`Pour effacer l’ancienne erreur quand on réessaie`,`Pour éviter un warning`,`C’est obligatoire avec async`],answer:1,explain:`Sinon l’ancien message resterait affiché pendant le nouvel essai, même s’il réussit.`}]},{id:`4-2`,title:`Piège : recharger quand l’ID change`,minutes:14,goal:`Recharger les données quand on passe de /salaries/1 à /salaries/2.`,blocks:[{t:`p`,text:"Quand on navigue de `/salaries/1` à `/salaries/2`, c'est **la même page** (`_ID.vue`) : Vue **réutilise** le composant. `onMounted` ne se relance pas… et la fiche reste sur l'ancien salarié."},{t:`code`,lang:`js`,code:`const route = useRoute()

async function charger() {
  salarie.value = await fetchSalarie(route.params.ID)
}

// ❌ onMounted(charger)  → seulement au premier affichage
// ✅ au montage ET à chaque changement d'ID :
watch(() => route.params.ID, charger, { immediate: true })`},{t:`tip`,text:"Si l'utilisateur va très vite (1 → 2 → 3), les réponses peuvent arriver dans le désordre. Astuce : mémorise l'ID demandé et ignore une réponse qui ne correspond plus à `route.params.ID`."}],exercise:{kind:`bug`,task:`**Trouve le bug.** La fiche affiche le bon salarié au premier chargement, mais le bouton **Suivant** change l'URL sans changer la fiche. Corrige pour que la fiche suive toujours l'ID de l'URL.`,open:`pages/salaries/_ID.vue`,readonly:[`App.vue`],files:{"App.vue":`<template><router-view /></template>`,"pages/index.vue":`<template><router-link to="/salaries/1">Commencer</router-link></template>`,"pages/salaries/_ID.vue":`<script setup>
import { fetchSalarie } from '@/lib/api'

const route = useRoute()
const salarie = ref(null)
const erreur = ref(null)

async function charger() {
  erreur.value = null
  try {
    salarie.value = await fetchSalarie(route.params.ID)
  } catch (e) {
    salarie.value = null
    erreur.value = e.message
  }
}

onMounted(charger)
<\/script>

<template>
  <div class="fiche">
    <h1 v-if="salarie" data-test="nom">{{ salarie.prenom }} {{ salarie.nom }}</h1>
    <p v-if="erreur" data-test="erreur">{{ erreur }}</p>
    <router-link data-test="suivant" :to="'/salaries/' + (Number(route.params.ID) + 1)">Suivant</router-link>
  </div>
</template>`},solution:{"pages/salaries/_ID.vue":`<script setup>
import { fetchSalarie } from '@/lib/api'

const route = useRoute()
const salarie = ref(null)
const erreur = ref(null)

async function charger() {
  erreur.value = null
  try {
    salarie.value = await fetchSalarie(route.params.ID)
  } catch (e) {
    salarie.value = null
    erreur.value = e.message
  }
}

watch(() => route.params.ID, charger, { immediate: true })
<\/script>

<template>
  <div class="fiche">
    <h1 v-if="salarie" data-test="nom">{{ salarie.prenom }} {{ salarie.nom }}</h1>
    <p v-if="erreur" data-test="erreur">{{ erreur }}</p>
    <router-link data-test="suivant" :to="'/salaries/' + (Number(route.params.ID) + 1)">Suivant</router-link>
  </div>
</template>`},tests:[{name:`Premier affichage`,run:async e=>{await e.go(`/salaries/1`),await e.until(()=>e.exists(`[data-test=nom]`),`fiche 1`),$(e.text(`[data-test=nom]`)).toBe(`Léa Martin`)}},{name:`Suivant charge la fiche suivante`,run:async e=>{await e.go(`/salaries/1`),await e.until(()=>e.exists(`[data-test=nom]`),`fiche 1`),await e.click(`[data-test=suivant]`),await e.until(()=>e.text(`[data-test=nom]`)===`Hugo Bernard`,`la fiche 2 (Hugo Bernard) devrait s’afficher après Suivant`,800)}},{name:`ID inconnu : message d’erreur, plus d’ancienne fiche`,run:async e=>{await e.go(`/salaries/6`),await e.until(()=>e.exists(`[data-test=nom]`),`fiche 6`),await e.click(`[data-test=suivant]`),await e.until(()=>e.exists(`[data-test=erreur]`),`le message pour l’ID 7`,800),$(e.exists(`[data-test=nom]`),`Ancienne fiche encore affichée`).toBeFalsy()}}],hints:["`onMounted` ne se relance pas : le composant est réutilisé quand seul l’ID change.","Remplace `onMounted(charger)` par `watch(() => route.params.ID, charger, { immediate: true })`."]},cards:[{id:`4-2a`,q:"De /salaries/1 à /salaries/2, le composant `_ID.vue`…",choices:[`Est détruit puis recréé`,`Est réutilisé (onMounted ne se relance pas)`,`Recharge toute l’app`,`Lève une erreur`],answer:1,explain:`Même route, autre paramètre : Vue garde l’instance. Il faut surveiller le paramètre.`},{id:`4-2b`,q:`Quelle ligne charge au montage ET à chaque changement d’ID ?`,choices:["`onMounted(charger)`","`watch(route.params.ID, charger)`","`watch(() => route.params.ID, charger, { immediate: true })`","`computed(charger)`"],answer:2,explain:"Source sous forme de fonction + `immediate: true` pour le premier chargement."},{id:`4-2c`,q:`Réponses dans le désordre (1 → 2 très vite) : comment éviter d’afficher la mauvaise fiche ?`,choices:[`Ajouter un délai`,`Ignorer une réponse dont l’ID ne correspond plus à la route`,`Utiliser v-show`,`Recharger la page`],answer:1,explain:`On compare l’ID demandé à l’ID courant avant d’écrire la réponse (ou on annule la requête précédente).`}]},{id:`4-3`,title:`Envoyer un formulaire`,minutes:15,goal:`Soumettre, bloquer le double envoi, afficher l’erreur du serveur.`,blocks:[{t:`p`,text:`Pour un envoi, trois choses comptent : **désactiver le bouton** pendant l'envoi (pas de double clic → double enregistrement), afficher **l'erreur métier** renvoyée par le serveur, et **confirmer** le succès.`},{t:`code`,lang:`vue`,code:`<script setup>
import { saveAbsence } from '@/lib/api'

const form = reactive({ type: 'CP', debut: '', fin: '' })
const envoi = ref(false)
const erreur = ref(null)

async function envoyer() {
  if (envoi.value) return
  envoi.value = true
  erreur.value = null
  try {
    await saveAbsence({ ...form })
  } catch (e) {
    erreur.value = e.status === 400 ? e.message : 'Erreur serveur, réessaie.'
  } finally {
    envoi.value = false
  }
}
<\/script>

<template>
  <form @submit.prevent="envoyer">
    …
    <button :disabled="envoi">{{ envoi ? 'Envoi…' : 'Envoyer' }}</button>
  </form>
</template>`},{t:`list`,items:["`@submit.prevent` empêche le rechargement de page du formulaire HTML.","`{ ...form }` envoie une **copie** simple de l’objet réactif.","Le statut HTTP (`e.status`) permet de distinguer une erreur de saisie (400) d’une panne (500)."]},{t:`sql`,text:"Le serveur te renvoie une erreur métier comme un `RAISE_APPLICATION_ERROR(-20001, 'Dates invalides')` : le front l'affiche tel quel à l'utilisateur."}],exercise:{kind:`build`,task:'Termine `envoyer()` : bloque le **double envoi** (bouton désactivé pendant l\'envoi), affiche l\'**erreur du serveur** (`data-test="erreur"`, ex. « Dates invalides »), et en cas de succès affiche « Demande envoyée » (`data-test="succes"`) puis vide les dates.',open:`App.vue`,files:{"App.vue":`<script setup>
import { saveAbsence } from '@/lib/api'

const form = reactive({ salarieId: 1, type: 'Congés payés', debut: '', fin: '' })
const envoi = ref(false)
const erreur = ref(null)
const succes = ref(false)

async function envoyer() {
  // à compléter
  await saveAbsence({ ...form })
}
<\/script>

<template>
  <form class="form" @submit.prevent="envoyer">
    <select v-model="form.type"><option>Congés payés</option><option>RTT</option></select>
    <label>Du <input data-test="debut" type="date" v-model="form.debut"></label>
    <label>Au <input data-test="fin" type="date" v-model="form.fin"></label>
    <button data-test="envoyer" :disabled="envoi">{{ envoi ? 'Envoi…' : 'Envoyer' }}</button>
    <p v-if="erreur" data-test="erreur" class="erreur">{{ erreur }}</p>
    <p v-if="succes" data-test="succes" class="succes">Demande envoyée</p>
  </form>
</template>

<style>
.form { display: grid; gap: 8px; max-width: 300px; font-family: system-ui; }
.erreur { color: #b91c1c; } .succes { color: #15803d; font-weight: 700; }
</style>`},solution:{"App.vue":`<script setup>
import { saveAbsence } from '@/lib/api'

const form = reactive({ salarieId: 1, type: 'Congés payés', debut: '', fin: '' })
const envoi = ref(false)
const erreur = ref(null)
const succes = ref(false)

async function envoyer() {
  if (envoi.value) return
  envoi.value = true
  erreur.value = null
  succes.value = false
  try {
    await saveAbsence({ ...form })
    succes.value = true
    form.debut = ''
    form.fin = ''
  } catch (e) {
    erreur.value = e.message
  } finally {
    envoi.value = false
  }
}
<\/script>

<template>
  <form class="form" @submit.prevent="envoyer">
    <select v-model="form.type"><option>Congés payés</option><option>RTT</option></select>
    <label>Du <input data-test="debut" type="date" v-model="form.debut"></label>
    <label>Au <input data-test="fin" type="date" v-model="form.fin"></label>
    <button data-test="envoyer" :disabled="envoi">{{ envoi ? 'Envoi…' : 'Envoyer' }}</button>
    <p v-if="erreur" data-test="erreur" class="erreur">{{ erreur }}</p>
    <p v-if="succes" data-test="succes" class="succes">Demande envoyée</p>
  </form>
</template>

<style>
.form { display: grid; gap: 8px; max-width: 300px; font-family: system-ui; }
.erreur { color: #b91c1c; } .succes { color: #15803d; font-weight: 700; }
</style>`},tests:[{name:`Dates invalides : message du serveur`,run:async e=>{await e.input(`[data-test=debut]`,`2026-11-10`),await e.input(`[data-test=fin]`,`2026-11-02`),await e.click(`[data-test=envoyer]`),await e.until(()=>e.exists(`[data-test=erreur]`),`le message d’erreur`),$(e.text(`[data-test=erreur]`)).toBe(`Dates invalides`)}},{name:`Succès : message et dates vidées`,run:async e=>{await e.input(`[data-test=debut]`,`2026-11-02`),await e.input(`[data-test=fin]`,`2026-11-06`),await e.click(`[data-test=envoyer]`),await e.until(()=>e.exists(`[data-test=succes]`),`le message de succès`),$(e.get(`[data-test=debut]`).value,`Date de début après envoi`).toBe(``),$(e.api.absences.length,`Absences enregistrées`).toBe(1)}},{name:`Pas de double envoi`,run:async e=>{e.api.delay=100,await e.input(`[data-test=debut]`,`2026-11-02`),await e.input(`[data-test=fin]`,`2026-11-03`);let t=e.get(`[data-test=envoyer]`);t.click(),await e.flush(),t.click(),t.click(),await e.wait(200),$(e.api.calls.saveAbsence??0,`Appels au serveur pour 3 clics rapides`).toBe(1)}},{name:`Une nouvelle tentative efface l’ancienne erreur`,run:async e=>{await e.input(`[data-test=debut]`,`2026-11-10`),await e.input(`[data-test=fin]`,`2026-11-02`),await e.click(`[data-test=envoyer]`),await e.until(()=>e.exists(`[data-test=erreur]`),`erreur`),await e.input(`[data-test=fin]`,`2026-11-12`),await e.click(`[data-test=envoyer]`),await e.until(()=>e.exists(`[data-test=succes]`),`succès`),$(e.exists(`[data-test=erreur]`),`Ancienne erreur encore affichée`).toBeFalsy()}}],hints:["Commence par `if (envoi.value) return` puis `envoi.value = true`.","Mets l’appel dans `try`, l’erreur dans `catch (e) { erreur.value = e.message }`, et `envoi.value = false` dans `finally`.","Après succès : `succes.value = true`, `form.debut = ''`, `form.fin = ''`. Pense à remettre `erreur.value = null` au début."]},cards:[{id:`4-3a`,q:"À quoi sert `@submit.prevent` ?",choices:[`À valider le formulaire`,`À empêcher le rechargement de la page par le navigateur`,`À envoyer en JSON`,`À désactiver le bouton`],answer:1,explain:"Un `<form>` HTML recharge la page à l’envoi ; `.prevent` appelle `event.preventDefault()`."},{id:`4-3b`,q:`Meilleure protection contre le double clic ?`,choices:[`Un setTimeout`,"Un booléen `envoi` qui désactive le bouton et sort de la fonction",`Rien`,`Recharger après l’envoi`],answer:1,explain:'Bouton `:disabled="envoi"` + `if (envoi.value) return` au début.'},{id:`4-3c`,q:"Pourquoi envoyer `{ ...form }` plutôt que `form` ?",choices:[`C’est plus rapide`,`Pour envoyer une copie simple, détachée de l’objet réactif`,`C’est obligatoire en Vue`,`Pour trier les champs`],answer:1,explain:`On évite de transmettre (et de voir modifié) le proxy réactif lui-même.`}]}]},ll=`<script setup>
// Composant FOURNI : affiche un formulaire à partir d'une liste de champs.
// champ = { name, label, type: 'text'|'date'|'select'|'checkbox', options?, required?, hidden?, disabled? }
const props = defineProps({
  champs: { type: Array, required: true },
  modelValue: { type: Object, required: true },
})
const emit = defineEmits(['update:modelValue'])

function maj(name, valeur) {
  emit('update:modelValue', { ...props.modelValue, [name]: valeur })
}
<\/script>

<template>
  <div class="auto">
    <template v-for="c in champs" :key="c.name">
      <div v-if="!c.hidden" class="champ" :data-field="c.name">
        <label>{{ c.label }}<span v-if="c.required" class="req" data-test="requis"> *</span></label>
        <select v-if="c.type === 'select'" :value="modelValue[c.name]" :disabled="c.disabled" @change="maj(c.name, $event.target.value)">
          <option v-for="o in c.options" :key="o">{{ o }}</option>
        </select>
        <input v-else-if="c.type === 'checkbox'" type="checkbox" :checked="modelValue[c.name]" :disabled="c.disabled" @change="maj(c.name, $event.target.checked)">
        <input v-else :type="c.type" :value="modelValue[c.name]" :disabled="c.disabled" @input="maj(c.name, $event.target.value)">
      </div>
    </template>
  </div>
</template>

<style>
.auto { display: grid; gap: 10px; max-width: 340px; font-family: system-ui; }
.champ { display: grid; gap: 4px; }
.champ label { font-size: 13px; font-weight: 600; color: #475569; }
.req { color: #dc2626; }
.champ input, .champ select { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 8px; }
.champ input:disabled { background: #f1f5f9; }
</style>`,ul=`<script setup>
// Composant FOURNI : tableau piloté par une liste de colonnes { field, header }.
defineProps({ colonnes: Array, lignes: Array })
<\/script>

<template>
  <table class="t">
    <thead><tr><th v-for="c in colonnes" :key="c.field" data-test="entete">{{ c.header }}</th></tr></thead>
    <tbody>
      <tr v-for="row in lignes" :key="row.id" data-test="ligne">
        <td v-for="c in colonnes" :key="c.field" :data-test="'cell-' + c.field">
          <slot :name="'cell-' + c.field" :row="row">{{ row[c.field] }}</slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style>
.t { border-collapse: collapse; width: 100%; font-family: system-ui; font-size: 14px; }
.t th, .t td { text-align: left; padding: 7px; border-bottom: 1px solid #eee; }
</style>`,dl=e=>e.findAll(`[data-field]`).map(e=>e.dataset.field),fl={id:5,title:`Interface déclarative`,icon:`pi pi-sliders-h`,color:`#ec4899`,summary:`Décrire formulaires et tableaux avec des objets de config calculés.`,lessons:[{id:`5-1`,title:`Formulaire piloté par une config`,minutes:16,goal:`Calculer hidden / required / disabled selon les données saisies.`,blocks:[{t:`p`,text:"Plutôt que d'écrire chaque champ dans le template avec des `v-if`, on **décrit** le formulaire : une liste d'objets (nom, libellé, type, règles). Un composant générique l'affiche. La liste est un **`computed`** : quand les données changent, les règles se recalculent."},{t:`code`,lang:`js`,code:`const form = ref({ type: 'Congés payés', debut: '', fin: '', demiJournee: false, justificatif: '' })

const champs = computed(() => {
  const base = [
    { name: 'type', label: 'Type', type: 'select', options: TYPES, required: true },
    { name: 'debut', label: 'Du', type: 'date', required: true },
    { name: 'fin', label: 'Au', type: 'date', required: true, disabled: form.value.demiJournee },
    { name: 'demiJournee', label: 'Demi-journée', type: 'checkbox' },
  ]
  if (form.value.type === 'Maladie') {
    base.push({ name: 'justificatif', label: 'N° d’arrêt', type: 'text', required: true })
  }
  return base
})`},{t:`list`,items:["**Ajouter conditionnellement** : `const base = [...]` puis `if (...) base.push(...)`.","**Masquer** un champ toujours présent dans la liste : `hidden: condition`.","`required` / `disabled` sont de simples booléens **calculés** à partir de `form`."]},{t:`sql`,text:"C'est l'équivalent d'un formulaire décrit par une **table de paramétrage** (une ligne par champ, des colonnes visible/obligatoire/modifiable) lue avec un `CASE WHEN`."},{t:`tip`,text:`Avantage : les règles métier sont au même endroit, lisibles comme une liste, et faciles à tester.`}],exercise:{kind:`build`,task:"Complète le `computed` **`champs`** : 1) le champ **N° d'arrêt** (`justificatif`) n'existe que si le type est **Maladie** (et il est obligatoire) ; 2) **Au** (`fin`) est **désactivé** quand **Demi-journée** est cochée ; 3) le **Commentaire** est **obligatoire** quand le type est **Autre**.",open:`App.vue`,readonly:[`components/FormulaireAuto.vue`],files:{"components/FormulaireAuto.vue":ll,"App.vue":`<script setup>
import FormulaireAuto from './components/FormulaireAuto.vue'

const TYPES = ['Congés payés', 'RTT', 'Maladie', 'Autre']
const form = ref({ type: 'Congés payés', debut: '', fin: '', demiJournee: false, justificatif: '', commentaire: '' })

const champs = computed(() => {
  const base = [
    { name: 'type', label: 'Type', type: 'select', options: TYPES, required: true },
    { name: 'debut', label: 'Du', type: 'date', required: true },
    { name: 'fin', label: 'Au', type: 'date', required: true },
    { name: 'demiJournee', label: 'Demi-journée', type: 'checkbox' },
  ]
  // à compléter : justificatif si Maladie

  base.push({ name: 'commentaire', label: 'Commentaire', type: 'text' })
  return base
})
<\/script>

<template>
  <FormulaireAuto v-model="form" :champs="champs" />
</template>`},solution:{"App.vue":`<script setup>
import FormulaireAuto from './components/FormulaireAuto.vue'

const TYPES = ['Congés payés', 'RTT', 'Maladie', 'Autre']
const form = ref({ type: 'Congés payés', debut: '', fin: '', demiJournee: false, justificatif: '', commentaire: '' })

const champs = computed(() => {
  const base = [
    { name: 'type', label: 'Type', type: 'select', options: TYPES, required: true },
    { name: 'debut', label: 'Du', type: 'date', required: true },
    { name: 'fin', label: 'Au', type: 'date', required: true, disabled: form.value.demiJournee },
    { name: 'demiJournee', label: 'Demi-journée', type: 'checkbox' },
  ]
  if (form.value.type === 'Maladie') {
    base.push({ name: 'justificatif', label: 'N° d’arrêt', type: 'text', required: true })
  }
  base.push({ name: 'commentaire', label: 'Commentaire', type: 'text', required: form.value.type === 'Autre' })
  return base
})
<\/script>

<template>
  <FormulaireAuto v-model="form" :champs="champs" />
</template>`},tests:[{name:`Champs de départ`,run:e=>$(dl(e),`Champs affichés`).toEqual([`type`,`debut`,`fin`,`demiJournee`,`commentaire`])},{name:`Maladie : le N° d’arrêt apparaît, obligatoire`,run:async e=>{await e.select(`[data-field=type] select`,`Maladie`),$(dl(e),`Champs pour Maladie`).toEqual([`type`,`debut`,`fin`,`demiJournee`,`justificatif`,`commentaire`]),$(e.exists(`[data-field=justificatif] [data-test=requis]`),`Astérisque sur N° d’arrêt`).toBeTruthy(),await e.select(`[data-field=type] select`,`RTT`),$(e.exists(`[data-field=justificatif]`),`N° d’arrêt pour RTT`).toBeFalsy()}},{name:`Demi-journée désactive « Au »`,run:async e=>{$(e.get(`[data-field=fin] input`).disabled,`« Au » au départ`).toBe(!1),await e.check(`[data-field=demiJournee] input`),$(e.get(`[data-field=fin] input`).disabled,`« Au » avec demi-journée`).toBe(!0)}},{name:`Commentaire obligatoire pour « Autre »`,run:async e=>{$(e.exists(`[data-field=commentaire] [data-test=requis]`),`Astérisque commentaire (Congés payés)`).toBeFalsy(),await e.select(`[data-field=type] select`,`Autre`),$(e.exists(`[data-field=commentaire] [data-test=requis]`),`Astérisque commentaire (Autre)`).toBeTruthy()}}],hints:["`if (form.value.type === 'Maladie') base.push({ name: 'justificatif', label: 'N° d’arrêt', type: 'text', required: true })`","Sur le champ fin : `disabled: form.value.demiJournee`.","Sur le commentaire : `required: form.value.type === 'Autre'`."]},cards:[{id:`5-1a`,q:"Pourquoi mettre la config des champs dans un `computed` ?",choices:[`Pour la performance uniquement`,`Pour que hidden/required/disabled se recalculent quand les données changent`,`Parce que c’est obligatoire`,`Pour la traduire`],answer:1,explain:"Les règles lisent `form` : le computed les réévalue automatiquement à chaque modification."},{id:`5-1b`,q:`Ajouter une colonne/un champ selon une condition :`,choices:["`base.splice()` dans le template","`const base = [...]; if (cond) base.push(...)`",`Un v-if dans la config`,`Un watch`],answer:1,explain:`Le motif classique : tableau de base puis ajouts conditionnels, dans le computed.`},{id:`5-1c`,q:"`hidden: true` vs ne pas ajouter le champ :",choices:[`Identiques dans tous les cas`,`hidden garde le champ dans la config (ordre, valeur) mais ne l’affiche pas`,`hidden supprime la valeur`,`hidden lève une erreur`],answer:1,explain:"Les deux masquent ; `hidden` est pratique quand le champ doit rester déclaré au même endroit."}]},{id:`5-2`,title:`Tableau piloté par des colonnes`,minutes:14,goal:`Construire une liste de colonnes conditionnelles et formater une cellule.`,blocks:[{t:`p`,text:"Même idée pour les listes : les **colonnes** sont un tableau d'objets `{ field, header }`, construit dans un `computed`, avec des colonnes ajoutées selon les droits, l'écran ou une option."},{t:`code`,lang:`js`,code:`const colonnes = computed(() => {
  const base = [
    { field: 'nom', header: 'Nom' },
    { field: 'service', header: 'Service' },
  ]
  if (session.peutVoirSalaires) base.push({ field: 'salaire', header: 'Salaire' })
  if (!mobile.value) base.push({ field: 'entree', header: 'Entrée' })
  return base
})`},{t:`code`,lang:`vue`,code:`<Tableau :colonnes="colonnes" :lignes="salaries">
  <template #cell-salaire="{ row }">{{ formatEuros(row.salaire) }}</template>
</Tableau>`},{t:`tip`,text:"Le formatage (montants, dates) se fait dans le slot de la cellule ou avec une fonction de `lib/` : la donnée reste brute, seul l'affichage change."}],exercise:{kind:`build`,task:"Construis le `computed` **`colonnes`** : toujours **Nom** et **Service** ; **Salaire** seulement si « Afficher les salaires » est coché ; **Date d'entrée** seulement si on n'est **pas** en vue compacte. Puis formate la cellule salaire avec `formatEuros(row.salaire)` (via `#cell-salaire`).",open:`App.vue`,readonly:[`components/Tableau.vue`,`lib/format.js`],files:{"components/Tableau.vue":ul,"lib/format.js":`export function formatEuros(n) {
  return String(Math.round(n)).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ' ') + ' €'
}`,"App.vue":`<script setup>
import Tableau from './components/Tableau.vue'
import { formatEuros } from '@/lib/format'

const salaries = [
  { id: 1, nom: 'Martin', service: 'Comptabilité', salaire: 2450, entree: '2019-03-04' },
  { id: 2, nom: 'Bernard', service: 'Informatique', salaire: 3180, entree: '2021-09-01' },
]
const voirSalaires = ref(false)
const compact = ref(false)

const colonnes = computed(() => {
  // à compléter
  return [
    { field: 'nom', header: 'Nom' },
    { field: 'service', header: 'Service' },
  ]
})
<\/script>

<template>
  <label><input type="checkbox" data-test="salaires" v-model="voirSalaires"> Afficher les salaires</label>
  <label><input type="checkbox" data-test="compact" v-model="compact"> Vue compacte</label>
  <Tableau :colonnes="colonnes" :lignes="salaries" />
</template>`},solution:{"App.vue":`<script setup>
import Tableau from './components/Tableau.vue'
import { formatEuros } from '@/lib/format'

const salaries = [
  { id: 1, nom: 'Martin', service: 'Comptabilité', salaire: 2450, entree: '2019-03-04' },
  { id: 2, nom: 'Bernard', service: 'Informatique', salaire: 3180, entree: '2021-09-01' },
]
const voirSalaires = ref(false)
const compact = ref(false)

const colonnes = computed(() => {
  const base = [
    { field: 'nom', header: 'Nom' },
    { field: 'service', header: 'Service' },
  ]
  if (voirSalaires.value) base.push({ field: 'salaire', header: 'Salaire' })
  if (!compact.value) base.push({ field: 'entree', header: "Date d'entrée" })
  return base
})
<\/script>

<template>
  <label><input type="checkbox" data-test="salaires" v-model="voirSalaires"> Afficher les salaires</label>
  <label><input type="checkbox" data-test="compact" v-model="compact"> Vue compacte</label>
  <Tableau :colonnes="colonnes" :lignes="salaries">
    <template #cell-salaire="{ row }">{{ formatEuros(row.salaire) }}</template>
  </Tableau>
</template>`},tests:[{name:`Colonnes par défaut`,run:e=>$(e.findAll(`[data-test=entete]`).map(e=>e.textContent?.trim()),`En-têtes`).toEqual([`Nom`,`Service`,`Date d'entrée`])},{name:`Salaire ajouté et formaté`,run:async e=>{await e.check(`[data-test=salaires]`),$(e.findAll(`[data-test=entete]`).map(e=>e.textContent?.trim())).toEqual([`Nom`,`Service`,`Salaire`,`Date d'entrée`]),$(e.findAll(`[data-test=cell-salaire]`).map(e=>e.textContent?.trim()),`Cellules salaire`).toEqual([`2 450 €`,`3 180 €`])}},{name:`Vue compacte : pas de date d’entrée`,run:async e=>{await e.check(`[data-test=compact]`),$(e.findAll(`[data-test=entete]`).map(e=>e.textContent?.trim())).toEqual([`Nom`,`Service`])}}],hints:["Commence par `const base = [ ...Nom, ...Service ]`.","`if (voirSalaires.value) base.push({ field: 'salaire', header: 'Salaire' })` et `if (!compact.value) base.push({ field: 'entree', header: \"Date d'entrée\" })`, puis `return base`.",'Dans `<Tableau>` : `<template #cell-salaire="{ row }">{{ formatEuros(row.salaire) }}</template>`.']},cards:[{id:`5-2a`,q:`Où mettre la condition « colonne Salaire seulement si autorisé » ?`,choices:[`Dans le composant Tableau`,"Dans le computed `colonnes` (base.push conditionnel)",`Dans le CSS`,`Dans un watch`],answer:1,explain:`La config est calculée par la page ; le tableau générique ne connaît pas les règles métier.`},{id:`5-2b`,q:`Comment formater une seule colonne d’un tableau générique ?`,choices:[`Modifier les données`,'Un slot de cellule `#cell-champ="{ row }"`',`Un filtre global`,`Une nouvelle colonne`],answer:1,explain:`La donnée reste brute ; le slot de la cellule décide de l’affichage.`},{id:`5-2c`,q:"Dans un computed, `if (voirSalaires) base.push(...)` (sans .value) sur une ref…",choices:[`Fonctionne`,"Est toujours vrai (une ref est un objet) : il faut `.value`",`Lève une erreur`,`Est toujours faux`],answer:1,explain:"Dans le script, une ref est un objet (toujours « vrai ») : la valeur est dans `.value`."}]}]},pl={id:6,title:`Pinia : l’état global`,icon:`pi pi-database`,color:`#eab308`,summary:`Partager la session et les paramètres entre toutes les pages.`,lessons:[{id:`6-1`,title:`Un store de session`,minutes:14,goal:`Créer un store (state, getters, actions) et l’utiliser dans plusieurs composants.`,blocks:[{t:`p`,text:`Quand plusieurs pages ont besoin de la **même donnée** (utilisateur connecté, paramètres, droits), on la met dans un **store Pinia** plutôt que de la passer de props en props.`},{t:`code`,lang:`js`,title:`stores/session.js (syntaxe « setup »)`,code:`export const useSessionStore = defineStore('session', () => {
  // state
  const utilisateur = ref(null)
  // getters
  const estConnecte = computed(() => utilisateur.value !== null)
  const estGestionnaire = computed(() => utilisateur.value?.role === 'gestionnaire')
  // actions
  function connecter(nom, role) { utilisateur.value = { nom, role } }
  function deconnecter() { utilisateur.value = null }

  return { utilisateur, estConnecte, estGestionnaire, connecter, deconnecter }
})`},{t:`code`,lang:`vue`,title:`Dans n’importe quel composant`,code:`<script setup>
import { useSessionStore } from '@/stores/session'
const session = useSessionStore()
<\/script>

<template>
  <p v-if="session.estConnecte">Bonjour {{ session.utilisateur.nom }}</p>
  <button @click="session.deconnecter()">Déconnexion</button>
</template>`},{t:`list`,items:[`Un store = **une seule instance** partagée : tous les composants voient la même valeur.`,"Dans le template et le script, pas de `.value` sur `session.utilisateur` : le store déballe les refs.","Le nom (`'session'`) doit être unique dans l’application."]},{t:`sql`,text:`Un store ressemble à une **variable de package PL/SQL** : déclarée une fois, visible et partagée par toutes les procédures de la session, avec des fonctions (getters) et procédures (actions) pour la lire et la modifier.`}],exercise:{kind:`build`,task:"Complète `stores/session.js` : un getter **`estConnecte`**, un getter **`estGestionnaire`** (rôle « gestionnaire »), et les actions **`connecter(nom, role)`** / **`deconnecter()`**. L'en-tête et la page utilisent déjà le store.",open:`stores/session.js`,readonly:[`App.vue`,`components/EnTete.vue`],files:{"stores/session.js":`export const useSessionStore = defineStore('session', () => {
  const utilisateur = ref(null)

  // à compléter : estConnecte, estGestionnaire, connecter, deconnecter

  return { utilisateur }
})`,"components/EnTete.vue":`<script setup>
import { useSessionStore } from '@/stores/session'
const session = useSessionStore()
<\/script>

<template>
  <header class="entete">
    <span v-if="session.estConnecte" data-test="bonjour">Bonjour {{ session.utilisateur.nom }}</span>
    <span v-else data-test="invite">Non connecté</span>
    <button v-if="session.estConnecte" data-test="deconnexion" @click="session.deconnecter()">Déconnexion</button>
  </header>
</template>

<style>
.entete { display: flex; justify-content: space-between; padding: 10px; background: #f1f5f9; border-radius: 10px; font-family: system-ui; }
</style>`,"App.vue":`<script setup>
import EnTete from './components/EnTete.vue'
import { useSessionStore } from '@/stores/session'
const session = useSessionStore()
<\/script>

<template>
  <EnTete />
  <main style="font-family: system-ui; padding: 10px">
    <div v-if="!session.estConnecte">
      <button data-test="connexion-salarie" @click="session.connecter('Léa', 'salarie')">Se connecter (salariée)</button>
      <button data-test="connexion-gestionnaire" @click="session.connecter('Lucas', 'gestionnaire')">Se connecter (gestionnaire)</button>
    </div>
    <p v-if="session.estGestionnaire" data-test="validation">Demandes à valider : 3</p>
  </main>
</template>`},solution:{"stores/session.js":`export const useSessionStore = defineStore('session', () => {
  const utilisateur = ref(null)

  const estConnecte = computed(() => utilisateur.value !== null)
  const estGestionnaire = computed(() => utilisateur.value?.role === 'gestionnaire')

  function connecter(nom, role) {
    utilisateur.value = { nom, role }
  }
  function deconnecter() {
    utilisateur.value = null
  }

  return { utilisateur, estConnecte, estGestionnaire, connecter, deconnecter }
})`},tests:[{name:`Non connecté au départ`,run:e=>{$(e.exists(`[data-test=invite]`),`« Non connecté »`).toBeTruthy(),$(e.exists(`[data-test=connexion-salarie]`),`Boutons de connexion`).toBeTruthy()}},{name:`Connexion : l’en-tête (autre composant) le voit`,run:async e=>{await e.click(`[data-test=connexion-salarie]`),$(e.text(`[data-test=bonjour]`),`En-tête`).toBe(`Bonjour Léa`),$(e.exists(`[data-test=validation]`),`Bloc gestionnaire pour une salariée`).toBeFalsy()}},{name:`Gestionnaire : voit les validations`,run:async e=>{await e.click(`[data-test=connexion-gestionnaire]`),$(e.exists(`[data-test=validation]`),`Bloc « Demandes à valider »`).toBeTruthy()}},{name:`Déconnexion`,run:async e=>{await e.click(`[data-test=connexion-salarie]`),await e.click(`[data-test=deconnexion]`),$(e.exists(`[data-test=invite]`)).toBeTruthy()}}],hints:["`const estConnecte = computed(() => utilisateur.value !== null)`","`const estGestionnaire = computed(() => utilisateur.value?.role === 'gestionnaire')`","N’oublie pas de tout renvoyer : `return { utilisateur, estConnecte, estGestionnaire, connecter, deconnecter }`."]},cards:[{id:`6-1a`,q:"Dans un store « setup », à quoi correspond un `computed` ?",choices:[`Une action`,`Un getter`,`Le state`,`Un plugin`],answer:1,explain:`ref = state, computed = getter, function = action.`},{id:`6-1b`,q:"Deux composants appellent `useSessionStore()`. Ils obtiennent…",choices:[`Deux copies indépendantes`,`La même instance partagée`,`Une erreur`,`Une copie en lecture seule`],answer:1,explain:`Un store est un singleton par application : la donnée est partagée.`},{id:`6-1c`,q:`Un oubli fréquent dans un store setup ?`,choices:[`Mettre des computed`,"Oublier de retourner une valeur/fonction dans le `return`",`Utiliser ref`,`Donner un nom`],answer:1,explain:`Ce qui n’est pas retourné n’est pas accessible (et pas suivi par Pinia/devtools).`}]},{id:`6-2`,title:`Piège : storeToRefs`,minutes:10,goal:`Déstructurer un store sans perdre la réactivité.`,blocks:[{t:`p`,text:"Même piège qu'avec `reactive` : **déstructurer un store** copie les valeurs du moment. Pour garder le lien sur le state et les getters, on utilise **`storeToRefs`**. Les **actions**, elles, se déstructurent directement."},{t:`code`,lang:`js`,code:`const session = useSessionStore()

const { utilisateur } = session                 // ❌ figé
const { utilisateur, estConnecte } = storeToRefs(session)  // ✅ refs liées
const { connecter } = session                   // ✅ les fonctions, directement`},{t:`warn`,text:"Avec `storeToRefs`, on récupère des **refs** : dans le script il faut à nouveau `.value` (`utilisateur.value.nom`), dans le template non."}],exercise:{kind:`bug`,task:"**Trouve le bug.** Le compteur du panier de validation ne bouge pas quand on ajoute une demande, alors que le store est bien mis à jour (le total en bas, qui lit le store directement, change). Corrige `Compteur.vue`.",open:`components/Compteur.vue`,readonly:[`App.vue`,`stores/validation.js`],files:{"stores/validation.js":`export const useValidationStore = defineStore('validation', () => {
  const demandes = ref([])
  const nombre = computed(() => demandes.value.length)
  function ajouter(d) { demandes.value.push(d) }
  return { demandes, nombre, ajouter }
})`,"components/Compteur.vue":`<script setup>
import { useValidationStore } from '@/stores/validation'

const store = useValidationStore()
const { nombre, ajouter } = store
<\/script>

<template>
  <div class="compteur">
    <span data-test="badge">{{ nombre }}</span> demande(s) sélectionnée(s)
    <button data-test="ajouter" @click="ajouter({ id: Date.now() })">Ajouter</button>
  </div>
</template>`,"App.vue":`<script setup>
import Compteur from './components/Compteur.vue'
import { useValidationStore } from '@/stores/validation'
const store = useValidationStore()
<\/script>

<template>
  <Compteur />
  <p data-test="total">Total (lu directement dans le store) : {{ store.nombre }}</p>
</template>`},solution:{"components/Compteur.vue":`<script setup>
import { useValidationStore } from '@/stores/validation'

const store = useValidationStore()
const { nombre } = storeToRefs(store)
const { ajouter } = store
<\/script>

<template>
  <div class="compteur">
    <span data-test="badge">{{ nombre }}</span> demande(s) sélectionnée(s)
    <button data-test="ajouter" @click="ajouter({ id: Date.now() })">Ajouter</button>
  </div>
</template>`},tests:[{name:`Le badge suit le store`,run:async e=>{await e.click(`[data-test=ajouter]`),await e.click(`[data-test=ajouter]`),$(e.text(`[data-test=total]`),`Total lu dans le store`).toContain(`2`),$(e.text(`[data-test=badge]`),`Badge du composant Compteur`).toBe(`2`)}}],hints:["`const { nombre } = store` copie la valeur 0 une fois pour toutes.","`const { nombre } = storeToRefs(store)` et garde `const { ajouter } = store` pour l’action."]},cards:[{id:`6-2a`,q:`Comment déstructurer le state d’un store en gardant la réactivité ?`,choices:["`const { x } = store`","`const { x } = storeToRefs(store)`","`const { x } = toRaw(store)`",`Impossible`],answer:1,explain:"`storeToRefs` renvoie des refs liées au store (state et getters)."},{id:`6-2b`,q:`Et les actions du store ?`,choices:[`Aussi via storeToRefs`,`Déstructurées directement depuis le store`,`Impossible à déstructurer`,`Via mapActions uniquement`],answer:1,explain:"`storeToRefs` ignore les fonctions : on les prend directement (`const { ajouter } = store`)."},{id:`6-2c`,q:"Après `const { nombre } = storeToRefs(store)`, dans le script on lit…",choices:["`nombre`","`nombre.value`","`store.nombre.value`","`nombre()`"],answer:1,explain:"Ce sont des refs : `.value` dans le script, rien dans le template."}]},{id:`6-3`,title:`Paramètres partagés et persistants`,minutes:14,goal:`Garder des paramètres entre les pages et après un rechargement.`,blocks:[{t:`p`,text:"Un store survit aux changements de page (il vit tant que l'application est ouverte). Pour qu'un paramètre survive aussi au **rechargement**, on le sauvegarde dans `localStorage` avec un `watch`."},{t:`code`,lang:`js`,code:`export const useParametresStore = defineStore('parametres', () => {
  const lu = JSON.parse(localStorage.getItem('parametres') || '{}')
  const service = ref(lu.service ?? 'Tous')
  const parPage = ref(lu.parPage ?? 10)

  watch([service, parPage], () => {
    localStorage.setItem('parametres', JSON.stringify({ service: service.value, parPage: parPage.value }))
  })

  return { service, parPage }
})`},{t:`tip`,text:'`v-model="parametres.service"` fonctionne directement sur un store (sans storeToRefs) : le store est réactif.'}],exercise:{kind:`build`,task:"1) Dans `stores/parametres.js`, initialise `service` depuis `localStorage` (clé **`parametres`**, défaut **« Tous »**) et sauvegarde-le à chaque changement. 2) Dans `pages/index.vue`, filtre la liste avec le service du store. Le choix fait sur `/parametres` doit être pris en compte sur `/`, même après rechargement.",open:`stores/parametres.js`,readonly:[`App.vue`,`pages/parametres.vue`],files:{"App.vue":`<template>
  <nav style="display:flex; gap:12px; font-family:system-ui">
    <router-link to="/" data-test="lien-liste">Liste</router-link>
    <router-link to="/parametres" data-test="lien-parametres">Paramètres</router-link>
  </nav>
  <router-view />
</template>`,"stores/parametres.js":`export const useParametresStore = defineStore('parametres', () => {
  const service = ref('Tous')
  // à compléter : lire localStorage au départ, sauvegarder à chaque changement
  return { service }
})`,"pages/parametres.vue":`<script setup>
import { useParametresStore } from '@/stores/parametres'
const parametres = useParametresStore()
<\/script>

<template>
  <h1>Paramètres</h1>
  <select data-test="service" v-model="parametres.service">
    <option>Tous</option><option>RH</option><option>Informatique</option><option>Comptabilité</option>
  </select>
</template>`,"pages/index.vue":`<script setup>
import { useParametresStore } from '@/stores/parametres'
const parametres = useParametresStore()

const salaries = [
  { id: 1, nom: 'Martin', service: 'Comptabilité' },
  { id: 2, nom: 'Bernard', service: 'Informatique' },
  { id: 3, nom: 'Petit', service: 'RH' },
  { id: 4, nom: 'Durand', service: 'Informatique' },
]
// à compléter : liste filtrée selon parametres.service
<\/script>

<template>
  <h1>Liste</h1>
  <ul><li v-for="s in salaries" :key="s.id" data-test="ligne">{{ s.nom }}</li></ul>
</template>`},solution:{"stores/parametres.js":`export const useParametresStore = defineStore('parametres', () => {
  const lu = JSON.parse(localStorage.getItem('parametres') || '{}')
  const service = ref(lu.service ?? 'Tous')

  watch(service, () => {
    localStorage.setItem('parametres', JSON.stringify({ service: service.value }))
  })

  return { service }
})`,"pages/index.vue":`<script setup>
import { useParametresStore } from '@/stores/parametres'
const parametres = useParametresStore()

const salaries = [
  { id: 1, nom: 'Martin', service: 'Comptabilité' },
  { id: 2, nom: 'Bernard', service: 'Informatique' },
  { id: 3, nom: 'Petit', service: 'RH' },
  { id: 4, nom: 'Durand', service: 'Informatique' },
]
const visibles = computed(() => parametres.service === 'Tous' ? salaries : salaries.filter(s => s.service === parametres.service))
<\/script>

<template>
  <h1>Liste</h1>
  <ul><li v-for="s in visibles" :key="s.id" data-test="ligne">{{ s.nom }}</li></ul>
</template>`},tests:[{name:`Le choix sur /parametres filtre la liste`,run:async e=>{localStorage.removeItem(`parametres`),await e.go(`/parametres`),await e.select(`[data-test=service]`,`Informatique`),await e.go(`/`),$(e.findAll(`[data-test=ligne]`).map(e=>e.textContent),`Liste après choix « Informatique »`).toEqual([`Bernard`,`Durand`])}},{name:`Sauvegardé dans localStorage`,run:async e=>{localStorage.removeItem(`parametres`),await e.go(`/parametres`),await e.select(`[data-test=service]`,`RH`),await e.wait(10),$(JSON.parse(localStorage.getItem(`parametres`)||`{}`).service,`localStorage « parametres ».service`).toBe(`RH`)}}],hints:["`const lu = JSON.parse(localStorage.getItem('parametres') || '{}')` puis `ref(lu.service ?? 'Tous')`.","`watch(service, () => localStorage.setItem('parametres', JSON.stringify({ service: service.value })))`","Dans la page : `const visibles = computed(() => parametres.service === 'Tous' ? salaries : salaries.filter(s => s.service === parametres.service))` et `v-for` sur `visibles`."]},cards:[{id:`6-3a`,q:`Un store Pinia survit-il à un rechargement de page (F5) ?`,choices:[`Oui, toujours`,`Non : il faut le sauvegarder (localStorage, serveur…)`,`Oui avec storeToRefs`,`Seulement en production`],answer:1,explain:`Le store vit en mémoire : il est recréé au rechargement. On persiste ce qui doit survivre.`},{id:`6-3b`,q:'`v-model="store.service"` fonctionne-t-il ?',choices:[`Non`,`Oui, le store est réactif`,`Seulement avec storeToRefs`,`Seulement pour les getters`],answer:1,explain:`On peut lier directement une propriété de state du store.`},{id:`6-3c`,q:`Le meilleur endroit pour sauvegarder un paramètre à chaque changement ?`,choices:[`Un watch dans le store`,`Un onMounted`,`Le template`,`Un computed`],answer:0,explain:"Un `watch` sur le state, dans le store lui-même : la règle est centralisée."}]}]},ml=e=>window.dispatchEvent(new KeyboardEvent(`keydown`,{key:e})),hl={id:7,title:`Cycle de vie et UI`,icon:`pi pi-sync`,color:`#14b8a6`,summary:`Monter, nettoyer, interroger le serveur à intervalles, notifier.`,lessons:[{id:`7-1`,title:`onMounted / onBeforeUnmount`,minutes:12,goal:`Ajouter un écouteur global au montage et le retirer en quittant la page.`,blocks:[{t:`p`,text:"Un composant naît (**montage**), vit, puis disparaît (**démontage**, par exemple quand on change de page). Tout ce qu'on branche **en dehors** du composant (écouteur sur `window`, minuteur, abonnement) doit être **débranché** au démontage, sinon ça continue à tourner : c'est une **fuite**."},{t:`code`,lang:`js`,code:`function surTouche(e) {
  if (e.key === 'Escape') fermer()
}

onMounted(() => window.addEventListener('keydown', surTouche))
onBeforeUnmount(() => window.removeEventListener('keydown', surTouche))`},{t:`list`,items:["`onMounted` : le DOM existe, on peut charger, mesurer, s’abonner.","`onBeforeUnmount` : dernier moment pour nettoyer (le DOM existe encore).","Il faut passer **la même fonction** à `addEventListener` et `removeEventListener` (pas une fonction fléchée recréée)."]},{t:`sql`,text:"C'est le principe `OPEN … CLOSE` d'un curseur : ce que tu ouvres, tu le fermes, même si tu sors plus tôt."}],exercise:{kind:`bug`,task:"**Trouve le bug.** Sur `/editeur`, la touche **s** déclenche une sauvegarde. Mais après être revenu à l'accueil, la touche **s** sauvegarde encore (et ça s'accumule à chaque visite). Corrige la page pour retirer l'écouteur en la quittant.",open:`pages/editeur.vue`,readonly:[`App.vue`,`pages/index.vue`],files:{"App.vue":`<template>
  <nav style="display:flex; gap:12px; font-family:system-ui">
    <router-link to="/">Accueil</router-link>
    <router-link to="/editeur">Éditeur</router-link>
  </nav>
  <router-view />
</template>`,"pages/index.vue":`<template><h1>Accueil</h1></template>`,"pages/editeur.vue":`<script setup>
window.sauvegardes = window.sauvegardes ?? 0
const derniere = ref(null)

function sauvegarder() {
  window.sauvegardes++
  derniere.value = new Date().toLocaleTimeString('fr-FR')
}

onMounted(() => {
  window.addEventListener('keydown', e => {
    if (e.key === 's') sauvegarder()
  })
})
<\/script>

<template>
  <h1>Éditeur</h1>
  <p>Appuie sur « s » pour sauvegarder.</p>
  <p v-if="derniere" data-test="derniere">Sauvegardé à {{ derniere }}</p>
</template>`},solution:{"pages/editeur.vue":`<script setup>
window.sauvegardes = window.sauvegardes ?? 0
const derniere = ref(null)

function sauvegarder() {
  window.sauvegardes++
  derniere.value = new Date().toLocaleTimeString('fr-FR')
}

function surTouche(e) {
  if (e.key === 's') sauvegarder()
}

onMounted(() => window.addEventListener('keydown', surTouche))
onBeforeUnmount(() => window.removeEventListener('keydown', surTouche))
<\/script>

<template>
  <h1>Éditeur</h1>
  <p>Appuie sur « s » pour sauvegarder.</p>
  <p v-if="derniere" data-test="derniere">Sauvegardé à {{ derniere }}</p>
</template>`},tests:[{name:`La touche s sauvegarde sur l’éditeur`,run:async e=>{window.sauvegardes=0,await e.go(`/editeur`),ml(`s`),await e.flush(),$(window.sauvegardes,`Sauvegardes`).toBe(1),$(e.exists(`[data-test=derniere]`)).toBeTruthy()}},{name:`Plus de sauvegarde après avoir quitté la page`,run:async e=>{let t=window;t.sauvegardes=0,await e.go(`/editeur`),await e.go(`/`),await e.go(`/editeur`),await e.go(`/`),ml(`s`),await e.flush(),$(t.sauvegardes,`Sauvegardes déclenchées depuis l’accueil`).toBe(0)}}],hints:["Une fonction fléchée créée dans `addEventListener` ne peut pas être retirée : donne-lui un nom (`function surTouche(e) {…}`).","`onMounted(() => window.addEventListener('keydown', surTouche))` et `onBeforeUnmount(() => window.removeEventListener('keydown', surTouche))`."]},cards:[{id:`7-1a`,q:"Que se passe-t-il si on n’enlève pas un écouteur `window` en quittant la page ?",choices:[`Rien`,`Il continue de s’exécuter (fuite), et s’accumule à chaque visite`,`Vue l’enlève tout seul`,`La page plante`],answer:1,explain:"Vue ne connaît pas ce que tu branches sur `window` : à toi de nettoyer dans `onBeforeUnmount`."},{id:`7-1b`,q:'Pourquoi `removeEventListener("keydown", e => …)` ne retire rien ?',choices:[`Mauvais nom d’événement`,`C’est une nouvelle fonction, différente de celle ajoutée`,`Il faut useCapture`,`Ça marche`],answer:1,explain:`Il faut la même référence de fonction : déclare-la avec un nom et réutilise-la.`},{id:`7-1c`,q:`Quand le DOM du composant est-il disponible ?`,choices:[`Dans le setup directement`,`À partir de onMounted`,`Dans onBeforeMount`,`Jamais`],answer:1,explain:"`onMounted` s’exécute après l’insertion du composant dans la page."}]},{id:`7-2`,title:`Polling avec nettoyage`,minutes:15,goal:`Interroger le serveur jusqu’à la fin d’un traitement, et arrêter en quittant.`,blocks:[{t:`p`,text:"Pour un traitement long (export, calcul de paie…), on **interroge le serveur** régulièrement jusqu'à ce qu'il réponde « terminé ». Avec `setTimeout` en chaîne, on ne relance la question **qu'après** la réponse précédente."},{t:`code`,lang:`js`,code:`let minuteur = null
let actif = true

async function verifier() {
  const r = await fetchStatutExport()
  if (!actif) return                        // page quittée pendant la requête
  statut.value = r.statut
  if (r.statut === 'en_cours') {
    minuteur = setTimeout(verifier, 2000)   // on réessaie plus tard
  } else {
    fichier.value = r.fichier
  }
}

onMounted(verifier)
onBeforeUnmount(() => {
  actif = false
  clearTimeout(minuteur)                    // on arrête en quittant la page
})`},{t:`warn`,text:"Le piège : si on quitte la page **pendant** une requête, `clearTimeout` ne suffit pas, car la réponse arrive après et relance un nouveau minuteur. D'où le drapeau `actif`, vérifié après chaque `await`."},{t:`tip`,text:"`setTimeout` en chaîne plutôt que `setInterval` : si le serveur est lent, les appels ne s'empilent pas."},{t:`sql`,text:"C'est une boucle `LOOP … EXIT WHEN statut = 'TERMINE'; DBMS_SESSION.SLEEP(2); END LOOP;`, mais **non bloquante** : l'écran reste utilisable pendant l'attente."}],exercise:{kind:`build`,task:"Écris le polling de `pages/export.vue` : appelle `fetchStatutExport()`, et tant que le statut est `en_cours`, réessaie après **`INTERVALLE`** ms. Quand c'est `termine`, affiche le nom du fichier et **arrête**. Si on quitte la page, le polling doit **s'arrêter**, même si une requête était en cours.",open:`pages/export.vue`,readonly:[`App.vue`,`pages/index.vue`],files:{"App.vue":`<template><router-view /></template>`,"pages/index.vue":`<template><router-link to="/export">Lancer l'export</router-link></template>`,"pages/export.vue":`<script setup>
import { fetchStatutExport } from '@/lib/api'

const INTERVALLE = 60
const statut = ref('en_cours')
const fichier = ref(null)

// à compléter : verifier(), lancement au montage, arrêt en quittant
<\/script>

<template>
  <div style="font-family: system-ui">
    <p v-if="statut === 'en_cours'" data-test="en-cours"><ProgressSpinner style="width:20px;height:20px" /> Export en cours…</p>
    <p v-else data-test="termine">Export prêt : <strong>{{ fichier }}</strong></p>
  </div>
</template>`},solution:{"pages/export.vue":`<script setup>
import { fetchStatutExport } from '@/lib/api'

const INTERVALLE = 60
const statut = ref('en_cours')
const fichier = ref(null)
let minuteur = null
let actif = true

async function verifier() {
  const r = await fetchStatutExport()
  if (!actif) return
  statut.value = r.statut
  if (r.statut === 'en_cours') {
    minuteur = setTimeout(verifier, INTERVALLE)
  } else {
    fichier.value = r.fichier
  }
}

onMounted(verifier)
onBeforeUnmount(() => {
  actif = false
  clearTimeout(minuteur)
})
<\/script>

<template>
  <div style="font-family: system-ui">
    <p v-if="statut === 'en_cours'" data-test="en-cours"><ProgressSpinner style="width:20px;height:20px" /> Export en cours…</p>
    <p v-else data-test="termine">Export prêt : <strong>{{ fichier }}</strong></p>
  </div>
</template>`},tests:[{name:`Finit par afficher le fichier`,run:async e=>{await e.go(`/export`),await e.until(()=>e.exists(`[data-test=termine]`),`le message « Export prêt »`,2e3),$(e.text(`[data-test=termine]`)).toContain(`export-fictif.csv`)}},{name:`S’arrête une fois terminé`,run:async e=>{await e.go(`/export`),await e.until(()=>e.exists(`[data-test=termine]`),`fin de l’export`,2e3);let t=e.api.calls.fetchStatutExport??0;$(t,`Appels (3 « en cours » + 1 « terminé »)`).toBe(4),await e.wait(250),$(e.api.calls.fetchStatutExport,`Appels après la fin`).toBe(t)}},{name:`S’arrête quand on quitte la page`,run:async e=>{await e.go(`/export`),await e.until(()=>(e.api.calls.fetchStatutExport??0)>=1,`premier appel`),await e.go(`/`);let t=e.api.calls.fetchStatutExport??0;await e.wait(300),$(e.api.calls.fetchStatutExport??0,`Appels après avoir quitté la page`).toBe(t)}}],hints:["Déclare `let minuteur = null` et une fonction `async function verifier()` qui appelle `fetchStatutExport()`.","Si `r.statut === 'en_cours'` : `minuteur = setTimeout(verifier, INTERVALLE)`, sinon `fichier.value = r.fichier`.","`onMounted(verifier)` et `onBeforeUnmount(() => clearTimeout(minuteur))`.","Si tu quittes la page pendant une requête, la réponse relance un minuteur : ajoute `let actif = true`, mets-le à `false` dans `onBeforeUnmount`, et fais `if (!actif) return` juste après l'`await`."]},cards:[{id:`7-2a`,q:`Pourquoi un setTimeout en chaîne plutôt que setInterval pour le polling ?`,choices:[`C’est plus court`,`On ne relance qu’après la réponse : pas d’appels empilés si le serveur est lent`,`setInterval n’existe pas`,`Pour le SEO`],answer:1,explain:`setInterval tire même si la réponse précédente n’est pas arrivée.`},{id:`7-2b`,q:"Que faire dans `onBeforeUnmount` pour un polling ?",choices:[`Rien`,"`clearTimeout(minuteur)`",`Recharger la page`,`Appeler encore une fois le serveur`],answer:1,explain:`Sinon les appels continuent en arrière-plan après avoir quitté la page.`},{id:`7-2c`,q:`Où démarrer le polling ?`,choices:[`Dans le template`,"`onMounted(verifier)`",`Dans un computed`,`Dans le store uniquement`],answer:1,explain:`Au montage de la page ; et on l’arrête au démontage.`}]},{id:`7-3`,title:`Toasts et confirmations (PrimeVue)`,minutes:12,goal:`Confirmer une action dangereuse et notifier le résultat.`,blocks:[{t:`p`,text:"PrimeVue fournit des services prêts à l'emploi : **`useToast()`** pour les notifications, **`useConfirm()`** pour les confirmations. Il faut placer une fois `<Toast />` et `<ConfirmDialog />` dans la page (souvent dans `App.vue`)."},{t:`code`,lang:`js`,code:`import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()

function supprimer(demande) {
  confirm.require({
    message: 'Supprimer cette demande ?',
    header: 'Confirmation',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    accept: () => {
      demandes.value = demandes.value.filter(d => d.id !== demande.id)
      toast.add({ severity: 'success', summary: 'Demande supprimée', life: 3000 })
    },
  })
}`},{t:`list`,items:["`severity` : `success`, `info`, `warn`, `error`.","`life` : durée d’affichage en ms (sans `life`, le toast reste).","Autres composants très utilisés : `<Drawer>` (panneau latéral, appelé `<Sidebar>` en PrimeVue 3), `<ProgressSpinner>`, `<Button>`."]}],exercise:{kind:`build`,task:"Le bouton **Supprimer** supprime tout de suite. Ajoute une **confirmation** (`useConfirm`, bouton d'acceptation « Supprimer ») : la demande n'est retirée qu'après acceptation, puis un **toast** de succès « Demande supprimée » s'affiche.",open:`App.vue`,files:{"App.vue":`<script setup>
const demandes = ref([
  { id: 1, libelle: 'Congés · 3 jours' },
  { id: 2, libelle: 'RTT · 1 jour' },
])

function supprimer(d) {
  demandes.value = demandes.value.filter(x => x.id !== d.id)
}
<\/script>

<template>
  <Toast />
  <ConfirmDialog />
  <ul style="font-family: system-ui">
    <li v-for="d in demandes" :key="d.id" data-test="demande">
      {{ d.libelle }}
      <Button :data-test="'suppr-' + d.id" label="Supprimer" severity="danger" text @click="supprimer(d)" />
    </li>
  </ul>
</template>`},solution:{"App.vue":`<script setup>
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

const toast = useToast()
const confirm = useConfirm()

const demandes = ref([
  { id: 1, libelle: 'Congés · 3 jours' },
  { id: 2, libelle: 'RTT · 1 jour' },
])

function supprimer(d) {
  confirm.require({
    message: 'Supprimer cette demande ?',
    header: 'Confirmation',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    accept: () => {
      demandes.value = demandes.value.filter(x => x.id !== d.id)
      toast.add({ severity: 'success', summary: 'Demande supprimée', life: 3000 })
    },
  })
}
<\/script>

<template>
  <Toast />
  <ConfirmDialog />
  <ul style="font-family: system-ui">
    <li v-for="d in demandes" :key="d.id" data-test="demande">
      {{ d.libelle }}
      <Button :data-test="'suppr-' + d.id" label="Supprimer" severity="danger" text @click="supprimer(d)" />
    </li>
  </ul>
</template>`},tests:[{name:`Une confirmation apparaît, rien n’est supprimé tout de suite`,run:async e=>{await e.click(`[data-test=suppr-1]`),await e.flush(),$(e.bodyText(),`Page`).toContain(`Supprimer cette demande ?`),$(e.findAll(`[data-test=demande]`).length,`Demandes avant confirmation`).toBe(2)}},{name:`Accepter supprime et affiche un toast`,run:async e=>{await e.click(`[data-test=suppr-2]`),await e.flush();let t=[...document.body.querySelectorAll(`.p-confirmdialog button`)].find(e=>e.textContent?.includes(`Supprimer`));$(!!t,`Bouton « Supprimer » de la confirmation`).toBeTruthy(),t.click(),await e.wait(30),$(e.findAll(`[data-test=demande]`).length,`Demandes après confirmation`).toBe(1),$(e.bodyText(),`Page`).toContain(`Demande supprimée`)}},{name:`Annuler ne supprime rien`,run:async e=>{await e.click(`[data-test=suppr-1]`),await e.flush();let t=[...document.body.querySelectorAll(`.p-confirmdialog button`)].find(e=>e.textContent?.includes(`Annuler`));$(!!t,`Bouton « Annuler »`).toBeTruthy(),t.click(),await e.wait(30),$(e.findAll(`[data-test=demande]`).length).toBe(2)}}],hints:["Importe `useToast` depuis 'primevue/usetoast' et `useConfirm` depuis 'primevue/useconfirm'.","Dans `supprimer` : `confirm.require({ message: 'Supprimer cette demande ?', acceptLabel: 'Supprimer', rejectLabel: 'Annuler', accept: () => { … } })`.","Dans `accept` : filtre la liste puis `toast.add({ severity: 'success', summary: 'Demande supprimée', life: 3000 })`."]},cards:[{id:`7-3a`,q:"Que faut-il pour que `toast.add(...)` affiche quelque chose ?",choices:[`Rien`,"Un composant `<Toast />` présent dans la page",`Un store`,`Un watch`],answer:1,explain:"Le service envoie le message ; le composant `<Toast />` l’affiche."},{id:`7-3b`,q:"Dans `confirm.require`, où mettre la suppression ?",choices:[`Avant l’appel`,"Dans `accept`","Dans `reject`",`Après l’appel`],answer:1,explain:"La confirmation est asynchrone : l’action ne doit se faire que dans `accept`."},{id:`7-3c`,q:"En PrimeVue 4, le panneau latéral `<Sidebar>` s’appelle…",choices:["`<Panel>`","`<Drawer>`","`<Aside>`","`<Slide>`"],answer:1,explain:"`Sidebar` a été renommé `Drawer` en PrimeVue 4 (même principe : `v-model:visible`)."}]}]},gl=`export function useEcran() {
  const largeur = ref(window.innerWidth)
  const estMobile = computed(() => largeur.value < 992)

  function maj() {
    largeur.value = window.innerWidth
  }

  onMounted(() => window.addEventListener('resize', maj))
  onBeforeUnmount(() => window.removeEventListener('resize', maj))

  return { largeur, estMobile }
}`,_l=[rl,al,sl,cl,fl,pl,hl,{id:8,title:`Responsive et i18n`,icon:`pi pi-mobile`,color:`#6366f1`,summary:`Composables, version mobile, traductions : finitions pro.`,lessons:[{id:`8-1`,title:`Un composable useEcran()`,minutes:14,goal:`Écrire un composable réutilisable qui suit la largeur d’écran (seuil 992 px).`,blocks:[{t:`p`,text:"Un **composable** est une fonction `use…()` qui regroupe de l'état réactif et de la logique **réutilisable** (avec son propre cycle de vie). On le range dans `composables/`."},{t:`code`,lang:`js`,title:`composables/useEcran.js`,code:gl},{t:`code`,lang:`vue`,title:`Utilisation`,code:`<script setup>
import { useEcran } from '@/composables/useEcran'
const { estMobile } = useEcran()
<\/script>
<template>
  <BarreDuBas v-if="estMobile" />
  <MenuLateral v-else />
</template>`},{t:`list`,items:["Un composable peut utiliser `ref`, `computed`, `watch`, `onMounted`… comme un composant.",`Chaque appel crée **son propre état** (contrairement à un store Pinia, partagé).`,`Il renvoie un objet de refs : on peut le déstructurer sans perdre la réactivité.`]},{t:`tip`,text:"Pour du pur affichage, le CSS (`@media (max-width: 991px)`) ou les classes utilitaires suffisent. Le composable sert quand la **logique** change selon l'écran (colonnes, composants différents)."}],exercise:{kind:`build`,task:"Écris `composables/useEcran.js` : une ref **`largeur`** (= `window.innerWidth`) mise à jour à chaque `resize` (écouteur ajouté au montage, retiré au démontage), et un computed **`estMobile`** vrai sous **992 px**. `App.vue` l'utilise déjà.",open:`composables/useEcran.js`,readonly:[`App.vue`],files:{"composables/useEcran.js":`export function useEcran() {
  const largeur = ref(window.innerWidth)
  // à compléter : estMobile (< 992), mise à jour sur resize, nettoyage

  return { largeur }
}`,"App.vue":`<script setup>
import { useEcran } from '@/composables/useEcran'
const { largeur, estMobile } = useEcran()
<\/script>

<template>
  <p data-test="mode">{{ estMobile ? 'Mobile' : 'Bureau' }}</p>
  <p data-test="largeur">{{ largeur }} px</p>
</template>`},solution:{"composables/useEcran.js":gl},tests:[{name:`Bureau à 1200 px`,run:async e=>{await e.resize(1200),$(e.text(`[data-test=mode]`)).toBe(`Bureau`)}},{name:`Mobile sous 992 px, et suit le redimensionnement`,run:async e=>{await e.resize(1200),await e.resize(500),$(e.text(`[data-test=mode]`),`Mode à 500 px`).toBe(`Mobile`),$(e.text(`[data-test=largeur]`)).toBe(`500 px`),await e.resize(992),$(e.text(`[data-test=mode]`),`Mode à 992 px`).toBe(`Bureau`)}}],hints:["`const estMobile = computed(() => largeur.value < 992)`","`function maj() { largeur.value = window.innerWidth }` puis `onMounted(() => window.addEventListener('resize', maj))`.","Nettoyage : `onBeforeUnmount(() => window.removeEventListener('resize', maj))`, et `return { largeur, estMobile }`."]},cards:[{id:`8-1a`,q:`Différence entre un composable et un store Pinia ?`,choices:[`Aucune`,`Chaque appel d’un composable crée son propre état ; un store est partagé`,`Un composable est plus lent`,`Un store ne peut pas avoir de computed`],answer:1,explain:`Composable = logique réutilisable (état local à chaque usage). Store = état unique partagé.`},{id:`8-1b`,q:`Convention de nommage d’un composable ?`,choices:["`getEcran()`","`useEcran()`","`EcranStore`","`$ecran`"],answer:1,explain:"Préfixe `use` : `useEcran`, `useToast`, `useRoute`…"},{id:`8-1c`,q:`Un composable peut-il utiliser onMounted ?`,choices:[`Non`,`Oui, s’il est appelé dans le setup d’un composant`,`Seulement dans un store`,`Seulement avec async`],answer:1,explain:`Les hooks s’attachent au composant qui appelle le composable pendant son setup.`}]},{id:`8-2`,title:`Traductions avec $t()`,minutes:12,goal:`Remplacer les textes en dur par des clés de traduction, avec paramètres.`,blocks:[{t:`p`,text:"Avec **vue-i18n**, aucun texte n'est écrit en dur : on utilise une **clé** et `$t()` va chercher la traduction dans la langue courante."},{t:`code`,lang:`js`,title:`Messages (fr)`,code:`{
  "absences.titre": "Mes absences",
  "absences.solde": "Solde : {n} jour(s)",
  "commun.enregistrer": "Enregistrer"
}`},{t:`code`,lang:`vue`,code:`<template>
  <h1>{{ $t('absences.titre') }}</h1>
  <p>{{ $t('absences.solde', { n: solde }) }}</p>      <!-- paramètre -->
  <Button :label="$t('commun.enregistrer')" />          <!-- dans un attribut : ":" -->
</template>

<script setup>
const { t } = useI18n()                                // dans le script
toast.add({ summary: t('commun.enregistre') })
<\/script>`},{t:`warn`,text:"Dans un attribut, il faut le `:` : `label=\"$t('x')\"` afficherait littéralement « $t('x') »."}],exercise:{kind:`build`,task:"Traduis l'écran avec les clés fournies : titre **`absences.titre`**, solde **`absences.solde`** avec le paramètre `n`, libellé du bouton **`commun.demander`** (attribut `label` du `<Button>`), et le message affiché après le clic avec **`absences.envoyee`** via `useI18n()` dans le script.",open:`App.vue`,messages:{"absences.titre":`Mes absences`,"absences.solde":`Solde : {n} jour(s)`,"commun.demander":`Faire une demande`,"absences.envoyee":`Votre demande a bien été envoyée`},files:{"App.vue":`<script setup>
const solde = ref(12)
const message = ref('')

function demander() {
  message.value = 'Demande envoyée'
}
<\/script>

<template>
  <div style="font-family: system-ui">
    <h1 data-test="titre">Absences</h1>
    <p data-test="solde">Solde : {{ solde }}</p>
    <Button data-test="demander" label="Demander" @click="demander" />
    <p data-test="message">{{ message }}</p>
  </div>
</template>`},solution:{"App.vue":`<script setup>
const { t } = useI18n()
const solde = ref(12)
const message = ref('')

function demander() {
  message.value = t('absences.envoyee')
}
<\/script>

<template>
  <div style="font-family: system-ui">
    <h1 data-test="titre">{{ $t('absences.titre') }}</h1>
    <p data-test="solde">{{ $t('absences.solde', { n: solde }) }}</p>
    <Button data-test="demander" :label="$t('commun.demander')" @click="demander" />
    <p data-test="message">{{ message }}</p>
  </div>
</template>`},tests:[{name:`Titre et solde traduits (avec paramètre)`,run:e=>{$(e.text(`[data-test=titre]`)).toBe(`Mes absences`),$(e.text(`[data-test=solde]`)).toBe(`Solde : 12 jour(s)`)}},{name:`Libellé du bouton traduit`,run:e=>$(e.text(`[data-test=demander]`),`Bouton`).toBe(`Faire une demande`)},{name:`Message du script traduit`,run:async e=>{await e.click(`[data-test=demander]`),$(e.text(`[data-test=message]`)).toBe(`Votre demande a bien été envoyée`)}}],hints:["Template : `{{ $t('absences.titre') }}` et `{{ $t('absences.solde', { n: solde }) }}`.",`Bouton : \`:label="$t('commun.demander')"\` (avec les deux-points).`,"Script : `const { t } = useI18n()` puis `message.value = t('absences.envoyee')`."]},cards:[{id:`8-2a`,q:`Comment passer un paramètre à une traduction « Solde : {n} jour(s) » ?`,choices:["`$t('absences.solde') + n`","`$t('absences.solde', { n: solde })`","`$t('absences.solde', solde)`","`$t('absences.solde.n')`"],answer:1,explain:"Les paramètres nommés se passent en objet, `{n}` est remplacé."},{id:`8-2b`,q:`\`<Button label="$t('x')">\` affiche…`,choices:[`La traduction`,`Le texte « $t('x') »`,`Rien`,`Une erreur`],answer:1,explain:"Sans `:`, la valeur est une chaîne littérale. Il faut `:label=\"$t('x')\"`."},{id:`8-2c`,q:"Pour traduire dans le `<script setup>` :",choices:["`this.$t()`","`const { t } = useI18n()` puis `t('cle')`","`$t()` directement","`i18n.translate()`"],answer:1,explain:"Dans le script on utilise le composable `useI18n()` ; `$t` est pour le template."}]},{id:`8-3`,title:`Projet final : barre du bas mobile`,minutes:20,goal:`Assembler composable, config déclarative et routeur dans un layout responsive.`,blocks:[{t:`p`,text:`Dernière étape : un **layout** comme au travail. Sur bureau, un **menu latéral** ; sous 992 px, une **barre du bas**. Les entrées du menu viennent d'**une seule config** (déclaratif), affichée de deux façons.`},{t:`code`,lang:`vue`,code:`<script setup>
import { useEcran } from '@/composables/useEcran'
const { estMobile } = useEcran()

const menu = [
  { to: '/', label: 'Accueil', icon: 'pi pi-home' },
  { to: '/absences', label: 'Absences', icon: 'pi pi-calendar' },
  { to: '/profil', label: 'Profil', icon: 'pi pi-user' },
]
<\/script>

<template>
  <div class="flex">
    <aside v-if="!estMobile">
      <router-link v-for="m in menu" :key="m.to" :to="m.to">{{ m.label }}</router-link>
    </aside>
    <main class="flex-1"><router-view /></main>
  </div>
  <nav v-if="estMobile" class="barre-bas">…même menu…</nav>
</template>`},{t:`tip`,text:`Tu as maintenant vu tout ce qui sert le plus au travail : réactivité, composants, routage par fichiers, appels serveur, config déclarative, Pinia, cycle de vie, PrimeVue, responsive et i18n. Bravo 🎉`}],exercise:{kind:`build`,task:'Termine `App.vue` : à partir de la config **`menu`**, affiche un menu latéral (`data-test="lateral"`) sur **bureau** et une barre du bas (`data-test="barre-bas"`) sur **mobile** (< 992 px, via `useEcran`). Chaque entrée est un `router-link` avec la classe active, et `<router-view />` affiche la page.',open:`App.vue`,readonly:[`composables/useEcran.js`,`pages/index.vue`,`pages/absences/index.vue`,`pages/profil.vue`],files:{"composables/useEcran.js":gl,"pages/index.vue":`<template><h1>Accueil</h1></template>`,"pages/absences/index.vue":`<template><h1>Absences</h1></template>`,"pages/profil.vue":`<template><h1>Profil</h1></template>`,"App.vue":`<script setup>
const menu = [
  { to: '/', label: 'Accueil', icon: 'pi pi-home' },
  { to: '/absences', label: 'Absences', icon: 'pi pi-calendar' },
  { to: '/profil', label: 'Profil', icon: 'pi pi-user' },
]
// à compléter : useEcran
<\/script>

<template>
  <div class="layout">
    <!-- à compléter : menu latéral (bureau) -->
    <main class="contenu"><!-- à compléter --></main>
  </div>
  <!-- à compléter : barre du bas (mobile) -->
</template>

<style>
.layout { display: flex; gap: 12px; font-family: system-ui; min-height: 200px; }
.lateral { display: flex; flex-direction: column; gap: 6px; width: 160px; padding: 10px; background: #f8fafc; border-radius: 12px; }
.contenu { flex: 1; padding-bottom: 70px; }
.barre-bas { position: fixed; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: repeat(3, 1fr); background: #fff; border-top: 1px solid #e2e8f0; }
.barre-bas a { display: grid; justify-items: center; padding: 8px 0; font-size: 12px; color: #64748b; text-decoration: none; }
a.router-link-exact-active { color: #42b883; font-weight: 700; }
</style>`},solution:{"App.vue":`<script setup>
import { useEcran } from '@/composables/useEcran'

const { estMobile } = useEcran()

const menu = [
  { to: '/', label: 'Accueil', icon: 'pi pi-home' },
  { to: '/absences', label: 'Absences', icon: 'pi pi-calendar' },
  { to: '/profil', label: 'Profil', icon: 'pi pi-user' },
]
<\/script>

<template>
  <div class="layout">
    <aside v-if="!estMobile" class="lateral" data-test="lateral">
      <router-link v-for="m in menu" :key="m.to" :to="m.to" data-test="entree">
        <i :class="m.icon" /> {{ m.label }}
      </router-link>
    </aside>
    <main class="contenu"><router-view /></main>
  </div>
  <nav v-if="estMobile" class="barre-bas" data-test="barre-bas">
    <router-link v-for="m in menu" :key="m.to" :to="m.to" data-test="entree">
      <i :class="m.icon" /><span>{{ m.label }}</span>
    </router-link>
  </nav>
</template>

<style>
.layout { display: flex; gap: 12px; font-family: system-ui; min-height: 200px; }
.lateral { display: flex; flex-direction: column; gap: 6px; width: 160px; padding: 10px; background: #f8fafc; border-radius: 12px; }
.contenu { flex: 1; padding-bottom: 70px; }
.barre-bas { position: fixed; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: repeat(3, 1fr); background: #fff; border-top: 1px solid #e2e8f0; }
.barre-bas a { display: grid; justify-items: center; padding: 8px 0; font-size: 12px; color: #64748b; text-decoration: none; }
a.router-link-exact-active { color: #42b883; font-weight: 700; }
</style>`},tests:[{name:`Bureau : menu latéral, pas de barre du bas`,run:async e=>{await e.resize(1280),$(e.exists(`[data-test=lateral]`),`Menu latéral`).toBeTruthy(),$(e.exists(`[data-test=barre-bas]`),`Barre du bas`).toBeFalsy(),$(e.findAll(`[data-test=lateral] [data-test=entree]`).length,`Entrées du menu`).toBe(3)}},{name:`Mobile : barre du bas qui navigue`,run:async e=>{await e.resize(400),$(e.exists(`[data-test=barre-bas]`),`Barre du bas à 400 px`).toBeTruthy(),$(e.exists(`[data-test=lateral]`),`Menu latéral à 400 px`).toBeFalsy(),e.findAll(`[data-test=barre-bas] [data-test=entree]`)[1].click(),await e.flush(),await e.flush(),$(e.text(`h1`),`Page après clic sur Absences`).toBe(`Absences`),$(e.findAll(`[data-test=barre-bas] [data-test=entree]`)[1].classList.contains(`router-link-exact-active`),`Entrée active`).toBeTruthy()}},{name:`Passage bureau → mobile en direct`,run:async e=>{await e.resize(1280),await e.resize(700),$(e.exists(`[data-test=barre-bas]`)).toBeTruthy()}}],hints:["`import { useEcran } from '@/composables/useEcran'` puis `const { estMobile } = useEcran()`.",'`<aside v-if="!estMobile" class="lateral" data-test="lateral">` avec `<router-link v-for="m in menu" :key="m.to" :to="m.to" data-test="entree">`.','Mets `<router-view />` dans `<main>` et la barre `<nav v-if="estMobile" class="barre-bas" data-test="barre-bas">` après le layout.']},cards:[{id:`8-3a`,q:"Pourquoi une seule config `menu` pour le menu latéral ET la barre du bas ?",choices:[`Pour aller plus vite à l’exécution`,`Une seule source de vérité : ajouter une entrée la met partout`,`C’est obligatoire avec router-link`,`Pour le SEO`],answer:1,explain:`Interface déclarative : la liste décrit le menu, deux rendus l’affichent.`},{id:`8-3b`,q:`Classe ajoutée sur le lien exactement égal à l’URL courante ?`,choices:["`active`","`router-link-exact-active`","`current`","`is-active`"],answer:1,explain:"`router-link-active` = préfixe correspondant ; `router-link-exact-active` = correspondance exacte."},{id:`8-3c`,q:"`v-if` vs `v-show` pour basculer bureau/mobile ?",choices:[`Identiques`,"`v-if` crée/détruit, `v-show` cache en CSS (display:none)","`v-show` est plus récent","`v-if` ne marche pas avec des composants"],answer:1,explain:`v-show garde l’élément dans le DOM ; v-if ne le rend que si la condition est vraie.`}]}]}],vl=_l.flatMap(e=>e.lessons),yl=e=>vl.find(t=>t.id===e)??null,bl=e=>_l.find(t=>t.lessons.some(t=>t.id===e))??null,xl=e=>vl[vl.findIndex(t=>t.id===e)+1]??null,Sl=vl.flatMap(e=>e.cards.map(t=>({...t,lessonId:e.id}))),Cl=(e,t)=>{let n=e.__vccOpts||e;for(let[e,r]of t)n[e]=r;return n},wl=[0,1,3,7,16,35],Tl=wl.length-1,El=864e5,Dl=e=>{let t=new Date(e);return t.setHours(0,0,0,0),t.getTime()};function Ol(e=Date.now()){return{box:0,due:e,seen:0,correct:0}}function kl(e,t,n=Date.now()){let r=t?Math.min(Tl,e.box+1):1;return{box:r,due:Dl(n)+wl[r]*El,seen:e.seen+1,correct:e.correct+ +!!t}}var Al=(e,t=Date.now())=>e.due<=t,jl=e=>e.box>=4,Ml=`vue-express:progression`,Nl={lesson:50,lessonNoSolution:30,card:5},Pl=()=>new Date().toLocaleDateString(`sv-SE`);function Fl(){try{let e=JSON.parse(localStorage.getItem(`vue-express:progression`)||`null`);if(e&&e.version===1)return e}catch{}return{version:1,lessons:{},cards:{},xp:0,days:[],last:null}}var Il=Gc(`progression`,()=>{let e=Fl(),t=R(e.lessons),n=R(e.cards),r=R(e.xp),i=R(e.days),a=R(e.last);Cr([t,n,r,i,a],()=>{try{localStorage.setItem(Ml,JSON.stringify({version:1,lessons:t.value,cards:n.value,xp:r.value,days:i.value,last:a.value}))}catch{}},{deep:!0});let o=e=>t.value[e]??{read:!1,done:!1,doneAt:null,attempts:0,hints:0,solution:!1},s=(e,n)=>{t.value[e]={...o(e),...n}};function c(){let e=Pl();i.value.includes(e)||i.value.push(e)}function l(e){a.value=e,c(),o(e).read||s(e,{read:!0});let t=vl.find(t=>t.id===e);for(let e of t?.cards??[])n.value[e.id]||(n.value[e.id]=Ol())}function u(e){s(e,{attempts:o(e).attempts+1}),c()}function d(e){s(e,{hints:o(e).hints+1})}function f(e){s(e,{solution:!0})}function p(e){let t=o(e);if(t.done)return 0;let n=Nl.lesson+(t.solution?0:Nl.lessonNoSolution);return s(e,{done:!0,doneAt:Date.now()}),r.value+=n,c(),n}function m(e,t){n.value[e]=kl(n.value[e]??Ol(),t),t&&(r.value+=Nl.card),c()}let h=Zs(()=>vl.filter(e=>o(e.id).done).length),g=Zs(()=>Math.round(h.value/vl.length*100)),_=Zs(()=>Sl.filter(e=>n.value[e.id]&&Al(n.value[e.id]))),v=Zs(()=>Object.values(n.value).filter(jl).length),y=Zs(()=>Object.keys(n.value).length),b=Zs(()=>{let e=new Set(i.value),t=new Date;e.has(t.toLocaleDateString(`sv-SE`))||t.setDate(t.getDate()-1);let n=0;for(;e.has(t.toLocaleDateString(`sv-SE`));)n++,t.setDate(t.getDate()-1);return n}),x=Zs(()=>vl.find(e=>!o(e.id).done)??null),S=e=>{let t=_l.find(t=>t.id===e),n=t.lessons.filter(e=>o(e.id).done).length;return{done:n,total:t.lessons.length,percent:Math.round(n/t.lessons.length*100)}};function C(){return JSON.stringify({app:`vue-express`,exportedAt:new Date().toISOString(),version:1,lessons:t.value,cards:n.value,xp:r.value,days:i.value,last:a.value},null,1)}function w(e){try{let o=JSON.parse(e);return o?.app!==`vue-express`||o.version!==1||typeof o.lessons!=`object`?{ok:!1,message:`Ce fichier n'est pas une sauvegarde Vue Express.`}:(t.value=o.lessons,n.value=o.cards??{},r.value=Number(o.xp)||0,i.value=Array.isArray(o.days)?o.days:[],a.value=o.last??null,{ok:!0,message:`Progression restaurée.`})}catch{return{ok:!1,message:`Fichier illisible (JSON invalide).`}}}function T(){t.value={},n.value={},r.value=0,i.value=[],a.value=null}return{lessons:t,cards:n,xp:r,days:i,last:a,state:o,markRead:l,recordAttempt:u,recordHint:d,recordSolution:f,complete:p,answer:m,doneCount:h,percent:g,dueCards:_,mastered:v,unlockedCards:y,streak:b,nextLesson:x,moduleProgress:S,exportData:C,importData:w,reset:T}}),Ll={};export{ys as $,_ as $n,Hr as $t,Zs as A,Xt as An,hr as At,xs as B,dn as Bn,cs as Bt,Go as C,tn as Cn,ea as Ct,z as D,Ie as Dn,Yi as Dt,Fn as E,rn as En,Zi as Et,No as F,on as Fn,fa as Ft,Sa as G,O as Gn,ma as Gt,Ni as H,un as Hn,Zr as Ht,Na as I,Qe as In,ia as It,ba as J,d as Jn,ti as Jt,Ta as K,ie as Kn,ms as Kt,Mo as L,F as Ln,sa as Lt,ds as M,R as Mn,Zn as Mt,Cs as N,Zt as Nn,Us as Nt,Rn as O,kn as On,as as Ot,us as P,$t as Pn,ua as Pt,Qr as Q,f as Qn,ri as Qt,da as R,yn as Rn,oa as Rt,rs as S,N as Sn,qi as St,ns as T,P as Tn,Qi as Tt,ei as U,n as Un,vr as Ut,Y as V,ln as Vn,oc as Vt,xa as W,i as Wn,sc as Wt,ac as X,xe as Xn,yr as Xt,wa as Y,re as Yn,$a as Yt,js as Z,oe as Zn,Da as Zt,q as _,Ze as _n,le as _r,Ki as _t,Sl as a,Sr as an,be as ar,ki as at,K as b,On as bn,zi as bt,yl as c,Ea as cn,Ee as cr,gr as ct,el as d,dr as dn,ve as dr,fs as dt,nc as en,s as er,Qs as et,Oc as f,Ne as fn,Me as fr,ja as ft,Ur as g,hn as gn,ae as gr,Ri as gt,Kr as h,wn as hn,ke as hr,qn as ht,Cl as i,xr as in,m as ir,Ai as it,_s as j,Qt as jn,lr as jt,bs as k,pn as kn,ur as kt,bl as l,pr as ln,De as lr,tc as lt,cc as m,Cn as mn,pe as mr,Es as mt,Il as n,Cr as nn,o as nr,_r as nt,vl as o,Pa as on,v as or,Oi as ot,Gc as p,Re as pn,ye as pr,Ma as pt,Ca as q,c as qn,Oa as qt,Tl as r,br as rn,T as rr,Ei as rt,_l as s,fr as sn,y as sr,$s as st,Ll as t,rc as tn,b as tr,zn as tt,xl as u,ec as un,ce as ur,Ws as ut,In as v,Pe as vn,Xi as vt,Rr as w,L as wn,$i as wt,Ii as x,nn as xn,ta as xt,ic as y,Fe as yn,Ji as yt,Ss as z,gn as zn,Jr as zt};