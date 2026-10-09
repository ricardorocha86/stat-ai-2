
const assert=require('node:assert/strict'),fs=require('node:fs');
const {initializeApp,deleteApp}=require('firebase/app');
const {getFirestore,connectFirestoreEmulator,doc,getDocFromServer,getDocs,collection,setDoc,deleteDoc,writeBatch,serverTimestamp,terminate,setLogLevel}=require('firebase/firestore');
const project='demo-statai-cover-ratings';
if(!process.env.FIRESTORE_EMULATOR_HOST||!process.env.FIRESTORE_EMULATOR_HOST.startsWith('127.0.0.1:'))throw new Error('Only an isolated localhost emulator may run these tests.');
setLogLevel('silent');
const apps=[];
function client(uid){
 const app=initializeApp({projectId:project,apiKey:'test',appId:'test-'+(uid||'public')},'rules-'+(uid||'public'));
 const db=getFirestore(app);const options=uid?{mockUserToken:{sub:uid,user_id:uid,firebase:{sign_in_provider:'anonymous'}}}:{};
 connectFirestoreEmulator(db,'127.0.0.1',8088,options);apps.push({app,db});return db;
}
const a=client('visitor-a'),b=client('visitor-b'),publicDb=client(null),tests=[];
async function allowed(name,action){await action();tests.push({name,allowed:true});}
async function denied(name,action){await assert.rejects(action,error=>error.code==='permission-denied',name);tests.push({name,allowed:false});}
const summaryRef=(db,id)=>doc(db,'coverRatings',id);
const voteRef=(db,id,uid)=>doc(db,'coverRatings',id,'votes',uid);
const pair=(db,id,uid,score,count,sum,options={})=>{
 const batch=writeBatch(db);
 batch.set(voteRef(db,id,uid),{score,updatedAt:serverTimestamp(),...(options.vote||{})});
 batch.set(summaryRef(db,id),{count,sum,updatedAt:serverTimestamp(),...(options.summary||{})});
 return batch.commit();
};
(async()=>{
 try{
 await allowed('first anonymous vote',()=>pair(a,'capa-001','visitor-a',4,1,4));
 await allowed('public aggregate read',async()=>{assert.equal((await getDocFromServer(summaryRef(publicDb,'capa-001'))).data().sum,4)});
 await allowed('own private vote read',async()=>{assert.equal((await getDocFromServer(voteRef(a,'capa-001','visitor-a'))).data().score,4)});
 await allowed('second visitor contributes once',()=>pair(b,'capa-001','visitor-b',2,2,6));
 await allowed('changing own vote keeps voter count',()=>pair(a,'capa-001','visitor-a',5,2,7));
 await allowed('same vote does not add a voter',()=>pair(a,'capa-001','visitor-a',5,2,7));
 await denied('duplicate voter inflates count',()=>pair(a,'capa-001','visitor-a',5,3,12));
 await denied('forged aggregate without vote',()=>setDoc(summaryRef(a,'capa-001'),{count:100,sum:500,updatedAt:serverTimestamp()}));
 await denied('vote update without aggregate',()=>setDoc(voteRef(a,'capa-001','visitor-a'),{score:3,updatedAt:serverTimestamp()}));
 await denied('new aggregate without a vote',()=>setDoc(summaryRef(a,'capa-004'),{count:1,sum:4,updatedAt:serverTimestamp()}));
 await denied('new vote without aggregate',()=>setDoc(voteRef(a,'capa-004','visitor-a'),{score:4,updatedAt:serverTimestamp()}));
 await denied('incorrect arithmetic',()=>pair(a,'capa-001','visitor-a',4,2,99));
 await denied('writing another visitors vote',()=>pair(a,'capa-001','visitor-b',5,2,10));
 await denied('reading another visitors vote',()=>getDocFromServer(voteRef(a,'capa-001','visitor-b')));
 await denied('listing individual votes',()=>getDocs(collection(a,'coverRatings','capa-001','votes')));
 await denied('public vote read',()=>getDocFromServer(voteRef(publicDb,'capa-001','visitor-a')));
 await denied('listing covers',()=>getDocs(collection(publicDb,'coverRatings')));
 for(const score of [0,6,1.5,'3',null])await denied('invalid score '+JSON.stringify(score),()=>pair(a,'capa-005','visitor-a',score,1,score));
 for(const id of ['capa-000','capa-108','capa-999','other','capa-1'])await denied('invalid cover '+id,()=>pair(a,id,'visitor-a',4,1,4));
 await denied('noninteger count',()=>pair(a,'capa-006','visitor-a',4,1.5,4));
 await denied('extra public field',()=>pair(a,'capa-006','visitor-a',4,1,4,{summary:{average:4}}));
 await denied('extra private vote field',()=>pair(a,'capa-006','visitor-a',4,1,4,{vote:{note:'extra'}}));
 await denied('unauthenticated vote',()=>pair(publicDb,'capa-006','visitor-a',4,1,4));
 await denied('deleting aggregate',()=>deleteDoc(summaryRef(a,'capa-001')));
 await denied('deleting vote',()=>deleteDoc(voteRef(a,'capa-001','visitor-a')));
 await allowed('upper cover boundary',()=>pair(a,'capa-107','visitor-a',1,1,1));
 await allowed('existing private user rule',()=>setDoc(doc(a,'users','visitor-a'),{name:'Test'}));
 await denied('private user data remains protected',()=>getDocFromServer(doc(b,'users','visitor-a')));
 await denied('private user writes remain protected',()=>setDoc(doc(b,'users','visitor-a'),{name:'Changed'}));
 const summary=(await getDocFromServer(summaryRef(publicDb,'capa-001'))).data();
 assert.equal(summary.count,2);assert.equal(summary.sum,7);
 const report={project,emulator:true,checks:tests.length,allowed:tests.filter(t=>t.allowed).length,denied:tests.filter(t=>!t.allowed).length,finalCount:summary.count,finalAverage:summary.sum/summary.count,tests};
 fs.writeFileSync('docs/verificacao-regras-avaliacoes-capas.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({...report,tests:undefined},null,2));
 }finally{await Promise.all(apps.map(async({app,db})=>{await terminate(db);await deleteApp(app)}));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
