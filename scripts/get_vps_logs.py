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

        stdin, stdout, stderr = ssh.exec_command('echo "VuQmPgXP3EiDNSx1GHsR" | sudo -S ls -1t /etc/dokploy/logs/vendetta-prod-gcqoaf/')
        log_files = stdout.read().decode('utf-8').strip().split('\n')
        newest_log = log_files[0] if log_files and log_files[0] else ""
        if newest_log:
            stdin, stdout, stderr = ssh.exec_command(f'echo "VuQmPgXP3EiDNSx1GHsR" | sudo -S cat "/etc/dokploy/logs/vendetta-prod-gcqoaf/{newest_log}"')
            bookings_list = stdout.read().decode('utf-8')
            bookings_list_err = stderr.read().decode('utf-8')
        else:
            bookings_list = "No log files found"
            bookings_list_err = ""
            
        report = {
            "docker_ps": docker_ps,
            "docker_ps_err": docker_ps_err,
            "container_logs": logs_dict,
            "grep_next": grep_next,
            "cat_route": cat_route,
            "bookings_list": bookings_list,
            "bookings_list_err": bookings_list_err
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
