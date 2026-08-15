import os
import paramiko

def fetch_logs():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print("Connecting to VPS via SSH...")
        ssh.connect(
            hostname='66.29.152.229', 
            port=2226, 
            username='jose', 
            password='VuQmPgXP3EiDNSx1GHsR',
            look_for_keys=False,
            allow_agent=False,
            timeout=15
        )
        print("Connected. Running docker commands...")
        
        # 1. get docker ps
        stdin, stdout, stderr = ssh.exec_command("docker ps -a")
        docker_ps = stdout.read().decode('utf-8')
        docker_ps_err = stderr.read().decode('utf-8')
        
        # 2. get docker logs of vendetta container
        # Dokploy compose containers usually have vendetta-app or similar in their name.
        # Let's run docker ps to find the container name and then run docker logs on it.
        stdin, stdout, stderr = ssh.exec_command("docker ps -a --filter name=vendetta --format '{{.Names}}'")
        containers = stdout.read().decode('utf-8').strip().split('\n')
        
        logs_dict = {}
        for container in containers:
            if not container:
                continue
            print(f"Fetching logs for container: {container}...")
            stdin, stdout, stderr = ssh.exec_command(f"docker logs --tail=300 {container}")
            logs_dict[container] = {
                "stdout": stdout.read().decode('utf-8'),
                "stderr": stderr.read().decode('utf-8')
            }
            
        # 3. get custom diagnostic info
        stdin, stdout, stderr = ssh.exec_command("docker exec vendetta-prod-gcqoaf-vendetta-app-1 grep -rn \"Datos legales\" /app/.next/ || echo \"Not found in Next build\"")
        grep_next = stdout.read().decode('utf-8')
        
        stdin, stdout, stderr = ssh.exec_command("docker exec vendetta-prod-gcqoaf-vendetta-app-1 cat \"/app/src/app/api/admin/contract/[id]/route.ts\" || echo \"Not found in source\"")
        cat_route = stdout.read().decode('utf-8')

        # Generate authorization token and curl contract endpoint via container IP
        stdin, stdout, stderr = ssh.exec_command('docker exec vendetta-prod-gcqoaf-vendetta-app-1 node -e \'const crypto = require(\"crypto\"); const secret = process.env.AUTH_SECRET || \"fallback_secret_vendetta_music_app_2026\"; const id = \"349d67ae-ee3f-44c5-a0d8-9a37ffa77b65\"; console.log(crypto.createHmac(\"sha256\", secret).update(id).digest(\"hex\"));\'')
        expected_token = stdout.read().decode('utf-8').strip()
        
        # Run node fetch inside the container to bypass any external routing/caching
        node_script = """
const http = require('http');
const crypto = require('crypto');
const secret = process.env.AUTH_SECRET || 'fallback_secret_vendetta_music_app_2026';
const id = '349d67ae-ee3f-44c5-a0d8-9a37ffa77b65';
const token = crypto.createHmac('sha256', secret).update(id).digest('hex');
const url = `http://localhost:3000/api/admin/contract/${id}?token=${token}`;
http.get(url, (res) => {
  console.log('STATUSCODE:' + res.statusCode);
  console.log('HEADERS:' + JSON.stringify(res.headers));
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('BODY:' + data.slice(0, 500));
  });
}).on('error', (err) => {
  console.log('ERROR:' + err.message);
});
"""
        stdin, stdout, stderr = ssh.exec_command(f"docker exec vendetta-prod-gcqoaf-vendetta-app-1 node -e {repr(node_script)}")
        node_output = stdout.read().decode('utf-8')
        node_err = stderr.read().decode('utf-8')
            
        report = {
            "docker_ps": docker_ps,
            "docker_ps_err": docker_ps_err,
            "container_logs": logs_dict,
            "grep_next": grep_next,
            "cat_route": cat_route,
            "bookings_list": f"INTERNAL NODE FETCH OUTPUT:\n{node_output}\nINTERNAL NODE FETCH ERR:\n{node_err}",
            "bookings_list_err": ""
        }
        
        import json
        with open("vps-container-logs.json", "w") as f:
            json.dump(report, f, indent=2)
        print("Saved logs report to vps-container-logs.json successfully.")
        
    except Exception as e:
        print(f"Error fetching logs: {e}")
    finally:
        ssh.close()

if __name__ == '__main__':
    fetch_logs()
