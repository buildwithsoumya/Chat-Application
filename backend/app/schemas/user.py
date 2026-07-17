from pydantic import BaseModel
from pydantic import EmailStr
from pydantic import Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

    model_config = {"from_attributes": True}


class UserSearchResult(BaseModel):
    id: int
    username: str

    model_config = {"from_attributes": True}