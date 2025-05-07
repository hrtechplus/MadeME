from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from services import db as db_service
from routes.deliverydriverauthroutes import router as deliverydriverauthrouter
from routes.deliverydriverserviceroutes import router as deliverydriverservicerouter
from services.realtimedriverlocationservice import router as deliverydrivertrackingrouter


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(deliverydriverauthrouter, prefix="/deliverydriver/api/v1")
app.include_router(deliverydriverservicerouter, prefix="/deliverydriver/api/v1")
app.include_router(deliverydrivertrackingrouter, prefix="/deliverydriver/api/v1")

@app.on_event("startup")
async def initprocedures():
    await db_service.ping_database()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}
