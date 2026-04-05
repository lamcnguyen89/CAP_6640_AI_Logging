#!/usr/bin/env python3
import subprocess
import hashlib
import hmac
from flask import Flask, request

app = Flask(__name__)

def verify_signature(payload_body, secret_token, signature_header):
    """Verify that the payload was sent from GitHub by validating SHA256.

    Raise and return 403 if not authorized.

    Args:
        payload_body: original request body to verify (request.body())
        secret_token: GitHub app webhook token (WEBHOOK_SECRET)
        signature_header: header received from GitHub (x-hub-signature-256)
    """
    if not signature_header:
        raise HTTPException(status_code=403, detail="x-hub-signature-256 header is missing!")
    hash_object = hmac.new(secret_token.encode('utf-8'), msg=payload_body, digestmod=hashlib.sha256)
    expected_signature = "sha256=" + hash_object.hexdigest()
    if not hmac.compare_digest(expected_signature, signature_header):
        raise HTTPException(status_code=403, detail="Request signatures didn't match!")

@app.route('/vera-portal/deploy', methods=['POST'])
def handle_github_webhook():
    # Simple check can be added here to verify headers, etc.
    # Verify signature
    payload_body = request.get_data()
    # Get secret from environment variable
    secret_token = os.getenv("WEBHOOK_SECRET")
    signature_header = request.headers.get('x-hub-signature-256')
    verify_signature(payload_body, secret_token, signature_header)
    # pull the latest changes from the repository production branch
    
    subprocess.call(["/bin/bash", "/home/ad/jo284142admin/sherlock/scripts/deploy.sh"])
    return 'OK', 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)