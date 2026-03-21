from pydantic import BaseModel


class UserSettingsResponse(BaseModel):
    theme: str
    notif_price_alerts: bool
    notif_dividends: bool
    notif_sync: bool
    notif_maturity: bool

    model_config = {"from_attributes": True}


class UserSettingsUpdate(BaseModel):
    theme: str | None = None
    notif_price_alerts: bool | None = None
    notif_dividends: bool | None = None
    notif_sync: bool | None = None
    notif_maturity: bool | None = None
