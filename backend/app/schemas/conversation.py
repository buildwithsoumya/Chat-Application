from pydantic import BaseModel


class ConversationCreate(BaseModel):
    name: str | None = None
    is_group: bool = False


class ConversationResponse(BaseModel):
    id: int
    name: str | None
    is_group: bool
    created_by: int
    model_config = {
        "from_attributes": True
    }


class ConversationListResponse(BaseModel):
    id: int
    name: str | None
    is_group: bool
    created_by: int

    model_config = {
        "from_attributes": True
    }


class ConversationMemberAdd(BaseModel):
    user_id: int


class ConversationMemberResponse(BaseModel):
    id: int
    username: str
    email: str

    model_config = {
        "from_attributes": True
    }
