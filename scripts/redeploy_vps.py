import paramiko
import sys

def redeploy():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        print("Connecting to VPS 66.29.152.229:2226 via SSH...")
        ssh.connect(
            hostname='66.29.152.229', 
            port=2226, 
            username='jose', 
            password='VuQmPgXP3EiDNSx1GHsR',
            look_for_keys=False,
            allow_agent=False,
            timeout=25
        )
        print("Connected successfully to VPS.")

        compose_path = "/etc/dokploy/compose/vendetta-prod-gcqoaf/code/docker-compose.yml"
        
        # 1. Pull latest image
        pull_cmd = f"docker compose -f {compose_path} pull"
        print(f"Running: {pull_cmd}")
        stdin, stdout, stderr = ssh.exec_command(pull_cmd)
        print(stdout.read().decode('utf-8', errors='ignore'))
        err = stderr.read().decode('utf-8', errors='ignore')
        if err:
            print("STDERR:", err)

        # 2. Recreate container
        up_cmd = f"docker compose -f {compose_path} up -d --force-recreate"
        print(f"Running: {up_cmd}")
        stdin, stdout, stderr = ssh.exec_command(up_cmd)
        print(stdout.read().decode('utf-8', errors='ignore'))
        err = stderr.read().decode('utf-8', errors='ignore')
        if err:
            print("STDERR:", err)

        # 3. Verify running container
        verify_cmd = "docker ps --filter name=vendetta --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'"
        print(f"Running: {verify_cmd}")
        stdin, stdout, stderr = ssh.exec_command(verify_cmd)
        print(stdout.read().decode('utf-8', errors='ignore'))

        print("VPS Redeployment finished successfully!")
    except Exception as e:
        print(f"Error during VPS redeploy: {e}")
        sys.exit(1)
    finally:
        ssh.close()

if __name__ == '__main__':
    redeploy()
