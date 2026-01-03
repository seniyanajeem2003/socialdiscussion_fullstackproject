from django.shortcuts import render, redirect
from django.contrib import messages
from django.core.paginator import Paginator
from django.http import Http404
from datetime import datetime, timedelta
from rest_framework.decorators import api_view, permission_classes,parser_classes
from rest_framework.response import Response
from django.http import JsonResponse
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import User, Community, Post, Comment, Chat, Message, Notification, Like, CommunityMembership, Report, TypingStatus
from .serializers import (UserSerializer, CommunitySerializer, PostSerializer,CommentSerializer, ChatSerializer, MessageSerializer, NotificationSerializer,CommunityMembershipSerializer)
from django.contrib.auth import authenticate,login
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_404_NOT_FOUND, HTTP_200_OK
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authtoken.models import Token
from django.contrib.contenttypes.models import ContentType
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.db.models import Count
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import logout
from django.contrib.auth import get_user_model
from django.db.models import Max
from django.utils import timezone
import os
from django.views.decorators.cache import never_cache
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, get_object_or_404
from django.contrib.auth import update_session_auth_hash


@never_cache
def admin_login(request):
    if request.user.is_authenticated:
        if request.user.is_admin:
            return redirect("admin_dashboard")
        else:
            messages.error(request, "Unauthorized access")
            return redirect("admin_login")

    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")

        if not email or not password:
            messages.error(request, "Email and password are required")
            return render(request, "admin_login.html")

        user = authenticate(request, email=email, password=password)

        if user is None:
            messages.error(request, "Invalid credentials")
            return render(request, "admin_login.html")

        if not user.is_admin:
            messages.error(request, "You are not an admin")
            return render(request, "admin_login.html")

        login(request, user)
        request.session['admin_logged_in'] = True  # optional flag
        return redirect("admin_dashboard")

    return render(request, "admin_login.html")




@login_required(login_url="admin_login")
def admin_home(request):
    # Admin access check (based on your model)
    if not request.user.is_admin:
        messages.error(request, "Access denied")
        return redirect("admin_login")

    context = {
        "total_users": User.objects.filter(is_active=True).count(),
        "total_communities": Community.objects.count(),
        "total_posts": Post.objects.count(),
        "total_comments": Comment.objects.count(),
        "total_reports": Report.objects.filter(resolved=False).count(),
    }

    return render(request, "dashboard.html", context) 




@never_cache
@login_required(login_url="admin_login")
def users_list(request):
    query = request.GET.get("q", "")
    page_number = request.GET.get("page", 1)
    
    # Exclude admin account
    users = User.objects.exclude(is_admin=True).order_by('id')
    
    if query:
        users = users.filter(Q(name__icontains=query) | Q(email__icontains=query))
    
    paginator = Paginator(users, 5)
    page_obj = paginator.get_page(page_number)

    # Calculate starting serial number for pagination
    sl_start = (page_obj.number - 1) * paginator.per_page

    # If AJAX request, return JSON
    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        data = []
        for idx, user in enumerate(page_obj, start=sl_start+1):
            data.append({
                "sl_no": idx,
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "status": "Active" if user.is_active else "Blocked"
            })
        return JsonResponse({
            "users": data,
            "current_page": page_obj.number,
            "num_pages": paginator.num_pages,
            "has_previous": page_obj.has_previous(),
            "has_next": page_obj.has_next(),
            "previous_page_number": page_obj.previous_page_number() if page_obj.has_previous() else None,
            "next_page_number": page_obj.next_page_number() if page_obj.has_next() else None,
        })

    # Normal GET request
    return render(request, "users_data.html", {
        "page_obj": page_obj,
        "query": query,
        "sl_start": sl_start,
    })




@never_cache
@login_required(login_url="admin_login")
def user_detail(request, user_id):
    user = get_object_or_404(User, id=user_id)

    # Handle status update
    action = request.GET.get("action")
    if action:
        if action == "ban":
            user.is_active = False
        elif action == "reactivate":
            user.is_active = True
        user.save()
        return redirect("user_detail", user_id=user_id)

    # Posts filtering
    query_post = request.GET.get("q_post", "")
    if query_post:
        user_posts = Post.objects.filter(
            postedby=user
        ).filter(
            Q(title__icontains=query_post) | Q(caption__icontains=query_post)
        )
    else:
        user_posts = Post.objects.filter(postedby=user)

    # Communities filtering
    query_com = request.GET.get("q_com", "")
    if query_com:
        user_communities = Community.objects.filter(
            members=user,
            name__icontains=query_com
        )
    else:
        user_communities = Community.objects.filter(members=user)

    # Pagination: 5 items per page
    per_page = 5

    post_paginator = Paginator(user_posts, per_page)
    page_number_post = request.GET.get("page_post")
    posts_page = post_paginator.get_page(page_number_post)
    post_sl_start = (posts_page.number - 1) * per_page  # starting serial number for posts

    com_paginator = Paginator(user_communities, per_page)
    page_number_com = request.GET.get("page_com")
    communities_page = com_paginator.get_page(page_number_com)
    com_sl_start = (communities_page.number - 1) * per_page  # starting serial number for communities

    return render(request, "user_individual.html", {
        "user": user,
        "posts_page": posts_page,
        "communities_page": communities_page,
        "q_post": query_post,
        "q_com": query_com,
        "post_sl_start": post_sl_start,
        "com_sl_start": com_sl_start,
    })





