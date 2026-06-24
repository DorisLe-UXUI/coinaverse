#!/usr/bin/env python3
"""
Deploy coinaverse to Vercel via REST API (no Node/CLI needed).
Token: put a Vercel token in ./vtok.txt (gitignored) or env VERCEL_TOKEN.
Run:  python3 deploy.py
Auto-assigns BOTH production alias and the custom coinaverse-app.vercel.app alias.
"""
import os, sys, hashlib, json, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.abspath(__file__))
TOK = (os.environ.get('VERCEL_TOKEN')
       or (open(os.path.join(ROOT,'vtok.txt')).read().strip() if os.path.exists(os.path.join(ROOT,'vtok.txt'))
           else (open('/tmp/.vtok').read().strip() if os.path.exists('/tmp/.vtok') else '')))
if not TOK:
    sys.exit("No Vercel token. Put it in vtok.txt or set VERCEL_TOKEN.")
TEAM='team_41yK2IvRt0GoeDkAEdiO4rWv'
PROJ='coinaverse'
CUSTOM_ALIAS='coinaverse-app.vercel.app'   # the URL shared with Kabria; must be reassigned each deploy

def excluded(rel):
    if rel.startswith('.git/') or rel.startswith('.vercel/'): return True
    if rel.startswith('assets/video/'): return True
    if rel.endswith('.md') or rel.endswith('.DS_Store'): return True
    if rel in ('github_push.sh','deploy.py','vtok.txt'): return True
    if rel.startswith('assets/game/game') and rel.endswith('.png'): return True  # unreferenced ~150MB
    return False

def api(method,url,data=None,headers=None,raw=False):
    h={'Authorization':'Bearer '+TOK}
    if headers: h.update(headers)
    body=data if raw else (json.dumps(data).encode() if data is not None else None)
    if data is not None and not raw: h['Content-Type']='application/json'
    req=urllib.request.Request(url,data=body,headers=h,method=method)
    try:
        with urllib.request.urlopen(req,timeout=180) as r: return r.status,json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        try: return e.code,json.loads(e.read().decode())
        except: return e.code,{}

files=[]; shabytes={}
for dp,_,fns in os.walk(ROOT):
    for fn in fns:
        full=os.path.join(dp,fn); rel=os.path.relpath(full,ROOT).replace(os.sep,'/')
        if excluded(rel): continue
        b=open(full,'rb').read(); sha=hashlib.sha1(b).hexdigest()
        files.append({'file':rel,'sha':sha,'size':len(b)}); shabytes[sha]=b
print(f"manifest: {len(files)} files, {sum(f['size'] for f in files)/1048576:.1f} MB",flush=True)

def create():
    return api('POST',f'https://api.vercel.com/v13/deployments?teamId={TEAM}&forceNew=1',
               {'name':PROJ,'project':PROJ,'target':'production','files':files,'projectSettings':{'framework':None}})

dep=None
for attempt in range(6):
    st,resp=create()
    if st in (200,201): dep=resp; break
    err=resp.get('error',{})
    if err.get('code')=='missing_files' and err.get('missing'):
        miss=set(err['missing']); up=[f for f in files if f['sha'] in miss]
        print(f"attempt {attempt}: uploading {len(up)} files...",flush=True)
        for f in up:
            us,_=api('POST',f'https://api.vercel.com/v2/files?teamId={TEAM}',data=shabytes[f['sha']],raw=True,
                     headers={'Content-Type':'application/octet-stream','x-vercel-digest':f['sha']})
            if us not in (200,201): print(f"  upload FAIL {us}: {f['file']}",flush=True)
        continue
    sys.exit(f"CREATE ERROR {st} {json.dumps(resp)[:400]}")
if not dep: sys.exit("gave up")
dep_id=dep['id']; print(f"deployment {dep_id} https://{dep.get('url')}",flush=True)

for _ in range(120):
    st,d=api('GET',f"https://api.vercel.com/v13/deployments/{dep_id}?teamId={TEAM}")
    rs=d.get('readyState') or d.get('status'); print("  state:",rs,flush=True)
    if rs=='READY': break
    if rs in ('ERROR','CANCELED'): sys.exit("BUILD FAILED")
    time.sleep(5)

# reassign the custom alias the user shares with Kabria
st,r=api('POST',f'https://api.vercel.com/v2/deployments/{dep_id}/aliases?teamId={TEAM}',{'alias':CUSTOM_ALIAS})
print(f"alias {CUSTOM_ALIAS} -> {dep_id}: {st}",flush=True)
print("DONE  https://coinaverse-app.vercel.app/",flush=True)
