from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from api.views import *

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('reviews/', ReviewCreateView.as_view(), name='review-create'),
    path('places/search/', PlaceSearchView.as_view(), name='place-search'),
    path('places/<int:pk>/', PlaceDetailView.as_view(), name='place-detail'),
]
