from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/github/<str:username>/', consumers.GitHubConsumer.as_asgi()),
]
