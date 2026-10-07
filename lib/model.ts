export type Cost = { id:string; name:string; category:string; scope:'shared'|'personal'; ownerId?:string; private?:boolean; mode:'fixed'|'formula'; amount:number; quantity:number; rate:number; frequency:'once'|'monthly'|'daily'|'annual'; month:number; note:string; energy?:boolean; distance?:number; consumption?:number };
export type Plan = { id:string; name:string; start:string; months:number; days:number; cash:number; reserve:number; monthlyIncome:number; incomeStart:number; costs:Cost[]; generated:{table:boolean;board:boolean}; itinerary?:{id:string;name:string;location:string;start:string;end:string;note:string;done:boolean}[]; vehicle?:{purchase:number;conversion:number;resale:number;alreadyPaid:boolean}; updatedAt?:string };
export const money=(n:number)=>new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY',maximumFractionDigits:0}).format(n);
export function annualCost(c:Cost,p:Plan){const base=c.mode==='formula'?(c.energy?(c.distance||0)*(c.consumption||0)/100:c.quantity)*c.rate:c.amount; return base*({once:1,monthly:p.months,daily:p.days,annual:p.months/12}[c.frequency]);}
export function calculate(p:Plan){
 const rows=Array.from({length:p.months},(_,i)=>{
  const expenseCents=p.costs.reduce((s,c)=>{const cents=Math.round(annualCost(c,p)*100);return s+(c.frequency==='once'?(c.month===i+1?cents:0):Math.floor(cents/p.months)+(i===p.months-1?cents%p.months:0));},0)+(i===0&&p.vehicle&&!p.vehicle.alreadyPaid?Math.round((p.vehicle.purchase+p.vehicle.conversion)*100):0);const expense=expenseCents/100;
  const income=i+1>=p.incomeStart?p.monthlyIncome:0;return {month:i+1,expense,income,balance:0};
 });let balance=p.cash;for(const r of rows){balance=Math.round((balance+r.income-r.expense)*100)/100;r.balance=balance;}
 const total=rows.reduce((s,r)=>s+Math.round(r.expense*100),0)/100, income=rows.reduce((s,r)=>s+r.income,0),gap=Math.max(0,total+p.reserve-p.cash-income);
 const runway=rows.find(r=>r.balance<p.reserve)?.month;
 const assetCost=p.vehicle?p.vehicle.purchase+p.vehicle.conversion-p.vehicle.resale:0;
 const operating=p.costs.reduce((s,c)=>s+annualCost(c,p),0);
 return {rows,total,operating,netCost:operating+assetCost,income,end:balance,gap,monthlyNeed:Math.ceil(gap*100/Math.max(1,p.months-p.incomeStart+1))/100,runway:runway?runway-1:p.months,personal:p.costs.filter(c=>c.scope==='personal').reduce((s,c)=>s+annualCost(c,p),0),shared:p.costs.filter(c=>c.scope==='shared').reduce((s,c)=>s+annualCost(c,p),0)};
}
export function baseline(ownerId:string):Plan{
 const cost=(id:string,name:string,amount:number,frequency:Cost['frequency'],category:string,note='',scope:Cost['scope']='shared'):Cost=>({id,name,amount,frequency,category,note,scope,ownerId:scope==='personal'?ownerId:undefined,private:false,mode:'fixed',quantity:1,rate:0,month:1});
 return {id:crypto.randomUUID(),name:'床车旅居 · 示例',start:'2027-03-01',months:12,days:365,cash:100000,reserve:30000,monthlyIncome:0,incomeStart:1,vehicle:{purchase:100000,conversion:0,resale:0,alreadyPaid:true},generated:{table:false,board:false},costs:[
 cost('mortgage','房贷',3000,'monthly','固定','个人承担，共同可见','personal'),cost('social','社保',1000,'monthly','固定'),cost('living','衣食住、通信、人情',100,'daily','生活','示例金额，请按实际出行人数修改'),cost('vehicle','维修、保养、充电',12000,'annual','车辆','合并预算；拆分能源时请扣除这里的充电部分，避免重复'),cost('insurance','车险、停车',6000,'annual','车辆','规划暂估'),cost('europe','欧洲旅行',15000,'once','旅行','待确定行程；暂安排在第 6 月'),cost('fitness','健身',5000,'annual','生活'),cost('experience','其他体验',5000,'annual','旅行'),cost('ai','AI 工具与收入探索',6000,'annual','探索'),cost('buffer','杂项缓冲',10000,'annual','缓冲')].map(c=>({...c,month:c.id==='europe'?6:1}))};
}
export function validatePlan(p:Plan){
 if(!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>100||!/^\d{4}-\d{2}-\d{2}$/.test(p.start)||!Number.isInteger(p.months)||p.months<1||p.months>60||!Array.isArray(p.costs)||p.costs.length>100)throw new Error('方案名称、日期、周期或模块数量无效');
 for(const k of ['cash','reserve','monthlyIncome','days','incomeStart'] as const)if(!Number.isFinite(p[k])||p[k]<0||p[k]>1e9)throw new Error('金额和参数必须是有效的非负数');
 if(p.days<1||p.days>20000||!Number.isInteger(p.incomeStart)||p.incomeStart<1||p.incomeStart>p.months)throw new Error('天数或收入开始月份无效');
 if(!p.generated||typeof p.generated.table!=='boolean'||typeof p.generated.board!=='boolean')throw new Error('计划表设置无效');
 if(p.vehicle){for(const k of ['purchase','conversion','resale'] as const)if(!Number.isFinite(p.vehicle[k])||p.vehicle[k]<0||p.vehicle[k]>1e9)throw new Error('车辆参数无效');if(typeof p.vehicle.alreadyPaid!=='boolean')throw new Error('车辆付款设置无效');}
 const ids=new Set();for(const c of p.costs){if(!c.id||ids.has(c.id)||typeof c.name!=='string'||!c.name.trim()||c.name.length>100||!['shared','personal'].includes(c.scope)||!['fixed','formula'].includes(c.mode)||!['once','monthly','daily','annual'].includes(c.frequency))throw new Error('支出模块无效');ids.add(c.id);for(const k of ['amount','quantity','rate','month'] as const)if(!Number.isFinite(c[k])||c[k]<0||c[k]>1e9)throw new Error('支出参数无效');if(!Number.isInteger(c.month)||c.month<1||c.month>p.months)throw new Error('一次性支出月份超出计划周期');}
 for(const c of p.costs)if(c.energy)for(const k of ['distance','consumption'] as const)if(!Number.isFinite(c[k])||c[k]!<0||c[k]!>1e8)throw new Error('里程或能耗参数无效');
 if(p.itinerary){if(!Array.isArray(p.itinerary)||p.itinerary.length>200)throw new Error('行程数量无效');for(const item of p.itinerary)if(!item.id||!item.name||item.name.length>100||!/^\d{4}-\d{2}-\d{2}$/.test(item.start)||!/^\d{4}-\d{2}-\d{2}$/.test(item.end)||item.end<item.start||typeof item.done!=='boolean')throw new Error('行程日期或内容无效');}
 return p;
}