@login_required(login_url="admin_login")
def community_list(request):
    query = request.GET.get('q', '').strip()
    communities = Community.objects.all().order_by('-created_at')

    if query:
        communities = communities.filter(name__icontains=query) | communities.filter(description__icontains=query)

    paginator = Paginator(communities, 5)
    page_number = request.GET.get('page')
    communities_page = paginator.get_page(page_number)

    return render(request, "community_management.html", {
        "communities_page": communities_page,
        "query": query
    })


@login_required(login_url="admin_login")
def community_edit(request, community_id):
    community = get_object_or_404(Community, id=community_id)

    if request.method == "POST":
        name = request.POST.get("name", "").strip()
        description = request.POST.get("description", "").strip()
        
        if name:
            community.name = name
            community.description = description
            community.save()
            return JsonResponse({"success": True, "message": "Community updated successfully."})
        else:
            return JsonResponse({"success": False, "message": "Name cannot be empty."})
    else:
        # Return JSON data of the community
        data = {
            "id": community.id,
            "name": community.name,
            "description": community.description,
        }
        return JsonResponse(data)


@login_required(login_url="admin_login")
def community_delete(request, community_id):
    community = get_object_or_404(Community, id=community_id)

    if request.method == "POST":
        community.delete()
        return JsonResponse({"success": True, "message": "Community deleted successfully."})
    return JsonResponse({"success": False, "message": "Invalid request."})




@login_required(login_url="admin_login")
def community_detail(request, community_id):
    community = get_object_or_404(Community, id=community_id)

    # Search posts
    query = request.GET.get('q', '')
    posts = Post.objects.filter(community=community, status='active').order_by('-created_at')

    if query:
        posts = posts.filter(
            title__icontains=query
        ) | posts.filter(
            caption__icontains=query
        )

    # Pagination (5 posts per page)
    paginator = Paginator(posts, 5)
    page_number = request.GET.get('page')
    posts_page = paginator.get_page(page_number)

    return render(request, "community_posts.html", {
        "community": community,
        "posts_page": posts_page,
        "query": query
    })




User = get_user_model()
@login_required(login_url="admin_login")
def community_users(request, community_id):
    community = get_object_or_404(Community, id=community_id)

    users = community.members.all().order_by("id")

    query = request.GET.get("q", "")
    if query:
        users = users.filter(
            name__icontains=query
        ) | users.filter(
            email__icontains=query
        )

    paginator = Paginator(users, 5)
    page_number = request.GET.get("page")
    users_page = paginator.get_page(page_number)

    return render(request, "community_member.html", {
        "community": community,
        "users_page": users_page,
        "query": query
    })



@login_required(login_url="admin_login")
def post_management(request):
    query = request.GET.get("q", "")

    posts = Post.objects.select_related(
        "community", "postedby"
    ).order_by("-created_at")

    if query:
        posts = posts.filter(
            Q(community__name__icontains=query) |
            Q(postedby__name__icontains=query)
        )

    paginator = Paginator(posts, 10)
    page_number = request.GET.get("page")
    posts_page = paginator.get_page(page_number)

    return render(request, "post_management.html", {
        "posts_page": posts_page,
        "query": query,
    })



