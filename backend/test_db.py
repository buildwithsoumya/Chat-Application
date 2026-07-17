from sqlalchemy import create_engine
from app.core.config import settings
engine = create_engine(settings.DATABASE_URL)
try:
    with engine.connect() as conn:
        print("Connected to SupaBase successfully!")
except Exception as e:
    print("Connection failed:")
    print(e)