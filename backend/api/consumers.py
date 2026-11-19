import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
import requests
from asgiref.sync import sync_to_async

class GitHubConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.username = self.scope['url_route']['kwargs']['username']
        self.room_group_name = f'github_{self.username}'
        self.is_connected = True

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        # Start background task to send updates
        self.update_task = asyncio.create_task(self.send_periodic_updates())

    async def disconnect(self, close_code):
        self.is_connected = False
        if hasattr(self, 'update_task'):
            self.update_task.cancel()
        
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json.get('message', '')
        
        await self.send(text_data=json.dumps({
            'type': 'ping',
            'message': f'Pong! Server received: {message}'
        }))

    async def send_periodic_updates(self):
        """
        Periodically fetches the latest data and sends it to the client.
        Runs every 30 seconds to simulate a real-time dashboard.
        """
        while self.is_connected:
            await asyncio.sleep(30)
            
            # Fetch fresh data from GitHub
            data = await self.fetch_latest_profile()
            
            if data and self.is_connected:
                await self.send(text_data=json.dumps({
                    'type': 'update',
                    'data': data,
                    'timestamp': asyncio.get_event_loop().time()
                }))

    @sync_to_async
    def fetch_latest_profile(self):
        headers = {
            "User-Agent": "Dev-Analytics-Dashboard",
            "Accept": "application/vnd.github.v3+json"
        }
        try:
            response = requests.get(
                f"https://api.github.com/users/{self.username}", 
                headers=headers, 
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                return {
                    "public_repos": data.get("public_repos"),
                    "followers": data.get("followers"),
                    "following": data.get("following"),
                }
        except requests.exceptions.RequestException:
            pass
        return None
    