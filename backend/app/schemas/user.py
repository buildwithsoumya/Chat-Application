from pydantic import BaseModel
from pydantic import EmailStr
from pydantic import Field
from typing import Optional


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    bio: Optional[str] = Field(default=None, max_length=200)
    avatar: Optional[str] = Field(default=None)


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    avatar: Optional[str] = None
    bio: Optional[str] = None

    model_config = {"from_attributes": True}


class UserSearchResult(BaseModel):
    id: str
    username: str
    avatar: Optional[str] = None

    model_config = {"from_attributes": True, "coerce_numbers_to_str": True}
