from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from api.models import User, Place, Review


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['phone_number', 'name', 'password', 'password_confirm']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match'})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(
            phone_number=validated_data['phone_number'],
            name=validated_data['name'],
            password=validated_data['password']
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        phone = attrs.get('phone_number')
        pwd = attrs.get('password')
        
        if phone and pwd:
            user = authenticate(request=self.context.get('request'), username=phone, password=pwd)
            
            if not user:
                raise serializers.ValidationError('Invalid phone number or password')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
        else:
            raise serializers.ValidationError('Must include phone_number and password')
        
        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'phone_number', 'name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class PlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = ['id', 'name', 'address', 'average_rating', 'created_at']
        read_only_fields = ['id', 'average_rating', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    place_name = serializers.CharField(write_only=True, required=True)
    place_address = serializers.CharField(write_only=True, required=True)
    user = UserSerializer(read_only=True)
    place = PlaceSerializer(read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'place_name', 'place_address', 'rating', 'text', 'user', 'place', 'user_name', 'created_at']
        read_only_fields = ['id', 'user', 'place', 'user_name', 'created_at']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5')
        return value
    
    def validate_place_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Place name cannot be empty')
        return value.strip()
    
    def validate_place_address(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Place address cannot be empty')
        return value.strip()
    
    def validate_text(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Review text cannot be empty')
        return value.strip()


class PlaceSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = ['id', 'name', 'address', 'average_rating']
        read_only_fields = ['id', 'average_rating']


class ReviewDetailSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'user_name', 'rating', 'text', 'created_at']
        read_only_fields = ['id', 'user_name', 'rating', 'text', 'created_at']


class PlaceDetailSerializer(serializers.ModelSerializer):
    reviews = serializers.SerializerMethodField()
    
    class Meta:
        model = Place
        fields = ['id', 'name', 'address', 'average_rating', 'reviews']
        read_only_fields = ['id', 'average_rating']
    
    def get_reviews(self, obj):
        req = self.context.get('request')
        user = req.user if req else None
        
        all_reviews = obj.reviews.select_related('user').all()
        
        if user and user.is_authenticated:
            my_reviews = [r for r in all_reviews if r.user == user]
            other_reviews = [r for r in all_reviews if r.user != user]
            other_reviews = sorted(other_reviews, key=lambda r: r.created_at, reverse=True)
            sorted_reviews = my_reviews + other_reviews
        else:
            sorted_reviews = sorted(all_reviews, key=lambda r: r.created_at, reverse=True)
        
        return ReviewDetailSerializer(sorted_reviews, many=True).data
