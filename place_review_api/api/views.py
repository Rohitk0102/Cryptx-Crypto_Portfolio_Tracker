from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models.functions import Lower
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from api.serializers import *
from api.models import Place


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'User registered successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Login successful',
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': UserSerializer(user).data
        })


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        place_name = serializer.validated_data.pop('place_name')
        place_address = serializer.validated_data.pop('place_address')
        
        # find or create place
        place = Place.objects.annotate(
            lower_name=Lower('name'),
            lower_address=Lower('address')
        ).filter(
            lower_name=place_name.lower(),
            lower_address=place_address.lower()
        ).first()
        
        if not place:
            place = Place.objects.create(name=place_name, address=place_address)
        
        review = serializer.save(user=request.user, place=place)
        
        return Response(
            ReviewSerializer(review).data,
            status=status.HTTP_201_CREATED
        )


class PlaceSearchView(generics.ListAPIView):
    serializer_class = PlaceSearchSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        qs = Place.objects.all()
        name = self.request.query_params.get('name')
        min_rating = self.request.query_params.get('min_rating')
        
        if min_rating:
            try:
                qs = qs.filter(average_rating__gte=float(min_rating))
            except:
                pass
        
        if name:
            term = name.strip().lower()
            
            exact = qs.annotate(lower_name=Lower('name')).filter(lower_name=term)
            partial = qs.annotate(lower_name=Lower('name')).filter(
                lower_name__icontains=term
            ).exclude(lower_name=term)
            
            combined = exact.union(partial)
            ids = [p.id for p in combined]
            qs = Place.objects.filter(id__in=ids)
            
            # sort exact first
            qs = sorted(qs, key=lambda p: (p.name.lower() != term, p.name.lower()))
            return qs
        
        return qs.order_by('name')


class PlaceDetailView(generics.RetrieveAPIView):
    serializer_class = PlaceDetailSerializer
    permission_classes = [IsAuthenticated]
    queryset = Place.objects.prefetch_related('reviews__user').all()
    
    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx
