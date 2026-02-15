from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import market, agent, indicators, fundamentals, news, portfolio

app = FastAPI(title="Stock Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(market.router, prefix="/api")
app.include_router(agent.router, prefix="/api")
app.include_router(indicators.router, prefix="/api")
app.include_router(fundamentals.router, prefix="/api")
app.include_router(news.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
