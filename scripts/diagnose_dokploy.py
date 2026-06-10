import os
import json
import urllib.request
import urllib.parse

def clean_secrets(obj):
    if isinstance(obj, dict):
        cleaned = {}
        for k, v in obj.items():
            k_lower = k.lower()
            if any(secret_word in k_lower for secret_word in ['token', 'key', 'password', 'secret', 'url', 'auth', 'database', 'env', 'variables']):
                cleaned[k] = "MASKED_BY_DIAGNOSTIC_SCRIPT"
            else:
                cleaned[k] = clean_secrets(v)
        return cleaned
    elif isinstance(obj, list):
        return [clean_secrets(item) for item in obj]
    else:
        return obj

def make_request(url, token):
    req = urllib.request.Request(
        url,
        headers={
            'x-api-key': token,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        }
    )
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error requesting {url}: {e}")
        return {"error": str(e)}

def main():
    dokploy_url = os.environ.get("DOKPLOY_URL")
    dokploy_token = os.environ.get("DOKPLOY_TOKEN")
    compose_id = os.environ.get("COMPOSE_ID")

    if not all([dokploy_url, dokploy_token, compose_id]):
        print("Missing required environment variables.")
        return

    print("Starting Dokploy VPS Diagnostics...")
    
    # 1. Query compose.one
    input_one = {"json": {"composeId": compose_id}}
    url_one = f"{dokploy_url}/api/trpc/compose.one?input={urllib.parse.quote(json.dumps(input_one))}"
    print("Querying compose.one...")
    compose_data = make_request(url_one, dokploy_token)
    
    # 2. Query deployment.allByType
    input_deployments = {"json": {"id": compose_id, "type": "compose"}}
    url_deployments = f"{dokploy_url}/api/trpc/deployment.allByType?input={urllib.parse.quote(json.dumps(input_deployments))}"
    print("Querying deployments...")
    deployments_data = make_request(url_deployments, dokploy_token)
    
    # Extract latest deployment
    latest_deployment = None
    deployment_logs = None
    try:
        deployments_list = deployments_data.get("result", {}).get("data", {}).get("json", [])
        if deployments_list and len(deployments_list) > 0:
            # Sort by date or id if necessary, usually it is returned sorted latest first
            latest_deployment = deployments_list[0]
            dep_id = latest_deployment.get("deploymentId")
            print(f"Latest deployment found: {dep_id} (Status: {latest_deployment.get('status')})")
            
            # 3. Query logs of latest deployment
            input_logs = {"json": {"deploymentId": dep_id}}
            url_logs = f"{dokploy_url}/api/trpc/deployment.readLogs?input={urllib.parse.quote(json.dumps(input_logs))}"
            print("Querying deployment logs...")
            deployment_logs = make_request(url_logs, dokploy_token)
    except Exception as e:
        print(f"Error parsing deployments: {e}")

    # Clean secrets from data
    clean_compose = clean_secrets(compose_data)
    clean_deployments = clean_secrets(deployments_data)
    clean_logs = clean_secrets(deployment_logs) if deployment_logs else None

    # Structure diagnostic report
    report = {
        "compose_status": clean_compose,
        "recent_deployments": clean_deployments,
        "latest_deployment_logs": clean_logs
    }

    with open("debug-vps-status.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print("Diagnostic report written to debug-vps-status.json successfully.")

if __name__ == "__main__":
    main()
