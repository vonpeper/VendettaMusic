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
            password='zNb+kFF7X8COrbKB',
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
            stdin, stdout, stderr = ssh.exec_command(f"docker logs --tail=80 {container}")
            logs_dict[container] = {
                "stdout": stdout.read().decode('utf-8'),
                "stderr": stderr.read().decode('utf-8')
            }
            
        report = {
            "docker_ps": docker_ps,
            "docker_ps_err": docker_ps_err,
            "container_logs": logs_dict
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
