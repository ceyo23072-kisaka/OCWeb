from fastapi import FastAPI, Header, HTTPException, status
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import hmac
import hashlib
import secrets

app = FastAPI()

# ファイルパス
DATA_FILE = "data/slots.json"
os.makedirs("data", exist_ok=True)

# CORSの設定：フロントエンド（React/Next.js）からのアクセスを許可する
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://oc-web-oldz.vercel.app",
        "https://oc-web-4ddf.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 予約データの型定義
class Slot(BaseModel):
    id: int
    start_time: str
    is_booked: bool = False
    user_name: Optional[str] = None
    user_type: Optional[str] = None # Parent, Child, Both
    num_people: Optional[int] = None
    password: Optional[str] = Field(default=None, exclude=True)

# 11:00~15:00の10分刻みスロットを生成する関数
def generate_slots():
    slots = []
    current_time = datetime.strptime("11:00", "%H:%M")
    end_time = datetime.strptime("15:00", "%H:%M")
    
    slot_id = 1
    while current_time < end_time:
        slots.append(Slot(
            id=slot_id,
            start_time=current_time.strftime("%H:%M"),
            is_booked=False
        ))
        current_time += timedelta(minutes=10)
        slot_id += 1
    return slots

# データをJSONファイルに保存
def save_data(slots: List[Slot]):
    """スロットデータをJSONファイルに保存"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump([slot.model_dump() for slot in slots], f, ensure_ascii=False, indent=2)

# JSONファイルからデータを読み込む
def load_data() -> List[Slot]:
    """JSONファイルからスロットデータを読み込む"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return [Slot(**slot) for slot in data]
        except Exception as e:
            print(f"データ読み込みエラー: {e}")
            return generate_slots()
    return generate_slots()

# 管理者認証設定
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH")
DEFAULT_ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

if not ADMIN_PASSWORD_HASH:
    ADMIN_PASSWORD_HASH = hashlib.sha256(DEFAULT_ADMIN_PASSWORD.encode("utf-8")).hexdigest()

ADMIN_TOKEN_TTL = timedelta(minutes=30)
admin_tokens: dict[str, datetime] = {}

# サーバー起動時にスロットを読み込んで保持
temp_db = load_data()

@app.get("/slots")
def get_slots():
    """予約枠一覧をフロントエンドに返す"""
    return temp_db


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_admin_password(password: str) -> bool:
    hashed = hash_password(password)
    return hmac.compare_digest(hashed, ADMIN_PASSWORD_HASH)


def create_admin_token() -> str:
    token = secrets.token_urlsafe(32)
    admin_tokens[token] = datetime.utcnow() + ADMIN_TOKEN_TTL
    return token


def verify_admin_token(token: str) -> bool:
    expires = admin_tokens.get(token)
    if not expires:
        return False
    if datetime.utcnow() > expires:
        admin_tokens.pop(token, None)
        return False
    return True


def require_admin_auth(authorization: str | None = Header(None)) -> str:
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="管理者認証が必要です",
        )
    token = authorization.split(" ", 1)[1]
    if not verify_admin_token(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="管理者トークンが無効です",
        )
    return token


class AdminLoginRequest(BaseModel):
    password: str


@app.post("/admin/login")
def admin_login(request: AdminLoginRequest):
    if not verify_admin_password(request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="管理者パスワードが無効です",
        )
    token = create_admin_token()
    return {"success": True, "token": token, "expires_in": int(ADMIN_TOKEN_TTL.total_seconds())}

# 予約リクエスト用のデータ構造
class BookingRequest(BaseModel):
    slot_id: int
    user_name: str
    user_type: str
    num_people: int
    password: str

# 不適切なワードのリスト
INAPPROPRIATE_WORDS = ["テスト", "dummy", "admin", "fuck", "shit", "bitch", "damn"]

def is_meaningless_name(name: str) -> bool:
    """意味のない名前かどうかをチェック"""
    name = name.strip()
    
    # 長さが2文字以下
    if len(name) <= 2:
        return True
    
    # 数字のみ
    if name.isdigit():
        return True
    
    # 同じ文字の繰り返し（3文字以上）
    if len(set(name)) == 1 and len(name) >= 3:
        return True
    
    # 特定の意味のないパターン（例: abc, 123など）
    meaningless_patterns = ["abc", "123", "xyz", "aaa", "bbb", "ccc"]
    name_lower = name.lower()
    for pattern in meaningless_patterns:
        if pattern in name_lower:
            return True
    
    return False

@app.post("/book")
def book_slot(request: BookingRequest):
    """特定の枠を予約済みに更新する"""
    # 不適切なワードのチェック
    user_name_lower = request.user_name.lower()
    for word in INAPPROPRIATE_WORDS:
        if word.lower() in user_name_lower:
            return {"success": False, "message": "不適切な名前が含まれています"}
    
    # 意味のない名前のチェック
    if is_meaningless_name(request.user_name):
        return {"success": False, "message": "意味のない名前は使用できません"}
    
    for slot in temp_db:
        if slot.id == request.slot_id:
            if slot.is_booked:
                return {"success": False, "message": "すでに予約されています"}
            if not request.password:
                return {"success": False, "message": "パスワードを入力してください"}
            if request.num_people < 1 or request.num_people > 10:
                return {"success": False, "message": "人数は1～10人で入力してください"}
            slot.is_booked = True
            slot.user_name = request.user_name
            slot.user_type = request.user_type
            slot.num_people = request.num_people
            slot.password = request.password
            save_data(temp_db)  # データを保存
            return {"success": True, "message": "予約が完了しました"}
    return {"success": False, "message": "スロットが見つかりません"}

# 予約キャンセルリクエスト用のデータ構造
class CancelRequest(BaseModel):
    slot_id: int
    password: str

@app.post("/cancel")
def cancel_booking(request: CancelRequest):
    """特定の枠の予約をキャンセルする"""
    for slot in temp_db:
        if slot.id == request.slot_id:
            if not slot.is_booked:
                return {"success": False, "message": "このスロットは予約されていません"}
            if slot.password != request.password:
                return {"success": False, "message": "パスワードが違います"}
            slot.is_booked = False
            slot.user_name = None
            slot.user_type = None
            slot.num_people = None
            slot.password = None
            save_data(temp_db)  # データを保存
            return {"success": True, "message": "予約をキャンセルしました"}
    return {"success": False, "message": "スロットが見つかりません"}

# 管理者によるパスワード無視キャンセル用のデータ構造
class AdminCancelRequest(BaseModel):
    slot_id: int

@app.post("/admin/cancel")
def admin_cancel_booking(request: AdminCancelRequest, authorization: str | None = Header(None)):
    """管理者がパスワードなしで予約をキャンセルする"""
    require_admin_auth(authorization)
    for slot in temp_db:
        if slot.id == request.slot_id:
            if not slot.is_booked:
                return {"success": False, "message": "このスロットは予約されていません"}
            slot.is_booked = False
            slot.user_name = None
            slot.user_type = None
            slot.num_people = None
            slot.password = None
            save_data(temp_db)  # データを保存
            return {"success": True, "message": "管理者による予約キャンセルが完了しました"}
    return {"success": False, "message": "スロットが見つかりません"}

@app.get("/")
def read_root():
    return {"status": "Running", "message": "OC Reserve API is active"}

@app.head("/")
def head_root():
    return {"status": "Running", "message": "OC Reserve API is active"}
