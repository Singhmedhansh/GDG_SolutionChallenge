import requests
import base64

with open("public/demo_hiring.csv", "rb") as f:
    csv_bytes = f.read()
    b64 = base64.b64encode(csv_bytes).decode("utf-8")

payload = {
    "fileName": "demo_hiring.csv",
    "csvData": b64,
    "decisionColumn": "hired",
    "protectedAttributes": ["gender"]
}

res = requests.post("http://127.0.0.1:8000/api/analyze", json=payload)
print(res.status_code)
print(res.json())
