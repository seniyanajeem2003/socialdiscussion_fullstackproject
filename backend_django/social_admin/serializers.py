from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType
from .models import (
    User, Community, CommunityMembership, Post,
    Comment, Like, Report, Chat, Message, Notification
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'bio', 'profile_pic', 'created_at']


class CommunitySerializer(serializers.ModelSerializer):
    creater = UserSerializer(read_only=True)
    members_count = serializers.IntegerField(source='members.count', read_only=True)

    class Meta:
        model = Community
        fields = ['id', 'name', 'description', 'thumbnail', 'creater', 'members_count', 'created_at']


class CommunityMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CommunityMembership
        fields = ['id', 'user', 'community', 'role', 'joined_at']


class PostSerializer(serializers.ModelSerializer):
    postedby = UserSerializer(read_only=True)
    community_name = serializers.CharField(source='community.name', read_only=True)
    dislikes_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'title', 'caption', 'media_file', 'media_type', 'community', 'community_name',
                  'postedby', 'likes_count', 'dislikes_count', 'comments_count', 'status', 'created_at']
        extra_kwargs = {
            'community': {'required': False, 'allow_null': True},
            'title': {'required': False},
            'caption': {'required': False},
            'media_file': {'required': False, 'allow_null': True},
        }

    def get_dislikes_count(self, obj):
        # If view has annotated or set attribute, use it; otherwise default to 0
        return getattr(obj, 'dislikes_count', 0)
        
class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'user', 'text', 'parent', 'replies', 'created_at']

    def get_replies(self, obj):
        return CommentSerializer(obj.replies.all(), many=True).data


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'user', 'post', 'type', 'created_at']


class ReportSerializer(serializers.ModelSerializer):
    reported_by = UserSerializer(read_only=True)
    content_type_name = serializers.CharField(source='content_type.model', read_only=True)

    class Meta:
        model = Report
        fields = ['id', 'content_type', 'content_type_name', 'object_id',
                  'reported_by', 'reported_by_name', 'reason', 'resolved', 'created_at']


class ChatSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = ['id', 'title', 'participants', 'last_message', 'created_at']

    def get_last_message(self, obj):
        msg = obj.messages.last()
        return MessageSerializer(msg).data if msg else None


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'chat', 'sender', 'text', 'media_url', 'is_read', 'deleted', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)
    target_type = serializers.CharField(source='content_type.model', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'actor', 'verb', 'unread', 'target_type', 'object_id', 'created_at']
