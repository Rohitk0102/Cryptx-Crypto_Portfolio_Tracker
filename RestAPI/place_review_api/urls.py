from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def home(request):
    return HttpResponse("""
    <h1>Place Review API</h1>
    <p>API Documentation: <a href="/api/schema/swagger-ui/">Swagger UI</a></p>
    <p>Endpoints:</p>
    <ul>
        <li>POST /api/auth/register/ - Register</li>
        <li>POST /api/auth/login/ - Login</li>
        <li>POST /api/reviews/ - Create review</li>
        <li>GET /api/places/search/ - Search places</li>
        <li>GET /api/places/{id}/ - Place details</li>
    </ul>
    """)


urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
