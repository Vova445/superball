import socketio
import asyncio
import time
from jose import jwt, JWTError
from app.core.config import settings
from app.core.security import ALGORITHM
from app.game.room import GameRoom

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,        # Вмикаємо логи
    engineio_logger=True # Логи нижнього рівня
)

active_rooms = {} # room_id -> GameRoom
user_sid_map = {} # user_id -> sid

async def authenticate_user(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        return user_id
    except JWTError as e:
        print(f"JWT Verification failed: {e}")
        return None

@sio.event
async def connect(sid, environ, auth=None):
    print(f"Connection attempt FROM {sid} with auth: {auth}")
    if auth is None or 'token' not in auth:
        print(f"Connection refused for {sid}: No token provided")
        return False
    
    token = auth.get('token')
    user_id = await authenticate_user(token)
    
    if user_id is None:
        print(f"Connection refused for {sid}: Invalid token")
        return False
    
    await sio.save_session(sid, {'user_id': user_id})
    user_sid_map[str(user_id)] = sid
    print(f"User {user_id} successfully connected with sid {sid}")

@sio.event
async def disconnect(sid):
    print(f"Sid {sid} disconnected")
    session = await sio.get_session(sid)
    if session:
        room = session.get('room')
        user_id = session.get('user_id')
        if user_id and str(user_id) in user_sid_map:
            del user_sid_map[str(user_id)]
        if room and room in active_rooms:
            game_room = active_rooms[room]
            game_room.remove_player(sid)
            await sio.emit('user_left', {'user_id': user_id}, room=room)
            if not game_room.players:
                game_room.is_running = False

@sio.event
async def join_room(sid, data):
    room = data.get('room')
    if room:
        await sio.enter_room(sid, room)
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        
        await sio.save_session(sid, {'user_id': user_id, 'room': room})
        
        # Initialize or join room
        if room not in active_rooms:
            game_room = GameRoom(room)
            active_rooms[room] = game_room
            
            async def broadcast_callback(state):
                state["timestamp"] = time.time() * 1000  # Server timestamp in ms
                await sio.emit('game_state', state, room=room)
                
            async def run_room():
                try:
                    await game_room.start(broadcast_callback)
                except Exception as e:
                    print(f"Error running game room {room}: {e}")
                finally:
                    if room in active_rooms:
                        del active_rooms[room]
                        
            asyncio.create_task(run_room())
            
        game_room = active_rooms[room]
        await game_room.add_player(sid, user_id=user_id)
        
        await sio.emit('user_joined', {'user_id': user_id, 'sid': sid}, room=room, skip_sid=sid)
        print(f"User {user_id} joined room {room}")

@sio.event
async def leave_room(sid, data):
    room = data.get('room')
    if room:
        await sio.leave_room(sid, room)
        session = await sio.get_session(sid)
        user_id = session.get('user_id')
        
        if room in active_rooms:
            game_room = active_rooms[room]
            game_room.remove_player(sid)
            if not game_room.players:
                game_room.is_running = False
                
        await sio.save_session(sid, {'user_id': user_id})
        await sio.emit('user_left', {'user_id': user_id}, room=room)
        print(f"User {user_id} left room {room}")

@sio.event
async def player_input(sid, data):
    session = await sio.get_session(sid)
    if session:
        room = session.get('room')
        if room and room in active_rooms:
            game_room = active_rooms[room]
            game_room.set_input(sid, data)

@sio.event
async def ball_hit(sid, data):
    session = await sio.get_session(sid)
    if session:
        room = session.get('room')
        if room and room in active_rooms:
            game_room = active_rooms[room]
            success = game_room.handle_ball_hit(sid, data)
            if success:
                state = game_room.get_state()
                state["tick"] = game_room.tick_count
                state["timestamp"] = time.time() * 1000  # Server timestamp in ms
                await sio.emit('game_state', state, room=room)

def get_sio_app(fastapi_app):
    return socketio.ASGIApp(sio, fastapi_app)
