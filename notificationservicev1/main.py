from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from services import db as db_services
from routes.realtimenotificationservice import router as notification_router
from routes.notificationserviceroutes import router as notification_service_router
from tst.notifytst import router as tst_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(notification_router, prefix="/notification/api/v1")
app.include_router(notification_service_router, prefix="/notification/ctrl/api/v1")
app.include_router(tst_router, prefix="/nftst")

@app.on_event("startup")
async def initprocedures():
    await db_services.ping_database()
