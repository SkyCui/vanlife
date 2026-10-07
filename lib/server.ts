import {env} from 'cloudflare:workers';
import type {D1Database} from '@cloudflare/workers-types';
export function db(){const e=env as unknown as {DB:D1Database};if(!e.DB)throw new Error('数据服务暂不可用，请稍后重试');return e.DB;}
export const stamp=()=>new Date().toISOString();
export const id=()=>crypto.randomUUID();
export function token(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');}
export async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),x=>x.toString(16).padStart(2,'0')).join('');}
export async function user(req:Request){
 const uid=req.headers.get('oai-authenticated-user-id'),email=req.headers.get('oai-authenticated-user-email');if(!uid||!email)return null;
 const existing=await db().prepare('SELECT id,name,username FROM users WHERE id=?').bind(uid).first<{id:string;name:string;username:string}>();if(existing)return existing;
 let name=email;try{if(req.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8')name=decodeURIComponent(req.headers.get('oai-authenticated-user-full-name')||email);}catch{}
 const sid=id();await db().batch([
 db().prepare('INSERT OR IGNORE INTO users(id,username,name,password,created) VALUES(?,?,?,?,?)').bind(uid,uid,name.slice(0,80),'!platform-auth-only',stamp()),
 db().prepare('INSERT OR IGNORE INTO spaces(id,name,owner_id,created) VALUES(?,?,?,?)').bind(sid,name.slice(0,40)+'的旅居空间',uid,stamp()),
 db().prepare('INSERT OR IGNORE INTO members(id,space_id,user_id) SELECT ?,id,? FROM spaces WHERE owner_id=?').bind(id(),uid,uid)
 ]);return {id:uid,name,username:uid};
}
export async function member(userId:string,spaceId:string){if(!await db().prepare('SELECT id FROM members WHERE user_id=? AND space_id=?').bind(userId,spaceId).first())throw new Error('没有访问该空间的权限');}
export async function limit(key:string,max:number,seconds:number){const bucket=Math.floor(Date.now()/(seconds*1000));const k=await hash(key+':'+bucket);await db().prepare('INSERT INTO throttles(id,count,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1').bind(k,Date.now()+seconds*1000).run();const r=await db().prepare('SELECT count FROM throttles WHERE id=?').bind(k).first<{count:number}>();if((r?.count??0)>max)throw new Error('操作过于频繁，请稍后重试');}
export function guard(req:Request){const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)throw new Error('请求来源无效');}
export function json(data:unknown,status=200,cookie?:string){return Response.json(data,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});}
