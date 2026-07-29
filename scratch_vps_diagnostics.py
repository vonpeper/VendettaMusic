import paramiko

def run_diagnostics():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print("Connecting to VPS via SSH with NEW credentials...")
        ssh.connect(
            hostname='66.29.152.229', 
            port=2226, 
            username='jose', 
            password='VuQmPgXP3EiDNSx1GHsR',
            look_for_keys=False,
            allow_agent=False,
            timeout=20
        )
        print("Connected successfully!")
        
        # 1. get docker ps
        print("Running: docker ps")
        stdin, stdout, stderr = ssh.exec_command("docker ps")
        docker_ps = stdout.read().decode('utf-8')
        print(docker_ps)
        
        # 2. Find evolution container name
        print("\nFinding evolution container...")
        stdin, stdout, stderr = ssh.exec_command("docker ps --format '{{.Names}}' | grep -i evolution")
        containers = stdout.read().decode('utf-8').strip().split('\n')
        print("Evolution containers found:", containers)
        
        for c in containers:
            if not c:
                continue
            
            # 3. Clean files inside the container
            print(f"\nAttempting to delete session files inside container: {c}")
            # Try both /app/instances/vendetta and /instances/vendetta
            cmd1 = f"docker exec -u root {c} rm -rf /app/instances/vendetta"
            print(f"Executing: {cmd1}")
            stdin, stdout, stderr = ssh.exec_command(cmd1)
            print("Stdout:", stdout.read().decode('utf-8'))
            print("Stderr:", stderr.read().decode('utf-8'))
            
            cmd2 = f"docker exec -u root {c} rm -rf /instances/vendetta"
            print(f"Executing: {cmd2}")
            stdin, stdout, stderr = ssh.exec_command(cmd2)
            print("Stdout:", stdout.read().decode('utf-8'))
            print("Stderr:", stderr.read().decode('utf-8'))
            
            # 4. Restart container
            print(f"\nRestarting container: {c}")
            cmd3 = f"docker restart {c}"
            stdin, stdout, stderr = ssh.exec_command(cmd3)
            print("Stdout:", stdout.read().decode('utf-8'))
            print("Stderr:", stderr.read().decode('utf-8'))
            
        print("Done!")
        
    except Exception as e:
        print(f"Error connecting or executing: {e}")
    finally:
        ssh.close()

if __name__ == '__main__':
    run_diagnostics()
