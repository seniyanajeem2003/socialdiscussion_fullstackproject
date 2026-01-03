from django.db import migrations, models
import django.db.models.deletion
from django.contrib.contenttypes.models import ContentType


def forwards(apps, schema_editor):
    Like = apps.get_model('social_admin', 'Like')
    Post = apps.get_model('social_admin', 'Post')
    ContentTypeModel = apps.get_model('contenttypes', 'ContentType')

    # Attempt to populate post FK for existing records that point to Post content type
    try:
        post_ct = ContentTypeModel.objects.get(app_label='social_admin', model='post')
    except ContentTypeModel.DoesNotExist:
        return

    for like in Like.objects.all():
        if like.content_type_id == post_ct.id and like.object_id:
            try:
                post = Post.objects.get(id=like.object_id)
                like.post_id = post.id
                # infer type as 'like' by default (historical)
                if not getattr(like, 'type', None):
                    like.type = 'like'
                like.save()
            except Post.DoesNotExist:
                continue


def backwards(apps, schema_editor):
    # Nothing to undo for data migration
    return


class Migration(migrations.Migration):

    dependencies = [
        ('social_admin', '0007_alter_post_caption_alter_post_title'),
    ]

    operations = [
        migrations.AddField(
            model_name='like',
            name='post',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='likes', to='social_admin.post'),
        ),
        migrations.AddField(
            model_name='like',
            name='type',
            field=models.CharField(default='like', max_length=10, choices=[('like', 'Like'), ('dislike', 'Dislike')]),
            preserve_default=False,
        ),
        migrations.RunPython(forwards, backwards),
    ]
