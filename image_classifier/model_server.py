
# model_server.py
import uvicorn

if __name__ == "__main__":
    # "api:app" means: import `app` object from api.py
    uvicorn.run("api:app", host="0.0.0.0", port=6000, reload=True)