@login_required(login_url="admin_login")
def post_detail(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    comments = post.comments.all()  # Assuming related_name="comments"

    # Handle hide/unhide toggle
    if request.method == "POST" and "toggle_status" in request.POST:
        if post.status == "active":
            post.status = "hidden"
        else:
            post.status = "active"
        post.save()
        return redirect('post_detail', post_id=post.id)

    return render(request, "view_post.html", {
        "post": post,
        "comments": comments
    })




@never_cache
@login_required(login_url="admin_login")
def comment_management(request):
    
    if request.method == "POST":
        action = request.POST.get("action")
        comment_id = request.POST.get("comment_id")

        comment = get_object_or_404(Comment, id=comment_id)

        if action == "toggle":
            comment.is_visible = not comment.is_visible
            comment.save()

        elif action == "delete":
            comment.delete()

        return redirect("comment_management")

    query = request.GET.get("q", "")
    page_number = request.GET.get("page", 1)

    comments = Comment.objects.select_related(
        "user", "post"
    ).order_by("-created_at")

    if query:
        comments = comments.filter(
            Q(text__icontains=query) |
            Q(user__name__icontains=query) |
            Q(user__email__icontains=query)
        )

    paginator = Paginator(comments, 5)
    comments_page = paginator.get_page(page_number)

    return render(request, "comment_details.html", {
        "comments_page": comments_page,
        "query": query,
        "total_comments": paginator.count,
    })




@login_required(login_url="admin_login")
def reported_management(request):
   

    if request.method == "POST":
        action = request.POST.get("action")

        # 🔴 DELETE REPORTED CONTENT
        if action == "delete_content":
            report_id = request.POST.get("report_id")
            report = get_object_or_404(Report, id=report_id)

            model = report.content_type.model
            object_id = report.object_id

            if model == "post":
                Post.objects.filter(id=object_id).delete()
                messages.success(request, "Reported post deleted.")

            elif model == "comment":
                Comment.objects.filter(id=object_id).delete()
                messages.success(request, "Reported comment deleted.")

            report.delete()
            return redirect("reported_management")

        # 🔒 BLOCK USER
        elif action == "block_user":
            user_id = request.POST.get("user_id")
            user = get_object_or_404(User, id=user_id)
            user.is_active = False
            user.save()
            messages.success(request, f"{user.name} blocked.")
            return redirect("reported_management")

        # 🔓 UNBLOCK USER
        elif action == "unblock_user":
            user_id = request.POST.get("user_id")
            user = get_object_or_404(User, id=user_id)
            user.is_active = True
            user.save()
            messages.success(request, f"{user.name} unblocked.")
            return redirect("reported_management")

    content_query = request.GET.get("content_q", "")
    msg_query = request.GET.get("msg_q", "")

    content_page_num = request.GET.get("content_page", 1)
    msg_page_num = request.GET.get("msg_page", 1)

    # Reported Posts & Comments
    contents = Report.objects.select_related(
        "reported_by", "content_type"
    ).filter(
        content_type__model__in=["post", "comment"]
    )

    if content_query:
        contents = contents.filter(
            Q(reason__icontains=content_query) |
            Q(reported_by__name__icontains=content_query)
        )

    contents_paginator = Paginator(contents, 5)
    contents_page = contents_paginator.get_page(content_page_num)

    # Reported Messages
    messages_qs = Report.objects.select_related(
        "reported_by"
    ).filter(content_type__model="message")

    if msg_query:
        messages_qs = messages_qs.filter(
            Q(reason__icontains=msg_query) |
            Q(reported_by__name__icontains=msg_query)
        )

    messages_paginator = Paginator(messages_qs, 5)
    messages_page = messages_paginator.get_page(msg_page_num)

    return render(request, "reported_contents.html", {
        "contents_page": contents_page,
        "messages_page": messages_page,
        "total_contents": contents.count(),
        "total_messages": messages_qs.count(),
        "content_query": content_query,
        "msg_query": msg_query,
    })




@login_required(login_url="admin_login")
def admin_change_password(request):
   
    context = {}

    if request.method == "POST":
        current_password = request.POST.get("current_password")
        new_password = request.POST.get("new_password")
        confirm_password = request.POST.get("confirm_password")

        # Check if new password and confirm password match
        if new_password != confirm_password:
            context['error'] = "New password and confirm password do not match."
            return render(request, "admin_change_password.html", context)

        user = request.user

        # Check if current password is correct
        if not user.check_password(current_password):
            context['error'] = "Current password is incorrect."
            return render(request, "admin_change_password.html", context)

        # Update password
        user.set_password(new_password)
        user.save()

        # Keep the user logged in after password change
        update_session_auth_hash(request, user)

        context['success'] = "Password updated successfully!"
        return render(request, "change_password.html", context)

    # GET request
    return render(request, "change_password.html", context)


@login_required(login_url="admin_login")
def admin_logout(request):
    logout(request)
    return redirect('admin_login')  



def create_community(request):
    message = ""
    if request.method == "POST":
        # Get community data from POST
        community_name = request.POST.get("community_name")
        community_desc = request.POST.get("community_desc")
        add_post = request.POST.get("add_post_checkbox")
        post_caption = request.POST.get("post_caption") if add_post else None
        post_media = request.FILES.get("post_media") if add_post else None

        # Here, just create a dummy dict instead of saving to DB
        community = {
            "name": community_name,
            "description": community_desc,
            "thumbnail": request.FILES.get("thumbnail"),
        }

        post = None
        if add_post:
            post = {
                "caption": post_caption,
                "media": post_media,
                "community": community_name,
            }

        # You can pass them back to template to show confirmation
        message = "Community created successfully!"
        context = {
            "community": community,
            "post": post,
            "message": message,
        }
        return render(request, "admin_create_community.html", context)

    return render(request, "admin_post.html")



def admin_settings(request):
    # Dummy admin data
    admin_data = {
        "name": "Admin User",
        "email": "admin@example.com",
        "profile_pic": None, 
    }

    return render(request, "admin_settings_view.html", {"admin": admin_data})




#------------------API-----------------------------------------------------------------------------------#

@api_view(['POST'])
@permission_classes((AllowAny,))

def Signup(request):
        email  = request.data.get("email")
        password = request.data.get("password")
        name = request.data.get("name")
        if not name or not email or not password:
            return Response({'message':'All fields are required'}, status=400)
        if User.objects.filter(email=email).exists():
            return  JsonResponse({'message':'Email already exist'}, status=400)
        user = User.objects.create_user(email=email,password=password)
        user.name = name
        user.save()
        return JsonResponse({'message':'user created successsfully'} ,status = 200)

#---------------------------API -----------------------------------------------------------------------------#

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):
    email = request.data.get("email")
    password = request.data.get("password")
    
    if not email or not password:
        return Response({'error': 'Please provide both email and password'},
                        status=HTTP_400_BAD_REQUEST)
    
    user = authenticate(email=email, password=password)
    
    if not user:
        return Response({'error': 'Invalid credentials'},
                        status=HTTP_404_NOT_FOUND)
    
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key},status=HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def latest_posts(request):
    posts = Post.objects.filter(status='active').order_by('-created_at')[:20]
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def popular_posts(request):
    # Popular: posts in the last N days (default 14) ranked by a heuristic score
    days = int(request.GET.get('days', 14))
    cutoff = timezone.now() - timedelta(days=days)

    # annotate with names that do not conflict with model field names
    posts_qs = Post.objects.filter(status='active', created_at__gte=cutoff).annotate(
        likes_total=Count('likes', filter=Q(likes__type='like')),
        dislikes_total=Count('likes', filter=Q(likes__type='dislike')),
        comments_total=Count('comments')
    )

    scored = []
    for p in posts_qs:
        # use the annotated totals to compute the score
        likes = getattr(p, 'likes_total', 0) or 0
        comments = getattr(p, 'comments_total', 0) or 0
        dislikes = getattr(p, 'dislikes_total', 0) or 0
        score = likes + comments * 2 - dislikes
        # small boost for larger communities
        try:
            comm_members = p.community.members.count() if p.community else 0
            score += int(comm_members / 100)
        except Exception:
            comm_members = 0
        scored.append((p, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    posts_sorted = [p for p, s in scored]
    serializer = PostSerializer(posts_sorted, many=True)
    data = serializer.data
    # attach score for UI use
    for i, item in enumerate(data):
        item['popular_score'] = scored[i][1]
    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def trending_posts(request):
    # Trending: rapid engagement in recent hours (default 48h)
    hours = int(request.GET.get('hours', 48))
    cutoff = timezone.now() - timedelta(hours=hours)

    posts_qs = Post.objects.filter(status='active', created_at__gte=cutoff).annotate(
        likes_recent=Count('likes', filter=Q(likes__created_at__gte=cutoff, likes__type='like')),
        comments_recent=Count('comments', filter=Q(comments__created_at__gte=cutoff))
    )

    scored = []
    now = timezone.now()
    for p in posts_qs:
        hours_since = max(1.0, (now - p.created_at).total_seconds() / 3600.0)
        engagement = (getattr(p, 'likes_recent', 0) or 0) + (getattr(p, 'comments_recent', 0) or 0)
        score = engagement / hours_since
        scored.append((p, score, engagement, hours_since))

    scored.sort(key=lambda x: x[1], reverse=True)
    posts_sorted = [p for p, s, e, h in scored]
    serializer = PostSerializer(posts_sorted, many=True)
    data = serializer.data
    # attach trending details
    for i, item in enumerate(data):
        item['trending_score'] = scored[i][1]
        item['trending_engagement'] = scored[i][2]
        item['hours_since'] = scored[i][3]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def stream_posts(request):
    # Stream: chronological feed based on user's relationships
    user = request.user
    joined_communities = user.communities_joined.all()
    following_users = user.following.all()

    posts = Post.objects.filter(
        status='active'
    ).filter(
        Q(community__in=joined_communities) | Q(postedby__in=following_users)
    ).order_by('-created_at')[:100]

    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_post(request, post_id):
    user = request.user
    action = request.data.get('action')  # 'like' or 'dislike'
    if action not in ['like', 'dislike']:
        return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

    post = get_object_or_404(Post, id=post_id, status='active')

    opposite = 'dislike' if action == 'like' else 'like'

    removed_opposite = Like.objects.filter(user=user, post=post, type=opposite).delete()

    like_obj, created = Like.objects.get_or_create(user=user, post=post, type=action)
    if not created:
        like_obj.delete()
        message = f'{action} removed'
    else:
        message = f'{action} added'

    post.likes_count = Like.objects.filter(post=post, type='like').count()
    post.dislikes_count = Like.objects.filter(post=post, type='dislike').count()
    post.save()

    liked = Like.objects.filter(user=user, post=post, type='like').exists()
    disliked = Like.objects.filter(user=user, post=post, type='dislike').exists()

    return Response({
        'message': message,
        'likes_count': post.likes_count,
        'dislikes_count': post.dislikes_count,
        'liked': liked,
        'disliked': disliked
    })



@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_comment(request, post_id):
    user = request.user
    text = request.data.get('text', '').strip()
    parent_id = request.data.get('parent')

    if not text:
        return Response({'error': 'Comment text is required'}, status=status.HTTP_400_BAD_REQUEST)

    post = get_object_or_404(Post, id=post_id, status='active')

    parent_comment = None
    if parent_id:
        parent_comment = Comment.objects.filter(id=parent_id, post=post).first()
        if not parent_comment:
            return Response({'error': 'Parent comment not found'}, status=status.HTTP_404_NOT_FOUND)

    comment = Comment.objects.create(
        post=post,
        user=user,
        text=text,
        parent=parent_comment
    )

    post.comments_count = (post.comments_count or 0) + 1
    post.save()

    serializer = CommentSerializer(comment)
    return Response(serializer.data, status=status.HTTP_201_CREATED)



@csrf_exempt
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_post(request):
    caption = request.data.get("caption")
    media_file = request.FILES.get("media_file")
    media_type = "none"

    if media_file:
        if media_file.content_type:
            if media_file.content_type.startswith("image"):
                media_type = "image"
            elif media_file.content_type.startswith("video"):
                media_type = "video"
        else:
            ext = os.path.splitext(media_file.name)[1].lower()
            if ext in [".png", ".jpg", ".jpeg", ".gif", ".webp"]:
                media_type = "image"
            elif ext in [".mp4", ".mov", ".avi", ".mkv", ".webm"]:
                media_type = "video"

    # Get community if sent from frontend
    community_id = request.data.get("community")  # frontend sends "community"
    community = None
    if community_id:
        community = Community.objects.filter(id=community_id).first()

    # Create post
    post = Post.objects.create(
        caption=caption,
        media_file=media_file,
        media_type=media_type,
        community=community,  
        postedby=request.user
    )

    return Response({"message": "Post created", "post_id": post.id}, status=201)


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_community_with_post(request):
    community_serializer = CommunitySerializer(data=request.data)
    if community_serializer.is_valid():
        community = community_serializer.save(creater=request.user)
        # Add creator to members so owner is a member by default
        try:
            community.members.add(request.user)
        except Exception:
            pass

        create_post_flag = request.data.get('create_post', 'false').lower() == 'true'
        if create_post_flag:
            # Accept post file from different keys and auto-detect type
            post_file = request.FILES.get('post_media') or request.FILES.get('media_file') or None
            post_media_type = request.data.get('post_media_type')
            if post_file and not post_media_type:
                ctype = getattr(post_file, 'content_type', '')
                if ctype.startswith('image'):
                    post_media_type = 'image'
                elif ctype.startswith('video'):
                    post_media_type = 'video'
                else:
                    post_media_type = 'none'

            post_data = {
                'caption': request.data.get('post_caption', ''),
                'media_file': post_file,
                'media_type': post_media_type or 'none',
                'community': community.id,
                'title': request.data.get('post_title', 'First Post'),
            }
            post_serializer = PostSerializer(data=post_data)
            if post_serializer.is_valid():
                post_serializer.save(postedby=request.user)
            else:
                return Response({
                    'community': community_serializer.data,
                    'post_errors': post_serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'community': community_serializer.data,
            'message': 'Community created successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(community_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_community(request, community_id):
    try:
        community = Community.objects.get(id=community_id)
    except Community.DoesNotExist:
        return Response({'error': 'Community not found'}, status=404)

    serializer = CommunitySerializer(community)
    joined = False
    if request.user.is_authenticated:
        joined = community.members.filter(id=request.user.id).exists()

    return Response({
        'community': serializer.data,
        'joined': joined
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_community_membership(request, community_id):
    community = get_object_or_404(Community, id=community_id)
    
    if community.members.filter(id=request.user.id).exists():
        community.members.remove(request.user)
        CommunityMembership.objects.filter(user=request.user, community=community).delete()
        joined = False
        message = "Left community"
    else:
        community.members.add(request.user)
        CommunityMembership.objects.get_or_create(user=request.user, community=community)
        joined = True
        message = "Joined community"

    return Response({
        "message": message,
        "joined": joined
    }, status=status.HTTP_200_OK)



@api_view(['GET'])
@permission_classes([AllowAny])
def community_posts(request, community_id):
    posts = Post.objects.filter(
        community_id=community_id,
        status='active'
    ).order_by('-created_at')

    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def post_comments(request, post_id):
    comments = Comment.objects.filter(
        post_id=post_id,
        parent=None
    ).order_by('-created_at')

    serializer = CommentSerializer(comments, many=True)
    return Response(serializer.data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def discover_communities(request):
    search = request.GET.get('search', '')
    sort_by = request.GET.get('sort', 'members')

    communities = Community.objects.all()

    if search:
        communities = communities.filter(name__icontains=search)

    if sort_by == 'name':
        communities = communities.order_by('name')
    else:
        communities = communities.annotate(
            members_count=Count('members')
        ).order_by('-members_count')

    serializer = CommunitySerializer(communities, many=True)

    communities_data = serializer.data
    user_id = request.user.id
    for idx, community in enumerate(communities):
        joined = CommunityMembership.objects.filter(
            user_id=user_id, community_id=community.id
        ).exists()
        communities_data[idx]['joined'] = joined
        communities_data[idx]['members'] = community.members.count()

    return Response(communities_data)


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, chat_id):
    chat = get_object_or_404(Chat, id=chat_id, participants=request.user)

    text = request.data.get("text")
    media_url = request.data.get("media_url")

    if not text and not media_url:
        return Response({"error": "Message content required"}, status=400)

    message = Message.objects.create(
        chat=chat,
        sender=request.user,
        text=text,
        media_url=media_url
    )

    chat.save()  # updates updated_at

    serializer = MessageSerializer(message)
    return Response(serializer.data, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_chat(request, chat_id):
    chat = get_object_or_404(Chat, id=chat_id)

    reason = request.data.get("reason")
    date = request.data.get("date_reported")

    if not reason:
        return Response({"error": "Reason required"}, status=400)

    Report.objects.create(
        content_type=ContentType.objects.get_for_model(Chat),
        object_id=chat.id,
        reported_by=request.user,
        reported_by_name=request.user.name,
        reason=reason,
        date_reported=date
    )

    return Response({"message": "Chat reported successfully"})


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_post(request, post_id):
    reason = request.data.get('reason', 'No reason provided')
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    Report.objects.create(content_object=post, reported_by=request.user, reason=reason)
    return Response({'message': 'Post reported successfully'})


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_comment(request, comment_id):
    reason = request.data.get('reason', 'No reason provided')
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)

    Report.objects.create(content_object=comment, reported_by=request.user, reason=reason)
    return Response({'message': 'Comment reported successfully'})


@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_comment(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)

    if comment.user != request.user:
        return Response({'error': 'Not authorized to delete this comment'}, status=status.HTTP_403_FORBIDDEN)

    comment.delete()
    return Response({'message': 'Comment deleted successfully'})


@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)

    if post.postedby != request.user:
        return Response({'error': 'Not authorized to delete this post'}, status=status.HTTP_403_FORBIDDEN)

    post.delete()
    return Response({'message': 'Post deleted successfully'})


@api_view(['GET'])
@permission_classes([AllowAny])
def get_post_detail(request, post_id):
    try:
        post = Post.objects.get(id=post_id, status='active')
    except Post.DoesNotExist:
        return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = PostSerializer(post)
    
    liked = disliked = False
    if request.user.is_authenticated:
        liked = Like.objects.filter(user=request.user, post=post, type='like').exists()
        disliked = Like.objects.filter(user=request.user, post=post, type='dislike').exists()

    return Response({
        'post': serializer.data,
        'liked': liked,
        'disliked': disliked
    })



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    data = request.data

    serializer = UserSerializer(user, data=data, partial=True)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    password = data.get('password')
    if password:
        user.set_password(password)

    serializer.save()
    user.save()

    return Response(serializer.data, status=status.HTTP_200_OK)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def update_profile_picture(request):
    user = request.user
    file = request.FILES.get('profile_pic')

    if not file:
        return Response(
            {'error': 'Profile picture file is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.profile_pic = file
    user.save()

    serializer = UserSerializer(user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_report(request):
    user = request.user
    data = request.data
    content_type_str = data.get('content_type')
    object_id = data.get('object_id')
    reason = data.get('reason')

    if not content_type_str or not object_id or not reason:
        return Response(
            {"error": "content_type, object_id, and reason are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    model_map = {
        'post': Post,
        'comment': Comment,
        'message': Message,
    }

    model_class = model_map.get(content_type_str.lower())
    if not model_class:
        return Response({"error": "Invalid content_type."}, status=status.HTTP_400_BAD_REQUEST)

    content_object = get_object_or_404(model_class, id=object_id)

    content_type = ContentType.objects.get_for_model(model_class)

    report = Report.objects.create(
        content_type=content_type,
        object_id=content_object.id,
        content_object=content_object,
        reported_by=user,
        reported_by_name=user.name if hasattr(user, 'name') else user.email,
        reason=reason
    )

    return Response({
        "message": "Report submitted successfully.",
        "report_id": report.id
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_posts(request):
    posts = Post.objects.filter(
        postedby=request.user,
        status='active'
    ).order_by('-created_at')

    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recently_viewed_posts(request):
    posts = Post.objects.filter(
        views__user=request.user
    ).distinct().order_by('-views__created_at')[:20]

    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_created_communities(request):
    # Fixed field: Community model uses 'creater'
    communities = Community.objects.filter(
        creater=request.user
    ).order_by('-created_at')

    serializer = CommunitySerializer(communities, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_posts(request, user_id):
    """Return posts for the given user id (public)."""
    posts = Post.objects.filter(postedby__id=user_id, status='active').order_by('-created_at')
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_communities(request, user_id):
    """Return communities created by the given user id (public)."""
    communities = Community.objects.filter(creater__id=user_id).order_by('-created_at')
    serializer = CommunitySerializer(communities, many=True)
    return Response(serializer.data)


@csrf_exempt
@parser_classes([MultiPartParser, FormParser])
@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def edit_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    if post.postedby != request.user:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    # Make a mutable copy of incoming data so we can inject media_type when a file is uploaded
    data = request.data.copy() if hasattr(request, 'data') else {}

    # Accept file from multiple possible keys (frontend uses 'media' or 'media_file')
    file_obj = request.FILES.get('media') or request.FILES.get('media_file') or None

    # Auto-detect media type from uploaded file if not provided
    media_type = data.get('media_type')
    if file_obj:
        # ensure serializer sees the uploaded file under the expected field name
        if 'media_file' not in data:
            data['media_file'] = file_obj

    if file_obj and not media_type:
        ctype = getattr(file_obj, 'content_type', '')
        if ctype.startswith('image'):
            media_type = 'image'
        elif ctype.startswith('video'):
            media_type = 'video'
        else:
            # fallback to filename extension
            name = getattr(file_obj, 'name', '') or ''
            if any(name.lower().endswith(ext) for ext in ('.mp4', '.webm', '.ogg', '.mov', '.m4v')):
                media_type = 'video'
            else:
                media_type = 'none'
        data['media_type'] = media_type

    serializer = PostSerializer(post, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    # log serializer errors for easier debugging
    print('EDIT_POST_ERRORS', serializer.errors)
    return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)


@csrf_exempt
@parser_classes([MultiPartParser, FormParser])
@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def update_community(request, community_id):
    community = get_object_or_404(Community, id=community_id)
    # only creator can update
    if community.creater != request.user:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    serializer = CommunitySerializer(community, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_joined_communities(request):
    communities = Community.objects.filter(
        members=request.user
    ).order_by('-created_at')

    serializer = CommunitySerializer(communities, many=True)
    return Response(serializer.data)


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    logout(request)
    return Response({"message": "Logged out successfully"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request, user_id):
    user = get_object_or_404(User, id=user_id)

    return Response({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'bio': user.bio,
        'profile_pic': user.profile_pic.url if user.profile_pic else None,
        'followers_count': user.followers.count(),
        'following_count': user.following.count(),
    })


@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def follow_user(request, user_id):
    target = get_object_or_404(User, id=user_id)
    user = request.user

    if target == user:
        return Response(
            {'error': 'Cannot follow yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if request.method == 'GET':
        return Response({
            'following': user.following.filter(id=target.id).exists(),
            'followers_count': target.followers.count(),
            'following_count': target.following.count()
        })

    if user.following.filter(id=target.id).exists():
        user.following.remove(target)
        return Response({
            'following': False,
            'followers_count': target.followers.count(),
            'following_count': target.following.count()
        })

    user.following.add(target)
    return Response({
        'following': True,
        'followers_count': target.followers.count(),
        'following_count': target.following.count()
    })


@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def block_user(request, user_id):
    target = get_object_or_404(User, id=user_id)
    user = request.user

    if target == user:
        return Response(
            {'error': 'Cannot block yourself'},
            status=status.HTTP_400_BAD_REQUEST
        )


    if request.method == 'GET':
        return Response({
            'blocked': user.blocked_users.filter(id=target.id).exists()
        })

    if user.blocked_users.filter(id=target.id).exists():
        user.blocked_users.remove(target)
        return Response({'blocked': False})

    user.blocked_users.add(target)
    user.following.remove(target)
    target.following.remove(user)

    return Response({'blocked': True})



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_dashboard_full(request):
    user = request.user

    # User info
    user_data = {
        "id": user.id,
        "name": user.name,
        "bio": user.bio,
        "profile_pic": user.profile_pic.url if user.profile_pic else None,
        "followers_count": user.followers.count(),
        "following_count": user.following.count(),
    }

    # My posts
    posts = Post.objects.filter(postedby=user, status='active').order_by('-created_at')

    # Created communities
    created_communities = Community.objects.filter(creater=user).order_by('-created_at')

    # Joined communities (excluding created by user)
    joined_communities = Community.objects.filter(members=user).exclude(creater=user).order_by('-created_at')

    return Response({
        "user": user_data,
        "posts": PostSerializer(posts, many=True).data,
        "created_communities": CommunitySerializer(created_communities, many=True).data,
        "joined_communities": CommunitySerializer(joined_communities, many=True).data,
        # "recently_viewed_posts": [],  <-- removed
    })


@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    old = request.data.get('old_password') or request.data.get('oldPassword') or request.data.get('old')
    new = request.data.get('new_password') or request.data.get('newPassword') or request.data.get('new')

    if not old or not new:
        return Response({'error': 'Both old and new passwords are required'}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(old):
        return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new)
    user.save()
    return Response({'message': 'Password changed successfully'})


User = get_user_model()

@csrf_exempt
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def chats_view(request):
    """
    GET  -> List all chats of logged-in user
    POST -> Create or get chat with another user
    """

    # -----------------------------
    # GET: List chats
    # -----------------------------
    if request.method == 'GET':
        chats = (
            Chat.objects
            .filter(participants=request.user)
            .annotate(last_time=Max('messages__created_at'))
            .order_by('-last_time', '-updated_at')
        )

        serialized = ChatSerializer(chats, many=True).data
        # add unread_count for each chat (messages not read and not sent by current user)
        for idx, chat in enumerate(chats):
            unread = Message.objects.filter(chat=chat, is_read=False).exclude(sender=request.user).count()
            serialized[idx]['unread_count'] = unread
        return Response(serialized)

    # -----------------------------
    # POST: Create or get chat
    # -----------------------------
    if request.method == 'POST':
        user_id = request.data.get("user_id")

        if not user_id:
            return Response({"error": "user_id is required"}, status=400)

        other_user = get_object_or_404(User, id=user_id)

        if other_user == request.user:
            return Response({"error": "Cannot chat with yourself"}, status=400)

        chat = (
            Chat.objects
            .filter(participants=request.user)
            .filter(participants=other_user)
            .first()
        )

        if not chat:
            chat = Chat.objects.create()
            chat.participants.add(request.user, other_user)

        return Response({
            "chat_id": chat.id
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, chat_id):
    chat = get_object_or_404(Chat, id=chat_id, participants=request.user)

    messages = Message.objects.filter(chat=chat).order_by('created_at')
    serializer = MessageSerializer(messages, many=True)

    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_message(request, message_id):
    try:
        message = Message.objects.get(id=message_id)
    except Message.DoesNotExist:
        return Response({'error': 'Message not found'}, status=404)

    # Allow sender to delete their message
    if message.sender != request.user:
        return Response({'error': 'Not allowed'}, status=403)

    # Soft delete
    message.text = None
    message.media_url = None
    message.deleted = True
    message.save()

    return Response({'message': 'deleted'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_chat(request, chat_id):
    chat = get_object_or_404(Chat, id=chat_id)
    if not chat.participants.filter(id=request.user.id).exists():
        return Response({'error': 'Not allowed'}, status=403)

    # Remove user from chat participants
    chat.participants.remove(request.user)

    # If chat has no participants left, delete it
    if chat.participants.count() == 0:
        chat.delete()

    return Response({'message': 'Chat removed for user'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def typing_status_view(request, chat_id):
    # POST request to set/unset typing indicator
    chat = get_object_or_404(Chat, id=chat_id, participants=request.user)
    active = request.data.get('active', True)

    if active:
        TypingStatus.objects.update_or_create(chat=chat, user=request.user, defaults={'last_seen': timezone.now()})
        return Response({'status': 'ok'})
    else:
        TypingStatus.objects.filter(chat=chat, user=request.user).delete()
        return Response({'status': 'ok'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_typing_status(request, chat_id):
    chat = get_object_or_404(Chat, id=chat_id, participants=request.user)
    cutoff = timezone.now() - timezone.timedelta(seconds=5)
    typing = TypingStatus.objects.filter(chat=chat, last_seen__gte=cutoff).exclude(user=request.user)
    users = [ts.user.id for ts in typing]
    return Response({'typing_users': users})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_read(request, chat_id):
    """Mark all messages in the chat as read for the requesting user (i.e., messages not sent by them)."""
    chat = get_object_or_404(Chat, id=chat_id, participants=request.user)
    updated = Message.objects.filter(chat=chat, is_read=False).exclude(sender=request.user).update(is_read=True)
    return Response({'marked': updated}, status=200)


